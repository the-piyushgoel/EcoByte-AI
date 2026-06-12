import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Leaf,
  Recycle,
  TreePine,
  ScanSearch,
  BarChart3,
  HardDrive,
  Lightbulb,
  PieChart,
  Upload,
  Cpu,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Zap,
  Globe,
} from 'lucide-react';
import { getGlobalStats } from '../api/analysisApi';

/* ─── Helpers ──────────────────────────────────────────────────────── */

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

/* ─── Animated Counter ─────────────────────────────────────────────── */

function AnimatedCounter({ value, suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value == null) return;
    const target = Number(value);
    if (isNaN(target)) return;
    const duration = 1600;
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(eased * target);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span>
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display)}
      {suffix}
    </span>
  );
}

/* ─── Floating Background Icons ────────────────────────────────────── */

const floatingIcons = [
  { Icon: Leaf, x: '10%', y: '15%', size: 32, delay: 0, duration: 7 },
  { Icon: Recycle, x: '85%', y: '10%', size: 28, delay: 1, duration: 8 },
  { Icon: TreePine, x: '75%', y: '70%', size: 36, delay: 0.5, duration: 6 },
  { Icon: Leaf, x: '20%', y: '75%', size: 24, delay: 1.5, duration: 9 },
  { Icon: Recycle, x: '50%', y: '20%', size: 20, delay: 2, duration: 7.5 },
  { Icon: TreePine, x: '30%', y: '55%', size: 22, delay: 0.8, duration: 8.5 },
  { Icon: Leaf, x: '65%', y: '40%', size: 18, delay: 1.2, duration: 6.5 },
  { Icon: Globe, x: '90%', y: '55%', size: 26, delay: 2.5, duration: 7 },
];

function FloatingIcons() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {floatingIcons.map(({ Icon, x, y, size, delay, duration }, i) => (
        <motion.div
          key={i}
          className="absolute text-accent-emerald/15"
          style={{ left: x, top: y }}
          animate={{ y: [0, -18, 0], rotate: [0, 8, -8, 0] }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon size={size} />
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Gradient Orbs ────────────────────────────────────────────────── */

function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent-emerald/8 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-accent-teal/6 blur-[100px]" />
      <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-accent-green/5 blur-[110px]" />
    </div>
  );
}

/* ─── Section Animation Wrapper ────────────────────────────────────── */

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

function AnimatedSection({ children, className = '', delay = 0 }) {
  return (
    <motion.section
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut', delay } },
      }}
    >
      {children}
    </motion.section>
  );
}

/* ─── Feature Card ─────────────────────────────────────────────────── */

const features = [
  {
    Icon: ScanSearch,
    title: 'Smart Detection',
    desc: 'SHA256 hashing identifies every duplicate file instantly',
    color: 'from-emerald-500/20 to-emerald-500/5',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    Icon: BarChart3,
    title: 'Waste Scoring',
    desc: 'Comprehensive 0-100 scoring system grades your digital health',
    color: 'from-teal-500/20 to-teal-500/5',
    iconBg: 'bg-teal-500/15 text-teal-400',
  },
  {
    Icon: Leaf,
    title: 'Carbon Impact',
    desc: 'Calculate CO₂ emissions from unnecessary digital storage',
    color: 'from-green-500/20 to-green-500/5',
    iconBg: 'bg-green-500/15 text-green-400',
  },
  {
    Icon: HardDrive,
    title: 'Recovery Insights',
    desc: 'See exactly how much storage you can reclaim',
    color: 'from-cyan-500/20 to-cyan-500/5',
    iconBg: 'bg-cyan-500/15 text-cyan-400',
  },
  {
    Icon: Lightbulb,
    title: 'AI Recommendations',
    desc: 'Actionable suggestions to clean your digital space',
    color: 'from-amber-500/20 to-amber-500/5',
    iconBg: 'bg-amber-500/15 text-amber-400',
  },
  {
    Icon: PieChart,
    title: 'Detailed Analytics',
    desc: 'Beautiful charts and breakdowns of your file ecosystem',
    color: 'from-violet-500/20 to-violet-500/5',
    iconBg: 'bg-violet-500/15 text-violet-400',
  },
];

