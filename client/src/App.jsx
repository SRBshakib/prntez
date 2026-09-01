import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import CustomerUpload from './pages/CustomerUpload';
import TrackJob from './pages/TrackJob';
import ShopDashboard from './pages/ShopDashboard';
import ShopAuth from './pages/ShopAuth';
import AdminDashboard from './pages/AdminDashboard';
import { Printer, Store, ShieldCheck, Search, ArrowRight, Home } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'upload' | 'track' | 'shop' | 'admin'
  const [jobCode, setJobCode] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [currentShop, setCurrentShop] = useState(null);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    // Restore persistent shop session
    const savedShop = localStorage.getItem('prntez_shop');
    if (savedShop) {
      try { setCurrentShop(JSON.parse(savedShop)); } catch (_) {}
    }

    // Check URL path or params for initial routing
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');

    if (path.startsWith('/track/')) {
      const code = path.replace('/track/', '');
      if (code) {
        setJobCode(code);
        setView('track');
      }
    } else if (path === '/shop' || urlParams.get('view') === 'shop') {
      setView('shop');
    } else if (path === '/admin' || urlParams.get('view') === 'admin') {
      setView('admin');
    } else if (shopParam) {
      // Customer arrived via shop QR code — go straight to upload
      setShopSlug(shopParam);
      setView('upload');
    } else {
      // No special path — show landing page
      setView('home');
    }
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: adminPasswordInput })
      });
      const data = await res.json();
      if (data.success) {
        setAdminAuth(true);
      } else {
        setAdminError(data.error || 'Invalid admin password');
      }
    } catch (_) {
      setAdminError('Network error');
    }
  };

  // Navigation handler used by LandingPage
  const handleLandingNavigate = (target, data) => {
    if (target === 'track' && data) {
      setJobCode(data);
      setView('track');
    } else if (target === 'shop') {
      setView('shop');
    } else if (target === 'upload') {
      setView('upload');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Header Navigation (shown for home, upload, track views) */}
      {view !== 'shop' && view !== 'admin' && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between h-16">
            <div
              onClick={() => setView('home')}
              className="flex items-center gap-2 text-blue-600 font-extrabold text-xl cursor-pointer select-none tracking-tight"
            >
              <Printer className="w-6 h-6" />
              <span>prntez</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {view !== 'home' && (
                <button
                  onClick={() => setView('home')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Home</span>
                </button>
              )}
              <button
                onClick={() => setView('shop')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Shop POS</span>
              </button>
              <button
                onClick={() => setView('admin')}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                title="Admin Hub"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Views */}
      <div className="flex-1 flex flex-col">
        {view === 'home' && (
          <LandingPage onNavigate={handleLandingNavigate} />
        )}

        {view === 'upload' && (
          <CustomerUpload
            initialSlug={shopSlug}
            onJobCreated={(code) => {
              setJobCode(code);
              setView('track');
            }}
          />
        )}

        {view === 'track' && (
          <TrackJob
            jobCode={jobCode}
            onBack={() => setView(shopSlug ? 'upload' : 'home')}
          />
        )}

        {view === 'shop' && (
          currentShop ? (
            <ShopDashboard
              shop={currentShop}
              onLogout={() => {
                localStorage.removeItem('prntez_shop');
                setCurrentShop(null);
                setView('home');
              }}
            />
          ) : (
            <ShopAuth
              onLoginSuccess={(shop) => setCurrentShop(shop)}
            />
          )
        )}

        {view === 'admin' && (
          adminAuth ? (
            <AdminDashboard
              onLogout={() => {
                setAdminAuth(false);
                setView('home');
              }}
            />
          ) : (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
              <form onSubmit={handleAdminLogin} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm w-full space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Admin Authentication</h2>
                
                {adminError && <p className="text-xs text-rose-600 font-semibold">{adminError}</p>}
                
                <input
                  type="password"
                  required
                  placeholder="Enter admin password..."
                  value={adminPasswordInput}
                  onChange={e => setAdminPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-center font-medium"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Access Admin Panel
                </button>
              </form>
            </div>
          )
        )}
      </div>

    </div>
  );
}
