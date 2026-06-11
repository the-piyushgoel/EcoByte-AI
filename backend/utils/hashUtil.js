const crypto = require('crypto');
const fs = require('fs');

/**
 * Compute SHA256 hash of a file at the given path.
 * Returns hex string of the hash.
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<string>} - Hex SHA256 hash
 */
const computeFileSHA256 = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => {
      console.error(`[hashUtil] Error hashing file ${filePath}:`, err.message);
      reject(err);
    });
  });
};

/**
 * Compute SHA256 hash from a Buffer.
 * @param {Buffer} buffer
 * @returns {string}
 */
const computeBufferSHA256 = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Compute a simple hash of a string value.
 * @param {string} value
 * @returns {string}
 */
const hashString = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

module.exports = {
  computeFileSHA256,
  computeBufferSHA256,
  hashString,
};
