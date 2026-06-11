/**
 * upload.js
 * Multer v2 configuration for file uploads.
 * Files are stored to disk in the uploads/ directory.
 * Each upload creates a unique sub-folder keyed by timestamp + random suffix.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ─── Ensure uploads base dir exists ──────────────────────────────────────────
const UPLOAD_BASE_DIR = path.resolve(
  __dirname,
  '..',
  process.env.UPLOAD_DIR || 'uploads'
);

if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

// ─── Disk Storage ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use session-specific sub-folder so files don't collide across uploads
    if (!req.uploadSessionDir) {
      const sessionFolder = `session_${Date.now()}_${uuidv4().slice(0, 8)}`;
      req.uploadSessionDir = path.join(UPLOAD_BASE_DIR, sessionFolder);
      fs.mkdirSync(req.uploadSessionDir, { recursive: true });
    }
    cb(null, req.uploadSessionDir);
  },
  filename: (req, file, cb) => {
    // Preserve original name with a collision-safe prefix
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const safeName = `${base}_${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

// ─── Multer v2 instance ───────────────────────────────────────────────────────
// In multer v2, we call upload(options) to create a middleware factory.
// Then we use the returned object's .array(), .single(), .fields() methods.
const uploadInstance = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100 MB per file
    files: 500, // max 500 files per upload
  },
});

module.exports = { upload: uploadInstance, UPLOAD_BASE_DIR };
