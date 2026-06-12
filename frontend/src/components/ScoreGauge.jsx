import { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion';

/* ── Color palette per grade ────────────────────────── */

const GRADE_PALETTE = {
  A: { stroke: '#34d399', glow: 'rgba(52,211,153,0.35)', text: 'text-emerald-400' },
  B: { stroke: '#4ade80', glow: 'rgba(74,222,128,0.30)', text: 'text-green-400' },
  C: { stroke: '#fbbf24', glow: 'rgba(251,191,36,0.30)', text: 'text-amber-400' },
  D: { stroke: '#fb923c', glow: 'rgba(251,146,60,0.30)', text: 'text-orange-400' },
  F: { stroke: '#f87171', glow: 'rgba(248,113,113,0.35)', text: 'text-red-400' },
};

function getPalette(grade) {
  return GRADE_PALETTE[grade?.toUpperCase()] || GRADE_PALETTE.C;
}

/* ── Animated number readout ────────────────────────── */

function AnimatedScore({ target }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(mv, target, {
      duration: 1.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    });
    return controls.stop;
  }, [mv, target]);

  return <motion.tspan>{display}</motion.tspan>;
}

/* ── Main component ─────────────────────────────────── */

export default function ScoreGauge({ score = 0, grade = 'C', label = 'Digital Waste Score' }) {
  const palette = getPalette(grade);

  const RADIUS = 80;
  const STROKE = 8;
  const SIZE = (RADIUS + STROKE) * 2;
  const CENTER = SIZE / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const clampedScore = Math.max(0, Math.min(100, score));
  const targetOffset = CIRCUMFERENCE * (1 - clampedScore / 100);

  /* motion values for the arc animation */
  const mvOffset = useMotionValue(CIRCUMFERENCE);

  useEffect(() => {
    const controls = animate(mvOffset, targetOffset, {
      duration: 1.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    });
    return controls.stop;
  }, [mvOffset, targetOffset]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`,
          }}
        />

        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="relative -rotate-90"
        >
          {/* Track */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />

          {/* Filled arc */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={palette.stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            style={{ strokeDashoffset: mvOffset }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold tracking-tight ${palette.text}`}>
            {Math.round(clampedScore)}
          </span>
          <span
            className={`mt-0.5 text-lg font-bold ${palette.text} opacity-80`}
          >
            {grade?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Label */}
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
}
