import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode, UploadCloud, Zap, Printer, ShieldCheck, Play, Pause,
  ChevronLeft, ChevronRight, CheckCircle2, FileText, Lock, Sparkles,
  Smartphone, Store, ArrowRight, RefreshCw, Layers, Check
} from 'lucide-react';

const STEPS = [
  {
    id: 1,
    title: 'Scan QR',
    subtitle: 'At Shop Counter',
    icon: QrCode,
    badgeColor: 'bg-blue-500 text-white',
    ringColor: 'ring-blue-500/30',
    accentColor: 'blue',
  },
  {
    id: 2,
    title: 'Upload & Set',
    subtitle: 'PDF, Doc or Img',
    icon: UploadCloud,
    badgeColor: 'bg-indigo-500 text-white',
    ringColor: 'ring-indigo-500/30',
    accentColor: 'indigo',
  },
  {
    id: 3,
    title: 'Instant Stream',
    subtitle: 'Socket.io Cloud',
    icon: Zap,
    badgeColor: 'bg-violet-500 text-white',
    ringColor: 'ring-violet-500/30',
    accentColor: 'violet',
  },
  {
    id: 4,
    title: 'Shop Prints',
    subtitle: '1-Click Spooling',
    icon: Printer,
    badgeColor: 'bg-emerald-500 text-white',
    ringColor: 'ring-emerald-500/30',
    accentColor: 'emerald',
  },
  {
    id: 5,
    title: 'Collect & Purge',
    subtitle: '100% Auto-Purged',
    icon: ShieldCheck,
    badgeColor: 'bg-amber-500 text-white',
    ringColor: 'ring-amber-500/30',
    accentColor: 'amber',
  },
];

const STEP_DURATION = 4200; // ms per step

