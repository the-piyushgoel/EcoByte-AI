/**
 * server.js
 * EcoByte AI – Digital Waste Intelligence & Sustainability Analytics Platform
 * Entry point for the Express backend.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const requestLogger = require('./middleware/requestLogger');
const { handleMongooseError, globalErrorHandler } = require('./middleware/errorHandler');

// ─── Route imports ────────────────────────────────────────────────────────────
const healthRoutes = require('./routes/health.routes');
const analysisRoutes = require('./routes/analysis.routes');

// ─── App init ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Ensure uploads directory exists ─────────────────────────────────────────
const uploadsDir = path.resolve(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${uploadsDir}`);
}

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Serve uploaded files statically (useful for file preview)
app.use('/uploads', express.static(uploadsDir));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/analysis', analysisRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(handleMongooseError);
app.use(globalErrorHandler);

// ─── Connect DB & Start Server ────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║         🌿  EcoByte AI Backend Server          ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log(`║  🚀  Running on   : http://localhost:${PORT}       ║`);
    console.log(`║  🌍  Environment  : ${process.env.NODE_ENV || 'development'}                ║`);
    console.log(`║  🗄️   MongoDB      : ${process.env.MONGO_URI}  ║`);
    console.log('╚════════════════════════════════════════════════╝\n');
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n⚡ Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });
};

startServer();

module.exports = app; // for testing
