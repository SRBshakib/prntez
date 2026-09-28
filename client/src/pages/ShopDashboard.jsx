import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Printer, QrCode, Download, Trash2, CheckCircle2, Clock, Zap, Star,
  Eye, RefreshCw, Search, ArrowUpRight, LogOut, ChevronDown, ChevronUp,
  FileText, Image as ImageIcon, Volume2, VolumeX, Store, Check, AlertCircle, X,
  Command, Sparkles, Play, Layers, Copy, BarChart3, TrendingUp, MessageCircle,
  CreditCard, ShieldCheck, Sun, Moon, Percent, Wrench, Lock, Megaphone, Shield, KeyRound, User,
  PlusCircle, BookOpen, Palette, Pencil, DollarSign, Save
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import { socket, playChime } from '../socket';
import PrintModal from '../components/PrintModal';
import GoogleAdSense from '../components/GoogleAdSense';
import ShopQrModal from '../components/ShopQrModal';
import ShopToolsModal from '../components/ShopToolsModal';
import ShopProfileModal from '../components/ShopProfileModal';
import ShopPointsModal from '../components/ShopPointsModal';

// Formatting helpers for order timestamps (e.g. "Sep 21, 11:49 PM" and "(Done 11:49 PM)")
function formatOrderDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${month} ${day}, ${time}`;
}

function formatOrderTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Payment verification helper
function isJobPaid(j) {
  if (!j) return false;
  return j.payment_status === 'paid' || j.payment_status === 'paid_cash' || j.payment_status === 'paid_bkash';
}

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
  // Print Mode: 'browser' (Manual Ctrl+P dialog - Default) | 'spool' (Direct silent hardware spool)
  const [printMode, setPrintMode] = useState(() => {
    return localStorage.getItem('prntez_print_mode') || 'browser';
  });
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
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(() => shop?.points_balance || 0);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [shopAd, setShopAd] = useState(null);
  const [adsenseConfig, setAdsenseConfig] = useState(null);

  // Add Job Modal & Price Editing
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [addJobForm, setAddJobForm] = useState({ customer_name: '', customer_phone: '', total_pages: '', total_price: '', service_type: 'print', service_detail: '', global_notes: '', payment_method: 'cash' });
  const [addingJob, setAddingJob] = useState(false);
  const [editPriceJobId, setEditPriceJobId] = useState(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  // Editable Shop Profile & Pricing
  const [currentShopData, setCurrentShopData] = useState(shop);
  const [savingShopSettings, setSavingShopSettings] = useState(false);
  const [pendingPermissionJobId, setPendingPermissionJobId] = useState(null);
  const searchInputRef = useRef(null);

  // Admin File Retention Policy & Live Countdown Clock
  const [cleanupSettings, setCleanupSettings] = useState({ enabled: true, success_minutes: 30, unsuccess_minutes: 1440 });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate small countdown timer for file auto-deletion
  const getJobDeleteCountdown = (job) => {
    if (!job) return null;
    if (job.files_deleted) {
      return { status: 'deleted', text: 'Purged', isUrgent: false };
    }
    if (!cleanupSettings?.enabled) {
      return { status: 'disabled', text: 'Manual Retention', isUrgent: false };
    }

    let deadlineMs = null;
    if (job.status === 'done' && (job.completed_at || job.updated_at)) {
      const completedTime = new Date(job.completed_at || job.updated_at).getTime();
      deadlineMs = completedTime + ((cleanupSettings.success_minutes || 30) * 60 * 1000);
    } else if (job.created_at) {
      const createdTime = new Date(job.created_at).getTime();
      deadlineMs = createdTime + ((cleanupSettings.unsuccess_minutes || 1440) * 60 * 1000);
    }

    if (!deadlineMs || isNaN(deadlineMs)) return null;

    const diffMs = deadlineMs - now;
    if (diffMs <= 0) {
      return { status: 'expired', text: 'Purging...', isUrgent: true };
    }

    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hours = Math.floor(totalSecs / 3600);

    let text = '';
    if (hours > 0) {
      text = `Exp in ${hours}h ${mins % 60}m`;
    } else {
      text = `Purges in ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    const isUrgent = diffMs < 5 * 60 * 1000;
    return { status: 'active', text, isUrgent };
  };

  // Active Document Preview Modal
  const [activePreview, setActivePreview] = useState(null);

  // Interactive Counter Calling & Customer Reprint/Download Approval States
  const [callingJobId, setCallingJobId] = useState(null);
  const [reprintModal, setReprintModal] = useState(null); // { job, authCode: '', error: '' }
  const [downloadModal, setDownloadModal] = useState(null); // { job, authCode: '', error: '', waitingSocket: false }
  
  // Real-time per-file printed tracking (keeps multi-file orders in Pending until all done)
  const [printedFileIds, setPrintedFileIds] = useState(new Set());
  // Track jobs that have been downloaded at least once locally
  const [downloadedJobIds, setDownloadedJobIds] = useState(new Set());

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

    // Initial Fetch for Shop Points
    fetch(`/api/shops/${shop.id}/points`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.points_balance !== undefined) {
          setPointsBalance(data.points_balance);
        }
      })
      .catch(() => {});

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
      setJobs(prev => prev.map(j => {
        if (j.id !== update.id) return j;
        return {
          ...j,
          ...update,
          files_deleted: update.files_deleted !== undefined ? update.files_deleted : j.files_deleted,
          files: (update.files && update.files.length > 0) ? update.files : j.files
        };
      }));
    };

    const onPointsAwarded = (data) => {
      if (data?.points_balance !== undefined) {
        setPointsBalance(data.points_balance);
      } else if (data?.points) {
        setPointsBalance(prev => prev + data.points);
      }
      if (audioEnabled) playChime();
      showToast(`⭐ +${data.points} Points Earned! (Total: ${data.points_balance ?? ''} pts)`, 'success');
    };

    const onDownloadGranted = (data) => {
      setPendingPermissionJobId(null);
      setDownloadModal(null);
      showToast(`✓ Customer granted download permission for #${data.job_code}! Downloading...`, 'success');
      
      // If single file permission was granted, download that specific file directly
      if (data.file_id) {
        const a = document.createElement('a');
        a.href = `/api/jobs/download/${data.file_id}`;
        a.download = data.file_name || `document_${data.file_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Otherwise download all files in the order sequentially
        fetch(`/api/jobs/${data.job_id}/files`)
          .then(res => res.json())
          .then(filesData => {
            const fileList = filesData?.data || [];
            if (fileList.length > 0) {
              fileList.forEach((file, idx) => {
                setTimeout(() => {
                  const a = document.createElement('a');
                  a.href = `/api/jobs/download/${file.id}`;
                  a.download = file.original_name || `document_${file.id}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }, idx * 400);
              });
            }
          })
          .catch(err => {
            console.error('Download error:', err);
            showToast('Failed to download files', 'error');
          });
      }
    };

    const onDownloadDenied = (data) => {
      setPendingPermissionJobId(null);
      setDownloadModal(null);
      showToast(`❌ Customer denied download permission for #${data.job_code}.`, 'error');
    };

    const onReprintGranted = (data) => {
      setReprintModal(null);
      showToast(`✓ Customer approved reprint for #${data.job_code}! Printing...`, 'success');
      // Trigger reprint for the specific file or all files
      fetch(`/api/jobs/${data.job_id}/files`)
        .then(res => res.json())
        .then(filesData => {
          const fileList = filesData?.data || [];
          if (fileList.length > 0) {
            if (data.file_id) {
              const targetF = fileList.find(f => f.id === data.file_id) || fileList[0];
              handleQuickPrint(targetF, { id: data.job_id, job_code: data.job_code }, false);
            } else {
              fileList.forEach(f => handleQuickPrint(f, { id: data.job_id, job_code: data.job_code }, false));
            }
          }
        })
        .catch(err => console.error('Reprint fetch error:', err));
    };

    const onReprintDenied = (data) => {
      setReprintModal(null);
      showToast(`❌ Customer denied reprint permission for #${data.job_code}.`, 'error');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_job', onNewJob);
    socket.on('job_updated', onJobUpdated);
    socket.on('points_awarded', onPointsAwarded);
    socket.on('download_permission_granted', onDownloadGranted);
    socket.on('download_permission_denied', onDownloadDenied);
    socket.on('reprint_permission_granted', onReprintGranted);
    socket.on('reprint_permission_denied', onReprintDenied);

    return () => {
      clearInterval(bridgeInterval);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_job', onNewJob);
      socket.off('job_updated', onJobUpdated);
      socket.off('points_awarded', onPointsAwarded);
      socket.off('download_permission_granted', onDownloadGranted);
      socket.off('download_permission_denied', onDownloadDenied);
      socket.off('reprint_permission_granted', onReprintGranted);
      socket.off('reprint_permission_denied', onReprintDenied);
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

      // Tab Switching: 1=Pending, 2=Done, 3=All
      if (e.key === '1') { setActiveFilter('pending'); showToast('Filter: Pending', 'info'); }
      else if (e.key === '2') { setActiveFilter('done'); showToast('Filter: Done', 'info'); }
      else if (e.key === '3') { setActiveFilter('all'); showToast('Filter: All Orders', 'info'); }

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
        if (data.cleanup_settings) {
          setCleanupSettings(data.cleanup_settings);
        }
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

  // 2.10 Request Customer Download Permission (Privacy-first direct file acquisition)
  const handleRequestDownload = (job, file = null) => {
    if (!job || !job.job_code) return;
    const fileName = file?.original_name || (job.files && job.files.length > 1 ? `All ${job.files.length} Documents` : job.files?.[0]?.original_name || 'Document');
    setDownloadModal({ job, fileToDownload: file, fileName });
    showToast(`📩 Requesting download permission for ${fileName}...`, 'info');
    socket.emit('download_permission_request', {
      job_id: job.id,
      job_code: job.job_code,
      shop_id: shop?.id,
      shop_name: shop?.name,
      file_id: file?.id || null,
      file_name: fileName
    });
  };

  // 2.11 Request Customer Reprint Permission
  const handleOpenReprintModal = (job, file = null) => {
    if (!job || !job.job_code) return;
    const targetFile = file || (job.files && job.files.length > 0 ? job.files[0] : null);
    const fileName = targetFile?.original_name || 'Document';
    setReprintModal({ job, fileToReprint: targetFile, fileName });
    showToast(`📩 Requesting reprint permission for ${fileName}...`, 'info');
    socket.emit('reprint_permission_request', {
      job_id: job.id,
      job_code: job.job_code,
      shop_id: shop?.id,
      shop_name: shop?.name,
      file_id: targetFile?.id || null,
      file_name: fileName
    });
  };

  // 2.12 Direct Download (1st download enables instant progress; subsequent downloads require customer permission)
  const handleDirectDownload = (job, file = null) => {
    if (!job) return;

    const hasBeenDownloaded = (job.download_count > 0) || downloadedJobIds.has(job.id);

    if (hasBeenDownloaded) {
      // After first download, subsequent re-download requires customer permission!
      showToast(`🔒 Order #${job.job_code} already downloaded once. Requesting customer approval to re-download...`, 'info');
      handleRequestDownload(job, file);
      return;
    }

    // 1st Download: Mark as downloaded & advance job progress to 'printing' (In Progress)
    setDownloadedJobIds(prev => new Set(prev).add(job.id));
    if (job.status === 'pending') {
      updateJobStatus(job.id, 'printing');
    }

    if (file) {
      const a = document.createElement('a');
      a.href = `/api/jobs/download/${file.id}`;
      a.download = file.original_name || `document_${file.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`⬇️ Downloaded ${file.original_name} — Order #${job.job_code} is now In Progress!`, 'success');
    } else {
      // Download all files
      fetch(`/api/jobs/${job.id}/files`)
        .then(res => res.json())
        .then(filesData => {
          const fileList = filesData?.data || [];
          fileList.forEach((f, idx) => {
            setTimeout(() => {
              const a = document.createElement('a');
              a.href = `/api/jobs/download/${f.id}`;
              a.download = f.original_name || `document_${f.id}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }, idx * 400);
          });
          showToast(`⬇️ Downloaded ${fileList.length} file(s) — Order #${job.job_code} is now In Progress!`, 'success');
        })
        .catch(() => showToast('Download failed', 'error'));
    }
  };

  // 2.13 Add Manual Job (Walk-in customer)
  const handleAddManualJob = async () => {
    if (!shop?.id) return;
    setAddingJob(true);
    try {
      const res = await fetch('/api/jobs/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shop.id,
          ...addJobForm,
          total_price: parseFloat(addJobForm.total_price) || 0,
          total_pages: parseInt(addJobForm.total_pages, 10) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Manual job #${data.job_code} created!`, 'success');
        setShowAddJobModal(false);
        setAddJobForm({ customer_name: '', customer_phone: '', total_pages: '', total_price: '', service_type: 'print', service_detail: '', global_notes: '', payment_method: 'cash' });
      } else {
        showToast(data.error || 'Failed to create job', 'error');
      }
    } catch (err) {
      showToast('Network error creating job', 'error');
    } finally {
      setAddingJob(false);
    }
  };

  // 2.14 Save Price Override
  const handleSavePrice = async (jobId) => {
    setSavingPrice(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_price: parseFloat(editPriceValue) || 0 })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`💰 Price updated to ৳${parseFloat(data.total_price).toFixed(2)}`, 'success');
        setEditPriceJobId(null);
      } else {
        showToast(data.error || 'Failed to update price', 'error');
      }
    } catch (err) {
      showToast('Network error updating price', 'error');
    } finally {
      setSavingPrice(false);
    }
  };

  // Service type display helpers
  const getFileIcon = (fileName, isPrinted = false) => {
    if (!fileName) return <FileText className={`w-3.5 h-3.5 shrink-0 ${isPrinted ? 'text-emerald-600' : 'text-rose-500'}`} />;
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) {
      return <ImageIcon className={`w-3.5 h-3.5 shrink-0 ${isPrinted ? 'text-emerald-600' : 'text-teal-600'}`} />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <FileText className={`w-3.5 h-3.5 shrink-0 ${isPrinted ? 'text-emerald-600' : 'text-blue-600'}`} />;
    }
    return <FileText className={`w-3.5 h-3.5 shrink-0 ${isPrinted ? 'text-emerald-600' : 'text-rose-500'}`} />;
  };

  const getServiceBadge = (job) => {
    const st = job.service_type || 'print';
    const detail = job.service_detail || '';
    const badges = {
      print: { icon: '🖨️', label: 'Print', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      bind: { icon: '📖', label: `Bind${detail ? ' · ' + detail.charAt(0).toUpperCase() + detail.slice(1) : ''}`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
      photo: { icon: '🖼️', label: `Photo${detail ? ' · ' + detail.charAt(0).toUpperCase() + detail.slice(1) : ''}`, color: 'bg-pink-50 text-pink-700 border-pink-200' },
      edit: { icon: '✏️', label: 'Edit & Print', color: 'bg-amber-50 text-amber-800 border-amber-200' }
    };
    return badges[st] || badges.print;
  };


  const handleBrowserPrint = async (file, job, markDone = true) => {
    if (!file) return;

    const fileUrl = `/api/jobs/serve/${file.id}`;
    const ext = (file.original_name || '').split('.').pop().toLowerCase();
    const isDocx = ['docx', 'doc'].includes(ext);
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext);

    showToast(`🖨️ Opening print dialog for ${file.original_name}...`, 'info');

    // Create or reuse hidden iframe to invoke native browser print dialog (Ctrl + P)
    let printFrame = document.getElementById('direct-print-iframe');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'direct-print-iframe';
      printFrame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      document.body.appendChild(printFrame);
    }

    // For Word documents (.docx, .doc), render directly into HTML in iframe so browser print opens without downloading!
    if (isDocx) {
      try {
        const res = await fetch(fileUrl);
        const arrayBuffer = await res.arrayBuffer();

        const doc = printFrame.contentDocument || printFrame.contentWindow.document;
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${file.original_name}</title>
              <style>
                @page { size: auto; margin: 15mm; }
                body { margin: 0; padding: 15px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #fff; color: #000; }
                .docx-wrapper { background: #fff !important; padding: 0 !important; }
                .docx { box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
                table { border-collapse: collapse; width: 100%; }
                td, th { border: 1px solid #ccc; padding: 4px 8px; }
                @media print {
                  body { padding: 0 !important; }
                }
              </style>
            </head>
            <body>
              <div id="docx-root"></div>
            </body>
          </html>
        `);
        doc.close();

        const container = doc.getElementById('docx-root');
        try {
          const { renderAsync } = await import('docx-preview');
          await renderAsync(arrayBuffer, container, null, {
            className: 'docx',
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false
          });
        } catch (docxErr) {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer });
          container.innerHTML = result.value;
        }

        setTimeout(() => {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
          if (markDone && job?.id && job.status !== 'done') {
            updateJobStatus(job.id, 'done');
          }
        }, 400);
      } catch (err) {
        console.error('DOCX print error:', err);
        showToast('Error formatting DOCX for print dialog', 'error');
      }
      return;
    }

    // For Images
    if (isImage) {
      const doc = printFrame.contentDocument || printFrame.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${file.original_name}</title>
            <style>
              @page { size: auto; margin: 0; }
              body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${fileUrl}" id="print-img" />
          </body>
        </html>
      `);
      doc.close();
      const img = doc.getElementById('print-img');
      img.onload = () => {
        setTimeout(() => {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
          if (markDone && job?.id && job.status !== 'done') {
            updateJobStatus(job.id, 'done');
          }
        }, 200);
      };
      return;
    }

    // Default: PDF (Native browser PDF engine in iframe)
    printFrame.src = fileUrl;
    printFrame.onload = () => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        // Automatically mark order done ONLY when markDone is explicitly true
        if (markDone && job?.id && job.status !== 'done') {
          updateJobStatus(job.id, 'done');
        }
      } catch (_) {
        // Fallback: open in new tab so user can use Ctrl + P directly
        window.open(fileUrl, '_blank');
        if (markDone && job?.id && job.status !== 'done') {
          updateJobStatus(job.id, 'done');
        }
      }
    };
  };

  const handleQuickPrint = async (file, job, markDone = true) => {
    if (!file) return;

    // If printMode is set to manual/browser (Default), use the browser print dialog
    if (printMode === 'browser') {
      handleBrowserPrint(file, job, markDone);
      return;
    }

    try {
      const modeLabel = isSimulating ? '🖥️ Simulating print...' : `⚡ Spooling ${file.original_name} to ${defaultPrinter}...`;
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
        // Automatically mark done ONLY when markDone is explicitly true
        if (markDone && job?.id && job.status !== 'done') {
          await updateJobStatus(job.id, 'done');
        }
        fetchSpoolLog();
        return;
      }
    } catch (e) {
      console.warn('Spooler error, falling back to browser print:', e);
    }

    // Fallback: browser print
    handleBrowserPrint(file, job, markDone);
  };

  // Print a single file inside a multi-file job (keeps job in pending until all files are printed)
  const handlePrintFile = (file, job) => {
    if (!file || !job) return;

    const unprintedOthers = (job.files || []).filter(f => f.id !== file.id && !printedFileIds.has(f.id));
    const isLastFile = unprintedOthers.length === 0;

    // Mark this file ID as printed in state
    setPrintedFileIds(prev => new Set(prev).add(file.id));

    // If it's the last file of the order, mark whole order DONE!
    // Otherwise keep in pending queue without switching tabs
    handleQuickPrint(file, job, isLastFile);
  };

  const handlePrintAll = (job) => {
    if (!job || !job.files || job.files.length === 0) return;
    
    // Mark all files of this job as printed
    setPrintedFileIds(prev => {
      const next = new Set(prev);
      job.files.forEach(f => next.add(f.id));
      return next;
    });

    job.files.forEach((f, idx) => {
      setTimeout(() => {
        handleQuickPrint(f, job, idx === job.files.length - 1);
      }, idx * 600);
    });
  };

  // Batch action: Print ALL pending jobs
  const handlePrintAllPending = () => {
    const pendingJobs = jobs.filter(j => j.status === 'pending' && !j.files_deleted);
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
        if (data.points_balance !== undefined) {
          setPointsBalance(data.points_balance);
        }
        const ptsMsg = data.points_awarded > 0 ? ` (+${data.points_awarded} pts ⭐)` : '';
        showToast(`✓ Order #${j?.job_code || ''} printed & marked DONE!${ptsMsg}`, 'success');
      } else if (!data.success) {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Update status error:', err);
      showToast('Failed to update status', 'error');
    }
  };

  const deleteJobFiles = async (job) => {
    if (!window.confirm(`Purge all files for Order #${job.job_code}?`)) return;
    try {
      const res = await fetch(`/api/jobs/${job.id}/files`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, files_deleted: 1, files: [] } : j)));
        showToast('Files purged.', 'success');
      } else {
        showToast(data.error || 'Failed to delete files', 'error');
      }
    } catch (err) {
      console.error('Delete files error:', err);
      showToast('Failed to delete files', 'error');
    }
  };

  // Interactive Counter Voice Announcement Callout
  const handleCallCustomer = (job) => {
    if (!job) return;
    setCallingJobId(job.id);
    try {
      playChime();
    } catch (_) {}

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const cleanCode = (job.job_code || '').replace(/^0+/, '') || job.job_code || '';
        const nameText = job.customer_name ? `${job.customer_name}` : 'Customer';
        const docNames = job.files && job.files.length > 0
          ? (job.files.length === 1 ? job.files[0].original_name : `${job.files.length} documents`)
          : 'prints';
        const textToSpeak = `Token ${cleanCode}. ${nameText}, your ${docNames} are ready at the counter!`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis notice:', err);
      }
    }

    showToast(`📢 Calling #${job.job_code} (${job.customer_name || 'Customer'}) to Counter!`, 'info');
    setTimeout(() => setCallingJobId(null), 3500);
  };

  // Filtered & Searched Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const isJobPaid = j.payment_status === 'paid' || j.payment_status === 'paid_cash' || j.payment_status === 'paid_bkash';

      if (activeFilter === 'pending') {
        // If file is purged/deleted, do not show in pending
        if (j.files_deleted) return false;

        // Show pending & in-progress (printing / editing) jobs + all done jobs held at counter waiting for payment
        const isActive = j.status === 'pending' || j.status === 'printing';
        const isUnpaidHold = j.status === 'done' && !isJobPaid;
        if (!isActive && !isUnpaidHold) return false;
      } else if (activeFilter === 'done') {
        // Done queue ONLY contains orders that are printed AND paid!
        // Unpaid orders remain in Pending queue until payment is collected.
        if (j.status !== 'done' || !isJobPaid) return false;
      } else if (activeFilter !== 'all' && j.status !== activeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (j.job_code || '').toLowerCase().includes(q) ||
               (j.auth_code || '').toLowerCase().includes(q) ||
               (j.customer_name || '').toLowerCase().includes(q) ||
               (j.customer_phone || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [jobs, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    const isJobPaid = (j) => j.payment_status === 'paid' || j.payment_status === 'paid_cash' || j.payment_status === 'paid_bkash';

    // Pending jobs in queue (unprinted active & in-progress editing/printing)
    const pendingActive = jobs.filter(j => (j.status === 'pending' || j.status === 'printing') && !j.files_deleted).length;
    // Done jobs waiting for payment at counter (unpaid cash or MFS hold)
    const paymentHold = jobs.filter(j => j.status === 'done' && !j.files_deleted && !isJobPaid(j)).length;
    const printing = jobs.filter(j => j.status === 'printing').length;
    
    // Done today: strictly printed AND paid!
    const done = jobs.filter(j => j.status === 'done' && isJobPaid(j)).length;
    const total = jobs.length;
    const todayRevenue = jobs.reduce((sum, j) => sum + (isJobPaid(j) ? (parseFloat(j.total_price) || 0) : 0), 0);
    return {
      pending: pendingActive + paymentHold,
      printing,
      done,
      total,
      todayRevenue,
      paymentHold
    };
  }, [jobs]);

  // State for tracking dismissed and currently wiping items from Freshly Printed panel
  const [dismissedFreshIds, setDismissedFreshIds] = useState(new Set());
  const [wipingFreshIds, setWipingFreshIds] = useState(new Set());
  const isWipingRef = useRef(false);

  // Candidate jobs for Freshly Printed panel:
  // Exclude purged jobs (!j.files_deleted), limit to maximum 5, excluding dismissed
  const freshPrintedJobs = useMemo(() => {
    return jobs
      .filter(j => (j.status === 'done' || j.status === 'printing') && !j.files_deleted && !dismissedFreshIds.has(j.id))
      .slice(0, 5);
  }, [jobs, dismissedFreshIds]);

  // Active (un-purged) freshly printed jobs
  const activeFreshJobs = freshPrintedJobs;

  // Staggered Wipe from Bottom animation
  const triggerWipeFromBottom = useCallback((listToWipe) => {
    if (!listToWipe || listToWipe.length === 0 || isWipingRef.current) return;
    isWipingRef.current = true;
    const total = listToWipe.length;

    // Stagger wipe starting from bottom (index total - 1) up to top (index 0)
    listToWipe.forEach((job, index) => {
      const bottomDistance = total - 1 - index; // 0 for the bottom-most item, total-1 for top
      const delay = bottomDistance * 170; // 170ms delay per card from bottom
      setTimeout(() => {
        setWipingFreshIds(prev => new Set(prev).add(job.id));
      }, delay);
    });

    const completionTime = (total * 170) + 480;
    setTimeout(() => {
      setDismissedFreshIds(prev => {
        const next = new Set(prev);
        listToWipe.forEach(j => next.add(j.id));
        return next;
      });
      setWipingFreshIds(new Set());
      isWipingRef.current = false;
    }, completionTime);
  }, []);

  // Automatic Wipe: When a freshly printed order's retention timer hits 00:00 or files are purged,
  // automatically wipe it from the panel with bottom-to-top animation!
  useEffect(() => {
    if (isWipingRef.current || !cleanupSettings?.enabled || freshPrintedJobs.length === 0) return;

    const expiredJobs = freshPrintedJobs.filter(j => {
      if (wipingFreshIds.has(j.id) || dismissedFreshIds.has(j.id)) return false;
      if (j.files_deleted) return true;
      let deadlineMs = null;
      if (j.status === 'done' && (j.completed_at || j.updated_at)) {
        deadlineMs = new Date(j.completed_at || j.updated_at).getTime() + ((cleanupSettings.success_minutes || 30) * 60 * 1000);
      }
      return deadlineMs && deadlineMs <= now;
    });

    if (expiredJobs.length > 0) {
      triggerWipeFromBottom(expiredJobs);
    }
  }, [now, freshPrintedJobs, cleanupSettings, wipingFreshIds, dismissedFreshIds, triggerWipeFromBottom]);

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
            <div className="flex items-center gap-2 text-blue-600 font-extrabold text-lg tracking-tight">
              <Printer className="w-5 h-5" />
              <span>prntez</span>
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

            {/* Print Hardware & Mode Controls (Grouped Pill) */}
            <div className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 gap-1">
              {/* Spool / Simulate Mode */}
              <button
                onClick={() => { setShowSpoolLog(s => !s); fetchSpoolLog(); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                  isSimulating
                    ? 'bg-amber-100/90 text-amber-900 border border-amber-300 shadow-xs'
                    : bridgeConnected
                      ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
                title="Click to view Print Spool Log"
              >
                <span className={`w-2 h-2 rounded-full ${
                  isSimulating ? 'bg-amber-500 animate-pulse' :
                  bridgeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}></span>
                <span className="max-w-[110px] truncate">{
                  isSimulating ? 'Simulate' :
                  bridgeConnected ? defaultPrinter :
                  'No Printer'
                }</span>
              </button>

              {/* Print Dialog Mode Toggle */}
              <button
                onClick={() => {
                  const nextMode = printMode === 'browser' ? 'spool' : 'browser';
                  setPrintMode(nextMode);
                  localStorage.setItem('prntez_print_mode', nextMode);
                  showToast(
                    nextMode === 'browser'
                      ? '🖨️ Mode: Browser Print Dialog (Ctrl+P)'
                      : '⚡ Mode: Silent Hardware Spool (Direct to Printer)',
                    'success'
                  );
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                  printMode === 'browser'
                    ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                    : 'bg-indigo-600 text-white shadow-xs'
                }`}
                title="Toggle between Manual Print Dialog (Ctrl+P) and Silent Hardware Spool"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{printMode === 'browser' ? 'Dialog (Ctrl+P)' : 'Silent'}</span>
              </button>

              {/* Auto-Print Toggle */}
              <button
                onClick={() => {
                  const next = !autoPrint;
                  setAutoPrint(next);
                  showToast(next ? '⚡ Auto-Print ON' : 'Auto-Print Disabled', next ? 'success' : 'info');
                }}
                className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                  autoPrint ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:bg-white'
                }`}
                title="Auto-Print Orders"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{autoPrint ? 'Auto: ON' : 'Auto: OFF'}</span>
              </button>
            </div>

            {/* Admin File Retention Timer Badge */}
            <div 
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200/80 shadow-2xs"
              title={`Admin Policy: Auto-deletes printed files after ${cleanupSettings?.success_minutes || 30} mins, unprinted after ${cleanupSettings?.unsuccess_minutes >= 60 ? `${Math.round(cleanupSettings.unsuccess_minutes / 60)}h` : `${cleanupSettings.unsuccess_minutes}m`}`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Retention: <strong className="text-slate-900">{cleanupSettings?.enabled ? `${cleanupSettings?.success_minutes || 30}m` : 'Off'}</strong></span>
            </div>

            {/* Shop Loyalty Rewards Points Pill */}
            <button
              onClick={() => setShowPointsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black shadow-xs hover:shadow transition border border-amber-300/40"
              title="Shop Loyalty Points & Offers"
            >
              <Star className="w-3.5 h-3.5 fill-amber-200 text-amber-100 animate-pulse" />
              <span>{pointsBalance.toLocaleString()} pts</span>
            </button>

            {/* Shop Management Tools */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/60">
              <button
                onClick={() => setShowToolsModal(true)}
                className="px-2.5 py-1 text-slate-700 hover:text-indigo-600 hover:bg-white rounded-xl transition flex items-center gap-1 text-xs font-bold"
                title="Print Tools & Calculators"
              >
                <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden xl:inline">Tools</span>
              </button>

              <button
                onClick={() => { setShowAnalyticsModal(true); fetchAnalytics(); }}
                className="px-2.5 py-1 text-slate-700 hover:text-indigo-600 hover:bg-white rounded-xl transition flex items-center gap-1 text-xs font-bold"
                title="Analytics & Reports"
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden xl:inline">Analytics</span>
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                className="px-2.5 py-1 text-slate-700 hover:text-blue-600 hover:bg-white rounded-xl transition flex items-center gap-1 text-xs font-bold"
                title="Print QR Standee / Poster"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden xl:inline">QR Standee</span>
              </button>

              <button
                onClick={() => setShowProfileModal(true)}
                className="px-2.5 py-1 text-slate-700 hover:text-emerald-600 hover:bg-white rounded-xl transition flex items-center gap-1 text-xs font-bold"
                title="Profile & Verification"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xl:inline">Profile</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition flex items-center gap-1 text-xs font-bold"
                title="Shop Settings & Rates"
              >
                <Store className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden xl:inline">Rates</span>
              </button>
            </div>

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
                <span>Done tab</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold border border-slate-200">2</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>All Orders tab</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold border border-slate-200">3</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Close preview / panels</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold border border-slate-200">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Container (Extended Widescreen Layout) */}
      <div className="max-w-[1720px] mx-auto px-3 sm:px-4 lg:px-6 py-4 w-full flex-1 flex flex-col lg:flex-row gap-4">
        
        {/* Left Sidebar: Counter QR & Local Folder Sync */}
        <aside className="w-full lg:w-56 xl:w-60 shrink-0 space-y-3.5">
          
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
            {/* Card 1: Pending Orders */}
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
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-xl font-extrabold text-amber-600">{stats.pending}</h3>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">In Queue</span>
              </div>
            </div>

            {/* Card 2: Done Today */}
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
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-xl font-extrabold text-emerald-600">{stats.done}</h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Completed</span>
              </div>
            </div>

            {/* Card 3: Today's Revenue */}
            <div
              onClick={() => setActiveFilter('all')}
              className={`bg-white rounded-2xl p-3.5 shadow-xs border cursor-pointer transition ${
                activeFilter === 'all' ? 'ring-2 ring-slate-800 border-slate-400' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Today's Revenue</span>
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-xl font-extrabold text-slate-900 font-mono">৳{stats.todayRevenue.toFixed(2)}</h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {stats.total} {stats.total === 1 ? 'Order' : 'Orders'}
                </span>
              </div>
            </div>

            {/* Card 4: Admin Auto-Delete Timer Policy */}
            <div
              className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200 transition"
              title={`Admin configured file deletion: Automatically wipes completed files after ${cleanupSettings?.success_minutes || 30} mins to protect customer privacy.`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Auto-Delete Timer</span>
                <Trash2 className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-xl font-extrabold text-slate-800">
                  {cleanupSettings?.enabled ? `${cleanupSettings?.success_minutes || 30}m` : 'Off'}
                </h3>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                  Admin Policy
                </span>
              </div>
            </div>
          </div>

          {/* Search, Filter & Batch Actions Bar */}
          <div className="bg-white rounded-2xl p-2.5 shadow-xs border border-slate-200 flex flex-col sm:flex-row gap-2 justify-between items-center">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              {[
                { id: 'pending', label: 'Pending', count: stats.pending, key: '1' },
                { id: 'done', label: 'Done', count: stats.done, key: '2' },
                { id: 'all', label: 'All Orders', count: stats.total, key: '3' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    activeFilter === tab.id
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
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
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Print All ({stats.pending})</span>
                </button>
              )}

              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search token, auth, customer... (/)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

          </div>

          {/* Jobs List (Rich POS Queue Cards) */}
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
            <div className="space-y-3">
              {filteredJobs.map(job => {
                const hasFiles = job.files && job.files.length > 0;
                const isDone = job.status === 'done';
                const canPreview = !isDone && !job.files_deleted && hasFiles;
                const canDownload = !job.files_deleted && hasFiles;

                return (
                  <div
                    key={job.id}
                    className={`bg-white rounded-2xl border transition shadow-xs hover:shadow-md ${
                      job.files_deleted ? 'p-2.5' : 'p-3.5 space-y-2.5'
                    } ${
                      job.status === 'pending' ? 'border-l-4 border-l-amber-500 border-slate-200' :
                      job.status === 'printing' ? 'border-l-4 border-l-blue-500 border-slate-200 bg-blue-50/10' :
                      'border-l-4 border-l-emerald-500 border-slate-200'
                    }`}
                  >
                    {/* Layer 1: Top Bar - Order Identification, Customer, Time, Status, Total & Payment */}
                    <div className={`flex flex-wrap items-center justify-between gap-2 ${
                      job.files_deleted ? '' : 'pb-2 border-b border-slate-100'
                    }`}>
                      
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Token Number */}
                        <span className="text-base font-black text-blue-700 font-mono tracking-tight bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-lg shadow-2xs shrink-0">
                          #{job.job_code}
                        </span>

                        {/* Customer Auth Code */}
                        {job.auth_code && (
                          <button
                            type="button"
                            className="font-mono text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 px-2 py-1 rounded-md border border-slate-200 transition flex items-center gap-1 cursor-pointer shrink-0"
                            title="Auth Verification Code (Click to copy)"
                            onClick={() => {
                              navigator.clipboard.writeText(job.auth_code);
                              showToast(`Copied: ${job.auth_code}`, 'info');
                            }}
                          >
                            <span className="text-[8px] uppercase text-slate-400 font-sans">AUTH:</span>
                            <span>{job.auth_code}</span>
                          </button>
                        )}

                        {/* Customer Name */}
                        <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1 shrink-0" title={job.customer_name}>
                          <span>👤</span>
                          <span className="truncate max-w-[200px]">{job.customer_name || 'Guest Customer'}</span>
                        </span>

                        {/* Service Type Badge */}
                        {(() => {
                          const badge = getServiceBadge(job);
                          return (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 shrink-0 ${badge.color}`}>
                              <span>{badge.icon}</span>
                              <span>{badge.label}</span>
                            </span>
                          );
                        })()}

                        {/* Edit Job Instructions */}
                        {job.service_type === 'edit' && job.service_detail && (
                          <span className="bg-amber-100/70 border border-amber-300 text-amber-900 text-[9px] font-semibold px-1.5 py-0.5 rounded-lg truncate max-w-[160px] shrink-0" title={`Edit: ${job.service_detail}`}>
                            ✏️ {job.service_detail}
                          </span>
                        )}

                        {/* Submission & Done Time */}
                        {job.created_at && (
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatOrderDate(job.created_at)}</span>
                            {isDone && job.completed_at && (
                              <span className="text-emerald-600 font-bold text-[10px]">
                                (Done {formatOrderTime(job.completed_at)})
                              </span>
                            )}
                          </span>
                        )}

                        {/* Small Auto-Delete Countdown Pill */}
                        {(() => {
                          const cd = getJobDeleteCountdown(job);
                          if (!cd) return null;
                          if (cd.status === 'deleted') {
                            return (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 shrink-0" title="Files purged from server storage">
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                                <span>Purged</span>
                              </span>
                            );
                          }
                          return (
                            <span 
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 shadow-2xs ${
                                cd.isUrgent 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-300 animate-pulse' 
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                              title={isDone ? `Auto-deletes from storage ${cleanupSettings?.success_minutes || 30}m after completion` : 'Auto-expires unprinted files'}
                            >
                              <Clock className="w-2.5 h-2.5 text-rose-500" />
                              <span>{cd.text}</span>
                            </span>
                          );
                        })()}
                      </div>

                      {/* Status, Price & Payment */}
                      <div className="flex items-center gap-2">
                        {/* Status Pill */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          job.status === 'done' && (!job.payment_status || job.payment_status === 'unpaid' || job.payment_status === 'mfs_pending')
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : job.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            job.status === 'printing' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {job.status === 'done' && (!job.payment_status || job.payment_status === 'unpaid' || job.payment_status === 'mfs_pending')
                            ? (job.payment_method === 'cash' || !job.payment_method ? 'Printed · Cash Due' : job.payment_status === 'mfs_pending' ? 'Printed · MFS Hold' : 'Printed · Unpaid')
                            : job.status === 'printing'
                            ? (job.service_type === 'edit' ? '✏️ In Progress (Editing)' : job.service_type === 'photo' ? '🖼️ In Progress (Photo)' : 'In Progress')
                            : job.status}
                        </span>

                        {/* Total Price (Click to Edit) */}
                        {editPriceJobId === job.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-500">৳</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editPriceValue}
                              onChange={e => setEditPriceValue(e.target.value)}
                              className="w-20 bg-white border border-blue-400 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                              autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') handleSavePrice(job.id); if (e.key === 'Escape') setEditPriceJobId(null); }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePrice(job.id)}
                              disabled={savingPrice}
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition cursor-pointer"
                              title="Save price"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditPriceJobId(null)}
                              className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md transition cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setEditPriceJobId(job.id); setEditPriceValue(parseFloat(job.total_price || 0).toFixed(2)); }}
                            className="text-sm font-black text-slate-900 font-mono hover:text-blue-700 hover:bg-blue-50 px-1.5 py-0.5 rounded-lg transition cursor-pointer"
                            title="Click to edit price"
                          >
                            ৳{parseFloat(job.total_price || 0).toFixed(2)}
                          </button>
                        )}

                        {/* Payment Status Pill */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          job.payment_status === 'paid' || job.payment_status === 'paid_cash' || job.payment_status === 'paid_bkash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.payment_status === 'mfs_pending'
                              ? 'bg-pink-100 text-pink-800 border border-pink-300 animate-pulse'
                              : job.payment_status === 'paid_online_pending_verify'
                                ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <CreditCard className="w-2.5 h-2.5" />
                          <span>
                            {job.payment_status === 'paid' || job.payment_status === 'paid_cash' ? 'Paid (Cash)' :
                             job.payment_status === 'paid_bkash' ? 'Paid (bKash)' :
                             job.payment_status === 'mfs_pending' ? `MFS ****${job.payment_trx_id || ''}` :
                             job.payment_status === 'paid_online_pending_verify' ? `Verify ${job.payment_method?.toUpperCase()}` :
                             'Unpaid'}
                          </span>
                        </span>

                        {/* MFS Payment Pending Hold Banner — printed but payment not confirmed */}
                        {job.payment_status === 'mfs_pending' && job.status === 'done' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-2.5 h-2.5" />
                            HOLD — Verify Payment
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Layer 2: Single File Command Bar OR Multi-File Individual Specification Rows */}
                    {!hasFiles || job.files_deleted ? null : job.files.length === 1 ? (
                      /* ---------------- Single File Job (Compact 1-Bar) ---------------- */
                      <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-2 flex items-center justify-between gap-2.5 flex-nowrap overflow-x-auto">
                        
                        {/* Left: Document Info & Specs */}
                        <div className="flex items-center gap-1.5 flex-nowrap min-w-0 flex-1 shrink">
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-2xs min-w-0 max-w-[130px] sm:max-w-[170px] md:max-w-[220px] shrink truncate" title={job.files[0]?.original_name}>
                            {getFileIcon(job.files[0]?.original_name, isDone)}
                            <span className="truncate">{job.files[0]?.original_name}</span>
                          </div>

                          {job.service_type === 'edit' ? (
                            <>
                              <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded-lg border border-amber-300 text-[11px] font-bold shadow-2xs shrink-0 whitespace-nowrap">
                                ✏️ Edit & Print
                              </span>
                              {job.service_detail && (
                                <span className="bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 text-amber-900 text-[11px] font-bold shadow-2xs shrink-0 max-w-[200px] truncate" title={job.service_detail}>
                                  📝 {job.service_detail}
                                </span>
                              )}
                              <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                📄 {job.files[0]?.page_count || 1} {job.files[0]?.page_count === 1 ? 'Page' : 'Pages'}
                              </span>
                              <span className="bg-blue-50/80 px-2 py-1 rounded-lg border border-blue-200 text-blue-700 font-bold text-[11px] shadow-2xs shrink-0 whitespace-nowrap">
                                🖨️ {job.files[0]?.copies || 1}x {job.files[0]?.copies === 1 ? 'Copy' : 'Copies'}
                              </span>
                              <span className={`px-2 py-1 rounded-lg border text-[11px] font-bold shadow-2xs shrink-0 whitespace-nowrap ${
                                job.files[0]?.color_mode === 'color' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-white text-slate-700 border-slate-200'
                              }`}>
                                {job.files[0]?.color_mode === 'color' ? '🎨 Color' : '⬛ B&W'}
                              </span>
                              <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                📐 {job.files[0]?.paper_size || 'A4'}
                              </span>
                              <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                {job.files[0]?.sides === 'double' ? '🔄 2-Sided' : '1-Sided'}
                              </span>
                            </>
                          ) : job.service_type === 'photo' ? (
                            <>
                              <span className="bg-pink-100 text-pink-900 px-2 py-1 rounded-lg border border-pink-300 text-[11px] font-bold shadow-2xs shrink-0 whitespace-nowrap">
                                🖼️ {job.service_detail === 'passport_8' ? '8x Passport' : job.service_detail === 'stamp_4' ? '4x Stamp' : job.service_detail === 'photo_4r' ? '4R Photo (4×6)' : job.service_detail === 'photo_a4' ? 'A4 Glossy' : '4x Passport'}
                              </span>
                              <span className="bg-blue-50/80 px-2 py-1 rounded-lg border border-blue-200 text-blue-700 font-bold text-[11px] shadow-2xs shrink-0 whitespace-nowrap">
                                📷 {job.files[0]?.copies || 1}x Set
                              </span>
                              <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                ✨ Glossy Photo Paper
                              </span>
                            </>
                          ) : (
                            <>
                              {job.service_type === 'bind' && (
                                <span className="bg-purple-100 text-purple-900 px-2 py-1 rounded-lg border border-purple-300 text-[11px] font-bold shadow-2xs shrink-0 whitespace-nowrap">
                                  📖 {job.service_detail === 'tape' ? 'Tape Binding' : job.service_detail === 'hardcover' ? 'Hardcover Thesis' : 'Spiral Binding'}
                                </span>
                              )}
                              <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                📄 {job.files[0]?.page_count || 1} {job.files[0]?.page_count === 1 ? 'Page' : 'Pages'}
                              </span>
                              <span className="bg-blue-50/80 px-2 py-1 rounded-lg border border-blue-200 text-blue-700 font-bold text-[11px] shadow-2xs shrink-0 whitespace-nowrap">
                                🖨️ {job.files[0]?.copies || 1}x {job.files[0]?.copies === 1 ? 'Copy' : 'Copies'}
                              </span>
                              <span className={`px-2 py-1 rounded-lg border text-[11px] font-bold shadow-2xs shrink-0 whitespace-nowrap ${
                                job.files[0]?.color_mode === 'color' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-white text-slate-700 border-slate-200'
                              }`}>
                                {job.files[0]?.color_mode === 'color' ? '🎨 Color' : '⬛ B&W'}
                              </span>
                              <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                📐 {job.files[0]?.paper_size || 'A4'}
                              </span>
                              <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                {job.files[0]?.sides === 'double' ? '🔄 2-Sided' : '1-Sided'}
                              </span>
                            </>
                          )}

                          {job.global_notes && (
                            <span className="bg-amber-100/70 border border-amber-300 text-amber-900 text-[10px] font-semibold px-2 py-1 rounded-lg truncate max-w-[140px] shrink-0" title={`Note: ${job.global_notes}`}>
                              📝 {job.global_notes}
                            </span>
                          )}
                        </div>

                        {/* Right: Payment Switcher & Actions in one beautifully aligned row */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                          
                          {/* Payment Mode Switcher */}
                          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updatePaymentStatus(job.id, 'paid_cash', 'cash')}
                              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                                job.payment_status === 'paid_cash' || job.payment_status === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Mark Paid via Cash"
                            >
                              Cash
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePaymentStatus(job.id, 'paid_bkash', 'bkash')}
                              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                                job.payment_status === 'paid_bkash' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Mark Paid via bKash/Nagad"
                            >
                              bKash
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePaymentStatus(job.id, 'unpaid', 'cash')}
                              className={`px-1.5 py-1 rounded-md transition cursor-pointer ${
                                job.payment_status === 'unpaid' ? 'bg-slate-300 text-slate-800' : 'text-slate-400 hover:text-rose-600'
                              }`}
                              title="Mark Unpaid"
                            >
                              ✕
                            </button>
                          </div>

                          {/* MFS Verify: Show last 4 digits + Confirm button for bKash/Nagad pending */}
                          {job.payment_status === 'mfs_pending' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Verify bKash/Nagad payment?\n\nCustomer's last 4 digits: ${job.payment_trx_id || '????'}\nAmount: ৳${parseFloat(job.total_price || 0).toFixed(2)}\n\nCheck your ${job.payment_method === 'bkash' ? 'bKash' : 'Nagad'} app — match the last 4 digits of the sender's number. Press OK to confirm payment.`)) {
                                  updatePaymentStatus(job.id, 'paid_bkash', job.payment_method || 'bkash');
                                }
                              }}
                              className="px-2.5 py-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold rounded-lg text-[10px] flex items-center gap-1 transition shadow-xs cursor-pointer animate-pulse"
                              title={`Customer last 4: ${job.payment_trx_id} — click to verify`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verify ****{job.payment_trx_id}</span>
                            </button>
                          )}

                          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

                          {/* Preview Button */}
                          {canPreview ? (
                            <button
                              type="button"
                              onClick={() => setActivePreview({ file: job.files[0], job })}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1 transition border border-slate-200 cursor-pointer shadow-2xs"
                              title="Preview document"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Preview</span>
                            </button>
                          ) : isDone ? (
                            <span
                              className="px-2 py-1 bg-slate-100/90 text-slate-400 border border-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 select-none"
                              title="Preview locked after printing for privacy"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Locked</span>
                            </span>
                          ) : null}

                          {/* Download Button — 1st download direct & sets in-progress; subsequent downloads require permission */}
                          {canDownload && (() => {
                            const isDownloaded = (job.download_count > 0) || downloadedJobIds.has(job.id);
                            const isDirectEligible = (job.service_type === 'edit' || job.service_type === 'photo');
                            return (
                              <button
                                type="button"
                                onClick={() => (isDirectEligible && !isDownloaded) ? handleDirectDownload(job) : handleRequestDownload(job)}
                                className={`px-2.5 py-1 font-bold rounded-lg text-xs flex items-center gap-1 transition border cursor-pointer shadow-2xs ${
                                  isDownloaded
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                    : job.service_type === 'photo'
                                    ? 'bg-pink-50 hover:bg-pink-100 text-pink-900 border-pink-300'
                                    : job.service_type === 'edit'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                                title={
                                  isDownloaded
                                    ? 'Already downloaded once — Re-download requires customer permission'
                                    : isDirectEligible
                                    ? 'Download file and start progress (Direct 1st download)'
                                    : 'Download files (Customer approval required)'
                                }
                              >
                                {isDownloaded ? <Lock className="w-3.5 h-3.5 text-slate-500" /> : <Download className={`w-3.5 h-3.5 ${job.service_type === 'photo' ? 'text-pink-600' : job.service_type === 'edit' ? 'text-amber-600' : 'text-slate-600'}`} />}
                                <span>{isDownloaded ? '🔐 Re-Download' : (job.service_type === 'photo' || job.service_type === 'edit') ? '⬇ Download' : 'Download'}</span>
                              </button>
                            );
                          })()}

                          {/* Print Button (Hidden for photo & edit jobs — printed via Photoshop/studio software) */}
                          {!isDone && job.service_type !== 'photo' && job.service_type !== 'edit' && (
                            <button
                              type="button"
                              onClick={() => handlePrintAll(job)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Print</span>
                            </button>
                          )}

                          {/* Reprint Button */}
                          {isDone && (
                            <button
                              type="button"
                              onClick={() => handleOpenReprintModal(job)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                              title="Reprint requires customer verification"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                              <span>Reprint</span>
                            </button>
                          )}

                          {/* Done / Collect Cash Action Button */}
                          {isDone && (!job.payment_status || job.payment_status === 'unpaid') ? (
                            <button
                              type="button"
                              onClick={() => updatePaymentStatus(job.id, 'paid_cash', 'cash')}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95 animate-pulse"
                              title="Customer handed cash? Click to mark Paid (Cash) & complete"
                            >
                              <span>💵</span>
                              <span>Collect ৳{parseFloat(job.total_price || 0).toFixed(0)} Cash</span>
                            </button>
                          ) : !isDone ? (
                            <button
                              type="button"
                              onClick={() => updateJobStatus(job.id, 'done')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-700 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Done</span>
                            </span>
                          )}

                          {/* WhatsApp */}
                          {job.customer_phone && (
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(job)}
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
                              title="Send WhatsApp Ready Message"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          )}

                        </div>

                      </div>
                    ) : (
                      /* ---------------- Multi-File Job (Master Control + File by File Rows) ---------------- */
                      <div className="space-y-2">
                        {/* Master Order Action Bar */}
                        <div className="bg-slate-100/90 border border-slate-200/90 rounded-xl px-3 py-2 flex items-center justify-between gap-2.5 flex-nowrap overflow-x-auto">
                          
                          {/* Order Files Summary & Print Progress */}
                          <div className="flex items-center gap-2 flex-nowrap min-w-0">
                            {(() => {
                              const printedCount = (job.files || []).filter(f => isDone || printedFileIds.has(f.id)).length;
                              return (
                                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                                  <span className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-blue-600'}`}></span>
                                  <span>Multi-File Order ({job.files.length} Documents)</span>
                                  {!isDone && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      printedCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      {printedCount}/{job.files.length} Printed
                                    </span>
                                  )}
                                </span>
                              );
                            })()}
                            {job.global_notes && (
                              <span className="bg-amber-100/70 border border-amber-300 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded-lg truncate max-w-[160px]" title={`Note: ${job.global_notes}`}>
                                📝 {job.global_notes}
                              </span>
                            )}
                          </div>

                          {/* Master Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                            
                            {/* Payment Mode Switcher */}
                            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updatePaymentStatus(job.id, 'paid_cash', 'cash')}
                                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                                  job.payment_status === 'paid_cash' || job.payment_status === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Mark Paid via Cash"
                              >
                                Cash
                              </button>
                              <button
                                type="button"
                                onClick={() => updatePaymentStatus(job.id, 'paid_bkash', 'bkash')}
                                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                                  job.payment_status === 'paid_bkash' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Mark Paid via bKash/Nagad"
                              >
                                bKash
                              </button>
                              <button
                                type="button"
                                onClick={() => updatePaymentStatus(job.id, 'unpaid', 'cash')}
                                className={`px-1.5 py-1 rounded-md transition cursor-pointer ${
                                  job.payment_status === 'unpaid' ? 'bg-slate-300 text-slate-800' : 'text-slate-400 hover:text-rose-600'
                                }`}
                                title="Mark Unpaid"
                              >
                                ✕
                              </button>
                            </div>

                            {/* MFS Verify: Show last 4 digits + Confirm button for bKash/Nagad pending */}
                            {job.payment_status === 'mfs_pending' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Verify bKash/Nagad payment?\n\nCustomer's last 4 digits: ${job.payment_trx_id || '????'}\nAmount: ৳${parseFloat(job.total_price || 0).toFixed(2)}\n\nCheck your ${job.payment_method === 'bkash' ? 'bKash' : 'Nagad'} app — match the last 4 digits of the sender's number. Press OK to confirm payment.`)) {
                                    updatePaymentStatus(job.id, 'paid_bkash', job.payment_method || 'bkash');
                                  }
                                }}
                                className="px-2.5 py-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold rounded-lg text-[10px] flex items-center gap-1 transition shadow-xs cursor-pointer animate-pulse"
                                title={`Customer last 4: ${job.payment_trx_id} — click to verify`}
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Verify ****{job.payment_trx_id}</span>
                              </button>
                            )}

                            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

                            {/* Download All — 1st download direct & sets in-progress; subsequent downloads require permission */}
                            {canDownload && (() => {
                              const isDownloaded = (job.download_count > 0) || downloadedJobIds.has(job.id);
                              const isDirectEligible = (job.service_type === 'edit' || job.service_type === 'photo');
                              return (
                                <button
                                  type="button"
                                  onClick={() => (isDirectEligible && !isDownloaded) ? handleDirectDownload(job) : handleRequestDownload(job)}
                                  className={`px-2.5 py-1 font-bold rounded-lg text-xs flex items-center gap-1 transition border cursor-pointer shadow-2xs ${
                                    isDownloaded
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                      : job.service_type === 'photo'
                                      ? 'bg-pink-50 hover:bg-pink-100 text-pink-900 border-pink-300'
                                      : job.service_type === 'edit'
                                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                  title={
                                    isDownloaded
                                      ? 'Already downloaded once — Re-download requires customer permission'
                                      : isDirectEligible
                                      ? 'Download files and start progress (Direct 1st download)'
                                      : 'Download files (Customer approval required)'
                                  }
                                >
                                  {isDownloaded ? <Lock className="w-3.5 h-3.5 text-slate-500" /> : <Download className={`w-3.5 h-3.5 ${job.service_type === 'photo' ? 'text-pink-600' : job.service_type === 'edit' ? 'text-amber-600' : 'text-slate-600'}`} />}
                                  <span>{isDownloaded ? '🔐 Re-Download All' : (job.service_type === 'photo' || job.service_type === 'edit') ? '⬇ Download All' : 'Download All'}</span>
                                </button>
                              );
                            })()}

                            {/* Print All Button (Hidden for photo & edit jobs) */}
                            {!isDone && job.service_type !== 'photo' && job.service_type !== 'edit' && (
                              <button
                                type="button"
                                onClick={() => handlePrintAll(job)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>Print All ({job.files.length})</span>
                              </button>
                            )}

                            {/* Done / Collect Cash Action Button */}
                            {isDone && (!job.payment_status || job.payment_status === 'unpaid') ? (
                              <button
                                type="button"
                                onClick={() => updatePaymentStatus(job.id, 'paid_cash', 'cash')}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95 animate-pulse"
                                title="Customer handed cash? Click to mark Paid (Cash) & complete"
                              >
                                <span>💵</span>
                                <span>Collect ৳{parseFloat(job.total_price || 0).toFixed(0)} Cash</span>
                              </button>
                            ) : !isDone ? (
                              <button
                                type="button"
                                onClick={() => updateJobStatus(job.id, 'done')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Done</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-700 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Done</span>
                              </span>
                            )}

                            {/* WhatsApp */}
                            {job.customer_phone && (
                              <button
                                type="button"
                                onClick={() => handleSendWhatsApp(job)}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
                                title="Send WhatsApp Ready Message"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            )}

                          </div>
                        </div>

                        {/* Individual File Rows (Print & Inspect One by One) */}
                        <div className="space-y-1.5">
                          {job.files.map((file, fIdx) => {
                            const isFilePrinted = isDone || printedFileIds.has(file.id);
                            return (
                              <div
                                key={file.id || fIdx}
                                className={`border rounded-xl p-2 flex items-center justify-between gap-2 flex-nowrap overflow-x-auto shadow-2xs transition ${
                                  isFilePrinted ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200/90'
                                }`}
                              >
                                {/* Left: File Index & Specifications */}
                                <div className="flex items-center gap-1.5 flex-nowrap min-w-0 flex-1 shrink">
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 border ${
                                    isFilePrinted ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    #{fIdx + 1}
                                  </span>

                                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-xs font-bold text-slate-800 shadow-2xs min-w-0 max-w-[130px] sm:max-w-[170px] md:max-w-[220px] shrink truncate" title={file.original_name}>
                                    {getFileIcon(file.original_name, isFilePrinted)}
                                    <span className="truncate">{file.original_name}</span>
                                  </div>

                                  {job.service_type === 'edit' ? (
                                    <>
                                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-300 text-[11px] font-bold shadow-2xs shrink-0 whitespace-nowrap">
                                        ✏️ Edit & Print
                                      </span>
                                      <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                        📄 {file.page_count || 1} {file.page_count === 1 ? 'Page' : 'Pages'}
                                      </span>
                                      <span className="bg-blue-50/80 px-2 py-0.5 rounded-lg border border-blue-200 text-blue-700 font-bold text-[11px] shadow-2xs shrink-0 whitespace-nowrap">
                                        🖨️ {file.copies || 1}x {file.copies === 1 ? 'Copy' : 'Copies'}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold shadow-2xs shrink-0 whitespace-nowrap ${
                                        file.color_mode === 'color' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                                      }`}>
                                        {file.color_mode === 'color' ? '🎨 Color' : '⬛ B&W'}
                                      </span>
                                      <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                        📐 {file.paper_size || 'A4'}
                                      </span>
                                      <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                        {file.sides === 'double' ? '🔄 2-Sided' : '1-Sided'}
                                      </span>
                                    </>
                                  ) : job.service_type === 'photo' ? (
                                    <>
                                      <span className="bg-pink-100 text-pink-900 px-2 py-0.5 rounded-lg border border-pink-300 text-[11px] font-bold shadow-2xs shrink-0 whitespace-nowrap">
                                        🖼️ {job.service_detail === 'passport_8' ? '8x Passport' : job.service_detail === 'stamp_4' ? '4x Stamp' : job.service_detail === 'photo_4r' ? '4R Photo (4×6)' : job.service_detail === 'photo_a4' ? 'A4 Glossy' : '4x Passport'}
                                      </span>
                                      <span className="bg-blue-50/80 px-2 py-0.5 rounded-lg border border-blue-200 text-blue-700 font-bold text-[11px] shadow-2xs shrink-0 whitespace-nowrap">
                                        📷 {file.copies || 1}x Set
                                      </span>
                                      <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                        ✨ Glossy Photo
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                        📄 {file.page_count || 1} {file.page_count === 1 ? 'Page' : 'Pages'}
                                      </span>
                                      <span className="bg-blue-50/80 px-2 py-0.5 rounded-lg border border-blue-200 text-blue-700 font-bold text-[11px] shadow-2xs shrink-0 whitespace-nowrap">
                                        🖨️ {file.copies || 1}x {file.copies === 1 ? 'Copy' : 'Copies'}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold shadow-2xs shrink-0 whitespace-nowrap ${
                                        file.color_mode === 'color' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                                      }`}>
                                        {file.color_mode === 'color' ? '🎨 Color' : '⬛ B&W'}
                                      </span>
                                      <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                        📐 {file.paper_size || 'A4'}
                                      </span>
                                      <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                                        {file.sides === 'double' ? '🔄 2-Sided' : '1-Sided'}
                                      </span>
                                    </>
                                  )}

                                  {file.notes && (
                                    <span className="bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-medium px-1.5 py-0.5 rounded truncate max-w-[120px] shrink-0" title={file.notes}>
                                      💬 {file.notes}
                                    </span>
                                  )}
                                </div>

                                {/* Right: Individual Preview, Download & Print Actions */}
                                <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                                  {/* Preview This File */}
                                  {canPreview ? (
                                    <button
                                      type="button"
                                      onClick={() => setActivePreview({ file, job })}
                                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1 transition border border-slate-200 cursor-pointer shadow-2xs"
                                      title={`Preview ${file.original_name}`}
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Preview</span>
                                    </button>
                                  ) : isDone ? (
                                    <span
                                      className="px-2 py-1 bg-slate-100/90 text-slate-400 border border-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 select-none"
                                      title="Preview locked after printing for privacy"
                                    >
                                      <Lock className="w-3 h-3 text-slate-400" />
                                      <span>Locked</span>
                                    </span>
                                  ) : null}

                                  {/* Download This File */}
                                  {canDownload && (() => {
                                    const isDownloaded = (job.download_count > 0) || downloadedJobIds.has(job.id);
                                    const isDirectEligible = (job.service_type === 'edit' || job.service_type === 'photo');
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => (isDirectEligible && !isDownloaded) ? handleDirectDownload(job, file) : handleRequestDownload(job, file)}
                                        className={`px-2 py-1 font-bold rounded-lg text-xs flex items-center gap-1 transition border cursor-pointer shadow-2xs ${
                                          isDownloaded
                                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                            : job.service_type === 'photo'
                                            ? 'bg-pink-50 hover:bg-pink-100 text-pink-900 border-pink-300'
                                            : job.service_type === 'edit'
                                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                        }`}
                                        title={
                                          isDownloaded
                                            ? `Already downloaded — Re-download ${file.original_name} requires customer permission`
                                            : isDirectEligible
                                            ? `Download ${file.original_name} and start progress`
                                            : `Download ${file.original_name} (Customer approval required)`
                                        }
                                      >
                                        {isDownloaded ? <Lock className="w-3.5 h-3.5 text-slate-500" /> : <Download className={`w-3.5 h-3.5 ${job.service_type === 'photo' ? 'text-pink-600' : job.service_type === 'edit' ? 'text-amber-600' : 'text-slate-600'}`} />}
                                        <span>{isDownloaded ? '🔐 Re-Download' : 'Download'}</span>
                                      </button>
                                    );
                                  })()}

                                  {/* Print This File (Hidden for photo & edit jobs) */}
                                  {!isDone && !isFilePrinted && job.service_type !== 'photo' && job.service_type !== 'edit' && (
                                    <button
                                      type="button"
                                      onClick={() => handlePrintFile(file, job)}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
                                      title={`Print File #${fIdx + 1} (${file.color_mode === 'color' ? 'Color' : 'B&W'}, ${file.copies || 1}x, ${file.sides === 'double' ? '2-Sided' : '1-Sided'})`}
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                      <span>Print File {fIdx + 1}</span>
                                    </button>
                                  )}

                                  {!isDone && isFilePrinted && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Printed</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickPrint(file, job, false)}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                                        title="Print again"
                                      >
                                        <RefreshCw className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}

                                  {/* Reprint This File (If Done) */}
                                  {isDone && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReprintModal(job, file)}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                      title="Reprint requires customer verification"
                                    >
                                      <RefreshCw className="w-3 h-3 text-amber-600" />
                                      <span>Reprint</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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

        {/* Right Sidebar: Freshly Printed Orders Panel (Counter Pickup) */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-3.5">
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-emerald-200/90 space-y-3 sticky top-20">
            
            {/* Header */}
            <div className="border-b border-slate-100 pb-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 tracking-tight whitespace-nowrap">
                    Freshly Printed
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs shrink-0">
                    {activeFreshJobs.length} Ready
                  </span>
                </div>

                {freshPrintedJobs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => triggerWipeFromBottom(freshPrintedJobs)}
                    disabled={isWipingRef.current}
                    className="text-[11px] text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs border border-slate-200/60"
                    title="Wipe completed orders from the bottom up"
                  >
                    <span>🧹 Wipe</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium pl-4.5 truncate">Counter Pickup · Hand over to customer</p>
            </div>

            {/* List of Freshly Printed Cards */}
            {freshPrintedJobs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="font-bold text-slate-700 text-xs">All Printed Orders Cleared</p>
                <p className="text-[10px] text-slate-400">When you complete an order, it appears here for counter pickup.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-0.5">
                {freshPrintedJobs.map(fj => {
                  const hasMultiple = fj.files && fj.files.length > 1;
                  const totalPages = fj.total_pages || (fj.files ? fj.files.reduce((acc, f) => acc + (f.page_count || 1) * (f.copies || 1), 0) : 1);
                  const totalCopies = fj.files && fj.files.length > 0 ? fj.files[0].copies || 1 : 1;
                  const isPaid = isJobPaid(fj);
                  const isWiping = wipingFreshIds.has(fj.id);

                  return (
                    <div
                      key={fj.id}
                      className={`bg-white hover:bg-slate-50/60 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-2.5 sm:p-3 space-y-2 transition-all shadow-2xs hover:shadow-xs relative ${
                        isWiping ? 'animate-wipe-out' : ''
                      }`}
                    >
                      {/* Layer 1: Token, Customer Name, Status & Actions */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-xs font-black text-blue-700 font-mono tracking-tight bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-lg shrink-0 shadow-2xs">
                            #{fj.job_code}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800 truncate flex items-center gap-1" title={fj.customer_name || 'Guest'}>
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{fj.customer_name || 'Guest'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Ready</span>
                          </span>

                          {fj.customer_phone && (
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(fj)}
                              className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                              title="Send WhatsApp Ready Message"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDismissedFreshIds(prev => new Set(prev).add(fj.id))}
                            className="w-5 h-5 rounded-md hover:bg-rose-50 text-slate-300 hover:text-rose-500 flex items-center justify-center transition cursor-pointer shrink-0 ml-0.5"
                            title="Dismiss (Order Handed Over)"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Layer 2: PDF Name, Pages, Money & Paid Status */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1.5">
                        <div 
                          className="flex items-center gap-1.5 min-w-0 flex-1" 
                          title={fj.files && fj.files.length > 0 ? fj.files.map(f => f.original_name).join(', ') : 'Document'}
                        >
                          <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate text-xs font-semibold text-slate-800">
                            {fj.files && fj.files.length > 1
                              ? `${fj.files[0]?.original_name || 'Document'} (+${fj.files.length - 1})`
                              : fj.files?.[0]?.original_name || 'Document'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200/90 px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap">
                            {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                          </span>

                          <span className="text-xs font-black font-mono text-slate-900 tracking-tight whitespace-nowrap">
                            ৳{parseFloat(fj.total_price || 0).toFixed(2)}
                          </span>

                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {isPaid ? '✓ PAID' : 'CASH DUE'}
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Google AdSense Space (Directly Under Freshly Printed Box) */}
          <div className="pt-0.5">
            <GoogleAdSense
              client={adsenseConfig?.clientId}
              slot={adsenseConfig?.slotShopSide || adsenseConfig?.slotShopTop}
              format="rectangle"
              className="my-0"
            />
          </div>

        </aside>

      </div>

      {/* Document Preview Modal */}
      {activePreview && (
        <PrintModal
          file={activePreview.file}
          job={activePreview.job}
          preview={activePreview}
          onClose={() => setActivePreview(null)}
          onPrint={(f, j) => {
            handlePrintFile(f, j);
            setActivePreview(null);
          }}
        />
      )}

      {/* Customer Reprint Real-Time Approval Modal */}
      {reprintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-100/50">
              <RefreshCw className="w-7 h-7 animate-spin" style={{ animationDuration: '3s' }} />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Requesting Customer Approval</h3>
              <p className="text-xs text-slate-500">Order #{reprintModal.job?.job_code} {reprintModal.job?.customer_name ? `· ${reprintModal.job.customer_name}` : ''}</p>
            </div>

            {/* Waiting Radar Callout */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 space-y-2 text-left">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <span>Waiting for Customer to Grant Reprint...</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                A reprint prompt has been sent in real-time to the customer's live tracking screen. When they tap <strong>Allow Reprint</strong>, printing will begin automatically.
              </p>
            </div>

            {/* Specific document being reprinted */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-800 text-left truncate flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="truncate">{reprintModal.fileName || reprintModal.fileToReprint?.original_name || 'Document'}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                onClick={() => setReprintModal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel Request
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Customer Direct Download Real-Time Approval Modal */}
      {downloadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border-2 border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-100/50">
              <Download className="w-7 h-7 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Requesting Download Permission</h3>
              <p className="text-xs text-slate-500">Order #{downloadModal.job?.job_code} {downloadModal.job?.customer_name ? `· ${downloadModal.job.customer_name}` : ''}</p>
            </div>

            {/* Waiting Radar Callout */}
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 space-y-2 text-left">
              <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                <span>Waiting for Customer Consent...</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                A download permission request has been sent to the customer's live tracking screen. Once granted, the file will download directly to your computer.
              </p>
            </div>

            {/* Specific document being downloaded */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-800 text-left truncate flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="truncate">{downloadModal.fileName || downloadModal.fileToDownload?.original_name || 'Document'}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                onClick={() => setDownloadModal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel Request
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Shop Rates & Customer Notice Editor Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-800">Shop Rates & Customer Notice</h3>
                  <p className="text-[11px] text-slate-400">Set rates for documents, photo studio & binding. Updates reflect live on QR page.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs transition cursor-pointer"
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
              className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4 text-xs"
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

              {/* 2-Column Grid for Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* Left Column: Print Rates & Photo Studio Rates */}
                <div className="space-y-3.5">
                  {/* Document Pricing Grid */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                      <span>🖨️</span> Document Print Rates
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">B&W (৳/page)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentShopData.price_bw || '2.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_bw: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Color (৳/page)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentShopData.price_color || '10.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_color: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Legal Sheet Extra (৳)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentShopData.price_legal || '3.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_legal: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">A3 Sheet Extra (৳)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentShopData.price_a3 || '15.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_a3: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Photo Print Pricing Grid */}
                  <div className="p-3.5 bg-pink-50/50 rounded-2xl border border-pink-200/80 space-y-2.5">
                    <label className="font-bold text-pink-900 flex items-center gap-1.5 text-xs">
                      <span>🖼️</span> Photo Studio Rates (Glossy Paper)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Passport 4-Pack (৳)</label>
                        <input
                          type="number"
                          step="1"
                          value={currentShopData.price_passport_4 || '30.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_passport_4: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-pink-700 focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Passport 8-Pack (৳)</label>
                        <input
                          type="number"
                          step="1"
                          value={currentShopData.price_passport_8 || '50.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_passport_8: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-pink-700 focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Stamp 4-Pack (৳)</label>
                        <input
                          type="number"
                          step="1"
                          value={currentShopData.price_stamp_4 || '20.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_stamp_4: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-pink-700 focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">4R Photo 4x6" (৳)</label>
                        <input
                          type="number"
                          step="1"
                          value={currentShopData.price_photo_4r || '20.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_photo_4r: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">A4 Photo Sheet (৳)</label>
                        <input
                          type="number"
                          step="1"
                          value={currentShopData.price_photo_a4 || '60.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_photo_a4: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Binding, Hours, Payment & Bulk Discounts */}
                <div className="space-y-3.5">
                  {/* Binding Rates Grid */}
                  <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-200/80 space-y-2.5">
                    <label className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                      <span>📖</span> Book Binding Extra Rates
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Spiral Binding (৳)</label>
                        <input
                          type="number"
                          step="1"
                          value={currentShopData.price_bind_spiral || '30.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_bind_spiral: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-purple-700 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Tape Binding (৳)</label>
                        <input
                          type="number"
                          step="1"
                          value={currentShopData.price_bind_tape || '20.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_bind_tape: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-purple-700 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Hardcover (৳)</label>
                        <input
                          type="number"
                          step="5"
                          value={currentShopData.price_bind_hardcover || '300.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_bind_hardcover: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-purple-700 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document Editing Fee Card */}
                  <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2.5">
                    <label className="font-bold text-amber-900 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span>✏️</span> Document Editing Fee (Word / Photoshop)
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Base Edit Charge / File (৳)</label>
                        <input
                          type="number"
                          step="5"
                          value={currentShopData.price_edit || '30.00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, price_edit: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-800 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="flex items-center text-[10px] text-amber-800/80 italic pt-1 sm:pt-0">
                        Added to normal print rates when customer chooses Edit & Print.
                      </div>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Operating Hours & Status
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentShopData({ ...currentShopData, is_closed: currentShopData.is_closed ? 0 : 1 })}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
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
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Closing Time</label>
                        <input
                          type="time"
                          value={currentShopData.closing_time || '22:00'}
                          onChange={e => setCurrentShopData({ ...currentShopData, closing_time: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Online Payment Numbers */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                      <CreditCard className="w-3.5 h-3.5 text-pink-600" />
                      Payment Numbers (bKash & Nagad)
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

                  {/* Bulk Discount Rules */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
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
                </div>

              </div>

              {/* Shop Address */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Shop Address / Counter Location</label>
                <input
                  type="text"
                  value={currentShopData.address || ''}
                  onChange={e => setCurrentShopData({ ...currentShopData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingShopSettings}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {savingShopSettings ? 'Saving...' : '✓ Save Settings & Rates'}
                </button>
              </div>
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

      {/* Shop Loyalty Rewards Points Modal */}
      {showPointsModal && (
        <ShopPointsModal
          shop={currentShopData || shop}
          currentPoints={pointsBalance}
          onClose={() => setShowPointsModal(false)}
        />
      )}

    </div>
  );
}


