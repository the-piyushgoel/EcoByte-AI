/**
 * recommendationService.js
 * Rule-based recommendation engine.
 * Generates human-readable, actionable recommendations based on analysis results.
 */

const { formatBytes, bytesToMB, bytesToGB } = require('../utils/fileUtil');

/**
 * Generate an array of recommendation strings given analysis data.
 *
 * @param {object} params
 * @param {Array<object>} params.files          - Enriched file records
 * @param {Array<object>} params.duplicateGroups - Duplicate group metadata
 * @param {object}        params.storageRecovery - Storage recovery stats
 * @param {object}        params.carbonImpact    - Carbon impact stats
 * @param {object}        params.wasteScore      - Waste score data
 * @returns {string[]}
 */
const generateRecommendations = ({
  files,
  duplicateGroups = [],
  storageRecovery,
  carbonImpact,
  wasteScore,
}) => {
  const recommendations = [];

  const totalFiles = files.length;
  if (totalFiles === 0) {
    recommendations.push('No files were uploaded for analysis.');
    return recommendations;
  }

  // ── 1. Duplicate file recommendations ───────────────────────────────────
  const duplicateFiles = files.filter((f) => f.isDuplicate);
  if (duplicateFiles.length > 0) {
    const wastedMB = bytesToMB(
      duplicateFiles.reduce((s, f) => s + f.sizeBytes, 0)
    );
    recommendations.push(
      `🗂️  ${duplicateFiles.length} duplicate file${duplicateFiles.length > 1 ? 's' : ''} detected across ${duplicateGroups.length} group${duplicateGroups.length > 1 ? 's' : ''}. Removing duplicates can free up ${wastedMB.toFixed(2)} MB.`
    );

    if (duplicateGroups.length > 0) {
      const largest = duplicateGroups.sort(
        (a, b) => b.totalWastedBytes - a.totalWastedBytes
      )[0];
      recommendations.push(
        `📁  Largest duplicate group ("${largest.files[0]?.originalName || 'unknown'}") wastes ${formatBytes(largest.totalWastedBytes)} across ${largest.fileCount} copies.`
      );
    }
  }

  // ── 2. Inactive file recommendations ────────────────────────────────────
  const inactiveFiles = files.filter((f) => f.isInactive);
  if (inactiveFiles.length > 0) {
    const inactiveMB = bytesToMB(
      inactiveFiles.reduce((s, f) => s + f.sizeBytes, 0)
    );

    // Find files inactive for 2+ years
    const veryOld = inactiveFiles.filter((f) => f.daysSinceModified >= 730);
    recommendations.push(
      `⏳  ${inactiveFiles.length} file${inactiveFiles.length > 1 ? 's' : ''} have not been modified in over a year, consuming ${inactiveMB.toFixed(2)} MB.`
    );

    if (veryOld.length > 0) {
      recommendations.push(
        `🕰️  ${veryOld.length} file${veryOld.length > 1 ? 's' : ''} in this folder ${veryOld.length > 1 ? 'are' : 'is'} inactive for 2+ years. Consider archiving or deleting them.`
      );
    }
  }

  // ── 3. Storage recovery recommendation ──────────────────────────────────
  if (storageRecovery?.totalRecoverableGB > 0) {
    recommendations.push(
      `💾  Potential storage recovery: ${storageRecovery.totalRecoverableGB.toFixed(3)} GB (${storageRecovery.totalRecoverableMB.toFixed(2)} MB) by removing waste files.`
    );
  } else if (storageRecovery?.totalRecoverableMB > 0) {
    recommendations.push(
      `💾  Potential storage recovery: ${storageRecovery.totalRecoverableMB.toFixed(2)} MB by removing waste files.`
    );
  }

  // ── 4. Carbon impact recommendation ─────────────────────────────────────
  if (carbonImpact?.recoverableCO2KgPerYear > 0) {
    recommendations.push(
      `🌱  By removing digital waste, you can reduce your carbon footprint by ~${carbonImpact.recoverableCO2KgPerYear.toFixed(2)} kg CO₂/year — equivalent to planting ${carbonImpact.equivalentTreesNeeded} tree${carbonImpact.equivalentTreesNeeded !== 1 ? 's' : ''}.`
    );
  }

  // ── 5. Waste score recommendations ──────────────────────────────────────
  if (wasteScore?.grade === 'F' || wasteScore?.grade === 'D') {
    recommendations.push(
      `⚠️  Digital Waste Score: ${wasteScore.overallScore}/100 (${wasteScore.label}). Immediate cleanup is recommended to optimize storage efficiency.`
    );
  } else if (wasteScore?.grade === 'C') {
    recommendations.push(
      `📊  Digital Waste Score: ${wasteScore.overallScore}/100 (${wasteScore.label}). Some cleanup would improve your storage health.`
    );
  } else if (wasteScore?.grade === 'A' || wasteScore?.grade === 'B') {
    recommendations.push(
      `✅  Digital Waste Score: ${wasteScore.overallScore}/100 (${wasteScore.label}). Your storage is well-organized!`
    );
  }

  // ── 6. File type diversity ───────────────────────────────────────────────
  const extMap = new Map();
  files.forEach((f) => {
    extMap.set(f.extension, (extMap.get(f.extension) || 0) + 1);
  });
  const dominantExt = [...extMap.entries()].sort((a, b) => b[1] - a[1])[0];
  if (dominantExt && dominantExt[1] > totalFiles * 0.5) {
    recommendations.push(
      `📎  ${Math.round((dominantExt[1] / totalFiles) * 100)}% of uploaded files are "${dominantExt[0]}" type. Consider archiving older files of this type.`
    );
  }

  // ── 7. Large file alert ──────────────────────────────────────────────────
  const LARGE_THRESHOLD = 50 * 1024 * 1024; // 50 MB
  const largeFiles = files.filter((f) => f.sizeBytes >= LARGE_THRESHOLD);
  if (largeFiles.length > 0) {
    const totalLargeMB = bytesToMB(
      largeFiles.reduce((s, f) => s + f.sizeBytes, 0)
    );
    recommendations.push(
      `📦  ${largeFiles.length} large file${largeFiles.length > 1 ? 's' : ''} (≥50 MB each) account for ${totalLargeMB.toFixed(2)} MB. Review if all are still needed.`
    );
  }

  // Deduplicate and return
  return [...new Set(recommendations)];
};

module.exports = { generateRecommendations };
