const { bytesToGB } = require('../utils/fileUtil');
const KG_CO2_PER_GB_PER_YEAR = 2.5;
const KG_CO2_ABSORBED_PER_TREE_PER_YEAR = 22;

/**
 * Calculate CO2 emissions for a given number of bytes.
 * @param {number} bytes
 * @returns {number} kg CO2 per year
 */
const bytesToCO2 = (bytes) => {
  const gb = bytesToGB(bytes);
  return Math.round(gb * KG_CO2_PER_GB_PER_YEAR * 10000) / 10000;
};

/**
 * Calculate how many trees are needed to offset a given CO2 amount.
 * @param {number} kgCO2
 * @returns {number}
 */
const treesNeededToOffset = (kgCO2) => {
  return Math.ceil(kgCO2 / KG_CO2_ABSORBED_PER_TREE_PER_YEAR);
};

/**
 * Compute carbon impact metrics for the analysis session.
 * @param {Array<object>} files - Enriched file records
 * @returns {{
 *   totalStorageGB: number,
 *   wasteStorageGB: number,
 *   totalCO2KgPerYear: number,
 *   recoverableCO2KgPerYear: number,
 *   equivalentTreesNeeded: number,
 *   kgCO2PerGBPerYear: number
 * }}
 */
const computeCarbonImpact = (files) => {
  const totalBytes = files.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
  const wasteBytes = files
    .filter((f) => f.classification === 'waste')
    .reduce((sum, f) => sum + (f.sizeBytes || 0), 0);

  const totalStorageGB = bytesToGB(totalBytes);
  const wasteStorageGB = bytesToGB(wasteBytes);

  const totalCO2KgPerYear = bytesToCO2(totalBytes);
  const recoverableCO2KgPerYear = bytesToCO2(wasteBytes);

  const equivalentTreesNeeded = treesNeededToOffset(recoverableCO2KgPerYear);

  return {
    totalStorageGB: Math.round(totalStorageGB * 1000000) / 1000000,
    wasteStorageGB: Math.round(wasteStorageGB * 1000000) / 1000000,
    totalCO2KgPerYear,
    recoverableCO2KgPerYear,
    equivalentTreesNeeded,
    kgCO2PerGBPerYear: KG_CO2_PER_GB_PER_YEAR,
  };
};

module.exports = { computeCarbonImpact, bytesToCO2, treesNeededToOffset };
