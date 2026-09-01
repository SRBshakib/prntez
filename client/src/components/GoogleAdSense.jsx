import React, { useEffect, useRef } from 'react';

/**
 * Production-Grade Google AdSense Banner Component
 * Handles auto-injection of Google AdSense script, safe push lifecycle, and responsive preview
 */
export default function GoogleAdSense({
  slot = '',
  client = '',
  format = 'auto',
  className = '',
  responsive = true,
  layoutKey = '',
}) {
  const adRef = useRef(null);
  const isPushed = useRef(false);

  useEffect(() => {
    if (!client || !slot) return;

    // 1. Ensure Google AdSense script is injected once
    const scriptId = 'google-adsense-script';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // 2. Safe push to adsbygoogle
    if (!isPushed.current && typeof window !== 'undefined') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isPushed.current = true;
      } catch (e) {
        console.warn('AdSense push error:', e);
      }
    }
  }, [client, slot]);

  // If no AdSense publisher ID is configured yet, render a clean styled placeholder
  if (!client || !slot) {
    return (
      <div className={`w-full overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-100/70 p-4 text-center ${className}`}>
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
          <span>Google AdSense Space</span>
        </div>
        <div className="h-16 sm:h-20 flex flex-col items-center justify-center rounded-xl bg-white/70 border border-slate-200/60 p-2 shadow-2xs">
          <p className="text-xs font-bold text-slate-700">Responsive Display Ad Space</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Add Client ID & Slot ID in <span className="font-semibold text-indigo-600">Admin Central → Ad Manager</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden my-3 text-center ${className}`}>
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        Advertisement
      </div>
      <div ref={adRef} className="overflow-hidden flex justify-center">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
          {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        />
      </div>
    </div>
  );
}
