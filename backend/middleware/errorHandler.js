const { sendError } = require('../utils/responseUtil');
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
const handleMongooseError = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(res, `Validation Error: ${messages.join(', ')}`, 400);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, `Duplicate value for ${field}.`, 409);
  }
  if (err.name === 'CastError') {
    return sendError(res, `Invalid value for field: ${err.path}`, 400);
  }

  next(err);
};
const globalErrorHandler = (err, req, res, next) => {
  console.error('[GlobalErrorHandler]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, err.stack);
};

module.exports = { handleMulterError, handleMongooseError, globalErrorHandler };
