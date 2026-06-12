import React from 'react';
import { motion, animate, motionValue } from 'framer-motion';
import { Recycle, Copy, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

// ── Animated counter hook ──────────────────────────────────────────
function useAnimatedCounter(target, duration = 1.5, delay = 0.4) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const mv = motionValue(0);
    const unsubscribe = mv.on('change', (v) =>
      setDisplay(parseFloat(v.toFixed(2)))
    );

    const controls = animate(mv, target, {
      duration,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94],
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [target, duration, delay]);

  return display;
}

// ── Breakdown row ──────────────────────────────────────────────────
function BreakdownRow({ icon: Icon, label, valueMB, color, delay }) {
  const formatted =
    valueMB >= 1024
      ? `${(valueMB / 1024).toFixed(2)} GB`
      : `${valueMB.toFixed(2)} MB`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white tabular-nums">
        {formatted}
      </span>
    </motion.div>
  );
}

// ── Format helpers ─────────────────────────────────────────────────
function safeNum(n) {
  return n != null && !isNaN(n) ? Number(n) : 0;
}

// ── Main component ─────────────────────────────────────────────────
export default function StorageRecoveryCard({ storageRecovery }) {
  const sr = storageRecovery ?? {};

  const duplicateSizeMB = safeNum(sr.duplicateSizeMB);
  const duplicateSizeGB = safeNum(sr.duplicateSizeGB);
  const inactiveSizeMB = safeNum(sr.inactiveSizeMB);
  const inactiveSizeGB = safeNum(sr.inactiveSizeGB);
  const totalRecoverableMB = safeNum(sr.totalRecoverableMB);
  const totalRecoverableGB = safeNum(sr.totalRecoverableGB);

  const showGB = totalRecoverableGB >= 1;
  const heroTarget = showGB ? totalRecoverableGB : totalRecoverableMB;
  const heroUnit = showGB ? 'GB' : 'MB';

  const animatedValue = useAnimatedCounter(heroTarget, 1.5, 0.4);

  // Compute recoverable percentage (of total = recoverable + remaining)
  // We don't have "total" in storageRecovery, so show a ratio bar
  // based on duplicate vs inactive contribution
  const totalRecoverable = duplicateSizeMB + inactiveSizeMB;
  const dupPercent = totalRecoverable > 0
    ? (duplicateSizeMB / totalRecoverable) * 100
    : 0;
  const inactivePercent = totalRecoverable > 0
    ? (inactiveSizeMB / totalRecoverable) * 100
    : 0;

  const isEmpty = totalRecoverableMB === 0 && totalRecoverableGB === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative glass rounded-2xl p-6 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-emerald/10">
          <Recycle className="w-4.5 h-4.5 text-accent-emerald" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Storage Recovery Potential
          </h3>
          <p className="text-xs text-white/40">
            Space you can reclaim
          </p>
        </div>
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
            <Recycle className="w-6 h-6 text-white/20" />
          </div>
          <p className="text-sm text-white/30">Nothing to recover</p>
          <p className="text-xs text-white/20">
            Your storage is fully optimized
          </p>
        </div>
      ) : (
        <>
          {/* Hero number */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            >
              <span className="text-5xl font-bold tracking-tight gradient-text tabular-nums">
                {animatedValue.toFixed(2)}
              </span>
              <span className="text-xl font-medium text-white/40 ml-2">
                {heroUnit}
              </span>
            </motion.div>
            <p className="text-xs text-white/30 mt-2">
              total recoverable storage
            </p>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />

          {/* Breakdown items */}
          <div className="flex flex-col gap-2 mb-5">
            <BreakdownRow
              icon={Copy}
              label="From Duplicates"
              valueMB={duplicateSizeMB}
              color="#34d399"
              delay={0.5}
            />
            <BreakdownRow
              icon={Clock}
              label="From Inactive"
              valueMB={inactiveSizeMB}
              color="#f59e0b"
              delay={0.6}
            />
          </div>

          {/* Stacked recovery bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40">Recovery breakdown</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-white/5 overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dupPercent}%` }}
                transition={{ duration: 1, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="h-full bg-accent-emerald rounded-l-full"
                style={{ minWidth: dupPercent > 0 ? '2px' : 0 }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${inactivePercent}%` }}
                transition={{ duration: 1, delay: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="h-full bg-warning rounded-r-full"
                style={{ minWidth: inactivePercent > 0 ? '2px' : 0 }}
              />
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-emerald" />
                <span className="text-[11px] text-white/40">
                  Duplicates ({dupPercent.toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-[11px] text-white/40">
                  Inactive ({inactivePercent.toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
