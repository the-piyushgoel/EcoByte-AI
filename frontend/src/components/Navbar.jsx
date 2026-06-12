import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf, Menu, X, Home, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/upload', label: 'Upload', icon: Upload },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkBase =
    'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200';
  const linkInactive =
    'text-gray-400 hover:text-white hover:bg-white/5';
  const linkActive =
    'text-white bg-white/10';

  return (
    <nav className="sticky top-0 z-50 w-full bg-[var(--color-surface-900)]/80 backdrop-blur-xl border-b border-white/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ─────────────────────────────── */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 transition-shadow duration-300 group-hover:shadow-emerald-500/40">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Eco
            </span>
            <span className="text-white">Byte</span>
            <span className="ml-1.5 text-sm font-semibold text-gray-500">
              AI
            </span>
          </span>
        </NavLink>

        {/* ── Desktop links ────────────────────── */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* ── Mobile toggle ────────────────────── */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mobile menu ────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/5 md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `${linkBase} w-full ${isActive ? linkActive : linkInactive}`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
