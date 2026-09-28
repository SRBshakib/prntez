import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Users, Printer, DollarSign, Settings, Store, RefreshCw,
  KeyRound, LogOut, Check, Search, AlertCircle, Megaphone, Sparkles, ExternalLink,
  QrCode, BarChart3, TrendingUp, Layers, Ban, CheckCircle, Percent, Clock,
  FileText, Shield, Globe, Award, Zap, Phone, MessageCircle, AlertTriangle,
  Eye, Image as ImageIcon, X, Copy, Info, CreditCard, Wallet
} from 'lucide-react';
import ShopQrModal from '../components/ShopQrModal';

export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'verify' | 'charts' | 'shops' | 'future' | 'ads' | 'payment' | 'settings'
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchShop, setSearchShop] = useState('');
  const [shopFilterStatus, setShopFilterStatus] = useState('all');
  const [selectedShopForQr, setSelectedShopForQr] = useState(null);
  const [selectedShopForDetails, setSelectedShopForDetails] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Job Verification & Auth Code states
  const [authSearchCode, setAuthSearchCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authJobResult, setAuthJobResult] = useState(null);
  const [authError, setAuthError] = useState('');
  const [ordersList, setOrdersList] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Payment Gateways & Transactions states
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, shopsRes, settingsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/shops'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/orders')
      ]);

      const [statsData, shopsData, settingsData, ordersData] = await Promise.all([
        statsRes.json(),
        shopsRes.json(),
        settingsRes.json(),
        ordersRes.json()
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (shopsData.success) setShops(shopsData.shops || []);
      if (settingsData.success) setSettings(settingsData.settings || {});
      if (ordersData.success) setOrdersList(ordersData.orders || []);
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersList = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.success) {
        setOrdersList(data.orders || []);
      }
    } catch (_) {
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchPaymentTransactions = async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch('/api/payment/transactions');
      const data = await res.json();
      if (data.success) {
        setPaymentTransactions(data.transactions || []);
      }
    } catch (_) {
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payment') {
      fetchPaymentTransactions();
    }
  }, [activeTab]);

  const handleLookupAuth = async (lookupCode) => {
    const code = (lookupCode || authSearchCode || '').trim();
    if (!code) {
      setAuthError('Please enter a job code or unique authentication code');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    setAuthJobResult(null);
    try {
      const res = await fetch(`/api/admin/verify-job/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.success && data.job) {
        setAuthJobResult(data.job);
        showToast('✓ Job successfully authenticated!');
      } else {
        setAuthError(data.error || 'Job not found or invalid authentication code.');
      }
    } catch (_) {
      setAuthError('Verification request failed. Check server connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        showToast('✓ Platform settings saved successfully!');
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (_) {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleShopStatus = async (shopId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/shops/${shopId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, status: nextStatus } : s));
        showToast(`Shop status changed to ${nextStatus.toUpperCase()}`);
      }
    } catch (_) {
      showToast('Failed to update shop status');
    }
  };

  const filteredShops = useMemo(() => {
    let list = shops;
    if (shopFilterStatus !== 'all') {
      list = list.filter(s => s.status === shopFilterStatus);
    }
    if (!searchShop.trim()) return list;
    const q = searchShop.toLowerCase();
    return list.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.qr_slug || '').toLowerCase().includes(q)
    );
  }, [shops, searchShop, shopFilterStatus]);

  // Max daily revenue for chart scaling
  const maxDailyRevenue = useMemo(() => {
    if (!stats?.dailyTrend || stats.dailyTrend.length === 0) return 100;
    const max = Math.max(...stats.dailyTrend.map(d => parseFloat(d.revenue || 0)));
    return max > 0 ? max : 100;
  }, [stats?.dailyTrend]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-slate-800 leading-tight">prntez Admin Central</h1>
                <span className="px-2 py-0.2 bg-indigo-50 text-indigo-700 font-extrabold rounded-full text-[10px] border border-indigo-200">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Platform Analytics, Revenue Charts & Future Options</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
              title="Refresh Platform Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-5 flex-1">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto">
          {[
            { id: 'overview', label: 'Platform Overview', icon: DollarSign },
            { id: 'verify', label: '🔐 Job Verification', icon: ShieldCheck },
            { id: 'charts', label: '📊 Deep Charts & Analytics', icon: BarChart3 },
            { id: 'shops', label: `Shops (${shops.length})`, icon: Store },
            { id: 'future', label: '⚡ Future Options & Controls', icon: Sparkles },
            { id: 'ads', label: '📢 Ad & Promo Engine', icon: Megaphone },
            { id: 'payment', label: '💳 Payment Gateways (bKash/Nagad)', icon: CreditCard },
            { id: 'settings', label: 'System Settings', icon: Settings }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  activeTab === t.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Platform Overview */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* 4 Core Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Platform Monetization (Real Platform Revenue Model) */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-indigo-700/50 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">Platform Monetization</p>
                  <h3 className="text-xl font-extrabold text-white mt-1">Ads & Sponsors</h3>
                  <p className="text-[10px] text-indigo-200 mt-1">Google AdSense + Brand Promos</p>
                </div>
                <div className="p-3 bg-white/10 text-amber-300 rounded-2xl">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Total Shop Counter GMV */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Shop Earnings</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">৳{parseFloat(stats.total_revenue || 0).toFixed(2)}</h3>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">Shop counters income (GMV)</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Today's Shop Counter Volume */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today's Shop Income</p>
                  <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">৳{parseFloat(stats.today_revenue || 0).toFixed(2)}</h3>
                  <p className="text-[10px] text-indigo-600 font-bold mt-1">{stats.today_jobs} orders completed</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* Card 4: Network Size */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Platform Network</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats.total_shops} Shops</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">{stats.total_jobs} total print jobs</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Store className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Chart Preview: Last 7 Days Revenue Trend */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">7-Day Shop Counter Printing Volume</h3>
                  <p className="text-[11px] text-slate-400">Total customer printing spend going directly to shop counters (Platform earns via Ads & Sponsorships)</p>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Live Sync
                </span>
              </div>

              {stats.dailyTrend && stats.dailyTrend.length > 0 ? (
                <div className="grid grid-cols-7 gap-2 pt-6 items-end h-48 border-b border-slate-100 pb-3">
                  {stats.dailyTrend.map((d, i) => {
                    const heightPercent = Math.max(12, Math.round((parseFloat(d.revenue || 0) / maxDailyRevenue) * 100));
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] font-extrabold text-slate-700 opacity-0 group-hover:opacity-100 transition">
                          ৳{parseFloat(d.revenue || 0).toFixed(0)}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[40px] bg-gradient-to-t from-indigo-600 to-blue-500 rounded-t-xl group-hover:brightness-110 transition-all shadow-xs"
                        />
                        <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center">
                          {d.label?.split(' ')[0] || d.date}
                        </span>
                        <span className="text-[9px] text-slate-400">{d.jobs_count} ord</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No order trends recorded in the last 7 days yet.</p>
              )}
            </div>

            {/* Top Performing Shops & Print Mode Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Leaderboard (2 cols) */}
              <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    Top Print Shops Leaderboard
                  </h3>
                  <button onClick={() => setActiveTab('shops')} className="text-[11px] font-bold text-indigo-600 hover:underline">
                    View All Shops →
                  </button>
                </div>

                <div className="space-y-2">
                  {stats.topShops && stats.topShops.map((s, idx) => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[11px] shrink-0 ${
                          idx === 0 ? 'bg-amber-100 text-amber-800' :
                          idx === 1 ? 'bg-slate-200 text-slate-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {s.qr_slug} · {s.jobs_count} jobs</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-slate-900">৳{parseFloat(s.total_revenue || 0).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">{s.total_pages || 0} pages</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status & Mode Breakdown (1 col) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Print Mode Breakdown
                </h3>

                <div className="space-y-3 text-xs">
                  {stats.modeBreakdown && stats.modeBreakdown.map((m, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 capitalize">
                          {m.color_mode === 'color' ? '🎨 Color Print' : '⬛ Black & White'}
                        </span>
                        <span className="font-extrabold text-slate-900">
                          ৳{parseFloat(m.revenue || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{m.files_count} files</span>
                        <span>{m.total_pages} pages</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab: Job Verification & Auth Code Central */}
        {activeTab === 'verify' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-extrabold tracking-tight">Job Authentication & Verification Central</h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Verify the authenticity of any print order across all shops using its unique small Auth Code (e.g.{' '}
                  <span className="font-mono text-amber-300 font-bold">PZ-XXXX</span>), pickup token (#0001), or database ID. Inspect customer audit trail, payment confirmation, and original document specs.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchOrdersList}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Orders</span>
                </button>
              </div>
            </div>

            {/* Search Form */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <label className="text-xs font-extrabold text-slate-800 block">
                Enter Unique Authentication Code or Job Token:
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookupAuth();
                }}
                className="flex flex-col sm:flex-row gap-2.5"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. PZ-7K9M or 0001 or #0001..."
                    value={authSearchCode}
                    onChange={(e) => setAuthSearchCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition"
                  />
                  {authSearchCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthSearchCode('');
                        setAuthJobResult(null);
                        setAuthError('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={authLoading || !authSearchCode.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-500/20 active:scale-98 shrink-0"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authenticate Job</span>
                    </>
                  )}
                </button>
              </form>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            {/* Authenticated Job Result Card */}
            {authJobResult && (
              <div className="bg-white rounded-3xl border-2 border-emerald-500/40 p-5 sm:p-6 shadow-md space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-inner">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                          AUTHENTICATED & VERIFIED
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Verified via Central Database Authority · Order #{authJobResult.job_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Auth Code:</span>
                      <span className="font-mono text-sm font-extrabold text-indigo-700 select-all">
                        {authJobResult.auth_code || 'N/A'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (authJobResult.auth_code) {
                          navigator.clipboard.writeText(authJobResult.auth_code);
                          showToast(`Copied: ${authJobResult.auth_code}`);
                        }
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                      title="Copy Auth Code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">Print Shop</p>
                    <p className="font-bold text-slate-800 text-sm">{authJobResult.shop_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{authJobResult.shop_address || 'No address'}</p>
                    <p className="text-[11px] text-blue-600 font-mono">{authJobResult.shop_phone || 'No phone'}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">Customer</p>
                    <p className="font-bold text-slate-800 text-sm">{authJobResult.customer_name || 'Guest'}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{authJobResult.customer_phone || 'Anonymous'}</p>
                    <p className="text-[10px] text-slate-400">IP: {authJobResult.customer_ip || 'Internal'}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">Amount & Payment</p>
                    <p className="font-extrabold text-slate-900 text-base">
                      ৳{parseFloat(authJobResult.total_price || 0).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          authJobResult.payment_status?.startsWith('paid')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {authJobResult.payment_status}
                      </span>
                      {authJobResult.payment_trx_id && (
                        <span className="text-[10px] font-mono text-slate-500">
                          Trx: {authJobResult.payment_trx_id}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">Lifecycle Status</p>
                    <div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                          authJobResult.status === 'done'
                            ? 'bg-emerald-100 text-emerald-800'
                            : authJobResult.status === 'printing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {authJobResult.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Ordered: {new Date(authJobResult.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Attached Files List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-700">
                    Attached Document Files ({authJobResult.files?.length || 0})
                  </h4>
                  <div className="space-y-1.5">
                    {authJobResult.files?.map((file, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-bold text-slate-800 truncate">{file.original_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0 font-mono">
                          <span>{file.copies} copy(ies)</span>
                          <span>·</span>
                          <span className="uppercase font-bold text-slate-700">{file.color_mode}</span>
                          <span>·</span>
                          <span>{file.paper_size}</span>
                          <span>·</span>
                          <span className="font-extrabold text-slate-900">
                            ৳{parseFloat(file.file_price || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Platform Orders Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Recent Platform Jobs & Quick Auth</h3>
                  <p className="text-[11px] text-slate-400">
                    Click any Auth Code or "Inspect" to run a live authenticity audit.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {ordersList.length} Recent Jobs
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Auth Code</th>
                      <th className="py-2.5 px-3">Job #</th>
                      <th className="py-2.5 px-3">Shop</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Time & Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {ordersList.length > 0 ? (
                      ordersList.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                setAuthSearchCode(order.auth_code);
                                handleLookupAuth(order.auth_code);
                              }}
                              className="font-mono text-[11px] font-extrabold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 transition select-all"
                              title="Click to authenticate this job"
                            >
                              {order.auth_code || 'N/A'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600">#{order.job_code}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 max-w-[140px] truncate">
                            {order.shop_name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-[130px] truncate">
                            {order.customer_name || 'Guest'}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap font-medium">
                            {order.created_at ? (
                              <span>
                                {new Date(order.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })},
                                {' '}
                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-900">
                            ৳{parseFloat(order.total_price || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.payment_status?.startsWith('paid')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                order.status === 'done'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : order.status === 'printing'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setAuthSearchCode(order.auth_code || order.job_code);
                                handleLookupAuth(order.auth_code || order.job_code);
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition"
                            >
                              <ShieldCheck className="w-3 h-3" /> Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-slate-400 text-xs">
                          {ordersLoading ? 'Loading platform orders...' : 'No print jobs recorded yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Deep Charts & Telemetry */}
        {activeTab === 'charts' && stats && (
          <div className="space-y-5 animate-in fade-in duration-150">
            
            {/* 7-Day Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Weekly Revenue Breakdown (৳ BDT)</h3>
                  <p className="text-[11px] text-slate-400">Visual comparison of revenue vs total printed pages</p>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-3 pt-6 items-end h-56 border-b border-slate-100 pb-4">
                {stats.dailyTrend && stats.dailyTrend.map((d, i) => {
                  const revHeight = Math.max(10, Math.round((parseFloat(d.revenue || 0) / maxDailyRevenue) * 100));
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-center opacity-0 group-hover:opacity-100 transition space-y-0.5">
                        <p className="text-[10px] font-extrabold text-indigo-700">৳{parseFloat(d.revenue || 0).toFixed(2)}</p>
                        <p className="text-[9px] text-slate-400">{d.pages} pages</p>
                      </div>
                      <div
                        style={{ height: `${revHeight}%` }}
                        className="w-full max-w-[48px] bg-gradient-to-t from-indigo-600 via-blue-600 to-cyan-400 rounded-t-2xl group-hover:shadow-md transition-all"
                      />
                      <span className="text-[11px] font-bold text-slate-700 truncate">{d.label || d.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peak Rush Hours Grid */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Peak Hours Traffic (24h Platform Cycle)</h3>
                  <p className="text-[11px] text-slate-400">Identify rush hours when print counters experience the highest order surge</p>
                </div>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-2">
                {Array.from({ length: 24 }).map((_, hour) => {
                  const stat = stats.hourlyStats?.find(h => h.hour === hour);
                  const count = stat ? stat.jobs_count : 0;
                  const isPeak = count >= 5;

                  return (
                    <div
                      key={hour}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        isPeak
                          ? 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold'
                          : count > 0
                            ? 'bg-indigo-50/50 border-indigo-200 text-indigo-800 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <p className="text-[10px] font-mono">{hour.toString().padStart(2, '0')}:00</p>
                      <p className="text-xs mt-1">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Registered Shops */}
        {activeTab === 'shops' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search shops by name, slug, phone..."
                  value={searchShop}
                  onChange={e => setSearchShop(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs">
                {['all', 'active', 'suspended'].map(st => (
                  <button
                    key={st}
                    onClick={() => setShopFilterStatus(st)}
                    className={`px-3 py-1 rounded-lg font-bold capitalize transition ${
                      shopFilterStatus === st ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 text-[11px]">
                    <th className="py-3 px-4 font-semibold">Shop & Contact</th>
                    <th className="py-3 px-4 font-semibold">Counter Slug</th>
                    <th className="py-3 px-4 font-semibold">Hours / Status</th>
                    <th className="py-3 px-4 font-semibold">Rates (B&W/Col)</th>
                    <th className="py-3 px-4 font-semibold">Orders & Revenue</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShops.map(s => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs">{s.name}</div>
                        <div className="text-[11px] text-slate-400">{s.email} · {s.phone || 'No phone'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-indigo-600 font-bold">
                        {s.qr_slug}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {s.status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {s.opening_time || '08:00'} - {s.closing_time || '22:00'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        ৳{s.price_bw} / ৳{s.price_color}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">৳{parseFloat(s.total_revenue || 0).toFixed(2)}</span>
                        <div className="text-[10px] text-slate-400">{s.job_count} orders</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedShopForDetails(s)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition"
                            title="View Trade License, NID, Verification & Shop Profile"
                          >
                            <Eye className="w-3 h-3" /> Details
                          </button>
                          <button
                            onClick={() => handleToggleShopStatus(s.id, s.status)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                              s.status === 'active'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {s.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setSelectedShopForQr(s)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition"
                          >
                            <QrCode className="w-3 h-3" /> Standee
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Future Options & Enterprise Controls */}
        {activeTab === 'future' && (
          <form onSubmit={handleSaveSettings} className="space-y-5 animate-in fade-in duration-150 text-xs">
            
            {/* Future Platform Features Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-800/40 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold">Next-Gen Platform Governance & Monetization</h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Configure future monetization, commission fee models, maintenance locks, shop verification policies, and security limits across all connected print shops.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 1. Global Maintenance Mode Switch */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Global Maintenance Mode</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode === '1'}
                    onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked ? '1' : '0' })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  When enabled, all customer upload pages will display a maintenance message while allowing shopkeepers to finish existing orders.
                </p>
                {settings.maintenance_mode === '1' && (
                  <input
                    type="text"
                    placeholder="Custom Maintenance Banner message..."
                    value={settings.maintenance_message || ''}
                    onChange={e => setSettings({ ...settings, maintenance_message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  />
                )}
              </div>

              {/* 2. Platform Commission & Monetization */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  <span>Platform Revenue & Commission Fee</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Set platform commission percentage or fixed fee deducted per print job across the network.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Platform Cut (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 5.0"
                      value={settings.platform_commission_percent || '0'}
                      onChange={e => setSettings({ ...settings, platform_commission_percent: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Fixed Fee (৳/order)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 1.0"
                      value={settings.platform_fixed_fee || '0'}
                      onChange={e => setSettings({ ...settings, platform_fixed_fee: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Shop Registration Approval Policy */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Shop Onboarding Approval</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Choose whether newly registered print shops go live immediately or require manual admin review.
                </p>
                <select
                  value={settings.shop_approval_policy || 'auto'}
                  onChange={e => setSettings({ ...settings, shop_approval_policy: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                >
                  <option value="auto">⚡ Instant Auto-Approval (Recommended)</option>
                  <option value="manual">🔒 Manual Admin Review Required</option>
                </select>
              </div>

              {/* 4. Global File Expiry & Auto-Purge */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>File Storage Retention Window</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Maximum time unprinted customer documents stay on the server before automatic deletion.
                </p>
                <select
                  value={settings.file_retention_minutes || '30'}
                  onChange={e => setSettings({ ...settings, file_retention_minutes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                >
                  <option value="15">15 Minutes (Strict Privacy)</option>
                  <option value="30">30 Minutes (Standard)</option>
                  <option value="60">1 Hour (Busy Queues)</option>
                  <option value="1440">24 Hours (Extended Archive)</option>
                </select>
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/25 transition active:scale-95"
              >
                {savingSettings ? 'Saving...' : '✓ Save Future Settings'}
              </button>
            </div>

          </form>
        )}

        {/* Tab 5: Ad & Promo Engine */}
        {activeTab === 'ads' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 animate-in fade-in duration-150 text-xs">
            
            {/* 1. BRAND COLLABORATION & SPONSOR ENGINE */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Brand Collaboration & Sponsor Campaign</h3>
                    <p className="text-[11px] text-slate-300">Monetize high-dwell customer screens with direct brand deals, promo codes & tracked outbound links</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-300">Campaign Active:</span>
                  <input
                    type="checkbox"
                    checked={settings.brand_sponsor_enabled === '1'}
                    onChange={e => setSettings({ ...settings, brand_sponsor_enabled: e.target.checked ? '1' : '0' })}
                    className="w-5 h-5 text-indigo-500 rounded focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Sponsor Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Brand / Sponsor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pathao / bKash / 10 Minute School"
                    value={settings.brand_name || ''}
                    onChange={e => setSettings({ ...settings, brand_name: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. ⭐ SPONSOR / 🎓 STUDENT DEAL"
                    value={settings.brand_badge || ''}
                    onChange={e => setSettings({ ...settings, brand_badge: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Promo / Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. PRNTEZ20 (optional)"
                    value={settings.brand_coupon_code || ''}
                    onChange={e => setSettings({ ...settings, brand_coupon_code: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono font-bold placeholder:text-slate-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Campaign Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Get 20% Cashback on University Rides"
                    value={settings.brand_headline || ''}
                    onChange={e => setSettings({ ...settings, brand_headline: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Logo / Banner Image URL</label>
                  <input
                    type="url"
                    placeholder="https://.../brand-logo.png"
                    value={settings.brand_image_url || ''}
                    onChange={e => setSettings({ ...settings, brand_image_url: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Campaign Body Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Use code PRNTEZ20 on the app to claim your student discount."
                    value={settings.brand_description || ''}
                    onChange={e => setSettings({ ...settings, brand_description: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Claim Offer → / Install App"
                    value={settings.brand_cta_text || ''}
                    onChange={e => setSettings({ ...settings, brand_cta_text: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Target Landing Page URL</label>
                  <input
                    type="url"
                    placeholder="https://sponsorbrand.com/offer?ref=prntez"
                    value={settings.brand_target_url || ''}
                    onChange={e => setSettings({ ...settings, brand_target_url: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-mono"
                  />
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Sponsor Clicks</p>
                    <p className="text-lg font-extrabold text-amber-400">{settings.brand_sponsor_clicks || 0}</p>
                  </div>
                  <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-1 rounded-lg">Performance Proof</span>
                </div>
              </div>
            </div>

            {/* 2. Customer Banner Notice */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Megaphone className="w-4 h-4 text-amber-500" />
                  <span>Customer Upload Page Top Marquee Banner</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ad_customer_enabled === '1'}
                  onChange={e => setSettings({ ...settings, ad_customer_enabled: e.target.checked ? '1' : '0' })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Badge Text</label>
                  <input
                    type="text"
                    value={settings.ad_customer_badge || '🔥 PROMO'}
                    onChange={e => setSettings({ ...settings, ad_customer_badge: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Banner Text</label>
                  <input
                    type="text"
                    value={settings.ad_customer_text || ''}
                    onChange={e => setSettings({ ...settings, ad_customer_text: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Google AdSense Configuration */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Google AdSense Monetization Engine</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.adsense_enabled === '1'}
                  onChange={e => setSettings({ ...settings, adsense_enabled: e.target.checked ? '1' : '0' })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">AdSense Publisher Client ID</label>
                  <input
                    type="text"
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                    value={settings.adsense_client_id || ''}
                    onChange={e => setSettings({ ...settings, adsense_client_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Order Live Tracker Ad Slot ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 1234567890"
                    value={settings.adsense_slot_track || ''}
                    onChange={e => setSettings({ ...settings, adsense_slot_track: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Customer Upload Page Ad Slot ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={settings.adsense_slot_customer_bottom || ''}
                    onChange={e => setSettings({ ...settings, adsense_slot_customer_bottom: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/25 transition active:scale-95"
              >
                {savingSettings ? 'Saving...' : '✓ Save Ad & Brand Settings'}
              </button>
            </div>

          </form>
        )}

        {/* Tab: Payment Gateways (bKash, Nagad, UddoktaPay, SSLCommerz) */}
        {activeTab === 'payment' && (
          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs animate-in fade-in duration-150">
            {/* Top Gateway Master Control Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl shadow-md shadow-pink-500/20">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                      Automated Payment Gateways & MFS Checkout
                      <span className="px-2 py-0.5 bg-pink-100 text-pink-700 font-extrabold rounded-full text-[10px]">
                        bKash · Nagad · Rocket
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Accept automated instant payments from customers. Orders are automatically marked as paid upon verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-xs">Master Gateway</span>
                    <input
                      type="checkbox"
                      checked={settings.pgw_enabled !== '0'}
                      onChange={e => setSettings({ ...settings, pgw_enabled: e.target.checked ? '1' : '0' })}
                      className="w-4 h-4 text-pink-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    <span className="text-xs">Sandbox / Test Mode</span>
                    <input
                      type="checkbox"
                      checked={settings.pgw_sandbox_mode !== '0'}
                      onChange={e => setSettings({ ...settings, pgw_sandbox_mode: e.target.checked ? '1' : '0' })}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Active Provider Selector */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                  Active Payment Processor
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: 'simulator', title: '🧪 Interactive Sandbox', badge: 'Official bKash & Nagad', desc: 'Full OTP & PIN sandbox for bKash & Nagad test runs.' },
                    { id: 'nagad', title: '🟠 Nagad Official PGW', badge: 'Direct Nagad API', desc: 'Direct Nagad Sandbox / Live PGW handshake & verification.' },
                    { id: 'bkash', title: '🌸 bKash Tokenized Direct', badge: 'Official bKash PGW', desc: 'Direct bKash Tokenized Checkout API integration.' },
                    { id: 'uddoktapay', title: '🚀 UddoktaPay PGW', badge: 'bKash + Nagad + Rocket', desc: 'All-in-one payment gateway with instant webhooks.' },
                    { id: 'sslcommerz', title: '💳 SSLCommerz', badge: 'Cards + MFS + NetBanking', desc: 'Multi-channel gateway for cards and MFS.' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSettings({ ...settings, pgw_active_provider: p.id })}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        (settings.pgw_active_provider || 'simulator') === p.id
                          ? 'border-pink-500 bg-pink-50/60 ring-2 ring-pink-500/20 text-slate-900 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-extrabold text-xs">{p.title}</span>
                          {(settings.pgw_active_provider || 'simulator') === p.id && (
                            <CheckCircle className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                          )}
                        </div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-100 text-slate-600 mb-1.5">
                          {p.badge}
                        </span>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{p.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Provider Configuration Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Option 1: UddoktaPay (Recommended All-in-One for bKash & Nagad) */}
              <div className={`bg-white p-5 rounded-3xl border transition shadow-xs space-y-3.5 ${
                settings.pgw_active_provider === 'uddoktapay' ? 'border-indigo-400 ring-2 ring-indigo-500/10' : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <h4 className="font-extrabold text-xs text-slate-800">UddoktaPay Configuration</h4>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Supports bKash, Nagad, Rocket
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">API Key</label>
                  <input
                    type="password"
                    placeholder="e.g. 983e42f73c40d117d4397d4fae711ae5..."
                    value={settings.uddoktapay_api_key || ''}
                    onChange={e => setSettings({ ...settings, uddoktapay_api_key: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">API Endpoint URL</label>
                  <input
                    type="text"
                    placeholder="https://sandbox.uddoktapay.com/api/checkout-v2"
                    value={settings.uddoktapay_api_url || 'https://sandbox.uddoktapay.com/api/checkout-v2'}
                    onChange={e => setSettings({ ...settings, uddoktapay_api_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Live Endpoint: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://pay.uddoktapay.com/api/checkout-v2</code></p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <p className="text-[10px] font-bold text-slate-600">Automated Webhook Callback URL:</p>
                  <code className="text-[10px] text-indigo-700 bg-white px-2 py-1 rounded border border-slate-200 block font-mono break-all select-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/payment/webhook/uddoktapay` : '/api/payment/webhook/uddoktapay'}
                  </code>
                </div>
              </div>

              {/* Option: Nagad Official PGW (Sandbox & Live) */}
              <div className={`bg-white p-5 rounded-3xl border transition shadow-xs space-y-3.5 ${
                settings.pgw_active_provider === 'nagad' ? 'border-orange-400 ring-2 ring-orange-500/10' : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F1592A]" />
                    <h4 className="font-extrabold text-xs text-slate-800">Nagad Official PGW (v-0.2)</h4>
                  </div>
                  <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                    Direct Nagad API
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Nagad Merchant ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 683002007104225"
                      value={settings.nagad_merchant_id || ''}
                      onChange={e => setSettings({ ...settings, nagad_merchant_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Merchant Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 01711428070"
                      value={settings.nagad_merchant_number || ''}
                      onChange={e => setSettings({ ...settings, nagad_merchant_number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Nagad DFS Endpoint URL</label>
                  <input
                    type="text"
                    placeholder="http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs"
                    value={settings.nagad_base_url || 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs'}
                    onChange={e => setSettings({ ...settings, nagad_base_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Live Endpoint: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://api.mynagad.com/api/dfs</code></p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Nagad Public Key (RSA Certificate / Public Key)</label>
                  <textarea
                    rows={2}
                    placeholder="-----BEGIN PUBLIC KEY----- ..."
                    value={settings.nagad_public_key || ''}
                    onChange={e => setSettings({ ...settings, nagad_public_key: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Merchant Private Key (RSA Private Key)</label>
                  <textarea
                    rows={2}
                    placeholder="-----BEGIN RSA PRIVATE KEY----- ..."
                    value={settings.nagad_private_key || ''}
                    onChange={e => setSettings({ ...settings, nagad_private_key: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-800"
                  />
                </div>

                <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl text-[10px] text-orange-950 leading-relaxed">
                  Nagad PGW executes encrypted 2-phase handshake and confirms payment via <code>/api/payment/callback/nagad</code>.
                </div>
              </div>

              {/* Option 2: bKash Tokenized Direct API */}
              <div className={`bg-white p-5 rounded-3xl border transition shadow-xs space-y-3.5 ${
                settings.pgw_active_provider === 'bkash' ? 'border-pink-400 ring-2 ring-pink-500/10' : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-600" />
                    <h4 className="font-extrabold text-xs text-slate-800">bKash Tokenized API</h4>
                  </div>
                  <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                    Direct Merchant API
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">App Key</label>
                    <input
                      type="text"
                      placeholder="bKash App Key"
                      value={settings.bkash_app_key || ''}
                      onChange={e => setSettings({ ...settings, bkash_app_key: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">App Secret</label>
                    <input
                      type="password"
                      placeholder="bKash App Secret"
                      value={settings.bkash_app_secret || ''}
                      onChange={e => setSettings({ ...settings, bkash_app_secret: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Username</label>
                    <input
                      type="text"
                      placeholder="bKash Username"
                      value={settings.bkash_username || ''}
                      onChange={e => setSettings({ ...settings, bkash_username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="bKash Password"
                      value={settings.bkash_password || ''}
                      onChange={e => setSettings({ ...settings, bkash_password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="p-3 bg-pink-50/60 border border-pink-200 rounded-xl text-[10px] text-pink-900 leading-relaxed">
                  bKash tokenized checkout redirects customer to bKash portal, executes grant token, and confirms payment callback automatically.
                </div>
              </div>

              {/* Option 3: SSLCommerz Gateway */}
              <div className={`bg-white p-5 rounded-3xl border transition shadow-xs space-y-3.5 ${
                settings.pgw_active_provider === 'sslcommerz' ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <h4 className="font-extrabold text-xs text-slate-800">SSLCommerz Credentials</h4>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Cards & NetBanking
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Store ID</label>
                    <input
                      type="text"
                      placeholder="e.g. testbox"
                      value={settings.sslcommerz_store_id || ''}
                      onChange={e => setSettings({ ...settings, sslcommerz_store_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Store Password</label>
                    <input
                      type="password"
                      placeholder="Store Password"
                      value={settings.sslcommerz_store_passwd || ''}
                      onChange={e => setSettings({ ...settings, sslcommerz_store_passwd: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Option 4: Interactive Sandbox Simulator */}
              <div className={`bg-white p-5 rounded-3xl border transition shadow-xs space-y-3.5 ${
                settings.pgw_active_provider === 'simulator' ? 'border-emerald-400 ring-2 ring-emerald-500/10' : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <h4 className="font-extrabold text-xs text-slate-800">Interactive Sandbox Simulator</h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Local & Staging Safe
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  The Simulator allows you and your team to fully test the bKash and Nagad payment flow end-to-end. When customers or testers submit an order with bKash/Nagad, an authentic mobile PIN/OTP screen appears and verifies the transaction.
                </p>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[10px] text-emerald-900 space-y-1">
                  <p className="font-bold">✓ Test PIN for Simulator: <span className="font-mono text-slate-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300">12345</span></p>
                  <p className="font-bold">✓ Test OTP for Simulator: <span className="font-mono text-slate-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300">123456</span></p>
                </div>
              </div>

            </div>

            {/* Save Button Bar */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs shadow-md shadow-pink-500/25 transition active:scale-95 cursor-pointer"
              >
                {savingSettings ? 'Saving...' : '✓ Save Payment Gateway Settings'}
              </button>
            </div>

            {/* Live Transactions Audit Table */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">Recent Payment Transactions</h4>
                    <p className="text-[10px] text-slate-400">Live audit log of all online and MFS payments received through the platform</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchPaymentTransactions}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${paymentLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Log</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Trx ID</th>
                      <th className="py-2.5 px-3">Order ID / Code</th>
                      <th className="py-2.5 px-3">Gateway</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          No online payment transactions recorded yet. Completed test payments will appear here in real-time.
                        </td>
                      </tr>
                    ) : (
                      paymentTransactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {tx.trx_id || tx.payment_id || 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-blue-600">
                            #{tx.job_id}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700 capitalize">
                            {tx.provider}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              tx.payment_method === 'bkash' ? 'bg-pink-100 text-pink-800' :
                              tx.payment_method === 'nagad' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {tx.payment_method || 'MFS'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-900">
                            ৳{parseFloat(tx.amount || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                              tx.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                            {new Date(tx.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </form>
        )}

        {/* Tab 6: General Settings */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-slate-800">General Platform Configuration</h3>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={settings.platform_name || 'prntez'}
                onChange={e => setSettings({ ...settings, platform_name: e.target.value })}
                className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Admin Master Password</label>
              <input
                type="password"
                placeholder="Change master password..."
                value={settings.admin_password || ''}
                onChange={e => setSettings({ ...settings, admin_password: e.target.value })}
                className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
              />
            </div>

            {/* File Retention & Privacy Controls */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Automated File Cleanup & Privacy Retention
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure when printed and unprinted customer documents are automatically purged from the server disk.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <span>Auto-Cleanup Active</span>
                  <input
                    type="checkbox"
                    checked={settings.file_cleanup_enabled !== '0'}
                    onChange={e => setSettings({ ...settings, file_cleanup_enabled: e.target.checked ? '1' : '0' })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-700 block">
                    ✓ Successful Prints (Wiping Time / Retention)
                  </label>
                  <p className="text-[10px] text-slate-500">
                    How long printed documents remain in "Freshly Printed" before being wiped and purged:
                  </p>
                  <select
                    value={settings.file_cleanup_success_minutes ?? '30'}
                    onChange={e => setSettings({ ...settings, file_cleanup_success_minutes: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="0">⚡ Delete Immediately (0 minutes)</option>
                    <option value="1">1 Minute (Fast Wipe Test)</option>
                    <option value="2">2 Minutes</option>
                    <option value="5">5 Minutes</option>
                    <option value="10">10 Minutes</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes (Recommended)</option>
                    <option value="60">1 Hour</option>
                    <option value="180">3 Hours</option>
                    <option value="1440">24 Hours (1 Day)</option>
                    <option value="-1">Never auto-delete (Manual wipe only)</option>
                  </select>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">Or set exact minutes:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        placeholder="30"
                        value={settings.file_cleanup_success_minutes ?? '30'}
                        onChange={e => setSettings({ ...settings, file_cleanup_success_minutes: e.target.value })}
                        className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] font-bold text-slate-500">mins</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-700 block">
                    ⚠️ Unfinished / Abandoned Prints (Pending / Error)
                  </label>
                  <p className="text-[10px] text-slate-500">
                    How long to keep files for abandoned or unprinted orders before deleting:
                  </p>
                  <select
                    value={settings.file_cleanup_unsuccess_minutes ?? '1440'}
                    onChange={e => setSettings({ ...settings, file_cleanup_unsuccess_minutes: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                    <option value="180">3 Hours</option>
                    <option value="360">6 Hours</option>
                    <option value="720">12 Hours</option>
                    <option value="1440">24 Hours (Default)</option>
                    <option value="2880">48 Hours (2 Days)</option>
                    <option value="-1">Never auto-delete (Manual purge only)</option>
                  </select>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">Or set exact minutes:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        placeholder="1440"
                        value={settings.file_cleanup_unsuccess_minutes ?? '1440'}
                        onChange={e => setSettings({ ...settings, file_cleanup_unsuccess_minutes: e.target.value })}
                        className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] font-bold text-slate-500">mins</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Google OAuth 2.0 Web Authentication Settings */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Google OAuth 2.0 Sign-In & Registration
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Allow shop owners to register and sign in seamlessly using their Gmail / Google Account.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {settings.google_client_id ? 'Configured' : 'ID Required'}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 ml-2">
                    <span className="text-xs font-semibold text-slate-600">Active</span>
                    <input
                      type="checkbox"
                      checked={settings.google_auth_enabled !== '0'}
                      onChange={e => setSettings({ ...settings, google_auth_enabled: e.target.checked ? '1' : '0' })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between text-xs">
                    <span>Google OAuth 2.0 Web Client ID</span>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-bold text-[10px] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Open Google Cloud Credentials Console
                    </a>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"
                    value={settings.google_client_id || ''}
                    onChange={e => setSettings({ ...settings, google_client_id: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                  />
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    How to get your Google Client ID:
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-blue-800/90 pl-1">
                    <li>Go to <strong>Google Cloud Console → APIs & Services → Credentials</strong>.</li>
                    <li>Click <strong>+ Create Credentials → OAuth client ID</strong> (Application type: <em>Web application</em>).</li>
                    <li>Under <strong>Authorized JavaScript origins</strong>, add: <code className="bg-blue-100 px-1 py-0.2 rounded font-mono text-[10px]">https://prntez.com</code> and <code className="bg-blue-100 px-1 py-0.2 rounded font-mono text-[10px]">http://localhost:5000</code>.</li>
                    <li>Copy the <strong>Client ID</strong>, paste it into the field above, and click <strong>Save System Settings</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
            >
              {savingSettings ? 'Saving...' : '✓ Save System Settings'}
            </button>
          </form>
        )}

      </main>

      {/* Selected Shop Standee Modal */}
      {selectedShopForQr && (
        <ShopQrModal
          shop={selectedShopForQr}
          onClose={() => setSelectedShopForQr(null)}
        />
      )}

      {/* Selected Shop Full Verification & Details Modal */}
      {selectedShopForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    {selectedShopForDetails.name}
                    {selectedShopForDetails.is_verified ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified Shop
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-extrabold rounded-full border border-amber-200">
                        Unverified
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">QR Slug: <span className="font-mono font-bold text-indigo-600">/{selectedShopForDetails.qr_slug}</span> · ID #{selectedShopForDetails.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedShopForDetails(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs text-slate-700">
              {/* Business & Legal Credentials */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Legal & Verification Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Trade License Number</span>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">
                      {selectedShopForDetails.trade_license || <span className="text-slate-400 font-normal italic">Not provided</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Owner NID / National ID</span>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">
                      {selectedShopForDetails.nid_number || <span className="text-slate-400 font-normal italic">Not provided</span>}
                    </p>
                  </div>
                </div>

                {/* Trade License Document Image */}
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1.5">Trade License Document Photo</span>
                  {selectedShopForDetails.trade_license_image ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-300 max-h-56 bg-slate-100 flex items-center justify-center">
                      <img
                        src={selectedShopForDetails.trade_license_image}
                        alt="Trade License"
                        className="object-contain max-h-56 w-full"
                      />
                      <a
                        href={selectedShopForDetails.trade_license_image}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow"
                      >
                        <ExternalLink className="w-3 h-3" /> View Full Image
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
                      No Trade License image uploaded yet by this shopkeeper.
                    </div>
                  )}
                </div>

                {/* Shop Counter / Storefront Image */}
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1.5">Storefront / Counter Image</span>
                  {selectedShopForDetails.shop_image ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-300 max-h-56 bg-slate-100 flex items-center justify-center">
                      <img
                        src={selectedShopForDetails.shop_image}
                        alt="Storefront"
                        className="object-contain max-h-56 w-full"
                      />
                      <a
                        href={selectedShopForDetails.shop_image}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow"
                      >
                        <ExternalLink className="w-3 h-3" /> View Full Image
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
                      No Storefront image uploaded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Owner & Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    Owner & Contacts
                  </h4>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Owner Full Name</span>
                    <p className="font-bold text-slate-800">{selectedShopForDetails.owner_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Primary Email</span>
                    <p className="font-bold text-slate-800">{selectedShopForDetails.email}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Phone Numbers</span>
                    <p className="font-bold text-slate-800">{selectedShopForDetails.phone || 'N/A'} {selectedShopForDetails.alt_phone ? `· ${selectedShopForDetails.alt_phone}` : ''}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Shop Address</span>
                    <p className="font-semibold text-slate-700">{selectedShopForDetails.address || 'N/A'}</p>
                  </div>
                  {selectedShopForDetails.maps_url && (
                    <a
                      href={selectedShopForDetails.maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold text-[11px] pt-1"
                    >
                      <Globe className="w-3 h-3" /> Open in Google Maps
                    </a>
                  )}
                </div>

                {/* Rates & MFS Numbers */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Rates & Counter Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block">B&W Rate</span>
                      <p className="font-extrabold text-slate-900">৳{selectedShopForDetails.price_bw || '2.00'}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block">Color Rate</span>
                      <p className="font-extrabold text-indigo-600">৳{selectedShopForDetails.price_color || '10.00'}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block">Legal / A3</span>
                      <p className="font-bold text-slate-800">৳{selectedShopForDetails.price_legal || '3.00'} / ৳{selectedShopForDetails.price_a3 || '15.00'}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block">Hours</span>
                      <p className="font-bold text-slate-800">{selectedShopForDetails.opening_time || '08:00'} - {selectedShopForDetails.closing_time || '22:00'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">bKash Number</span>
                    <p className="font-bold text-slate-800">{selectedShopForDetails.bkash_number || <span className="text-slate-400 italic">Not set</span>}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Nagad Number</span>
                    <p className="font-bold text-slate-800">{selectedShopForDetails.nagad_number || <span className="text-slate-400 italic">Not set</span>}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Created: {new Date(selectedShopForDetails.created_at).toLocaleDateString()}</span>
              <button
                onClick={() => setSelectedShopForDetails(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
