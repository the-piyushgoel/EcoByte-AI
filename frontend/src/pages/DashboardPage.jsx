import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Files,
  Copy,
  Clock,
  HardDrive,
  ArrowDownToLine,
  Leaf,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileWarning,
} from 'lucide-react';
import {
  getSessionById,
  getSessionDuplicates,
  deleteSession,
} from '../api/analysisApi';
import ScoreGauge from '../components/ScoreGauge';
import StoragePieChart from '../components/StoragePieChart';
import WasteBarChart from '../components/WasteBarChart';
import CarbonImpactCard from '../components/CarbonImpactCard';
import StorageRecoveryCard from '../components/StorageRecoveryCard';
import RecommendationList from '../components/RecommendationList';
import AiInsightsCard from '../components/AiInsightsCard';
import FileTable from '../components/FileTable';
function formatMB(mb) {
  if (mb == null || isNaN(mb)) return '0 MB';
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
  return parseFloat(mb).toFixed(1) + ' MB';
}
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function getGradeInfo(wasteScoreObj) {
  const score = wasteScoreObj?.overallScore ?? 0;
  const grade = wasteScoreObj?.grade ?? 'A';
  const label = wasteScoreObj?.label ?? 'Excellent';

  const colorMap = {
    A: 'text-emerald-400',
    B: 'text-green-400',
    C: 'text-amber-400',
    D: 'text-orange-400',
    F: 'text-red-400',
  };
  const descMap = {
    A: 'Your digital footprint is very clean!',
    B: 'Mostly clean with minor improvements possible.',
    C: 'Some digital waste detected. Review recommendations.',
    D: 'Significant waste found. Action recommended.',
    F: 'Heavy digital waste. Immediate cleanup recommended.',
  };

  return {
    score,
    grade,
    label,
    color: colorMap[grade] || 'text-white/50',
    desc: descMap[grade] || 'No data available.',
  };
}
function StatCard({ icon: Icon, label, value, subValue, color = 'text-accent-emerald', delay = 0 }) {
  const bgMap = {
    'text-accent-emerald': 'bg-emerald-500/15',
    'text-red-400': 'bg-red-500/15',
    'text-amber-400': 'bg-amber-500/15',
    'text-blue-400': 'bg-blue-500/15',
    'text-emerald-400': 'bg-emerald-500/15',
    'text-teal-400': 'bg-teal-500/15',
  };
  return (
    <motion.div
      className="glass rounded-2xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgMap[color] || 'bg-white/10'}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
      {subValue && <div className="text-xs text-white/30 mt-1">{subValue}</div>}
    </motion.div>
  );
}
function FilterTab({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30'
          : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
      }`}
    >
      {label}
      {count != null && (
        <span
          className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            active ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-white/5 text-white/30'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
export default function DashboardPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [duplicates, setDuplicates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [fileFilter, setFileFilter] = useState('all');
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getSessionById(sessionId),
      getSessionDuplicates(sessionId).catch(() => null),
    ])
      .then(([sessionData, dupsData]) => {
        if (!sessionData) {
          setError('Session not found');
          return;
        }
        setSession(sessionData);
        setDuplicates(dupsData);
      })
      .catch((err) => {
        setError(err?.response?.status === 404 ? 'Session not found' : 'Failed to load session data');
      })
      .finally(() => setLoading(false));
  }, [sessionId]);
  async function handleDelete() {
    try {
      await deleteSession(sessionId);
      navigate('/upload');
    } catch {
    }
  }
  const summary = session?.summary || {};
  const wasteScore = session?.wasteScore || {};
  const files = session?.files || [];
  const carbonImpact = session?.carbonImpact || {};
  const storageRecovery = session?.storageRecovery || {};
  const recommendations = session?.recommendations || [];
  const aiAnalysis = session?.aiAnalysis || null;
  const gradeInfo = getGradeInfo(wasteScore);
  const normalizedFiles = useMemo(() => {
    return files.map((f) => ({
      ...f,
      name: f.originalName || f.name || 'unknown',
      extension: f.extension || '',
      size: f.sizeBytes ?? f.size ?? 0,
      lastModified: f.modifiedAt || f.lastModified || f.modifiedDate || null,
      classification: f.classification || 'active',
      isDuplicate: f.isDuplicate || false,
      isInactive: f.isInactive || false,
    }));
  }, [files]);
  const filteredFiles = useMemo(() => {
    if (!normalizedFiles.length) return [];
    switch (fileFilter) {
      case 'active':
        return normalizedFiles.filter((f) => f.classification === 'active');
      case 'archive':
        return normalizedFiles.filter((f) => f.classification === 'archive');
      case 'waste':
        return normalizedFiles.filter((f) => f.classification === 'waste');
      case 'duplicates':
        return normalizedFiles.filter((f) => f.isDuplicate === true);
      default:
        return normalizedFiles;
    }
  }, [normalizedFiles, fileFilter]);

  const fileCounts = useMemo(() => {
    const counts = { all: normalizedFiles.length, active: 0, archive: 0, waste: 0, duplicates: 0 };
    normalizedFiles.forEach((f) => {
      const cls = f.classification || '';
      if (cls === 'active') counts.active++;
      if (cls === 'archive') counts.archive++;
      if (cls === 'waste') counts.waste++;
      if (f.isDuplicate) counts.duplicates++;
    });
    return counts;
  }, [normalizedFiles]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 size={40} className="text-accent-emerald animate-spin" />
          <p className="text-white/50 text-sm">Loading analysis data...</p>
        </motion.div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          className="glass rounded-2xl p-10 text-center max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-5">
            {error === 'Session not found' ? (
              <FileWarning size={32} className="text-red-400" />
            ) : (
              <AlertCircle size={32} className="text-red-400" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {error === 'Session not found' ? 'Session Not Found' : 'Error'}
          </h2>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-emerald to-accent-green text-surface-900 font-semibold text-sm"
          >
            <ArrowLeft size={16} />
            Back to Upload
          </Link>
        </motion.div>
      </div>
    );
  }
  const sessionName = session?.sessionName || 'Analysis Session';
  const sessionDate = session?.createdAt;
  const sessionStatus = session?.status || 'completed';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent-emerald/4 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent-teal/3 blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-3"
              >
                <ArrowLeft size={14} />
                Back to Upload
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{sessionName}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${
                  sessionStatus === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : sessionStatus === 'processing'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                {sessionStatus.charAt(0).toUpperCase() + sessionStatus.slice(1)}
              </span>
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="text-white/30 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                  title="Delete session"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {sessionDate && (
            <p className="text-sm text-white/30">{formatDate(sessionDate)}</p>
          )}
        </motion.div>
        <motion.div
          className="glass rounded-2xl p-6 sm:p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="shrink-0">
              <ScoreGauge
                score={gradeInfo.score}
                grade={gradeInfo.grade}
                label="Digital Waste Score"
              />
            </div>
            <div className="text-center sm:text-left">
              <div className={`text-3xl font-bold mb-1 ${gradeInfo.color}`}>{gradeInfo.label}</div>
              <p className="text-white/50 text-sm leading-relaxed max-w-md">{gradeInfo.desc}</p>
              <p className="text-white/30 text-xs mt-2">
                Waste Score: {gradeInfo.score} / 100
              </p>
            </div>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={Files}
            label="Total Files"
            value={summary.totalFiles ?? files.length ?? 0}
            color="text-accent-emerald"
            delay={0.15}
          />
          <StatCard
            icon={Copy}
            label="Duplicate Files"
            value={summary.duplicateCount ?? 0}
            color="text-red-400"
            delay={0.2}
          />
          <StatCard
            icon={Clock}
            label="Inactive Files"
            value={summary.inactiveCount ?? 0}
            color="text-amber-400"
            delay={0.25}
          />
          <StatCard
            icon={HardDrive}
            label="Storage Used"
            value={formatMB(summary.totalSizeMB)}
            color="text-blue-400"
            delay={0.3}
          />
          <StatCard
            icon={ArrowDownToLine}
            label="Recoverable Space"
            value={formatMB(storageRecovery.totalRecoverableMB)}
            color="text-emerald-400"
            delay={0.35}
          />
          <StatCard
            icon={Leaf}
            label="CO₂ Saveable"
            value={`${parseFloat(carbonImpact.recoverableCO2KgPerYear || 0).toFixed(2)} kg/yr`}
            color="text-teal-400"
            delay={0.4}
          />
        </div>
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StoragePieChart summary={summary} />
          <WasteBarChart wasteScore={wasteScore} />
        </motion.div>
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CarbonImpactCard carbonImpact={carbonImpact} />
          <StorageRecoveryCard storageRecovery={storageRecovery} />
        </motion.div>
        {aiAnalysis && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <AiInsightsCard aiAnalysis={aiAnalysis} files={normalizedFiles} />
          </motion.div>
        )}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <RecommendationList recommendations={recommendations} />
        </motion.div>
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-white">Files</h3>
            <div className="flex flex-wrap gap-2">
              <FilterTab
                label="All"
                count={fileCounts.all}
                active={fileFilter === 'all'}
                onClick={() => setFileFilter('all')}
              />
              <FilterTab
                label="Active"
                count={fileCounts.active}
                active={fileFilter === 'active'}
                onClick={() => setFileFilter('active')}
              />
              <FilterTab
                label="Archive"
                count={fileCounts.archive}
                active={fileFilter === 'archive'}
                onClick={() => setFileFilter('archive')}
              />
              <FilterTab
                label="Waste"
                count={fileCounts.waste}
                active={fileFilter === 'waste'}
                onClick={() => setFileFilter('waste')}
              />
              <FilterTab
                label="Duplicates"
                count={fileCounts.duplicates}
                active={fileFilter === 'duplicates'}
                onClick={() => setFileFilter('duplicates')}
              />
            </div>
          </div>
          <FileTable files={filteredFiles} />
          <p className="text-xs text-white/25 mt-3">
            Showing {filteredFiles.length} of {normalizedFiles.length} file{normalizedFiles.length !== 1 ? 's' : ''}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