function FeatureCard({ Icon, title, desc, color, iconBg, index }) {
  return (
    <motion.div
      className="glass rounded-2xl p-6 group cursor-default"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ─── How‑It‑Works Step ────────────────────────────────────────────── */

const steps = [
  { Icon: Upload, label: 'Upload', desc: 'Upload your files or folders for analysis', num: 1 },
  { Icon: Cpu, label: 'Analyze', desc: 'Our engine scans, hashes, and classifies every file', num: 2 },
  { Icon: Sparkles, label: 'Act', desc: 'Get insights, scores, and actionable recommendations', num: 3 },
];

function StepCard({ Icon, label, desc, num, index }) {
  return (
    <motion.div
      className="flex flex-col items-center text-center relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-emerald/20 to-accent-teal/10 border border-white/10 flex items-center justify-center">
          <Icon size={32} className="text-accent-emerald" />
        </div>
        <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent-emerald text-surface-900 text-xs font-bold flex items-center justify-center">
          {num}
        </span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{label}</h3>
      <p className="text-sm text-white/60 leading-relaxed max-w-xs">{desc}</p>
    </motion.div>
  );
}

/* ─── Step Connector (desktop only) ────────────────────────────────── */

function StepConnector() {
  return (
    <div className="hidden lg:flex items-center justify-center -mx-4 self-start mt-10">
      <svg width="80" height="2" className="text-white/15">
        <line
          x1="0"
          y1="1"
          x2="80"
          y2="1"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      </svg>
      <ArrowRight size={16} className="text-white/25 -ml-1" />
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LANDING PAGE COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function LandingPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getGlobalStats()
      .then((data) => {
        if (data && data.totalSessions > 0) setStats(data);
      })
      .catch(() => {});
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ───────── HERO ───────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden">
        <GradientOrbs />
        <FloatingIcons />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-white/70 mb-8">
              <Zap size={14} className="text-accent-emerald" />
              <span>AI-Powered Digital Sustainability</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Reduce Your{' '}
              <span className="gradient-text">Digital Carbon</span>{' '}
              Footprint
            </h1>

            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              EcoByte AI analyzes your files, detects digital waste, and helps you build a
              sustainable digital future.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <Link
              to="/upload"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent-emerald to-accent-green text-surface-900 font-semibold text-base shadow-lg shadow-accent-emerald/20 hover:shadow-accent-emerald/40 transition-all duration-300 hover:scale-[1.03]"
            >
              Start Analysis
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <button
              onClick={scrollToFeatures}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/15 text-white/80 font-semibold text-base hover:border-accent-emerald/40 hover:text-white transition-all duration-300 hover:scale-[1.03]"
            >
              Learn More
              <ChevronDown size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ───────── FEATURES ───────── */}
      <AnimatedSection id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to{' '}
              <span className="gradient-text">go green</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Powerful tools that analyze, score, and optimize your digital footprint
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ───────── HOW IT WORKS ───────── */}
      <AnimatedSection className="py-24 px-6 bg-surface-800/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How it <span className="gradient-text">works</span>
            </h2>
            <p className="text-white/50 max-w-lg mx-auto">
              Three simple steps to a cleaner digital world
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-10 lg:gap-0">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-start">
                <StepCard {...step} index={i} />
                {i < steps.length - 1 && <StepConnector />}
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ───────── STATS BANNER ───────── */}
      {stats && (
        <AnimatedSection className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="glass rounded-2xl p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
                Our <span className="gradient-text">Impact</span> So Far
              </h2>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-accent-emerald mb-1">
                    <AnimatedCounter value={stats.totalSessions} />
                  </div>
                  <div className="text-sm text-white/50">Total Sessions</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-accent-teal mb-1">
                    <AnimatedCounter value={stats.totalFilesAnalyzed} />
                  </div>
                  <div className="text-sm text-white/50">Files Analyzed</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-green-400 mb-1">
                    <AnimatedCounter value={stats.totalCO2SavedKg} decimals={1} suffix=" kg" />
                  </div>
                  <div className="text-sm text-white/50">CO₂ Saved</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 mb-1">
                    <AnimatedCounter value={stats.avgWasteScore} decimals={0} suffix="/100" />
                  </div>
                  <div className="text-sm text-white/50">Avg Waste Score</div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ───────── FOOTER CTA ───────── */}
      <AnimatedSection className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-emerald/20 via-accent-green/15 to-accent-teal/10 border border-white/10 p-12 sm:p-16 text-center">
            {/* Decorative orbs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent-emerald/10 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-accent-teal/10 blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Ready to go <span className="gradient-text">green</span>?
              </h2>
              <p className="text-white/60 max-w-md mx-auto mb-8">
                Start analyzing your files today and take the first step toward a sustainable digital future.
              </p>
              <Link
                to="/upload"
                className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-accent-emerald to-accent-green text-surface-900 font-semibold text-lg shadow-lg shadow-accent-emerald/20 hover:shadow-accent-emerald/40 transition-all duration-300 hover:scale-[1.03]"
              >
                Start Analysis
                <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ───────── FOOTER ───────── */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <span>Built with 🌿 by EcoByte AI</span>
          <span>© {new Date().getFullYear()} EcoByte AI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
