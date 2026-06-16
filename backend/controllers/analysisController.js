const path = require('path');
const fs = require('fs');

const AnalysisSession = require('../models/AnalysisSession');
const DuplicateGroup = require('../models/DuplicateGroup');
const { runAnalysisPipeline } = require('../services/analysisService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseUtil');

const uploadAndAnalyze = async (req, res) => {
  console.log("UPLOAD REQUEST RECEIVED");
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No files uploaded. Please select at least one file.', 400);
    }

    let clientMetas = {};
    if (req.body.fileMeta) {
      try {
        clientMetas = JSON.parse(req.body.fileMeta);
      } catch {
        console.warn('[analysisController] Could not parse fileMeta JSON');
      }
    }

    const sessionName = req.body.sessionName || '';

    console.log(
      `[analysisController] Starting analysis for ${req.files.length} file(s) | session: "${sessionName}"`
    );

    const session = await runAnalysisPipeline(req.files, clientMetas, sessionName);

    return sendSuccess(
      res,
      {
        sessionId: session.sessionId,
        status: session.status,
        summary: session.summary,
        wasteScore: session.wasteScore,
        storageRecovery: session.storageRecovery,
        carbonImpact: session.carbonImpact,
        recommendations: session.recommendations,
        aiAnalysis: session.aiAnalysis || null,
        processedAt: session.processedAt,
      },
      'Analysis completed successfully.',
      201
    );
  } catch (error) {
    console.error('[analysisController] Upload error:', error);
    return sendError(res, 'Analysis pipeline failed. Please try again.', 500, error.message);
  }
};

const getAllSessions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [sessions, total] = await Promise.all([
      AnalysisSession.find(filter)
        .select('-files') // exclude file array for listing (performance)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AnalysisSession.countDocuments(filter),
    ]);

    return sendPaginated(res, sessions, total, page, limit, 'Sessions retrieved.');
  } catch (error) {
    console.error('[analysisController] getAllSessions error:', error);
    return sendError(res, 'Failed to fetch sessions.', 500, error.message);
  }
};

const getSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AnalysisSession.findOne({ sessionId }).lean();

    if (!session) {
      return sendError(res, `Session "${sessionId}" not found.`, 404);
    }

    return sendSuccess(res, session, 'Session retrieved.');
  } catch (error) {
    console.error('[analysisController] getSessionById error:', error);
    return sendError(res, 'Failed to fetch session.', 500, error.message);
  }
};

const getSessionFiles = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      classification,
      isDuplicate,
      isInactive,
      page = 1,
      limit = 20,
    } = req.query;

    const session = await AnalysisSession.findOne({ sessionId }).lean();
    if (!session) {
      return sendError(res, `Session "${sessionId}" not found.`, 404);
    }

    let files = session.files || [];
    if (classification) {
      files = files.filter((f) => f.classification === classification);
    }
    if (isDuplicate !== undefined) {
      const flag = isDuplicate === 'true';
      files = files.filter((f) => f.isDuplicate === flag);
    }
    if (isInactive !== undefined) {
      const flag = isInactive === 'true';
      files = files.filter((f) => f.isInactive === flag);
    }

    const total = files.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const paginated = files.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return sendPaginated(res, paginated, total, pageNum, limitNum, 'Files retrieved.');
  } catch (error) {
    console.error('[analysisController] getSessionFiles error:', error);
    return sendError(res, 'Failed to fetch files.', 500, error.message);
  }
};
const getSessionDuplicates = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const groups = await DuplicateGroup.find({ sessionId }).lean();

    return sendSuccess(res, groups, `${groups.length} duplicate group(s) found.`);
  } catch (error) {
    console.error('[analysisController] getSessionDuplicates error:', error);
    return sendError(res, 'Failed to fetch duplicate groups.', 500, error.message);
  }
};
const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AnalysisSession.findOne({ sessionId });
    if (!session) {
      return sendError(res, `Session "${sessionId}" not found.`, 404);
    }
    const uploadBase = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
    const sessionFolderPattern = new RegExp(`session_.*`);
    try {
      const entries = fs.readdirSync(uploadBase);
      for (const entry of entries) {
        const storedNames = new Set((session.files || []).map((f) => f.storedName));
        const entryPath = path.join(uploadBase, entry);
        if (fs.statSync(entryPath).isDirectory()) {
          const dirFiles = fs.readdirSync(entryPath);
          const overlap = dirFiles.some((df) => storedNames.has(df));
          if (overlap) {
            fs.rmSync(entryPath, { recursive: true, force: true });
          }
        }
      }
    } catch (fsErr) {
      console.warn('[analysisController] Could not clean up uploaded files:', fsErr.message);
    }
    await Promise.all([
      AnalysisSession.deleteOne({ sessionId }),
      DuplicateGroup.deleteMany({ sessionId }),
    ]);

    return sendSuccess(res, { sessionId }, 'Session deleted successfully.');
  } catch (error) {
    console.error('[analysisController] deleteSession error:', error);
    return sendError(res, 'Failed to delete session.', 500, error.message);
  }
};
const getGlobalStats = async (req, res) => {
  try {
    const [stats] = await AnalysisSession.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalFilesAnalyzed: { $sum: '$summary.totalFiles' },
          totalDuplicatesFound: { $sum: '$summary.duplicateCount' },
          totalInactiveFound: { $sum: '$summary.inactiveCount' },
          totalRecoverableMB: { $sum: '$storageRecovery.totalRecoverableMB' },
          totalCO2Saved: { $sum: '$carbonImpact.recoverableCO2KgPerYear' },
          avgWasteScore: { $avg: '$wasteScore.overallScore' },
        },
      },
    ]);

    return sendSuccess(
      res,
      stats || {
        totalSessions: 0,
        totalFilesAnalyzed: 0,
        totalDuplicatesFound: 0,
        totalInactiveFound: 0,
        totalRecoverableMB: 0,
        totalCO2Saved: 0,
        avgWasteScore: 0,
      },
      'Global stats retrieved.'
    );
  } catch (error) {
    console.error('[analysisController] getGlobalStats error:', error);
    return sendError(res, 'Failed to fetch global stats.', 500, error.message);
  }
};

module.exports = {
  uploadAndAnalyze,
  getAllSessions,
  getSessionById,
  getSessionFiles,
  getSessionDuplicates,
  deleteSession,
  getGlobalStats,
};
