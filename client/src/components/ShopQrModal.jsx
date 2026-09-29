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

  // 1. Download High-Resolution Standee / Poster (PNG)
  const handleDownloadPoster = async () => {
    setGenerating(true);
    setDownloadSuccess('');

    try {
      const posterCanvas = document.createElement('canvas');
      const isA4 = paperFormat === 'a4';
      // 300 DPI A4 is 2480 x 3508 pixels, compact standee is 1200 x 1600
      posterCanvas.width = isA4 ? 2480 : 1200;
      posterCanvas.height = isA4 ? 3508 : 1600;
      const ctx = posterCanvas.getContext('2d');
      const W = posterCanvas.width;
      const H = posterCanvas.height;

      // Theme color palettes
      let bgGradient, cardBg, textPrimary, textSecondary, accentColor, qrDark, qrLight, badgeBg;

      if (theme === 'minimal') {
        bgGradient = '#ffffff';
        cardBg = '#ffffff';
        textPrimary = '#000000';
        textSecondary = '#4b5563';
        accentColor = '#000000';
        qrDark = '#000000';
        qrLight = '#ffffff';
        badgeBg = '#000000';
      } else if (theme === 'dark') {
        bgGradient = '#090d16';
        cardBg = '#131b2e';
        textPrimary = '#ffffff';
        textSecondary = '#94a3b8';
        accentColor = '#818cf8';
        qrDark = '#ffffff';
        qrLight = '#131b2e';
        badgeBg = '#4f46e5';
      } else if (theme === 'gold') {
        bgGradient = '#fffbeb';
        cardBg = '#ffffff';
        textPrimary = '#78350f';
        textSecondary = '#92400e';
        accentColor = '#d97706';
        qrDark = '#78350f';
        qrLight = '#ffffff';
        badgeBg = '#d97706';
      } else {
        // Modern Blue
        bgGradient = '#f0f7ff';
        cardBg = '#ffffff';
        textPrimary = '#0f172a';
        textSecondary = '#475569';
        accentColor = '#2563eb';
        qrDark = '#1e3a8a';
        qrLight = '#ffffff';
        badgeBg = '#2563eb';
      }

      // Background fill
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, W, H);

      const fontBengali = '"Hind Siliguri", "Noto Sans Bengali", sans-serif';

      if (isA4) {
        // FULL A4 POSTER LAYOUT (2480 x 3508)
        // Outer decorative border
        ctx.strokeStyle = theme === 'minimal' ? '#000000' : theme === 'dark' ? '#334155' : theme === 'gold' ? '#f59e0b' : '#3b82f6';
        ctx.lineWidth = 14;
        roundRect(ctx, 40, 40, W - 80, H - 80, 50);
        ctx.stroke();

        // Inner Card Box
        ctx.fillStyle = cardBg;
        roundRect(ctx, 60, 60, W - 120, H - 120, 44);
        ctx.fill();

        // Top Header Banner
        if (theme === 'modern') {
          const gradient = ctx.createLinearGradient(0, 0, W, 380);
          gradient.addColorStop(0, '#2563eb');
          gradient.addColorStop(1, '#1d4ed8');
          ctx.fillStyle = gradient;
          roundRect(ctx, 60, 60, W - 120, 320, 44);
          ctx.fill();
        } else if (theme === 'dark') {
          const gradient = ctx.createLinearGradient(0, 0, W, 380);
          gradient.addColorStop(0, '#4f46e5');
          gradient.addColorStop(1, '#312e81');
          ctx.fillStyle = gradient;
          roundRect(ctx, 60, 60, W - 120, 320, 44);
          ctx.fill();
        } else if (theme === 'gold') {
          const gradient = ctx.createLinearGradient(0, 0, W, 380);
          gradient.addColorStop(0, '#d97706');
          gradient.addColorStop(1, '#b45309');
          ctx.fillStyle = gradient;
          roundRect(ctx, 60, 60, W - 120, 320, 44);
          ctx.fill();
        }

        // Top Badge
        ctx.fillStyle = theme === 'minimal' ? '#000000' : '#ffffff';
        ctx.font = `bold 48px ${fontBengali}`;
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, W / 2, theme === 'minimal' ? 180 : 250);

        // Shop Title
        ctx.fillStyle = textPrimary;
        ctx.font = `900 98px ${fontBengali}`;
        ctx.textAlign = 'center';
        ctx.fillText(headline || shop.name, W / 2, 540);

        // Tagline
        ctx.fillStyle = textSecondary;
        ctx.font = `600 52px ${fontBengali}`;
        ctx.fillText(tagline, W / 2, 630);

        // Draw Big QR Code
        const qrTempCanvas = document.createElement('canvas');
        const renderQR = QRCodeLib?.toCanvas || window.QRCode?.toCanvas;
        if (renderQR) {
          await new Promise((resolve) => {
            renderQR(
              qrTempCanvas,
              shopUrl,
              {
                width: 900,
                margin: 2,
                color: { dark: qrDark, light: qrLight }
              },
              () => resolve()
            );
          });
        }

        const qrY = 740;
        // White border box for QR
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 30;
        roundRect(ctx, (W - 960) / 2, qrY - 20, 960, 960, 40);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.drawImage(qrTempCanvas, (W - 900) / 2, qrY + 10, 900, 900);

        // Counter ID Pill
        ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#eff6ff';
        roundRect(ctx, (W - 740) / 2, 1780, 740, 100, 50);
        ctx.fill();
        ctx.fillStyle = accentColor;
        ctx.font = `bold 46px monospace`;
        ctx.fillText(`${idLabel}: ${shop.qr_slug || ''}`, W / 2, 1848);

        // Rates Pill
        let curY = 1940;
        if (showPrices) {
          ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#eff6ff';
          roundRect(ctx, 160, curY, W - 320, 140, 36);
          ctx.fill();

          ctx.fillStyle = textPrimary;
          ctx.font = `bold 56px ${fontBengali}`;
          ctx.fillText(ratesText, W / 2, curY + 92);
          curY += 180;
        }

        // Privacy Guarantee
        if (showPrivacyBadge) {
          ctx.fillStyle = theme === 'dark' ? '#064e3b' : '#ecfdf5';
          roundRect(ctx, 160, curY, W - 320, 130, 32);
          ctx.fill();

          ctx.fillStyle = theme === 'dark' ? '#34d399' : '#047857';
          ctx.font = `bold 44px ${fontBengali}`;
          ctx.fillText(privacyText, W / 2, curY + 82);
          curY += 170;
        }

        // Custom Notice
        if (customNotice) {
          ctx.fillStyle = theme === 'dark' ? '#312e81' : '#fef3c7';
          roundRect(ctx, 160, curY, W - 320, 130, 32);
          ctx.fill();

          ctx.fillStyle = theme === 'dark' ? '#c7d2fe' : '#92400e';
          ctx.font = `700 44px ${fontBengali}`;
          ctx.fillText('📢 ' + customNotice, W / 2, curY + 82);
          curY += 170;
        }

        // 3-Step Instructions
        if (showInstructions) {
          ctx.fillStyle = textSecondary;
          ctx.font = `bold 44px ${fontBengali}`;
          ctx.fillText(stepsText, W / 2, curY + 70);
        }

        // Footer
        ctx.fillStyle = textSecondary;
        ctx.font = `36px ${fontBengali}`;
        ctx.fillText(footerText, W / 2, H - 120);

      } else {
        // COMPACT STANDEE LAYOUT (1200 x 1600)
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
        ctx.font = `bold 36px ${fontBengali}`;
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, 600, theme === 'minimal' ? 80 : 100);

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
        ctx.font = `800 58px ${fontBengali}`;
        ctx.textAlign = 'center';
        ctx.fillText(headline || shop.name, 600, theme === 'minimal' ? 220 : 310);

        // Tagline
        ctx.fillStyle = textSecondary;
        ctx.font = `500 30px ${fontBengali}`;
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
        roundRect(ctx, 400, qrY + 540, 400, 56, 28);
        ctx.fill();
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`${idLabel}: ${shop.qr_slug || ''}`, 600, qrY + 576);

        // Prices Pill Grid (Optional)
        let curY = qrY + 630;
        if (showPrices) {
          ctx.fillStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
          roundRect(ctx, 160, curY, 880, 80, 24);
          ctx.fill();

          ctx.fillStyle = textPrimary;
          ctx.font = `bold 30px ${fontBengali}`;
          ctx.fillText(ratesText, 600, curY + 52);
          curY += 110;
        }

        // Custom Slogan / Notice (Optional)
        if (customNotice) {
          ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#fef3c7';
          roundRect(ctx, 160, curY, 880, 70, 20);
          ctx.fill();

          ctx.fillStyle = theme === 'dark' ? '#fde68a' : '#92400e';
          ctx.font = `600 24px ${fontBengali}`;
          ctx.fillText('📢 ' + customNotice, 600, curY + 44);
          curY += 100;
        }

        // Privacy Guarantee (Optional)
        if (showPrivacyBadge) {
          ctx.fillStyle = theme === 'dark' ? '#064e3b' : '#ecfdf5';
          roundRect(ctx, 160, curY, 880, 68, 20);
          ctx.fill();

          ctx.fillStyle = theme === 'dark' ? '#34d399' : '#047857';
          ctx.font = `bold 23px ${fontBengali}`;
          ctx.fillText(privacyText, 600, curY + 43);
          curY += 95;
        }

        // 3-Step Instructions
        if (showInstructions) {
          ctx.fillStyle = textSecondary;
          ctx.font = `bold 22px ${fontBengali}`;
          ctx.fillText(stepsText, 600, curY + 40);
        }

        // Footer URL / Address
        ctx.fillStyle = textSecondary;
        ctx.font = `20px ${fontBengali}`;
        ctx.fillText(footerText, 600, 1560);
      }

      // Trigger Download with Blob
      posterCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const formatTag = isA4 ? 'A4_Poster' : 'Desk_Standee';
          const langTag = isPosterBn ? 'Bangla' : 'English';
          link.download = `${(shop.name || 'Shop').replace(/\s+/g, '_')}_${formatTag}_${langTag}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          setDownloadSuccess(
            isBn
              ? `${isA4 ? 'পূর্ণ A4 পোস্টার' : 'ডেস্ক স্ট্যান্ডি'} (${langTag}) সফলভাবে ডাউনলোড হয়েছে!`
              : `${isA4 ? 'Full A4 Poster' : 'Desk Standee'} (${langTag}) Downloaded!`
          );
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
    const borderColor = theme === 'minimal' ? '#000' : theme === 'gold' ? '#f59e0b' : theme === 'dark' ? '#334155' : '#3b82f6';
    const bgColor = theme === 'dark' ? '#0f172a' : theme === 'gold' ? '#fffbeb' : '#ffffff';
    const textColor = theme === 'dark' ? '#ffffff' : '#0f172a';
    const badgeBg = theme === 'minimal' ? '#000' : theme === 'gold' ? '#d97706' : theme === 'dark' ? '#4f46e5' : '#2563eb';
    const taglineColor = theme === 'dark' ? '#94a3b8' : '#475569';
    const qrBorderColor = theme === 'dark' ? '#334155' : '#cbd5e1';
    const slugBg = theme === 'dark' ? '#1e293b' : '#eff6ff';
    const slugColor = theme === 'dark' ? '#818cf8' : '#1d4ed8';
    const ratesBg = theme === 'dark' ? '#1e293b' : '#eff6ff';
    const ratesColor = theme === 'dark' ? '#f8fafc' : '#1e3a8a';
    const ratesBorder = theme === 'dark' ? '#334155' : '#bfdbfe';
    const privacyBg = theme === 'dark' ? '#064e3b' : '#ecfdf5';
    const privacyColor = theme === 'dark' ? '#6ee7b7' : '#065f46';
    const privacyBorder = theme === 'dark' ? '#047857' : '#a7f3d0';
    const noticeBg = theme === 'dark' ? '#312e81' : '#fef3c7';
    const noticeColor = theme === 'dark' ? '#c7d2fe' : '#92400e';
    const noticeBorder = theme === 'dark' ? '#4338ca' : '#fde68a';
    const stepsColor = theme === 'dark' ? '#94a3b8' : '#475569';
    const footerColor = theme === 'dark' ? '#64748b' : '#64748b';

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${headline || shop?.name || 'Shop'} - ${isA4 ? 'A4 Counter Poster' : 'Counter Standee'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: ${isA4 ? 'A4 portrait' : 'auto'};
              margin: ${isA4 ? '6mm' : '10mm'};
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
            ${isA4 ? `
              .poster-card {
                width: 100%;
                height: 100%;
                min-height: calc(297mm - 14mm);
                max-height: calc(297mm - 14mm);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                border: 4px solid ${borderColor};
                border-radius: 28px;
                padding: 24px 32px;
                text-align: center;
                background: ${bgColor};
                color: ${textColor};
                box-sizing: border-box;
              }
              .badge {
                display: inline-block;
                background: ${badgeBg};
                color: #fff;
                font-size: 15px;
                font-weight: 800;
                letter-spacing: 2px;
                padding: 6px 26px;
                border-radius: 9999px;
                text-transform: uppercase;
                margin-bottom: 8px;
              }
              .shop-title {
                font-size: 38px;
                font-weight: 900;
                line-height: 1.15;
                margin-bottom: 6px;
              }
              .tagline {
                font-size: 19px;
                font-weight: 600;
                color: ${taglineColor};
                margin-bottom: 12px;
              }
              .qr-box {
                display: inline-block;
                padding: 12px;
                background: #fff;
                border: 2px solid ${qrBorderColor};
                border-radius: 22px;
                margin-bottom: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.06);
              }
              .qr-box img {
                width: 320px;
                height: 320px;
                display: block;
              }
              .slug-pill {
                display: inline-block;
                background: ${slugBg};
                color: ${slugColor};
                font-family: monospace;
                font-size: 16px;
                font-weight: 800;
                padding: 6px 22px;
                border-radius: 10px;
                margin-bottom: 12px;
              }
              .rates-pill {
                width: 100%;
                max-width: 600px;
                margin: 0 auto 8px auto;
                background: ${ratesBg};
                color: ${ratesColor};
                border: 1.5px solid ${ratesBorder};
                font-size: 20px;
                font-weight: 800;
                padding: 10px 20px;
                border-radius: 14px;
              }
              .privacy-pill {
                width: 100%;
                max-width: 600px;
                margin: 0 auto 8px auto;
                background: ${privacyBg};
                color: ${privacyColor};
                border: 1.5px solid ${privacyBorder};
                font-size: 15px;
                font-weight: 800;
                padding: 8px 16px;
                border-radius: 12px;
              }
              .notice-pill {
                width: 100%;
                max-width: 600px;
                margin: 0 auto 8px auto;
                background: ${noticeBg};
                color: ${noticeColor};
                border: 1.5px solid ${noticeBorder};
                font-size: 15px;
                font-weight: 700;
                padding: 8px 16px;
                border-radius: 12px;
              }
              .steps {
                font-size: 15px;
                font-weight: 700;
                color: ${stepsColor};
                margin-top: 8px;
                line-height: 1.35;
              }
              .address {
                font-size: 13px;
                color: ${footerColor};
                margin-top: 6px;
              }
            ` : `
              .poster-card {
                width: 100%;
                max-width: 380px;
                border: 2px solid ${borderColor};
                border-radius: 28px;
                padding: 24px;
                text-align: center;
                background: ${bgColor};
                color: ${textColor};
                box-shadow: 0 4px 20px rgba(0,0,0,0.05);
              }
              .badge {
                display: inline-block;
                background: ${badgeBg};
                color: #fff;
                font-size: 10px;
                font-weight: 800;
                letter-spacing: 2px;
                padding: 4px 14px;
                border-radius: 9999px;
                text-transform: uppercase;
                margin-bottom: 12px;
              }
              .shop-title {
                font-size: 22px;
                font-weight: 800;
                margin-bottom: 4px;
              }
              .tagline {
                font-size: 12px;
                color: ${taglineColor};
                margin-bottom: 14px;
              }
              .qr-box {
                display: inline-block;
                padding: 10px;
                background: #fff;
                border: 1px solid ${qrBorderColor};
                border-radius: 16px;
                margin-bottom: 12px;
              }
              .qr-box img {
                width: 190px;
                height: 190px;
                display: block;
              }
              .slug-pill {
                display: inline-block;
                background: ${slugBg};
                color: ${slugColor};
                font-family: monospace;
                font-size: 12px;
                font-weight: 700;
                padding: 4px 14px;
                border-radius: 8px;
                margin-bottom: 10px;
              }
              .rates-pill {
                background: ${ratesBg};
                color: ${ratesColor};
                font-size: 11px;
                font-weight: 700;
                padding: 7px 12px;
                border-radius: 10px;
                margin-bottom: 7px;
              }
              .privacy-pill {
                background: ${privacyBg};
                color: ${privacyColor};
                border: 1px solid ${privacyBorder};
                font-size: 10px;
                font-weight: 700;
                padding: 6px 10px;
                border-radius: 10px;
                margin-bottom: 7px;
              }
              .notice-pill {
                background: ${noticeBg};
                color: ${noticeColor};
                border: 1px solid ${noticeBorder};
                font-size: 10px;
                font-weight: 600;
                padding: 6px 10px;
                border-radius: 10px;
                margin-bottom: 7px;
              }
              .steps {
                font-size: 10px;
                color: ${stepsColor};
                margin-top: 8px;
              }
              .address {
                font-size: 9px;
                color: ${footerColor};
                margin-top: 6px;
              }
            `}
          </style>
        </head>
        <body>
          <div class="poster-card">
            <div>
              <div class="badge">${badgeText}</div>
              <div class="shop-title">${headline || shop?.name || 'Shop'}</div>
              <div class="tagline">${tagline}</div>
            </div>
            <div>
              <div class="qr-box">
                <img src="${qrDataUrl}" alt="QR Code" />
              </div>
              <div><span class="slug-pill">${idLabel}: ${shop?.qr_slug || ''}</span></div>
            </div>
            <div style="width: 100%;">
              ${showPrices ? `<div class="rates-pill">${ratesText}</div>` : ''}
              ${showPrivacyBadge ? `<div class="privacy-pill">${privacyText}</div>` : ''}
              ${customNotice ? `<div class="notice-pill">📢 ${customNotice}</div>` : ''}
              ${showInstructions ? `<div class="steps">${stepsText}</div>` : ''}
              <div class="address">${footerText}</div>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-100/60">
          
          {/* Left Column: Customization Controls (5 cols) */}
          <div className="md:col-span-5 space-y-3.5 text-xs">
            
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
          <div className="md:col-span-7 flex flex-col items-center justify-center">
            
            <div className="w-full flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBn ? 'লাইভ প্রিভিউ' : 'Live Preview'}</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {paperFormat === 'a4' ? 'Full A4 (210×297 mm)' : 'Compact Standee (100×150 mm)'}
              </span>
            </div>

            {/* Printable Card Area */}
            <div
              ref={printAreaRef}
              className={`w-full ${paperFormat === 'a4' ? 'max-w-md p-6 sm:p-7' : 'max-w-sm p-6'} rounded-3xl shadow-xl border text-center transition-all duration-200 ${
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
              <div className="mb-2.5">
                <span className={`px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                  theme === 'minimal'
                    ? 'bg-black text-white'
                    : theme === 'dark'
                      ? 'bg-indigo-600 text-white'
                      : theme === 'gold'
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                }`}>
                  {badgeText}
                </span>
              </div>

              {/* Shop Headline */}
              <h2 className={`font-extrabold tracking-tight truncate leading-tight ${paperFormat === 'a4' ? 'text-2xl' : 'text-xl'}`}>
                {headline || shop.name}
              </h2>
              <p className={`text-xs mt-1 font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {tagline}
              </p>

              {/* QR Code Canvas */}
              <div className="my-3.5 p-3 bg-white rounded-2xl shadow-inner border border-slate-200/80 inline-block mx-auto">
                <canvas ref={canvasRef} className={`rounded-lg ${paperFormat === 'a4' ? 'w-52 h-52' : 'w-44 h-44'} block mx-auto`} />
              </div>

              {/* Slug Code */}
              <div className="mb-2.5">
                <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                  theme === 'dark' ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-blue-700'
                }`}>
                  {idLabel}: {shop.qr_slug}
                </span>
              </div>

              {/* Rates Pill */}
              {showPrices && (
                <div className={`p-2 rounded-xl text-xs font-bold mb-2 ${
                  theme === 'dark' ? 'bg-slate-800/90 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}>
                  {ratesText}
                </div>
              )}

              {/* Privacy Motto Pill */}
              {showPrivacyBadge && (
                <div className={`p-2 rounded-xl text-[10px] font-bold mb-2 flex items-center justify-center gap-1.5 ${
                  theme === 'dark'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{privacyText}</span>
                </div>
              )}

              {/* Custom Notice */}
              {customNotice && (
                <div className={`p-2 rounded-xl text-[11px] font-semibold mb-2 ${
                  theme === 'dark' ? 'bg-indigo-950/60 text-indigo-200 border border-indigo-800/40' : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}>
                  📢 {customNotice}
                </div>
              )}

              {/* Instructions */}
              {showInstructions && (
                <p className={`text-[10px] leading-tight font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stepsText}
                </p>
              )}

              {/* Footer */}
              <p className={`text-[9px] mt-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {footerText}
              </p>
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
