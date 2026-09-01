import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Printer, Store, Phone, MapPin, Sparkles, Loader2, ArrowLeft, Copy, Check, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import { socket, playChime } from '../socket';
import GoogleAdSense from '../components/GoogleAdSense';

export default function TrackJob({ jobCode, onBack }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPickupQr, setShowPickupQr] = useState(false);
  const [promoAd, setPromoAd] = useState(null);
  const [adsenseConfig, setAdsenseConfig] = useState(null);

  useEffect(() => {
    // Fetch announcement & adsense
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.customerAd?.enabled) setPromoAd(data.customerAd);
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
        if (update.status === 'done' && prev.status !== 'done') {
          fireConfetti();
          playChime();
        }
        return { ...prev, status: update.status };
      });
    };

    socket.on('status_changed', handleStatusChanged);

    return () => {
      socket.off('status_changed', handleStatusChanged);
    };
  }, [jobCode]);

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

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-5">
        
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
            <p className="text-[11px] text-slate-400 mt-1">Show this token at the print counter</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-left">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Customer</p>
              <p className="text-xs font-bold text-slate-800">{job.customer_name || 'Guest'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Due</p>
              <p className="text-sm font-extrabold text-slate-900">৳{parseFloat(job.total_price || 0).toFixed(2)}</p>
            </div>
          </div>

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

          {/* Shop Information Footer */}
          {job.shop_name && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-left text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{job.shop_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{job.shop_address || 'Dhaka'}</p>
                </div>
              </div>
              {job.shop_phone && (
                <a
                  href={`tel:${job.shop_phone}`}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 shrink-0"
                >
                  <Phone className="w-3 h-3" /> Call
                </a>
              )}
            </div>
          )}

        </div>

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

      </div>
    </div>
  );
}
