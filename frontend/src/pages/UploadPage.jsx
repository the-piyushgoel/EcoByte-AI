import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  File,
  FolderOpen,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Clock,
  FileText,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { uploadFiles, getSessions, deleteSession } from '../api/analysisApi';

/* ─── Helpers ──────────────────────────────────────────────────────── */

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getExtension(name) {
  const parts = name.split('.');
  return parts.length > 1 ? '.' + parts.pop().toLowerCase() : '';
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   UPLOAD PAGE COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function UploadPage() {
  const navigate = useNavigate();

  /* ── State ── */
  const [files, setFiles] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | processing | completed | error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  /* ── Fetch past sessions ── */
  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const res = await getSessions(1, 5);
      // Backend returns { success, data: [...], pagination: {...} }
      const items = Array.isArray(res?.data) ? res.data : [];
      setSessions(items);
    } catch {
      /* ignore */
    }
  }

  /* ── File handling ── */
  const addFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles);
    if (fileArray.length === 0) return;
    setFiles((prev) => [...prev, ...fileArray]);
    setUploadState('idle');
    setErrorMsg('');
  }, []);

  const clearFiles = () => {
    setFiles([]);
    setUploadState('idle');
    setProgress(0);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  /* ── Drag & drop ── */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length) addFiles(droppedFiles);
  };

  /* ── Upload ── */
  async function handleUpload() {
    if (files.length === 0) return;

    setUploadState('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      const result = await uploadFiles(files, sessionName || undefined, (pct) => {
        setProgress(pct);
      });

      setUploadState('processing');

      // Small delay to show processing state, then redirect
      await new Promise((r) => setTimeout(r, 800));
      setUploadState('completed');

      const sessionId = result.sessionId || result.session_id || result.id;
      if (sessionId) {
        setTimeout(() => navigate(`/dashboard/${sessionId}`), 500);
      }
    } catch (err) {
      setUploadState('error');
      setErrorMsg(err?.response?.data?.message || err?.message || 'Upload failed. Please try again.');
    }
  }

  /* ── Delete session ── */
  async function handleDeleteSession(id) {
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => (s.sessionId || s.id) !== id));
      setDeleteConfirmId(null);
    } catch {
      /* ignore */
    }
  }

  /* ── Derived ── */
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const displayFiles = files.slice(0, 50);
  const extraCount = Math.max(0, files.length - 50);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent-emerald/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent-teal/4 blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        {/* ─── Header ─── */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-6"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Upload Files for <span className="gradient-text">Analysis</span>
          </h1>
          <p className="text-white/50 max-w-lg">
            Drop your files or folders below and let EcoByte AI scan for digital waste, duplicates, and carbon impact.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ─── Main Upload Area ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Drop zone */}
            <motion.div
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
                isDragging
                  ? 'border-accent-emerald bg-accent-emerald/5 scale-[1.01]'
                  : 'border-white/15 hover:border-white/30 bg-white/[0.02]'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: uploadState === 'idle' ? 1.005 : 1 }}
            >
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <motion.div
                  animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <UploadCloud
                    size={48}
                    className={`mb-4 transition-colors ${isDragging ? 'text-accent-emerald' : 'text-white/30'}`}
                  />
                </motion.div>
                <p className="text-lg font-medium text-white/70 mb-1">
                  Drag & drop files here
                </p>
                <p className="text-sm text-white/40">or click to browse</p>
              </div>

              {/* Hidden inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
                onClick={(e) => e.stopPropagation()}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                // @ts-ignore
                webkitdirectory=""
                directory=""
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </motion.div>

            {/* Browse buttons */}
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-sm font-medium text-white/70 hover:text-white hover:border-white/20 transition-all"
              >
                <File size={16} />
                Browse Files
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-sm font-medium text-white/70 hover:text-white hover:border-white/20 transition-all"
              >
                <FolderOpen size={16} />
                Browse Folder
              </button>
            </motion.div>

            {/* Session name */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <label className="block text-sm font-medium text-white/60 mb-2">
                Session Name (optional)
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. Project Cleanup, Photo Archive..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent-emerald/40 focus:border-accent-emerald/40 transition-all text-sm"
              />
            </motion.div>

            {/* Selected files preview */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  className="glass rounded-2xl p-5"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-white">
                        {files.length} file{files.length !== 1 ? 's' : ''} selected
                      </span>
                      <span className="text-xs text-white/40 px-2 py-0.5 rounded-full bg-white/5">
                        {formatBytes(totalSize)}
                      </span>
                    </div>
                    <button
                      onClick={clearFiles}
                      className="text-xs text-white/40 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <X size={14} />
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                    {displayFiles.map((file, i) => (
                      <div
                        key={`${file.name}-${file.size}-${i}`}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors"
                      >
                        <FileText size={14} className="text-white/30 shrink-0" />
                        <span className="text-sm text-white/70 truncate flex-1">
                          {file.webkitRelativePath || file.name}
                        </span>
                        <span className="text-xs text-white/30 shrink-0">
                          {getExtension(file.name)}
                        </span>
                        <span className="text-xs text-white/30 shrink-0">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <div className="text-xs text-white/40 text-center py-2">
                        +{extraCount} more file{extraCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload / progress / status */}
            <div className="space-y-4">
              {/* Progress bar */}
              <AnimatePresence>
                {(uploadState === 'uploading' || uploadState === 'processing') && (
                  <motion.div
                    className="glass rounded-xl p-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {uploadState === 'uploading' ? (
                          <>
                            <Loader2 size={16} className="text-accent-emerald animate-spin" />
                            <span className="text-sm text-white/70">Uploading files...</span>
                          </>
                        ) : (
                          <>
                            <Loader2 size={16} className="text-accent-teal animate-spin" />
                            <span className="text-sm text-white/70">Processing & analyzing...</span>
                          </>
                        )}
                      </div>
                      <span className="text-sm font-mono text-white/50">
                        {uploadState === 'uploading' ? `${Math.round(progress)}%` : '✓ Uploaded'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-accent-emerald to-accent-teal"
                        initial={{ width: '0%' }}
                        animate={{
                          width: uploadState === 'processing' ? '100%' : `${progress}%`,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Completed */}
              <AnimatePresence>
                {uploadState === 'completed' && (
                  <motion.div
                    className="flex items-center gap-3 p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckCircle2 size={20} className="text-accent-emerald" />
                    <span className="text-sm text-white/80">Analysis complete! Redirecting to dashboard...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {uploadState === 'error' && (
                  <motion.div
                    className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle size={20} className="text-red-400" />
                      <span className="text-sm text-white/80">{errorMsg}</span>
                    </div>
                    <button
                      onClick={handleUpload}
                      className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      Retry
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload button */}
              <motion.button
                onClick={handleUpload}
                disabled={files.length === 0 || uploadState === 'uploading' || uploadState === 'processing' || uploadState === 'completed'}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-accent-emerald to-accent-green text-surface-900 font-semibold text-base shadow-lg shadow-accent-emerald/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-accent-emerald/40 transition-all duration-300"
                whileHover={files.length > 0 && uploadState === 'idle' ? { scale: 1.01 } : {}}
                whileTap={files.length > 0 && uploadState === 'idle' ? { scale: 0.99 } : {}}
              >
                {uploadState === 'uploading' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : uploadState === 'processing' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <BarChart3 size={18} />
                    Analyze Files
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* ─── Sidebar: Past Sessions ─── */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
              <Clock size={18} className="text-white/40" />
              Recent Sessions
            </h2>

            {sessions.length === 0 ? (
              <div className="glass rounded-xl p-6 text-center">
                <p className="text-sm text-white/40">No past sessions yet</p>
                <p className="text-xs text-white/25 mt-1">Upload files to start your first analysis</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session) => {
                  const id = session.sessionId || session.id;
                  const name = session.sessionName || session.name || 'Unnamed Session';
                  const date = session.createdAt || session.created_at || session.date;
                  const fileCount = session.fileCount || session.totalFiles || session.summary?.totalFiles || 0;
                  const wasteScore = session.wasteScore?.overallScore ?? session.wasteScore ?? null;

                  return (
                    <div key={id} className="relative group">
                      <Link
                        to={`/dashboard/${id}`}
                        className="block glass rounded-xl p-4 hover:border-white/20 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-medium text-white/80 truncate pr-6">{name}</h3>
                          <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0 mt-0.5" />
                        </div>
                        {date && (
                          <p className="text-xs text-white/30 mb-2">{formatDate(date)}</p>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/40">
                            {fileCount} file{fileCount !== 1 ? 's' : ''}
                          </span>
                          {wasteScore != null && (
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                wasteScore >= 70
                                  ? 'bg-red-500/15 text-red-400'
                                  : wasteScore >= 40
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-emerald-500/15 text-emerald-400'
                              }`}
                            >
                              Score: {Math.round(wasteScore)}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Delete button */}
                      <div className="absolute top-3 right-10">
                        {deleteConfirmId === id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteSession(id);
                              }}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors px-1.5 py-0.5 rounded bg-red-500/10"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setDeleteConfirmId(null);
                              }}
                              className="text-xs text-white/40 hover:text-white/60 transition-colors px-1.5 py-0.5"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setDeleteConfirmId(id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                            title="Delete session"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
