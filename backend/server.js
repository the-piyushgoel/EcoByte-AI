require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const requestLogger = require('./middleware/requestLogger');
const { handleMongooseError, globalErrorHandler } = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health.routes');
const analysisRoutes = require('./routes/analysis.routes');

const app = express();
const PORT = process.env.PORT || 5000;

const uploadsDir = path.resolve(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${uploadsDir}`);
}

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://eco-byte-lexsadie4-piyush-goels-projects-26929169.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use('/uploads', express.static(uploadsDir));

app.use('/api/health', healthRoutes);
app.use('/api/analysis', analysisRoutes);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});
app.use(handleMongooseError);
app.use(globalErrorHandler);

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
