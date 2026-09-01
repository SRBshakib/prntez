import React, { useState, useEffect, useRef } from 'react';
import {
  X, Download, Printer, QrCode, Sparkles, Check, Copy, Sliders, Palette, FileText, Layout, Image as ImageIcon
} from 'lucide-react';
import QRCodeLib from 'qrcode';

export default function ShopQrModal({ shop, onClose }) {
  const [theme, setTheme] = useState('modern'); // 'modern' | 'minimal' | 'dark' | 'gold'
  const [headline, setHeadline] = useState(shop?.name || 'Quick Print Counter');
  const [tagline, setTagline] = useState('Scan to Upload & Print Documents Instantly');
  const [showPrices, setShowPrices] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [customNotice, setCustomNotice] = useState(shop?.counter_notice || '');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  const canvasRef = useRef(null);
  const printAreaRef = useRef(null);

  const shopUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?shop=${shop?.qr_slug || ''}`
    : `http://localhost:3000/?shop=${shop?.qr_slug || ''}`;

  // Draw QR on Live Preview Canvas using imported QRCodeLib or window.QRCode
  useEffect(() => {
    if (!shop?.qr_slug || !canvasRef.current) return;

    const qrDark = theme === 'minimal' ? '#000000' : theme === 'dark' ? '#ffffff' : '#1e3a8a';
    const qrLight = theme === 'dark' ? '#0f172a' : '#ffffff';

    if (QRCodeLib?.toCanvas) {
      QRCodeLib.toCanvas(
        canvasRef.current,
        shopUrl,
        {
          width: 320,
          margin: 2,
          color: { dark: qrDark, light: qrLight }
        },
        (err) => {
          if (err) console.error('QR Render error:', err);
        }
      );
    } else if (window.QRCode?.toCanvas) {
      window.QRCode.toCanvas(
        canvasRef.current,
        shopUrl,
        {
          width: 320,
          margin: 2,
          color: { dark: qrDark, light: qrLight }
        },
        (err) => {
          if (err) console.error('QR window error:', err);
        }
      );
    }
  }, [shop?.qr_slug, theme, shopUrl]);

  // Helper function for rounded rectangles on HTML5 Canvas
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // 1. Download High-Resolution Standee Poster (PNG)
  const handleDownloadPoster = async () => {
    setGenerating(true);
    setDownloadSuccess('');

    try {
      const posterCanvas = document.createElement('canvas');
      posterCanvas.width = 1200;
      posterCanvas.height = 1600;
      const ctx = posterCanvas.getContext('2d');

      // Theme color palettes
      let bgGradient, cardBg, textPrimary, textSecondary, accentColor, qrDark, qrLight;

      if (theme === 'minimal') {
        bgGradient = '#ffffff';
        cardBg = '#ffffff';
        textPrimary = '#000000';
        textSecondary = '#555555';
        accentColor = '#000000';
        qrDark = '#000000';
        qrLight = '#ffffff';
      } else if (theme === 'dark') {
        bgGradient = '#090d16';
        cardBg = '#131b2e';
        textPrimary = '#ffffff';
        textSecondary = '#94a3b8';
        accentColor = '#6366f1';
        qrDark = '#ffffff';
        qrLight = '#131b2e';
      } else if (theme === 'gold') {
        bgGradient = '#fffbeb';
        cardBg = '#ffffff';
        textPrimary = '#78350f';
        textSecondary = '#92400e';
        accentColor = '#d97706';
        qrDark = '#78350f';
        qrLight = '#ffffff';
      } else {
        // Modern Blue
        bgGradient = '#f0f7ff';
        cardBg = '#ffffff';
        textPrimary = '#0f172a';
        textSecondary = '#64748b';
        accentColor = '#2563eb';
        qrDark = '#1e3a8a';
        qrLight = '#ffffff';
      }

      // Background fill
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1200, 1600);

      // Decorative Top Header Banner
      if (theme === 'modern') {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 280);
        gradient.addColorStop(0, '#2563eb');
        gradient.addColorStop(1, '#1d4ed8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 260);
      } else if (theme === 'dark') {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 280);
        gradient.addColorStop(0, '#4f46e5');
        gradient.addColorStop(1, '#312e81');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 260);
      } else if (theme === 'gold') {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 280);
        gradient.addColorStop(0, '#d97706');
        gradient.addColorStop(1, '#b45309');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 260);
      } else {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1200, 20);
      }

      // Platform Brand Badge
      ctx.fillStyle = theme === 'minimal' ? '#000000' : '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PRINTEZ REAL-TIME PRINT COUNTER', 600, theme === 'minimal' ? 80 : 100);

      // Main Card Box (White Card in center)
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      ctx.fillStyle = cardBg;
      roundRect(ctx, 80, theme === 'minimal' ? 120 : 200, 1040, 1320, 40);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Shop Name
      ctx.fillStyle = textPrimary;
      ctx.font = '800 58px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(headline || shop.name, 600, theme === 'minimal' ? 220 : 310);

      // Tagline
      ctx.fillStyle = textSecondary;
      ctx.font = '500 30px sans-serif';
      ctx.fillText(tagline, 600, theme === 'minimal' ? 280 : 370);

      // Draw QR Code onto Poster
      const qrTempCanvas = document.createElement('canvas');
      const renderQR = QRCodeLib?.toCanvas || window.QRCode?.toCanvas;

      if (renderQR) {
        await new Promise((resolve) => {
          renderQR(
            qrTempCanvas,
            shopUrl,
            {
              width: 520,
              margin: 2,
              color: { dark: qrDark, light: qrLight }
            },
            () => resolve()
          );
        });
      }

      const qrY = theme === 'minimal' ? 340 : 430;
      ctx.drawImage(qrTempCanvas, 340, qrY, 520, 520);

      // Counter Slug Pill
      ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#f1f5f9';
      roundRect(ctx, 420, qrY + 540, 360, 56, 28);
      ctx.fill();
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`COUNTER ID: ${shop.qr_slug || ''}`, 600, qrY + 576);

      // Prices Pill Grid (Optional)
      let curY = qrY + 630;
      if (showPrices) {
        ctx.fillStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
        roundRect(ctx, 160, curY, 880, 80, 24);
        ctx.fill();

        ctx.fillStyle = textPrimary;
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(
          `B&W: ৳${parseFloat(shop.price_bw || 2).toFixed(2)} / page    •    COLOR: ৳${parseFloat(shop.price_color || 10).toFixed(2)} / page`,
          600,
          curY + 52
        );
        curY += 110;
      }

      // Custom Slogan / Notice (Optional)
      if (customNotice) {
        ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#fef3c7';
        roundRect(ctx, 160, curY, 880, 70, 20);
        ctx.fill();

        ctx.fillStyle = theme === 'dark' ? '#fde68a' : '#92400e';
        ctx.font = '600 24px sans-serif';
        ctx.fillText(customNotice, 600, curY + 44);
        curY += 100;
      }

      // 3-Step Instructions
      if (showInstructions) {
        ctx.fillStyle = textSecondary;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('1. Open Phone Camera & Scan QR   →   2. Select Document & Options   →   3. Collect at Counter', 600, curY + 40);
      }

      // Footer URL / Address
      ctx.fillStyle = textSecondary;
      ctx.font = '20px sans-serif';
      ctx.fillText(shop.address ? `${shop.address} • Powered by Printez.com` : 'Powered by Printez Cloud Print POS', 600, 1560);

      // Trigger Download with Blob
      posterCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${(shop.name || 'Shop').replace(/\s+/g, '_')}_Standee_Poster.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          setDownloadSuccess('Standee Poster Downloaded!');
        }
        setGenerating(false);
      }, 'image/png');
    } catch (err) {
      console.error('Download error:', err);
      setGenerating(false);
    }
  };

  // 2. Download Raw QR Code Image (PNG)
  const handleDownloadQrOnly = async () => {
    try {
      const qrCanvas = document.createElement('canvas');
      const renderQR = QRCodeLib?.toCanvas || window.QRCode?.toCanvas;
      if (renderQR) {
        await new Promise((resolve) => {
          renderQR(
            qrCanvas,
            shopUrl,
            {
              width: 1000,
              margin: 3,
              color: { dark: '#000000', light: '#ffffff' }
            },
            () => resolve()
          );
        });

        qrCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${(shop.name || 'Shop').replace(/\s+/g, '_')}_QR_Code.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setDownloadSuccess('QR Code PNG Downloaded!');
          }
        }, 'image/png');
      }
    } catch (err) {
      console.error('Download QR only error:', err);
    }
  };

  // 3. Download Raw QR Code (SVG)
  const handleDownloadQrSvg = async () => {
    try {
      if (QRCodeLib?.toString) {
        const svgString = await QRCodeLib.toString(shopUrl, { type: 'svg', margin: 2 });
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${(shop.name || 'Shop').replace(/\s+/g, '_')}_QR_Vector.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setDownloadSuccess('QR Code SVG Downloaded!');
      }
    } catch (err) {
      console.error('Download QR SVG error:', err);
    }
  };

  // Direct 1-Click Print Standee
  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl flex flex-col w-full max-w-4xl h-[92vh] max-h-[850px] overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                Shop Counter QR Poster & Standee Generator
              </h3>
              <p className="text-[11px] text-slate-500">
                Download printable HD poster or desk standee with your custom branding
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split into Settings (Left) and Live Standee Preview (Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-100/60">
          
          {/* Left Column: Customization Controls (5 cols) */}
          <div className="md:col-span-5 space-y-4 text-xs">
            
            {/* Theme Selector */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-600" />
                <span>Standee Theme / Style</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'modern', label: '🔵 Ocean Blue', desc: 'Tech gradient' },
                  { id: 'minimal', label: '⚪ Minimal Crisp', desc: 'High contrast B&W' },
                  { id: 'dark', label: '🟣 Neon Dark', desc: 'Modern violet' },
                  { id: 'gold', label: '🟡 Warm Gold', desc: 'Amber counter' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      theme === t.id
                        ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px]">{t.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Poster Text & Branding</span>
              </label>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Headline (Shop Name)</label>
                <input
                  type="text"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tagline Slogan</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Special Notice / Counter Promo</label>
                <input
                  type="text"
                  value={customNotice}
                  onChange={e => setCustomNotice(e.target.value)}
                  placeholder="e.g. Thesis Binding & Color Printing Available"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-600 font-semibold text-[11px]">Display B&W / Color Rates</span>
                  <input
                    type="checkbox"
                    checked={showPrices}
                    onChange={e => setShowPrices(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-600 font-semibold text-[11px]">Show 3-Step Quick Guide</span>
                  <input
                    type="checkbox"
                    checked={showInstructions}
                    onChange={e => setShowInstructions(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                </label>
              </div>
            </div>

            {/* Direct Copy Link & Standalone QR formats */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Counter Link</p>
                  <p className="text-xs font-mono text-slate-700 truncate">{shopUrl}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shopUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs shrink-0 transition flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={handleDownloadQrOnly}
                  className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>QR Image (PNG)</span>
                </button>
                <button
                  onClick={handleDownloadQrSvg}
                  className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>Vector (SVG)</span>
                </button>
              </div>
            </div>

            {downloadSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-center text-xs animate-in fade-in">
                ✓ {downloadSuccess}
              </div>
            )}

          </div>

          {/* Right Column: Live Standee / Poster Preview (7 cols) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center">
            
            {/* Printable Card Area */}
            <div
              ref={printAreaRef}
              className={`w-full max-w-sm rounded-3xl p-6 shadow-xl border text-center transition-all duration-200 ${
                theme === 'minimal'
                  ? 'bg-white border-black text-black'
                  : theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-white shadow-indigo-950/40'
                    : theme === 'gold'
                      ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                      : 'bg-white border-blue-200 text-slate-900 shadow-blue-500/10'
              }`}
            >
              {/* Header Badge */}
              <div className="mb-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                  theme === 'minimal'
                    ? 'bg-black text-white'
                    : theme === 'dark'
                      ? 'bg-indigo-600 text-white'
                      : theme === 'gold'
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                }`}>
                  SELF-SERVICE PRINT
                </span>
              </div>

              {/* Shop Headline */}
              <h2 className="text-xl font-extrabold tracking-tight truncate leading-tight">
                {headline || shop.name}
              </h2>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {tagline}
              </p>

              {/* QR Code Canvas */}
              <div className="my-4 p-3 bg-white rounded-2xl shadow-inner border border-slate-200/80 inline-block mx-auto">
                <canvas ref={canvasRef} className="rounded-lg w-48 h-48 block mx-auto" />
              </div>

              {/* Slug Code */}
              <div className="mb-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                  theme === 'dark' ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-blue-700'
                }`}>
                  ID: {shop.qr_slug}
                </span>
              </div>

              {/* Rates Pill */}
              {showPrices && (
                <div className={`p-2 rounded-xl text-xs font-bold mb-2.5 ${
                  theme === 'dark' ? 'bg-slate-800/90 text-slate-200' : 'bg-slate-100 text-slate-800'
                }`}>
                  B&W: ৳{shop.price_bw || '2.00'} · Color: ৳{shop.price_color || '10.00'}
                </div>
              )}

              {/* Custom Notice */}
              {customNotice && (
                <div className={`p-2 rounded-xl text-[11px] font-semibold mb-2.5 ${
                  theme === 'dark' ? 'bg-indigo-950/60 text-indigo-200 border border-indigo-800/40' : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}>
                  📢 {customNotice}
                </div>
              )}

              {/* Instructions */}
              {showInstructions && (
                <p className={`text-[10px] leading-tight font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
                  1. Scan with Phone Camera &bull; 2. Upload Files &bull; 3. Collect from Counter
                </p>
              )}

              {shop.address && (
                <p className={`text-[9px] mt-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {shop.address}
                </p>
              )}
            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <div className="text-xs text-slate-500">
            Format: <strong className="text-slate-800">Ultra-HD 300 DPI Standee Poster</strong>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* 1-Click Print Direct */}
            <button
              onClick={handleDirectPrint}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Standee</span>
            </button>

            {/* Download Ultra HD Poster (PNG) */}
            <button
              onClick={handleDownloadPoster}
              disabled={generating}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{generating ? 'Generating HD...' : 'Download Poster (PNG)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
