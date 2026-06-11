/**
 * fileUtil.js
 * File metadata extraction and classification helpers.
 */

const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

/** Files not modified for this many days are considered inactive */
const INACTIVE_THRESHOLD_DAYS = 365;

/** Files not modified for this many days are classified as "archive" */
const ARCHIVE_THRESHOLD_DAYS = 180;

/** Size threshold to flag as "large unused" (50 MB) */
const LARGE_FILE_THRESHOLD_BYTES = 50 * 1024 * 1024;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert bytes to megabytes (rounded to 4 decimal places).
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
 * Calculate days since a given date.
 * @param {Date|string|null} date
 * @returns {number} - Days elapsed; returns 0 if date is null/invalid
 */
const daysSince = (date) => {
  if (!date) return 0;
  const ms = Date.now() - new Date(date).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

/**
 * Extract the file extension (lowercase, with leading dot).
 * @param {string} filename
 * @returns {string}
 */
const getExtension = (filename) => {
  const ext = path.extname(filename);
  return ext ? ext.toLowerCase() : '.unknown';
};

/**
 * Format bytes into a human-readable string (B, KB, MB, GB, TB).
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
 * Determine if a file is inactive based on its last modification date.
 * @param {Date|string|null} modifiedAt
 * @returns {boolean}
 */
const isInactiveFile = (modifiedAt) => {
  return daysSince(modifiedAt) >= INACTIVE_THRESHOLD_DAYS;
};

/**
 * Determine if a file is "large" (above the large-file threshold).
 * @param {number} sizeBytes
 * @returns {boolean}
 */
const isLargeFile = (sizeBytes) => sizeBytes >= LARGE_FILE_THRESHOLD_BYTES;

/**
 * Classify a file into one of three categories:
 *  - 'waste'   : duplicate OR inactive
 *  - 'archive' : old but potentially useful (180–364 days)
 *  - 'active'  : recently modified
 *
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
 * Extract metadata from a Multer file object.
 * Note: Multer doesn't expose OS-level created/modified dates;
 * those come from the client-supplied metadata if available,
 * or we fall back to upload time.
 *
 * @param {object} multerFile - The file object from multer
 * @param {object} [clientMeta] - Optional metadata supplied by the client
 * @returns {object} normalized metadata
 */
const extractFileMetadata = (multerFile, clientMeta = {}) => {
  const { originalname, size, mimetype, path: storedPath, filename } = multerFile;

  const ext = getExtension(originalname);

  // Prefer client-supplied dates; fall back to now
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
