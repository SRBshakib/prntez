import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Printer, QrCode, UploadCloud, Package, Search, Store, ArrowRight, Sparkles,
  Shield, Zap, Clock, ChevronRight, FileText, Smartphone, Users, BookOpen,
  History, Lock, UserPlus, TrendingUp, CheckCircle, Globe, Eye, XCircle,
  HardDrive, Mail, MessageCircle, ShieldCheck, ShieldAlert, PhoneOff, Trash2,
  MapPin, Check, Copy, X, Loader2, Tag, Percent
} from 'lucide-react';
import NearbyShopsMap from '../components/NearbyShopsMap';
import ProcessHeroAnimation from '../components/ProcessHeroAnimation';

// ─── Scroll Reveal Hook ────────────────────────────────────
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );

    const el = ref.current;
    if (!el) return;

    el.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale')
      .forEach((child) => observer.observe(child));

    if (el.classList.contains('scroll-reveal') || el.classList.contains('scroll-reveal-scale')) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}

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
      className="scroll-reveal flex flex-col items-center gap-1.5 px-5 py-4"
      style={{ transitionDelay: `${delay}ms` }}
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

// ─── Hero Animated Document Shred Graphic ──────────────────
function DocumentHeroGraphic() {
  const [step, setStep] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2000),
      setTimeout(() => setStep(2), 4000),
      setTimeout(() => {
        const parts = Array.from({ length: 12 }, (_, k) => ({
          id: k,
          x: (Math.random() - 0.5) * 120,
          y: -(Math.random() * 80 + 30),
          r: Math.random() * 360,
          delay: Math.random() * 300
        }));
        setParticles(parts);
        setStep(3);
      }, 5500),
      setTimeout(() => {
        setStep(0);
        setParticles([]);
      }, 8000)
    ];
    return () => timers.forEach(clearTimeout);
  }, [step === 0 ? Date.now() : null]);

  return (
    <div className="relative w-full max-w-[340px] mx-auto aspect-square flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-orb-1" />
      <div className="absolute inset-4 rounded-full bg-blue-500/5 animate-orb-2" />

      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`relative w-28 h-36 bg-white rounded-2xl border-2 shadow-xl transition-all duration-700 ${
            step === 0
              ? 'border-blue-300 scale-100 opacity-100'
              : step === 1
              ? 'border-indigo-400 scale-95 opacity-90'
              : step === 2
              ? 'border-rose-400 scale-90 opacity-70'
              : 'border-emerald-400 scale-75 opacity-0'
          }`}
        >
          <div className="p-3 space-y-2">
            <div className="h-2 bg-slate-200 rounded-full w-full" />
            <div className="h-2 bg-slate-200 rounded-full w-3/4" />
            <div className="h-2 bg-slate-100 rounded-full w-5/6" />
            <div className="h-2 bg-slate-100 rounded-full w-1/2" />
            <div className="h-1.5 bg-blue-100 rounded-full w-2/3 mt-3" />
            <div className="h-1.5 bg-blue-100 rounded-full w-full" />
          </div>

          {step === 1 && (
            <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
              <Printer className="w-8 h-8 text-indigo-500 animate-pulse" />
            </div>
          )}

          {step === 2 && (
            <div className="absolute inset-0 bg-rose-500/15 rounded-2xl flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-rose-500 animate-danger-wiggle" />
            </div>
          )}
        </div>

        {step === 3 &&
          particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-3 h-4 bg-gradient-to-b from-slate-200 to-slate-300 rounded-sm animate-shred-particle"
              style={{
                '--shred-x': `${p.x}px`,
                '--shred-y': `${p.y}px`,
                '--shred-r': `${p.r}deg`,
                animationDelay: `${p.delay}ms`
              }}
            />
          ))}

        <div
          className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-500 ${
            step === 0
              ? 'bg-blue-100 text-blue-700'
              : step === 1
              ? 'bg-indigo-100 text-indigo-700'
              : step === 2
              ? 'bg-rose-100 text-rose-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {step === 0 && (
            <span className="flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5" /> Uploading...
            </span>
          )}
          {step === 1 && (
            <span className="flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Printing...
            </span>
          )}
          {step === 2 && (
            <span className="flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Shredding file...
            </span>
          )}
          {step === 3 && (
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Zero Trace ✓
            </span>
          )}
        </div>
      </div>

      <div
        className={`absolute inset-0 rounded-full border-2 transition-all duration-1000 ${
          step === 3 ? 'border-emerald-400/60 scale-110' : 'border-transparent scale-100'
        }`}
      />
    </div>
  );
}

