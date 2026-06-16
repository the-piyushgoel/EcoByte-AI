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
router.post(
  '/upload',
  upload.array('files', 500),
  handleMulterError,
  uploadAndAnalyze
);
router.get('/stats', getGlobalStats);
router.get('/sessions', getAllSessions);
router.get('/sessions/:sessionId', getSessionById);
router.delete('/sessions/:sessionId', deleteSession);
router.get('/sessions/:sessionId/files', getSessionFiles);
router.get('/sessions/:sessionId/duplicates', getSessionDuplicates);

module.exports = router;
