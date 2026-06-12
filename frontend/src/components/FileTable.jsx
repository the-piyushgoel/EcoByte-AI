import { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Clock,
  FileText,
  Inbox,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Helpers ────────────────────────────────────────── */

function formatBytes(bytes) {
  if (bytes == null || isNaN(bytes)) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val < 10 ? val.toFixed(2) : val < 100 ? val.toFixed(1) : Math.round(val)} ${units[i]}`;
}

function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '—';
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 0) return 'just now';

  const minutes = Math.floor(diffSec / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

const BADGE_COLORS = {
  active: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
  archive: 'bg-amber-400/10 text-amber-400 ring-amber-400/20',
  waste: 'bg-red-400/10 text-red-400 ring-red-400/20',
};

function ClassBadge({ classification }) {
  const cls = classification?.toLowerCase() ?? '';
  const palette = BADGE_COLORS[cls] || 'bg-gray-400/10 text-gray-400 ring-gray-400/20';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${palette}`}
    >
      {classification || 'unknown'}
    </span>
  );
}

/* ── Column config ──────────────────────────────────── */

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'extension', label: 'Extension', sortable: true },
  { key: 'size', label: 'Size', sortable: true, align: 'right' },
  { key: 'lastModified', label: 'Modified', sortable: true },
  { key: 'classification', label: 'Status', sortable: true },
  { key: 'flags', label: 'Flags', sortable: false },
];

/* ── Skeleton ───────────────────────────────────────── */

function SkeletonRows({ count = 6 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="border-t border-white/5">
      {COLUMNS.map((col) => (
        <td key={col.key} className="px-4 py-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/5" />
        </td>
      ))}
    </tr>
  ));
}

/* ── Main component ─────────────────────────────────── */

export default function FileTable({ files = [], loading = false }) {
  const [sortKey, setSortKey] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key) => {
    if (!COLUMNS.find((c) => c.key === key)?.sortable) return;
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = useMemo(() => {
    if (!files.length) return [];
    const arr = [...files];
    arr.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      // normalize
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [files, sortKey, sortAsc]);

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey)
      return <ArrowUpDown className="ml-1 inline h-3 w-3 text-gray-600" />;
    return sortAsc ? (
      <ArrowUp className="ml-1 inline h-3 w-3 text-emerald-400" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3 text-emerald-400" />
    );
  };

  /* ── Render ──────────────────────── */

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                    col.sortable
                      ? 'cursor-pointer select-none transition-colors hover:text-gray-300'
                      : ''
                  } ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.label}
                  {col.sortable && <SortIcon colKey={col.key} />}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Inbox className="h-10 w-10 text-gray-600" />
                    <p className="text-sm font-medium">No files found</p>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence mode="popLayout">
                {sorted.map((file, idx) => (
                  <motion.tr
                    key={file.id ?? file.name ?? idx}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-gray-500" />
                        <span className="truncate font-medium text-gray-200">
                          {file.name}
                        </span>
                      </div>
                    </td>

                    {/* Extension */}
                    <td className="px-4 py-3">
                      <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-gray-400">
                        {file.extension || '—'}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                      {formatBytes(file.size)}
                    </td>

                    {/* Modified */}
                    <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                      {relativeTime(file.lastModified)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <ClassBadge classification={file.classification} />
                    </td>

                    {/* Flags */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {file.isDuplicate && (
                          <span
                            title="Duplicate file"
                            className="flex items-center gap-1 rounded bg-amber-400/10 px-1.5 py-0.5 text-xs text-amber-400"
                          >
                            <Copy className="h-3 w-3" />
                          </span>
                        )}
                        {file.isInactive && (
                          <span
                            title="Inactive file"
                            className="flex items-center gap-1 rounded bg-blue-400/10 px-1.5 py-0.5 text-xs text-blue-400"
                          >
                            <Clock className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
