/**
 * analysisService.js
 * Orchestrates the full analysis pipeline for uploaded files.
 *
 * Pipeline stages:
 *  1. Extract metadata from each Multer file
 *  2. Compute SHA256 hashes
 *  3. Detect duplicates
 *  4. Detect inactive files
 *  5. Classify each file
 *  6. Build summary statistics
 *  7. Compute storage recovery estimates
 *  8. Compute Digital Waste Score
 *  9. Compute Carbon Impact
 * 10. Generate recommendations
 * 11. Persist results to MongoDB
 */

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

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build summary from enriched files
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper: compute storage recovery
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Main orchestration function
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Run the full analysis pipeline.
 * @param {Array<object>} multerFiles  - Files from req.files (multer)
 * @param {object}        clientMetas  - Map of originalname -> client-supplied metadata
 * @param {string}        sessionName  - Human-readable session name
 * @returns {Promise<object>}          - Saved AnalysisSession document
 */
const runAnalysisPipeline = async (multerFiles, clientMetas = {}, sessionName = '') => {
  const sessionId = uuidv4();

  // Create a pending session record immediately
  let session = new AnalysisSession({
    sessionId,
    sessionName: sessionName || `Analysis – ${new Date().toLocaleString()}`,
    status: 'processing',
  });
  await session.save();

  try {
    // ── Stage 1 & 2: Extract metadata + compute SHA256 hashes ────────────
    const enrichedFiles = await Promise.all(
      multerFiles.map(async (mFile) => {
        const clientMeta = clientMetas[mFile.originalname] || {};
        const meta = extractFileMetadata(mFile, clientMeta);

        // Hash the file
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

    // ── Stage 3: Detect duplicates ────────────────────────────────────────
    const { files: filesWithDuplicates, duplicateGroups } = detectDuplicates(enrichedFiles);

    // ── Stage 4: Detect inactive files ────────────────────────────────────
    filesWithDuplicates.forEach((f) => {
      f.isInactive = isInactiveFile(f.modifiedAt);
    });

    // ── Stage 5: Classify files ───────────────────────────────────────────
    filesWithDuplicates.forEach((f) => {
      f.classification = classifyFile({
        isDuplicate: f.isDuplicate,
        isInactive: f.isInactive,
        modifiedAt: f.modifiedAt,
      });
    });

    // ── Stage 6: Build summary ────────────────────────────────────────────
    const summary = buildSummary(filesWithDuplicates);

    // ── Stage 7: Storage recovery ─────────────────────────────────────────
    const storageRecovery = buildStorageRecovery(filesWithDuplicates);

    // ── Stage 8: Waste Score ──────────────────────────────────────────────
    const wasteScore = computeWasteScore(filesWithDuplicates);

    // ── Stage 9: Carbon Impact ────────────────────────────────────────────
    const carbonImpact = computeCarbonImpact(filesWithDuplicates);

    // ── Stage 10: Recommendations ─────────────────────────────────────────
    const recommendations = generateRecommendations({
      files: filesWithDuplicates,
      duplicateGroups,
      storageRecovery,
      carbonImpact,
      wasteScore,
    });

    // ── Stage 11: Persist ─────────────────────────────────────────────────
    // Save duplicate groups to their own collection
    if (duplicateGroups.length > 0) {
      await DuplicateGroup.insertMany(
        duplicateGroups.map((g) => ({ ...g, sessionId }))
      );
    }

    // Update session with full results
    session.status = 'completed';
    session.files = filesWithDuplicates;
    session.summary = summary;
    session.wasteScore = wasteScore;
    session.storageRecovery = storageRecovery;
    session.carbonImpact = carbonImpact;
    session.recommendations = recommendations;
    session.processedAt = new Date();

    await session.save();

    return session;
  } catch (error) {
    // Mark session as failed
    session.status = 'failed';
    session.errorMessage = error.message;
    await session.save();
    throw error;
  }
};

module.exports = { runAnalysisPipeline };
