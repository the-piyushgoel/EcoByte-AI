const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const UPLOAD_BASE_DIR = path.resolve(
  __dirname,
  '..',
  process.env.UPLOAD_DIR || 'uploads'
);

if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.uploadSessionDir) {
      const sessionFolder = `session_${Date.now()}_${uuidv4().slice(0, 8)}`;
      req.uploadSessionDir = path.join(UPLOAD_BASE_DIR, sessionFolder);
      fs.mkdirSync(req.uploadSessionDir, { recursive: true });
    }
    cb(null, req.uploadSessionDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const safeName = `${base}_${Date.now()}${ext}`;
    cb(null, safeName);
  },
});
const uploadInstance = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 * 1024,
    files: 500,
  },
});

module.exports = { upload: uploadInstance, UPLOAD_BASE_DIR };