// ─── Shop Opening Hours Utility ────────────────────────────
function isShopOpen(shop) {
  if (shop.is_closed) return false;
  if (!shop.opening_time || !shop.closing_time) return true;
  const d = new Date();
  const currentMinutes = d.getHours() * 60 + d.getMinutes();
  const [openH, openM] = (shop.opening_time || '08:00').split(':').map(Number);
  const [closeH, closeM] = (shop.closing_time || '22:00').split(':').map(Number);
  const openMinutes = (openH || 0) * 60 + (openM || 0);
  const closeMinutes = (closeH || 0) * 60 + (closeM || 0);
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

// ─── Main Landing Page Component ───────────────────────────
export default function LandingPage({ onNavigate }) {
  const [trackCode, setTrackCode] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [stats, setStats] = useState({ shops: 0, customers: 0, jobsCompleted: 0, pagesPrinted: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'open' | 'discount'
  const [qrModalShop, setQrModalShop] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchRadius, setSearchRadius] = useState(3);
  const [selectedMapShop, setSelectedMapShop] = useState(null);

  // Section refs for scroll reveal
  const privacyRef = useScrollReveal();
  const demoRef = useScrollReveal();
  const shopsRef = useScrollReveal();
  const statsRef = useScrollReveal();
  const trackRef = useScrollReveal();
  const shopOwnerRef = useScrollReveal();

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
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.stats) {
            setStats(data.stats);
            setStatsLoaded(true);
          }
        })
        .catch(() => {});
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch public verified shops
  useEffect(() => {
    fetch('/api/shops/public')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.shops) {
          setShops(data.shops);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingShops(false));
  }, []);

  // Generate QR code for shop modal
  useEffect(() => {
    if (qrModalShop) {
      const url = `${window.location.origin}/?shop=${qrModalShop.qr_slug}`;
      QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' }
      })
        .then(setQrCodeDataUrl)
        .catch(() => {});
    } else {
      setQrCodeDataUrl('');
      setCopiedLink(false);
    }
  }, [qrModalShop]);

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackCode.trim()) {
      onNavigate('track', trackCode.trim());
    }
  };

  // Filtered shops list
  const filteredShops = shops.filter((shop) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (shop.name && shop.name.toLowerCase().includes(query)) ||
      (shop.address && shop.address.toLowerCase().includes(query)) ||
      (shop.counter_notice && shop.counter_notice.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (filterMode === 'open') return isShopOpen(shop);
    if (filterMode === 'discount') return parseFloat(shop.discount_percent || 0) > 0;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-64px)]">

      {/* ═══════════ 1. HERO SECTION ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 animate-gradient-mesh">
        {/* Decorative Orbs */}
        <div className="absolute top-20 left-[10%] w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none animate-orb-1" />
        <div className="absolute top-40 right-[5%] w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none animate-orb-2" />
        <div className="absolute bottom-0 left-[30%] w-[300px] h-[300px] bg-violet-500/8 rounded-full blur-[100px] pointer-events-none animate-orb-3" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-7 text-left">
              {/* Privacy Badge */}
              <div className="animate-fade-up inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-500/15 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/25 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-pulse shadow-[0_0_8px_#34d399]" />
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="tracking-wide uppercase text-[11px]">Privacy-First Cloud Printing</span>
              </div>

              {/* Main Headline */}
              <h1 className="animate-fade-up text-3xl sm:text-4xl xl:text-[52px] font-black text-white leading-[1.1] tracking-tight" style={{ animationDelay: '100ms' }}>
                Your Documents.{' '}
                <br className="hidden sm:block" />
                Your Privacy.{' '}
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Zero Trace.
                </span>
              </h1>

              {/* Mission Statement */}
              <p className="animate-fade-up text-base sm:text-lg text-slate-400 font-medium leading-relaxed max-w-lg" style={{ animationDelay: '200ms' }}>
                Never send personal or confidential documents over{' '}
                <strong className="text-rose-400">WhatsApp or Gmail</strong> to print shops. Stop leaving your phone number, email address, and files in strangers' downloads or galleries. Scan the counter QR, print in 15 seconds, and files are{' '}
                <span className="text-emerald-400 font-bold">automatically shredded</span> with zero trace.
              </p>

              {/* Key Value Badges */}
              <div className="animate-fade-up grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ animationDelay: '300ms' }}>
                {[
                  { icon: PhoneOff, label: 'Zero Contact', sub: 'No WhatsApp / Gmail', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25' },
                  { icon: Trash2, label: 'Auto-Shred', sub: 'Post-print purge', color: 'text-blue-400 bg-blue-500/15 border-blue-500/25' },
                  { icon: Lock, label: 'Anonymous', sub: 'No login needed', color: 'text-violet-400 bg-violet-500/15 border-violet-500/25' },
                  { icon: Zap, label: '15s Speed', sub: 'Instant token', color: 'text-amber-400 bg-amber-500/15 border-amber-500/25' }
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-2.5 p-2.5 rounded-xl border backdrop-blur-sm ${item.color}`}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-white/90">{item.label}</div>
                      <div className="text-[10px] text-white/50">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Action Buttons */}
              <div className="animate-fade-up flex flex-wrap items-center gap-3.5" style={{ animationDelay: '400ms' }}>
                <button
                  onClick={() => onNavigate('upload')}
                  className="px-7 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-extrabold rounded-2xl text-sm sm:text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2.5"
                >
                  <UploadCloud className="w-5 h-5" />
                  <span>Print Securely — It's Free</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    document.getElementById('privacy-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-4 bg-white/10 hover:bg-white/15 text-white/90 font-bold rounded-2xl text-sm border border-white/15 hover:border-white/25 backdrop-blur-sm transition-all duration-200 flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Why WhatsApp & Gmail Are Risky</span>
                </button>
              </div>
            </div>

            {/* Right Graphic Animation */}
            <div className="animate-fade-up flex items-center justify-center" style={{ animationDelay: '300ms' }}>
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 rounded-full bg-emerald-500/10 blur-[60px] animate-shield-glow" />
                </div>
                <DocumentHeroGraphic />
              </div>
            </div>

          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* ═══════════ 2. PRIVACY REALITY CHECK SECTION ═══════════ */}
      <section id="privacy-section" className="py-16 bg-slate-50 bg-grid-pattern relative" ref={privacyRef}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-200/70">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Privacy Reality Check</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What Actually Happens to Your Files?
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Most people don't realize how much personal data they expose at a print shop counter.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch scroll-reveal-stagger">
            
            {/* WhatsApp Card */}
            <div className="scroll-reveal bg-white rounded-3xl p-7 border-2 border-rose-200 flex flex-col justify-between relative overflow-hidden glow-card group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                    High Risk
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">WhatsApp Printing</h3>
                  <p className="text-xs text-slate-500 mt-1">What you share without realizing</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    'Your personal phone number stored forever',
                    'Files sit in stranger phone galleries permanently',
                    'PDFs heavily compressed — blurry text output'
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-rose-800">
                      <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-rose-200/60 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>Your data is never deleted</span>
              </div>
            </div>

            {/* Gmail & USB Card */}
            <div className="scroll-reveal bg-white rounded-3xl p-7 border-2 border-amber-200 flex flex-col justify-between relative overflow-hidden glow-card group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                    Outdated
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gmail & USB Drives</h3>
                  <p className="text-xs text-slate-500 mt-1">Slow, exposed, and risky</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    'Files saved in public PC Downloads folder',
                    '5-min wait while shopkeeper finds your email',
                    'USB drives carry malware and trojans'
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-amber-900">
                      <X className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-amber-200/60 text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>Files left on public machines</span>
              </div>
            </div>

            {/* The prntez Standard Card */}
            <div className="scroll-reveal bg-gradient-to-b from-blue-50/80 via-white to-emerald-50/60 rounded-3xl p-7 border-2 border-blue-500/80 shadow-xl shadow-blue-500/10 flex flex-col justify-between relative overflow-hidden ring-4 ring-blue-500/10">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-sm">
                Recommended
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/30">
                    <Printer className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 mr-20">
                    100% Private
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">The prntez Standard</h3>
                  <p className="text-xs text-blue-600 font-semibold mt-1">Instant, Contactless & Auto-Purged</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    'Zero contact sharing — no phone, no email',
                    'Files shredded from server after printing',
                    'Lossless quality — no compression ever',
                    '15-second 4-digit token for counter pickup'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] font-extrabold text-emerald-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Total Privacy Guaranteed</span>
                </span>
                <button
                  onClick={() => onNavigate('upload')}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-bold"
                >
                  Try Now
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════ 3. INTERACTIVE SIMULATOR DEMO ═══════════ */}
      <section className="py-16 bg-white relative" ref={demoRef}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-10 scroll-reveal">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Demo</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              See How It Works — In Real Time
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-xl mx-auto">
              Watch the complete journey from QR scan to secure file purge. Click through each step.
            </p>
          </div>

          <div className="scroll-reveal-scale">
            <ProcessHeroAnimation onNavigate={onNavigate} />
          </div>
        </div>
      </section>

      {/* ═══════════ 4. NEARBY REGISTERED PRINT SHOPS ═══════════ */}
      <section id="nearby-shops" className="py-16 bg-slate-50/80 bg-grid-pattern border-b border-slate-200/80 relative" ref={shopsRef}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-10 scroll-reveal">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-pulse" />
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Campus & Market Network</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Nearby Registered Print Shops
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Find verified print counters near you. Check real-time rates and print directly from your browser.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="scroll-reveal bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm mb-8 space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by campus, area, or shop name..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    filterMode === 'all'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>All Shops ({shops.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode('open')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    filterMode === 'open'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Open Now ({shops.filter(isShopOpen).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode('discount')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    filterMode === 'discount'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Student Discounts</span>
                </button>
              </div>
            </div>

            {/* Popular Area Chips & Tip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Popular:</span>
                {['IUB', 'Test', 'Dhaka'].map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setSearchQuery(area)}
                    className={`px-2.5 py-1 rounded-lg font-semibold border transition ${
                      searchQuery === area
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border-slate-200 text-slate-600'
                    }`}
                  >
                    📍 {area}
                  </button>
                ))}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-blue-600 font-bold hover:underline ml-1"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Click any shop marker to view rates & print</span>
              </div>
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          {!loadingShops && (
            <div className="mb-8 transition-opacity duration-300">
              <NearbyShopsMap
                shops={filteredShops}
                selectedShop={selectedMapShop}
                onSelectShop={(shop) => setSelectedMapShop(shop)}
                onPrintToShop={(shop) => onNavigate('upload', shop.qr_slug)}
                onViewQr={(shop) => setQrModalShop(shop)}
                radius={searchRadius}
                onRadiusChange={(r) => setSearchRadius(r)}
              />
            </div>
          )}

          {loadingShops && (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">Discovering nearby print shops...</p>
            </div>
          )}

          {!loadingShops && filteredShops.length === 0 && (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3 max-w-md mx-auto shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No print shops found</h3>
              <p className="text-xs text-slate-500">
                We couldn't find any shops matching "{searchQuery}".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterMode('all');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
              >
                Reset Search
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ═══════════ 5. LIVE PLATFORM STATS ═══════════ */}
      <section className="py-8 bg-white" ref={statsRef}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scroll-reveal bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-pulse" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Live Platform Stats
              </span>
            </div>
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

      {/* ═══════════ 6. TRACK ORDER SECTION ═══════════ */}
      <section id="track-section" className="py-14 bg-slate-50/50 bg-grid-pattern" ref={trackRef}>
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scroll-reveal bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center space-y-5">
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

      {/* ═══════════ 7. FOR PRINT SHOP OWNERS CTA ═══════════ */}
      <section className="py-20 bg-white" ref={shopOwnerRef}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scroll-reveal bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-10 text-center space-y-5 relative overflow-hidden shadow-xl">
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
                Accept print orders wirelessly. Let customers upload from their phones while you focus on printing. Real-time queue, auto-pricing, and a professional QR standee — all free.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/15">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] font-bold text-emerald-300">Files auto-purge after printing</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/15">
                  <Zap className="w-3 h-3 text-blue-400" />
                  <span className="text-[11px] font-bold text-blue-300">No more WhatsApp/Gmail chaos</span>
                </div>
              </div>

              {statsLoaded && stats.shops > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 rounded-full text-[11px] font-bold text-emerald-300 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3" />
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

      {/* ═══════════ 8. FOOTER ═══════════ */}
      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
            <Printer className="w-4 h-4 text-blue-600" />
            <span className="tracking-tight">prntez</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400 font-normal">Privacy-First Cloud Printing</span>
          </div>
          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} prntez · Your documents are always auto-purged
          </div>
        </div>
      </footer>

      {/* ═══════════ SHOP QR MODAL ═══════════ */}
      {qrModalShop && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up"
          onClick={() => setQrModalShop(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 space-y-5 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModalShop(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold border border-blue-100 mb-2">
                <Store className="w-3 h-3" />
                <span>Shop Counter Standee</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">
                {qrModalShop.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{qrModalShop.address || 'Campus Print Counter'}</span>
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 shadow-inner relative flex flex-col items-center justify-center">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`QR code for ${qrModalShop.name}`}
                  className="w-52 h-52 rounded-xl bg-white p-2 shadow"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-white text-xs">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
              <div className="text-[10px] font-mono font-bold text-slate-300 mt-2">
                Scan with any phone camera
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-left space-y-1">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">How to print:</div>
              <div className="text-[11px] text-slate-500">1. Point camera at QR code above</div>
              <div className="text-[11px] text-slate-500">2. Upload your PDF or images</div>
              <div className="text-[11px] text-slate-500">3. Pick up prints from counter (Auto-purged!)</div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  const slug = qrModalShop.qr_slug;
                  setQrModalShop(null);
                  onNavigate('upload', slug);
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Open Upload on This Device</span>
              </button>

              <button
                onClick={() => {
                  const url = `${window.location.origin}/?shop=${qrModalShop.qr_slug}`;
                  navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Shop Print Link</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
