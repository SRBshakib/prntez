import React, { useState, useEffect, useRef } from 'react';
import {
  X, Download, Printer, QrCode, Sparkles, Check, Copy, Sliders, Palette, FileText, Layout, Image as ImageIcon, ShieldCheck, Globe
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import { useLanguage } from '../context/LanguageContext';

export default function ShopQrModal({ shop, onClose }) {
  const { isBn } = useLanguage();

  // Customization State
  const [posterLang, setPosterLang] = useState(isBn ? 'bn' : 'en'); // 'en' | 'bn'
  const [paperFormat, setPaperFormat] = useState('a4'); // 'a4' | 'standee'
  const [theme, setTheme] = useState('modern'); // 'modern' | 'minimal' | 'dark' | 'gold'
  const [headline, setHeadline] = useState(shop?.name || (isBn ? 'সেলফ-সার্ভিস প্রিন্ট কাউন্টার' : 'Quick Print Counter'));
  const [tagline, setTagline] = useState(
    isBn ? 'তাত্ক্ষণিক ডকুমেন্ট আপলোড ও প্রিন্ট করতে স্ক্যান করুন' : 'Scan to Upload & Print Documents Instantly'
  );
  const [customNotice, setCustomNotice] = useState(
    shop?.counter_notice || (isBn ? 'উচ্চ মানের লেজার প্রিন্টিং এবং ডকুমেন্ট সেবা উপলব্ধ।' : 'High-quality laser printing & document services available.')
  );
  const [showPrices, setShowPrices] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showPrivacyBadge, setShowPrivacyBadge] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  const canvasRef = useRef(null);
  const printAreaRef = useRef(null);

  const shopUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?shop=${shop?.qr_slug || ''}`
    : `http://localhost:3000/?shop=${shop?.qr_slug || ''}`;

  // Helper to convert English digits to Bengali digits
  const toBnDigits = (str) => {
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(str).replace(/[0-9]/g, (d) => bn[parseInt(d, 10)]);
  };

  const isPosterBn = posterLang === 'bn';

  // Language preset switcher
  const handleLangChange = (newLang) => {
    setPosterLang(newLang);
    if (newLang === 'bn') {
      if (!tagline || tagline === 'Scan to Upload & Print Documents Instantly') {
        setTagline('তাত্ক্ষণিক ডকুমেন্ট আপলোড ও প্রিন্ট করতে স্ক্যান করুন');
      }
      if (!customNotice || customNotice === 'High-quality laser printing & document services available.') {
        setCustomNotice('উচ্চ মানের লেজার প্রিন্টিং এবং ডকুমেন্ট সেবা উপলব্ধ।');
      }
    } else {
      if (!tagline || tagline === 'তাত্ক্ষণিক ডকুমেন্ট আপলোড ও প্রিন্ট করতে স্ক্যান করুন') {
        setTagline('Scan to Upload & Print Documents Instantly');
      }
      if (!customNotice || customNotice === 'উচ্চ মানের লেজার প্রিন্টিং এবং ডকুমেন্ট সেবা উপলব্ধ।') {
        setCustomNotice('High-quality laser printing & document services available.');
      }
    }
  };

  // Text values based on poster language
  const badgeText = isPosterBn ? 'সেলফ-সার্ভিস প্রিন্ট' : 'SELF-SERVICE PRINT';
  const idLabel = isPosterBn ? 'কাউন্টার আইডি' : 'ID';
  const priceBw = parseFloat(shop?.price_bw || 2).toFixed(2);
  const priceColor = parseFloat(shop?.price_color || 10).toFixed(2);
  const ratesText = isPosterBn
    ? `কালো-সাদা: ৳${toBnDigits(priceBw)} · রঙিন: ৳${toBnDigits(priceColor)}`
    : `B&W: ৳${priceBw} · Color: ৳${priceColor}`;
  const privacyText = isPosterBn
    ? '🛡️ কোনো হোয়াটসঅ্যাপ বা ইমেল লাগবে না • 🔒 ফাইল সাথে সাথে মুছে যায়'
    : '🛡️ No WhatsApp or Gmail Needed • 🔒 Files Delete Instantly';
  const stepsText = isPosterBn
    ? '১. ফোনের ক্যামেরা দিয়ে স্ক্যান করুন • ২. ফাইল আপলোড করুন • ৩. কাউন্টার থেকে সংগ্রহ করুন'
    : '1. Scan with Phone Camera • 2. Upload Files • 3. Collect from Counter';
  const footerText = isPosterBn
    ? `${shop?.address ? shop.address + ' • ' : ''}Prntez ক্লাউড প্রিন্ট পিওএস দ্বারা পরিচালিত`
    : `${shop?.address ? shop.address + ' • ' : ''}Powered by prntez Cloud Print POS`;

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
          width: paperFormat === 'a4' ? 360 : 300,
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
          width: paperFormat === 'a4' ? 360 : 300,
          margin: 2,
          color: { dark: qrDark, light: qrLight }
        },
        (err) => {
          if (err) console.error('QR window error:', err);
        }
      );
    }
  }, [shop?.qr_slug, theme, shopUrl, paperFormat]);

  // Helper function for rounded rectangles on HTML5 Canvas
  function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      radius = { tl: 0, tr: 0, br: 0, bl: 0, ...radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
  }

  // Draw optical viewfinder scanning reticles at corners of QR
  function drawReticles(ctx, x, y, width, height, bLen, strokeWidth, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + bLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + bLen, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + width - bLen, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + bLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + height - bLen);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + bLen, y + height);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + width - bLen, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y + height - bLen);
    ctx.stroke();

    ctx.restore();
  }

  // Helper to draw text with automatic font-size downscaling to fit maxWidth
  function drawFittedText(ctx, text, x, y, maxWidth, initialFontSize, fontWeight = '700', fontName = 'sans-serif') {
    if (!text) return;
    let size = initialFontSize;
    ctx.font = `${fontWeight} ${size}px ${fontName}`;
    let measuredWidth = ctx.measureText(text).width;
    while (measuredWidth > maxWidth && size > 16) {
      size -= 2;
      ctx.font = `${fontWeight} ${size}px ${fontName}`;
      measuredWidth = ctx.measureText(text).width;
    }
    ctx.fillText(text, x, y);
  }

  // 1. Download High-Resolution Standee / Poster (PNG)
  const handleDownloadPoster = async () => {
    setGenerating(true);
    setDownloadSuccess('');

    try {
      // 1. Font ready with 600ms timeout race so it never hangs
      if (document.fonts) {
        try {
          await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 600))
          ]);
        } catch (_) {}
      }

      const posterCanvas = document.createElement('canvas');
      const isA4 = paperFormat === 'a4';
      // 300 DPI A4 is 2480 x 3508 pixels, compact standee is 1200 x 1600
      posterCanvas.width = isA4 ? 2480 : 1200;
      posterCanvas.height = isA4 ? 3508 : 1600;
      const ctx = posterCanvas.getContext('2d');
      const W = posterCanvas.width;
      const H = posterCanvas.height;

      const fontFamily = '"Outfit", "Hind Siliguri", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      // Theme color palettes
      let bgGradient, cardBg, textPrimary, textSecondary, accentColor, qrDark, qrLight, badgeBg;
      let headerGradStops = [];
      let footerBg = '#0f172a';
      let borderAccent = '#2563eb';

      if (theme === 'minimal') {
        bgGradient = '#ffffff';
        cardBg = '#ffffff';
        textPrimary = '#0a0a0a';
        textSecondary = '#52525b';
        accentColor = '#000000';
        qrDark = '#000000';
        qrLight = '#ffffff';
        badgeBg = '#000000';
        headerGradStops = ['#000000', '#18181b'];
        footerBg = '#000000';
        borderAccent = '#000000';
      } else if (theme === 'dark') {
        bgGradient = '#090d16';
        cardBg = '#131b2e';
        textPrimary = '#ffffff';
        textSecondary = '#94a3b8';
        accentColor = '#818cf8';
        qrDark = '#ffffff';
        qrLight = '#131b2e';
        badgeBg = '#4f46e5';
        headerGradStops = ['#1e1b4b', '#3730a3', '#4f46e5'];
        footerBg = '#050811';
        borderAccent = '#4f46e5';
      } else if (theme === 'gold') {
        bgGradient = '#fffdf5';
        cardBg = '#ffffff';
        textPrimary = '#78350f';
        textSecondary = '#92400e';
        accentColor = '#d97706';
        qrDark = '#78350f';
        qrLight = '#ffffff';
        badgeBg = '#d97706';
        headerGradStops = ['#78350f', '#b45309', '#d97706'];
        footerBg = '#451a03';
        borderAccent = '#d97706';
      } else {
        // Modern Tech Ocean Blue
        bgGradient = '#f8fafc';
        cardBg = '#ffffff';
        textPrimary = '#0f172a';
        textSecondary = '#475569';
        accentColor = '#2563eb';
        qrDark = '#1e3a8a';
        qrLight = '#ffffff';
        badgeBg = '#2563eb';
        headerGradStops = ['#1e3a8a', '#2563eb', '#3b82f6'];
        footerBg = '#0f172a';
        borderAccent = '#2563eb';
      }

      // Background fill
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, W, H);

      // Helper for robust QR source resolution
      const getQrCanvasSource = async (size) => {
        let qrSource = canvasRef.current;
        const renderQR = QRCodeLib?.toCanvas || window.QRCode?.toCanvas;
        if (renderQR) {
          try {
            const qrTempCanvas = document.createElement('canvas');
            await Promise.race([
              new Promise((resolve) => {
                renderQR(
                  qrTempCanvas,
                  shopUrl,
                  {
                    width: size,
                    margin: 2,
                    color: { dark: qrDark, light: qrLight }
                  },
                  (err) => {
                    if (!err && qrTempCanvas.width > 0) {
                      qrSource = qrTempCanvas;
                    }
                    resolve();
                  }
                );
              }),
              new Promise((resolve) => setTimeout(resolve, 800))
            ]);
          } catch (qrErr) {
            console.warn('QR canvas generation error, falling back:', qrErr);
          }
        }
        return qrSource;
      };

      if (isA4) {
        // ==============================================================
        // FULL A4 POSTER LAYOUT (2480 x 3508 pixels @ 300 DPI)
        // Vertically balanced, high-end retail visual hierarchy
        // ==============================================================

        // 1. Outer Frame & Inner Card
        ctx.strokeStyle = borderAccent;
        ctx.lineWidth = 10;
        roundRect(ctx, 40, 40, W - 80, H - 80, 56);
        ctx.stroke();

        ctx.fillStyle = cardBg;
        roundRect(ctx, 45, 45, W - 90, H - 90, 52);
        ctx.fill();

        // 2. Top Header Hero Banner (Y: 45 to 660)
        ctx.save();
        roundRect(ctx, 45, 45, W - 90, 615, { tl: 52, tr: 52, br: 0, bl: 0 });
        ctx.clip();

        const headGrad = ctx.createLinearGradient(0, 45, W, 660);
        headGrad.addColorStop(0, headerGradStops[0]);
        if (headerGradStops[2]) {
          headGrad.addColorStop(0.5, headerGradStops[1]);
          headGrad.addColorStop(1, headerGradStops[2]);
        } else {
          headGrad.addColorStop(1, headerGradStops[1]);
        }
        ctx.fillStyle = headGrad;
        ctx.fillRect(45, 45, W - 90, 615);

        // Subtle decorative background ambient glow circles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.beginPath();
        ctx.arc(200, 100, 260, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(W - 220, 300, 340, 0, Math.PI * 2);
        ctx.fill();

        // Top Pill Badge
        const pillW = 900;
        const pillH = 76;
        const pillX = (W - pillW) / 2;
        const pillY = 110;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        roundRect(ctx, pillX, pillY, pillW, pillH, 38);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 3;
        roundRect(ctx, pillX, pillY, pillW, pillH, 38);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `800 36px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(`✨ ${badgeText}`, W / 2, pillY + 50);

        // Headline (Shop Name)
        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, headline || shop.name, W / 2, 310, W - 320, 106, '900', fontFamily);

        // Tagline / Subtitle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        drawFittedText(ctx, tagline, W / 2, 415, W - 400, 48, '600', fontFamily);

        // Mobile Camera Instruction Pill
        const camW = 1260;
        const camH = 80;
        const camX = (W - camW) / 2;
        const camY = 495;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        roundRect(ctx, camX, camY, camW, camH, 40);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
        ctx.lineWidth = 2.5;
        roundRect(ctx, camX, camY, camW, camH, 40);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `700 38px ${fontFamily}`;
        ctx.fillText(
          isPosterBn
            ? '📱 মোবাইল ক্যামেরা দিয়ে স্ক্যান করুন • কোনো অ্যাপ বা হোয়াটসঅ্যাপ লাগবে না'
            : '📱 Scan with Phone Camera • No App or WhatsApp Needed',
          W / 2,
          camY + 52
        );
        ctx.restore();

        // 3. QR Code Showcase Card (Y: 710 to 1960)
        const qrCardW = 1280;
        const qrCardH = 1240;
        const qrCardX = (W - qrCardW) / 2;
        const qrCardY = 710;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 45;
        ctx.shadowOffsetY = 16;
        ctx.fillStyle = theme === 'dark' ? '#131b2e' : '#ffffff';
        roundRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 48);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.strokeStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
        ctx.lineWidth = 3.5;
        roundRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 48);
        ctx.stroke();
        ctx.restore();

        // Top Floating Callout on QR Card
        const qrCalloutW = 860;
        const qrCalloutH = 70;
        const qrCalloutX = (W - qrCalloutW) / 2;
        const qrCalloutY = qrCardY + 40;
        ctx.fillStyle = accentColor;
        roundRect(ctx, qrCalloutX, qrCalloutY, qrCalloutW, qrCalloutH, 35);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `800 34px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(
          isPosterBn ? '📷 ক্যামেরা তাক করে স্ক্যান করুন' : '📷 POINT CAMERA TO SCAN & PRINT',
          W / 2,
          qrCalloutY + 46
        );

        // Draw QR code with safe fallback
        const qrA4Source = await getQrCanvasSource(900);
        const qrX = (W - 900) / 2;
        const qrY = qrCardY + 145;
        if (qrA4Source) {
          ctx.drawImage(qrA4Source, qrX, qrY, 900, 900);
        }

        // Corner Reticles around the QR code
        drawReticles(ctx, qrX - 35, qrY - 35, 970, 970, 65, 10, accentColor);

        // Counter ID Pill directly under QR
        const idW = 780;
        const idH = 90;
        const idX = (W - idW) / 2;
        const idY = qrCardY + 1105;
        ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#f1f5f9';
        roundRect(ctx, idX, idY, idW, idH, 45);
        ctx.fill();
        ctx.strokeStyle = theme === 'dark' ? '#334155' : '#cbd5e1';
        ctx.lineWidth = 2.5;
        roundRect(ctx, idX, idY, idW, idH, 45);
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.font = `800 42px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`🏷️ ${idLabel}: ${shop.qr_slug || ''}`, W / 2, idY + 58);

        // 4. Dual Retail Pricing Board (Y: 2000 to 2380)
        let curY = 2000;
        if (showPrices) {
          const cardWidth = 1070;
          const cardHeight = 370;
          const leftCardX = 140;
          const rightCardX = 1270;

          // Left Pricing Card (Black & White)
          ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#f8fafc';
          roundRect(ctx, leftCardX, curY, cardWidth, cardHeight, 36);
          ctx.fill();
          ctx.strokeStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
          ctx.lineWidth = 3;
          roundRect(ctx, leftCardX, curY, cardWidth, cardHeight, 36);
          ctx.stroke();

          // Left Card Badge
          ctx.fillStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
          roundRect(ctx, leftCardX + 50, curY + 36, 420, 56, 28);
          ctx.fill();
          ctx.fillStyle = textPrimary;
          ctx.font = `800 28px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText(isPosterBn ? '🖤 সাদা-কালো প্রিন্ট' : '🖤 BLACK & WHITE', leftCardX + 260, curY + 74);

          // Left Card Price
          ctx.fillStyle = textPrimary;
          ctx.font = `900 96px ${fontFamily}`;
          ctx.fillText(`৳${isPosterBn ? toBnDigits(priceBw) : priceBw}`, leftCardX + cardWidth / 2, curY + 205);

          // Left Card Description
          ctx.fillStyle = textSecondary;
          ctx.font = `600 32px ${fontFamily}`;
          ctx.fillText(
            isPosterBn ? 'প্রতি পৃষ্ঠা • ঝকঝকে লেজার কোয়ালিটি' : 'per page • crisp laser quality',
            leftCardX + cardWidth / 2,
            curY + 280
          );

          // Right Pricing Card (Color Print)
          ctx.fillStyle = theme === 'dark' ? '#1e1b4b' : '#eff6ff';
          roundRect(ctx, rightCardX, curY, cardWidth, cardHeight, 36);
          ctx.fill();
          ctx.strokeStyle = theme === 'dark' ? '#4338ca' : '#bfdbfe';
          ctx.lineWidth = 3;
          roundRect(ctx, rightCardX, curY, cardWidth, cardHeight, 36);
          ctx.stroke();

          // Right Card Badge
          ctx.fillStyle = theme === 'dark' ? '#4338ca' : '#dbeafe';
          roundRect(ctx, rightCardX + 50, curY + 36, 400, 56, 28);
          ctx.fill();
          ctx.fillStyle = accentColor;
          ctx.font = `800 28px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText(isPosterBn ? '🌈 রঙিন প্রিন্ট' : '🌈 COLOR PRINT', rightCardX + 250, curY + 74);

          // Right Card Price
          ctx.fillStyle = accentColor;
          ctx.font = `900 96px ${fontFamily}`;
          ctx.fillText(`৳${isPosterBn ? toBnDigits(priceColor) : priceColor}`, rightCardX + cardWidth / 2, curY + 205);

          // Right Card Description
          ctx.fillStyle = textSecondary;
          ctx.font = `600 32px ${fontFamily}`;
          ctx.fillText(
            isPosterBn ? 'প্রতি পৃষ্ঠা • উজ্জ্বল হাই ডেফিনিশন' : 'per page • vivid high-definition',
            rightCardX + cardWidth / 2,
            curY + 280
          );

          curY += cardHeight + 40;
        }

        // 5. Illustrated 3-Step Process Flow (Y: ~2410 to 2790)
        if (showInstructions) {
          ctx.fillStyle = textSecondary;
          ctx.font = `800 34px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText(
            isPosterBn ? '⚡ কীভাবে প্রিন্ট করবেন — ৩টি সহজ ধাপ' : '⚡ HOW TO PRINT — 3 SIMPLE STEPS',
            W / 2,
            curY + 35
          );

          const stepBoxY = curY + 70;
          const stepW = 670;
          const stepH = 240;

          // Step 1
          const s1X = 140;
          ctx.fillStyle = cardBg;
          roundRect(ctx, s1X, stepBoxY, stepW, stepH, 30);
          ctx.fill();
          ctx.strokeStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
          ctx.lineWidth = 2.5;
          roundRect(ctx, s1X, stepBoxY, stepW, stepH, 30);
          ctx.stroke();

          // Step 1 Circle
          ctx.fillStyle = accentColor;
          ctx.beginPath();
          ctx.arc(s1X + 80, stepBoxY + 75, 42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 42px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText(isPosterBn ? '১' : '1', s1X + 80, stepBoxY + 89);

          ctx.textAlign = 'left';
          ctx.fillStyle = textPrimary;
          ctx.font = `800 36px ${fontFamily}`;
          ctx.fillText(isPosterBn ? 'স্ক্যান করুন' : 'Scan QR', s1X + 150, stepBoxY + 85);
          ctx.fillStyle = textSecondary;
          ctx.font = `500 28px ${fontFamily}`;
          ctx.fillText(isPosterBn ? 'ফোনের ক্যামেরা দিয়ে স্ক্যান' : 'Point camera to open link', s1X + 50, stepBoxY + 165);

          // Arrow 1-2
          ctx.textAlign = 'center';
          ctx.fillStyle = accentColor;
          ctx.font = `bold 44px ${fontFamily}`;
          ctx.fillText('➔', 855, stepBoxY + 120);

          // Step 2
          const s2X = 905;
          ctx.fillStyle = cardBg;
          roundRect(ctx, s2X, stepBoxY, stepW, stepH, 30);
          ctx.fill();
          ctx.strokeStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
          ctx.lineWidth = 2.5;
          roundRect(ctx, s2X, stepBoxY, stepW, stepH, 30);
          ctx.stroke();

          ctx.fillStyle = accentColor;
          ctx.beginPath();
          ctx.arc(s2X + 80, stepBoxY + 75, 42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 42px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText(isPosterBn ? '২' : '2', s2X + 80, stepBoxY + 89);

          ctx.textAlign = 'left';
          ctx.fillStyle = textPrimary;
          ctx.font = `800 36px ${fontFamily}`;
          ctx.fillText(isPosterBn ? 'ফাইল দিন' : 'Upload Files', s2X + 150, stepBoxY + 85);
          ctx.fillStyle = textSecondary;
          ctx.font = `500 28px ${fontFamily}`;
          ctx.fillText(isPosterBn ? 'PDF বা ছবি সিলেক্ট করুন' : 'Choose PDF, docs or photos', s2X + 50, stepBoxY + 165);

          // Arrow 2-3
          ctx.textAlign = 'center';
          ctx.fillStyle = accentColor;
          ctx.font = `bold 44px ${fontFamily}`;
          ctx.fillText('➔', 1620, stepBoxY + 120);

          // Step 3
          const s3X = 1670;
          ctx.fillStyle = cardBg;
          roundRect(ctx, s3X, stepBoxY, stepW, stepH, 30);
          ctx.fill();
          ctx.strokeStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
          ctx.lineWidth = 2.5;
          roundRect(ctx, s3X, stepBoxY, stepW, stepH, 30);
          ctx.stroke();

          ctx.fillStyle = accentColor;
          ctx.beginPath();
          ctx.arc(s3X + 80, stepBoxY + 75, 42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 42px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText(isPosterBn ? '৩' : '3', s3X + 80, stepBoxY + 89);

          ctx.textAlign = 'left';
          ctx.fillStyle = textPrimary;
          ctx.font = `800 36px ${fontFamily}`;
          ctx.fillText(isPosterBn ? 'প্রিন্ট নিন' : 'Collect Print', s3X + 150, stepBoxY + 85);
          ctx.fillStyle = textSecondary;
          ctx.font = `500 28px ${fontFamily}`;
          ctx.fillText(isPosterBn ? 'কাউন্টার থেকে প্রিন্ট সংগ্রহ' : 'Instant laser print ready', s3X + 50, stepBoxY + 165);

          curY = stepBoxY + stepH + 40;
        }

        // 6. Custom Notice & Privacy Trust Banner (Y: ~2830 to 3240)
        if (customNotice) {
          ctx.fillStyle = theme === 'dark' ? '#312e81' : '#fef3c7';
          roundRect(ctx, 140, curY, W - 280, 130, 26);
          ctx.fill();
          ctx.strokeStyle = theme === 'dark' ? '#4338ca' : '#fde68a';
          ctx.lineWidth = 2.5;
          roundRect(ctx, 140, curY, W - 280, 130, 26);
          ctx.stroke();

          ctx.fillStyle = theme === 'dark' ? '#c7d2fe' : '#92400e';
          ctx.font = `700 38px ${fontFamily}`;
          ctx.textAlign = 'center';
          drawFittedText(ctx, `📢 ${customNotice}`, W / 2, curY + 80, W - 360, 38, '700', fontFamily);

          curY += 155;
        }

        if (showPrivacyBadge) {
          const privH = 150;
          ctx.fillStyle = theme === 'dark' ? '#064e3b' : '#ecfdf5';
          roundRect(ctx, 140, curY, W - 280, privH, 28);
          ctx.fill();
          ctx.strokeStyle = theme === 'dark' ? '#047857' : '#a7f3d0';
          ctx.lineWidth = 2.5;
          roundRect(ctx, 140, curY, W - 280, privH, 28);
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = theme === 'dark' ? '#6ee7b7' : '#065f46';
          ctx.font = `800 38px ${fontFamily}`;
          ctx.fillText(
            `🛡️ ${isPosterBn ? '১০০% সুরক্ষিত ও প্রাইভেট সেলফ-সার্ভিস' : '100% PRIVATE & SECURE PRINTING'}`,
            W / 2,
            curY + 62
          );

          ctx.fillStyle = theme === 'dark' ? '#a7f3d0' : '#047857';
          ctx.font = `600 30px ${fontFamily}`;
          ctx.fillText(
            isPosterBn
              ? 'কোনো হোয়াটসঅ্যাপ বা ইমেল লাগবে না • প্রিন্ট শেষে ফাইল স্বয়ংক্রিয়ভাবে মুছে যায়'
              : 'Zero WhatsApp or Gmail needed • Files are encrypted and automatically shredded after printing',
            W / 2,
            curY + 115
          );
        }

        // 7. Full-Width Bottom Branded Footer Bar (Y: 3260 to 3508)
        ctx.save();
        roundRect(ctx, 45, 3260, W - 90, 203, { tl: 0, tr: 0, br: 52, bl: 52 });
        ctx.clip();

        ctx.fillStyle = footerBg;
        ctx.fillRect(45, 3260, W - 90, 203);

        ctx.textAlign = 'center';
        if (shop?.address) {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = `600 32px ${fontFamily}`;
          ctx.fillText(`📍 ${shop.address}`, W / 2, 3325);

          ctx.fillStyle = '#94a3b8';
          ctx.font = `500 28px ${fontFamily}`;
          ctx.fillText('🔒 256-Bit SSL Encrypted • Fast, Direct & Contactless Cloud Print', W / 2, 3375);

          ctx.fillStyle = '#ffffff';
          ctx.font = `800 34px ${fontFamily}`;
          ctx.fillText('⚡ Powered by prntez Cloud Print POS • www.prntez.com', W / 2, 3430);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.font = `600 32px ${fontFamily}`;
          ctx.fillText('🔒 256-Bit SSL Encrypted • Fast, Direct & Contactless Cloud Print', W / 2, 3350);

          ctx.fillStyle = '#ffffff';
          ctx.font = `800 34px ${fontFamily}`;
          ctx.fillText('⚡ Powered by prntez Cloud Print POS • www.prntez.com', W / 2, 3420);
        }
        ctx.restore();

      } else {
        // ==============================================================
        // COMPACT STANDEE LAYOUT (1200 x 1600 pixels)
        // Scaled, high-contrast, clean desk display
        // ==============================================================

        // Outer Border
        ctx.strokeStyle = borderAccent;
        ctx.lineWidth = 6;
        roundRect(ctx, 20, 20, W - 40, H - 40, 36);
        ctx.stroke();

        ctx.fillStyle = cardBg;
        roundRect(ctx, 23, 23, W - 46, H - 46, 33);
        ctx.fill();

        // Top Header
        ctx.save();
        roundRect(ctx, 23, 23, W - 46, 290, { tl: 33, tr: 33, br: 0, bl: 0 });
        ctx.clip();

        const headGrad = ctx.createLinearGradient(0, 23, W, 310);
        headGrad.addColorStop(0, headerGradStops[0]);
        headGrad.addColorStop(1, headerGradStops[1]);
        ctx.fillStyle = headGrad;
        ctx.fillRect(23, 23, W - 46, 290);

        // Header decorative glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(100, 60, 140, 0, Math.PI * 2);
        ctx.fill();

        // Top badge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        roundRect(ctx, (W - 460) / 2, 50, 460, 44, 22);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 20px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(`✨ ${badgeText}`, W / 2, 79);

        // Shop Title
        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, headline || shop.name, W / 2, 148, W - 160, 54, '900', fontFamily);

        // Tagline
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        drawFittedText(ctx, tagline, W / 2, 204, W - 200, 25, '600', fontFamily);

        // Scan callout pill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        roundRect(ctx, (W - 640) / 2, 238, 640, 42, 21);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 20px ${fontFamily}`;
        ctx.fillText(
          isPosterBn ? '📱 মোবাইল ক্যামেরা দিয়ে স্ক্যান করুন' : '📱 Scan with Phone Camera to Print',
          W / 2,
          266
        );
        ctx.restore();

        // QR Showcase Card
        const qrCardW = 600;
        const qrCardH = 610;
        const qrCardX = (W - qrCardW) / 2;
        const qrCardY = 325;

        ctx.fillStyle = theme === 'dark' ? '#131b2e' : '#ffffff';
        roundRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 28);
        ctx.fill();
        ctx.strokeStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
        ctx.lineWidth = 2.5;
        roundRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 28);
        ctx.stroke();

        // Draw QR code with safe fallback
        const qrStandeeSource = await getQrCanvasSource(440);
        const qrX = (W - 440) / 2;
        const qrY = qrCardY + 45;
        if (qrStandeeSource) {
          ctx.drawImage(qrStandeeSource, qrX, qrY, 440, 440);
        }

        // Reticles
        drawReticles(ctx, qrX - 16, qrY - 16, 472, 472, 34, 5, accentColor);

        // Counter ID
        const idW = 400;
        const idH = 50;
        const idX = (W - idW) / 2;
        const idY = qrCardY + 530;
        ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#f1f5f9';
        roundRect(ctx, idX, idY, idW, idH, 25);
        ctx.fill();
        ctx.fillStyle = accentColor;
        ctx.font = '800 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`🏷️ ${idLabel}: ${shop.qr_slug || ''}`, W / 2, idY + 33);

        // Pricing Dual Cards
        let curY = 960;
        if (showPrices) {
          const cardW = 510;
          const cardH = 170;

          // B&W
          ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#f8fafc';
          roundRect(ctx, 60, curY, cardW, cardH, 20);
          ctx.fill();
          ctx.strokeStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
          ctx.lineWidth = 2;
          roundRect(ctx, 60, curY, cardW, cardH, 20);
          ctx.stroke();

          ctx.fillStyle = textPrimary;
          ctx.font = `800 18px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText(isPosterBn ? '🖤 সাদা-কালো' : '🖤 BLACK & WHITE', 60 + cardW / 2, curY + 38);
          ctx.font = `900 50px ${fontFamily}`;
          ctx.fillText(`৳${isPosterBn ? toBnDigits(priceBw) : priceBw}`, 60 + cardW / 2, curY + 102);
          ctx.fillStyle = textSecondary;
          ctx.font = `600 16px ${fontFamily}`;
          ctx.fillText(isPosterBn ? 'প্রতি পৃষ্ঠা' : 'per page', 60 + cardW / 2, curY + 140);

          // Color
          ctx.fillStyle = theme === 'dark' ? '#1e1b4b' : '#eff6ff';
          roundRect(ctx, 630, curY, cardW, cardH, 20);
          ctx.fill();
          ctx.strokeStyle = theme === 'dark' ? '#4338ca' : '#bfdbfe';
          ctx.lineWidth = 2;
          roundRect(ctx, 630, curY, cardW, cardH, 20);
          ctx.stroke();

          ctx.fillStyle = accentColor;
          ctx.font = `800 18px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText(isPosterBn ? '🌈 রঙিন প্রিন্ট' : '🌈 COLOR PRINT', 630 + cardW / 2, curY + 38);
          ctx.font = `900 50px ${fontFamily}`;
          ctx.fillText(`৳${isPosterBn ? toBnDigits(priceColor) : priceColor}`, 630 + cardW / 2, curY + 102);
          ctx.fillStyle = textSecondary;
          ctx.font = `600 16px ${fontFamily}`;
          ctx.fillText(isPosterBn ? 'প্রতি পৃষ্ঠা' : 'per page', 630 + cardW / 2, curY + 140);

          curY += cardH + 20;
        }

        // Instructions
        if (showInstructions) {
          ctx.fillStyle = textSecondary;
          ctx.font = `700 20px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText(
            isPosterBn
              ? '১. স্ক্যান করুন  ➔  ২. ফাইল দিন  ➔  ৩. কাউন্টারে প্রিন্ট সংগ্রহ'
              : '1. Scan QR  ➔  2. Upload File  ➔  3. Collect Prints',
            W / 2,
            curY + 28
          );
          curY += 45;
        }

        // Notice / Privacy
        if (customNotice) {
          ctx.fillStyle = theme === 'dark' ? '#312e81' : '#fef3c7';
          roundRect(ctx, 60, curY, W - 120, 60, 16);
          ctx.fill();
          ctx.fillStyle = theme === 'dark' ? '#c7d2fe' : '#92400e';
          ctx.font = `700 19px ${fontFamily}`;
          ctx.textAlign = 'center';
          drawFittedText(ctx, `📢 ${customNotice}`, W / 2, curY + 38, W - 160, 19, '700', fontFamily);
          curY += 75;
        }

        if (showPrivacyBadge) {
          ctx.fillStyle = theme === 'dark' ? '#064e3b' : '#ecfdf5';
          roundRect(ctx, 60, curY, W - 120, 58, 16);
          ctx.fill();
          ctx.fillStyle = theme === 'dark' ? '#34d399' : '#047857';
          ctx.font = `800 18px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText(
            isPosterBn
              ? '🛡️ নো হোয়াটসঅ্যাপ • প্রিন্ট শেষে ফাইল স্বয়ংক্রিয় মুছে যায়'
              : '🛡️ Zero WhatsApp • Files Auto-Shred After Printing',
            W / 2,
            curY + 36
          );
        }

        // Footer
        ctx.save();
        roundRect(ctx, 23, 1475, W - 46, 102, { tl: 0, tr: 0, br: 33, bl: 33 });
        ctx.clip();
        ctx.fillStyle = footerBg;
        ctx.fillRect(23, 1475, W - 46, 102);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#cbd5e1';
        ctx.font = `500 18px ${fontFamily}`;
        ctx.fillText(
          shop?.address ? `📍 ${shop.address}` : '🔒 256-Bit SSL Encrypted • Fast Cloud Print',
          W / 2,
          1515
        );
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 20px ${fontFamily}`;
        ctx.fillText('⚡ Powered by prntez Cloud Print POS', W / 2, 1550);
        ctx.restore();
      }

      // Robust download trigger with direct fallback
      const triggerDownload = (downloadUrl) => {
        const link = document.createElement('a');
        const formatTag = isA4 ? 'A4_Poster' : 'Desk_Standee';
        const langTag = isPosterBn ? 'Bangla' : 'English';
        const safeName = (shop?.name || 'Shop').replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_');
        link.download = `${safeName}_${formatTag}_${langTag}.png`;
        link.href = downloadUrl;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) link.parentNode.removeChild(link);
        }, 300);
      };

      let downloadExecuted = false;
      try {
        if (posterCanvas.toBlob) {
          posterCanvas.toBlob((blob) => {
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              triggerDownload(blobUrl);
              setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
              downloadExecuted = true;
            } else {
              triggerDownload(posterCanvas.toDataURL('image/png'));
              downloadExecuted = true;
            }
            setGenerating(false);
            setDownloadSuccess(
              isBn
                ? `${isA4 ? 'পূর্ণ A4 পোস্টার' : 'ডেস্ক স্ট্যান্ডি'} ডাউনলোড সম্পন্ন হয়েছে!`
                : `${isA4 ? 'Full A4 Poster' : 'Desk Standee'} Downloaded!`
            );
          }, 'image/png');
        } else {
          triggerDownload(posterCanvas.toDataURL('image/png'));
          downloadExecuted = true;
          setGenerating(false);
          setDownloadSuccess(
            isBn ? 'পোস্টার ডাউনলোড সম্পন্ন হয়েছে!' : 'Poster Downloaded!'
          );
        }
      } catch (blobErr) {
        console.warn('toBlob error, fallback to dataURL:', blobErr);
        triggerDownload(posterCanvas.toDataURL('image/png'));
        downloadExecuted = true;
        setGenerating(false);
        setDownloadSuccess(
          isBn ? 'পোস্টার ডাউনলোড সম্পন্ন হয়েছে!' : 'Poster Downloaded!'
        );
      }

      // Safety timeout: if browser toBlob didn't trigger callback in 1.5s, force download with toDataURL
      setTimeout(() => {
        if (!downloadExecuted) {
          try {
            triggerDownload(posterCanvas.toDataURL('image/png'));
            setDownloadSuccess(isBn ? 'পোস্টার ডাউনলোড সম্পন্ন!' : 'Poster Downloaded!');
          } catch (_) {}
          setGenerating(false);
        }
      }, 1500);

    } catch (err) {
      console.error('Download error:', err);
      // Emergency fallback
      try {
        if (canvasRef.current) {
          const emergencyLink = document.createElement('a');
          emergencyLink.download = 'Shop_QR_Poster.png';
          emergencyLink.href = canvasRef.current.toDataURL('image/png');
          document.body.appendChild(emergencyLink);
          emergencyLink.click();
          document.body.removeChild(emergencyLink);
        }
      } catch (_) {}
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
            setDownloadSuccess(isBn ? 'QR কোড PNG ডাউনলোড সম্পন্ন!' : 'QR Code PNG Downloaded!');
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
        setDownloadSuccess(isBn ? 'QR কোড SVG ডাউনলোড সম্পন্ন!' : 'QR Code SVG Downloaded!');
      }
    } catch (err) {
      console.error('Download QR SVG error:', err);
    }
  };

  // Direct 1-Click Print Standee / Save A4 PDF
  const handleDirectPrint = () => {
    let qrDataUrl = '';
    if (canvasRef.current) {
      try {
        qrDataUrl = canvasRef.current.toDataURL('image/png');
      } catch (_) {}
    }

    const isA4 = paperFormat === 'a4';

    // Theme palette mappings for HTML print
    const borderColor = theme === 'minimal' ? '#000' : theme === 'gold' ? '#d97706' : theme === 'dark' ? '#4f46e5' : '#2563eb';
    const headerBg = theme === 'minimal' ? '#000000' : theme === 'gold' ? 'linear-gradient(135deg, #78350f, #d97706)' : theme === 'dark' ? 'linear-gradient(135deg, #1e1b4b, #4f46e5)' : 'linear-gradient(135deg, #1e3a8a, #2563eb, #3b82f6)';
    const footerBg = theme === 'minimal' ? '#000000' : theme === 'gold' ? '#451a03' : theme === 'dark' ? '#050811' : '#0f172a';
    const textColor = theme === 'dark' ? '#ffffff' : '#0f172a';
    const bodyBg = theme === 'dark' ? '#090d16' : '#ffffff';

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${headline || shop?.name || 'Shop'} - ${isA4 ? 'A4 Counter Poster' : 'Counter Standee'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: ${isA4 ? 'A4 portrait' : 'auto'};
              margin: ${isA4 ? '6mm' : '8mm'};
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: 'Hind Siliguri', 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .poster-card {
              width: 100%;
              height: 100%;
              min-height: ${isA4 ? 'calc(297mm - 14mm)' : 'auto'};
              max-height: ${isA4 ? 'calc(297mm - 14mm)' : 'auto'};
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              border: 3.5px solid ${borderColor};
              border-radius: 28px;
              overflow: hidden;
              background: ${bodyBg};
              color: ${textColor};
              box-sizing: border-box;
              text-align: center;
            }
            .header-banner {
              background: ${headerBg};
              color: #ffffff;
              padding: ${isA4 ? '26px 20px 22px' : '16px 14px'};
              position: relative;
            }
            .badge-pill {
              display: inline-block;
              background: rgba(255, 255, 255, 0.22);
              border: 1px solid rgba(255, 255, 255, 0.4);
              color: #ffffff;
              font-size: ${isA4 ? '13px' : '11px'};
              font-weight: 800;
              letter-spacing: 1.5px;
              padding: 5px 22px;
              border-radius: 9999px;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .shop-title {
              font-size: ${isA4 ? '38px' : '24px'};
              font-weight: 900;
              line-height: 1.15;
              margin-bottom: 5px;
              color: #ffffff;
            }
            .tagline {
              font-size: ${isA4 ? '18px' : '13px'};
              font-weight: 600;
              color: rgba(255, 255, 255, 0.95);
              margin-bottom: 10px;
            }
            .cam-pill {
              display: inline-block;
              background: rgba(0, 0, 0, 0.28);
              border: 1px solid rgba(255, 255, 255, 0.35);
              color: #ffffff;
              font-size: ${isA4 ? '14px' : '11px'};
              font-weight: 700;
              padding: 6px 22px;
              border-radius: 9999px;
            }
            .qr-section {
              padding: ${isA4 ? '16px 24px' : '12px'};
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .qr-box {
              position: relative;
              background: #ffffff;
              padding: 12px;
              border-radius: 24px;
              box-shadow: 0 8px 30px rgba(0,0,0,0.08);
              border: 2px solid #e2e8f0;
              display: inline-block;
            }
            .qr-box img {
              width: ${isA4 ? '310px' : '220px'};
              height: ${isA4 ? '310px' : '220px'};
              display: block;
            }
            .qr-callout {
              background: ${borderColor};
              color: #fff;
              font-size: ${isA4 ? '12px' : '10px'};
              font-weight: 800;
              letter-spacing: 1px;
              padding: 4px 18px;
              border-radius: 9999px;
              margin-bottom: 8px;
              display: inline-block;
            }
            .slug-pill {
              display: inline-block;
              background: ${theme === 'dark' ? '#1e293b' : '#f1f5f9'};
              color: ${borderColor};
              font-family: monospace;
              font-size: ${isA4 ? '17px' : '13px'};
              font-weight: 800;
              padding: 6px 24px;
              border-radius: 12px;
              border: 1.5px solid #cbd5e1;
              margin-top: 10px;
            }
            .price-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              padding: 0 ${isA4 ? '28px' : '16px'};
              margin-bottom: 12px;
            }
            .price-card {
              border-radius: 18px;
              padding: 12px 16px;
              text-align: center;
            }
            .price-card.bw {
              background: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
              border: 2px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
            }
            .price-card.color {
              background: ${theme === 'dark' ? '#1e1b4b' : '#eff6ff'};
              border: 2px solid ${theme === 'dark' ? '#4338ca' : '#bfdbfe'};
            }
            .price-tag {
              font-size: ${isA4 ? '32px' : '24px'};
              font-weight: 900;
              line-height: 1.1;
              margin: 4px 0;
            }
            .price-sub {
              font-size: ${isA4 ? '12px' : '10px'};
              color: #64748b;
              font-weight: 600;
            }
            .steps-grid {
              display: grid;
              grid-template-columns: 1fr auto 1fr auto 1fr;
              align-items: center;
              gap: 8px;
              padding: 0 ${isA4 ? '28px' : '16px'};
              margin-bottom: 10px;
            }
            .step-box {
              background: #ffffff;
              border: 1.5px solid #e2e8f0;
              border-radius: 14px;
              padding: 8px 10px;
              text-align: center;
            }
            .step-num {
              display: inline-block;
              width: 24px;
              height: 24px;
              line-height: 24px;
              border-radius: 50%;
              background: ${borderColor};
              color: #ffffff;
              font-weight: 800;
              font-size: 13px;
              margin-bottom: 4px;
            }
            .step-title {
              font-size: ${isA4 ? '13px' : '10px'};
              font-weight: 800;
              color: #0f172a;
            }
            .step-desc {
              font-size: ${isA4 ? '10px' : '8px'};
              color: #64748b;
            }
            .step-arrow {
              font-size: 18px;
              font-weight: 800;
              color: ${borderColor};
            }
            .notice-card {
              margin: 0 ${isA4 ? '28px' : '16px'} 8px;
              background: #fef3c7;
              border: 1.5px solid #fde68a;
              color: #92400e;
              border-radius: 12px;
              padding: 8px 16px;
              font-size: ${isA4 ? '14px' : '11px'};
              font-weight: 700;
            }
            .privacy-card {
              margin: 0 ${isA4 ? '28px' : '16px'} 10px;
              background: #ecfdf5;
              border: 1.5px solid #a7f3d0;
              color: #065f46;
              border-radius: 12px;
              padding: 8px 16px;
              font-size: ${isA4 ? '13px' : '10px'};
              font-weight: 700;
            }
            .footer-bar {
              background: ${footerBg};
              color: #ffffff;
              padding: ${isA4 ? '14px 20px' : '10px 14px'};
              font-size: ${isA4 ? '12px' : '10px'};
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            
            <!-- Top Header Banner -->
            <div class="header-banner">
              <div class="badge-pill">✨ ${badgeText}</div>
              <div class="shop-title">${headline || shop?.name || 'Shop'}</div>
              <div class="tagline">${tagline}</div>
              <div class="cam-pill">
                ${isPosterBn ? '📱 মোবাইল ক্যামেরা দিয়ে স্ক্যান করুন • কোনো অ্যাপ বা হোয়াটসঅ্যাপ লাগবে না' : '📱 Scan with Phone Camera • No App or WhatsApp Needed'}
              </div>
            </div>

            <!-- QR Code Hero Showcase -->
            <div class="qr-section">
              <div class="qr-callout">
                ${isPosterBn ? '📷 ক্যামেরা তাক করে স্ক্যান করুন' : '📷 POINT CAMERA TO SCAN & PRINT'}
              </div>
              <div class="qr-box">
                <img src="${qrDataUrl}" alt="QR Code" />
              </div>
              <div>
                <span class="slug-pill">🏷️ ${idLabel}: ${shop?.qr_slug || ''}</span>
              </div>
            </div>

            <!-- Dual Pricing Board -->
            ${showPrices ? `
              <div class="price-grid">
                <div class="price-card bw">
                  <div style="font-weight: 800; font-size: 13px; color: #475569;">${isPosterBn ? '🖤 সাদা-কালো প্রিন্ট' : '🖤 BLACK & WHITE'}</div>
                  <div class="price-tag" style="color: #0f172a;">৳${isPosterBn ? toBnDigits(priceBw) : priceBw}</div>
                  <div class="price-sub">${isPosterBn ? 'প্রতি পৃষ্ঠা • ঝকঝকে লেজার কোয়ালিটি' : 'per page • crisp laser quality'}</div>
                </div>
                <div class="price-card color">
                  <div style="font-weight: 800; font-size: 13px; color: ${borderColor};">${isPosterBn ? '🌈 রঙিন প্রিন্ট' : '🌈 COLOR PRINT'}</div>
                  <div class="price-tag" style="color: ${borderColor};">৳${isPosterBn ? toBnDigits(priceColor) : priceColor}</div>
                  <div class="price-sub">${isPosterBn ? 'প্রতি পৃষ্ঠা • উজ্জ্বল কালার প্রিন্ট' : 'per page • vivid high-definition'}</div>
                </div>
              </div>
            ` : ''}

            <!-- 3-Step Illustrated Guide -->
            ${showInstructions ? `
              <div class="steps-grid">
                <div class="step-box">
                  <div class="step-num">${isPosterBn ? '১' : '1'}</div>
                  <div class="step-title">${isPosterBn ? 'স্ক্যান করুন' : 'Scan QR'}</div>
                  <div class="step-desc">${isPosterBn ? 'ফোনের ক্যামেরা দিয়ে' : 'Open phone camera'}</div>
                </div>
                <div class="step-arrow">➔</div>
                <div class="step-box">
                  <div class="step-num">${isPosterBn ? '২' : '2'}</div>
                  <div class="step-title">${isPosterBn ? 'ফাইল দিন' : 'Upload'}</div>
                  <div class="step-desc">${isPosterBn ? 'PDF বা ছবি দিন' : 'Select PDF or photos'}</div>
                </div>
                <div class="step-arrow">➔</div>
                <div class="step-box">
                  <div class="step-num">${isPosterBn ? '৩' : '3'}</div>
                  <div class="step-title">${isPosterBn ? 'প্রিন্ট নিন' : 'Collect'}</div>
                  <div class="step-desc">${isPosterBn ? 'কাউন্টার থেকে প্রিন্ট' : 'Instant print ready'}</div>
                </div>
              </div>
            ` : ''}

            <!-- Custom Notice Banner -->
            ${customNotice ? `
              <div class="notice-card">📢 ${customNotice}</div>
            ` : ''}

            <!-- Privacy Trust Banner -->
            ${showPrivacyBadge ? `
              <div class="privacy-card">
                🛡️ ${isPosterBn
                  ? '১০০% সুরক্ষিত ও প্রাইভেট • কোনো হোয়াটসঅ্যাপ বা ইমেল লাগবে না • প্রিন্ট শেষে ফাইল সাথে সাথে মুছে যায়'
                  : '100% PRIVATE & SECURE • Zero WhatsApp or Gmail needed • Files auto-shred immediately after printing'}
              </div>
            ` : ''}

            <!-- Full-Width Footer Bar -->
            <div class="footer-bar">
              ${shop?.address ? `<div style="margin-bottom: 3px; font-weight: 600;">📍 ${shop.address}</div>` : ''}
              <div style="opacity: 0.85; margin-bottom: 2px;">🔒 256-Bit SSL Encrypted • Fast, Direct & Contactless Cloud Print</div>
              <div style="font-weight: 800; font-size: ${isA4 ? '13px' : '11px'};">⚡ Powered by prntez Cloud Print POS • www.prntez.com</div>
            </div>

          </div>
        </body>
      </html>
    `;

    let printFrame = document.getElementById('standee-print-frame');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'standee-print-frame';
      printFrame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(printHtml);
    doc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (_) {
        window.print();
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl flex flex-col w-full max-w-5xl lg:max-w-6xl h-[94vh] max-h-[920px] overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                {isBn ? 'শপ কাউন্টার QR পোস্টার ও স্ট্যান্ডি জেনারেটর' : 'Shop Counter QR Poster & Standee Generator'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBn ? 'ফুল A4 পেপারে প্রিন্ট উপযোগী এইচডি পোস্টার অথবা ছোট ডেস্ক স্ট্যান্ডি তৈরি করুন' : 'Download printable full A4 HD poster or desk standee with your custom branding'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition font-bold cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split into Settings (Left) and Live Standee Preview (Right) */}
        <div className="flex-1 overflow-hidden p-3 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5 bg-slate-100/60 min-h-0">
          
          {/* Left Column: Customization Controls (5 cols) */}
          <div className="md:col-span-5 space-y-3.5 text-xs overflow-y-auto max-h-full pr-1.5 custom-scrollbar">
            
            {/* Language Selector (Bangla / English) */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isBn ? 'পোস্টার / স্ট্যান্ডি ভাষা' : 'Poster & Standee Language'}</span>
                </span>
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {posterLang === 'bn' ? 'বাংলা' : 'English'}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLangChange('bn')}
                  className={`p-2 rounded-xl border text-center font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    posterLang === 'bn'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-1 ring-blue-500 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-sm">🇧🇩</span>
                  <span>বাংলা (Bangla)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLangChange('en')}
                  className={`p-2 rounded-xl border text-center font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    posterLang === 'en'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-1 ring-blue-500 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-sm">🇬🇧</span>
                  <span>English</span>
                </button>
              </div>
            </div>

            {/* Paper Size / Format Selector (Full A4 vs Standee) */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isBn ? 'কাগজের সাইজ / ফরম্যাট' : 'Paper Size & Format'}</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {paperFormat === 'a4' ? (isBn ? 'পূর্ণ A4 পেপার' : 'Full A4 Page') : (isBn ? 'ডেস্ক স্ট্যান্ডি' : 'Desk Standee')}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperFormat('a4')}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                    paperFormat === 'a4'
                      ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900 ring-1 ring-blue-500 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold flex items-center gap-1">
                    <span>📄</span>
                    <span>{isBn ? 'পূর্ণ A4 পোস্টার' : 'Full A4 Poster'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    {isBn ? 'কাউন্টার ওয়ালের জন্য A4 পেপার' : 'Fills full A4 paper edge-to-edge'}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperFormat('standee')}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                    paperFormat === 'standee'
                      ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900 ring-1 ring-blue-500 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold flex items-center gap-1">
                    <span>🏷️</span>
                    <span>{isBn ? 'ডেস্ক স্ট্যান্ডি' : 'Desk Standee'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    {isBn ? 'ছোট অ্যাক্রিলিক টেবিল স্ট্যান্ড' : 'Compact acrylic counter stand'}
                  </div>
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBn ? 'থিম ও কালার স্টাইল' : 'Standee Theme / Style'}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'modern', label: isBn ? '🔵 ওশান ব্লু' : '🔵 Ocean Blue', desc: isBn ? 'টেক ব্লু গ্রাফিক্স' : 'Tech gradient' },
                  { id: 'minimal', label: isBn ? '⚪ মিনিমাল ক্রিস্প' : '⚪ Minimal Crisp', desc: isBn ? 'হাই কনট্রাস্ট B&W' : 'High contrast B&W' },
                  { id: 'dark', label: isBn ? '🟣 নিয়ন ডার্ক' : '🟣 Neon Dark', desc: isBn ? 'মডার্ন ভায়োলেট' : 'Modern violet' },
                  { id: 'gold', label: isBn ? '🟡 ওয়ার্ম গোল্ড' : '🟡 Warm Gold', desc: isBn ? 'অ্যাম্বার কাউন্টার' : 'Amber counter' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${
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
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBn ? 'পোস্টার লেখা ও ব্র্যান্ডিং' : 'Poster Text & Branding'}</span>
              </label>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {isBn ? 'শিরোনাম (দোকানের নাম)' : 'Headline (Shop Name)'}
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {isBn ? 'ট্যাগলাইন বা স্লোগান' : 'Tagline Slogan'}
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {isBn ? 'বিশেষ নোটিশ / প্রচার' : 'Special Notice / Counter Promo'}
                </label>
                <input
                  type="text"
                  value={customNotice}
                  onChange={e => setCustomNotice(e.target.value)}
                  placeholder={isBn ? 'উদাঃ থিসিস বাইন্ডিং ও কালার প্রিন্ট পাওয়া যায়' : 'e.g. Thesis Binding & Color Printing Available'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-600 font-semibold text-[11px]">
                    {isBn ? 'B&W এবং কালার প্রিন্ট রেট দেখান' : 'Display B&W / Color Rates'}
                  </span>
                  <input
                    type="checkbox"
                    checked={showPrices}
                    onChange={e => setShowPrices(e.target.checked)}
                    className="rounded text-blue-600 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-600 font-semibold text-[11px]">
                    {isBn ? 'প্রাইভেসি গ্যারান্টি (নো হোয়াটসঅ্যাপ/অটো-ডিলিট)' : 'Show Privacy Guarantee (No WhatsApp / Auto-Delete)'}
                  </span>
                  <input
                    type="checkbox"
                    checked={showPrivacyBadge}
                    onChange={e => setShowPrivacyBadge(e.target.checked)}
                    className="rounded text-blue-600 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-600 font-semibold text-[11px]">
                    {isBn ? '৩-ধাপের নির্দেশিকা দেখান' : 'Show 3-Step Quick Guide'}
                  </span>
                  <input
                    type="checkbox"
                    checked={showInstructions}
                    onChange={e => setShowInstructions(e.target.checked)}
                    className="rounded text-blue-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Direct Copy Link & Standalone QR formats */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{isBn ? 'কাউন্টার লিঙ্ক' : 'Counter Link'}</p>
                  <p className="text-xs font-mono text-slate-700 truncate">{shopUrl}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shopUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs shrink-0 transition flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি' : 'Copy')}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={handleDownloadQrOnly}
                  className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>QR Image (PNG)</span>
                </button>
                <button
                  onClick={handleDownloadQrSvg}
                  className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
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
          <div className="md:col-span-7 flex flex-col h-full overflow-y-auto pr-1.5 custom-scrollbar bg-slate-200/50 rounded-2xl p-2.5 sm:p-3 border border-slate-200/80">
            
            <div className="w-full flex items-center justify-between mb-3 px-2 sticky top-0 bg-white/95 backdrop-blur-xs py-2 z-10 rounded-xl border border-slate-200 shadow-2xs shrink-0">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBn ? 'লাইভ প্রিভিউ (স্ক্রোল করে দেখুন)' : 'Live Preview (Scroll to view all)'}</span>
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {paperFormat === 'a4' ? 'Full A4 (210×297 mm)' : 'Compact Standee (100×150 mm)'}
              </span>
            </div>

            {/* Printable Card Area with Executive Retail Layout */}
            <div className="w-full flex justify-center pb-8 pt-1">
              <div
                ref={printAreaRef}
              className={`w-full ${paperFormat === 'a4' ? 'max-w-md' : 'max-w-sm'} rounded-3xl shadow-xl border overflow-hidden transition-all duration-200 flex flex-col ${
                theme === 'minimal'
                  ? 'bg-white border-black text-black'
                  : theme === 'dark'
                    ? 'bg-slate-900 border-indigo-700/60 text-white shadow-indigo-950/40'
                    : theme === 'gold'
                      ? 'bg-white border-amber-400 text-amber-950'
                      : 'bg-white border-blue-500 text-slate-900 shadow-blue-500/10'
              }`}
            >
              {/* Header Banner */}
              <div className={`p-4 text-center text-white ${
                theme === 'minimal'
                  ? 'bg-black'
                  : theme === 'dark'
                    ? 'bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-800'
                    : theme === 'gold'
                      ? 'bg-gradient-to-r from-amber-800 via-amber-700 to-amber-600'
                      : 'bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500'
              }`}>
                <div className="inline-block px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/20 border border-white/30 mb-1.5">
                  ✨ {badgeText}
                </div>
                <h2 className="font-extrabold tracking-tight text-xl leading-tight truncate px-2">
                  {headline || shop.name}
                </h2>
                <p className="text-[11px] mt-0.5 font-medium opacity-90 truncate px-2">
                  {tagline}
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-black/25 border border-white/25">
                  {isPosterBn ? '📱 মোবাইল ক্যামেরা দিয়ে স্ক্যান করুন' : '📱 Scan with Phone Camera • No App Needed'}
                </div>
              </div>

              {/* Body Content */}
              <div className="p-4 space-y-3">
                {/* QR Code Hero Frame with Viewfinder reticles */}
                <div className="relative p-3 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block mx-auto text-center">
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-white mb-2 bg-blue-600">
                    {isPosterBn ? '📷 ক্যামেরা তাক করুন' : '📷 POINT CAMERA TO SCAN'}
                  </div>
                  <div className="relative mx-auto inline-block p-1">
                    <canvas ref={canvasRef} className={`rounded-lg ${paperFormat === 'a4' ? 'w-44 h-44' : 'w-36 h-36'} block mx-auto`} />
                  </div>
                  <div className="mt-2">
                    <span className="px-3 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-100 text-blue-700 border border-slate-200 inline-block">
                      🏷️ {idLabel}: {shop.qr_slug}
                    </span>
                  </div>
                </div>

                {/* Dual Pricing Cards */}
                {showPrices && (
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {isPosterBn ? '🖤 সাদা-কালো' : '🖤 B&W'}
                      </span>
                      <div className="text-lg font-black text-slate-900 mt-1">
                        ৳{isPosterBn ? toBnDigits(priceBw) : priceBw}
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium">
                        {isPosterBn ? 'প্রতি পৃষ্ঠা' : 'per page'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-center">
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        {isPosterBn ? '🌈 রঙিন' : '🌈 COLOR'}
                      </span>
                      <div className="text-lg font-black text-blue-600 mt-1">
                        ৳{isPosterBn ? toBnDigits(priceColor) : priceColor}
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium">
                        {isPosterBn ? 'প্রতি পৃষ্ঠা' : 'per page'}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3-Step Illustrated Guide */}
                {showInstructions && (
                  <div className="grid grid-cols-3 gap-1.5 text-center pt-1 border-t border-slate-100">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-extrabold inline-flex items-center justify-center mb-0.5">
                        {isPosterBn ? '১' : '1'}
                      </span>
                      <div className="text-[10px] font-extrabold text-slate-800 leading-tight">
                        {isPosterBn ? 'স্ক্যান' : 'Scan'}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-extrabold inline-flex items-center justify-center mb-0.5">
                        {isPosterBn ? '২' : '2'}
                      </span>
                      <div className="text-[10px] font-extrabold text-slate-800 leading-tight">
                        {isPosterBn ? 'আপলোড' : 'Upload'}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-extrabold inline-flex items-center justify-center mb-0.5">
                        {isPosterBn ? '৩' : '3'}
                      </span>
                      <div className="text-[10px] font-extrabold text-slate-800 leading-tight">
                        {isPosterBn ? 'প্রিন্ট' : 'Collect'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Notice */}
                {customNotice && (
                  <div className="p-2 rounded-xl text-[10px] font-bold text-center bg-amber-50 text-amber-900 border border-amber-200 truncate">
                    📢 {customNotice}
                  </div>
                )}

                {/* Privacy Badge */}
                {showPrivacyBadge && (
                  <div className="p-2 rounded-xl text-[9px] font-bold text-center bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>
                      {isPosterBn
                        ? '🛡️ নো হোয়াটসঅ্যাপ • ফাইল সাথে সাথে মুছে যায়'
                        : '🛡️ Zero WhatsApp • Files Auto-Shred After Print'}
                    </span>
                  </div>
                )}
              </div>

              {/* Branded Footer Bar */}
              <div className={`p-2.5 text-center text-white mt-auto ${
                theme === 'minimal'
                  ? 'bg-black'
                  : theme === 'dark'
                    ? 'bg-slate-950'
                    : theme === 'gold'
                      ? 'bg-amber-950'
                      : 'bg-slate-900'
              }`}>
                {shop?.address && (
                  <div className="text-[9px] text-slate-300 font-medium truncate mb-0.5">
                    📍 {shop.address}
                  </div>
                )}
                <div className="text-[8px] text-slate-400">
                  🔒 256-Bit SSL Encrypted • Fast Cloud Print
                </div>
                <div className="text-[9px] font-extrabold text-white mt-0.5">
                  ⚡ Powered by prntez Cloud Print POS
                </div>
              </div>

            </div>
            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <div className="text-xs text-slate-500">
            {isBn ? 'ফরম্যাট: ' : 'Format: '}
            <strong className="text-slate-800">
              {paperFormat === 'a4'
                ? (isBn ? 'ফুল A4 পেপার পোস্টার (৩০০ DPI)' : 'Full A4 Paper Poster (300 DPI)')
                : (isBn ? 'কমপ্যাক্ট ডেস্ক স্ট্যান্ডি' : 'Compact Desk Standee')}
              {' • '}
              {posterLang === 'bn' ? 'বাংলা' : 'English'}
            </strong>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* 1-Click Print Direct / Save A4 PDF */}
            <button
              onClick={handleDirectPrint}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              title={paperFormat === 'a4' ? 'Print or Save Full A4 PDF' : 'Print Standee'}
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>
                {paperFormat === 'a4'
                  ? (isBn ? 'A4 পেপারে প্রিন্ট / PDF' : 'Print / Save A4 PDF')
                  : (isBn ? 'স্ট্যান্ডি প্রিন্ট করুন' : 'Print Standee')}
              </span>
            </button>

            {/* Download Ultra HD Poster (PNG) */}
            <button
              onClick={handleDownloadPoster}
              disabled={generating}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {generating
                  ? (isBn ? 'তৈরি হচ্ছে...' : 'Generating HD...')
                  : paperFormat === 'a4'
                    ? (isBn ? 'A4 পোস্টার ডাউনলোড (PNG)' : 'Download A4 Poster (PNG)')
                    : (isBn ? 'স্ট্যান্ডি ডাউনলোড (PNG)' : 'Download Standee (PNG)')}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
