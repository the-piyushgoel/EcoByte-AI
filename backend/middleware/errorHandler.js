/**
 * errorHandler.js
 * Global Express error handling middleware.
 * Must be registered AFTER all routes.
 */

const { sendError } = require('../utils/responseUtil');

/**
 * Handle Multer-specific errors.
 */
const handleMulterError = (err, req, res, next) => {
  const multer = require('multer');

  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return sendError(res, 'File too large. Maximum allowed size is 100 MB.', 413);
      case 'LIMIT_FILE_COUNT':
        return sendError(res, 'Too many files. Maximum 500 files per upload.', 413);
      case 'LIMIT_UNEXPECTED_FILE':
        return sendError(res, `Unexpected field: ${err.field}`, 400);
      default:
        return sendError(res, `Upload error: ${err.message}`, 400);
    }
  }
  next(err);
};

/**
 * Handle Mongoose validation and cast errors.
 */
const handleMongooseError = (err, req, res, next) => {
  // Validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(res, `Validation Error: ${messages.join(', ')}`, 400);
  }

  // Duplicate key error (unique index violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, `Duplicate value for ${field}.`, 409);
  }

  // CastError (bad ObjectId etc.)
  if (err.name === 'CastError') {
    return sendError(res, `Invalid value for field: ${err.path}`, 400);
  }

  next(err);
};

/**
 * Final catch-all error handler.
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  console.error('[GlobalErrorHandler]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, err.stack);
};

module.exports = { handleMulterError, handleMongooseError, globalErrorHandler };
