/**
 * wasteScoreService.js
 * Calculates the Digital Waste Score (0–100) and assigns a grade/label.
 *
 * Scoring weights:
 *   40% – Duplicate files ratio
 *   40% – Inactive files ratio
 *   20% – Large unused files ratio
 *
 * Score Interpretation:
 *   0–20   → A  (Excellent)
 *   21–40  → B  (Good)
 *   41–60  → C  (Moderate)
 *   61–80  → D  (Poor)
 *   81–100 → F  (Critical)
 */

const { isLargeFile } = require('../utils/fileUtil');

// Scoring weights (must sum to 1)
const WEIGHTS = {
  duplicate: 0.4,
  inactive: 0.4,
  largeUnused: 0.2,
};

/**
 * Determine score grade and label.
 * @param {number} score
 * @returns {{ grade: string, label: string }}
 */
const getGradeAndLabel = (score) => {
  if (score <= 20) return { grade: 'A', label: 'Excellent' };
  if (score <= 40) return { grade: 'B', label: 'Good' };
  if (score <= 60) return { grade: 'C', label: 'Moderate' };
  if (score <= 80) return { grade: 'D', label: 'Poor' };
  return { grade: 'F', label: 'Critical' };
};

/**
 * Compute the Digital Waste Score.
 * @param {Array<object>} files - Array of enriched file records
 * @returns {{
 *   overallScore: number,
 *   duplicateScore: number,
 *   inactiveScore: number,
 *   largeUnusedScore: number,
 *   grade: string,
 *   label: string
 * }}
 */
const computeWasteScore = (files) => {
  const total = files.length;
  if (total === 0) {
    return {
      overallScore: 0,
      duplicateScore: 0,
      inactiveScore: 0,
      largeUnusedScore: 0,
      ...getGradeAndLabel(0),
    };
  }

  const duplicateCount = files.filter((f) => f.isDuplicate).length;
  const inactiveCount = files.filter((f) => f.isInactive).length;

  // "Large unused" = large files that are also inactive OR duplicate
  const largeUnusedCount = files.filter(
    (f) => isLargeFile(f.sizeBytes) && (f.isDuplicate || f.isInactive)
  ).length;

  // Ratios as percentages (0–100)
  const duplicateRatio = (duplicateCount / total) * 100;
  const inactiveRatio = (inactiveCount / total) * 100;
  const largeUnusedRatio = (largeUnusedCount / total) * 100;

  // Weighted score components
  const duplicateScore = duplicateRatio * WEIGHTS.duplicate;
  const inactiveScore = inactiveRatio * WEIGHTS.inactive;
  const largeUnusedScore = largeUnusedRatio * WEIGHTS.largeUnused;

  const overallScore = Math.min(
    100,
    Math.round(duplicateScore + inactiveScore + largeUnusedScore)
  );

  const { grade, label } = getGradeAndLabel(overallScore);

  return {
    overallScore,
    duplicateScore: Math.round(duplicateScore * 100) / 100,
    inactiveScore: Math.round(inactiveScore * 100) / 100,
    largeUnusedScore: Math.round(largeUnusedScore * 100) / 100,
    grade,
    label,
  };
};

module.exports = { computeWasteScore, getGradeAndLabel };
