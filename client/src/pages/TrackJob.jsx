import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, Printer, Store, Phone, MapPin, Sparkles, Loader2,
  ArrowLeft, Copy, Check, QrCode, Bell, BellRing, MessageCircle, CreditCard, Percent,
  Download, AlertTriangle, FileText, ShieldCheck, Lock, Trash2, Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { socket, playChime } from '../socket';
import GoogleAdSense from '../components/GoogleAdSense';
import BrandSponsorCard from '../components/BrandSponsorCard';

// Official Brand Logos
const BkashLogo = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 12L15 48L36 53L50 12Z" fill="white" fillOpacity="0.95"/>
    <path d="M50 12L85 30L63 50L50 12Z" fill="white" fillOpacity="0.85"/>
    <path d="M50 12L36 53L63 50L50 12Z" fill="white"/>
    <path d="M15 48L42 80L36 53L15 48Z" fill="white" fillOpacity="0.75"/>
    <path d="M85 30L55 76L63 50L85 30Z" fill="white" fillOpacity="0.8"/>
    <path d="M36 53L42 80L63 50L36 53Z" fill="white" fillOpacity="0.9"/>
    <path d="M42 80L49 92L55 76L42 80Z" fill="white"/>
  </svg>
);

const NagadLogo = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="white" fillOpacity="0.25"/>
    <path d="M50 16C50 16 30 36 30 52C30 63.0457 38.9543 72 50 72C61.0457 72 70 63.0457 70 52C70 36 50 16 50 16Z" fill="white"/>
    <path d="M50 36C50 36 38 48 38 56C38 62.6274 43.3726 68 50 68C56.6274 68 62 62.6274 62 56C62 48 50 36 50 36Z" fill="#F1592A"/>
    <circle cx="50" cy="57" r="6" fill="white"/>
  </svg>
);

