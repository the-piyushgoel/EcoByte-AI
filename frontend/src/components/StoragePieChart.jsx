import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { PieChart as PieIcon } from 'lucide-react';

// ── Color palette ──────────────────────────────────────────────────
const COLORS = {
  active: '#34d399',
  archive: '#f59e0b',
  waste: '#ef4444',
};

const SEGMENT_META = [
  { key: 'active', label: 'Active', color: COLORS.active },
  { key: 'archive', label: 'Archive', color: COLORS.archive },
  { key: 'waste', label: 'Waste', color: COLORS.waste },
];

// ── Custom tooltip ─────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const { name, value, payload: entry } = payload[0];
  const total = entry?.total ?? 1;
  const pct = ((value / total) * 100).toFixed(1);

  return (
    <div className="bg-surface-800/95 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl px-4 py-3 min-w-[160px]">
      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
        {name}
      </p>
      <p className="text-lg font-semibold text-white">
        {value.toLocaleString()}{' '}
        <span className="text-sm font-normal text-white/40">files</span>
      </p>
      <p className="text-xs text-white/40 mt-0.5">{pct}% of total</p>
    </div>
  );
}

// ── Custom legend ──────────────────────────────────────────────────
function CustomLegend({ payload }) {
  if (!payload?.length) return null;

  return (
    <div className="flex items-center justify-center gap-6 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-white/60">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Inner percentage label ─────────────────────────────────────────
function renderCenterLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
      fill="#ffffff"
      style={{ pointerEvents: 'none' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function StoragePieChart({ summary }) {
  const { data, total, isEmpty } = useMemo(() => {
    const s = summary ?? {};
    const activeCount = s.activeCount ?? 0;
    const archiveCount = s.archiveCount ?? 0;
    const wasteCount = s.wasteCount ?? 0;
    const totalFiles = s.totalFiles ?? activeCount + archiveCount + wasteCount;

    const chartData = SEGMENT_META.map(({ key, label, color }) => {
      const valueMap = { active: activeCount, archive: archiveCount, waste: wasteCount };
      return { name: label, value: valueMap[key], color, total: totalFiles };
    });

    return {
      data: chartData,
      total: totalFiles,
      isEmpty: totalFiles === 0,
    };
  }, [summary]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-emerald/10">
          <PieIcon className="w-4.5 h-4.5 text-accent-emerald" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Storage Classification
          </h3>
          <p className="text-xs text-white/40">
            {total.toLocaleString()} total files
          </p>
        </div>
      </div>

      {/* Chart or empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[350px] gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
            <PieIcon className="w-6 h-6 text-white/20" />
          </div>
          <p className="text-sm text-white/30">No data available</p>
          <p className="text-xs text-white/20">
            Upload files to see storage classification
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={120}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              animationBegin={200}
              animationDuration={1200}
              animationEasing="ease-out"
              label={renderCenterLabel}
              labelLine={false}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={entry.color}
                  fillOpacity={0.85}
                  className="transition-opacity hover:opacity-100"
                />
              ))}
            </Pie>

            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ outline: 'none' }}
            />

            <Legend
              content={<CustomLegend />}
              verticalAlign="bottom"
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
