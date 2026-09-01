import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, FileText, Image as ImageIcon, Trash2, Plus, Minus, CheckCircle,
  Store, Sparkles, ArrowRight, Loader2, Info, Clipboard, Settings2, RefreshCw,
  ChevronDown, MessageCircle, Clock, CreditCard, Copy, Check, History, Percent,
  AlertTriangle, Phone
} from 'lucide-react';
import GoogleAdSense from '../components/GoogleAdSense';

export default function CustomerUpload({ onJobCreated, initialSlug }) {
  const [shop, setShop] = useState(null);
  const [availableShops, setAvailableShops] = useState([]);
  const [showShopPicker, setShowShopPicker] = useState(false);
  const [loadingShop, setLoadingShop] = useState(true);
  const [files, setFiles] = useState([]);
  const [fileConfigs, setFileConfigs] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [globalNotes, setGlobalNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'bkash' | 'nagad'
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [showRecentOrders, setShowRecentOrders] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [customerAd, setCustomerAd] = useState(null);
  const [adsenseConfig, setAdsenseConfig] = useState(null);
  const fileInputRef = useRef(null);

  // 1. Initial Load: Restore Returning Customer Info & Recent Orders
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('prntez_cust_name');
      const savedPhone = localStorage.getItem('prntez_cust_phone');
      const savedOrders = localStorage.getItem('prntez_customer_orders');
      if (savedName) setCustomerName(savedName);
      if (savedPhone) setCustomerPhone(savedPhone);
      if (savedOrders) setRecentOrders(JSON.parse(savedOrders));
    } catch (_) {}

    const urlParams = new URLSearchParams(window.location.search);
    const slug = initialSlug || urlParams.get('shop');

    fetchPublicShops(slug);

    // Fetch platform promos / ads & adsense
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.customerAd?.enabled) setCustomerAd(data.customerAd);
          if (data.adsense?.enabled) setAdsenseConfig(data.adsense);
        }
      })
      .catch(() => {});
  }, [initialSlug]);

  const fetchPublicShops = async (targetSlug) => {
    setLoadingShop(true);
    setError('');
    try {
      if (targetSlug) {
        const res = await fetch(`/api/shops/by-slug/${targetSlug}`);
        const data = await res.json();
        if (data.success && data.shop) {
          setShop(data.shop);
          setLoadingShop(false);
          return;
        }
      }

      // Fallback: Fetch all active public shops
      const resPub = await fetch('/api/shops/public');
      const dataPub = await resPub.json();
      if (dataPub.success && dataPub.shops && dataPub.shops.length > 0) {
        setAvailableShops(dataPub.shops);
        // Default to first active shop
        setShop(dataPub.shops[0]);
      } else {
        setError('No active print shops found. Please scan the QR code at the shop counter.');
      }
    } catch (_) {
      setError('Unable to connect to print server.');
    } finally {
      setLoadingShop(false);
    }
  };

  // 2. Clipboard Paste Handler (Ctrl + V to attach screenshots/copied images)
  useEffect(() => {
    const handlePaste = (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.items) return;

      const pastedFiles = [];
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `Pasted_Image_${timestamp}.png`, { type: blob.type });
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        handleFileSelect(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [files, fileConfigs]);

  // 3. Analyze PDF Pages & Auto-Detect Paper Size (Feature 8)
  const analyzePdf = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) return { pages: 1, paperSize: 'A4' };
    try {
      if (window.pdfjsLib) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let detectedSize = 'A4';

        try {
          const firstPage = await pdf.getPage(1);
          const vp = firstPage.getViewport({ scale: 1 });
          const maxDim = Math.max(vp.width, vp.height);
          const minDim = Math.min(vp.width, vp.height);

          // A3 Standard: approx 842 x 1191 pt
          // Legal Standard: approx 612 x 1008 pt (8.5 x 14 in)
          // A4 Standard: approx 595 x 842 pt
          if (maxDim > 1150 || minDim > 820) {
            detectedSize = 'A3';
          } else if (maxDim >= 950 && minDim <= 680) {
            detectedSize = 'Legal';
          }
        } catch (_) {}

        return { pages: pdf.numPages || 1, paperSize: detectedSize };
      }
    } catch (e) {
      console.warn('PDF analysis skipped:', e);
    }
    return { pages: 1, paperSize: 'A4' };
  };

  const handleFileSelect = async (selectedFiles) => {
    const validFiles = Array.from(selectedFiles);
    if (validFiles.length === 0) return;

    const newFiles = [...files, ...validFiles];
    const newConfigs = [...fileConfigs];

    for (const f of validFiles) {
      const { pages, paperSize } = await analyzePdf(f);
      newConfigs.push({
        copies: 1,
        color_mode: 'bw',
        paper_size: paperSize,
        sides: 'single',
        page_count: pages,
        auto_detected_paper: paperSize !== 'A4' ? paperSize : null,
        notes: ''
      });
    }

    setFiles(newFiles);
    setFileConfigs(newConfigs);
    setError('');
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setFileConfigs(fileConfigs.filter((_, i) => i !== index));
  };

  const updateConfig = (index, key, val) => {
    const updated = [...fileConfigs];
    updated[index][key] = val;
    setFileConfigs(updated);
  };

  // 4. Batch Preset Action: Apply Settings to ALL files
  const applyPresetToAll = (action) => {
    if (fileConfigs.length === 0) return;
    const updated = fileConfigs.map(cfg => {
      switch (action) {
        case 'bw': return { ...cfg, color_mode: 'bw' };
        case 'color': return { ...cfg, color_mode: 'color' };
        case 'duplex': return { ...cfg, sides: 'double' };
        case 'simplex': return { ...cfg, sides: 'single' };
        case 'reset_copies': return { ...cfg, copies: 1 };
        default: return cfg;
      }
    });
    setFileConfigs(updated);
  };

  // 5. Calculate live dynamic total price & Bulk Discount (Feature 7)
  const calculatePricing = () => {
    if (!shop) return { subtotal: 0, discount: 0, total: 0, discountPercent: 0, totalPages: 0 };
    const bwRate = parseFloat(shop.price_bw) || 2.0;
    const colorRate = parseFloat(shop.price_color) || 10.0;
    const legalExtra = parseFloat(shop.price_legal) || 0.0;
    const a3Extra = parseFloat(shop.price_a3) || 5.0;

    let subtotal = 0;
    let totalPages = 0;

    fileConfigs.forEach(cfg => {
      let rate = cfg.color_mode === 'color' ? colorRate : bwRate;
      if (cfg.paper_size === 'Legal') rate += legalExtra;
      if (cfg.paper_size === 'A3') rate += a3Extra;
      const copies = cfg.copies || 1;
      const pages = cfg.page_count || 1;
      subtotal += rate * copies * pages;
      totalPages += copies * pages;
    });

    // Discount tiers
    const minPages1 = parseInt(shop.discount_min_pages, 10) || 50;
    const pct1 = parseFloat(shop.discount_percent) || 10;
    const minPages2 = parseInt(shop.discount_tier2_pages, 10) || 100;
    const pct2 = parseFloat(shop.discount_tier2_percent) || 15;

    let discount = 0;
    let discountPercent = 0;

    if (totalPages >= minPages2 && pct2 > 0) {
      discountPercent = pct2;
      discount = (subtotal * pct2) / 100.0;
    } else if (totalPages >= minPages1 && pct1 > 0) {
      discountPercent = pct1;
      discount = (subtotal * pct1) / 100.0;
    }

    const total = Math.max(0, subtotal - discount);

    return { subtotal, discount, total, discountPercent, totalPages };
  };

  const { subtotal, discount, total, discountPercent, totalPages } = calculatePricing();

  // Check if shop is currently open / closed (Feature 3)
  const isShopCurrentlyClosed = () => {
    if (!shop) return false;
    if (shop.is_closed) return true;
    if (shop.opening_time && shop.closing_time) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [oH, oM] = shop.opening_time.split(':').map(Number);
      const [cH, cM] = shop.closing_time.split(':').map(Number);
      const openMinutes = oH * 60 + (oM || 0);
      const closeMinutes = cH * 60 + (cM || 0);

      if (openMinutes < closeMinutes) {
        if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) return true;
      }
    }
    return false;
  };

  const isClosed = isShopCurrentlyClosed();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please attach at least one document or image.');
      return;
    }
    if (!shop) {
      setError('Invalid print shop selected.');
      return;
    }

    setUploading(true);
    setUploadProgress(20);
    setError('');

    // Save returning customer details (Feature 5)
    try {
      if (customerName.trim()) localStorage.setItem('prntez_cust_name', customerName.trim());
      if (customerPhone.trim()) localStorage.setItem('prntez_cust_phone', customerPhone.trim());
    } catch (_) {}

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('shop_id', shop.id);
      formData.append('customer_name', customerName.trim() || 'Guest Customer');
      formData.append('customer_phone', customerPhone.trim() || '');
      formData.append('global_notes', globalNotes.trim() || '');
      formData.append('payment_method', paymentMethod);
      formData.append('payment_trx_id', paymentTrxId.trim());
      formData.append('file_configs', JSON.stringify(fileConfigs));

      setUploadProgress(65);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      setUploadProgress(100);

      if (data.success) {
        // Save Order to Local History for Returning Customer (Feature 5)
        try {
          const newOrderEntry = {
            jobCode: data.job_code,
            shopName: shop.name,
            total: total,
            totalPages: totalPages,
            date: new Date().toLocaleDateString()
          };
          const existing = JSON.parse(localStorage.getItem('prntez_customer_orders') || '[]');
          const updated = [newOrderEntry, ...existing.filter(x => x.jobCode !== data.job_code)].slice(0, 10);
          localStorage.setItem('prntez_customer_orders', JSON.stringify(updated));
        } catch (_) {}

        if (onJobCreated) {
          onJobCreated(data.job_code);
        } else {
          window.location.href = `/track/${data.job_code}`;
        }
      } else {
        setError(data.error || 'Upload failed. Please try again.');
        setUploading(false);
      }
    } catch (err) {
      setError('Network error during upload. Please check your connection.');
      setUploading(false);
    }
  };

  if (loadingShop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600">Connecting to Print Counter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 pb-36 pt-6 px-4 sm:px-6 lg:px-8">
      
      {/* Uploading Time Modal with AdSense Space */}
      {uploading && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <UploadCloud className="w-8 h-8 animate-bounce text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Sending Files to Print Counter...</h3>
              <p className="text-xs text-slate-500 mt-1">Please wait while your documents are encrypted and uploaded</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>Uploading {files.length} document(s)</span>
              <span className="text-blue-600">{uploadProgress}%</span>
            </div>

            {/* Google AdSense / Sponsor Space During Upload Time */}
            {adsenseConfig?.enabled && (
              <div className="pt-2 border-t border-slate-100">
                <GoogleAdSense
                  client={adsenseConfig.clientId}
                  slot={adsenseConfig.slotCustomerUploading || adsenseConfig.slotCustomerBottom}
                  format="rectangle"
                  className="my-0"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* Returning Customer Recent Orders Drawer (Feature 5) */}
        {recentOrders.length > 0 && (
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-700">Recent Orders ({recentOrders.length})</span>
            </div>
            <button
              onClick={() => setShowRecentOrders(s => !s)}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <span>{showRecentOrders ? 'Hide Orders' : 'View Past Tokens'}</span>
              <ChevronDown className={`w-3 h-3 transition ${showRecentOrders ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {showRecentOrders && recentOrders.length > 0 && (
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-1.5 animate-in fade-in text-xs">
            {recentOrders.map((o, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-100 flex items-center justify-between transition">
                <div>
                  <span className="font-extrabold text-blue-600 font-mono text-sm">#{o.jobCode}</span>
                  <span className="text-slate-500 text-[11px] ml-2 font-medium">{o.shopName} · {o.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">৳{parseFloat(o.total || 0).toFixed(2)}</span>
                  <a
                    href={`/track/${o.jobCode}`}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition"
                  >
                    Track →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Operating Hours Alert (Feature 3) */}
        {isClosed && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs text-rose-900">Print Shop is Currently Closed</h4>
              <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                Operating hours are <strong>{shop?.opening_time || '08:00 AM'} to {shop?.closing_time || '10:00 PM'}</strong>. You can still upload files now — your order will be prioritized first when the counter opens!
              </p>
            </div>
          </div>
        )}

        {/* Shop Info Card + Change Shop Modal Trigger */}
        {shop && (
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Printing at</span>
                  {availableShops.length > 1 && (
                    <button
                      onClick={() => setShowShopPicker(true)}
                      className="text-[10px] text-slate-500 hover:text-blue-600 font-bold underline flex items-center gap-0.5"
                    >
                      Change Shop <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  )}
                  <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${!isClosed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {!isClosed ? '● Open Now' : '● Closed'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-800 leading-tight">{shop.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{shop.address || 'Counter Print Service'}</p>
              </div>
            </div>

            <div className="text-right hidden sm:flex flex-col items-end gap-1">
              <div className="text-xs font-bold text-slate-700">
                B&W: ৳{shop.price_bw} · Color: ৳{shop.price_color}
              </div>
              {shop.phone && (
                <a
                  href={`https://wa.me/${shop.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${shop.name}, I have a question about printing at your counter.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp Shop</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Shop Selector Dropdown Modal */}
        {showShopPicker && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">Select Print Shop</h3>
                <button
                  onClick={() => setShowShopPicker(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >Close ✕</button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableShops.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setShop(s);
                      setShowShopPicker(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                      shop?.id === s.id
                        ? 'border-blue-500 bg-blue-50/50 font-bold text-blue-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold">{s.name}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{s.address || 'Dhaka'} · B&W ৳{s.price_bw}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Ad / Promo / Counter Notice Space */}
        {(customerAd?.text || shop?.counter_notice) && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/60 rounded-2xl p-3.5 flex items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[10px] tracking-wider uppercase shrink-0 shadow-xs">
                {customerAd?.badge || '📢 NOTICE'}
              </span>
              <p className="text-xs font-medium text-slate-800 leading-snug">
                {customerAd?.text || shop?.counter_notice}
              </p>
            </div>
            {customerAd?.link && (
              <a
                href={customerAd.link}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] shrink-0 transition"
              >
                View Offer →
              </a>
            )}
          </div>
        )}

        {/* Upload & Drag/Drop Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setIsDragOver(false);
            handleFileSelect(e.dataTransfer.files);
          }}
          className={`bg-white rounded-2xl p-7 border-2 border-dashed transition cursor-pointer text-center group shadow-xs ${
            isDragOver
              ? 'border-blue-600 bg-blue-50/60 scale-[1.01]'
              : 'border-slate-300 hover:border-blue-500 hover:shadow-md'
          }`}
        >
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={e => handleFileSelect(e.target.files)}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition duration-200">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-800">Tap to browse or Drop files here</h3>
          <p className="text-xs text-slate-500 mt-1">
            Supports PDF, DOCX, JPG, PNG up to 50MB · <span className="text-blue-600 font-semibold">Ctrl+V to paste screenshot</span>
          </p>
        </div>

        {/* Selected Files List & Quick Batch Presets */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h4 className="font-bold text-xs text-slate-700">Documents ({files.length} files · {totalPages} total pages)</h4>
              
              {/* Quick Batch Presets */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => applyPresetToAll('bw')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                >All B&W</button>
                <button
                  type="button"
                  onClick={() => applyPresetToAll('color')}
                  className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition"
                >All Color</button>
                <button
                  type="button"
                  onClick={() => applyPresetToAll('duplex')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                >All Duplex</button>
              </div>
            </div>

            {files.map((file, idx) => {
              const cfg = fileConfigs[idx] || {};
              const isPdf = file.name.toLowerCase().endsWith('.pdf');

              return (
                <div key={idx} className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
                  
                  {/* File Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                        {isPdf ? <FileText className="w-4 h-4 text-red-500" /> : <ImageIcon className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                          <span>&bull;</span>
                          <span>{cfg.page_count || 1} {cfg.page_count === 1 ? 'page' : 'pages'}</span>
                          {cfg.auto_detected_paper && (
                            <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 font-bold rounded">
                              📐 Auto: {cfg.auto_detected_paper}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Print Configs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                    
                    {/* Copies Count */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Copies</label>
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateConfig(idx, 'copies', Math.max(1, (cfg.copies || 1) - 1))}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="flex-1 text-center font-bold text-slate-800 text-xs">{cfg.copies || 1}</span>
                        <button
                          type="button"
                          onClick={() => updateConfig(idx, 'copies', (cfg.copies || 1) + 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Color Mode */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Color</label>
                      <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateConfig(idx, 'color_mode', 'bw')}
                          className={`py-1 rounded font-bold text-[10px] transition ${
                            cfg.color_mode === 'bw' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          B&W
                        </button>
                        <button
                          type="button"
                          onClick={() => updateConfig(idx, 'color_mode', 'color')}
                          className={`py-1 rounded font-bold text-[10px] transition ${
                            cfg.color_mode === 'color' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Color
                        </button>
                      </div>
                    </div>

                    {/* Paper Size */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Paper</label>
                      <select
                        value={cfg.paper_size || 'A4'}
                        onChange={e => updateConfig(idx, 'paper_size', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-1.5 font-medium text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="A4">A4 Standard</option>
                        <option value="Legal">Legal (+৳{shop?.price_legal || 3})</option>
                        <option value="A3">A3 Large (+৳{shop?.price_a3 || 15})</option>
                      </select>
                    </div>

                    {/* Sides / Duplex */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sides</label>
                      <select
                        value={cfg.sides || 'single'}
                        onChange={e => updateConfig(idx, 'sides', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-1.5 font-medium text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="single">Single Side</option>
                        <option value="double">2-Sided</option>
                      </select>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Customer Information & Notes */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3">
          <h4 className="font-bold text-xs text-slate-700">Customer Details (Optional)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="Your Name (e.g. Shakib)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder="Phone (For pickup SMS / WhatsApp notification)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>
          <div>
            <input
              type="text"
              placeholder="Special instructions for shopkeeper (e.g. staple top-left corner, binding)..."
              value={globalNotes}
              onChange={e => setGlobalNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Payment Selection & bKash / Nagad Number Box (Feature 4) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Payment Preference
            </h4>
            <span className="text-[11px] font-semibold text-slate-400">Pay at counter or online</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cash', label: '💵 Cash at Counter', desc: 'Pay when picking up' },
              { id: 'bkash', label: '🌸 bKash', desc: shop?.bkash_number ? 'Direct mobile pay' : 'Counter bKash' },
              { id: 'nagad', label: '🟠 Nagad', desc: shop?.nagad_number ? 'Direct mobile pay' : 'Counter Nagad' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaymentMethod(p.id)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  paymentMethod === p.id
                    ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-[11px]">{p.label}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>

          {/* bKash / Nagad Payment Instructions */}
          {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Shop {paymentMethod.toUpperCase()} Number</p>
                  <p className="text-sm font-mono font-extrabold text-slate-800">
                    {paymentMethod === 'bkash' ? (shop?.bkash_number || shop?.phone || '017XXXXXXXX') : (shop?.nagad_number || shop?.phone || '018XXXXXXXX')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const num = paymentMethod === 'bkash' ? (shop?.bkash_number || shop?.phone) : (shop?.nagad_number || shop?.phone);
                    if (num) navigator.clipboard.writeText(num);
                    setCopiedNumber(true);
                    setTimeout(() => setCopiedNumber(false), 2000);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 shadow-2xs"
                >
                  {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNumber ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Transaction ID / Sender Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9JA2K1L5 or 017XXXXXXXX"
                  value={paymentTrxId}
                  onChange={e => setPaymentTrxId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sticky Floating Bottom Checkout Bar */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky bottom-4 z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Total</span>
              {discount > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  🎉 {discountPercent}% Bulk Discount (-৳{discount.toFixed(2)})
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-extrabold text-slate-900 leading-tight">
                ৳{total.toFixed(2)}
              </span>
              {discount > 0 && (
                <span className="text-xs text-slate-400 line-through">
                  ৳{subtotal.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={uploading || files.length === 0}
            className="flex-1 max-w-sm py-3 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending ({uploadProgress}%)...</span>
              </>
            ) : (
              <>
                <span>Send to Print Counter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Google AdSense Space (Bottom) */}
        {adsenseConfig?.enabled && (
          <GoogleAdSense
            client={adsenseConfig.clientId}
            slot={adsenseConfig.slotCustomerBottom}
            format="auto"
            className="pt-2"
          />
        )}

      </div>
    </div>
  );
}
