const mongoose = require('mongoose');
const FileRecordSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
    },
    extension: {
      type: String,
      lowercase: true,
      trim: true,
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
    sizeMB: {
      type: Number,
      default: 0,
    },
    sha256Hash: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: null,
    },
    modifiedAt: {
      type: Date,
      default: null,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    isInactive: {
      type: Boolean,
      default: false,
    },
    classification: {
      type: String,
      enum: ['active', 'archive', 'waste'],
      default: 'active',
    },
    daysSinceModified: {
      type: Number,
      default: 0,
    },
    duplicateGroupId: {
      type: String,
      default: null,
    },
    storagePath: {
      type: String,
      default: null,
    },
    aiPrediction: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: true }
);
const CarbonImpactSchema = new mongoose.Schema(
  {
    totalStorageGB: { type: Number, default: 0 },
    wasteStorageGB: { type: Number, default: 0 },
    totalCO2KgPerYear: { type: Number, default: 0 },
    recoverableCO2KgPerYear: { type: Number, default: 0 },
    equivalentTreesNeeded: { type: Number, default: 0 },
    kgCO2PerGBPerYear: { type: Number, default: 2.5 },
  },
  { _id: false }
);
const StorageRecoverySchema = new mongoose.Schema(
  {
    duplicateSizeBytes: { type: Number, default: 0 },
    duplicateSizeMB: { type: Number, default: 0 },
    duplicateSizeGB: { type: Number, default: 0 },
    inactiveSizeBytes: { type: Number, default: 0 },
    inactiveSizeMB: { type: Number, default: 0 },
    inactiveSizeGB: { type: Number, default: 0 },
    totalRecoverableBytes: { type: Number, default: 0 },
    totalRecoverableMB: { type: Number, default: 0 },
    totalRecoverableGB: { type: Number, default: 0 },
  },
  { _id: false }
);

const WasteScoreSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    duplicateScore: { type: Number, default: 0 },
    inactiveScore: { type: Number, default: 0 },
    largeUnusedScore: { type: Number, default: 0 },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
      default: 'A',
    },
    label: { type: String, default: 'Excellent' },
  },
  { _id: false }
);
const SummarySchema = new mongoose.Schema(
  {
    totalFiles: { type: Number, default: 0 },
    totalSizeBytes: { type: Number, default: 0 },
    totalSizeMB: { type: Number, default: 0 },
    totalSizeGB: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    inactiveCount: { type: Number, default: 0 },
    activeCount: { type: Number, default: 0 },
    archiveCount: { type: Number, default: 0 },
    wasteCount: { type: Number, default: 0 },
    uniqueExtensions: { type: [String], default: [] },
    largestFileBytes: { type: Number, default: 0 },
    averageFileSizeBytes: { type: Number, default: 0 },
  },
  { _id: false }
);
const AnalysisSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionName: {
      type: String,
      default: 'Unnamed Analysis',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    files: [FileRecordSchema],
    summary: {
      type: SummarySchema,
      default: () => ({}),
    },
    wasteScore: {
      type: WasteScoreSchema,
      default: () => ({}),
    },
    storageRecovery: {
      type: StorageRecoverySchema,
      default: () => ({}),
    },
    carbonImpact: {
      type: CarbonImpactSchema,
      default: () => ({}),
    },
    recommendations: {
      type: [String],
      default: [],
    },
    processedAt: {
      type: Date,
      default: null,
    },
    aiAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'analysis_sessions',
  }
);
AnalysisSessionSchema.index({ status: 1, createdAt: -1 });
AnalysisSessionSchema.index({ 'wasteScore.overallScore': -1 });
AnalysisSessionSchema.virtual('ageInHours').get(function () {
  return Math.round((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

module.exports = mongoose.model('AnalysisSession', AnalysisSessionSchema);
