import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Users, Printer, DollarSign, Settings, Store, RefreshCw,
  KeyRound, LogOut, Check, Search, AlertCircle, Megaphone, Sparkles, ExternalLink,
  QrCode, BarChart3, TrendingUp, Layers, Ban, CheckCircle, Percent, Clock,
  FileText, Shield, Globe, Award, Zap, Phone, MessageCircle, AlertTriangle,
  Eye, Image as ImageIcon, X
} from 'lucide-react';
import ShopQrModal from '../components/ShopQrModal';

export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'charts' | 'shops' | 'ads' | 'settings' | 'future'
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchShop, setSearchShop] = useState('');
  const [shopFilterStatus, setShopFilterStatus] = useState('all');
  const [selectedShopForQr, setSelectedShopForQr] = useState(null);
  const [selectedShopForDetails, setSelectedShopForDetails] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

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
      const [statsRes, shopsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/shops'),
        fetch('/api/admin/settings')
      ]);

      const statsData = await statsRes.json();
      const shopsData = await shopsRes.json();
      const settingsData = await settingsRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (shopsData.success) setShops(shopsData.shops || []);
      if (settingsData.success) setSettings(settingsData.settings || {});
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
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
            { id: 'charts', label: '📊 Deep Charts & Analytics', icon: BarChart3 },
            { id: 'shops', label: `Shops (${shops.length})`, icon: Store },
            { id: 'future', label: '⚡ Future Options & Controls', icon: Sparkles },
            { id: 'ads', label: '📢 Ad & Promo Engine', icon: Megaphone },
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
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <label className="font-bold text-slate-700 block mb-1">
                    ✓ Successful Prints (Status: Done)
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2">
                    How long to retain files on the server after shop marks an order Done:
                  </p>
                  <select
                    value={settings.file_cleanup_success_minutes ?? '30'}
                    onChange={e => setSettings({ ...settings, file_cleanup_success_minutes: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="0">⚡ Delete Immediately (0 minutes)</option>
                    <option value="5">5 Minutes</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes (Recommended)</option>
                    <option value="60">1 Hour</option>
                    <option value="180">3 Hours</option>
                    <option value="1440">24 Hours (1 Day)</option>
                    <option value="-1">Never auto-delete (Manual purge only)</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <label className="font-bold text-slate-700 block mb-1">
                    ⚠️ Unfinished / Abandoned Prints (Pending / Error)
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2">
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