export default function ProcessHeroAnimation({ onNavigate }) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Interactive micro-state for step 2 (options)
  const [printColor, setPrintColor] = useState('bw');
  const [copies, setCopies] = useState(1);
  const [pagesCount] = useState(12);

  const timerRef = useRef(null);
  const stepStartRef = useRef(Date.now());

  // Handle step progression
  useEffect(() => {
    if (!isPlaying || isHovered) return;

    stepStartRef.current = Date.now() - (progress / 100) * STEP_DURATION;

    const interval = setInterval(() => {
      const elapsed = Date.now() - stepStartRef.current;
      const pct = Math.min((elapsed / STEP_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        setActiveStep((prev) => (prev + 1) % STEPS.length);
        setProgress(0);
        stepStartRef.current = Date.now();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isPlaying, isHovered, activeStep, progress]);

  const goToStep = (index) => {
    setActiveStep(index);
    setProgress(0);
    stepStartRef.current = Date.now();
  };

  const handleNext = () => {
    goToStep((activeStep + 1) % STEPS.length);
  };

  const handlePrev = () => {
    goToStep((activeStep - 1 + STEPS.length) % STEPS.length);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const unitCost = printColor === 'color' ? 10 : 2;
  const totalCost = pagesCount * unitCost * copies;

  return (
    <div
      className="relative w-full mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Ambient Aura Glow */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600/20 via-indigo-600/25 to-violet-600/20 rounded-3xl blur-xl opacity-75 transition duration-500 pointer-events-none" />

      {/* Main Glass Shell */}
      <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden">
        
        {/* Top Header Bar: Simulator Title & Playback Controls */}
        <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying && !isHovered ? 'bg-emerald-400' : 'bg-slate-300'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying && !isHovered ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </span>
            <span className="text-xs font-bold text-slate-700 tracking-tight flex items-center gap-1.5">
              <span>Interactive Workflow Simulation</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">Live</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              title="Previous Step"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
              className="p-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition flex items-center gap-1 text-xs font-semibold px-2"
              aria-label="Play or pause animation"
            >
              {isPlaying && !isHovered ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[11px] hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[11px] hidden sm:inline">Play</span>
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              title="Next Step"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition"
              aria-label="Next step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono text-slate-400 pl-1">
              {activeStep + 1}/{STEPS.length}
            </span>
          </div>
        </div>

        {/* 5-Step Interactive Navigation Tabs with Progress Bars */}
        <div className="grid grid-cols-5 border-b border-slate-100 bg-white divide-x divide-slate-100 text-left">
          {STEPS.map((step, idx) => {
            const isActive = activeStep === idx;
            const isCompleted = activeStep > idx;
            const StepIcon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => goToStep(idx)}
                className={`relative p-2.5 sm:p-3 text-left transition-all duration-200 group hover:bg-slate-50/80 ${
                  isActive ? 'bg-blue-50/40' : ''
                }`}
              >
                {/* Progress Bar inside Active Tab */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-75"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                      isActive
                        ? `${step.badgeColor} shadow-md scale-105`
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 text-center sm:text-left">
                    <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                      Step {step.id}
                    </div>
                    <div
                      className={`text-xs font-bold truncate leading-tight ${
                        isActive ? 'text-blue-700' : 'text-slate-800'
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate hidden md:block">
                      {step.subtitle}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Visual Animation Stage ── */}
        <div className="p-4 sm:p-8 min-h-[380px] sm:min-h-[410px] flex items-center justify-center bg-gradient-to-b from-slate-50/60 to-white/90 relative overflow-hidden">
          
          {/* Background Grid Accent */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* ═════════ STEP 1: SCAN QR CODE ═════════ */}
          {activeStep === 0 && (
            <div className="w-full max-w-xl animate-fade-up space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-10">
                {/* Shop Counter Standee with QR */}
                <div className="relative group">
                  <div className="w-44 bg-white rounded-2xl p-4 shadow-xl border-2 border-blue-500/30 flex flex-col items-center text-center relative overflow-hidden">
                    {/* Standee Header */}
                    <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg py-1 px-2 mb-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm">
                      <Store className="w-3 h-3" />
                      <span>Campus Xerox Hub</span>
                    </div>

                    {/* QR Box with laser sweep */}
                    <div className="relative w-28 h-28 bg-slate-900 rounded-xl p-2 flex items-center justify-center overflow-hidden shadow-inner">
                      <QrCode className="w-24 h-24 text-white" />
                      {/* Laser Bar */}
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-rose-500/20 via-rose-500 to-rose-500/20 shadow-[0_0_12px_#f43f5e] animate-laser pointer-events-none" />
                    </div>

                    <div className="mt-2 text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                      prntez · Scan to Print
                    </div>
                    <div className="text-[9px] text-slate-400">No app needed</div>

                    {/* Standee Base */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-300 rounded-full shadow" />
                  </div>
                </div>

                {/* Connection Arrow & Scanning Ray */}
                <div className="flex flex-col items-center justify-center gap-1 text-blue-600">
                  <div className="relative flex items-center justify-center">
                    <span className="w-12 h-12 rounded-full bg-blue-100/80 animate-radar absolute" />
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 z-10">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                    Instant Link
                  </span>
                </div>

                {/* Customer Smartphone Camera Screen Mockup */}
                <div className="w-48 bg-slate-900 rounded-[28px] p-2.5 shadow-2xl border-4 border-slate-800 relative">
                  {/* Phone Notch */}
                  <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto mb-2" />

                  <div className="bg-slate-950 rounded-[20px] p-3 text-white relative overflow-hidden min-h-[170px] flex flex-col justify-between">
                    {/* Viewfinder crosshairs */}
                    <div className="relative border border-dashed border-blue-400/60 rounded-lg p-2 text-center my-auto overflow-hidden">
                      <QrCode className="w-12 h-12 text-blue-300 mx-auto opacity-70" />
                      <div className="text-[9px] font-bold text-blue-300 mt-1">QR Detected</div>
                      {/* Viewfinder Active Scan Laser */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-phone-scan pointer-events-none" />
                    </div>

                    {/* Connected Toast */}
                    <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-2 text-center animate-fade-up">
                      <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Connected to Shop</span>
                      </div>
                      <div className="text-[9px] text-slate-300 truncate font-semibold">Counter #2 Online</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainer Pill */}
              <div className="text-center">
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  Customers just point their phone camera at the counter standee. <span className="text-blue-600 font-bold">No download, no Wi-Fi pairing.</span>
                </p>
              </div>
            </div>
          )}

          {/* ═════════ STEP 2: UPLOAD & CONFIGURE ═════════ */}
          {activeStep === 1 && (
            <div className="w-full max-w-lg animate-fade-up space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4">
                {/* Uploaded File Pill */}
                <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                        Biology_Report_Semester2.pdf
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {pagesCount} Pages · 1.4 MB · Ready
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Uploaded
                  </span>
                </div>

                {/* Print Configuration Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Color Toggle */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">
                      Color Mode
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPrintColor('bw')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                          printColor === 'bw'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        B&W (৳2)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintColor('color')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                          printColor === 'color'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Color (৳10)
                      </button>
                    </div>
                  </div>

                  {/* Copies Counter */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">
                      Copies
                    </div>
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setCopies((c) => Math.max(1, c - 1))}
                        className="w-7 h-7 rounded text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-xs font-extrabold text-slate-800 font-mono">
                        {copies} {copies === 1 ? 'copy' : 'copies'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCopies((c) => Math.min(10, c + 1))}
                        className="w-7 h-7 rounded text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instant Cost Preview & Submit Button */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Estimated</div>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      ৳{totalCost}.00
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 active:scale-95 transition"
                  >
                    <span>Send to Print</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-slate-500 font-semibold">
                Instant calculations with live page detection. Works with PDFs, Word docs, photos, and slides.
              </p>
            </div>
          )}

          {/* ═════════ STEP 3: INSTANT CLOUD STREAM ═════════ */}
          {activeStep === 2 && (
            <div className="w-full max-w-xl animate-fade-up space-y-6">
              {/* Animated Data Stream Highway */}
              <div className="flex items-center justify-between gap-3 relative py-6">
                
                {/* Customer Node */}
                <div className="flex flex-col items-center text-center z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 animate-float">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-2">Customer Phone</div>
                  <div className="text-[10px] text-slate-400 font-mono">Client Emitter</div>
                </div>

                {/* Animated Bridge SVG */}
                <div className="flex-1 relative flex items-center justify-center">
                  <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 40">
                    <defs>
                      <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="50%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 20 Q 100 -10 200 20"
                      fill="none"
                      stroke="url(#streamGrad)"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      className="animate-beam-dash"
                    />
                  </svg>

                  {/* Floating Data Packet Badge */}
                  <div className="absolute top-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full shadow-lg border border-violet-200 flex items-center gap-1.5 animate-pulse">
                    <Zap className="w-3.5 h-3.5 text-violet-600" />
                    <span className="text-[11px] font-mono font-bold text-violet-700">
                      WebSocket Sync
                    </span>
                  </div>
                </div>

                {/* Shop Node */}
                <div className="flex flex-col items-center text-center z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-float" style={{ animationDelay: '1.5s' }}>
                    <Store className="w-8 h-8" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-2">Shop Counter</div>
                  <div className="text-[10px] text-slate-400 font-mono">Terminal Receiver</div>
                </div>
              </div>

              {/* Status Chips */}
              <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Latency</div>
                  <div className="text-xs font-extrabold text-emerald-600 font-mono">~18ms</div>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Encryption</div>
                  <div className="text-xs font-extrabold text-violet-600 font-mono">End-to-End</div>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Job Token</div>
                  <div className="text-xs font-extrabold text-blue-600 font-mono">#PRNT-8492</div>
                </div>
              </div>

              <p className="text-center text-xs text-slate-500 font-semibold">
                No slow email transfers or WhatsApp compression. Documents stream directly into the shop's queue.
              </p>
            </div>
          )}

          {/* ═════════ STEP 4: SHOP PRINTS (PHYSICAL PRINTER ANIMATION) ═════════ */}
          {activeStep === 3 && (
            <div className="w-full max-w-lg animate-fade-up space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-5">
                {/* Shopkeeper Dashboard Notification */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-live-pulse" />
                    <span className="text-xs font-extrabold text-slate-800">Shopkeeper Terminal</span>
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    Queue: 1 Active Job
                  </span>
                </div>

                {/* Physical Printer Graphic Mockup */}
                <div className="relative w-full max-w-xs mx-auto pt-4 pb-6 flex flex-col items-center">
                  
                  {/* Paper Input Tray (Top) */}
                  <div className="w-40 h-8 bg-slate-200 border-2 border-slate-300 rounded-t-lg -mb-2 z-0 relative flex items-center justify-center">
                    <div className="w-28 h-6 bg-white rounded-t shadow-inner border border-slate-200" />
                  </div>

                  {/* Printer Body */}
                  <div className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-2xl border-2 border-slate-700 relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Printer className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-bold tracking-tight">LaserJet Pro</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Printing...</span>
                      </div>
                    </div>

                    {/* Printer Output Slot */}
                    <div className="w-full h-3 bg-black rounded-full shadow-inner relative overflow-hidden" />
                  </div>

                  {/* Emerging Printed Page */}
                  <div className="w-48 bg-white border border-slate-300 rounded-b-xl shadow-xl p-3 -mt-1 z-20 animate-paper-eject">
                    <div className="space-y-1.5 opacity-75">
                      <div className="h-2 bg-slate-800 rounded w-3/4" />
                      <div className="h-1.5 bg-slate-400 rounded w-full" />
                      <div className="h-1.5 bg-slate-400 rounded w-5/6" />
                      <div className="h-1.5 bg-slate-300 rounded w-4/6" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-slate-500 border-t border-slate-100 pt-1.5">
                      <span>#PRNT-8492</span>
                      <span className="text-emerald-600">Page 12/12</span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>One-click direct spooling to shop hardware</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-slate-500 font-semibold">
                Shop owners never touch USB drives or save unknown files to their desktop. 100% clean and virus-free.
              </p>
            </div>
          )}

          {/* ═════════ STEP 5: PICKUP & ZERO-TRACE AUTO-PURGE ═════════ */}
          {activeStep === 4 && (
            <div className="w-full max-w-lg animate-fade-up space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Ready Notification */}
                <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-5 shadow-xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                      Ready for Pickup!
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Order #PRNT-8492
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Pick up from Counter #2. Show your job code or phone screen.
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono font-bold text-slate-700">
                    Paid at Counter: ৳24.00
                  </div>
                </div>

                {/* Privacy Auto-Purge Shield */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 shadow-xl text-white text-center space-y-3 relative overflow-hidden border border-slate-700">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Zero-Trace Privacy
                    </div>
                    <h4 className="text-sm font-extrabold text-white mt-0.5">
                      Files Auto-Purged
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Temporary print files are automatically deleted after printing. No records left on counter PCs.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold text-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>GDPR & Privacy Safe</span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 rounded-lg py-1 px-2 border border-amber-500/20 mt-1">
                    🚫 Unlike WhatsApp & Gmail: 0 files remain on shop phones or public PCs
                  </div>
                </div>
              </div>

              {/* Final CTA */}
              <div className="text-center pt-2">
                <button
                  onClick={() => onNavigate('upload')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 inline-flex items-center gap-2 active:scale-95 transition"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Start Your Print Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Interactive Step Bar with Quick Step Jump Dots */}
        <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500">
            Click any step to inspect details
          </span>

          <div className="flex items-center gap-1.5">
            {STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => goToStep(idx)}
                className={`transition-all duration-300 rounded-full ${
                  activeStep === idx
                    ? 'w-6 h-2 bg-blue-600'
                    : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Jump to step ${step.id}: ${step.title}`}
                aria-label={`Jump to step ${step.id}`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
