import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

// ── Bar colors ─────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Duplicates: '#34d399',
  Inactive: '#f59e0b',
  'Large Unused': '#f43f5e',
};

// ── Custom tooltip ─────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const { value } = payload[0];

  return (
    <div className="bg-surface-800/95 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl px-4 py-3 min-w-[150px]">
      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-lg font-semibold text-white">
        {value.toFixed(1)}
        <span className="text-sm font-normal text-white/40 ml-1">pts</span>
      </p>
    </div>
  );
}

// ── Score badge ────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const level =
    score >= 70 ? { label: 'High', color: 'text-red-400 bg-red-400/10' } :
    score >= 40 ? { label: 'Medium', color: 'text-amber-400 bg-amber-400/10' } :
                  { label: 'Low', color: 'text-emerald-400 bg-emerald-400/10' };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${level.color}`}
    >
      {level.label}
    </span>
  );
}

// ── Custom bar shape with rounded top ──────────────────────────────
function RoundedBar(props) {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;

  const radius = Math.min(6, width / 2, height);

  return (
    <g>
      <defs>
        <linearGradient id={`barGrad-${fill}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.95} />
          <stop offset="100%" stopColor={fill} stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <path
        d={`
          M${x},${y + height}
          L${x},${y + radius}
          Q${x},${y} ${x + radius},${y}
          L${x + width - radius},${y}
          Q${x + width},${y} ${x + width},${y + radius}
          L${x + width},${y + height}
          Z
        `}
        fill={`url(#barGrad-${fill})`}
      />
    </g>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function WasteBarChart({ wasteScore }) {
  const { chartData, overall, isEmpty } = useMemo(() => {
    const ws = wasteScore ?? {};
    const duplicateScore = ws.duplicateScore ?? 0;
    const inactiveScore = ws.inactiveScore ?? 0;
    const largeUnusedScore = ws.largeUnusedScore ?? 0;
    const overallScore = ws.overallScore ?? 0;

    const data = [
      { name: 'Duplicates', score: duplicateScore, color: CATEGORY_COLORS.Duplicates },
      { name: 'Inactive', score: inactiveScore, color: CATEGORY_COLORS.Inactive },
      { name: 'Large Unused', score: largeUnusedScore, color: CATEGORY_COLORS['Large Unused'] },
    ];

    return {
      chartData: data,
      overall: overallScore,
      isEmpty: duplicateScore === 0 && inactiveScore === 0 && largeUnusedScore === 0,
    };
  }, [wasteScore]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-emerald/10">
            <BarChart3 className="w-4.5 h-4.5 text-accent-emerald" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Waste Score Breakdown
            </h3>
            <p className="text-xs text-white/40">
              Overall score:{' '}
              <span className="text-white/70 font-medium">
                {overall.toFixed(1)}
              </span>
              <span className="text-white/30"> / 100</span>
            </p>
          </div>
        </div>
        <ScoreBadge score={overall} />
      </div>

      {/* Chart or empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[350px] gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white/20" />
          </div>
          <p className="text-sm text-white/30">No waste detected</p>
          <p className="text-xs text-white/20">
            Your storage looks clean!
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              domain={[0, (max) => Math.max(max * 1.2, 10)]}
              allowDecimals={false}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              wrapperStyle={{ outline: 'none' }}
            />

            <Bar
              dataKey="score"
              shape={<RoundedBar />}
              animationBegin={300}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