export default function TrackJob({ jobCode, onBack }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedAuth, setCopiedAuth] = useState(false);
  const [copiedBkash, setCopiedBkash] = useState(false);
  const [payingMethod, setPayingMethod] = useState(null); // 'bkash' | 'nagad' | null
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccessTrx, setPaymentSuccessTrx] = useState(null);
  const [manualDigits, setManualDigits] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [showOnlinePayOptions, setShowOnlinePayOptions] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [notifGranted, setNotifGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [promoAd, setPromoAd] = useState(null);
  const [brandSponsor, setBrandSponsor] = useState(null);
  const [adsenseConfig, setAdsenseConfig] = useState(null);
  const [dlRequest, setDlRequest] = useState(null);
  const [reprintRequest, setReprintRequest] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [isDeletingFiles, setIsDeletingFiles] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fileDeleteSuccess, setFileDeleteSuccess] = useState(false);
  const autoPurgedRef = React.useRef(false);

  // Live ticking clock for auto-delete countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatic file deletion when timer expires if customer has not deleted manually
  useEffect(() => {
    if (!job || !job.id || job.files_deleted || autoPurgedRef.current) return;
    if (job.status !== 'done') return;

    const settings = job.cleanup_settings || { enabled: true, success_minutes: 15 };
    if (settings.enabled === false) return;

    const completedTime = new Date(job.completed_at || job.updated_at || job.created_at).getTime();
    const successMins = Number(settings.success_minutes ?? 15);
    const deadlineMs = completedTime + (successMins * 60 * 1000);

    if (now >= deadlineMs) {
      autoPurgedRef.current = true;
      fetch(`/api/jobs/${job.id}/files`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setJob(prev => prev ? ({ ...prev, files_deleted: 1 }) : prev);
          }
        })
        .catch(() => {});
    }
  }, [now, job?.id, job?.status, job?.files_deleted, job?.completed_at, job?.updated_at]);

  // File type icon helper
  const getFileIcon = (fileName) => {
    if (!fileName) return <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  };

  // Customer manual immediate file deletion
  const handleDeleteFilesNow = async () => {
    if (!job || !job.id || isDeletingFiles) return;
    setIsDeletingFiles(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/files`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setJob(prev => prev ? ({ ...prev, files_deleted: 1 }) : prev);
        setFileDeleteSuccess(true);
        setConfirmDelete(false);
        setTimeout(() => setFileDeleteSuccess(false), 6000);
      } else {
        alert(data.error || 'Failed to delete files from server');
      }
    } catch (err) {
      alert('Network error while deleting files');
    } finally {
      setIsDeletingFiles(false);
    }
  };

  const handleInitiateOnlinePay = async (method) => {
    if (!job || !job.id) return;
    setPayingMethod(method);
    setPaymentError('');
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          method: method
        })
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setPaymentError(data.error || 'Unable to create payment session.');
      }
    } catch (err) {
      setPaymentError('Connection error. Please check server.');
    } finally {
      setPayingMethod(null);
    }
  };

  const handleManualMfsSubmit = async (method = 'bkash') => {
    if (!job || !job.id) return;
    const digits = manualDigits.replace(/\D/g, '').slice(0, 4);
    if (digits.length !== 4) {
      setPaymentError('Please enter the last 4 digits of your number.');
      return;
    }
    setSubmittingManual(true);
    setPaymentError('');
    try {
      const res = await fetch('/api/jobs/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          payment_status: 'mfs_pending',
          payment_method: method,
          payment_trx_id: digits
        })
      });
      const data = await res.json();
      if (data.success) {
        setJob(prev => ({
          ...prev,
          payment_status: 'mfs_pending',
          payment_method: method,
          payment_trx_id: digits
        }));
        setShowManualInput(false);
      } else {
        setPaymentError(data.error || 'Failed to submit digits.');
      }
    } catch (err) {
      setPaymentError('Connection error. Please try again.');
    } finally {
      setSubmittingManual(false);
    }
  };

  const getDeleteCountdown = () => {
    if (!job) return null;
    if (job.files_deleted) {
      return { status: 'deleted', label: 'Purged', desc: 'Uploaded documents have been securely purged from the server for privacy.' };
    }
    const settings = job.cleanup_settings || { enabled: true, success_minutes: 15, unsuccess_minutes: 30 };
    if (settings.enabled === false) {
      return { status: 'disabled', label: 'Manual Cleanup', desc: 'Managed according to shop retention policy.' };
    }

    let deadlineMs = null;
    if (job.status === 'done') {
      const completedTime = new Date(job.completed_at || job.updated_at || job.created_at).getTime();
      deadlineMs = completedTime + ((Number(settings.success_minutes) || 15) * 60 * 1000);
    } else if (job.created_at) {
      const createdTime = new Date(job.created_at).getTime();
      deadlineMs = createdTime + ((Number(settings.unsuccess_minutes) || 30) * 60 * 1000);
    }

    if (!deadlineMs || isNaN(deadlineMs)) return null;

    const diffMs = deadlineMs - now;
    if (diffMs <= 0) {
      return { status: 'deleted', label: 'Purged', desc: 'Uploaded documents have been securely purged from the server for privacy.' };
    }

    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    let timeString = '';
    if (hours > 0) {
      timeString = `${hours}h ${mins}m ${secs}s`;
    } else {
      timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return {
      status: 'active',
      timeString,
      label: `Auto-Purge in ${timeString}`,
      isUrgent: diffMs < 5 * 60 * 1000,
      desc: job.status === 'done'
        ? `Files automatically purge in ${timeString} to protect your data privacy.`
        : `Unprinted files auto-expire in ${settings.unsuccess_minutes >= 60 ? `${Math.round(settings.unsuccess_minutes / 60)}h` : `${settings.unsuccess_minutes}m`}`
    };
  };

  useEffect(() => {
    // Check for payment query parameters
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        const trx = urlParams.get('trx') || 'Confirmed';
        setPaymentSuccessTrx(trx);
        fireConfetti();
      }
    } catch (_) {}

    // Fetch announcement & adsense
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.customerAd?.enabled) setPromoAd(data.customerAd);
          if (data.brandSponsor?.enabled) setBrandSponsor(data.brandSponsor);
          if (data.adsense?.enabled) setAdsenseConfig(data.adsense);
        }
      })
      .catch(() => {});

    if (!jobCode) return;

    // 1. Initial REST Fetch
    fetch(`/api/jobs/track/${jobCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJob(data.job);
          if (data.job.status === 'done') {
            fireConfetti();
          }
        } else {
          setError(data.error || 'Order not found.');
        }
      })
      .catch(() => setError('Failed to connect to server.'))
      .finally(() => setLoading(false));

    // 2. Real-time WebSocket Subscription
    socket.emit('join_job', jobCode);

    const handleStatusChanged = (update) => {
      setJob(prev => {
        if (!prev) return prev;
        const nextStatus = update.status || prev.status;
        const nextPayStatus = update.payment_status || prev.payment_status;

        const wasUnpaid = !prev.payment_status || prev.payment_status === 'unpaid' || prev.payment_status === 'mfs_pending';
        const isNowPaid = nextPayStatus === 'paid' || nextPayStatus === 'paid_cash' || nextPayStatus === 'paid_bkash';

        // Realtime Payment Confirmation Celebration
        if (isNowPaid && wasUnpaid) {
          fireConfetti();
          playChime();
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('💳 Payment Received!', {
                body: `Your payment for Order #${jobCode} has been confirmed. Thank you!`,
                icon: '/favicon.ico'
              });
            } catch (_) {}
          }
        } else if (nextStatus === 'done' && prev.status !== 'done') {
          fireConfetti();
          playChime();

          // Push Notification (Feature 6)
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('🖨️ Print Order Ready!', {
                body: `Your documents for Order #${jobCode} are printed and ready for pickup at ${prev.shop_name || 'the shop'}.`,
                icon: '/favicon.ico'
              });
            } catch (_) {}
          }
        }
        return { ...prev, ...update };
      });
    };

    const handleDownloadPermissionRequest = (req) => {
      setDlRequest(req);
      playChime();
      setTimeout(() => {
        setDlRequest(curr => {
          if (curr && curr.job_id === req.job_id) {
            socket.emit('download_permission_response', {
              job_id: req.job_id,
              job_code: req.job_code,
              shop_id: req.shop_id,
              granted: false
            });
            return null;
          }
          return curr;
        });
      }, 60000);
    };

    const handleReprintPermissionRequest = (req) => {
      setReprintRequest(req);
      playChime();
      setTimeout(() => {
        setReprintRequest(curr => {
          if (curr && curr.job_id === req.job_id) {
            socket.emit('reprint_permission_response', {
              job_id: req.job_id,
              job_code: req.job_code,
              shop_id: req.shop_id,
              file_id: req.file_id,
              granted: false
            });
            return null;
          }
          return curr;
        });
      }, 60000);
    };

    socket.on('status_changed', handleStatusChanged);
    socket.on('download_permission_request', handleDownloadPermissionRequest);
    socket.on('reprint_permission_request', handleReprintPermissionRequest);

    return () => {
      socket.off('status_changed', handleStatusChanged);
      socket.off('download_permission_request', handleDownloadPermissionRequest);
      socket.off('reprint_permission_request', handleReprintPermissionRequest);
    };
  }, [jobCode]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotifGranted(true);
        try {
          new Notification('🔔 Notifications Enabled!', {
            body: `You'll be alerted immediately when Order #${jobCode} finishes printing.`
          });
        } catch (_) {}
      }
    }
  };

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (_) {}
  };

  const copyCode = () => {
    if (!job?.job_code) return;
    navigator.clipboard.writeText(job.job_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepState = (targetStatus) => {
    if (!job) return 'pending';
    const statusOrder = ['pending', 'printing', 'done'];
    const currentIndex = statusOrder.indexOf(job.status);
    const targetIndex = statusOrder.indexOf(targetStatus);

    if (currentIndex > targetIndex) return 'completed';
    if (currentIndex === targetIndex) return 'active';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-600">Retrieving live order status...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center max-w-sm w-full space-y-3">
          <p className="text-sm font-bold text-slate-800">Order Not Found</p>
          <p className="text-xs text-slate-500">{error || 'Please verify your 4-digit code.'}</p>
          <button
            onClick={onBack}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const shopBkashNumber = job.shop_bkash || job.shop_phone;
  const isPaid = job.payment_status === 'paid' || job.payment_status === 'paid_cash' || job.payment_status === 'paid_bkash';
  const isMfsPending = job.payment_status === 'mfs_pending';
  const isUnpaid = !isPaid;
  const isPrinted = job.status === 'done';

  return (
    <div className="min-h-screen bg-slate-50/80 py-3 sm:py-6 px-2.5 sm:px-4 lg:px-8">
      <div className="max-w-lg w-full mx-auto space-y-3 sm:space-y-4">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-0.5">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>New Order</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] sm:text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Real-Time Tracker</span>
          </span>
        </div>

        {/* Push Notification Banner Trigger (Feature 6) */}
        {!notifGranted && typeof window !== 'undefined' && 'Notification' in window && job.status !== 'done' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
              <p className="text-[11px] text-indigo-900 font-medium truncate">
                Get sound & push alerts when print is ready
              </p>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] shrink-0 transition"
            >
              Enable Alert
            </button>
          </div>
        )}

        {/* Order Ticket Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs border border-slate-200/90 text-center space-y-3 sm:space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Pickup Token</span>
            <div className="flex items-center justify-center gap-2 mt-0.5 sm:mt-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-600 tracking-tight font-mono">#{job.job_code}</h1>
              <button
                onClick={copyCode}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                title="Copy Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {job.auth_code && (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Auth:</span>
                <span
                  onClick={() => {
                    navigator.clipboard.writeText(job.auth_code);
                    setCopiedAuth(true);
                    setTimeout(() => setCopiedAuth(false), 2000);
                  }}
                  className="font-mono text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer transition select-all"
                  title="Click to copy Auth Code"
                >
                  {job.auth_code}
                </span>
                {copiedAuth && <span className="text-[10px] font-bold text-emerald-600">Copied!</span>}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Show this token at the print counter</p>
          </div>

          <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-xs">
                {job.customer_name?.includes('Anonymous') ? (job.customer_name.split(' ').pop() || '👤') : '👤'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Customer</p>
                  {job.service_type === 'edit' ? (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase">
                      ✏️ Edit & Print
                    </span>
                  ) : job.service_type === 'photo' ? (
                    <span className="bg-pink-100 text-pink-900 border border-pink-300 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase">
                      🖼️ Photo Print
                    </span>
                  ) : job.service_type === 'bind' ? (
                    <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase">
                      📖 Binding
                    </span>
                  ) : null}
                </div>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[220px]">{job.customer_name || 'Guest'}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Due</p>
              <div className="flex items-center justify-end gap-1.5">
                {job.service_type === 'edit' && parseFloat(job.total_price || 0) === 0 ? (
                  <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    Custom Quote
                  </span>
                ) : (
                  <p className="text-sm sm:text-base font-extrabold text-slate-900">৳{parseFloat(job.total_price || 0).toFixed(2)}</p>
                )}
                {parseFloat(job.discount_applied || 0) > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                    -৳{parseFloat(job.discount_applied).toFixed(2)} off
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* High-Efficiency Alert Banner when Printed & Unpaid */}
          {isPrinted && isUnpaid && (
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 text-left shadow-md flex items-center justify-between gap-2.5 animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center text-base sm:text-lg shrink-0 font-bold">
                  {job.payment_method === 'cash' || !job.payment_method ? '💵' : '🖨️'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-black text-[11px] sm:text-xs uppercase tracking-wide">
                      {job.payment_method === 'cash' || !job.payment_method
                        ? 'Printed! Ready for Pickup — Pay Cash at Counter'
                        : 'Ready for Pickup! Make Payment'}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-white text-orange-700 px-1.5 py-0.2 rounded-full">
                      {isMfsPending ? 'Verification Pending' : (job.payment_method === 'cash' || !job.payment_method ? 'Cash Due' : 'Payment Due')}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-white/95 mt-0.5 leading-snug">
                    {isMfsPending
                      ? `Printouts are ready! The shopkeeper is verifying your last 4 digits (****${job.payment_trx_id || ''}) to release your documents.`
                      : (job.payment_method === 'cash' || !job.payment_method
                          ? `Your printouts are ready at the counter! Please hand ৳${parseFloat(job.total_price || 0).toFixed(2)} cash to the counter person to collect.`
                          : `Printouts are ready at the counter! Please pay ৳${parseFloat(job.total_price || 0).toFixed(2)} to collect your documents.`)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Success Banner */}
          {paymentSuccessTrx && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 flex items-center gap-2.5 text-left animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-extrabold text-xs">Payment Received Successfully!</p>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  Trx ID: <span className="font-mono font-bold">{paymentSuccessTrx}</span> · Order marked as Paid
                </p>
              </div>
            </div>
          )}

          {/* Payment Status Info & bKash Option (Feature 4) */}
          <div className="p-3.5 rounded-2xl border text-xs text-left space-y-2 bg-slate-50/70 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Payment Status</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                job.payment_status === 'paid' || job.payment_status === 'paid_cash' || job.payment_status === 'paid_bkash'
                  ? 'bg-emerald-100 text-emerald-800'
                  : job.payment_status === 'mfs_pending'
                    ? 'bg-pink-100 text-pink-800 border border-pink-300 animate-pulse'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {job.payment_status === 'paid' || job.payment_status === 'paid_cash' ? '✓ Paid (Cash)' :
                 job.payment_status === 'paid_bkash' ? '✓ Paid (Online / MFS)' :
                 job.payment_status === 'mfs_pending' ? '⏳ MFS Pending Verification' :
                 (job.payment_method === 'cash' || !job.payment_method) ? '💵 Cash Due at Counter' :
                 '● Unpaid'}
              </span>
            </div>

            {/* MFS Pending — Printed but payment not confirmed */}
            {job.payment_status === 'mfs_pending' && (
              <div className={`rounded-2xl p-3.5 text-xs space-y-2 border ${
                job.status === 'done'
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'
                  : 'bg-pink-50 border-pink-200'
              }`}>
                {job.status === 'done' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
                      <p className="font-extrabold text-emerald-800 text-sm">Printed ✓</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-200 text-amber-900 border border-amber-400 animate-pulse">
                        PAYMENT PENDING
                      </span>
                    </div>
                    <p className="text-amber-900 leading-relaxed">
                      Your documents are <strong>printed and ready</strong> but held at the counter until bKash/Nagad payment is verified.
                      Your last 4 digits <strong className="font-mono">****{job.payment_trx_id || ''}</strong> are with the shopkeeper — 
                      they'll confirm from their {job.payment_method === 'bkash' ? 'bKash' : 'Nagad'} app.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-extrabold text-pink-900 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-pink-600" />
                      bKash/Nagad Payment Sent — Awaiting Shop Verification
                    </p>
                    <p className="text-pink-700 leading-relaxed">
                      Your payment with last 4 digits <strong className="font-mono">****{job.payment_trx_id || ''}</strong> has been submitted. 
                      The shopkeeper will verify by matching these digits in their {job.payment_method === 'bkash' ? 'bKash' : 'Nagad'} app.
                    </p>
                  </>
                )}

                {/* Instant Gateway alternative */}
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Want instant confirmation?</span>
                  <button
                    type="button"
                    onClick={() => handleInitiateOnlinePay('bkash')}
                    disabled={payingMethod !== null}
                    className="text-[11px] font-bold text-pink-700 hover:text-pink-900 flex items-center gap-1 cursor-pointer underline"
                  >
                    {payingMethod === 'bkash' ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>⚡ Pay with bKash Gateway →</span>}
                  </button>
                </div>
              </div>
            )}

            {/* Automated Online Payment Buttons & Manual 4-digits if unpaid */}
            {job.payment_status !== 'paid' && job.payment_status !== 'paid_cash' && job.payment_status !== 'paid_bkash' && job.payment_status !== 'mfs_pending' && (() => {
              const isCashPayment = (job.payment_method === 'cash' || !job.payment_method);
              return (
                <div className="pt-2 border-t border-slate-200/80 space-y-2.5">
                  {/* Cash at Counter info notice */}
                  {isCashPayment && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 flex items-start gap-2.5">
                      <span className="text-base leading-none mt-0.5">💵</span>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-emerald-950">Cash Payment Selected</p>
                        <p className="text-[11px] text-emerald-800">
                          Please hand <strong>৳{job.total_price || 0}</strong> cash to the shopkeeper when picking up your printouts.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* For cash customers: show a small subtle toggle button if at least one online method is enabled */}
                  {isCashPayment && (job.allow_bkash_payment !== 0 || job.allow_nagad_payment !== 0) && (
                    <div className="text-center pt-0.5 pb-0.5">
                      <button
                        type="button"
                        onClick={() => setShowOnlinePayOptions(!showOnlinePayOptions)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-pink-700 hover:text-pink-900 hover:underline cursor-pointer transition"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-pink-600" />
                        <span>
                          Want to pay online with {job.allow_bkash_payment !== 0 && job.allow_nagad_payment !== 0 ? 'bKash / Nagad' : job.allow_bkash_payment !== 0 ? 'bKash' : 'Nagad'} instead?
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold ml-0.5">{showOnlinePayOptions ? '▲ Hide' : '▼ Pay Online'}</span>
                      </button>
                    </div>
                  )}

                  {/* Render Online Payment Options if customer selected online or toggled show */}
                  {((!isCashPayment || showOnlinePayOptions) && (job.allow_bkash_payment !== 0 || job.allow_nagad_payment !== 0)) && (
                    <div className="space-y-2.5 pt-1">
                      {/* Shop Standee QR if uploaded */}
                      {((job.allow_bkash_payment !== 0 && job.shop_bkash_qr) || (job.allow_nagad_payment !== 0 && job.shop_nagad_qr)) && (
                        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                          <img
                            src={job.shop_bkash_qr || job.shop_nagad_qr}
                            alt="Shop Standee QR"
                            className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white shrink-0"
                          />
                          <div className="text-[10px] text-slate-600 space-y-0.5">
                            <p className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                              <QrCode className="w-3.5 h-3.5 text-blue-600" />
                              Scan {job.shop_name || 'Shop'} Counter QR
                            </p>
                            <p className="text-slate-500">Scan using bKash / Nagad App to pay directly to this shop's merchant account.</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Choose How to Pay:
                        </span>
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Instant Online & App Payment
                        </span>
                      </div>

                      {/* Official Payment Buttons */}
                      <div className={`grid ${job.allow_bkash_payment !== 0 && job.allow_nagad_payment !== 0 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2`}>
                        {/* bKash Official Button */}
                        {job.allow_bkash_payment !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleInitiateOnlinePay('bkash')}
                            disabled={payingMethod !== null}
                            className="py-2.5 px-3.5 bg-[#E2136E] hover:bg-[#c40f5e] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow transition cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            {payingMethod === 'bkash' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center p-0.5 shrink-0 shadow-xs">
                                  <img src="/bkash-logo.png" alt="bKash" className="w-full h-full object-contain" />
                                </span>
                                <span>Pay with bKash</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Nagad Official Button */}
                        {job.allow_nagad_payment !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleInitiateOnlinePay('nagad')}
                            disabled={payingMethod !== null}
                            className="py-2.5 px-3.5 bg-gradient-to-r from-[#F6921E] to-[#F1592A] hover:from-[#e58316] hover:to-[#db4b1e] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow transition cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            {payingMethod === 'nagad' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center p-0.5 shrink-0 shadow-xs">
                                  <img src="/nagad-logo.png" alt="Nagad" className="w-full h-full object-contain" />
                                </span>
                                <span>Pay with Nagad</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Option 2: Sent money via App? Submit last 4 digits */}
                      <div className="pt-2 border-t border-slate-200/80">
                        {!showManualInput ? (
                          <button
                            type="button"
                            onClick={() => setShowManualInput(true)}
                            className="w-full text-center text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 p-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>📱 Sent money via bKash App? Enter last 4 digits</span>
                          </button>
                        ) : (
                          <div className="bg-pink-50/60 border border-pink-200 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-800">
                                Enter last 4 digits of your bKash number:
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowManualInput(false)}
                                className="text-[10px] text-slate-400 hover:text-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="● ● ● ●"
                                value={manualDigits}
                                onChange={e => setManualDigits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="w-28 bg-white border-2 border-pink-300 rounded-xl px-2 py-1.5 text-center font-mono font-extrabold text-base tracking-widest focus:ring-1 focus:ring-pink-400 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleManualMfsSubmit('bkash')}
                                disabled={submittingManual || manualDigits.length !== 4}
                                className="flex-1 py-1.5 px-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                {submittingManual ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Submit for Verification</span>}
                              </button>
                            </div>
                            <p className="text-[9px] text-slate-500">
                              Shopkeeper will verify your transaction using these digits at the counter.
                            </p>
                          </div>
                        )}
                      </div>

                      {paymentError && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1">{paymentError}</p>
                      )}

                      {shopBkashNumber && (
                        <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                          <span>
                            {job.shop_bkash_type === 'merchant' ? 'Merchant No:' : 'Shop MFS:'} <strong className="font-mono text-slate-800">{shopBkashNumber}</strong>
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(shopBkashNumber);
                              setCopiedBkash(true);
                              setTimeout(() => setCopiedBkash(false), 2000);
                            }}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            {copiedBkash ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Uploaded Documents List */}
          {job.files && job.files.length > 0 && (
            <div className="bg-slate-50/90 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {job.service_type === 'edit'
                      ? `Your Files for Editing (${job.files.length} ${job.files.length === 1 ? 'file' : 'files'})`
                      : job.service_type === 'photo'
                      ? `Your Photos for Print (${job.files.length} ${job.files.length === 1 ? 'item' : 'items'})`
                      : `Your Documents (${job.files.length} ${job.files.length === 1 ? 'file' : 'files'})`}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  {job.files_deleted ? (
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Storage Wiped
                    </span>
                  ) : job.service_type === 'edit' ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ✏️ Edit & Modification
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">
                      {job.total_pages || job.files.reduce((acc, f) => acc + (f.page_count || 1) * (f.copies || 1), 0)} Total Pages
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                {job.files.map((file, fIdx) => (
                  <div
                    key={file.id || fIdx}
                    className="bg-white border border-slate-200 rounded-xl p-2 sm:p-2.5 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                        #{fIdx + 1}
                      </span>
                      {getFileIcon(file.original_name)}
                      <p className="font-bold text-xs text-slate-800 truncate flex-1 min-w-0" title={file.original_name}>
                        {file.original_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap text-[10px]">
                      {job.service_type === 'edit' ? (
                        <>
                          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300 font-bold">
                            ✏️ Sent for Editing
                          </span>
                          {job.service_detail && (
                            <span className="bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-amber-900 font-semibold" title={job.service_detail}>
                              📝 {job.service_detail}
                            </span>
                          )}
                          <span className="bg-slate-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 font-semibold">
                            📄 {file.page_count || 1} {file.page_count === 1 ? 'Page' : 'Pages'}
                          </span>
                          <span className="bg-blue-50/80 px-1.5 sm:px-2 py-0.5 rounded-md border border-blue-200 text-blue-700 font-bold">
                            🖨️ {file.copies || 1}x {file.copies === 1 ? 'Copy' : 'Copies'}
                          </span>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded-md border font-bold ${
                            file.color_mode === 'color' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {file.color_mode === 'color' ? '🎨 Color' : '⬛ B&W'}
                          </span>
                          <span className="bg-slate-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-semibold">
                            📐 {file.paper_size || 'A4'}
                          </span>
                          <span className="bg-slate-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-semibold">
                            {file.sides === 'double' ? '🔄 2-Sided' : '1-Sided'}
                          </span>
                          <span className="bg-amber-50/60 px-2 py-0.5 rounded-md border border-amber-200 text-amber-800 text-[9px] font-bold">
                            ⏳ Manual Shop Editing
                          </span>
                        </>
                      ) : job.service_type === 'photo' ? (
                        <>
                          <span className="bg-pink-100 text-pink-900 px-2 py-0.5 rounded-md border border-pink-300 font-bold">
                            🖼️ {job.service_detail === 'passport_8' ? '8x Passport' : job.service_detail === 'stamp_4' ? '4x Stamp' : job.service_detail === 'photo_4r' ? '4R Photo (4×6)' : job.service_detail === 'photo_a4' ? 'A4 Glossy' : '4x Passport'}
                          </span>
                          <span className="bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200 text-blue-700 font-bold">
                            📷 {file.copies || 1}x Set
                          </span>
                          <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 font-semibold">
                            ✨ Glossy Photo Paper
                          </span>
                        </>
                      ) : (
                        <>
                          {job.service_type === 'bind' && (
                            <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md border border-purple-300 font-bold">
                              📖 {job.service_detail === 'tape' ? 'Tape Binding' : job.service_detail === 'hardcover' ? 'Hardcover Thesis' : 'Spiral Binding'}
                            </span>
                          )}
                          <span className="bg-slate-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 font-semibold">
                            📄 {file.page_count || 1} {file.page_count === 1 ? 'Page' : 'Pages'}
                          </span>
                          <span className="bg-blue-50/80 px-1.5 sm:px-2 py-0.5 rounded-md border border-blue-200 text-blue-700 font-bold">
                            🖨️ {file.copies || 1}x {file.copies === 1 ? 'Copy' : 'Copies'}
                          </span>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded-md border font-bold ${
                            file.color_mode === 'color' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {file.color_mode === 'color' ? '🎨 Color' : '⬛ B&W'}
                          </span>
                          <span className="bg-slate-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-semibold">
                            📐 {file.paper_size || 'A4'}
                          </span>
                          <span className="bg-slate-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-semibold">
                            {file.sides === 'double' ? '🔄 2-Sided' : '1-Sided'}
                          </span>
                        </>
                      )}

                      {job.files_deleted ? (
                        <span className="bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-300 text-slate-500 font-bold text-[9px]">
                          🔒 Purged
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy & File Auto-Deletion Countdown Card with Customer Manual Purge */}
          {(() => {
            const cd = getDeleteCountdown();
            if (!cd) return null;
            return (
              <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border text-left transition shadow-2xs space-y-2.5 ${
                cd.status === 'deleted'
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : cd.isUrgent
                    ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              }`}>
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 sm:p-2 rounded-xl shrink-0 mt-0.5 ${
                    cd.status === 'deleted' ? 'bg-slate-200 text-slate-700' :
                    cd.isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {cd.status === 'deleted' ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs flex items-center gap-1.5">
                        <span>{cd.status === 'deleted' ? 'Files Purged (Privacy Protected)' : 'Privacy & Auto-Deletion'}</span>
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 shadow-2xs ${
                        cd.status === 'deleted'
                          ? 'bg-slate-200 text-slate-700'
                          : cd.isUrgent
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-emerald-700 text-white'
                      }`}>
                        {cd.status === 'deleted' ? '🔒 Purged' : `⏳ ${cd.timeString || cd.label}`}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 leading-relaxed">{cd.desc}</p>
                  </div>
                </div>

                {/* Customer Manual Purge Action (Available after printing is done and files not yet purged) */}
                {job.status === 'done' && !job.files_deleted && (
                  <div className="pt-2.5 border-t border-rose-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium">
                      <span>Don't want to wait for timer? Wipe files now:</span>
                    </div>

                    {confirmDelete ? (
                      <div className="flex items-center gap-1.5 self-end sm:self-auto animate-in fade-in">
                        <span className="text-[10px] font-bold text-rose-700">Permanent delete?</span>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          disabled={isDeletingFiles}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteFilesNow}
                          disabled={isDeletingFiles}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isDeletingFiles ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Purging...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3" />
                              <span>Yes, Delete Now</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        disabled={isDeletingFiles}
                        className="w-full sm:w-auto px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 hover:border-rose-300 active:scale-95 font-bold rounded-xl text-[10px] sm:text-[11px] flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                        title="Permanently wipe uploaded document files from the server immediately"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete My Files Now</span>
                      </button>
                    )}
                  </div>
                )}

                {fileDeleteSuccess && (
                  <div className="bg-emerald-100/90 border border-emerald-300 rounded-xl p-2 text-[10px] sm:text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Your documents were permanently wiped from server disk!</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Stepper Progress */}
          <div className="py-2 space-y-3">
            {[
              {
                id: 'pending',
                label: job.service_type === 'photo' ? 'Photo Order Received' : job.service_type === 'edit' ? 'Edit Request Received' : job.service_type === 'bind' ? 'Print & Binding Queued' : 'Order Received',
                desc: job.service_type === 'photo' ? 'Queued at photo studio counter' : job.service_type === 'edit' ? 'Queued for shop editing' : 'Queued at print counter',
                icon: Clock
              },
              {
                id: 'printing',
                label: job.service_type === 'photo' ? 'Photo Processing & Printing' : job.service_type === 'edit' ? 'Editing & Printing in Progress' : job.service_type === 'bind' ? 'Printing & Binding in Progress' : 'Printing in Progress',
                desc: job.service_type === 'photo' ? 'Shop is editing and printing your photos' : job.service_type === 'edit' ? 'Shopkeeper is editing your document' : 'Being printed right now',
                icon: job.service_type === 'photo' ? ImageIcon : Printer
              },
              {
                id: 'done',
                label: isPrinted && isUnpaid
                  ? (isMfsPending 
                      ? 'Ready for Pickup · Verification Pending' 
                      : (job.payment_method === 'cash' || !job.payment_method ? '✨ Ready for Pickup! Pay Cash at Counter' : '✨ Ready for Pickup! Make Payment'))
                  : isPrinted
                    ? '✨ Ready for Pickup! (Paid ✓)'
                    : 'Ready for Pickup!',
                desc: isPrinted && isUnpaid
                  ? (isMfsPending
                      ? `Complete! Shop is verifying your last 4 digits (****${job.payment_trx_id || ''}) to release your order.`
                      : (job.payment_method === 'cash' || !job.payment_method
                          ? `Your ${job.service_type === 'photo' ? 'photos are' : job.service_type === 'edit' ? 'edited document is' : 'order is'} ready! Hand ৳${parseFloat(job.total_price || 0).toFixed(2)} cash at the counter to collect.`
                          : `Your ${job.service_type === 'photo' ? 'photos are' : job.service_type === 'edit' ? 'edited document is' : 'order is'} ready! Please make payment (৳${parseFloat(job.total_price || 0).toFixed(2)}) to collect.`))
                  : `Collect your ${job.service_type === 'photo' ? 'photo prints' : job.service_type === 'edit' ? 'edited documents' : 'printout'} at the counter`,
                icon: isPrinted && isUnpaid ? AlertTriangle : CheckCircle2,
                isAttention: isPrinted && isUnpaid
              }
            ].map((step, sIdx) => {
              const state = getStepState(step.id);
              const StepIcon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 text-left transition-all ${
                    step.isAttention && state === 'active'
                      ? 'p-2.5 bg-amber-50/90 border border-amber-300 rounded-2xl shadow-2xs'
                      : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition ${
                    step.isAttention && state === 'active'
                      ? 'bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse'
                      : state === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : state === 'active'
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                          : 'bg-slate-100 text-slate-400'
                  }`}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-bold ${
                        step.isAttention && state === 'active'
                          ? 'text-amber-900 font-extrabold'
                          : state === 'active'
                            ? 'text-blue-600'
                            : state === 'completed'
                              ? 'text-emerald-700'
                              : 'text-slate-400'
                      }`}>
                        {step.label}
                      </p>
                      {step.isAttention && state === 'active' && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-400">
                          {isMfsPending ? 'Pending' : 'Make Payment'}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] ${
                      step.isAttention && state === 'active'
                        ? 'text-amber-800 font-medium'
                        : 'text-slate-400'
                    }`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shop Information Footer with WhatsApp Direct (Feature 1) */}
          {job.shop_name && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-left text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{job.shop_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{job.shop_address || 'Dhaka'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {job.shop_phone && (
                  <a
                    href={`https://wa.me/${job.shop_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${job.shop_name}, I'm inquiring about my print order #${job.job_code}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-[11px] flex items-center gap-1 border border-emerald-200"
                    title="Message Shop on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {job.shop_phone && (
                  <a
                    href={`tel:${job.shop_phone}`}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Brand Collaboration Sponsor Card */}
        {brandSponsor && (
          <BrandSponsorCard sponsor={brandSponsor} />
        )}

        {/* Promo / Partner Ad Space */}
        {promoAd && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase shrink-0 border border-indigo-200">
                {promoAd.badge}
              </span>
              <p className="font-medium text-slate-700 truncate">{promoAd.text}</p>
            </div>
            {promoAd.link && (
              <a
                href={promoAd.link}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 font-bold text-xs hover:underline shrink-0"
              >
                Learn More →
              </a>
            )}
          </div>
        )}

        {/* Google AdSense Space */}
        {adsenseConfig?.enabled && (
          <GoogleAdSense
            client={adsenseConfig.clientId}
            slot={adsenseConfig.slotTrack}
            format="auto"
            className="pt-2"
          />
        )}

        {/* Download Permission Modal (Shop -> Customer) */}
        {dlRequest && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-100/50">
                <Download className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-slate-800">Download Permission</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">{dlRequest.shop_name || 'The shopkeeper'}</span> is requesting permission to download:
                </p>
                {/* Specific Document Name Badge */}
                <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 truncate text-left flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">{dlRequest.file_name || 'Uploaded Document(s)'}</span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800 font-medium flex items-start gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>This document will be downloaded to the shop computer.</span>
              </div>
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    socket.emit('download_permission_response', {
                      job_id: dlRequest.job_id,
                      job_code: dlRequest.job_code,
                      shop_id: dlRequest.shop_id,
                      file_id: dlRequest.file_id,
                      file_name: dlRequest.file_name,
                      granted: false
                    });
                    setDlRequest(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition border border-slate-200 cursor-pointer"
                >
                  Deny
                </button>
                <button
                  onClick={() => {
                    socket.emit('download_permission_response', {
                      job_id: dlRequest.job_id,
                      job_code: dlRequest.job_code,
                      shop_id: dlRequest.shop_id,
                      file_id: dlRequest.file_id,
                      file_name: dlRequest.file_name,
                      granted: true
                    });
                    setDlRequest(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Allow Download
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Expires in 60 seconds.</p>
            </div>
          </div>
        )}

        {/* Reprint Permission Modal (Shop -> Customer) */}
        {reprintRequest && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border-2 border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-100/50">
                <Printer className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-slate-800">Reprint Permission</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">{reprintRequest.shop_name || 'The shopkeeper'}</span> is requesting permission to reprint:
                </p>
                {/* Specific Document Name Badge */}
                <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 truncate text-left flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">{reprintRequest.file_name || 'Uploaded Document'}</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-[11px] text-blue-800 font-medium flex items-start gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <span>An extra copy of this document will be printed at the counter.</span>
              </div>
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    socket.emit('reprint_permission_response', {
                      job_id: reprintRequest.job_id,
                      job_code: reprintRequest.job_code,
                      shop_id: reprintRequest.shop_id,
                      file_id: reprintRequest.file_id,
                      file_name: reprintRequest.file_name,
                      granted: false
                    });
                    setReprintRequest(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition border border-slate-200 cursor-pointer"
                >
                  Deny
                </button>
                <button
                  onClick={() => {
                    socket.emit('reprint_permission_response', {
                      job_id: reprintRequest.job_id,
                      job_code: reprintRequest.job_code,
                      shop_id: reprintRequest.shop_id,
                      file_id: reprintRequest.file_id,
                      file_name: reprintRequest.file_name,
                      granted: true
                    });
                    setReprintRequest(null);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Allow Reprint
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Expires in 60 seconds.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
