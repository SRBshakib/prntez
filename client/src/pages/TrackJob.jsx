import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, Printer, Store, Phone, MapPin, Sparkles, Loader2,
  ArrowLeft, Copy, Check, QrCode, Bell, BellRing, MessageCircle, CreditCard, Percent,
  Download, AlertTriangle, FileText, ShieldCheck, Lock, Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { socket, playChime } from '../socket';
import GoogleAdSense from '../components/GoogleAdSense';
import BrandSponsorCard from '../components/BrandSponsorCard';

export default function TrackJob({ jobCode, onBack }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedAuth, setCopiedAuth] = useState(false);
  const [copiedBkash, setCopiedBkash] = useState(false);
  const [notifGranted, setNotifGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [promoAd, setPromoAd] = useState(null);
  const [brandSponsor, setBrandSponsor] = useState(null);
  const [adsenseConfig, setAdsenseConfig] = useState(null);
  const [dlRequest, setDlRequest] = useState(null);
  const [reprintRequest, setReprintRequest] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Live ticking clock for auto-delete countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getDeleteCountdown = () => {
    if (!job) return null;
    if (job.files_deleted) {
      return { status: 'deleted', label: 'Purged', desc: 'Uploaded documents have been securely purged from the server for privacy.' };
    }
    const settings = job.cleanup_settings || { enabled: true, success_minutes: 30, unsuccess_minutes: 1440 };
    if (settings.enabled === false) {
      return { status: 'disabled', label: 'Manual Cleanup', desc: 'Managed according to shop retention policy.' };
    }

    let deadlineMs = null;
    if (job.status === 'done' && (job.completed_at || job.updated_at)) {
      const completedTime = new Date(job.completed_at || job.updated_at).getTime();
      deadlineMs = completedTime + ((settings.success_minutes || 30) * 60 * 1000);
    } else if (job.created_at) {
      const createdTime = new Date(job.created_at).getTime();
      deadlineMs = createdTime + ((settings.unsuccess_minutes || 1440) * 60 * 1000);
    }

    if (!deadlineMs || isNaN(deadlineMs)) return null;

    const diffMs = deadlineMs - now;
    if (diffMs <= 0) {
      return { status: 'expired', label: 'Auto-Purging...', desc: 'Files are being purged from server storage.' };
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
        ? `Files automatically purge ${settings.success_minutes || 30}m after printing to protect your data privacy.`
        : `Unprinted files auto-expire in ${settings.unsuccess_minutes >= 60 ? `${Math.round(settings.unsuccess_minutes / 60)}h` : `${settings.unsuccess_minutes}m`}`
    };
  };

  useEffect(() => {
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

        if (nextStatus === 'done' && prev.status !== 'done') {
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

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>New Order</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
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
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 text-center space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Pickup Token</span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight font-mono">#{job.job_code}</h1>
              <button
                onClick={copyCode}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
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

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shadow-xs">
                {job.customer_name?.includes('Anonymous') ? (job.customer_name.split(' ').pop() || '👤') : '👤'}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Customer</p>
                <p className="text-xs font-bold text-slate-800">{job.customer_name || 'Guest'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Due</p>
              <div className="flex items-center justify-end gap-1.5">
                <p className="text-base font-extrabold text-slate-900">৳{parseFloat(job.total_price || 0).toFixed(2)}</p>
                {parseFloat(job.discount_applied || 0) > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                    -৳{parseFloat(job.discount_applied).toFixed(2)} off
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Payment Status Info & bKash Option (Feature 4) */}
          <div className="p-3 rounded-2xl border text-xs text-left space-y-1.5 bg-slate-50/70 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Payment Status</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                job.payment_status === 'paid' || job.payment_status === 'paid_cash' || job.payment_status === 'paid_bkash'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {job.payment_status === 'paid' || job.payment_status === 'paid_cash' ? '✓ Paid (Cash)' :
                 job.payment_status === 'paid_bkash' ? '✓ Paid (bKash/Nagad)' :
                 '● Unpaid'}
              </span>
            </div>

            {/* If unpaid, show easy payment number */}
            {job.payment_status !== 'paid' && job.payment_status !== 'paid_cash' && job.payment_status !== 'paid_bkash' && shopBkashNumber && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500">Pay via bKash / Nagad:</p>
                  <p className="font-mono font-bold text-slate-800">{shopBkashNumber}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shopBkashNumber);
                    setCopiedBkash(true);
                    setTimeout(() => setCopiedBkash(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-[10px] text-slate-700 flex items-center gap-1 shadow-2xs"
                >
                  {copiedBkash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBkash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Uploaded Documents List */}
          {job.files && job.files.length > 0 && (
            <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Your Documents ({job.files.length} {job.files.length === 1 ? 'file' : 'files'})</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {job.total_pages || job.files.reduce((acc, f) => acc + (f.page_count || 1) * (f.copies || 1), 0)} Total Pages
                </span>
              </div>

              <div className="space-y-1.5">
                {job.files.map((file, fIdx) => (
                  <div
                    key={file.id || fIdx}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                        #{fIdx + 1}
                      </span>
                      <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <p className="font-bold text-xs text-slate-800 truncate flex-1 min-w-0" title={file.original_name}>
                        {file.original_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 font-semibold">
                        📄 {file.page_count || 1} {file.page_count === 1 ? 'Page' : 'Pages'}
                      </span>
                      <span className="bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200 text-blue-700 font-bold">
                        🖨️ {file.copies || 1}x {file.copies === 1 ? 'Copy' : 'Copies'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md border font-bold ${
                        file.color_mode === 'color' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {file.color_mode === 'color' ? '🎨 Color' : '⬛ B&W'}
                      </span>
                      <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-semibold">
                        📐 {file.paper_size || 'A4'}
                      </span>
                      <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-semibold">
                        {file.sides === 'double' ? '🔄 2-Sided' : '1-Sided'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy & File Auto-Deletion Countdown Card */}
          {(() => {
            const cd = getDeleteCountdown();
            if (!cd) return null;
            return (
              <div className={`rounded-2xl p-3 border text-left flex items-start gap-2.5 transition shadow-2xs ${
                cd.status === 'deleted'
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : cd.isUrgent
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}>
                <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                  cd.status === 'deleted' ? 'bg-slate-200 text-slate-600' :
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
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{cd.desc}</p>
                </div>
              </div>
            );
          })()}

          {/* Stepper Progress */}
          <div className="py-2 space-y-3">
            {[
              { id: 'pending', label: 'Order Received', desc: 'Queued at print counter', icon: Clock },
              { id: 'printing', label: 'Printing in Progress', desc: 'Being printed right now', icon: Printer },
              { id: 'done', label: 'Ready for Pickup!', desc: 'Collect your printout at the counter', icon: CheckCircle2 }
            ].map((step, sIdx) => {
              const state = getStepState(step.id);
              const StepIcon = step.icon;

              return (
                <div key={step.id} className="flex items-center gap-3 text-left">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition ${
                    state === 'completed' ? 'bg-emerald-600 text-white' :
                    state === 'active' ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold ${
                      state === 'active' ? 'text-blue-600' :
                      state === 'completed' ? 'text-emerald-700' :
                      'text-slate-400'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-slate-400">{step.desc}</p>
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
