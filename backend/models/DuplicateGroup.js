const mongoose = require('mongoose');

/**
 * DuplicateGroup tracks clusters of files that share the same SHA256 hash.
 * Each group holds all the file references found across different sessions.
 */
const DuplicateGroupSchema = new mongoose.Schema(
  {
    groupId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sha256Hash: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    fileCount: {
      type: Number,
      default: 0,
    },
    files: [
      {
        fileId: { type: mongoose.Schema.Types.ObjectId },
        originalName: { type: String },
        sizeBytes: { type: Number },
        storagePath: { type: String },
      },
    ],
    totalWastedBytes: {
      type: Number,
      default: 0,
    },
    totalWastedMB: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'duplicate_groups',
  }
);

DuplicateGroupSchema.index({ sha256Hash: 1, sessionId: 1 });

module.exports = mongoose.model('DuplicateGroup', DuplicateGroupSchema);
