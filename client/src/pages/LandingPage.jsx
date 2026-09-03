import React, { useState, useEffect, useRef } from 'react';
import {
  Printer, QrCode, UploadCloud, Package, Search, Store, ArrowRight, Sparkles,
  Shield, Zap, Clock, ChevronRight, FileText, Smartphone, Users, BookOpen,
  History, Lock, UserPlus, TrendingUp, CheckCircle, Globe, Eye, XCircle,
  HardDrive, Mail, MessageCircle
} from 'lucide-react';

// ─── Animated Count-Up Hook ────────────────────────────────
function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (target <= 0 || started.current) return;
    started.current = true;

    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        ref.current = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    ref.current = requestAnimationFrame(step);
    return () => ref.current && cancelAnimationFrame(ref.current);
  }, [target, duration]);

  return count;
}

// ─── Stat Card Component ───────────────────────────────────
function StatCard({ icon: Icon, value, label, color, delay }) {
  const animatedValue = useCountUp(value);
  return (
    <div
      className="animate-fade-up flex flex-col items-center gap-1.5 px-5 py-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
        {animatedValue.toLocaleString()}
      </div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function LandingPage({ onNavigate }) {
  const [trackCode, setTrackCode] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [stats, setStats] = useState({ shops: 0, customers: 0, jobsCompleted: 0, pagesPrinted: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  // Load recent orders from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('prntez_customer_orders');
      if (saved) setRecentOrders(JSON.parse(saved));
    } catch (_) {}
  }, []);

  // Fetch real-time platform stats
  useEffect(() => {
    const fetchStats = () => {
      fetch('/api/public-stats')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.stats) {
            setStats(data.stats);
            setStatsLoaded(true);
          }
        })
        .catch(() => {});
    };
    fetchStats();
    // Refresh every 30s for near real-time feel
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackCode.trim()) {
      onNavigate('track', trackCode.trim());
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative overflow-hidden">
        {/* Decorative Background Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-violet-100/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8 relative z-10">
          <div className="text-center space-y-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 text-blue-700 rounded-full text-xs font-bold border border-blue-200/50 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Cloud Printing for Everyone</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Your Documents. Any Nearby Shop.
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Printed Instantly.
              </span>
            </h1>

            {/* Mission Statement */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              <strong className="text-slate-800">prntez</strong> connects you to local print shops wirelessly. 
              Scan a QR code, upload from your phone, and pick up your prints — no apps, no USB drives, no waiting. 
              We're making document printing as easy as sending a text.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('upload')}
                className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 flex items-center gap-2 active:scale-[0.98]"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Print Now — It's Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  document.getElementById('track-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-sm border border-slate-200 shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Track Your Order</span>
              </button>
            </div>

            {/* ── "Old Way" Pain Points Strip ── */}
            <div className="pt-6 max-w-xl mx-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Stop doing this 👇</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200/60 rounded-xl">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-xs text-rose-600 font-semibold line-through decoration-rose-300">Sending files via Gmail</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200/60 rounded-xl">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-xs text-rose-600 font-semibold line-through decoration-rose-300">Sharing PDFs on WhatsApp</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200/60 rounded-xl">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-xs text-rose-600 font-semibold line-through decoration-rose-300">Carrying USB drives</span>
                </div>
              </div>
              <p className="text-xs text-emerald-600 font-bold mt-3 flex items-center justify-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Just scan the shop's QR → upload → done.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ LIVE PLATFORM STATS ═══════════ */}
      <section className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Live badge header */}
            <div className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-pulse" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Live Platform Stats
              </span>
            </div>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
              <StatCard
                icon={Store}
                value={stats.shops}
                label="Active Shops"
                color="bg-blue-50 text-blue-600"
                delay={0}
              />
              <StatCard
                icon={Users}
                value={stats.customers}
                label="Registered Users"
                color="bg-indigo-50 text-indigo-600"
                delay={100}
              />
              <StatCard
                icon={CheckCircle}
                value={stats.jobsCompleted}
                label="Jobs Completed"
                color="bg-emerald-50 text-emerald-600"
                delay={200}
              />
              <StatCard
                icon={FileText}
                value={stats.pagesPrinted}
                label="Pages Printed"
                color="bg-violet-50 text-violet-600"
                delay={300}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ OUR MISSION ═══════════ */}
      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden shadow-xl">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full text-[11px] font-bold text-white/90 border border-white/20">
                <Globe className="w-3 h-3" />
                <span>Our Mission</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight max-w-xl mx-auto">
                Eliminating the Hassle of Document Printing
              </h2>
              <p className="text-sm sm:text-base text-white/80 max-w-lg mx-auto leading-relaxed">
                Every day, millions of people struggle with USB drives, cables, and incompatible file formats 
                just to print a single page. <strong className="text-white">prntez</strong> removes all of that. 
                We connect customers to nearby print shops through a simple QR scan — making printing 
                contactless, instant, and transparent.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-[11px] font-bold text-white/70">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Real-Time Sync</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Auto-Delete Files</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-200" />
                  <span>No App Required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-violet-200" />
                  <span>Live Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-14 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How It Works</h2>
            <p className="text-sm text-slate-500 mt-2">Three steps. Zero hassle. Lightning fast.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="group bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-100 transition-colors" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-5">
                  <QrCode className="w-7 h-7" />
                </div>
                <div className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">Step 1</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Scan QR Code</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Look for the prntez QR standee at the shop counter. Scan it with your phone camera — it opens instantly.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-100 transition-colors" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-5">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">Step 2</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Upload Documents</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Select your files — PDFs, images, Word docs. Choose copies, color mode, paper size, and hit send.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-100 transition-colors" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-5">
                  <Package className="w-7 h-7" />
                </div>
                <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">Step 3</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Collect Your Print</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  The shopkeeper receives your order instantly. Track progress in real-time and pick up from the counter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ WHY REGISTER — CUSTOMER CTA ═══════════ */}
      <section className="py-14 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-bold border border-indigo-100 mb-4">
              <UserPlus className="w-3 h-3" />
              <span>Free Account</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Why Create an Account?
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
              Printing works without an account — but registering unlocks powerful features that save time and protect your privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Benefit 1: Personal Library */}
            <div className="group bg-gradient-to-b from-slate-50 to-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1.5">Personal Library</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Save your documents to a private cloud library. Re-print anytime from any shop — no need to re-upload.
              </p>
            </div>

            {/* Benefit 2: Print History */}
            <div className="group bg-gradient-to-b from-slate-50 to-white rounded-2xl p-6 border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 group-hover:scale-110 transition-transform">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1.5">Full Print History</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Track every order across all shops. See what you printed, when, where, and how much it cost.
              </p>
            </div>

            {/* Benefit 3: Privacy & Security */}
            <div className="group bg-gradient-to-b from-slate-50 to-white rounded-2xl p-6 border border-slate-200 hover:border-rose-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1.5">Privacy & Security</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your files are auto-purged after printing. With an account, you control what's saved and what's deleted — your data, your rules.
              </p>
            </div>

            {/* Benefit 4: Faster Checkout */}
            <div className="group bg-gradient-to-b from-slate-50 to-white rounded-2xl p-6 border border-slate-200 hover:border-amber-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1.5">Faster Checkout</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Auto-fill your name and phone on repeat visits. Skip the form and go straight to uploading.
              </p>
            </div>
          </div>

          {/* Register CTA */}
          <div className="text-center mt-8">
            <button
              onClick={() => onNavigate('upload')}
              className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 inline-flex items-center gap-2 active:scale-[0.97]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-400 mt-2.5 font-medium">
              No credit card · No downloads · Takes 30 seconds
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES STRIP ═══════════ */}
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Real-Time</div>
                <div className="text-[11px] text-slate-500">Instant order sync</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Secure Upload</div>
                <div className="text-[11px] text-slate-500">Files auto-purged</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">No App Needed</div>
                <div className="text-[11px] text-slate-500">Works in browser</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Live Tracking</div>
                <div className="text-[11px] text-slate-500">Know when it's ready</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRACK ORDER SECTION ═══════════ */}
      <section id="track-section" className="py-14">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-violet-500/25">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Track Your Order</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter the job code you received after uploading
              </p>
            </div>

            <form onSubmit={handleTrack} className="flex gap-2">
              <input
                type="text"
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                placeholder="e.g. 0001"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-center tracking-wider focus:ring-2 focus:ring-indigo-500 focus:bg-white transition placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal"
              />
              <button
                type="submit"
                disabled={!trackCode.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition shadow-md shadow-indigo-500/25 flex items-center gap-1.5 active:scale-[0.97]"
              >
                <Search className="w-4 h-4" />
                <span>Track</span>
              </button>
            </form>

            {/* Recent Orders List */}
            {recentOrders.length > 0 && (
              <div className="pt-2 text-left border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Your Recent Orders</p>
                <div className="flex flex-wrap gap-1.5">
                  {recentOrders.map((o, idx) => (
                    <button
                      key={idx}
                      onClick={() => onNavigate('track', o.jobCode)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-mono font-bold text-slate-700 transition flex items-center gap-1"
                    >
                      <span>#{o.jobCode}</span>
                      <span className="text-[10px] text-slate-400 font-sans">({o.shopName})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ FOR SHOPKEEPERS CTA ═══════════ */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-10 text-center space-y-5 relative overflow-hidden shadow-xl">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="absolute inset-0 animate-shimmer rounded-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold text-blue-300 border border-white/10">
                <Store className="w-3 h-3" />
                <span>For Print Shop Owners</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Modernize Your Print Counter
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                Accept print orders wirelessly. Let customers upload from their phones while you focus on printing. 
                Real-time queue, auto-pricing, and a professional QR standee — all free.
              </p>

              {/* Storage benefit callout */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/15">
                  <HardDrive className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] font-bold text-emerald-300">No more storage issues — files auto-purge after printing</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/15">
                  <Mail className="w-3 h-3 text-blue-400" />
                  <span className="text-[11px] font-bold text-blue-300">No more Gmail/WhatsApp — customers upload directly</span>
                </div>
              </div>

              {/* Shop stats highlight */}
              {statsLoaded && stats.shops > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 rounded-full text-[11px] font-bold text-emerald-300 border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" />
                  <span>{stats.shops} shops already registered — join them!</span>
                </div>
              )}

              <button
                onClick={() => onNavigate('shop')}
                className="px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all duration-200 inline-flex items-center gap-2 active:scale-[0.97]"
              >
                <span>Register Your Shop — It's Free</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
            <Printer className="w-4 h-4 text-blue-600" />
            <span className="tracking-tight">prntez</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400 font-normal">Real-Time Cloud Print Platform</span>
          </div>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} prntez. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
