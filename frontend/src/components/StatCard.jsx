import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const COLOR_MAP = {
  emerald: {
    bg: 'bg-emerald-400/10',
    text: 'text-emerald-400',
    ring: 'ring-emerald-400/20',
  },
  blue: {
    bg: 'bg-blue-400/10',
    text: 'text-blue-400',
    ring: 'ring-blue-400/20',
  },
  amber: {
    bg: 'bg-amber-400/10',
    text: 'text-amber-400',
    ring: 'ring-amber-400/20',
  },
  red: {
    bg: 'bg-red-400/10',
    text: 'text-red-400',
    ring: 'ring-red-400/20',
  },
  teal: {
    bg: 'bg-teal-400/10',
    text: 'text-teal-400',
    ring: 'ring-teal-400/20',
  },
  violet: {
    bg: 'bg-violet-400/10',
    text: 'text-violet-400',
    ring: 'ring-violet-400/20',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = 'emerald',
  delay = 0,
}) {
  const palette = COLOR_MAP[color] || COLOR_MAP.emerald;

  const trendPositive = typeof trend === 'number' && trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-md transition-all duration-300 hover:border-white/10 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-black/20"
    >
      {/* subtle gradient shimmer on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${palette.bg} ring-1 ${palette.ring}`}
          >
            <Icon className={`h-5 w-5 ${palette.text}`} />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-gray-500">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {value}
          </p>

          {/* Subtitle or Trend */}
          {trend !== undefined && trend !== null ? (
            <div className="mt-1.5 flex items-center gap-1.5 text-sm">
              {trendPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              )}
              <span
                className={
                  trendPositive ? 'text-emerald-400' : 'text-red-400'
                }
              >
                {trendPositive ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-gray-500">{trendLabel}</span>
              )}
            </div>
          ) : subtitle ? (
            <p className="mt-1.5 truncate text-sm text-gray-500">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
