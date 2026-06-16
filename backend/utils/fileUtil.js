const path = require('path');
const INACTIVE_THRESHOLD_DAYS = 365;
const ARCHIVE_THRESHOLD_DAYS = 180;
const LARGE_FILE_THRESHOLD_BYTES = 50 * 1024 * 1024;
/**
 * @param {number} bytes
 * @returns {number}
 */
const bytesToMB = (bytes) => Math.round((bytes / (1024 * 1024)) * 10000) / 10000;

/**
 * Convert bytes to gigabytes (rounded to 6 decimal places).
 * @param {number} bytes
 * @returns {number}
 */
const bytesToGB = (bytes) => Math.round((bytes / (1024 * 1024 * 1024)) * 1000000) / 1000000;
/**
 * @param {Date|string|null} date
 * @returns {number} - Days elapsed; returns 0 if date is null/invalid
 */
const daysSince = (date) => {
  if (!date) return 0;
  const ms = Date.now() - new Date(date).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};
/**
 * @param {string} filename
 * @returns {string}
 */
const getExtension = (filename) => {
  const ext = path.extname(filename);
  return ext ? ext.toLowerCase() : '.unknown';
};
/**
 * @param {number} bytes
 * @returns {string}
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};
/**
 * @param {Date|string|null} modifiedAt
 * @returns {boolean}
 */
const isInactiveFile = (modifiedAt) => {
  return daysSince(modifiedAt) >= INACTIVE_THRESHOLD_DAYS;
};

/**
 * @param {number} sizeBytes
 * @returns {boolean}
 */
const isLargeFile = (sizeBytes) => sizeBytes >= LARGE_FILE_THRESHOLD_BYTES;

/**
 * @param {object} params
 * @param {boolean} params.isDuplicate
 * @param {boolean} params.isInactive
 * @param {Date|string|null} params.modifiedAt
 * @returns {'active'|'archive'|'waste'}
 */
const classifyFile = ({ isDuplicate, isInactive, modifiedAt }) => {
  if (isDuplicate || isInactive) return 'waste';
  if (daysSince(modifiedAt) >= ARCHIVE_THRESHOLD_DAYS) return 'archive';
  return 'active';
};
/**
 * @param {object} multerFile - The file object from multer
 * @param {object} [clientMeta] - Optional metadata supplied by the client
 * @returns {object} normalized metadata
 */
const extractFileMetadata = (multerFile, clientMeta = {}) => {
  const { originalname, size, mimetype, path: storedPath, filename } = multerFile;
  const ext = getExtension(originalname);
  const modifiedAt = clientMeta.lastModified
    ? new Date(Number(clientMeta.lastModified))
    : new Date();
  const createdAt = clientMeta.createdAt
    ? new Date(Number(clientMeta.createdAt))
    : modifiedAt;
  const days = daysSince(modifiedAt);
  return {
    originalName: originalname,
    storedName: filename,
    extension: ext,
    mimeType: mimetype || 'application/octet-stream',
    sizeBytes: size,
    sizeMB: bytesToMB(size),
    createdAt,
    modifiedAt,
    daysSinceModified: days,
    storagePath: storedPath || null,
  };
};

module.exports = {
  INACTIVE_THRESHOLD_DAYS,
  ARCHIVE_THRESHOLD_DAYS,
  LARGE_FILE_THRESHOLD_BYTES,
  bytesToMB,
  bytesToGB,
  daysSince,
  getExtension,
  formatBytes,
  isInactiveFile,
  isLargeFile,
  classifyFile,
  extractFileMetadata,
};
