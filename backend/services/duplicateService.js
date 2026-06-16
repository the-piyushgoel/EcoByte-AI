const { v4: uuidv4 } = require('uuid');
const { bytesToMB } = require('../utils/fileUtil');

/**
 * @param {Array<object>} files - Array of file record objects
 * @returns {{ files: Array<object>, duplicateGroups: Array<object> }}
 */
const detectDuplicates = (files) => {
  const hashMap = new Map();

  files.forEach((file, idx) => {
    if (!file.sha256Hash) return;
    if (!hashMap.has(file.sha256Hash)) {
      hashMap.set(file.sha256Hash, []);
    }
    hashMap.get(file.sha256Hash).push(idx);
  });

  const duplicateGroups = [];

  hashMap.forEach((indices, hash) => {
    if (indices.length < 2) return;

    const groupId = uuidv4();
    const groupFiles = [];

    indices.forEach((idx) => {
      files[idx].isDuplicate = true;
      files[idx].duplicateGroupId = groupId;
      groupFiles.push({
        fileId: files[idx]._id || null,
        originalName: files[idx].originalName,
        sizeBytes: files[idx].sizeBytes,
        storagePath: files[idx].storagePath,
      });
    });
    const singleFileSizeBytes = files[indices[0]].sizeBytes || 0;
    const wastedBytes = singleFileSizeBytes * (indices.length - 1);

    duplicateGroups.push({
      groupId,
      sha256Hash: hash,
      fileCount: indices.length,
      files: groupFiles,
      totalWastedBytes: wastedBytes,
      totalWastedMB: bytesToMB(wastedBytes),
    });
  });

  return { files, duplicateGroups };
};

/**
 * @param {Array<object>} files
 * @returns {number} - Total wasted bytes from duplicates
 */
const calcDuplicateWasteBytes = (files) => {
  const hashMap = new Map();
  files.forEach((f) => {
    if (!f.sha256Hash) return;
    if (!hashMap.has(f.sha256Hash)) {
      hashMap.set(f.sha256Hash, []);
    }
    hashMap.get(f.sha256Hash).push(f.sizeBytes || 0);
  });

  let totalWaste = 0;
  hashMap.forEach((sizes) => {
    if (sizes.length > 1) {
      const sorted = [...sizes].sort((a, b) => b - a);
      totalWaste += sorted.slice(1).reduce((acc, s) => acc + s, 0);
    }
  });
  return totalWaste;
};

module.exports = { detectDuplicates, calcDuplicateWasteBytes };
