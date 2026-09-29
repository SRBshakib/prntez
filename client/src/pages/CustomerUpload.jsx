import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, FileText, Image as ImageIcon, Trash2, Plus, Minus, CheckCircle,
  Store, Sparkles, ArrowRight, Loader2, Info, Clipboard, Settings2, RefreshCw,
  ChevronDown, MessageCircle, Clock, CreditCard, Copy, Check, History, Percent,
  AlertTriangle, Phone, BookOpen, Palette, Pencil
} from 'lucide-react';
import GoogleAdSense from '../components/GoogleAdSense';
import { useLanguage } from '../context/LanguageContext';

export default function CustomerUpload({ onJobCreated, initialSlug }) {
  const { t, isBn } = useLanguage();
  const [shop, setShop] = useState(null);
  const [availableShops, setAvailableShops] = useState([]);
  const [showShopPicker, setShowShopPicker] = useState(false);
  const [loadingShop, setLoadingShop] = useState(true);
  const [files, setFiles] = useState([]);
  const [fileConfigs, setFileConfigs] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [globalNotes, setGlobalNotes] = useState('');
  const [serviceType, setServiceType] = useState('print'); // 'print' | 'bind' | 'photo' | 'edit'
  const [serviceDetail, setServiceDetail] = useState(''); // binding type, photo size, or edit notes
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'bkash' | 'nagad'
  const [onlinePayMode, setOnlinePayMode] = useState('gateway'); // 'gateway' | 'manual'
  const [pgwConfig, setPgwConfig] = useState({ enabled: true, activeProvider: 'simulator' });
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

  // Ensure selected serviceType is available in this shop (fallback to 'print' if shop disables it)
  useEffect(() => {
    if (serviceType === 'bind' && (shop?.allow_binding === 0 || shop?.allow_binding === false || shop?.allow_binding === '0')) {
      setServiceType('print');
      setServiceDetail('');
    } else if (serviceType === 'photo' && (shop?.allow_photo === 0 || shop?.allow_photo === false || shop?.allow_photo === '0')) {
      setServiceType('print');
      setServiceDetail('');
    } else if (serviceType === 'edit' && (shop?.allow_edit === 0 || shop?.allow_edit === false || shop?.allow_edit === '0')) {
      setServiceType('print');
      setServiceDetail('');
    }
  }, [shop, serviceType]);

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

    // Fetch payment gateway configuration
    fetch('/api/payment/config')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPgwConfig(data);
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
    let printSubtotal = 0;

    if (serviceType === 'photo') {
      let photoRate = parseFloat(shop.price_passport_4) || 30.0;
      const detail = serviceDetail || 'passport_4';
      if (detail === 'passport_8') photoRate = parseFloat(shop.price_passport_8) || 50.0;
      else if (detail === 'stamp_4') photoRate = parseFloat(shop.price_stamp_4) || 20.0;
      else if (detail === 'photo_4r') photoRate = parseFloat(shop.price_photo_4r) || 20.0;
      else if (detail === 'photo_a4') photoRate = parseFloat(shop.price_photo_a4) || 60.0;
      else photoRate = parseFloat(shop.price_passport_4) || 30.0;

      fileConfigs.forEach(cfg => {
        const copies = cfg.copies || 1;
        subtotal += photoRate * copies;
        totalPages += copies;
      });
    } else if (serviceType === 'bind') {
      let bindExtra = parseFloat(shop.price_bind_spiral) || 30.0;
      const detail = serviceDetail || 'spiral';
      if (detail === 'tape') bindExtra = parseFloat(shop.price_bind_tape) || 20.0;
      else if (detail === 'hardcover') bindExtra = parseFloat(shop.price_bind_hardcover) || 300.0;
      else if (detail === 'spiral') bindExtra = parseFloat(shop.price_bind_spiral) || 30.0;

      fileConfigs.forEach(cfg => {
        let rate = cfg.color_mode === 'color' ? colorRate : bwRate;
        if (cfg.paper_size === 'Legal') rate += legalExtra;
        if (cfg.paper_size === 'A3') rate += a3Extra;
        const copies = cfg.copies || 1;
        const pages = cfg.page_count || 1;
        printSubtotal += rate * copies * pages;
        totalPages += copies * pages;
      });
      subtotal = printSubtotal + (bindExtra * (fileConfigs.length || 1));
    } else if (serviceType === 'edit') {
      const editFeePerFile = parseFloat(shop.price_edit) || 30.0;
      const totalEditFee = editFeePerFile * (fileConfigs.length || 1);
      fileConfigs.forEach(cfg => {
        let rate = cfg.color_mode === 'color' ? colorRate : bwRate;
        if (cfg.paper_size === 'Legal') rate += legalExtra;
        if (cfg.paper_size === 'A3') rate += a3Extra;
        const copies = cfg.copies || 1;
        const pages = cfg.page_count || 1;
        printSubtotal += rate * copies * pages;
        totalPages += copies * pages;
      });
      subtotal = printSubtotal + totalEditFee;
    } else {
      fileConfigs.forEach(cfg => {
        let rate = cfg.color_mode === 'color' ? colorRate : bwRate;
        if (cfg.paper_size === 'Legal') rate += legalExtra;
        if (cfg.paper_size === 'A3') rate += a3Extra;
        const copies = cfg.copies || 1;
        const pages = cfg.page_count || 1;
        subtotal += rate * copies * pages;
        totalPages += copies * pages;
      });
    }

    // Discount tiers (for document prints & bindings)
    let discount = 0;
    let discountPercent = 0;

    const isDiscountActive = shop.allow_discount !== 0 && shop.allow_discount !== '0' && shop.allow_discount !== false;
    if (serviceType !== 'photo' && isDiscountActive) {
      const minPages1 = parseInt(shop.discount_min_pages, 10) || 50;
      const pct1 = parseFloat(shop.discount_percent) || 10;
      const minPages2 = parseInt(shop.discount_tier2_pages, 10) || 100;
      const pct2 = parseFloat(shop.discount_tier2_percent) || 15;

      if (totalPages >= minPages2 && pct2 > 0) {
        discountPercent = pct2;
        discount = (subtotal * pct2) / 100.0;
      } else if (totalPages >= minPages1 && pct1 > 0) {
        discountPercent = pct1;
        discount = (subtotal * pct1) / 100.0;
      }
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

  const allowCash = shop?.allow_cash_payment !== 0 && shop?.allow_cash_payment !== false;
  const allowBkash = shop?.allow_bkash_payment !== 0 && shop?.allow_bkash_payment !== false;
  const allowNagad = shop?.allow_nagad_payment !== 0 && shop?.allow_nagad_payment !== false;
  const enabledPaymentCount = [allowCash, allowBkash, allowNagad].filter(Boolean).length;
  const paymentGridClass = enabledPaymentCount === 1 ? 'grid-cols-1' : enabledPaymentCount === 2 ? 'grid-cols-2' : 'grid-cols-3';

  // Auto-correct selected payment method if shop disabled it
  useEffect(() => {
    if (!shop) return;
    if (paymentMethod === 'cash' && !allowCash) {
      if (allowBkash) setPaymentMethod('bkash');
      else if (allowNagad) setPaymentMethod('nagad');
    } else if (paymentMethod === 'bkash' && !allowBkash) {
      if (allowCash) setPaymentMethod('cash');
      else if (allowNagad) setPaymentMethod('nagad');
    } else if (paymentMethod === 'nagad' && !allowNagad) {
      if (allowCash) setPaymentMethod('cash');
      else if (allowBkash) setPaymentMethod('bkash');
    }
  }, [shop, allowCash, allowBkash, allowNagad, paymentMethod]);

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

    // Validate last 4 digits for bKash/Nagad manual payment
    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && onlinePayMode === 'manual') {
      const digits = paymentTrxId.replace(/\D/g, '');
      if (!digits || digits.length !== 4) {
        setError(`Please enter the last 4 digits of your ${paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} number to confirm payment.`);
        return;
      }
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
      formData.append('service_type', serviceType);
      formData.append('service_detail', serviceDetail.trim());

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
            authCode: data.auth_code,
            shopName: shop.name,
            total: total,
            totalPages: totalPages,
            date: new Date().toLocaleDateString()
          };
          const existing = JSON.parse(localStorage.getItem('prntez_customer_orders') || '[]');
          const updated = [newOrderEntry, ...existing.filter(x => x.jobCode !== data.job_code)].slice(0, 10);
          localStorage.setItem('prntez_customer_orders', JSON.stringify(updated));
        } catch (_) {}

        // Automated Online Payment Redirect (bKash / Nagad / UddoktaPay)
        if (paymentMethod !== 'cash' && onlinePayMode === 'gateway' && pgwConfig.enabled !== false && data.job_id) {
          try {
            const payRes = await fetch('/api/payment/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                job_id: data.job_id,
                method: paymentMethod
              })
            });
            const payData = await payRes.json();
            if (payData.success && payData.paymentUrl) {
              window.location.href = payData.paymentUrl;
              return;
            }
          } catch (payErr) {
            console.warn('Auto payment redirect fallback:', payErr);
          }
        }

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

  const availableServices = [
    { key: 'print', icon: '🖨️', label: isBn ? 'প্রিন্ট' : 'Print', desc: isBn ? 'শুধু প্রিন্ট' : 'Print only', color: 'blue', enabled: true },
    { key: 'bind', icon: '📖', label: isBn ? 'বাইন্ডিং' : 'Bind', desc: isBn ? 'প্রিন্ট + বাইন্ডিং' : 'Print + Binding', color: 'purple', enabled: shop?.allow_binding !== 0 && shop?.allow_binding !== false && shop?.allow_binding !== '0' },
    { key: 'photo', icon: '🖼️', label: isBn ? 'ছবি প্রিন্ট' : 'Photo', desc: isBn ? 'গ্লসি পেপার' : 'Photo print', color: 'pink', enabled: shop?.allow_photo !== 0 && shop?.allow_photo !== false && shop?.allow_photo !== '0' },
    { key: 'edit', icon: '✏️', label: isBn ? 'এডিট' : 'Edit', desc: isBn ? 'এডিট ও প্রিন্ট' : 'Edit & print', color: 'amber', enabled: shop?.allow_edit !== 0 && shop?.allow_edit !== false && shop?.allow_edit !== '0' },
  ].filter(s => s.enabled);

  const gridColsClass = availableServices.length === 1 
    ? 'grid-cols-1' 
    : availableServices.length === 2 
      ? 'grid-cols-2' 
      : availableServices.length === 3 
        ? 'grid-cols-3' 
        : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className="min-h-screen bg-slate-50/80 pb-28 sm:pb-36 pt-4 sm:pt-6 px-3 sm:px-6 lg:px-8">
      
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
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-xs flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <History className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-bold text-slate-700 truncate">{isBn ? `পূর্ববর্তী অর্ডার (${recentOrders.length})` : `Recent Orders (${recentOrders.length})`}</span>
            </div>
            <button
              onClick={() => setShowRecentOrders(s => !s)}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 shrink-0 text-[11px] sm:text-xs"
            >
              <span>{showRecentOrders ? (isBn ? 'লুকান' : 'Hide') : (isBn ? 'টোকেন দেখুন' : 'Past Tokens')}</span>
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
          <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 shrink-0">{isBn ? 'কাউন্টার' : 'Printing at'}</span>
                  {availableShops.length > 1 && (
                    <button
                      onClick={() => setShowShopPicker(true)}
                      className="text-[10px] text-slate-500 hover:text-blue-600 font-bold underline flex items-center gap-0.5"
                    >
                      {isBn ? 'দোকান বদলান' : 'Change Shop'} <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  )}
                  <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold shrink-0 ${!isClosed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {!isClosed ? (isBn ? '● খোলা' : '● Open Now') : (isBn ? '● বন্ধ' : '● Closed')}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate">{shop.name}</h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{shop.address || 'Counter Print Service'}</p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-1 shrink-0">
              <div className="text-[11px] sm:text-xs font-bold text-slate-700 whitespace-nowrap">
                B&W: ৳{shop.price_bw} · Color: ৳{shop.price_color}
              </div>
              {shop.phone && (
                <a
                  href={`https://wa.me/${shop.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${shop.name}, I have a question about printing at your counter.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">WhatsApp</span>
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
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/60 rounded-2xl p-3 sm:p-3.5 flex items-start sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[9px] sm:text-[10px] tracking-wider uppercase shrink-0 shadow-xs">
                {customerAd?.badge || (isBn ? '📢 নোটিশ' : '📢 NOTICE')}
              </span>
              <p className="text-xs font-medium text-slate-800 leading-snug break-words">
                {customerAd?.text || shop?.counter_notice}
              </p>
            </div>
            {customerAd?.link && (
              <a
                href={customerAd.link}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] sm:text-[11px] shrink-0 transition"
              >
                {isBn ? 'অফার দেখুন →' : 'View Offer →'}
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
          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition duration-200">
            <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-800">{t('customerUpload.dropzoneText', 'Tap to browse or Drop files here')}</h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 break-words">
            {t('customerUpload.dropzoneSub', 'Supports PDF, DOCX, JPG, PNG up to 50MB · Ctrl+V to paste screenshot')}
          </p>
        </div>

        {/* Service Type Selector Chips */}
        {files.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-700">{t('customerUpload.serviceType', 'What do you need?')}</h4>
              <div className={`grid ${gridColsClass} gap-2`}>
                {availableServices.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => { setServiceType(s.key); setServiceDetail(''); }}
                    className={`p-2.5 rounded-xl border-2 text-center transition cursor-pointer ${
                      serviceType === s.key
                        ? `border-${s.color}-500 bg-${s.color}-50/60 ring-1 ring-${s.color}-400 shadow-sm`
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xl mb-0.5">{s.icon}</div>
                    <div className="text-[11px] font-bold text-slate-800">{s.label}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 hidden sm:block">{s.desc}</div>
                  </button>
                ))}
              </div>

            {/* Sub-options based on service type */}
            {serviceType === 'bind' && (
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Binding Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'spiral', label: '🔗 Spiral Binding', price: shop?.price_bind_spiral || '30', desc: 'Assignments, lecture notes' },
                    { key: 'tape', label: '📦 Tape Binding', price: shop?.price_bind_tape || '20', desc: 'Documents, office files' },
                    { key: 'hardcover', label: '📗 Hardcover Thesis', price: shop?.price_bind_hardcover || '300', desc: 'Final year thesis & projects' },
                  ].map(b => (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => setServiceDetail(b.key)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        (serviceDetail || 'spiral') === b.key
                          ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-400 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{b.label}</span>
                        <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-md">+৳{b.price}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{b.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {serviceType === 'photo' && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Choose Photo Package / Size</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'passport_4', label: '4x Passport Size', count: '4 Copies', price: shop?.price_passport_4 || '30' },
                    { key: 'passport_8', label: '8x Passport Size', count: '8 Copies', price: shop?.price_passport_8 || '50' },
                    { key: 'stamp_4', label: '4x Stamp Size', count: '4 Copies', price: shop?.price_stamp_4 || '20' },
                    { key: 'photo_4r', label: '4R Photo (4"×6")', count: '1 Copy', price: shop?.price_photo_4r || '20' },
                    { key: 'photo_a4', label: 'A4 Photo (Glossy)', count: '1 Page', price: shop?.price_photo_a4 || '60' },
                  ].map(pkg => (
                    <button
                      key={pkg.key}
                      type="button"
                      onClick={() => setServiceDetail(pkg.key)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        (serviceDetail || 'passport_4') === pkg.key
                          ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-400 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{pkg.label}</span>
                        <span className="text-[10px] font-extrabold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded-md">৳{pkg.price}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">High-Gloss Photo Paper · {pkg.count}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {serviceType === 'edit' && (
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">What needs editing?</label>
                <input
                  type="text"
                  placeholder="e.g. Remove background, add text, resize for banner..."
                  value={serviceDetail}
                  onChange={e => setServiceDetail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
                <p className="text-[10px] text-amber-700 font-semibold mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 text-amber-600" />
                  <span>
                    {isBn 
                      ? <>দোকানের এডিটিং ফি: <strong>৳{shop?.price_edit || '30'} / ফাইল</strong> + স্বাভাবিক প্রিন্ট রেট</>
                      : <>Shop editing fee: <strong>৳{shop?.price_edit || '30'} / file</strong> + standard print rates</>}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Selected Files List & Quick Batch Presets */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h4 className="font-bold text-xs text-slate-700">
                {serviceType === 'edit'
                  ? `Files for Editing (${files.length} file${files.length > 1 ? 's' : ''})`
                  : serviceType === 'photo'
                  ? `Photos for Print (${files.length} item${files.length > 1 ? 's' : ''})`
                  : `Documents (${files.length} files · ${totalPages} total pages)`}
              </h4>
              
              {/* Quick Batch Presets (For Document, Binding & Edit jobs) */}
              {serviceType !== 'photo' && (
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
              )}
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

                  {/* Edit Job Notice Banner */}
                  {serviceType === 'edit' && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="p-2 bg-amber-50 border border-amber-200/80 rounded-xl text-xs flex items-center justify-between gap-2 text-amber-900 mb-2">
                        <span className="font-bold flex items-center gap-1.5 text-[11px]">
                          <span>✏️</span> Set printing preferences for after editing:
                        </span>
                        <span className="text-[9px] text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded font-bold shrink-0">
                          Manual Editing by Shop
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Print Configs Grid / Photo Options */}
                  {serviceType === 'photo' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs items-center">
                      {/* Copies Count / Sets */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Copies / Sets</label>
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => updateConfig(idx, 'copies', Math.max(1, (cfg.copies || 1) - 1))}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="flex-1 text-center font-bold text-slate-800 text-xs">{cfg.copies || 1} set{(cfg.copies || 1) > 1 ? 's' : ''}</span>
                          <button
                            type="button"
                            onClick={() => updateConfig(idx, 'copies', (cfg.copies || 1) + 1)}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Package / Size Selected */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Selected Package</label>
                        <div className="py-1 px-2.5 bg-pink-50 border border-pink-200 rounded-lg text-pink-700 font-bold text-xs truncate">
                          {serviceDetail === 'passport_8' ? '8x Passport Size' :
                           serviceDetail === 'stamp_4' ? '4x Stamp Size' :
                           serviceDetail === 'photo_4r' ? '4R Photo (4"×6")' :
                           serviceDetail === 'photo_a4' ? 'A4 Glossy Photo' : '4x Passport Size'}
                        </div>
                      </div>

                      {/* Paper Type */}
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Paper Type</label>
                        <div className="py-1 px-2.5 bg-slate-100 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1">
                          <span>✨</span> Glossy Photo Paper
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Customer Information & Notes */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-700">{t('customerUpload.customerDetails', 'Customer Details (Optional)')}</h4>
            <span className="text-[10px] text-slate-400 font-semibold">{t('common.optional', 'Optional')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <input
                type="text"
                placeholder={isBn ? "আপনার নাম (যেমন: সাকিব)" : "Your Name (e.g. Shakib)"}
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder={isBn ? "মোবাইল নম্বর (পিকআপ এসএমএস / নোটিফিকেশনের জন্য)" : "Phone (For pickup SMS / WhatsApp notification)"}
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>
          <div>
            <input
              type="text"
              placeholder={isBn ? "দোকানদারের জন্য বিশেষ নির্দেশনা (যেমন: স্ট্যাপলার কোণায় দিন, বাইন্ডিং করুন)..." : "Special instructions for shopkeeper (e.g. staple top-left corner, binding)..."}
              value={globalNotes}
              onChange={e => setGlobalNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Payment Selection — Clean & Smooth (Dynamic per Shop settings) */}
        {enabledPaymentCount > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Payment Method
              </h4>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
                {allowCash && (allowBkash || allowNagad) ? 'Pay at counter or online' : allowCash ? 'Pay at counter' : 'Pay online'}
              </span>
            </div>

            <div className={`grid ${paymentGridClass} gap-2 sm:gap-3`}>
              {/* Cash at Counter */}
              {allowCash && (
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('cash'); setPaymentTrxId(''); }}
                  className={`p-2.5 sm:p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[95px] sm:min-h-[110px] ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400/30 shadow-md shadow-emerald-500/10 scale-[1.01]'
                      : 'border-slate-200/90 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg sm:text-xl shadow-2xs border border-emerald-200/80">
                    💵
                  </div>
                  <div className="mt-1 sm:mt-2">
                    <div className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-tight">{isBn ? 'ক্যাশ' : 'Cash'}</div>
                    <div className="text-[9px] sm:text-[10px] text-emerald-700 font-semibold mt-0.5 bg-emerald-100/70 px-1.5 sm:px-2 py-0.5 rounded-full inline-block truncate max-w-full">{isBn ? 'কাউন্টারে দিন' : 'Pay at Counter'}</div>
                  </div>
                </button>
              )}

              {/* bKash with official logo */}
              {allowBkash && (
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('bkash'); setPaymentTrxId(''); }}
                  className={`p-2.5 sm:p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[95px] sm:min-h-[110px] ${
                    paymentMethod === 'bkash'
                      ? 'border-[#E2136E] bg-pink-50/80 ring-2 ring-pink-400/30 shadow-md shadow-pink-500/10 scale-[1.01]'
                      : 'border-slate-200/90 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="h-8 sm:h-10 w-full max-w-[110px] sm:max-w-[130px] rounded-xl bg-white border border-pink-200/80 flex items-center justify-center px-1.5 py-0.5 sm:px-2 sm:py-1 shadow-2xs">
                    <img src="/bkash-logo.png" alt="bKash" className="h-5 sm:h-6 max-h-7 w-auto max-w-full object-contain" />
                  </div>
                  <div className="mt-1 sm:mt-2">
                    <div className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-tight">bKash</div>
                    <div className="text-[9px] sm:text-[10px] text-pink-700 font-semibold mt-0.5 bg-pink-100/70 px-1.5 sm:px-2 py-0.5 rounded-full inline-block truncate max-w-full">{isBn ? 'গেটওয়ে · অ্যাপ' : 'Gateway · App'}</div>
                  </div>
                </button>
              )}

              {/* Nagad with official logo */}
              {allowNagad && (
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('nagad'); setPaymentTrxId(''); }}
                  className={`p-2.5 sm:p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[95px] sm:min-h-[110px] ${
                    paymentMethod === 'nagad'
                      ? 'border-[#F7941D] bg-orange-50/80 ring-2 ring-orange-400/30 shadow-md shadow-orange-500/10 scale-[1.01]'
                      : 'border-slate-200/90 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="h-8 sm:h-10 w-full max-w-[110px] sm:max-w-[130px] rounded-xl bg-white border border-orange-200/80 flex items-center justify-center px-1.5 py-0.5 sm:px-2 sm:py-1 shadow-2xs">
                    <img src="/nagad-logo.png" alt="Nagad" className="h-5 sm:h-6 max-h-7 w-auto max-w-full object-contain" />
                  </div>
                  <div className="mt-1 sm:mt-2">
                    <div className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-tight">Nagad</div>
                    <div className="text-[9px] sm:text-[10px] text-orange-700 font-semibold mt-0.5 bg-orange-100/70 px-1.5 sm:px-2 py-0.5 rounded-full inline-block truncate max-w-full">{isBn ? 'গেটওয়ে · অ্যাপ' : 'Gateway · App'}</div>
                  </div>
                </button>
              )}
            </div>

            {/* bKash / Nagad — Dual Mode: Payment Gateway & Manual App Payment */}
            {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
            <div className={`rounded-xl border overflow-hidden transition-all ${
              paymentMethod === 'bkash' ? 'border-pink-200 bg-gradient-to-b from-pink-50/80 to-white' : 'border-orange-200 bg-gradient-to-b from-orange-50/80 to-white'
            }`}>
              {/* Payment Mode Selector: Gateway Sandbox vs Manual App */}
              <div className="p-3 border-b border-slate-200/80 bg-white/70">
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setOnlinePayMode('gateway'); setError(''); }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      onlinePayMode === 'gateway'
                        ? paymentMethod === 'bkash'
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>⚡ Online Gateway</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 font-medium hidden sm:inline">Instant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOnlinePayMode('manual'); setError(''); }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      onlinePayMode === 'manual'
                        ? paymentMethod === 'bkash'
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>📱 Manual App</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 font-medium hidden sm:inline">4 Digits</span>
                  </button>
                </div>
              </div>

              {/* Mode 1: Payment Gateway (Direct PGW) */}
              {onlinePayMode === 'gateway' ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 font-bold ${
                      paymentMethod === 'bkash' ? 'bg-pink-500' : 'bg-orange-500'
                    }`}>
                      ⚡
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-extrabold text-slate-800">
                          {paymentMethod === 'bkash' ? 'bKash Official Gateway' : 'Nagad Online Gateway'}
                        </p>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Auto-Confirmed
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        After submitting, you will be redirected to the secure {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} checkout.
                        Payment verifies <strong>instantly</strong> with no manual checks needed.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-slate-600 font-medium">Checkout Amount:</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">৳{total.toFixed(2)}</span>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center">
                    💡 Click <strong>"Pay with {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'}"</strong> below to launch the checkout.
                  </p>
                </div>
              ) : (
                /* Mode 2: Manual App Payment (Send Money & 4 Digits) */
                <div className="space-y-0">
                  {/* Step 1: Send Money To */}
                  <div className="p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center text-white ${
                        paymentMethod === 'bkash' ? 'bg-pink-500' : 'bg-orange-500'
                      }`}>1</span>
                      <span className="text-[11px] font-bold text-slate-700">
                        Send <strong className="text-slate-900">৳{total.toFixed(2)}</strong> to this {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} number
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-slate-200 shadow-2xs">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          {shop?.name || 'Shop'} · {paymentMethod === 'bkash'
                            ? (shop?.bkash_type === 'merchant' ? 'Merchant' : 'Personal')
                            : (shop?.nagad_type === 'merchant' ? 'Merchant' : 'Personal')}
                        </p>
                        <p className="text-sm font-mono font-extrabold text-slate-900 mt-0.5">
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
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                          copiedNumber
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {copiedNumber ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedNumber ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    {/* QR Code if available */}
                    {((paymentMethod === 'bkash' && shop?.bkash_qr_image) || (paymentMethod === 'nagad' && shop?.nagad_qr_image)) && (
                      <div className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-slate-200">
                        <img
                          src={paymentMethod === 'bkash' ? shop.bkash_qr_image : shop.nagad_qr_image}
                          alt="QR"
                          className="w-12 h-12 object-contain rounded border border-slate-200 bg-white shrink-0"
                        />
                        <p className="text-[10px] text-slate-500">Or scan this QR from your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} app</p>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Verify with last 4 digits */}
                  <div className={`p-3.5 border-t space-y-2.5 ${
                    paymentMethod === 'bkash' ? 'border-pink-100' : 'border-orange-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center text-white ${
                        paymentMethod === 'bkash' ? 'bg-pink-500' : 'bg-orange-500'
                      }`}>2</span>
                      <span className="text-[11px] font-bold text-slate-700">
                        Enter last 4 digits of <strong>your</strong> {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} number
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-relaxed pl-7">
                      The shopkeeper verifies your payment by matching these digits in their app.
                    </p>
                    <div className="pl-7">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="● ● ● ●"
                        value={paymentTrxId}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPaymentTrxId(val);
                        }}
                        className={`w-full max-w-[180px] bg-white border-2 rounded-xl px-4 py-2.5 text-xl font-mono font-extrabold text-center tracking-[0.4em] transition ${
                          paymentTrxId.length === 4
                            ? 'border-emerald-400 bg-emerald-50/30 ring-1 ring-emerald-300'
                            : paymentMethod === 'bkash' ? 'border-pink-200 focus:border-pink-400 focus:ring-1 focus:ring-pink-400' : 'border-orange-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400'
                        }`}
                      />
                      {paymentTrxId.length === 4 && (
                        <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-1.5">
                          <CheckCircle className="w-3 h-3" /> Ready — shop will verify at counter
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

        {/* Sticky Floating Bottom Checkout Bar (Clean Mobile Optimized) */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-4 shadow-xl border border-slate-200/90 flex flex-row items-center justify-between gap-2 sm:gap-3 sticky bottom-3 sm:bottom-4 z-20">
          <div className="min-w-0">
            {serviceType === 'edit' ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-wider block truncate">{isBn ? 'মোট মূল্য' : 'Print + Edit Total'}</span>
                  {discount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-100 text-emerald-800 truncate">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight">
                    ৳{total.toFixed(2)}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-amber-700 font-semibold bg-amber-50 px-1 sm:px-1.5 py-0.2 rounded border border-amber-200 truncate hidden xs:inline">
                    ({isBn ? 'প্রিন্ট' : 'Print'}: ৳{Math.max(0, subtotal - (parseFloat(shop?.price_edit || 30) * (files.length || 1))).toFixed(0)} + {isBn ? 'এডিট' : 'Edit'}: ৳{(parseFloat(shop?.price_edit || 30) * (files.length || 1)).toFixed(0)})
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{t('customerUpload.estimatedTotal', 'Estimated Total')}</span>
                  {discount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-100 text-emerald-800 truncate">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 sm:gap-1.5 mt-0.5">
                  <span className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight">
                    ৳{total.toFixed(2)}
                  </span>
                  {discount > 0 && (
                    <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                      ৳{subtotal.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={uploading || files.length === 0}
            className={`py-2 sm:py-3 px-3 sm:px-6 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-1 sm:gap-2 active:scale-98 shrink-0 cursor-pointer ${
              serviceType === 'edit'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'
                : paymentMethod !== 'cash' && onlinePayMode === 'gateway'
                ? paymentMethod === 'bkash'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-pink-500/25'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/25'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isBn ? `আপলোড (${uploadProgress}%)...` : `Processing (${uploadProgress}%)...`}</span>
              </>
            ) : (
              <>
                <span>
                  {serviceType === 'edit'
                    ? (isBn ? 'এডিটে পাঠান' : 'Send for Edit')
                    : paymentMethod !== 'cash' && onlinePayMode === 'gateway'
                    ? (paymentMethod === 'bkash' ? (isBn ? 'বিকাশ পে' : 'Pay bKash') : (isBn ? 'নগদ পে' : 'Pay Nagad'))
                    : (isBn ? 'প্রিন্টে পাঠান' : t('customerUpload.sendToCounter', 'Send to Print Counter'))}
                </span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
