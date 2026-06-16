/**
 * @param {object} res - Express response object
 * @param {*} data - Payload to include
 * @param {string} [message] - Optional success message
 * @param {number} [statusCode=200]
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};
/**
 * @param {object} res - Express response object
 * @param {string} message - Error description
 * @param {number} [statusCode=500]
 * @param {*} [details] - Optional technical details (omitted in production)
 */
const sendError = (res, message = 'Internal Server Error', statusCode = 500, details = null) => {
  const body = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (details && process.env.NODE_ENV !== 'production') {
    body.details = details;
  }
  return res.status(statusCode).json(body);
};
/**
 * @param {object} res
 * @param {Array} items
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @param {string} [message]
 */
const sendPaginated = (res, items, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
