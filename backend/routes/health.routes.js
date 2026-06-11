/**
 * health.routes.js
 * Health check and server status endpoints.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { sendSuccess } = require('../utils/responseUtil');

/**
 * GET /api/health
 * Basic liveness probe.
 */
router.get('/', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return sendSuccess(
    res,
    {
      server: 'online',
      database: dbState[mongoose.connection.readyState] || 'unknown',
      uptime: `${Math.floor(process.uptime())}s`,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
    },
    'EcoByte AI backend is healthy.'
  );
});

module.exports = router;
