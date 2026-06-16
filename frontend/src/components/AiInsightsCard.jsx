import { motion } from 'framer-motion';
import { Brain, ShieldAlert, ShieldCheck, Shield, AlertTriangle, Sparkles } from 'lucide-react';

const RISK_CONFIG = {
  Critical: { color: 'text-red-400', bg: 'bg-red-500/15', ring: 'ring-red-400/30', icon: AlertTriangle },
  High: { color: 'text-orange-400', bg: 'bg-orange-500/15', ring: 'ring-orange-400/30', icon: ShieldAlert },
  Medium: { color: 'text-amber-400', bg: 'bg-amber-500/15', ring: 'ring-amber-400/30', icon: Shield },
  Low: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', ring: 'ring-emerald-400/30', icon: ShieldCheck },
};

function RiskBadge({ risk }) {
  const cfg = RISK_CONFIG[risk] || RISK_CONFIG.Low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ring-1 ring-inset ${cfg.color} ${cfg.bg} ${cfg.ring}`}>
      <cfg.icon className="w-3.5 h-3.5" />
      {risk}
    </span>
  );
}

function ScoreRing({ score }) {
  const radius = 36;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(score, 100) / 100);

  const color = score >= 75 ? '#f87171' : score >= 50 ? '#fb923c' : score >= 25 ? '#fbbf24' : '#34d399';

  return (
    <div className="relative w-24 h-24">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx="48" cy="48" r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{score}</span>
        <span className="text-[10px] text-white/40">/ 100</span>
      </div>
    </div>
  );
}

export default function AiInsightsCard({ aiAnalysis, files }) {
  if (!aiAnalysis) return null;

  const topRiskFiles = (files || [])
    .filter((f) => f.aiPrediction && ['Critical', 'High'].includes(f.aiPrediction.risk))
    .sort((a, b) => b.aiPrediction.digitalWasteScore - a.aiPrediction.digitalWasteScore)
    .slice(0, 5);

  const dist = aiAnalysis.riskDistribution || {};

  return (
    <motion.div
      className="relative glass rounded-2xl p-6 overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500/15">
          <Brain className="w-4.5 h-4.5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">AI Insights</h3>
          <p className="text-xs text-white/40">Isolation Forest anomaly detection</p>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <ScoreRing score={aiAnalysis.averageWasteScore || 0} />
        <div>
          <p className="text-sm text-white/60 mb-1">Average AI Waste Score</p>
          <p className="text-xs text-white/30">
            {aiAnalysis.totalFilesAnalyzed} file{aiAnalysis.totalFilesAnalyzed !== 1 ? 's' : ''} analyzed
          </p>
          {aiAnalysis.highRiskCount > 0 && (
            <p className="text-xs text-orange-400 mt-1">
              ⚠ {aiAnalysis.highRiskCount} file{aiAnalysis.highRiskCount !== 1 ? 's' : ''} flagged as high risk
            </p>
          )}
        </div>
      </div>

      {/* Risk distribution */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {Object.entries(RISK_CONFIG).map(([risk, cfg]) => (
          <div key={risk} className={`rounded-xl p-3 text-center ${cfg.bg}`}>
            <div className={`text-lg font-bold ${cfg.color}`}>{dist[risk] || 0}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">{risk}</div>
          </div>
        ))}
      </div>

      {/* Top risk files */}
      {topRiskFiles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Top Risk Files</span>
          </div>
          <div className="space-y-2">
            {topRiskFiles.map((f, i) => {
              const pred = f.aiPrediction;
              return (
                <motion.div
                  key={f.originalName || i}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 truncate">{f.originalName || f.name}</p>
                    <p className="text-xs text-white/30 mt-0.5 line-clamp-1">{pred.recommendation}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs font-mono text-white/40">{pred.digitalWasteScore}/100</span>
                    <RiskBadge risk={pred.risk} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insight text for the highest risk file */}
      {topRiskFiles.length > 0 && topRiskFiles[0].aiPrediction?.insight && (
        <div className="mt-5 p-4 rounded-xl border border-violet-500/15 bg-violet-500/5">
          <p className="text-xs text-white/50 mb-1.5 uppercase tracking-wider font-medium">AI Analysis</p>
          <p className="text-sm text-white/70 leading-relaxed">{topRiskFiles[0].aiPrediction.insight}</p>
        </div>
      )}
    </motion.div>
  );
}
