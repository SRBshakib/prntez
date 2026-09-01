import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Users, Printer, DollarSign, Settings, Store, RefreshCw,
  KeyRound, LogOut, Check, Search, AlertCircle, Megaphone, Sparkles, ExternalLink, QrCode
} from 'lucide-react';
import ShopQrModal from '../components/ShopQrModal';

export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'shops' | 'ads' | 'settings'
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchShop, setSearchShop] = useState('');
  const [selectedShopForQr, setSelectedShopForQr] = useState(null);

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
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (_) {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredShops = useMemo(() => {
    if (!searchShop.trim()) return shops;
    const q = searchShop.toLowerCase();
    return shops.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.qr_slug || '').toLowerCase().includes(q)
    );
  }, [shops, searchShop]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-800 leading-tight">Printez Admin Central</h1>
              <p className="text-[11px] text-slate-400">Platform Analytics, Ad Spaces & Settings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full space-y-5 flex-1">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          {[
            { id: 'overview', label: 'Platform Metrics', icon: DollarSign },
            { id: 'shops', label: `Shops (${shops.length})`, icon: Store },
            { id: 'ads', label: '📢 Ad & Promo Manager', icon: Megaphone },
            { id: 'settings', label: 'Platform Settings', icon: Settings }
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

        {/* Tab 1: Overview Metrics */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Total Revenue</p>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">৳{parseFloat(stats.total_revenue || 0).toFixed(2)}</h3>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Total Orders</p>
                  <h3 className="text-xl font-extrabold text-indigo-600 mt-0.5">{stats.total_jobs}</h3>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Orders Today</p>
                  <h3 className="text-xl font-extrabold text-amber-600 mt-0.5">{stats.today_jobs}</h3>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <RefreshCw className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Active Shops</p>
                  <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.total_shops}</h3>
                </div>
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                  <Store className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Registered Shops */}
        {activeTab === 'shops' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search shops..."
                  value={searchShop}
                  onChange={e => setSearchShop(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-4 font-semibold">Shop</th>
                    <th className="py-2.5 px-4 font-semibold">Slug</th>
                    <th className="py-2.5 px-4 font-semibold">Rates (B&W / Color)</th>
                    <th className="py-2.5 px-4 font-semibold">Orders</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Standee QR</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShops.map(s => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.email} · {s.phone || 'No phone'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-indigo-600 font-semibold">
                        {s.qr_slug}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        ৳{s.price_bw} / ৳{s.price_color}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {s.job_count}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedShopForQr(s)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <QrCode className="w-3 h-3" /> Standee
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Ad & Promo Banner Manager */}
        {activeTab === 'ads' && (
          <div className="space-y-6 max-w-2xl animate-in fade-in duration-150">
            
            {/* Customer Portal Banner Configuration */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <span>🛒 Customer Portal Banner</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Displayed above upload form to all customers</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <span>Enabled</span>
                  <input
                    type="checkbox"
                    checked={settings.ad_customer_enabled === '1' || settings.ad_customer_enabled === 'true'}
                    onChange={e => setSettings({ ...settings, ad_customer_enabled: e.target.checked ? '1' : '0' })}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1 text-xs">Badge Label</label>
                  <input
                    type="text"
                    value={settings.ad_customer_badge || '🔥 PROMO'}
                    onChange={e => setSettings({ ...settings, ad_customer_badge: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-600 block mb-1 text-xs">Target Link URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={settings.ad_customer_link || ''}
                    onChange={e => setSettings({ ...settings, ad_customer_link: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1 text-xs">Banner Message Text</label>
                <textarea
                  rows="2"
                  value={settings.ad_customer_text || ''}
                  onChange={e => setSettings({ ...settings, ad_customer_text: e.target.value })}
                  placeholder="Need bulk prints? Special student & office packages available at the counter!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Live Preview */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Live Customer Preview</span>
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-extrabold text-[10px] uppercase shrink-0">
                      {settings.ad_customer_badge || '🔥 PROMO'}
                    </span>
                    <p className="font-medium text-slate-800 text-xs truncate">
                      {settings.ad_customer_text || 'Promo message here...'}
                    </p>
                  </div>
                  {settings.ad_customer_link && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold shrink-0">
                      View Offer →
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Shop Dashboard Banner Configuration */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <span>🏪 Shop POS Partner Banner</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Displayed in shop dashboard sidebar to all shop owners</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <span>Enabled</span>
                  <input
                    type="checkbox"
                    checked={settings.ad_shop_enabled === '1' || settings.ad_shop_enabled === 'true'}
                    onChange={e => setSettings({ ...settings, ad_shop_enabled: e.target.checked ? '1' : '0' })}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1 text-xs">Badge Label</label>
                  <input
                    type="text"
                    value={settings.ad_shop_badge || '📢 SUPPLIES'}
                    onChange={e => setSettings({ ...settings, ad_shop_badge: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-600 block mb-1 text-xs">Target Link URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={settings.ad_shop_link || ''}
                    onChange={e => setSettings({ ...settings, ad_shop_link: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1 text-xs">Banner Message Text</label>
                <textarea
                  rows="2"
                  value={settings.ad_shop_text || ''}
                  onChange={e => setSettings({ ...settings, ad_shop_text: e.target.value })}
                  placeholder="Wholesale A4 Paper & Ink Cartridges at special partner rates..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Live Preview */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Live Shop Preview</span>
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-3.5 space-y-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-indigo-500 text-white text-[10px] font-extrabold uppercase">
                    {settings.ad_shop_badge || '📢 SUPPLIES'}
                  </span>
                  <p className="text-slate-200 text-xs">
                    {settings.ad_shop_text || 'Partner message here...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Google AdSense Global Network Configuration */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <span>⚡ Google AdSense Spaces</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Monetize customer upload pages, order tracking, and shop POS</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <span>AdSense Active</span>
                  <input
                    type="checkbox"
                    checked={settings.adsense_enabled === '1' || settings.adsense_enabled === 'true'}
                    onChange={e => setSettings({ ...settings, adsense_enabled: e.target.checked ? '1' : '0' })}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1 text-xs">
                  Google AdSense Publisher / Client ID
                </label>
                <input
                  type="text"
                  placeholder="ca-pub-1234567890123456"
                  value={settings.adsense_client_id || ''}
                  onChange={e => setSettings({ ...settings, adsense_client_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Your Google AdSense account ID.</p>
              </div>

              <div className="space-y-3 pt-1">
                <p className="font-extrabold text-slate-700 text-xs">Customer Facing Slots:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1 text-[11px]">Upload Page (Bottom)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1001"
                      value={settings.adsense_slot_customer_bottom || ''}
                      onChange={e => setSettings({ ...settings, adsense_slot_customer_bottom: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1 text-[11px]">Uploading Modal (Upload Time)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1002"
                      value={settings.adsense_slot_customer_uploading || ''}
                      onChange={e => setSettings({ ...settings, adsense_slot_customer_uploading: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1 text-[11px]">Track Order Page</label>
                    <input
                      type="text"
                      placeholder="e.g. 1003"
                      value={settings.adsense_slot_track || ''}
                      onChange={e => setSettings({ ...settings, adsense_slot_track: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="font-extrabold text-slate-700 text-xs">Shop Dashboard POS Slots:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1 text-[11px]">Shop Top Banner</label>
                    <input
                      type="text"
                      placeholder="e.g. 2001"
                      value={settings.adsense_slot_shop_top || ''}
                      onChange={e => setSettings({ ...settings, adsense_slot_shop_top: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1 text-[11px]">Shop Sidebar Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. 2002"
                      value={settings.adsense_slot_shop_side || ''}
                      onChange={e => setSettings({ ...settings, adsense_slot_shop_side: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1 text-[11px]">Shop Bottom Banner</label>
                    <input
                      type="text"
                      placeholder="e.g. 2003"
                      value={settings.adsense_slot_shop_bottom || ''}
                      onChange={e => setSettings({ ...settings, adsense_slot_shop_bottom: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-700">💡 How it works:</p>
                <p>• If Publisher ID or Slot ID is blank, a clean sponsored placeholder banner is shown so layouts remain responsive.</p>
                <p>• When Publisher ID and Slot IDs are provided, Google AdSense responsive ad units automatically fill the slots.</p>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {savingSettings ? 'Saving...' : saveSuccess ? '✓ Ads & AdSense Saved!' : 'Save All Ads & AdSense Settings'}
            </button>

          </div>
        )}


        {/* Tab 4: System Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs max-w-xl animate-in fade-in duration-150">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Platform Configuration</h3>
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Platform Name</label>
                <input
                  type="text"
                  value={settings.platform_name || 'Printez'}
                  onChange={e => setSettings({ ...settings, platform_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">File Expiry (Minutes)</label>
                  <input
                    type="number"
                    value={settings.file_expiry_minutes || '30'}
                    onChange={e => setSettings({ ...settings, file_expiry_minutes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Max File Size (MB)</label>
                  <input
                    type="number"
                    value={settings.max_file_size_mb || '50'}
                    onChange={e => setSettings({ ...settings, max_file_size_mb: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Admin Access Password</label>
                <input
                  type="text"
                  value={settings.admin_password || 'admin@printshare2026'}
                  onChange={e => setSettings({ ...settings, admin_password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                {savingSettings ? 'Saving...' : saveSuccess ? '✓ Settings Saved!' : 'Save System Settings'}
              </button>
            </form>
          </div>
        )}

      </main>

      {/* Advanced Shop QR Poster & Standee Modal */}
      {selectedShopForQr && (
        <ShopQrModal
          shop={selectedShopForQr}
          onClose={() => setSelectedShopForQr(null)}
        />
      )}

    </div>
  );
}
