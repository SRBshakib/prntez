import React, { useState } from 'react';
import { Sparkles, ExternalLink, Copy, Check, Tag } from 'lucide-react';

export default function BrandSponsorCard({ sponsor, className = '' }) {
  const [copied, setCopied] = useState(false);

  if (!sponsor || !sponsor.enabled) return null;

  const handleCtaClick = () => {
    // Track click for sponsor performance metrics
    fetch('/api/announcements/click', { method: 'POST' }).catch(() => {});
  };

  const handleCopyCoupon = (e) => {
    e.stopPropagation();
    if (!sponsor.couponCode) return;
    navigator.clipboard.writeText(sponsor.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-900 text-white rounded-3xl p-5 border border-indigo-500/30 shadow-lg relative overflow-hidden group ${className}`}>
      
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-300" />

      <div className="relative z-10 space-y-3">
        
        {/* Top Header: Badge & Brand Name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-extrabold text-[10px] rounded-full uppercase tracking-wider shadow-xs">
              {sponsor.badge || '⭐ SPONSOR'}
            </span>
            <span className="text-xs font-extrabold text-slate-200">
              {sponsor.brandName || 'Brand Partner'}
            </span>
          </div>

          <span className="text-[10px] text-slate-400 font-medium">Partner Offer</span>
        </div>

        {/* Middle: Headline & Description with optional Image */}
        <div className="flex items-start gap-3">
          {sponsor.imageUrl && (
            <img
              src={sponsor.imageUrl}
              alt={sponsor.brandName}
              className="w-12 h-12 rounded-2xl object-cover border border-white/10 shrink-0 bg-white/5"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-extrabold text-white leading-snug">
              {sponsor.headline}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {sponsor.description}
            </p>
          </div>
        </div>

        {/* Bottom Actions: Coupon Code + CTA Link */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          
          {/* Coupon Code Pill */}
          {sponsor.couponCode ? (
            <button
              onClick={handleCopyCoupon}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl font-mono font-extrabold text-[11px] text-amber-300 flex items-center gap-1.5 transition active:scale-95"
              title="Click to copy promo code"
            >
              <Tag className="w-3 h-3 text-amber-400" />
              <span>{sponsor.couponCode}</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          ) : <div />}

          {/* Outbound Link */}
          {sponsor.targetUrl && (
            <a
              href={sponsor.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCtaClick}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs transition shadow-md shadow-indigo-600/30 inline-flex items-center gap-1.5 active:scale-95"
            >
              <span>{sponsor.ctaText || 'Claim Offer'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

      </div>
    </div>
  );
}
