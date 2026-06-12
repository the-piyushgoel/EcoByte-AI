import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

/* ── Skeleton loader ────────────────────────────────── */

function Skeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border-l-2 border-white/5 bg-white/[0.02] p-4"
        >
          <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/5" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Container animation variants ───────────────────── */

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── Main component ─────────────────────────────────── */

export default function RecommendationList({
  recommendations = [],
  loading = false,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/5 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10">
          <Lightbulb className="h-4 w-4 text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Recommendations</h3>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading ? (
          <Skeleton />
        ) : recommendations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-gray-500">
            <Lightbulb className="h-8 w-8 text-gray-600" />
            <p className="text-sm font-medium">
              No recommendations generated yet.
            </p>
          </div>
        ) : (
          <motion.ul
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2.5"
          >
            {recommendations.map((rec, idx) => {
              const text = typeof rec === 'string' ? rec : rec?.text ?? '';
              return (
                <motion.li
                  key={idx}
                  variants={itemVariants}
                  className="group rounded-xl border-l-2 border-emerald-500/60 bg-white/[0.02] px-4 py-3 transition-colors duration-200 hover:bg-white/[0.05]"
                >
                  <p className="text-sm leading-relaxed text-gray-300 group-hover:text-gray-200">
                    {text}
                  </p>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
