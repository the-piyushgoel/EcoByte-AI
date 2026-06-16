const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AnalysisSession = require('../models/AnalysisSession');
const DuplicateGroup = require('../models/DuplicateGroup');
const { computeFileSHA256 } = require('../utils/hashUtil');
const {
  bytesToMB,
  bytesToGB,
  isInactiveFile,
  classifyFile,
  extractFileMetadata,
} = require('../utils/fileUtil');
const { detectDuplicates } = require('./duplicateService');
const { computeWasteScore } = require('./wasteScoreService');
const { computeCarbonImpact } = require('./carbonService');
const { generateRecommendations } = require('./recommendationService');
const { predictForFiles } = require('./aiService');
const buildSummary = (files) => {
  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((s, f) => s + (f.sizeBytes || 0), 0);
  const duplicateCount = files.filter((f) => f.isDuplicate).length;
  const inactiveCount = files.filter((f) => f.isInactive).length;
  const activeCount = files.filter((f) => f.classification === 'active').length;
  const archiveCount = files.filter((f) => f.classification === 'archive').length;
  const wasteCount = files.filter((f) => f.classification === 'waste').length;
  const uniqueExtensions = [...new Set(files.map((f) => f.extension).filter(Boolean))];
  const largestFileBytes = Math.max(...files.map((f) => f.sizeBytes || 0), 0);
  const averageFileSizeBytes = totalFiles > 0 ? Math.round(totalSizeBytes / totalFiles) : 0;
  return {
    totalFiles,
    totalSizeBytes,
    totalSizeMB: bytesToMB(totalSizeBytes),
    totalSizeGB: bytesToGB(totalSizeBytes),
    duplicateCount,
    inactiveCount,
    activeCount,
    archiveCount,
    wasteCount,
    uniqueExtensions,
    largestFileBytes,
    averageFileSizeBytes,
  };
};
const buildStorageRecovery = (files) => {
  const duplicateFiles = files.filter((f) => f.isDuplicate);
  const inactiveFiles = files.filter((f) => f.isInactive && !f.isDuplicate); // avoid double-count
  const duplicateSizeBytes = duplicateFiles.reduce((s, f) => s + (f.sizeBytes || 0), 0);
  const inactiveSizeBytes = inactiveFiles.reduce((s, f) => s + (f.sizeBytes || 0), 0);
  const totalRecoverableBytes = duplicateSizeBytes + inactiveSizeBytes;
  return {
    duplicateSizeBytes,
    duplicateSizeMB: bytesToMB(duplicateSizeBytes),
    duplicateSizeGB: bytesToGB(duplicateSizeBytes),
    inactiveSizeBytes,
    inactiveSizeMB: bytesToMB(inactiveSizeBytes),
    inactiveSizeGB: bytesToGB(inactiveSizeBytes),
    totalRecoverableBytes,
    totalRecoverableMB: bytesToMB(totalRecoverableBytes),
    totalRecoverableGB: bytesToGB(totalRecoverableBytes),
  };
};
/**
 * Run the full analysis pipeline.
 * @param {Array<object>} multerFiles  - Files from req.files (multer)
 * @param {object}        clientMetas  - Map of originalname -> client-supplied metadata
 * @param {string}        sessionName  - Human-readable session name
 * @returns {Promise<object>}          - Saved AnalysisSession document
 */
const runAnalysisPipeline = async (multerFiles, clientMetas = {}, sessionName = '') => {
  const sessionId = uuidv4();
  let session = new AnalysisSession({
    sessionId,
    sessionName: sessionName || `Analysis – ${new Date().toLocaleString()}`,
    status: 'processing',
  });
  await session.save();
  try {
    const enrichedFiles = await Promise.all(
      multerFiles.map(async (mFile) => {
        const clientMeta = clientMetas[mFile.originalname] || {};
        const meta = extractFileMetadata(mFile, clientMeta);
        let sha256Hash = null;
        try {
          sha256Hash = await computeFileSHA256(mFile.path);
        } catch (hashErr) {
          console.warn(`[analysisService] Could not hash ${mFile.originalname}:`, hashErr.message);
        }
        return {
          ...meta,
          sha256Hash,
          isDuplicate: false,
          isInactive: false,
          classification: 'active',
          duplicateGroupId: null,
        };
      })
    );
    const { files: filesWithDuplicates, duplicateGroups } = detectDuplicates(enrichedFiles);
    filesWithDuplicates.forEach((f) => {
      f.isInactive = isInactiveFile(f.modifiedAt);
    });
    filesWithDuplicates.forEach((f) => {
      f.classification = classifyFile({
        isDuplicate: f.isDuplicate,
        isInactive: f.isInactive,
        modifiedAt: f.modifiedAt,
      });
    });
    const summary = buildSummary(filesWithDuplicates);
    const storageRecovery = buildStorageRecovery(filesWithDuplicates);
    const wasteScore = computeWasteScore(filesWithDuplicates);
    const carbonImpact = computeCarbonImpact(filesWithDuplicates);
    const recommendations = generateRecommendations({
      files: filesWithDuplicates,
      duplicateGroups,
      storageRecovery,
      carbonImpact,
      wasteScore,
    });
    let aiAnalysis = null;
    try {
      const predictions = await predictForFiles(filesWithDuplicates);
      predictions.forEach((pred, i) => {
        if (pred) {
          filesWithDuplicates[i].aiPrediction = pred;
        }
      });
      const validPreds = predictions.filter(Boolean);
      if (validPreds.length > 0) {
        const avgScore = validPreds.reduce((s, p) => s + p.digitalWasteScore, 0) / validPreds.length;
        const riskCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        validPreds.forEach((p) => { riskCounts[p.risk] = (riskCounts[p.risk] || 0) + 1; });
        aiAnalysis = {
          averageWasteScore: Math.round(avgScore),
          totalFilesAnalyzed: validPreds.length,
          riskDistribution: riskCounts,
          highRiskCount: riskCounts.Critical + riskCounts.High,
        };
      }
    } catch (aiErr) {
      console.warn('[analysisService] AI prediction skipped:', aiErr.message);
    }
    if (duplicateGroups.length > 0) {
      await DuplicateGroup.insertMany(
        duplicateGroups.map((g) => ({ ...g, sessionId }))
      );
    }
    session.status = 'completed';
    session.files = filesWithDuplicates;
    session.summary = summary;
    session.wasteScore = wasteScore;
    session.storageRecovery = storageRecovery;
    session.carbonImpact = carbonImpact;
    session.recommendations = recommendations;
    session.aiAnalysis = aiAnalysis;
    session.processedAt = new Date();
    await session.save();
    return session;
  } catch (error) {
    session.status = 'failed';
    session.errorMessage = error.message;
    await session.save();
    throw error;
  }
};
module.exports = { runAnalysisPipeline };
