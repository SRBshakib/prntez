import React, { useState, useRef, useEffect } from 'react';
import {
  Store, ShieldCheck, MapPin, Phone, FileText, Clock, CreditCard,
  Percent, Sparkles, Check, X, Camera, Award, HelpCircle, Save, ExternalLink,
  Upload, Trash2, Image as ImageIcon, Eye
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ShopProfileModal({ shop, initialTab = 'general', onSave, onClose }) {
  const { isBn } = useLanguage();
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
    is_closed: shop?.is_closed || 0,
    price_bw: shop?.price_bw || '2.00',
    price_color: shop?.price_color || '10.00',
    price_legal: shop?.price_legal || '3.00',
    price_a3: shop?.price_a3 || '15.00',
    price_passport_4: shop?.price_passport_4 || '30.00',
    price_passport_8: shop?.price_passport_8 || '50.00',
    price_stamp_4: shop?.price_stamp_4 || '20.00',
    price_photo_4r: shop?.price_photo_4r || '20.00',
    price_photo_a4: shop?.price_photo_a4 || '60.00',
    price_bind_spiral: shop?.price_bind_spiral || '30.00',
    price_bind_tape: shop?.price_bind_tape || '20.00',
    price_bind_hardcover: shop?.price_bind_hardcover || '300.00',
    price_edit: shop?.price_edit || '30.00',
    bkash_number: shop?.bkash_number || '',
    bkash_type: shop?.bkash_type || 'merchant',
    bkash_qr_image: shop?.bkash_qr_image || '',
    bkash_app_key: shop?.bkash_app_key || '',
    bkash_app_secret: shop?.bkash_app_secret || '',
    bkash_username: shop?.bkash_username || '',
    bkash_password: shop?.bkash_password || '',
    nagad_number: shop?.nagad_number || '',
    nagad_type: shop?.nagad_type || 'merchant',
    nagad_qr_image: shop?.nagad_qr_image || '',
    nagad_merchant_id: shop?.nagad_merchant_id || '',
    nagad_public_key: shop?.nagad_public_key || '',
    nagad_private_key: shop?.nagad_private_key || '',
    uddoktapay_api_key: shop?.uddoktapay_api_key || '',
    allow_cash_payment: shop?.allow_cash_payment !== undefined ? Boolean(shop.allow_cash_payment) : true,
    allow_bkash_payment: shop?.allow_bkash_payment !== undefined ? Boolean(shop.allow_bkash_payment) : true,
    allow_nagad_payment: shop?.allow_nagad_payment !== undefined ? Boolean(shop.allow_nagad_payment) : true,
    allow_online_payment: shop?.allow_online_payment !== undefined ? Boolean(shop.allow_online_payment) : true,
    allow_binding: shop?.allow_binding !== undefined ? (shop.allow_binding !== 0 && shop.allow_binding !== false && shop.allow_binding !== '0') : true,
    allow_photo: shop?.allow_photo !== undefined ? (shop.allow_photo !== 0 && shop.allow_photo !== false && shop.allow_photo !== '0') : true,
    allow_edit: shop?.allow_edit !== undefined ? (shop.allow_edit !== 0 && shop.allow_edit !== false && shop.allow_edit !== '0') : true,
    allow_discount: shop?.allow_discount !== undefined ? (shop.allow_discount !== 0 && shop.allow_discount !== false && shop.allow_discount !== '0') : true,
    discount_min_pages: shop?.discount_min_pages || 50,
    discount_percent: shop?.discount_percent || 10,
    discount_tier2_pages: shop?.discount_tier2_pages || 100,
    discount_tier2_percent: shop?.discount_tier2_percent || 15
  });

  const [activeTab, setActiveTab] = useState(initialTab); // 'general' | 'biz' | 'pricing' | 'payment'

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [showAdvancedBkash, setShowAdvancedBkash] = useState(false);
  const [showAdvancedNagad, setShowAdvancedNagad] = useState(false);
  const [showAdvancedUddoktapay, setShowAdvancedUddoktapay] = useState(false);

  const shopImageInputRef = useRef(null);
  const tradeLicenseInputRef = useRef(null);
  const bkashQrInputRef = useRef(null);
  const nagadQrInputRef = useRef(null);

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
        
        {/* Hidden File Inputs for Shop Photo, Trade License & MFS QR Codes */}
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
        <input
          type="file"
          ref={bkashQrInputRef}
          accept="image/*"
          onChange={e => handleImageUpload(e, 'bkash_qr_image')}
          className="hidden"
        />
        <input
          type="file"
          ref={nagadQrInputRef}
          accept="image/*"
          onChange={e => handleImageUpload(e, 'nagad_qr_image')}
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
                <h3 className="font-extrabold text-sm text-slate-800">
                  {isBn ? 'দোকানের প্রোফাইল ও ব্যবসায়িক যাচাইকরণ' : 'Shop Profile & Business Verification'}
                </h3>
                {shop?.is_verified ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {isBn ? 'যাচাইকৃত' : 'VERIFIED'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
                    {isBn ? 'যাচাইকরণ প্রক্রিয়াধীন' : 'PENDING VERIFICATION'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'দোকানের লোগো, ছবি, ট্রেড লাইসেন্স স্ক্যান, মালিকের এনআইডি ও সময়সূচী পরিচালনা করুন' : 'Manage shop branding photos, trade license scan, owner NID & hours'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-white">
          {[
            { id: 'general', label: isBn ? '🏪 পরিচয় ও ছবি' : '🏪 Shop Identity & Photo', icon: Store },
            { id: 'biz', label: isBn ? '📜 ট্রেড লাইসেন্স ও এনআইডি' : '📜 Trade License & Owner NID', icon: ShieldCheck },
            { id: 'pricing', label: isBn ? '🏷️ রেট ও ডিসকাউন্ট' : '🏷️ Rates & Bulk Discounts', icon: Percent },
            { id: 'payment', label: isBn ? '💳 বিকাশ ও নগদ অ্যাকাউন্ট' : '💳 bKash & Nagad Accounts', icon: CreditCard }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
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
                  {isBn ? 'দোকানের সামনের ছবি (স্টোরফ্রন্ট / কাউন্টার)' : 'Shop Storefront / Counter Photo'}
                </label>
                <p className="text-[11px] text-slate-500">
                  {isBn 
                    ? 'কাস্টমার আপলোড পেজ এবং ডিজিটাল পিকআপ টিকিটে প্রদর্শিত হবে যাতে কাস্টমাররা সহজেই আপনার দোকান চিনতে পারেন।'
                    : 'Displayed on customer upload pages and digital pickup tickets to help customers easily locate your shop.'}
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
                        className="px-3 py-1.5 bg-white/90 text-slate-900 rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-white transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> {isBn ? 'দেখুন' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={() => shopImageInputRef.current?.click()}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-blue-500 transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" /> {isBn ? 'ছবি পরিবর্তন' : 'Replace Photo'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, shop_image: '' })}
                        className="p-1.5 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition cursor-pointer"
                        title={isBn ? 'ছবি মুছুন' : 'Remove photo'}
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
                      <p className="font-extrabold text-slate-800 text-xs">
                        {isBn ? 'দোকানের ছবি তুলুন বা আপলোড করুন' : 'Take / Upload Shop Photo'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isBn ? 'ক্যামেরা দিয়ে ছবি তুলুন বা ডিভাইস থেকে ছবি নির্বাচন করুন (JPG, PNG)' : 'Click to take photo with phone camera or upload from device (JPG, PNG)'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'দোকানের নাম' : 'Shop Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'দোকানের স্লোগান / ট্যাগলাইন' : 'Shop Tagline / Slogan'}
                  </label>
                  <input
                    type="text"
                    placeholder={isBn ? 'যেমন: দ্রুত লেজার প্রিন্টিং ও থিসিস বাইন্ডিং' : 'e.g. Fastest Laser Printing & Thesis Binding'}
                    value={formData.tagline}
                    onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'প্রধান কাউন্টার ফোন নম্বর' : 'Primary Counter Phone'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'বিকল্প / হোয়াটসঅ্যাপ নম্বর' : 'Alternate / WhatsApp Phone'}
                  </label>
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
                <label className="font-bold text-slate-700 block mb-1">
                  {isBn ? 'দোকানের পূর্ণ ঠিকানা / ল্যান্ডমার্ক' : 'Full Shop Address / Landmark'}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'যেমন: দোকান ১৪, নিচতলা, নীলক্ষেত মার্কেট, ঢাকা' : 'e.g. Shop 14, Ground Floor, Nilkhet Market, Dhaka'}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isBn ? 'গুগল ম্যাপ লোকেশন লিংক' : 'Google Maps Location Link'}
                </label>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={formData.maps_url}
                  onChange={e => setFormData({ ...formData, maps_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isBn ? 'প্রদত্ত সেবাসমূহ (কমা দিয়ে আলাদা করুন)' : 'Services Offered (Comma Separated)'}
                </label>
                <input
                  type="text"
                  value={formData.services_offered}
                  onChange={e => setFormData({ ...formData, services_offered: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'দোকান খোলার সময়' : 'Opening Time'}
                  </label>
                  <input
                    type="time"
                    value={formData.opening_time}
                    onChange={e => setFormData({ ...formData, opening_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'দোকান বন্ধের সময়' : 'Closing Time'}
                  </label>
                  <input
                    type="time"
                    value={formData.closing_time}
                    onChange={e => setFormData({ ...formData, closing_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              {/* Shop Status Toggle */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-800">
                    {isBn ? 'দোকানের বর্তমান অবস্থা' : 'Current Shop Status'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isBn ? 'বন্ধ রাখলে কাস্টমার আপলোড পেজে দোকান সাময়িক বন্ধ দেখাবে' : 'When closed, customers will see your shop as temporarily unavailable'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_closed: formData.is_closed ? 0 : 1 })}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition flex items-center gap-1.5 border ${
                    !formData.is_closed
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${!formData.is_closed ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`}></span>
                  {!formData.is_closed 
                    ? (isBn ? '🟢 বর্তমানে খোলা' : '🟢 Currently OPEN') 
                    : (isBn ? '🔴 বর্তমানে বন্ধ' : '🔴 Currently CLOSED')}
                </button>
              </div>

              {/* Counter Promo / Notice to Customers Banner */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  📢 {isBn ? 'কাউন্টার প্রোমো / কাস্টমারদের জন্য নোটিশ' : 'Counter Promo / Customer Notice'}
                </label>
                <textarea
                  rows="2"
                  placeholder={isBn ? 'যেমন: পাসপোর্ট ছবি প্রিন্ট ও স্পাইরাল বাইন্ডিং করা হয়! ১০০+ পেজে ১০% ছাড়।' : 'e.g. Passport photo printing & Spiral binding available! 10% off on 100+ pages.'}
                  value={formData.counter_notice}
                  onChange={e => setFormData({ ...formData, counter_notice: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isBn ? 'এই ব্যানারটি কাস্টমার আপলোড পেজের শীর্ষে প্রদর্শিত হবে।' : 'This banner appears at the top of your customer upload page.'}
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: Trade License & Owner Info */}
          {activeTab === 'biz' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-900 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  {isBn ? 'ব্যবসায়িক যাচাইকরণ ও ট্রাস্ট ব্যাজ' : 'Business Verification Trust Badge'}
                </p>
                <p className="text-[11px] leading-relaxed">
                  {isBn 
                    ? 'আপনার ট্রেড লাইসেন্সের ছবি ও জাতীয় পরিচয়পত্র (NID) নম্বর যুক্ত করুন। যাচাইকৃত দোকানগুলো কাস্টমারদের আস্থা অর্জন করে এবং স্ট্যান্ডিতে ভেরিফাইড ব্যাজ পায়।'
                    : 'Take a photo of your Trade License document and enter your National ID. Verified shops receive higher customer trust, verified badges on standees, and priority placement in the shop directory.'}
                </p>
              </div>

              {/* Trade License Photo Document Uploader */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-extrabold text-slate-800 block">
                  {isBn ? 'ট্রেড লাইসেন্সের ছবি / স্ক্যান কপি' : 'Trade License Photo / Document Scan'}
                </label>
                <p className="text-[11px] text-slate-500">
                  {isBn ? 'সিটি কর্পোরেশন বা ইউনিয়ন পরিষদের ট্রেড লাইসেন্স সনদের স্পষ্ট ছবি তুলুন।' : 'Take a clear picture of your City Corporation / Union Parishad trade license certificate.'}
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
                        className="px-3 py-1.5 bg-white/90 text-slate-900 rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-white transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> {isBn ? 'ডকুমেন্ট দেখুন' : 'View Document'}
                      </button>
                      <button
                        type="button"
                        onClick={() => tradeLicenseInputRef.current?.click()}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-blue-500 transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" /> {isBn ? 'পুনরায় তুলুন' : 'Retake Photo'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, trade_license_image: '' })}
                        className="p-1.5 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition cursor-pointer"
                        title={isBn ? 'মুছে ফেলুন' : 'Remove document'}
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
                      <p className="font-extrabold text-slate-800 text-xs">
                        {isBn ? 'ট্রেড লাইসেন্সের ছবি আপলোড করুন' : 'Take / Upload Trade License Photo'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isBn ? 'ক্যামেরা দিয়ে স্ক্যান করুন বা ফাইল নির্বাচন করুন (JPG, PNG)' : 'Click to scan with phone camera or select file (JPG, PNG)'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'মালিক / স্বত্বাধিকারীর পূর্ণ নাম' : 'Owner / Proprietor Full Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={isBn ? 'যেমন: মোঃ সাকিব রহমান' : 'e.g. Md. Shakib Rahman'}
                    value={formData.owner_name}
                    onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'ট্রেড লাইসেন্স নম্বর' : 'Trade License Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TRAD/DNCC/123456/2026"
                    value={formData.trade_license}
                    onChange={e => setFormData({ ...formData, trade_license: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'মালিকের এনআইডি নম্বর' : 'Owner NID (National ID Number)'}
                  </label>
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
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'সাদাকালো A4 রেট (৳)' : 'B&W A4 Rate (৳)'}
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.price_bw}
                    onChange={e => setFormData({ ...formData, price_bw: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'কালার A4 রেট (৳)' : 'Color A4 Rate (৳)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.price_color}
                    onChange={e => setFormData({ ...formData, price_color: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'লিগ্যাল শিট রেট (৳)' : 'Legal Sheet Rate (৳)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.price_legal}
                    onChange={e => setFormData({ ...formData, price_legal: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'A3 শিট রেট (৳)' : 'A3 Sheet Rate (৳)'}
                  </label>
                  <input
                    type="number"
                    step="1.0"
                    value={formData.price_a3}
                    onChange={e => setFormData({ ...formData, price_a3: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              {/* Photo Studio Rates */}
              <div className={`p-4 rounded-2xl border transition ${formData.allow_photo ? 'bg-pink-50/50 border-pink-200/80' : 'bg-slate-50/80 border-slate-200 opacity-90'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-pink-900 flex items-center gap-1.5 text-xs">
                    <span>🖼️</span> {isBn ? 'ছবি প্রিন্ট স্টুডিও রেট (গ্লসি পেপার)' : 'Photo Studio Rates (Glossy Paper)'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allow_photo: !formData.allow_photo })}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition flex items-center gap-1 border ${
                      formData.allow_photo 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${formData.allow_photo ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}></span>
                    {formData.allow_photo ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'বন্ধ' : 'Disabled')}
                  </button>
                </div>
                {!formData.allow_photo ? (
                  <p className="text-[11px] text-slate-500 italic py-1 text-center">
                    {isBn ? 'এই সেবাটি বন্ধ রয়েছে। কাস্টমাররা ছবি প্রিন্টের অপশন দেখতে পাবেন না।' : 'Service is disabled. Customers cannot select photo print options.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        {isBn ? 'পাসপোর্ট ৪-কপি (৳)' : 'Passport 4-Pack (৳)'}
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={formData.price_passport_4}
                        onChange={e => setFormData({ ...formData, price_passport_4: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-pink-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        {isBn ? 'পাসপোর্ট ৮-কপি (৳)' : 'Passport 8-Pack (৳)'}
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={formData.price_passport_8}
                        onChange={e => setFormData({ ...formData, price_passport_8: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-pink-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        {isBn ? 'স্ট্যাম্প ৪-কপি (৳)' : 'Stamp 4-Pack (৳)'}
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={formData.price_stamp_4}
                        onChange={e => setFormData({ ...formData, price_stamp_4: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-pink-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        {isBn ? '4R ছবি ৪"×৬" (৳)' : '4R Photo 4x6" (৳)'}
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={formData.price_photo_4r}
                        onChange={e => setFormData({ ...formData, price_photo_4r: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        {isBn ? 'A4 ছবি শিট (৳)' : 'A4 Photo Sheet (৳)'}
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={formData.price_photo_a4}
                        onChange={e => setFormData({ ...formData, price_photo_a4: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Book Binding Extra Rates */}
              <div className={`p-4 rounded-2xl border transition ${formData.allow_binding ? 'bg-purple-50/50 border-purple-200/80' : 'bg-slate-50/80 border-slate-200 opacity-90'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                    <span>📖</span> {isBn ? 'বই ও ডকুমেন্ট বাইন্ডিং রেট' : 'Book Binding Extra Rates'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allow_binding: !formData.allow_binding })}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition flex items-center gap-1 border ${
                      formData.allow_binding 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${formData.allow_binding ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}></span>
                    {formData.allow_binding ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'বন্ধ' : 'Disabled')}
                  </button>
                </div>
                {!formData.allow_binding ? (
                  <p className="text-[11px] text-slate-500 italic py-1 text-center">
                    {isBn ? 'এই সেবাটি বন্ধ রয়েছে। কাস্টমাররা বাইন্ডিং অপশন দেখতে পাবেন না।' : 'Service is disabled. Customers cannot select binding options.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        {isBn ? 'স্পাইরাল বাইন্ডিং (৳)' : 'Spiral Binding (৳)'}
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={formData.price_bind_spiral}
                        onChange={e => setFormData({ ...formData, price_bind_spiral: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-purple-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        {isBn ? 'টেপ বাইন্ডিং (৳)' : 'Tape Binding (৳)'}
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={formData.price_bind_tape}
                        onChange={e => setFormData({ ...formData, price_bind_tape: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-purple-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        {isBn ? 'হার্ডকভার থিসিস (৳)' : 'Hardcover Thesis (৳)'}
                      </label>
                      <input
                        type="number"
                        step="5"
                        value={formData.price_bind_hardcover}
                        onChange={e => setFormData({ ...formData, price_bind_hardcover: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-purple-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Document Editing Fee (Word / Photoshop) */}
              <div className={`p-4 rounded-2xl border transition ${formData.allow_edit ? 'bg-amber-50/50 border-amber-200/80' : 'bg-slate-50/80 border-slate-200 opacity-90'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                    <span>✏️</span> {isBn ? 'ডকুমেন্ট এডিটিং ফি (Word / Photoshop)' : 'Document Editing Fee (Word / Photoshop)'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allow_edit: !formData.allow_edit })}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition flex items-center gap-1 border ${
                      formData.allow_edit 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${formData.allow_edit ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}></span>
                    {formData.allow_edit ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'বন্ধ' : 'Disabled')}
                  </button>
                </div>
                {!formData.allow_edit ? (
                  <p className="text-[11px] text-slate-500 italic py-1 text-center">
                    {isBn ? 'এই সেবাটি বন্ধ রয়েছে।' : 'Editing service is disabled.'}
                  </p>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      {isBn ? 'বেস এডিট ফি / ফাইল (৳)' : 'Base Edit Charge / File (৳)'}
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.price_edit}
                      onChange={e => setFormData({ ...formData, price_edit: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-amber-700 text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isBn ? 'নরমাল প্রিন্ট খরচের সাথে অতিরিক্ত যুক্ত হবে যখন কাস্টমার এডিট ও প্রিন্ট অপশন নির্বাচন করবেন।' : 'Added to normal print rates when customer chooses Edit & Print.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Bulk Discount Rules (Toggleable Service) */}
              <div className={`p-4 rounded-2xl border transition ${formData.allow_discount ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/80 border-slate-200 opacity-90'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Percent className="w-4 h-4 text-emerald-600" />
                    {isBn ? 'স্বয়ংক্রিয় বাল্ক ডিসকাউন্ট নিয়ম' : 'Auto Bulk Discount Rules'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allow_discount: !formData.allow_discount })}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition flex items-center gap-1 border ${
                      formData.allow_discount 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${formData.allow_discount ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}></span>
                    {formData.allow_discount ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'বন্ধ' : 'Disabled')}
                  </button>
                </div>

                {!formData.allow_discount ? (
                  <div className="py-2.5 px-3 bg-white/80 rounded-xl text-center border border-dashed border-slate-300">
                    <p className="text-[11px] font-bold text-slate-700">
                      {isBn ? '🚫 বাল্ক ডিসকাউন্ট বর্তমানে বন্ধ' : '🚫 Bulk Discount is disabled'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isBn 
                        ? 'এটি বন্ধ রাখলে কাস্টমাররা বেশি পাতা প্রিন্ট করলেও কোনো ডিসকাউন্ট প্রযোজ্য হবে না।' 
                        : 'When disabled, standard print rates apply regardless of page volume.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {isBn ? 'টিয়ার ১: সর্বনিম্ন পাতা' : 'Tier 1: Min Pages'}
                      </label>
                      <input
                        type="number"
                        value={formData.discount_min_pages}
                        onChange={e => setFormData({ ...formData, discount_min_pages: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {isBn ? 'টিয়ার ১: ছাড় %' : 'Tier 1: Discount %'}
                      </label>
                      <input
                        type="number"
                        value={formData.discount_percent}
                        onChange={e => setFormData({ ...formData, discount_percent: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {isBn ? 'টিয়ার ২: সর্বনিম্ন পাতা' : 'Tier 2: Min Pages'}
                      </label>
                      <input
                        type="number"
                        value={formData.discount_tier2_pages}
                        onChange={e => setFormData({ ...formData, discount_tier2_pages: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {isBn ? 'টিয়ার ২: ছাড় %' : 'Tier 2: Discount %'}
                      </label>
                      <input
                        type="number"
                        value={formData.discount_tier2_percent}
                        onChange={e => setFormData({ ...formData, discount_tier2_percent: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: Shop bKash & Nagad Merchant Account Setup */}
          {activeTab === 'payment' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Payment Methods Enabled/Disabled Toggle Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="font-extrabold text-slate-800 text-xs">
                      {isBn ? 'গ্রাহকদের পেমেন্ট মাধ্যমসমূহ' : 'Customer Payment Options'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {isBn ? 'সক্রিয় মাধ্যম নির্বাচন করুন' : 'Toggle active payment methods'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isBn 
                    ? 'আপনার দোকানে অর্ডার দেওয়ার সময় গ্রাহকরা কোন কোন মাধ্যমে পেমেন্ট করতে পারবেন তা নির্ধারণ করুন।'
                    : 'Select which payment options are available for customers when placing print orders at your shop.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Cash at Counter Toggle */}
                  <div className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                    formData.allow_cash_payment
                      ? 'bg-white border-emerald-300 ring-1 ring-emerald-200 shadow-2xs'
                      : 'bg-slate-100 border-slate-200 opacity-60'
                  }`}
                  onClick={() => setFormData({ ...formData, allow_cash_payment: !formData.allow_cash_payment })}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                        💵
                      </div>
                      <div>
                        <p className="font-extrabold text-xs text-slate-800">
                          {isBn ? 'কাউন্টারে নগদ ক্যাশ' : 'Cash at Counter'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isBn ? 'ডেলিভারির সময় পরিশোধ' : 'Pay on pickup'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                      formData.allow_cash_payment ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                        formData.allow_cash_payment ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </div>
                  </div>

                  {/* bKash Payment Toggle */}
                  <div className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                    formData.allow_bkash_payment
                      ? 'bg-white border-pink-300 ring-1 ring-pink-200 shadow-2xs'
                      : 'bg-slate-100 border-slate-200 opacity-60'
                  }`}
                  onClick={() => setFormData({ ...formData, allow_bkash_payment: !formData.allow_bkash_payment })}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-14 h-8 rounded-lg bg-white flex items-center justify-center px-1.5 py-0.5 border border-pink-200 shadow-2xs">
                        <img src="/bkash-logo.png" alt="bKash" className="h-5 w-auto max-w-full object-contain" />
                      </div>
                      <div>
                        <p className="font-extrabold text-xs text-slate-800">bKash</p>
                        <p className="text-[10px] text-pink-600 font-semibold">
                          {formData.allow_bkash_payment ? (isBn ? 'সক্রিয়' : 'Enabled') : (isBn ? 'বন্ধ' : 'Disabled')}
                        </p>
                      </div>
                    </div>
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                      formData.allow_bkash_payment ? 'bg-pink-600' : 'bg-slate-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                        formData.allow_bkash_payment ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </div>
                  </div>

                  {/* Nagad Payment Toggle */}
                  <div className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                    formData.allow_nagad_payment
                      ? 'bg-white border-orange-300 ring-1 ring-orange-200 shadow-2xs'
                      : 'bg-slate-100 border-slate-200 opacity-60'
                  }`}
                  onClick={() => setFormData({ ...formData, allow_nagad_payment: !formData.allow_nagad_payment })}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-14 h-8 rounded-lg bg-white flex items-center justify-center px-1.5 py-0.5 border border-orange-200 shadow-2xs">
                        <img src="/nagad-logo.png" alt="Nagad" className="h-5 w-auto max-w-full object-contain" />
                      </div>
                      <div>
                        <p className="font-extrabold text-xs text-slate-800">Nagad</p>
                        <p className="text-[10px] text-orange-600 font-semibold">
                          {formData.allow_nagad_payment ? (isBn ? 'সক্রিয়' : 'Enabled') : (isBn ? 'বন্ধ' : 'Disabled')}
                        </p>
                      </div>
                    </div>
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                      formData.allow_nagad_payment ? 'bg-orange-600' : 'bg-slate-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                        formData.allow_nagad_payment ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-blue-950 flex items-start gap-2.5 text-xs">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-blue-900">
                    {isBn ? 'দোকানের নিজস্ব মার্চেন্ট পেমেন্ট' : 'Direct Shop Merchant Payouts'}
                  </p>
                  <p className="text-[11px] text-blue-800/90 leading-relaxed mt-0.5">
                    {isBn 
                      ? 'গ্রাহকদের দেওয়া অর্থ সরাসরি আপনার বিকাশ বা নগদ মার্চেন্ট একাউন্টে জমা হবে। নিচে আপনার নম্বর সেট করুন ও QR কোড আপলোড করুন।'
                      : <>Payments from your customers go <strong>directly to your own bKash / Nagad merchant account</strong>. Configure your merchant numbers and upload your counter QR code below.</>}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* 1. bKash Merchant Setup */}
                <div className="p-4 bg-pink-50/70 rounded-2xl border border-pink-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-pink-900 text-xs flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-pink-600" />
                      {isBn ? 'বিকাশ মার্চেন্ট অ্যাকাউন্ট' : 'bKash Merchant Account'}
                    </span>
                    <select
                      value={formData.bkash_type}
                      onChange={e => setFormData({ ...formData, bkash_type: e.target.value })}
                      className="bg-white border border-pink-300 text-[10px] font-bold text-pink-900 rounded-lg px-2 py-1"
                    >
                      <option value="merchant">{isBn ? 'মার্চেন্ট (পেমেন্ট)' : 'Merchant (Make Payment / পেমেন্ট)'}</option>
                      <option value="personal">{isBn ? 'ব্যক্তিগত (সেন্ড মানি)' : 'Personal (Send Money)'}</option>
                      <option value="agent">{isBn ? 'এজেন্ট (ক্যাশ আউট)' : 'Agent Cash Out'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-pink-900 uppercase block mb-1">
                      {isBn 
                        ? `দোকানের বিকাশ ${formData.bkash_type === 'merchant' ? 'মার্চেন্ট' : 'অ্যাকাউন্ট'} নম্বর` 
                        : `Shop bKash ${formData.bkash_type === 'merchant' ? 'Merchant' : 'Account'} Number`}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 017XXXXXXXX"
                      value={formData.bkash_number}
                      onChange={e => setFormData({ ...formData, bkash_number: e.target.value })}
                      className="w-full bg-white border border-pink-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 text-xs"
                    />
                    <p className="text-[10px] text-pink-700 mt-1">
                      {isBn ? 'গ্রাহকরা অর্ডারের টাকা সরাসরি এই বিকাশ নম্বরে পাঠাবেন।' : 'Customers paying for orders at your shop will send/make payment to this number.'}
                    </p>
                  </div>

                  {/* bKash Standee / Merchant QR Upload */}
                  <div className="pt-2 border-t border-pink-200/80">
                    <label className="text-[10px] font-bold text-pink-900 uppercase block mb-1.5">
                      {isBn ? 'বিকাশ কাউন্টার স্ট্যান্ডি কিউআর কোড (ঐচ্ছিক)' : 'bKash Counter Standee QR Code (Optional)'}
                    </label>
                    {formData.bkash_qr_image ? (
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-pink-200">
                        <img
                          src={formData.bkash_qr_image}
                          alt="bKash QR"
                          className="w-14 h-14 object-contain rounded-lg border border-slate-200 bg-white"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">
                            {isBn ? 'কাউন্টার কিউআর যুক্ত আছে' : 'Counter QR Uploaded'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {isBn ? 'চেকআউটে গ্রাহকদের দেখানো হবে' : 'Shown to customers on checkout'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewImageModal(formData.bkash_qr_image)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer"
                            title="Preview QR"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, bkash_qr_image: '' })}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs cursor-pointer"
                            title="Remove QR"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => bkashQrInputRef.current?.click()}
                        className="w-full py-2.5 px-3 bg-white hover:bg-pink-100/60 border border-dashed border-pink-300 rounded-xl text-center transition flex items-center justify-center gap-1.5 text-pink-800 font-bold text-xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-pink-600" />
                        <span>{isBn ? 'বিকাশ স্ট্যান্ডি QR ছবি আপলোড করুন' : 'Upload bKash Standee QR Image'}</span>
                      </button>
                    )}
                  </div>

                  {/* Advanced Direct bKash Tokenized Gateway (Collapsible) */}
                  <div className="pt-2 border-t border-pink-200/80">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedBkash(!showAdvancedBkash)}
                      className="text-[11px] font-bold text-pink-800 hover:underline flex items-center justify-between w-full cursor-pointer"
                    >
                      <span>⚡ {isBn ? 'অফিসিয়াল বিকাশ পেমেন্ট গেটওয়ে API (ঐচ্ছিক)' : 'Direct bKash Tokenized PGW API (Optional)'}</span>
                      <span>{showAdvancedBkash ? (isBn ? '▲ লুকান' : '▲ Hide') : (isBn ? '▼ সেটআপ' : '▼ Setup')}</span>
                    </button>

                    {showAdvancedBkash && (
                      <div className="mt-2.5 space-y-2 bg-white/80 p-3 rounded-xl border border-pink-200 animate-in fade-in">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 block mb-0.5">bKash App Key</label>
                          <input
                            type="text"
                            placeholder="Your bKash App Key"
                            value={formData.bkash_app_key}
                            onChange={e => setFormData({ ...formData, bkash_app_key: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 block mb-0.5">bKash App Secret</label>
                          <input
                            type="password"
                            placeholder="Your bKash App Secret"
                            value={formData.bkash_app_secret}
                            onChange={e => setFormData({ ...formData, bkash_app_secret: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">bKash Username</label>
                            <input
                              type="text"
                              value={formData.bkash_username}
                              onChange={e => setFormData({ ...formData, bkash_username: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">bKash Password</label>
                            <input
                              type="password"
                              value={formData.bkash_password}
                              onChange={e => setFormData({ ...formData, bkash_password: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Nagad Merchant Setup */}
                <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-orange-900 text-xs flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-orange-600" />
                      {isBn ? 'নগদ মার্চেন্ট অ্যাকাউন্ট' : 'Nagad Merchant Account'}
                    </span>
                    <select
                      value={formData.nagad_type}
                      onChange={e => setFormData({ ...formData, nagad_type: e.target.value })}
                      className="bg-white border border-orange-300 text-[10px] font-bold text-orange-900 rounded-lg px-2 py-1"
                    >
                      <option value="merchant">{isBn ? 'মার্চেন্ট (পেমেন্ট)' : 'Merchant (Payment / পেমেন্ট)'}</option>
                      <option value="personal">{isBn ? 'ব্যক্তিগত (সেন্ড মানি)' : 'Personal (Send Money)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-orange-900 uppercase block mb-1">
                      {isBn 
                        ? `দোকানের নগদ ${formData.nagad_type === 'merchant' ? 'মার্চেন্ট' : 'অ্যাকাউন্ট'} নম্বর` 
                        : `Shop Nagad ${formData.nagad_type === 'merchant' ? 'Merchant' : 'Account'} Number`}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 018XXXXXXXX"
                      value={formData.nagad_number}
                      onChange={e => setFormData({ ...formData, nagad_number: e.target.value })}
                      className="w-full bg-white border border-orange-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 text-xs"
                    />
                    <p className="text-[10px] text-orange-700 mt-1">
                      {isBn ? 'গ্রাহকরা নগদ পেমেন্ট নির্বাচন করলে সরাসরি এই নম্বরে টাকা পাঠাবেন।' : 'Customers selecting Nagad will send or make payment directly to this number.'}
                    </p>
                  </div>

                  {/* Nagad QR Upload */}
                  <div className="pt-2 border-t border-orange-200/80">
                    <label className="text-[10px] font-bold text-orange-900 uppercase block mb-1.5">
                      {isBn ? 'নগদ কাউন্টার কিউআর কোড (ঐচ্ছিক)' : 'Nagad Counter QR Code (Optional)'}
                    </label>
                    {formData.nagad_qr_image ? (
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-orange-200">
                        <img
                          src={formData.nagad_qr_image}
                          alt="Nagad QR"
                          className="w-14 h-14 object-contain rounded-lg border border-slate-200 bg-white"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">
                            {isBn ? 'নগদ কিউআর যুক্ত আছে' : 'Nagad QR Uploaded'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {isBn ? 'চেকআউটে গ্রাহকদের দেখানো হবে' : 'Shown to customers on checkout'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewImageModal(formData.nagad_qr_image)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer"
                            title="Preview QR"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, nagad_qr_image: '' })}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs cursor-pointer"
                            title="Remove QR"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => nagadQrInputRef.current?.click()}
                        className="w-full py-2.5 px-3 bg-white hover:bg-orange-100/60 border border-dashed border-orange-300 rounded-xl text-center transition flex items-center justify-center gap-1.5 text-orange-800 font-bold text-xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-orange-600" />
                        <span>{isBn ? 'নগদ স্ট্যান্ডি QR ছবি আপলোড করুন' : 'Upload Nagad Standee QR Image'}</span>
                      </button>
                    )}
                    {/* Direct Nagad PGW API (Optional) */}
                    <div className="pt-2 border-t border-orange-200/80">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedNagad(!showAdvancedNagad)}
                        className="text-[11px] font-bold text-orange-900 hover:underline flex items-center justify-between w-full cursor-pointer"
                      >
                        <span>⚡ {isBn ? 'অফিসিয়াল নগদ PGW API (ঐচ্ছিক)' : 'Direct Nagad Official PGW API (Optional)'}</span>
                        <span>{showAdvancedNagad ? (isBn ? '▲ লুকান' : '▲ Hide') : (isBn ? '▼ সেটআপ' : '▼ Setup')}</span>
                      </button>

                      {showAdvancedNagad && (
                        <div className="mt-2.5 space-y-2 bg-white/80 p-3 rounded-xl border border-orange-200 animate-in fade-in">
                          <div>
                            <label className="text-[9px] font-bold text-slate-700 block mb-0.5">Nagad Merchant ID</label>
                            <input
                              type="text"
                              placeholder="e.g. 6800000025 or 683002007104225"
                              value={formData.nagad_merchant_id}
                              onChange={e => setFormData({ ...formData, nagad_merchant_id: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[9px] font-bold text-slate-700">Nagad PG Public Key (Certificate)</label>
                              {formData.nagad_public_key && (
                                <span className={`text-[9px] font-mono font-bold ${formData.nagad_public_key.length < 200 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {formData.nagad_public_key.length} chars {formData.nagad_public_key.length < 200 && '(⚠️ Typically ~390 chars)'}
                                </span>
                              )}
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Starts with MIIBIj... or -----BEGIN PUBLIC KEY----- (~390 chars)"
                              value={formData.nagad_public_key}
                              onChange={e => setFormData({ ...formData, nagad_public_key: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-mono"
                            />
                            {formData.nagad_public_key && formData.nagad_public_key.startsWith('MIIEv') && (
                              <p className="text-[9px] text-rose-600 mt-0.5 font-medium">⚠️ Notice: Keys starting with "MIIEv" are typically Private Keys. Make sure Public and Private keys are not swapped.</p>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[9px] font-bold text-slate-700">Merchant RSA Private Key</label>
                              {formData.nagad_private_key && (
                                <span className={`text-[9px] font-mono font-bold ${formData.nagad_private_key.length < 500 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {formData.nagad_private_key.length} chars {formData.nagad_private_key.length < 500 && '(⚠️ Truncated! Full key is ~1600+ chars)'}
                                </span>
                              )}
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Starts with MIIEv... or -----BEGIN RSA PRIVATE KEY----- (~1600+ chars)"
                              value={formData.nagad_private_key}
                              onChange={e => setFormData({ ...formData, nagad_private_key: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-mono"
                            />
                            {formData.nagad_private_key && formData.nagad_private_key.startsWith('MIIBIj') && (
                              <p className="text-[9px] text-rose-600 mt-0.5 font-medium">⚠️ Notice: Keys starting with "MIIBIj" are typically Public Keys. Make sure Public and Private keys are not swapped.</p>
                            )}
                            {formData.nagad_private_key && formData.nagad_private_key.length < 200 && (
                              <p className="text-[9px] text-amber-600 mt-0.5 leading-tight">
                                💡 If copying from a tutorial/screenshot with "...", open the full <code>.key</code> / <code>.env</code> file to copy the complete 1600+ character key.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* UddoktaPay Merchant API (Optional) */}
                  <div className="pt-2 border-t border-orange-200/80">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedUddoktapay(!showAdvancedUddoktapay)}
                      className="text-[11px] font-bold text-orange-800 hover:underline flex items-center justify-between w-full cursor-pointer"
                    >
                      <span>🚀 {isBn ? 'উদ্যোক্তাপে (UddoktaPay) মার্চেন্ট API (ঐচ্ছিক)' : 'UddoktaPay Merchant API Key (Optional)'}</span>
                      <span>{showAdvancedUddoktapay ? (isBn ? '▲ লুকান' : '▲ Hide') : (isBn ? '▼ সেটআপ' : '▼ Setup')}</span>
                    </button>

                    {showAdvancedUddoktapay && (
                      <div className="mt-2.5 bg-white/80 p-3 rounded-xl border border-orange-200 animate-in fade-in">
                        <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                          {isBn ? 'দোকানের UddoktaPay API Key' : 'Your Shop UddoktaPay API Key'}
                        </label>
                        <input
                          type="password"
                          placeholder="Your Shop API Key"
                          value={formData.uddoktapay_api_key}
                          onChange={e => setFormData({ ...formData, uddoktapay_api_key: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono"
                        />
                        <p className="text-[9px] text-slate-500 mt-1">
                          {isBn ? 'এটি সেট করা থাকলে স্বয়ংক্রিয় অনলাইন পেমেন্ট আপনার উদ্যোক্তাপে মার্চেন্ট অ্যাকাউন্টে জমা হবে।' : 'If set, automated online payments will settle directly into your UddoktaPay merchant account.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Footer Save Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" /> {isBn ? 'সংরক্ষিত!' : 'Saved!'}
                </>
              ) : saving ? (
                isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving Profile...'
              ) : (
                <>
                  <Save className="w-4 h-4" /> {isBn ? 'দোকান প্রোফাইল সংরক্ষণ করুন' : 'Save Shop Profile'}
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
