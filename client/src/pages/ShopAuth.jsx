import React, { useState, useEffect, useCallback } from 'react';
import { Store, KeyRound, Mail, User, Phone, MapPin, ArrowRight, Loader2, Info, CheckCircle2 } from 'lucide-react';

export default function ShopAuth({ onLoginSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('testshop@prntez.com');
  const [loginPassword, setLoginPassword] = useState('TestPass123');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPriceBw, setRegPriceBw] = useState('2.00');
  const [regPriceColor, setRegPriceColor] = useState('10.00');

  // Google OAuth States
  const [googleConfig, setGoogleConfig] = useState({ enabled: false, clientId: '' });
  const [googleCredential, setGoogleCredential] = useState(null);
  const [googleProfile, setGoogleProfile] = useState(null);
  const [isGoogleReg, setIsGoogleReg] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Google Auth Config on mount
  useEffect(() => {
    fetch('/api/auth/google-config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.enabled && data.client_id) {
          setGoogleConfig({ enabled: true, clientId: data.client_id });
        } else {
          setGoogleConfig({ enabled: false, clientId: '' });
        }
      })
      .catch(() => {
        setGoogleConfig({ enabled: false, clientId: '' });
      });
  }, []);

  // Google Sign-In Callback
  const handleGoogleCallback = useCallback(async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    setError('');

    const credential = response.credential;
    try {
      const res = await fetch('/api/auth/google-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      const data = await res.json();

      if (data.success && data.shop) {
        localStorage.setItem('prntez_shop', JSON.stringify(data.shop));
        onLoginSuccess(data.shop);
      } else if (data.success && data.needs_registration) {
        setGoogleCredential(credential);
        setGoogleProfile(data.google_profile);
        setRegName(data.google_profile?.name || '');
        setRegEmail(data.google_profile?.email || '');
        setIsGoogleReg(true);
        setTab('register');
      } else {
        setError(data.error || 'Google sign-in failed');
      }
    } catch (_) {
      setError('Network error during Google sign-in.');
    } finally {
      setLoading(false);
    }
  }, [onLoginSuccess]);

  // Render Google Sign-in button when SDK is available
  useEffect(() => {
    if (!googleConfig.enabled || !googleConfig.clientId) return;

    let timer = null;
    const tryRenderGoogleBtn = () => {
      if (!window.google?.accounts?.id) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: googleConfig.clientId,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        if (tab === 'login') {
          const container = document.getElementById('google-btn-login-container');
          if (container) {
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: container.offsetWidth > 100 ? container.offsetWidth : 360,
              text: 'signin_with',
              shape: 'pill',
              logo_alignment: 'left'
            });
            return true;
          }
        } else if (tab === 'register' && !isGoogleReg) {
          const container = document.getElementById('google-btn-register-container');
          if (container) {
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
              type: 'standard',
              theme: 'filled_blue',
              size: 'large',
              width: container.offsetWidth > 100 ? container.offsetWidth : 360,
              text: 'signup_with',
              shape: 'pill',
              logo_alignment: 'left'
            });
            return true;
          }
        }
        return false;
      } catch (err) {
        console.warn('Google Identity button render error:', err);
        return false;
      }
    };

    if (!tryRenderGoogleBtn()) {
      timer = setInterval(() => {
        if (tryRenderGoogleBtn()) {
          clearInterval(timer);
        }
      }, 500);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [googleConfig, tab, isGoogleReg, handleGoogleCallback]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/shop-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('prntez_shop', JSON.stringify(data.shop));
        onLoginSuccess(data.shop);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (_) {
      setError('Network error. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // If registering with Google ID token
      if (isGoogleReg && googleCredential) {
        const res = await fetch('/api/auth/google-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential: googleCredential,
            name: regName,
            phone: regPhone,
            address: regAddress,
            price_bw: regPriceBw,
            price_color: regPriceColor
          })
        });
        const data = await res.json();
        if (data.success && data.shop) {
          localStorage.setItem('prntez_shop', JSON.stringify(data.shop));
          onLoginSuccess(data.shop);
        } else {
          setError(data.error || 'Google registration failed');
        }
        return;
      }

      // Standard Registration
      const res = await fetch('/api/auth/shop-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          address: regAddress,
          price_bw: regPriceBw,
          price_color: regPriceColor
        })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('prntez_shop', JSON.stringify(data.shop));
        onLoginSuccess(data.shop);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (_) {
      setError('Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 w-full max-w-md space-y-6">
        
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Shopkeeper Portal</h2>
          <p className="text-xs text-slate-500">Manage your real-time print counter</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setTab('login'); setError(''); setIsGoogleReg(false); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${tab === 'login' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
          >
            Shop Login
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${tab === 'register' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
          >
            Register Shop
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <div className="space-y-4">
            {/* Google Quick Sign-In Button */}
            {googleConfig.enabled && googleConfig.clientId && (
              <div className="space-y-3">
                <div id="google-btn-login-container" className="flex justify-center w-full min-h-[44px]" />
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">or sign in with password</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Open POS Dashboard</span>}
              </button>
            </form>
          </div>
        ) : (
          /* Register Form */
          <div className="space-y-4">
            {/* Google Signup Option (if not already verified via Google) */}
            {googleConfig.enabled && googleConfig.clientId && !isGoogleReg && (
              <div className="space-y-3">
                <div id="google-btn-register-container" className="flex justify-center w-full min-h-[44px]" />
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">or register manually</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </div>
            )}

            {/* Google Account Verified Banner */}
            {isGoogleReg && googleProfile && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                {googleProfile.picture ? (
                  <img src={googleProfile.picture} alt="" className="w-9 h-9 rounded-full border-2 border-blue-300 shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-blue-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Google Account Connected
                  </p>
                  <p className="text-xs text-blue-700 truncate">{googleProfile.email}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Shop Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Xerox & Print"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    readOnly={isGoogleReg}
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className={`w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition ${isGoogleReg ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Password</label>
                  <input
                    type="password"
                    required={!isGoogleReg}
                    disabled={isGoogleReg}
                    placeholder={isGoogleReg ? 'Managed by Google' : ''}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className={`w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition ${isGoogleReg ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">B&W Rate (৳)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={regPriceBw}
                    onChange={e => setRegPriceBw(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Color Rate (৳)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={regPriceColor}
                    onChange={e => setRegPriceColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Address / Counter Location</label>
                <input
                  type="text"
                  placeholder="e.g. TSC, Ground Floor, Dhaka University"
                  value={regAddress}
                  onChange={e => setRegAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isGoogleReg ? 'Complete Google Registration' : 'Create Shop Counter'}</span>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
