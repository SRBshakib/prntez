import React, { useState } from 'react';
import {
  Printer, QrCode, UploadCloud, Package, Search, Store, ArrowRight, Sparkles,
  Shield, Zap, Clock, ChevronRight, FileText, Smartphone
} from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  const [trackCode, setTrackCode] = useState('');

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

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 relative z-10">
          <div className="text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 text-blue-700 rounded-full text-xs font-bold border border-blue-200/50 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Document Printing Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Print From Your Phone
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                In 3 Simple Steps
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Scan the shop's QR code, upload your documents, and collect your prints from the counter. 
              No cables, no USB drives, no waiting in line.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                onClick={() => onNavigate('shop')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 flex items-center gap-2 active:scale-[0.98]"
              >
                <Store className="w-4 h-4" />
                <span>Register Your Shop</span>
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
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-16 relative">
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
                  Look for the Printez QR standee at the shop counter. Scan it with your phone camera — it opens instantly.
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

      {/* ═══════════ FEATURES STRIP ═══════════ */}
      <section className="py-10 bg-white border-y border-slate-100">
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
      <section id="track-section" className="py-16">
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
                placeholder="e.g. PZ-A1B2C3"
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

              <button
                onClick={() => onNavigate('shop')}
                className="px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all duration-200 inline-flex items-center gap-2 active:scale-[0.97]"
              >
                <span>Get Started — It's Free</span>
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
            <span>Printez</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400 font-normal">Real-Time Print Management</span>
          </div>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Printez. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
