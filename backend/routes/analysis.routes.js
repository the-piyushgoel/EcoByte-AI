/**
 * analysis.routes.js
 * All routes under /api/analysis
 */

const express = require('express');
const router = express.Router();

const { upload } = require('../middleware/upload');
const { handleMulterError } = require('../middleware/errorHandler');

const {
  uploadAndAnalyze,
  getAllSessions,
  getSessionById,
  getSessionFiles,
  getSessionDuplicates,
  deleteSession,
  getGlobalStats,
} = require('../controllers/analysisController');

// ─── Upload & Analysis ────────────────────────────────────────────────────────

/**
 * POST /api/analysis/upload
 * Body (multipart/form-data):
 *   - files[]     : The uploaded files
 *   - fileMeta    : JSON string { [originalName]: { lastModified, size } }
 *   - sessionName : Optional human-readable label
 */
router.post(
  '/upload',
  upload.array('files', 500),
  handleMulterError,
  uploadAndAnalyze
);

// ─── Global Aggregate Stats ───────────────────────────────────────────────────

/**
 * GET /api/analysis/stats
 * Returns aggregated stats across all completed sessions.
 */
router.get('/stats', getGlobalStats);

// ─── Session Listing ──────────────────────────────────────────────────────────

/**
 * GET /api/analysis/sessions
 * Query params: page, limit, status
 */
router.get('/sessions', getAllSessions);

// ─── Single Session ───────────────────────────────────────────────────────────

/**
 * GET /api/analysis/sessions/:sessionId
 */
router.get('/sessions/:sessionId', getSessionById);

/**
 * DELETE /api/analysis/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', deleteSession);

// ─── Session Files ────────────────────────────────────────────────────────────

/**
 * GET /api/analysis/sessions/:sessionId/files
 * Query params: classification, isDuplicate, isInactive, page, limit
 */
router.get('/sessions/:sessionId/files', getSessionFiles);

// ─── Duplicate Groups ─────────────────────────────────────────────────────────

/**
 * GET /api/analysis/sessions/:sessionId/duplicates
 */
router.get('/sessions/:sessionId/duplicates', getSessionDuplicates);

module.exports = router;
