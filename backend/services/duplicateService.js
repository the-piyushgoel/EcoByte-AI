/**
 * duplicateService.js
 * Detects duplicate files based on SHA256 hashes.
 * Groups files by hash and marks all beyond the first occurrence as duplicates.
 */

const { v4: uuidv4 } = require('uuid');
const { bytesToMB } = require('../utils/fileUtil');

/**
 * Given an array of enriched file records (each having sha256Hash),
 * detect duplicates and return:
 *  - Updated files array with isDuplicate & duplicateGroupId flags
 *  - Duplicate groups metadata
 *
 * @param {Array<object>} files - Array of file record objects
 * @returns {{ files: Array<object>, duplicateGroups: Array<object> }}
 */
const detectDuplicates = (files) => {
  // Map: sha256Hash -> [file indices]
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
    if (indices.length < 2) return; // Not a duplicate

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

    // Wasted bytes = (count - 1) * single file size (keep only one copy)
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
 * Calculate the total size of all duplicate files.
 * Keeps one copy per hash group; rest is "waste".
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
      // First copy is "kept"; rest are wasted
      const sorted = [...sizes].sort((a, b) => b - a);
      totalWaste += sorted.slice(1).reduce((acc, s) => acc + s, 0);
    }
  });
  return totalWaste;
};

module.exports = { detectDuplicates, calcDuplicateWasteBytes };
