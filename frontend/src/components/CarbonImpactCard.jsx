import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Cloud, Leaf, TreePine } from 'lucide-react';

// ── Metric row component ───────────────────────────────────────────
function MetricRow({ icon: Icon, label, value, unit, highlight, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + delay * 0.1, ease: 'easeOut' }}
      className={`flex items-center justify-between py-3.5 px-4 rounded-xl transition-colors ${
        highlight
          ? 'bg-accent-emerald/8 border border-accent-emerald/15'
          : 'bg-white/[0.02] hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-lg ${
            highlight ? 'bg-accent-emerald/15' : 'bg-white/5'
          }`}
        >
          <Icon
            className={`w-4 h-4 ${
              highlight ? 'text-accent-emerald' : 'text-white/50'
            }`}
          />
        </div>
        <span className="text-sm text-white/60">{label}</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-base font-semibold tabular-nums ${
            highlight ? 'text-accent-emerald' : 'text-white'
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs text-white/30 font-medium">{unit}</span>
        )}
      </div>
    </motion.div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────
function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return '0.00';
  return Number(n).toFixed(decimals);
}

function fmtInt(n) {
  if (n == null || isNaN(n)) return '0';
  return Math.round(Number(n)).toLocaleString();
}

// ── Main component ─────────────────────────────────────────────────
export default function CarbonImpactCard({ carbonImpact }) {
  const ci = carbonImpact ?? {};

  const totalStorageGB = ci.totalStorageGB ?? 0;
  const wasteStorageGB = ci.wasteStorageGB ?? 0;
  const totalCO2KgPerYear = ci.totalCO2KgPerYear ?? 0;
  const recoverableCO2KgPerYear = ci.recoverableCO2KgPerYear ?? 0;
  const equivalentTreesNeeded = ci.equivalentTreesNeeded ?? 0;

  const wasteRatio = useMemo(() => {
    if (!totalStorageGB || totalStorageGB === 0) return 0;
    return Math.min((wasteStorageGB / totalStorageGB) * 100, 100);
  }, [totalStorageGB, wasteStorageGB]);

  const metrics = [
    {
      icon: HardDrive,
      label: 'Total Storage',
      value: fmt(totalStorageGB),
      unit: 'GB',
      highlight: false,
    },
    {
      icon: Cloud,
      label: 'Current CO₂ Impact',
      value: fmt(totalCO2KgPerYear),
      unit: 'kg/yr',
      highlight: false,
    },
    {
      icon: Leaf,
      label: 'Recoverable CO₂',
      value: fmt(recoverableCO2KgPerYear),
      unit: 'kg/yr',
      highlight: true,
    },
    {
      icon: TreePine,
      label: 'Trees Needed',
      value: fmtInt(equivalentTreesNeeded),
      unit: 'trees',
      highlight: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative glass rounded-2xl p-6 overflow-hidden"
    >
      {/* Emerald gradient accent – top border */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent-emerald/80 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-emerald/10">
          <Leaf className="w-4.5 h-4.5 text-accent-emerald" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Environmental Impact
          </h3>
          <p className="text-xs text-white/40">
            Carbon footprint analysis
          </p>
        </div>
      </div>

      {/* Metric rows */}
      <div className="flex flex-col gap-2 mb-6">
        {metrics.map((m, i) => (
          <MetricRow key={m.label} {...m} delay={i} />
        ))}
      </div>

      {/* Waste ratio visualization */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs text-white/40">Waste Ratio</span>
          <span className="text-xs font-medium text-white/60 tabular-nums">
            {fmt(wasteStorageGB)} <span className="text-white/30">of</span>{' '}
            {fmt(totalStorageGB)} GB
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-2.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${wasteRatio}%` }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, #34d399 0%, ${
                wasteRatio > 50 ? '#ef4444' : '#f59e0b'
              } 100%)`,
            }}
          />
        </div>

        <p className="text-[11px] text-white/25 mt-2">
          {wasteRatio.toFixed(1)}% of your storage is classified as waste
        </p>
      </div>
    </motion.div>
  );
}
