import React, { useState, useRef } from 'react';
import {
  Store, ShieldCheck, MapPin, Phone, FileText, Clock, CreditCard,
  Percent, Sparkles, Check, X, Camera, Award, HelpCircle, Save, ExternalLink,
  Upload, Trash2, Image as ImageIcon, Eye
} from 'lucide-react';

export default function ShopProfileModal({ shop, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: shop?.name || '',
    tagline: shop?.tagline || 'Fast & Reliable Document Printing',
    phone: shop?.phone || '',
    alt_phone: shop?.alt_phone || '',
    address: shop?.address || '',
    maps_url: shop?.maps_url || '',
    owner_name: shop?.owner_name || '',
    trade_license: shop?.trade_license || '',
    trade_license_image: shop?.trade_license_image || '',
    nid_number: shop?.nid_number || '',
    shop_image: shop?.shop_image || '',
    counter_notice: shop?.counter_notice || '',
    services_offered: shop?.services_offered || 'Laser Print, Color Print, Photocopy, Spiral Binding, Laminating',
    opening_time: shop?.opening_time || '08:00',
    closing_time: shop?.closing_time || '22:00',
    price_bw: shop?.price_bw || '2.00',
    price_color: shop?.price_color || '10.00',
    price_legal: shop?.price_legal || '3.00',
    price_a3: shop?.price_a3 || '15.00',
    bkash_number: shop?.bkash_number || '',
    nagad_number: shop?.nagad_number || '',
    discount_min_pages: shop?.discount_min_pages || 50,
    discount_percent: shop?.discount_percent || 10,
    discount_tier2_pages: shop?.discount_tier2_pages || 100,
    discount_tier2_percent: shop?.discount_tier2_percent || 15
  });

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'biz' | 'pricing' | 'payment'
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState(null);

  const shopImageInputRef = useRef(null);
  const tradeLicenseInputRef = useRef(null);

  // Helper to read and compress image to base64 DataURL
  const handleImageUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Please select a photo under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 1200px width/height for fast loading & storage
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, [field]: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        if (onSave) onSave(data.shop);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1200);
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (_) {
      alert('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-sans">
        
        {/* Hidden File Inputs for Shop Photo & Trade License */}
        <input
          type="file"
          ref={shopImageInputRef}
          accept="image/*"
          capture="environment"
          onChange={e => handleImageUpload(e, 'shop_image')}
          className="hidden"
        />
        <input
          type="file"
          ref={tradeLicenseInputRef}
          accept="image/*"
          capture="environment"
          onChange={e => handleImageUpload(e, 'trade_license_image')}
          className="hidden"
        />

        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-800">Shop Profile & Business Verification</h3>
                {shop?.is_verified ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
                    PENDING VERIFICATION
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Manage shop branding photos, trade license scan, owner NID & hours</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-white">
          {[
            { id: 'general', label: '🏪 Shop Identity & Photo', icon: Store },
            { id: 'biz', label: '📜 Trade License & Owner NID', icon: ShieldCheck },
            { id: 'pricing', label: '🏷️ Rates & Bulk Discounts', icon: Percent },
            { id: 'payment', label: '💳 bKash & Nagad Accounts', icon: CreditCard }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === t.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* TAB 1: General Shop Identity & Storefront Photo */}
          {activeTab === 'general' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* Storefront Photo Uploader */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-extrabold text-slate-800 block">
                  Shop Storefront / Counter Photo
                </label>
                <p className="text-[11px] text-slate-500">
                  Displayed on customer upload pages and digital pickup tickets to help customers easily locate your shop.
                </p>

                {formData.shop_image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 group max-h-48 bg-slate-900 flex items-center justify-center">
                    <img
                      src={formData.shop_image}
                      alt="Shop Front"
                      className="w-full h-44 object-cover group-hover:opacity-90 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImageModal(formData.shop_image)}
                        className="px-3 py-1.5 bg-white/90 text-slate-900 rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-white transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => shopImageInputRef.current?.click()}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-blue-500 transition"
                      >
                        <Camera className="w-3.5 h-3.5" /> Replace Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, shop_image: '' })}
                        className="p-1.5 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => shopImageInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                  >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800 text-xs">Take / Upload Shop Photo</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Click to take photo with phone camera or upload from device (JPG, PNG)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shop Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shop Tagline / Slogan</label>
                  <input
                    type="text"
                    placeholder="e.g. Fastest Laser Printing & Thesis Binding"
                    value={formData.tagline}
                    onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primary Counter Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alternate / WhatsApp Phone</label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={formData.alt_phone}
                    onChange={e => setFormData({ ...formData, alt_phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Shop Address / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Shop 14, Ground Floor, Nilkhet Market, Dhaka"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Google Maps Location Link</label>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={formData.maps_url}
                  onChange={e => setFormData({ ...formData, maps_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Services Offered (Comma Separated)</label>
                <input
                  type="text"
                  value={formData.services_offered}
                  onChange={e => setFormData({ ...formData, services_offered: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Opening Time</label>
                  <input
                    type="time"
                    value={formData.opening_time}
                    onChange={e => setFormData({ ...formData, opening_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Closing Time</label>
                  <input
                    type="time"
                    value={formData.closing_time}
                    onChange={e => setFormData({ ...formData, closing_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Trade License & Owner Info */}
          {activeTab === 'biz' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-900 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Business Verification Trust Badge
                </p>
                <p className="text-[11px] leading-relaxed">
                  Take a photo of your **Trade License** document and enter your National ID. Verified shops receive higher customer trust, verified badges on standees, and priority placement in the shop directory.
                </p>
              </div>

              {/* Trade License Photo Document Uploader */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-extrabold text-slate-800 block">
                  Trade License Photo / Document Scan
                </label>
                <p className="text-[11px] text-slate-500">
                  Take a clear picture of your City Corporation / Union Parishad trade license certificate.
                </p>

                {formData.trade_license_image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 group max-h-52 bg-slate-900 flex items-center justify-center">
                    <img
                      src={formData.trade_license_image}
                      alt="Trade License"
                      className="w-full h-48 object-contain group-hover:opacity-90 transition bg-slate-950"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImageModal(formData.trade_license_image)}
                        className="px-3 py-1.5 bg-white/90 text-slate-900 rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-white transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Document
                      </button>
                      <button
                        type="button"
                        onClick={() => tradeLicenseInputRef.current?.click()}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-blue-500 transition"
                      >
                        <Camera className="w-3.5 h-3.5" /> Retake Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, trade_license_image: '' })}
                        className="p-1.5 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition"
                        title="Remove document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => tradeLicenseInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                  >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800 text-xs">Take / Upload Trade License Photo</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Click to scan with phone camera or select file (JPG, PNG)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner / Proprietor Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Md. Shakib Rahman"
                    value={formData.owner_name}
                    onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trade License Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TRAD/DNCC/123456/2026"
                    value={formData.trade_license}
                    onChange={e => setFormData({ ...formData, trade_license: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Owner NID (National ID Number)</label>
                  <input
                    type="text"
                    placeholder="e.g. 19951234567890"
                    value={formData.nid_number}
                    onChange={e => setFormData({ ...formData, nid_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Pricing & Bulk Discounts */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">B&W A4 Rate (৳)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.price_bw}
                    onChange={e => setFormData({ ...formData, price_bw: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Color A4 Rate (৳)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.price_color}
                    onChange={e => setFormData({ ...formData, price_color: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Legal Sheet Rate (৳)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.price_legal}
                    onChange={e => setFormData({ ...formData, price_legal: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">A3 Sheet Rate (৳)</label>
                  <input
                    type="number"
                    step="1.0"
                    value={formData.price_a3}
                    onChange={e => setFormData({ ...formData, price_a3: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              {/* Bulk Discount Rules */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  Auto Bulk Discount Rules
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Tier 1: Min Pages</label>
                    <input
                      type="number"
                      value={formData.discount_min_pages}
                      onChange={e => setFormData({ ...formData, discount_min_pages: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Tier 1: Discount %</label>
                    <input
                      type="number"
                      value={formData.discount_percent}
                      onChange={e => setFormData({ ...formData, discount_percent: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Tier 2: Min Pages</label>
                    <input
                      type="number"
                      value={formData.discount_tier2_pages}
                      onChange={e => setFormData({ ...formData, discount_tier2_pages: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Tier 2: Discount %</label>
                    <input
                      type="number"
                      value={formData.discount_tier2_percent}
                      onChange={e => setFormData({ ...formData, discount_tier2_percent: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: bKash & Nagad Accounts */}
          {activeTab === 'payment' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-pink-50 rounded-2xl border border-pink-200 space-y-2">
                  <label className="font-extrabold text-pink-900 block">bKash Personal / Merchant Number</label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={formData.bkash_number}
                    onChange={e => setFormData({ ...formData, bkash_number: e.target.value })}
                    className="w-full bg-white border border-pink-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-pink-700">Customers can copy this directly on checkout</p>
                </div>

                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 space-y-2">
                  <label className="font-extrabold text-orange-900 block">Nagad Personal / Merchant Number</label>
                  <input
                    type="text"
                    placeholder="018XXXXXXXX"
                    value={formData.nagad_number}
                    onChange={e => setFormData({ ...formData, nagad_number: e.target.value })}
                    className="w-full bg-white border border-orange-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-orange-700">Shown in payment method selector</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Save Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition active:scale-95"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Saved!
                </>
              ) : saving ? (
                'Saving Profile...'
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Shop Profile
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-2">
            <img
              src={previewImageModal}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
