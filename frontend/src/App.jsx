import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

// ── Lazy-loaded page components ────────────────────────────────────
const LandingPage = lazy(() => import('./pages/LandingPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// ── Loading fallback with shimmer ──────────────────────────────────
function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-6">
        {/* Pulsing logo placeholder */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl animate-shimmer" />
          <div className="absolute inset-0 rounded-2xl animate-pulse-glow" />
        </div>

        {/* Shimmer content blocks */}
        <div className="flex flex-col items-center gap-3 w-72">
          <div className="h-4 w-48 rounded-lg animate-shimmer" />
          <div className="h-3 w-64 rounded-lg animate-shimmer" />
          <div className="h-3 w-40 rounded-lg animate-shimmer" />
        </div>

        {/* Loading text */}
        <p className="text-sm text-white/40 tracking-wide uppercase">
          Loading…
        </p>
      </div>
    </div>
  );
}

// ── App component ──────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/dashboard/:sessionId" element={<DashboardPage />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}
