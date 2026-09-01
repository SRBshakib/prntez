import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Printer, QrCode, Download, Trash2, CheckCircle2, Clock, Zap,
  Eye, RefreshCw, Search, ArrowUpRight, LogOut, ChevronDown, ChevronUp,
  FileText, Image as ImageIcon, Volume2, VolumeX, Store, Check, AlertCircle, X,
  Command, Sparkles, Play, Layers, Copy, BarChart3, TrendingUp, MessageCircle,
  CreditCard, ShieldCheck, Sun, Moon, Percent, Wrench
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import { socket, playChime } from '../socket';
import PrintModal from '../components/PrintModal';
import GoogleAdSense from '../components/GoogleAdSense';
import ShopQrModal from '../components/ShopQrModal';
import ShopToolsModal from '../components/ShopToolsModal';
import ShopProfileModal from '../components/ShopProfileModal';

export default function ShopDashboard({ shop, onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending'); // 'pending' | 'printing' | 'done' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [selectedJobIndex, setSelectedJobIndex] = useState(0);

  // Real-time & Spooler State
  const [wsConnected, setWsConnected] = useState(socket.connected);
  const [autoPrint, setAutoPrint] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [defaultPrinter, setDefaultPrinter] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [printerList, setPrinterList] = useState([]);
  const [spoolLog, setSpoolLog] = useState([]);
  const [showSpoolLog, setShowSpoolLog] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [shopAd, setShopAd] = useState(null);
  const [adsenseConfig, setAdsenseConfig] = useState(null);

  // Editable Shop Profile & Pricing
  const [currentShopData, setCurrentShopData] = useState(shop);
  const [savingShopSettings, setSavingShopSettings] = useState(false);
  const searchInputRef = useRef(null);

  // Active Document Preview Modal
  const [activePreview, setActivePreview] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Initial Data Fetch & Bridge Check
  useEffect(() => {
    if (!shop?.id) return;

    fetchJobs();
    checkHardwareBridge();
    const bridgeInterval = setInterval(checkHardwareBridge, 10000);

    // Fetch Shop Partner Ads & AdSense
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.shopAd?.enabled) setShopAd(data.shopAd);
          if (data.adsense?.enabled) setAdsenseConfig(data.adsense);
        }
      })
      .catch(() => {});

    // Socket.io Room Subscription
    socket.emit('join_shop', shop.id);

    const onConnect = () => setWsConnected(true);
    const onDisconnect = () => setWsConnected(false);

    const onNewJob = (newJob) => {
      setJobs(prev => {
        const exists = prev.some(j => j.id === newJob.id);
        if (exists) return prev;
        return [newJob, ...prev];
      });

      if (audioEnabled) playChime();
      showToast(`⚡ New Order #${newJob.job_code} from ${newJob.customer_name}`, 'success');

      if (autoPrint && newJob.files && newJob.files.length > 0) {
        handlePrintAll(newJob);
      }
    };

    const onJobUpdated = (update) => {
      setJobs(prev => prev.map(j => (j.id === update.id ? { ...j, ...update } : j)));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_job', onNewJob);
    socket.on('job_updated', onJobUpdated);

    return () => {
      clearInterval(bridgeInterval);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_job', onNewJob);
      socket.off('job_updated', onJobUpdated);
    };
  }, [shop?.id, autoPrint, audioEnabled]);

  // 2. Keyboard Shortcuts (Linear / Gmail style speed)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in search or input fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
          setSearchQuery('');
        }
        return;
      }

      // Quick Search Focus ( / or Ctrl+K )
      if (e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Tab Switching: 1=Pending, 2=Printing, 3=Done, 4=All
      if (e.key === '1') { setActiveFilter('pending'); showToast('Filter: Pending', 'info'); }
      else if (e.key === '2') { setActiveFilter('printing'); showToast('Filter: Printing', 'info'); }
      else if (e.key === '3') { setActiveFilter('done'); showToast('Filter: Done', 'info'); }
      else if (e.key === '4') { setActiveFilter('all'); showToast('Filter: All Jobs', 'info'); }

      // Toggle shortcuts help with '?'
      else if (e.key === '?') {
        setShowShortcutsModal(s => !s);
      }

      // Close preview/modal with Escape
      else if (e.key === 'Escape') {
        setActivePreview(null);
        setShowSpoolLog(false);
        setShowShortcutsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`/api/jobs?shop_id=${shop.id}&status=all`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data || []);
      }
    } catch (err) {
      console.error('Fetch jobs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkHardwareBridge = async () => {
    try {
      const res = await fetch('/api/printers', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setPrinterList(data.printers || []);
        setIsSimulating(data.simulating || false);
        if (data.simulating) {
          setBridgeConnected(false);
          setDefaultPrinter('No Printer — Simulate Mode');
        } else {
          setBridgeConnected(true);
          setDefaultPrinter(data.defaultPrinter || 'Default Printer');
        }
        return;
      }
    } catch (_) {}
    setBridgeConnected(false);
    setIsSimulating(false);
  };

  const fetchSpoolLog = async () => {
    try {
      const res = await fetch('/api/spool-log');
      const data = await res.json();
      if (data.success) setSpoolLog(data.log || []);
    } catch (_) {}
  };

  const clearSpoolLogAction = async () => {
    try {
      await fetch('/api/spool-log', { method: 'DELETE' });
      setSpoolLog([]);
      showToast('Spool log cleared.', 'success');
    } catch (_) {}
  };

  // 2.5 Analytics Data Fetch
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}/analytics`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.analytics);
      }
    } catch (_) {
      showToast('Failed to load shop analytics.', 'error');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // 2.6 Toggle Shop Open / Closed (Feature 3)
  const handleToggleOpenClose = async () => {
    const nextClosed = !currentShopData.is_closed;
    try {
      const res = await fetch(`/api/shops/${shop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_closed: nextClosed ? 1 : 0 })
      });
      const data = await res.json();
      if (data.success && data.shop) {
        setCurrentShopData(data.shop);
        localStorage.setItem('prntez_shop', JSON.stringify(data.shop));
        showToast(nextClosed ? '🔴 Shop marked as CLOSED' : '🟢 Shop is now OPEN for customer orders', nextClosed ? 'info' : 'success');
      }
    } catch (_) {
      showToast('Failed to change shop status', 'error');
    }
  };

  // 2.7 Update Job Payment Status (Feature 4)
  const updatePaymentStatus = async (jobId, newPayStatus, payMethod = 'cash') => {
    try {
      setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, payment_status: newPayStatus, payment_method: payMethod } : j)));
      const res = await fetch('/api/jobs/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, payment_status: newPayStatus, payment_method: payMethod })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`💳 Payment status: ${newPayStatus.toUpperCase()}`, 'success');
      }
    } catch (_) {
      showToast('Failed to update payment status', 'error');
    }
  };

  // 2.8 WhatsApp Order Notification (Feature 1)
  const handleSendWhatsApp = (job) => {
    if (!job.customer_phone) {
      showToast('Customer did not provide a phone number.', 'info');
      return;
    }
    const cleanPhone = job.customer_phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : (cleanPhone.startsWith('0') ? '88' + cleanPhone : '880' + cleanPhone);
    const msg = `Hello ${job.customer_name || 'Customer'}! Your print order #${job.job_code} is READY for pickup at ${shop.name}! Total: ৳${parseFloat(job.total_price || 0).toFixed(2)}. Thank you!`;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // 2.9 Download Standalone QR Image from Sidebar
  const handleDownloadSidebarQr = async () => {
    try {
      const qrCanvas = document.createElement('canvas');
      const shopUrl = `${window.location.origin}/?shop=${shop?.qr_slug || ''}`;
      if (QRCodeLib?.toCanvas) {
        await new Promise((resolve) => {
          QRCodeLib.toCanvas(qrCanvas, shopUrl, { width: 1000, margin: 3 }, () => resolve());
        });
        qrCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = `${(shop.name || 'Shop').replace(/\s+/g, '_')}_QR_Code.png`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast('✓ QR Code PNG Downloaded!', 'success');
          }
        }, 'image/png');
      }
    } catch (_) {
      showToast('Failed to download QR image', 'error');
    }
  };

  // 3. Print Actions (Node.js Spooler + Simulate Mode)
  const handleQuickPrint = async (file, job) => {
    if (!file) return;

    if (job && job.status === 'pending') {
      updateJobStatus(job.id, 'printing');
    }

    try {
      const modeLabel = isSimulating ? '🖥️ Simulating print...' : `⚡ Spooling to ${defaultPrinter}...`;
      showToast(modeLabel, 'info');

      const res = await fetch('/api/jobs/spool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: file.id,
          printer: isSimulating ? null : defaultPrinter,
          copies: file.copies || 1,
          color: file.color_mode || 'bw',
          sides: file.sides || 'single',
        })
      });
      const data = await res.json();
      if (data.success) {
        const label = data.simulated
          ? `✅ Simulated: ${file.original_name} (${file.copies || 1}x, ${file.color_mode || 'bw'})`
          : `✅ Spooled in ${data.spoolTimeMs}ms → ${data.printer}`;
        showToast(label, 'success');
        if (job?.id) updateJobStatus(job.id, 'done');
        fetchSpoolLog();
        return;
      }
    } catch (e) {
      console.warn('Spooler error, falling back to browser print:', e);
    }

    // Fallback: silent print iframe
    let printFrame = document.getElementById('direct-print-iframe');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'direct-print-iframe';
      printFrame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      document.body.appendChild(printFrame);
    }
    printFrame.src = `/api/jobs/serve/${file.id}`;
    printFrame.onload = () => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (_) {
        setActivePreview({ file, job });
      }
    };
  };

  const handlePrintAll = (job) => {
    if (!job || !job.files || job.files.length === 0) return;
    job.files.forEach(f => handleQuickPrint(f, job));
  };

  // Batch action: Print ALL pending jobs
  const handlePrintAllPending = () => {
    const pendingJobs = jobs.filter(j => j.status === 'pending');
    if (pendingJobs.length === 0) {
      showToast('No pending jobs to print.', 'info');
      return;
    }
    showToast(`⚡ Printing all ${pendingJobs.length} pending orders...`, 'info');
    pendingJobs.forEach(j => handlePrintAll(j));
  };

  // 5. Update Job Status
  const updateJobStatus = async (jobId, newStatus) => {
    try {
      setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: newStatus } : j)));

      const res = await fetch('/api/jobs/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, status: newStatus })
      });
      const data = await res.json();

      if (data.success && newStatus === 'done') {
        const j = jobs.find(x => x.id === jobId);
        if (j && autoDeleteLocal) deleteFromLocalFolder(j);
        showToast(`✓ Order #${j?.job_code} marked DONE & files cleaned.`, 'success');
      }
    } catch (_) {
      showToast('Failed to update status', 'error');
    }
  };

  const deleteJobFiles = async (job) => {
    if (!window.confirm(`Purge all files for Order #${job.job_code}?`)) return;
    try {
      await fetch(`/api/jobs/${job.id}/files`, { method: 'DELETE' });
      setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, files_deleted: 1, files: [] } : j)));
      deleteFromLocalFolder(job);
      showToast('Files purged.', 'success');
    } catch (_) {
      showToast('Failed to delete files', 'error');
    }
  };

  // Filtered & Searched Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (activeFilter !== 'all' && j.status !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (j.job_code || '').toLowerCase().includes(q) ||
               (j.customer_name || '').toLowerCase().includes(q) ||
               (j.customer_phone || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [jobs, activeFilter, searchQuery]);

  const stats = useMemo(() => ({
    pending: jobs.filter(j => j.status === 'pending').length,
    printing: jobs.filter(j => j.status === 'printing').length,
    done: jobs.filter(j => j.status === 'done').length,
    total: jobs.length
  }), [jobs]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
          toast.type === 'error' ? 'bg-rose-600 text-white border-rose-700' : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-blue-600 font-extrabold text-lg">
              <Printer className="w-5 h-5" />
              <span>Printez</span>
            </div>
            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
            <div className="font-bold text-slate-800 text-xs hidden sm:block truncate max-w-[160px]">{shop?.name}</div>

            {/* WebSocket Live Badge */}
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              wsConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span>{wsConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Shop Open / Closed Quick Toggle (Feature 3) */}
            <button
              onClick={handleToggleOpenClose}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                !currentShopData.is_closed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
              }`}
              title="Toggle Shop Open/Closed status for customers"
            >
              <span className={`w-2 h-2 rounded-full ${!currentShopData.is_closed ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span>{!currentShopData.is_closed ? 'Open Now' : 'Closed'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Shop Tools Suite Button */}
            <button
              onClick={() => setShowToolsModal(true)}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Print & Photocopy Counter Tool Suite (Calculators, Receipts, Sheet Converter)"
            >
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Tools</span>
            </button>

            {/* Analytics Dashboard Trigger (Feature 2) */}
            <button
              onClick={() => { setShowAnalyticsModal(true); fetchAnalytics(); }}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Shop Analytics & Revenue Reports"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Analytics</span>
            </button>

            {/* Keyboard Shortcuts Trigger Button */}
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition hidden sm:flex items-center gap-1 text-xs font-bold"
              title="Keyboard Shortcuts (?)"
            >
              <Command className="w-3.5 h-3.5" />
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">?</span>
            </button>

            {/* Printer / Simulate Mode Badge */}
            <button
              onClick={() => { setShowSpoolLog(s => !s); fetchSpoolLog(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                isSimulating
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : bridgeConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
              title="Click to view Print Spool Log"
            >
              <span className={`w-2 h-2 rounded-full ${
                isSimulating ? 'bg-amber-500 animate-pulse' :
                bridgeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}></span>
              <span className="hidden sm:inline">{
                isSimulating ? '🖥️ Simulate Mode' :
                bridgeConnected ? `🖨️ ${defaultPrinter.substring(0, 14)}` :
                'No Printer'
              }</span>
              <span className="sm:hidden">Spool Log</span>
            </button>

            {/* Auto-Print Toggle */}
            <button
              onClick={() => {
                const next = !autoPrint;
                setAutoPrint(next);
                showToast(next ? '⚡ Auto-Print ON — orders print immediately' : 'Auto-Print Disabled', next ? 'success' : 'info');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                autoPrint ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${autoPrint ? 'text-amber-100' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{autoPrint ? 'Auto-Print: ON' : 'Auto-Print: OFF'}</span>
            </button>

            {/* QR Poster & Standee Button */}
            <button
              onClick={() => setShowQrModal(true)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Print QR Standee / Poster"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden lg:inline">QR Standee</span>
            </button>

            {/* Advanced Profile & Verification Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Shop Profile, Trade License, Owner NID & Branding"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="hidden lg:inline">Profile</span>
            </button>

            {/* Settings & Rates Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Shop Rates, Notice, Hours & Payment"
            >
              <Store className="w-4 h-4" />
              <span className="hidden lg:inline">Settings</span>
            </button>

            {/* Audio Chime Toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              title={audioEnabled ? 'Sound ON' : 'Sound OFF'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Spool Log Panel (Slide-Down) */}
      {showSpoolLog && (
        <div className="bg-slate-900 text-slate-200 border-b border-slate-700 shadow-xl animate-in slide-in-from-top duration-150">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  🖨️ Print Spool Log
                </h3>
                {isSimulating && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    🖥️ SIMULATE MODE — Prints logged virtually
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSpoolLog}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >Refresh</button>
                <button
                  onClick={clearSpoolLogAction}
                  className="px-2.5 py-1 text-xs rounded-lg bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 transition"
                >Clear Log</button>
                <button
                  onClick={() => setShowSpoolLog(false)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition font-bold"
                >✕</button>
              </div>
            </div>

            {spoolLog.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No print jobs in log. Click 🖨️ Print on any order card to test.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-52">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700 text-[11px]">
                      <th className="py-1.5 text-left font-semibold pr-4">Time</th>
                      <th className="py-1.5 text-left font-semibold pr-4">Mode</th>
                      <th className="py-1.5 text-left font-semibold pr-4">File</th>
                      <th className="py-1.5 text-left font-semibold pr-4">Printer</th>
                      <th className="py-1.5 text-left font-semibold pr-4">Specs</th>
                      <th className="py-1.5 text-right font-semibold">Speed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spoolLog.map((entry, i) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                        <td className="py-1 pr-4 text-slate-400 text-[11px]">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-1 pr-4">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            entry.mode === 'simulate' ? 'bg-amber-500/20 text-amber-300' :
                            entry.mode === 'real' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-slate-600 text-slate-300'
                          }`}>
                            {entry.mode === 'simulate' ? 'Simulate' : 'Real'}
                          </span>
                        </td>
                        <td className="py-1 pr-4 text-slate-200 font-medium max-w-[200px] truncate">
                          {entry.file}
                        </td>
                        <td className="py-1 pr-4 text-slate-400">
                          {entry.printer === 'SIMULATE' ? 'Virtual' : (entry.printer || 'Default')}
                        </td>
                        <td className="py-1 pr-4 text-slate-400 text-[11px]">
                          {entry.copies}x · {entry.color} · {entry.sides}
                          {entry.fileSizeKB > 0 && <span className="text-slate-500"> · {entry.fileSizeKB}KB</span>}
                        </td>
                        <td className="py-1 text-right text-slate-400 font-mono text-[11px]">
                          {entry.elapsedMs}ms ✓
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Command className="w-4 h-4 text-blue-600" />
                <span>POS Hotkeys</span>
              </h3>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >Close ✕</button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Focus search bar</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold border border-slate-200">/</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Pending tab</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold border border-slate-200">1</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Printing tab</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold border border-slate-200">2</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Done tab</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold border border-slate-200">3</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>All Orders tab</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold border border-slate-200">4</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Close preview / panels</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold border border-slate-200">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex-1 flex flex-col md:flex-row gap-5">
        
        {/* Left Sidebar: Counter QR & Local Folder Sync */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          
          {/* Counter QR Card */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 text-center space-y-2.5">
            <h3 className="font-bold text-xs text-slate-800">Counter QR Code</h3>
            <div className="p-2.5 bg-slate-50 rounded-xl flex justify-center items-center border border-slate-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/?shop=' + shop?.qr_slug)}`}
                alt="Shop QR"
                className="w-32 h-32 rounded-lg"
              />
            </div>
            <div className="space-y-1.5 pt-0.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleDownloadSidebarQr}
                  className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition"
                  title="Download Raw QR Image"
                >
                  <Download className="w-3 h-3" />
                  <span>Save QR</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '/?shop=' + shop?.qr_slug);
                    showToast('Counter link copied!', 'success');
                  }}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-1 transition"
                  title="Copy Customer Link"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Link</span>
                </button>
              </div>

              <button
                onClick={() => setShowQrModal(true)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Custom Standee Poster</span>
              </button>
            </div>
          </div>

          {/* Partner / Supplies Ad Banner Space in Sidebar */}
          {shopAd && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-indigo-800/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                  {shopAd.badge || '📢 PARTNER'}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {shopAd.text}
              </p>
              {shopAd.link && (
                <a
                  href={shopAd.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-center text-[11px] transition shadow-xs"
                >
                  Explore Supplies →
                </a>
              )}
            </div>
          )}

          {/* Google AdSense Space (Sidebar) */}
          {adsenseConfig?.enabled && (
            <GoogleAdSense
              client={adsenseConfig.clientId}
              slot={adsenseConfig.slotShopSide || adsenseConfig.slotShopTop}
              format="rectangle"
              className="pt-1"
            />
          )}

        </aside>

        {/* Main POS Queue Area */}
        <main className="flex-1 min-w-0 space-y-4">
          
          {/* Google AdSense Space (Top Banner) */}
          {adsenseConfig?.enabled && (
            <GoogleAdSense
              client={adsenseConfig.clientId}
              slot={adsenseConfig.slotShopTop || adsenseConfig.slotShopSide}
              format="horizontal"
              className="my-1"
            />
          )}

          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setActiveFilter('pending')}
              className={`bg-white rounded-2xl p-3.5 shadow-xs border cursor-pointer transition ${
                activeFilter === 'pending' ? 'ring-2 ring-amber-500 border-amber-300' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Pending</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-xl font-extrabold text-amber-600 mt-1">{stats.pending}</h3>
            </div>

            <div
              onClick={() => setActiveFilter('printing')}
              className={`bg-white rounded-2xl p-3.5 shadow-xs border cursor-pointer transition ${
                activeFilter === 'printing' ? 'ring-2 ring-blue-500 border-blue-300' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Printing</span>
                <Printer className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-xl font-extrabold text-blue-600 mt-1">{stats.printing}</h3>
            </div>

            <div
              onClick={() => setActiveFilter('done')}
              className={`bg-white rounded-2xl p-3.5 shadow-xs border cursor-pointer transition ${
                activeFilter === 'done' ? 'ring-2 ring-emerald-500 border-emerald-300' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Done Today</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{stats.done}</h3>
            </div>

            <div
              onClick={() => setActiveFilter('all')}
              className={`bg-white rounded-2xl p-3.5 shadow-xs border cursor-pointer transition ${
                activeFilter === 'all' ? 'ring-2 ring-slate-800 border-slate-400' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Total Today</span>
                <Layers className="w-4 h-4 text-slate-500" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">{stats.total}</h3>
            </div>
          </div>

          {/* Search, Filter & Batch Actions Bar */}
          <div className="bg-white rounded-2xl p-2.5 shadow-xs border border-slate-200 flex flex-col sm:flex-row gap-2 justify-between items-center">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              {[
                { id: 'pending', label: 'Pending', count: stats.pending, key: '1' },
                { id: 'printing', label: 'Printing', count: stats.printing, key: '2' },
                { id: 'done', label: 'Done', count: stats.done, key: '3' },
                { id: 'all', label: 'All', count: stats.total, key: '4' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    activeFilter === tab.id
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === tab.id ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/60 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input & Print All Batch Action */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {stats.pending > 0 && activeFilter === 'pending' && (
                <button
                  onClick={handlePrintAllPending}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Print All ({stats.pending})</span>
                </button>
              )}

              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search code/name... (/)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

          </div>

          {/* Jobs List */}
          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">Loading queue...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
              <Printer className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700 text-xs">No orders in this view</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Incoming customer jobs appear automatically in real-time.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredJobs.map(job => {
                const isExpanded = expandedJobId === job.id;
                const hasFiles = job.files && job.files.length > 0;
                const firstFile = hasFiles ? job.files[0] : null;

                return (
                  <div
                    key={job.id}
                    className={`bg-white rounded-2xl border transition shadow-xs hover:shadow-md ${
                      job.status === 'pending' ? 'border-l-4 border-l-amber-500 border-slate-200' :
                      job.status === 'printing' ? 'border-l-4 border-l-blue-500 border-slate-200' :
                      'border-l-4 border-l-emerald-500 border-slate-200'
                    }`}
                  >
                    {/* Card Summary Header */}
                    <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      
                      {/* Left: Job Code & Customer Info */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-base font-extrabold text-blue-600 tracking-tight">#{job.job_code}</span>
                          <span className="font-bold text-xs text-slate-800">{job.customer_name || 'Guest'}</span>
                          {job.customer_phone && (
                            <span className="text-[11px] text-slate-400 font-medium">{job.customer_phone}</span>
                          )}
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            job.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            job.status === 'printing' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {job.status}
                          </span>
                          <span className="text-xs font-extrabold text-slate-900 ml-auto lg:ml-0">
                            ৳{parseFloat(job.total_price || 0).toFixed(2)}
                          </span>

                          {/* Bulk Discount Pill */}
                          {parseFloat(job.discount_applied || 0) > 0 && (
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              🏷️ -৳{parseFloat(job.discount_applied).toFixed(2)} off
                            </span>
                          )}

                          {/* Payment Status Badge */}
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            job.payment_status === 'paid' || job.payment_status === 'paid_cash' || job.payment_status === 'paid_bkash'
                              ? 'bg-emerald-100 text-emerald-800'
                              : job.payment_status === 'paid_online_pending_verify'
                                ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            <CreditCard className="w-2.5 h-2.5" />
                            <span>
                              {job.payment_status === 'paid' || job.payment_status === 'paid_cash' ? 'Paid (Cash)' :
                               job.payment_status === 'paid_bkash' ? 'Paid (bKash)' :
                               job.payment_status === 'paid_online_pending_verify' ? `Verify ${job.payment_method?.toUpperCase()} (Trx: ${job.payment_trx_id || 'Yes'})` :
                               'Unpaid'}
                            </span>
                          </span>
                        </div>

                        {/* Specs Pills */}
                        {firstFile && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="font-medium text-slate-600 truncate max-w-xs">{firstFile.original_name}</span>
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-800 font-bold rounded">
                              {firstFile.copies}x copy
                            </span>
                            <span className={`px-1.5 py-0.2 rounded font-bold ${
                              firstFile.color_mode === 'color' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {firstFile.color_mode === 'color' ? '🎨 Color' : '⬛ B&W'}
                            </span>
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 font-bold rounded">
                              {firstFile.paper_size}
                            </span>
                            <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 font-bold rounded border border-amber-200">
                              {firstFile.sides === 'double' ? 'Duplex' : '1-Sided'}
                            </span>
                            {job.files.length > 1 && (
                              <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 font-bold rounded">
                                +{job.files.length - 1} more
                              </span>
                            )}
                          </div>
                        )}

                        {job.global_notes && (
                          <p className="text-[11px] bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                            📝 {job.global_notes}
                          </p>
                        )}
                      </div>

                      {/* Right: Quick Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end lg:self-center">
                        
                        {/* Quick WhatsApp Ready Message (Feature 1) */}
                        {job.customer_phone && (
                          <button
                            onClick={() => handleSendWhatsApp(job)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-2xs"
                            title="Send WhatsApp Ready Message to customer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                        )}

                        {/* Payment Quick Toggle Menu (Feature 4) */}
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[10px] font-bold">
                          <button
                            onClick={() => updatePaymentStatus(job.id, 'paid_cash', 'cash')}
                            className={`px-2 py-1 rounded-lg transition ${
                              job.payment_status === 'paid_cash' || job.payment_status === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Mark Paid via Cash"
                          >
                            Cash
                          </button>
                          <button
                            onClick={() => updatePaymentStatus(job.id, 'paid_bkash', 'bkash')}
                            className={`px-2 py-1 rounded-lg transition ${
                              job.payment_status === 'paid_bkash' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Mark Paid via bKash/Nagad"
                          >
                            bKash
                          </button>
                          <button
                            onClick={() => updatePaymentStatus(job.id, 'unpaid', 'cash')}
                            className={`px-1.5 py-1 rounded-lg transition ${
                              job.payment_status === 'unpaid' ? 'bg-slate-300 text-slate-800' : 'text-slate-400 hover:text-rose-600'
                            }`}
                            title="Mark Unpaid"
                          >
                            ✕
                          </button>
                        </div>

                        {/* 1-Click Print Directly */}
                        {hasFiles && !job.files_deleted && (
                          <button
                            onClick={() => handlePrintAll(job)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Print ({job.files.length})</span>
                          </button>
                        )}

                        {/* ZIP Download */}
                        {hasFiles && !job.files_deleted && (
                          <a
                            href={`/api/jobs/${job.id}/download-zip`}
                            download
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                            title="Download all files as ZIP"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Mark Done */}
                        {job.status !== 'done' ? (
                          <button
                            onClick={() => updateJobStatus(job.id, 'done')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-xs active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 px-2 py-1 bg-emerald-50 rounded-lg">
                            ✓ Done
                          </span>
                        )}

                        {/* Expand / Collapse Details */}
                        <button
                          onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                      </div>

                    </div>

                    {/* Expanded Drawer: Per-File Details & Preview */}
                    {isExpanded && (
                      <div className="px-4 pb-3.5 pt-2 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Attached Files ({job.files?.length || 0})</span>
                          {!job.files_deleted && (
                            <button
                              onClick={() => deleteJobFiles(job)}
                              className="text-rose-600 hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Purge Server Files
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {job.files?.map((file, fIdx) => (
                            <div
                              key={fIdx}
                              className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                                  {file.original_name.endsWith('.pdf') ? (
                                    <FileText className="w-3.5 h-3.5 text-red-500" />
                                  ) : (
                                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 truncate">{file.original_name}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {file.copies}x · {file.color_mode.toUpperCase()} · {file.paper_size} · {file.sides}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => setActivePreview({ file, job })}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 text-[11px]"
                                >
                                  <Eye className="w-3 h-3" /> Preview
                                </button>
                                <button
                                  onClick={() => handleQuickPrint(file, job)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1 text-[11px]"
                                >
                                  <Zap className="w-3 h-3" /> Print
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* Google AdSense Space (Bottom Banner) */}
          {adsenseConfig?.enabled && (
            <GoogleAdSense
              client={adsenseConfig.clientId}
              slot={adsenseConfig.slotShopBottom || adsenseConfig.slotShopTop}
              format="horizontal"
              className="pt-2"
            />
          )}

        </main>

      </div>

      {/* Document Preview Modal */}
      {activePreview && (
        <PrintModal
          file={activePreview.file}
          job={activePreview.job}
          preview={activePreview}
          onClose={() => setActivePreview(null)}
          onPrint={(f, j) => {
            handleQuickPrint(f, j);
            setActivePreview(null);
          }}
        />
      )}

      {/* Shop Rates & Customer Notice Editor Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Shop Rates & Customer Notice</h3>
                  <p className="text-[11px] text-slate-400">Updates reflect live on your QR upload page</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >✕</button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingShopSettings(true);
                try {
                  const res = await fetch(`/api/shops/${shop.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentShopData)
                  });
                  const data = await res.json();
                  if (data.success) {
                    showToast('Shop rates & notice updated!', 'success');
                    if (data.shop) {
                      setCurrentShopData(data.shop);
                      localStorage.setItem('prntez_shop', JSON.stringify(data.shop));
                    }
                    setShowSettingsModal(false);
                  }
                } catch (_) {
                  showToast('Failed to update shop details', 'error');
                } finally {
                  setSavingShopSettings(false);
                }
              }}
              className="space-y-3.5 text-xs"
            >
              {/* Counter Notice / Customer Promo Text */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  📢 Counter Promo / Notice to Customers
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Passport photo printing & Spiral binding available! 10% off on 100+ pages."
                  value={currentShopData.counter_notice || ''}
                  onChange={e => setCurrentShopData({ ...currentShopData, counter_notice: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">This banner appears at the top of your customer upload page.</p>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">B&W Price (৳/page)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentShopData.price_bw || '2.00'}
                    onChange={e => setCurrentShopData({ ...currentShopData, price_bw: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Color Price (৳/page)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentShopData.price_color || '10.00'}
                    onChange={e => setCurrentShopData({ ...currentShopData, price_color: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Legal Paper Extra (৳)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentShopData.price_legal || '3.00'}
                    onChange={e => setCurrentShopData({ ...currentShopData, price_legal: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">A3 Large Extra (৳)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentShopData.price_a3 || '15.00'}
                    onChange={e => setCurrentShopData({ ...currentShopData, price_a3: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Operating Hours (Feature 3) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Operating Hours & Open/Closed
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentShopData({ ...currentShopData, is_closed: currentShopData.is_closed ? 0 : 1 })}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      !currentShopData.is_closed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {!currentShopData.is_closed ? '🟢 Currently OPEN' : '🔴 Currently CLOSED'}
                  </button>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Opening Time</label>
                    <input
                      type="time"
                      value={currentShopData.opening_time || '08:00'}
                      onChange={e => setCurrentShopData({ ...currentShopData, opening_time: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Closing Time</label>
                    <input
                      type="time"
                      value={currentShopData.closing_time || '22:00'}
                      onChange={e => setCurrentShopData({ ...currentShopData, closing_time: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Online Payment Numbers (Feature 4) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-3.5 h-3.5 text-pink-600" />
                  Online Payment Numbers (bKash & Nagad)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">bKash (Personal/Merchant)</label>
                    <input
                      type="tel"
                      placeholder="017XXXXXXXX"
                      value={currentShopData.bkash_number || ''}
                      onChange={e => setCurrentShopData({ ...currentShopData, bkash_number: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Nagad Number</label>
                    <input
                      type="tel"
                      placeholder="018XXXXXXXX"
                      value={currentShopData.nagad_number || ''}
                      onChange={e => setCurrentShopData({ ...currentShopData, nagad_number: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bulk Discount Rules (Feature 7) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                  <Percent className="w-3.5 h-3.5 text-amber-600" />
                  Auto Bulk Discounts
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Tier 1: Min Pages</label>
                    <input
                      type="number"
                      value={currentShopData.discount_min_pages || 50}
                      onChange={e => setCurrentShopData({ ...currentShopData, discount_min_pages: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Tier 1: Discount %</label>
                    <input
                      type="number"
                      step="1"
                      value={currentShopData.discount_percent || 10}
                      onChange={e => setCurrentShopData({ ...currentShopData, discount_percent: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shop Address / Counter Location</label>
                <input
                  type="text"
                  value={currentShopData.address || ''}
                  onChange={e => setCurrentShopData({ ...currentShopData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingShopSettings}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                {savingShopSettings ? 'Saving...' : '✓ Save Settings & Rates'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Shop Analytics Dashboard Modal (Feature 2) */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Shop Analytics & Revenue Dashboard</h3>
                  <p className="text-[11px] text-slate-400">Live order metrics, revenue, and popular print modes</p>
                </div>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >✕</button>
            </div>

            {loadingAnalytics ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">Calculating analytics...</p>
              </div>
            ) : analyticsData ? (
              <div className="space-y-4 text-xs">
                
                {/* 4 Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Today's Revenue</p>
                    <p className="text-lg font-extrabold text-emerald-600 mt-0.5">৳{parseFloat(analyticsData.today?.today_revenue || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">{analyticsData.today?.today_jobs || 0} orders today</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Revenue</p>
                    <p className="text-lg font-extrabold text-indigo-600 mt-0.5">৳{parseFloat(analyticsData.overall?.total_revenue || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">{analyticsData.overall?.total_jobs || 0} all-time jobs</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Pages Printed</p>
                    <p className="text-lg font-extrabold text-slate-800 mt-0.5">{analyticsData.overall?.total_pages || 0}</p>
                    <p className="text-[10px] text-slate-500">sheets of paper</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Bulk Discounts</p>
                    <p className="text-lg font-extrabold text-amber-600 mt-0.5">৳{parseFloat(analyticsData.overall?.total_discounts || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">saved by customers</p>
                  </div>
                </div>

                {/* Color vs B&W Ratio */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-700 text-xs">Print Mode Breakdown</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {analyticsData.modeBreakdown?.map((m, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs capitalize text-slate-800">{m.color_mode === 'color' ? '🎨 Color Print' : '⬛ Black & White'}</p>
                          <p className="text-[10px] text-slate-400">{m.file_count} files ({m.total_pages} pages)</p>
                        </div>
                        <span className="text-sm font-extrabold text-slate-700">{m.total_pages}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paper Sizes Breakdown */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-700 text-xs">Paper Sizes Distribution</h4>
                  <div className="flex flex-wrap gap-2">
                    {analyticsData.paperBreakdown?.map((p, i) => (
                      <div key={i} className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
                        <span className="font-bold text-slate-800">{p.paper_size}</span>
                        <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 font-extrabold rounded text-[10px]">{p.count} files</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Peak Hours Distribution */}
                {analyticsData.hourlyStats && analyticsData.hourlyStats.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-700 text-xs">Peak Hours (Last 7 Days)</h4>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-center">
                      {analyticsData.hourlyStats.map((h, i) => (
                        <div key={i} className="p-1.5 bg-indigo-50/60 rounded-lg border border-indigo-100">
                          <p className="text-[9px] text-slate-400 font-mono">{h.hour}:00</p>
                          <p className="font-extrabold text-xs text-indigo-700">{h.jobs_count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : null}

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Advanced Shop QR Poster & Standee Modal */}
      {showQrModal && (
        <ShopQrModal
          shop={currentShopData || shop}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {/* Print & Photocopy Shop Counter Tools Suite */}
      {showToolsModal && (
        <ShopToolsModal
          shop={currentShopData || shop}
          onClose={() => setShowToolsModal(false)}
        />
      )}

      {/* Advanced Shop Profile & Business Verification Modal */}
      {showProfileModal && (
        <ShopProfileModal
          shop={currentShopData || shop}
          onSave={(updatedShop) => {
            setCurrentShopData(updatedShop);
            showToast('✓ Shop profile & trade license saved!', 'success');
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

    </div>
  );
}


