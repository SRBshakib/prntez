import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, FileText, Image as ImageIcon, Trash2, Plus, Minus, CheckCircle,
  Store, Sparkles, ArrowRight, Loader2, Info, Clipboard, Settings2, RefreshCw, ChevronDown
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [customerAd, setCustomerAd] = useState(null);
  const [adsenseConfig, setAdsenseConfig] = useState(null);
  const fileInputRef = useRef(null);

  // 1. Fetch Shop by Slug and public announcements
  useEffect(() => {
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

  // 3. Count PDF Pages Client-Side using window.pdfjsLib (if available)
  const countPdfPages = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) return 1;
    try {
      if (window.pdfjsLib) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        return pdf.numPages || 1;
      }
    } catch (e) {
      console.warn('Client PDF page count skipped:', e);
    }
    return 1;
  };

  const handleFileSelect = async (selectedFiles) => {
    const validFiles = Array.from(selectedFiles);
    if (validFiles.length === 0) return;

    const newFiles = [...files, ...validFiles];
    const newConfigs = [...fileConfigs];

    for (const f of validFiles) {
      const pages = await countPdfPages(f);
      newConfigs.push({
        copies: 1,
        color_mode: 'bw',
        paper_size: 'A4',
        sides: 'single',
        page_count: pages,
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

  // 5. Calculate live dynamic total price
  const calculateTotal = () => {
    if (!shop) return 0;
    const bwRate = parseFloat(shop.price_bw) || 2.0;
    const colorRate = parseFloat(shop.price_color) || 10.0;
    const legalExtra = parseFloat(shop.price_legal) || 0.0;
    const a3Extra = parseFloat(shop.price_a3) || 5.0;

    return fileConfigs.reduce((total, cfg) => {
      let rate = cfg.color_mode === 'color' ? colorRate : bwRate;
      if (cfg.paper_size === 'Legal') rate += legalExtra;
      if (cfg.paper_size === 'A3') rate += a3Extra;
      return total + (rate * (cfg.copies || 1) * (cfg.page_count || 1));
    }, 0);
  };

  const totalPages = fileConfigs.reduce((acc, c) => acc + ((c.page_count || 1) * (c.copies || 1)), 0);

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

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('shop_id', shop.id);
      formData.append('customer_name', customerName.trim() || 'Guest Customer');
      formData.append('customer_phone', customerPhone.trim() || '');
      formData.append('global_notes', globalNotes.trim() || '');
      formData.append('file_configs', JSON.stringify(fileConfigs));

      setUploadProgress(65);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      setUploadProgress(100);

      if (data.success) {
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
    <div className="min-h-screen bg-slate-50/80 pb-28 pt-6 px-4 sm:px-6 lg:px-8">
      
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

      <div className="max-w-2xl mx-auto space-y-5">
        
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
                </div>
                <h2 className="text-base font-bold text-slate-800 leading-tight">{shop.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{shop.address || 'Counter Print Service'}</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-400">Rates</div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">
                B&W: ৳{shop.price_bw} · Color: ৳{shop.price_color}
              </div>
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
                        <p className="text-[10px] text-slate-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB · {cfg.page_count || 1} {cfg.page_count === 1 ? 'page' : 'pages'}
                        </p>
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
                        <option value="Legal">Legal (+৳3)</option>
                        <option value="A3">A3 Large (+৳5)</option>
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

        {/* Customer Information Card */}
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
                placeholder="Phone Number (Optional)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>
          <div>
            <input
              type="text"
              placeholder="Special instructions for shopkeeper (e.g. staple top-left corner)..."
              value={globalNotes}
              onChange={e => setGlobalNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Sticky Floating Bottom Checkout Bar */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-200 flex items-center justify-between gap-4 sticky bottom-4 z-20">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Total</span>
            <div className="text-xl font-extrabold text-slate-900 leading-tight">
              ৳{calculateTotal().toFixed(2)}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={uploading || files.length === 0}
            className="flex-1 max-w-xs py-2.5 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98"
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
