import React, { useState } from 'react';
import {
  Wrench, Calculator, FileText, Printer, BookOpen, Scissors,
  Layers, DollarSign, Receipt, Sparkles, Check, Copy, X, Plus, Trash2,
  Maximize2, HelpCircle, Wand2, Image as ImageIcon, FileSpreadsheet, Lock,
  FileCheck, Shield, Sparkle, RefreshCw, Zap, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ShopToolsModal({ shop, onClose }) {
  const { isBn } = useLanguage();
  const [activeTool, setActiveTool] = useState('calc'); // 'calc' | 'duplex' | 'receipt' | 'sizes' | 'cash'

  // Tool 1: Book & Binding Pricing Calculator
  const [calcPages, setCalcPages] = useState(100);
  const [calcCopies, setCalcCopies] = useState(1);
  const [calcPrintType, setCalcPrintType] = useState('bw_duplex'); // 'bw_simplex', 'bw_duplex', 'color_simplex', 'color_duplex'
  const [calcGsm, setCalcGsm] = useState('70'); // '70', '80', '100'
  const [calcBinding, setCalcBinding] = useState('spiral'); // 'none', 'spiral', 'comb', 'tape', 'hard'
  const [calcLaminate, setCalcLaminate] = useState('none'); // 'none', 'gloss_a4', 'matte_a4'

  // Tool 2: Duplex Sheet & Ream Helper
  const [duplexPages, setDuplexPages] = useState(120);
  const [duplexCopies, setDuplexCopies] = useState(3);

  // Tool 3: Walk-in Cash Memo / Receipt
  const [receiptCustomer, setReceiptCustomer] = useState('');
  const [receiptPhone, setReceiptPhone] = useState('');
  const [receiptItems, setReceiptItems] = useState([
    { desc: 'A4 B&W Laser Print', qty: 25, unitPrice: parseFloat(shop?.price_bw || 2) },
    { desc: 'Spiral Binding (Plastic Sheet)', qty: 1, unitPrice: 30 }
  ]);
  const [receiptDiscount, setReceiptDiscount] = useState(0);

  // Tool 4: Cash Drawer Register
  const [cashOpening, setCashOpening] = useState(500);
  const [cashEntries, setCashEntries] = useState([
    { id: 1, type: 'in', desc: 'Walk-in Photocopy (150 copies)', amount: 300, time: '09:30 AM' },
    { id: 2, type: 'out', desc: 'Paper Ream Purchase (Double A 80gsm)', amount: 420, time: '11:15 AM' }
  ]);
  const [newEntryDesc, setNewEntryDesc] = useState('');
  const [newEntryAmount, setNewEntryAmount] = useState('');
  const [newEntryType, setNewEntryType] = useState('in');

  // Pricing calculations
  const calculateBookPrice = () => {
    const pages = parseInt(calcPages || 0, 10);
    const copies = parseInt(calcCopies || 1, 10);
    
    // Base print rate per page
    let ratePerPage = 2.0;
    if (calcPrintType === 'bw_simplex') ratePerPage = parseFloat(shop?.price_bw || 2.0);
    if (calcPrintType === 'bw_duplex') ratePerPage = parseFloat(shop?.price_bw || 2.0) * 0.9; // 10% duplex discount
    if (calcPrintType === 'color_simplex') ratePerPage = parseFloat(shop?.price_color || 10.0);
    if (calcPrintType === 'color_duplex') ratePerPage = parseFloat(shop?.price_color || 10.0) * 0.9;

    // GSM extra surcharge
    let gsmExtra = 0;
    if (calcGsm === '80') gsmExtra = 0.30;
    if (calcGsm === '100') gsmExtra = 1.00;

    const printCost = pages * (ratePerPage + gsmExtra) * copies;

    // Binding cost
    let bindingCost = 0;
    if (calcBinding === 'spiral') bindingCost = 30 * copies;
    if (calcBinding === 'comb') bindingCost = 25 * copies;
    if (calcBinding === 'tape') bindingCost = 15 * copies;
    if (calcBinding === 'hard') bindingCost = 150 * copies;

    // Lamination
    let lamCost = 0;
    if (calcLaminate === 'gloss_a4') lamCost = 20 * copies;
    if (calcLaminate === 'matte_a4') lamCost = 30 * copies;

    const total = printCost + bindingCost + lamCost;
    const sheetsUsed = (calcPrintType.includes('duplex') ? Math.ceil(pages / 2) : pages) * copies;

    return { total, printCost, bindingCost, lamCost, sheetsUsed };
  };

  const bookCalc = calculateBookPrice();

  // Receipt Calculations
  const receiptSubtotal = receiptItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const receiptTotal = Math.max(0, receiptSubtotal - parseFloat(receiptDiscount || 0));

  const addReceiptItem = () => {
    setReceiptItems([...receiptItems, { desc: 'Custom Printing / Service', qty: 1, unitPrice: 10 }]);
  };

  const removeReceiptItem = (index) => {
    setReceiptItems(receiptItems.filter((_, i) => i !== index));
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Cash Register Calculations
  const totalCashIn = cashEntries.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0);
  const totalCashOut = cashEntries.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);
  const currentCashBalance = parseFloat(cashOpening || 0) + totalCashIn - totalCashOut;

  const addCashEntry = (e) => {
    e.preventDefault();
    if (!newEntryDesc || !newEntryAmount) return;
    setCashEntries([
      ...cashEntries,
      {
        id: Date.now(),
        type: newEntryType,
        desc: newEntryDesc,
        amount: parseFloat(newEntryAmount),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setNewEntryDesc('');
    setNewEntryAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-sans">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-800">
                  {isBn ? 'প্রিন্ট ও ফটোকপি কাউন্টার টুল স্যুট' : 'Print & Photocopy Counter Tool Suite'}
                </h3>
                <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                  {isBn ? 'ফ্রি প্রো টুলস' : 'FREE PRO TOOLS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'দ্রুত ক্যালকুলেটর, ডুপ্লেক্স কাগজ হিসাব, ওয়াক-ইন রসিদ ও ক্যাশ ড্রয়ার' : 'Quick calculators, paper sheets converter, walk-in receipts & counter drawer'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tool Navigation Bar */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-white">
          {[
            { id: 'calc', label: isBn ? '📖 বই ও বাইন্ডিং রেট' : '📖 Book & Binding Pricing', icon: Calculator },
            { id: 'duplex', label: isBn ? '📑 ডুপ্লেক্স ও কাগজ হিসাব' : '📑 Duplex & Sheets Helper', icon: Layers },
            { id: 'receipt', label: isBn ? '🧾 ওয়াক-ইন ক্যাশ মেমো' : '🧾 Walk-in Cash Memo', icon: Receipt },
            { id: 'sizes', label: isBn ? '📐 কাগজ ও ছবির মাপ' : '📐 Paper & Photo Sizes', icon: Maximize2 },
            { id: 'cash', label: isBn ? '💰 কাউন্টার ক্যাশ ড্রয়ার' : '💰 Counter Cash Register', icon: DollarSign },
            { id: 'pdf_tools', label: isBn ? '📄 পিডিএফ টুলস' : '📄 PDF Power Tools', icon: FileText, badge: isBn ? 'শীঘ্রই' : 'SOON' },
            { id: 'image_tools', label: isBn ? '🖼️ ছবি ও স্টুডিও' : '🖼️ Image & Photo Studio', icon: Sparkles, badge: isBn ? 'শীঘ্রই' : 'SOON' }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTool === t.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.badge && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase ${
                    activeTool === t.id ? 'bg-amber-400 text-slate-950' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tool Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* TOOL 1: Book & Binding Calculator */}
          {activeTool === 'calc' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'মোট ডকুমেন্টের পৃষ্ঠা' : 'Total Document Pages'}
                  </label>
                  <input
                    type="number"
                    value={calcPages}
                    onChange={e => setCalcPages(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'বই বা কপির সংখ্যা (সেট)' : 'Number of Book Sets / Copies'}
                  </label>
                  <input
                    type="number"
                    value={calcCopies}
                    onChange={e => setCalcCopies(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'প্রিন্ট কালার ও ডুপ্লেক্স মোড' : 'Print Color & Duplex Mode'}
                  </label>
                  <select
                    value={calcPrintType}
                    onChange={e => setCalcPrintType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  >
                    <option value="bw_simplex">
                      {isBn ? '⬛ সাদাকালো (এক পিঠ / সিঙ্গেল সাইড)' : '⬛ Black & White (Single Sided)'}
                    </option>
                    <option value="bw_duplex">
                      {isBn ? '⬛ সাদাকালো (উভয় পিঠ / ডাবল সাইড)' : '⬛ Black & White (Double Sided / Both Side)'}
                    </option>
                    <option value="color_simplex">
                      {isBn ? '🎨 কালার লেজার (এক পিঠ)' : '🎨 Color Laser (Single Sided)'}
                    </option>
                    <option value="color_duplex">
                      {isBn ? '🎨 কালার লেজার (উভয় পিঠ)' : '🎨 Color Laser (Double Sided)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'কাগজের ঘনত্ব (GSM)' : 'Paper Weight (GSM)'}
                  </label>
                  <select
                    value={calcGsm}
                    onChange={e => setCalcGsm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  >
                    <option value="70">
                      {isBn ? '৭০ জিএসএম (স্ট্যান্ডার্ড ফটোকপি কাগজ)' : '70 GSM (Standard Copy Paper)'}
                    </option>
                    <option value="80">
                      {isBn ? '৮০ জিএসএম (ডাবল এ / প্রিমিয়াম কাগজ +৳০.৩০/পৃ)' : '80 GSM (Double A / Premium Paper +৳0.30/p)'}
                    </option>
                    <option value="100">
                      {isBn ? '১০০ জিএসএম (থিসিস / ভারী কাগজ +৳১.০০/পৃ)' : '100 GSM (Thesis / Heavy Paper +৳1.00/p)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'বাইন্ডিং পদ্ধতি' : 'Binding Method'}
                  </label>
                  <select
                    value={calcBinding}
                    onChange={e => setCalcBinding(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  >
                    <option value="none">
                      {isBn ? 'বাইন্ডিং ছাড়া (খোলা পাতা)' : 'No Binding (Loose Sheets)'}
                    </option>
                    <option value="spiral">
                      {isBn ? 'স্পাইরাল বাইন্ডিং (প্লাস্টিক রিং + পিভিসি - ৳৩০)' : 'Spiral Binding (Plastic Ring + PVC Sheet - ৳30)'}
                    </option>
                    <option value="comb">
                      {isBn ? 'কম্ব বাইন্ডিং (৳২৫)' : 'Comb Binding (৳25)'}
                    </option>
                    <option value="tape">
                      {isBn ? 'স্ট্রিপ / টেপ বাইন্ডিং (৳১৫)' : 'Strip / Tape Binding (৳15)'}
                    </option>
                    <option value="hard">
                      {isBn ? 'হার্ডকভার গোল্ড ফয়েল থিসিস বাইন্ডিং (৳১৫০)' : 'Hardcover Gold Foil Thesis Binding (৳150)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'কভার ল্যামিনেশন' : 'Cover Lamination'}
                  </label>
                  <select
                    value={calcLaminate}
                    onChange={e => setCalcLaminate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  >
                    <option value="none">
                      {isBn ? 'ল্যামিনেশন নেই' : 'No Lamination'}
                    </option>
                    <option value="gloss_a4">
                      {isBn ? 'গ্লসি A4 ল্যামিনেশন (+৳২০)' : 'Glossy A4 Lamination (+৳20)'}
                    </option>
                    <option value="matte_a4">
                      {isBn ? 'ম্যাট ভেলভেট A4 ল্যামিনেশন (+৳৩০)' : 'Matte Velvet A4 Lamination (+৳30)'}
                    </option>
                  </select>
                </div>

              </div>

              {/* Estimate Calculation Summary Card */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-left w-full">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-extrabold text-[10px] rounded-full uppercase">
                      {isBn ? 'প্রস্তাবিত কাস্টমার রেট' : 'Suggested Customer Price'}
                    </span>
                    <span className="text-[11px] text-slate-300 font-mono">
                      {isBn ? `প্রয়োজনীয় পাতা: ${bookCalc.sheetsUsed} টি` : `Physical Sheets: ${bookCalc.sheetsUsed} sheets`}
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold text-white">৳{bookCalc.total.toFixed(2)}</h2>
                  <p className="text-[11px] text-slate-300">
                    {isBn 
                      ? `প্রিন্ট খরচ: ৳${bookCalc.printCost.toFixed(2)} · বাইন্ডিং: ৳${bookCalc.bindingCost.toFixed(2)} · ল্যামিনেশন: ৳${bookCalc.lamCost.toFixed(2)}`
                      : `Print Cost: ৳${bookCalc.printCost.toFixed(2)} · Binding: ৳${bookCalc.bindingCost.toFixed(2)} · Lamination: ৳${bookCalc.lamCost.toFixed(2)}`}
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Quotation: ৳${bookCalc.total.toFixed(2)} for ${calcCopies} book set(s) (${calcPages} pages, ${calcBinding} binding).`);
                    alert(isBn ? '✓ কোটেশন ক্লিপবোর্ডে কপি করা হয়েছে!' : '✓ Quote copied to clipboard!');
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shrink-0 transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> {isBn ? 'কোটেশন কপি' : 'Copy Quote'}
                </button>
              </div>
            </div>
          )}

          {/* TOOL 2: Duplex Sheet & Ream Helper */}
          {activeTool === 'duplex' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'পিডিএফ ডকুমেন্টের মোট পৃষ্ঠা' : 'Total PDF Document Pages'}
                  </label>
                  <input
                    type="number"
                    value={duplexPages}
                    onChange={e => setDuplexPages(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isBn ? 'কপির সংখ্যা (সেট)' : 'Number of Copy Sets'}
                  </label>
                  <input
                    type="number"
                    value={duplexCopies}
                    onChange={e => setDuplexCopies(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-slate-400 font-semibold text-[11px]">
                    {isBn ? 'এক পিঠ (সিঙ্গেল সাইড)' : 'Single Sided (Simplex)'}
                  </p>
                  <h4 className="text-xl font-extrabold text-slate-800 mt-1">
                    {isBn ? `${duplexPages * duplexCopies} টি পাতা` : `${duplexPages * duplexCopies} Sheets`}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isBn 
                      ? `(${((duplexPages * duplexCopies) / 500).toFixed(2)} রিম কাগজ)` 
                      : `(${((duplexPages * duplexCopies) / 500).toFixed(2)} Reams of paper)`}
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
                  <p className="text-indigo-600 font-semibold text-[11px]">
                    {isBn ? 'উভয় পিঠ (ডুপ্লেক্স)' : 'Double Sided (Duplex)'}
                  </p>
                  <h4 className="text-xl font-extrabold text-indigo-700 mt-1">
                    {isBn ? `${Math.ceil(duplexPages / 2) * duplexCopies} টি পাতা` : `${Math.ceil(duplexPages / 2) * duplexCopies} Sheets`}
                  </h4>
                  <p className="text-[10px] text-indigo-600 mt-0.5">
                    {isBn 
                      ? `৫০% কাগজ সাশ্রয়! (${((Math.ceil(duplexPages / 2) * duplexCopies) / 500).toFixed(2)} রিম)` 
                      : `50% paper savings! (${((Math.ceil(duplexPages / 2) * duplexCopies) / 500).toFixed(2)} Reams)`}
                  </p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <p className="text-emerald-700 font-semibold text-[11px]">
                    {isBn ? 'বাঁচানো কাগজের সংখ্যা' : 'Paper Saved'}
                  </p>
                  <h4 className="text-xl font-extrabold text-emerald-800 mt-1">
                    {isBn ? `${(duplexPages * duplexCopies) - (Math.ceil(duplexPages / 2) * duplexCopies)} টি পাতা` : `${(duplexPages * duplexCopies) - (Math.ceil(duplexPages / 2) * duplexCopies)} Sheets`}
                  </h4>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    {isBn ? 'পরিবেশবান্ধব ও সাশ্রয়ী প্রিন্ট' : 'Eco-friendly printing'}
                  </p>
                </div>
              </div>

              {/* Manual Duplex Flipping Guide */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1.5">
                <p className="font-extrabold text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  {isBn ? 'ম্যানুয়াল ডুপ্লেক্স কাউন্টার প্রিন্টিং নির্দেশিকা:' : 'Manual Duplex Counter Printing Step Guide:'}
                </p>
                <p className="text-[11px] leading-relaxed">
                  {isBn ? (
                    <>
                      ১. প্রথমে <strong>বিজোড় পৃষ্ঠাসমূহ প্রিন্ট করুন</strong> (১, ৩, ৫, ৭...)।<br />
                      ২. প্রিন্ট হওয়া কাগজের বান্ডিল না ওলট-পালট করে সোজা <strong>লম্বা পাশ ধরে উল্টিয়ে (বা ল্যান্ডস্কেপ হলে খাটো পাশ)</strong> ট্রে-তে পুনরায় রাখুন।<br />
                      ৩. এবার <strong>জোড় পৃষ্ঠাসমূহ রিভার্স অর্ডারে প্রিন্ট দিন</strong> (যদি প্রিন্টার উপরের দিকে বের করে)।
                    </>
                  ) : (
                    <>
                      1. Print <strong>ODD Pages First</strong> (1, 3, 5, 7...).<br />
                      2. Take the printed stack without reordering, flip on <strong>Long Edge (or Short Edge if Landscape)</strong> and reinsert into tray.<br />
                      3. Print <strong>EVEN Pages in REVERSE ORDER</strong> (if printer outputs face-up).
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* TOOL 3: Walk-in Cash Memo / Receipt */}
          {activeTool === 'receipt' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isBn ? 'কাস্টমারের নাম (ঐচ্ছিক)' : 'Customer Name (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={isBn ? 'যেমন: সাকিব' : 'e.g. Shakib'}
                      value={receiptCustomer}
                      onChange={e => setReceiptCustomer(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isBn ? 'ফোন নম্বর (ঐচ্ছিক)' : 'Phone Number (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="017XXXXXXXX"
                      value={receiptPhone}
                      onChange={e => setReceiptPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-2 pt-2">
                  <p className="font-bold text-slate-700">
                    {isBn ? 'রসিদের আইটেম তালিকা' : 'Receipt Line Items'}
                  </p>
                  {receiptItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.desc}
                        onChange={e => {
                          const updated = [...receiptItems];
                          updated[idx].desc = e.target.value;
                          setReceiptItems(updated);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                      />
                      <input
                        type="number"
                        placeholder={isBn ? 'পরিমাণ' : 'Qty'}
                        value={item.qty}
                        onChange={e => {
                          const updated = [...receiptItems];
                          updated[idx].qty = parseInt(e.target.value || 0, 10);
                          setReceiptItems(updated);
                        }}
                        className="w-20 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-center"
                      />
                      <input
                        type="number"
                        placeholder={isBn ? 'দর' : 'Rate'}
                        value={item.unitPrice}
                        onChange={e => {
                          const updated = [...receiptItems];
                          updated[idx].unitPrice = parseFloat(e.target.value || 0);
                          setReceiptItems(updated);
                        }}
                        className="w-24 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-right"
                      />
                      <span className="w-20 text-right font-extrabold text-slate-800">
                        ৳{(item.qty * item.unitPrice).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeReceiptItem(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addReceiptItem}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> {isBn ? 'আইটেম যোগ করুন' : 'Add Item'}
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600">
                      {isBn ? 'ছাড় (৳):' : 'Discount (৳):'}
                    </span>
                    <input
                      type="number"
                      value={receiptDiscount}
                      onChange={e => setReceiptDiscount(e.target.value)}
                      className="w-24 bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold">
                      {isBn ? 'মোট প্রদেয় টাকা' : 'Total Payable'}
                    </p>
                    <h3 className="text-2xl font-extrabold text-slate-900">৳{receiptTotal.toFixed(2)}</h3>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handlePrintReceipt}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> {isBn ? 'ক্যাশ মেমো প্রিন্ট করুন' : 'Print Cash Memo'}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TOOL 4: Common Paper & Photo Sizes Cheatsheet */}
          {activeTool === 'sizes' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: isBn ? 'A4 সাইজ কাগজ' : 'A4 Document', dim: '210 × 297 mm', in: '8.27 × 11.69 in', px: '2480 × 3508 px (300 DPI)', badge: isBn ? 'স্ট্যান্ডার্ড' : 'Standard' },
                  { name: isBn ? 'লিগ্যাল / দলিল সাইজ' : 'Legal / Folio Paper', dim: '216 × 356 mm', in: '8.5 × 14.0 in', px: '2550 × 4200 px (300 DPI)', badge: isBn ? 'দলিল / স্ট্যাম্প' : 'Deeds / Stamp' },
                  { name: isBn ? 'A3 পোস্টার শিট' : 'A3 Poster Sheet', dim: '297 × 420 mm', in: '11.69 × 16.53 in', px: '3508 × 4960 px (300 DPI)', badge: isBn ? 'বড় ফরম্যাট' : 'Large Format' },
                  { name: isBn ? 'পাসপোর্ট ছবি (বাংলাদেশ)' : 'Passport Photo (Bangladesh)', dim: '40 × 50 mm', in: '1.57 × 1.97 in', px: '472 × 591 px (300 DPI)', badge: isBn ? 'ভিসা / সরকারি' : 'Visa / Gov' },
                  { name: isBn ? 'ইউএস ভিসা ২×২ ছবি' : 'US Visa 2×2 Photo', dim: '51 × 51 mm', in: '2.0 × 2.0 in', px: '600 × 600 px (300 DPI)', badge: isBn ? 'ইউএস ভিসা' : 'US Visa' },
                  { name: isBn ? 'স্ট্যাম্প সাইজ ছবি' : 'Stamp Size Photo', dim: '20 × 25 mm', in: '0.79 × 0.98 in', px: '236 × 295 px (300 DPI)', badge: isBn ? 'ভর্তি ও আবেদন' : 'Admissions' }
                ].map((s, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs">{s.name}</span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {s.badge}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-700">{s.dim} · {s.in}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.px}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TOOL 5: Counter Cash Register */}
          {activeTool === 'cash' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {isBn ? 'শুরুর ক্যাশ ব্যালেন্স' : 'Opening Drawer Cash'}
                  </p>
                  <input
                    type="number"
                    value={cashOpening}
                    onChange={e => setCashOpening(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-extrabold text-slate-800 mt-1"
                  />
                </div>
                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">
                    {isBn ? 'মোট ক্যাশ গ্রহণ (IN)' : 'Total Cash IN'}
                  </p>
                  <h4 className="text-lg font-extrabold text-emerald-800 mt-1">+৳{totalCashIn.toFixed(2)}</h4>
                </div>
                <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200">
                  <p className="text-[10px] font-bold text-rose-600 uppercase">
                    {isBn ? 'মোট ক্যাশ খরচ (OUT)' : 'Total Cash OUT'}
                  </p>
                  <h4 className="text-lg font-extrabold text-rose-800 mt-1">-৳{totalCashOut.toFixed(2)}</h4>
                </div>
                <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase">
                    {isBn ? 'বর্তমান ক্যাশ মোট' : 'Current Drawer Total'}
                  </p>
                  <h4 className="text-lg font-extrabold text-indigo-800 mt-1">৳{currentCashBalance.toFixed(2)}</h4>
                </div>
              </div>

              {/* Add Entry Form */}
              <form onSubmit={addCashEntry} className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <select
                  value={newEntryType}
                  onChange={e => setNewEntryType(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-xs"
                >
                  <option value="in">{isBn ? '🟢 ক্যাশ গ্রহণ (বিক্রি/প্রিন্ট)' : '🟢 Cash IN (Sale/Print)'}</option>
                  <option value="out">{isBn ? '🔴 ক্যাশ খরচ (খরচ/ভাংতি)' : '🔴 Cash OUT (Expense/Change)'}</option>
                </select>

                <input
                  type="text"
                  placeholder={isBn ? 'বিবরণ (যেমন: কাগজ ক্রয়, গ্রাহকের পেমেন্ট)...' : 'Description (e.g. Paper Purchase, Customer Cash)...'}
                  value={newEntryDesc}
                  onChange={e => setNewEntryDesc(e.target.value)}
                  className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                />

                <input
                  type="number"
                  placeholder={isBn ? 'পরিমাণ (৳)' : 'Amount (৳)'}
                  value={newEntryAmount}
                  onChange={e => setNewEntryAmount(e.target.value)}
                  className="w-28 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                />

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isBn ? 'নথিভুক্ত করুন' : 'Record'}
                </button>
              </form>

              {/* Entries List */}
              <div className="space-y-1.5">
                {cashEntries.map(e => (
                  <div key={e.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                        e.type === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {e.type === 'in' ? (isBn ? 'ক্যাশ জমা' : 'Cash IN') : (isBn ? 'ক্যাশ খরচ' : 'Cash OUT')}
                      </span>
                      <span className="font-bold text-slate-800">{e.desc}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({e.time})</span>
                    </div>
                    <span className={`font-extrabold text-xs ${
                      e.type === 'in' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {e.type === 'in' ? '+' : '-'}৳{e.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TOOL 6: PDF Power Tools (Coming Soon) */}
          {activeTool === 'pdf_tools' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white rounded-3xl p-5 border border-indigo-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                      {isBn ? '🚀 নির্মাণাধীন' : '🚀 In Development'}
                    </span>
                    <span className="text-xs font-extrabold text-indigo-200">prntez Counter PDF Engine</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    {isBn ? 'ব্রাউজার-ভিত্তিক পিডিএফ ইউটিলিটি স্যুট' : 'Browser-Based PDF Utility Suite'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isBn 
                      ? 'কোনো আপলোড অপেক্ষা ছাড়াই আপনার ব্রাউজারে সরাসরি কাস্টমারদের ভারী পিডিএফ বিভক্ত, কম্প্রেস এবং একত্রিত করুন।'
                      : 'Process, split, compress, and reorder heavy customer PDFs directly in your browser with zero upload wait times.'}
                  </p>
                </div>

                <div className="px-3 py-1.5 bg-white/10 rounded-xl text-indigo-300 font-extrabold text-xs shrink-0 border border-white/10">
                  {isBn ? 'মুক্তির সময়: ২০২৬' : 'Release: Q4 2026'}
                </div>
              </div>

              {/* PDF Services Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                
                {/* 1. PDF Merge */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? 'পিডিএফ একত্রীকরণ (Merge & Combine)' : 'PDF Merge & Chapter Combiner'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'একাধিক লেকচার শিট বা স্ক্যান পাতা এক ক্লিকে একটি পূর্ণাঙ্গ প্রিন্ট-রেডি পিডিএফ ফাইলে সাজিয়ে নিন।'
                      : 'Combine multiple lecture notes, thesis chapters, or scan pages into a single print-ready PDF book.'}
                  </p>
                </div>

                {/* 2. PDF Page Range Splitter */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? 'পৃষ্ঠা রেঞ্জ আলাদা করা (Split Pages)' : 'Page Range Split & Extract'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'বড় বইয়ের নির্দিষ্ট পৃষ্ঠা রেঞ্জ (যেমন: ১৫-৪০) আলাদা করে বের করে দ্রুত প্রিন্ট করুন।'
                      : 'Extract specific page ranges (e.g., pages 15-40) from huge 500-page textbooks without printing unwanted pages.'}
                  </p>
                </div>

                {/* 3. PDF Size Compressor */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? 'উচ্চগতির পিডিএফ কম্প্রেসর' : 'High-Speed PDF Compressor'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'ভারী স্ক্যান করা ফাইলের সাইজ ছোট করে দ্রুততম সময়ে প্রিন্টারে পাঠান কোনো স্বচ্ছতা নষ্ট না করে।'
                      : 'Shrink heavy 60MB phone scans down to 2MB without losing text crispness for lightning-fast laser spooling.'}
                  </p>
                </div>

                {/* 4. Multi-Page Slide N-Up Layout */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? '২-ইন-১ / ৪-ইন-১ স্লাইড হ্যান্ডআউট' : '2-in-1 / 4-in-1 Slide Handouts'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'এক পাতায় একাধিক স্লাইড সাজিয়ে ছাত্রদের পড়ার জন্য খরচ বাঁচিয়ে প্রিন্ট করুন।'
                      : 'Auto-tile 2, 4, or 6 slides per page for university student handouts to save paper and printing cost.'}
                  </p>
                </div>

                {/* 5. Auto Deskew & Clean Scans */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? 'বাঁকা স্ক্যান সোজা ও পরিষ্কার' : 'Auto Deskew & Tilted Scan Fix'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'মোবাইলে তোলা বাঁকা পাতা ও কালো ছায়া স্বয়ংক্রিয়ভাবে পরিষ্কার করে ঝকঝকে করুন।'
                      : 'Automatically straighten tilted mobile phone camera scans and remove black scanner edges.'}
                  </p>
                </div>

                {/* 6. Thesis Watermark & Numbers */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? 'ওয়াটারমার্ক ও পেজ নম্বর যোগ' : 'Watermark & Page Numbering'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'হার্ডকভার বাইন্ডিংয়ের আগে কাস্টম ওয়াটারমার্ক বা পেজ নম্বর যুক্ত করুন।'
                      : 'Add custom confidential watermarks, department stamps, or page numbers before final hardcover binding.'}
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TOOL 7: Image & Photo Studio (Coming Soon) */}
          {activeTool === 'image_tools' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 text-white rounded-3xl p-5 border border-purple-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                      {isBn ? '✨ এআই ফটো স্টুডিও' : '✨ AI Photo Studio'}
                    </span>
                    <span className="text-xs font-extrabold text-purple-200">prntez Image & Passport Tools</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    {isBn ? 'কাউন্টার ফটো স্টুডিও ও আইডি এনহ্যান্সার' : 'Counter Photo Studio & ID Enhancer'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isBn 
                      ? 'গ্রাহকদের জন্য এক ক্লিকে পাসপোর্ট ছবির সেট তৈরি, এআই ব্যাকগ্রাউন্ড পরিবর্তন এবং আইডি কার্ডের দুই পিঠ এক পাতায় আনা।'
                      : 'Instant passport photo tiling, 1-click AI background removal, and 2-side ID card merging for walk-in counter customers.'}
                  </p>
                </div>

                <div className="px-3 py-1.5 bg-white/10 rounded-xl text-purple-300 font-extrabold text-xs shrink-0 border border-white/10">
                  {isBn ? 'মুক্তির সময়: ২০২৬' : 'Release: Q4 2026'}
                </div>
              </div>

              {/* Image Services Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                
                {/* 1. Passport Photo 8-in-1 Tiler */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? 'পাসপোর্ট ছবি ৮-ইন-১ শিট মেকার' : 'Passport Photo 8-in-1 Sheet Tiler'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? '১টি ছবি দিলে স্বয়ংক্রিয়ভাবে 4R ফটো পেপারে ৮ বা ১২ কপি কাটার দাগসহ সাজিয়ে প্রিন্ট করুন।'
                      : 'Upload 1 customer photo and auto-tile 8 or 12 copies on standard 4R (4×6") glossy photo paper with scissor cut guides.'}
                  </p>
                </div>

                {/* 2. AI Background Remover */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? 'এআই ব্যাকগ্রাউন্ড রিমুভার ও নীল/সাদা ব্যাকগ্রাউন্ড' : 'AI Background Remover & Blue/White BG'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'মোবাইলে তোলা সাধারণ ছবির ব্যাকগ্রাউন্ড মুছে ভিসা ও চাকরির আবেদনের জন্য স্টুডিও সাদা বা নীল করুন।'
                      : '1-click remove messy phone backgrounds and replace with solid Studio White or Sky Blue for visa & job applications.'}
                  </p>
                </div>

                {/* 3. NID / Student ID 2-Side Merger */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? 'এনআইডি ও আইডি কার্ডের ২ পিঠ এক পাতায় একত্রীকরণ' : 'NID & ID Card Front/Back 1-Page Merger'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'আইডি কার্ডের সামনের ও পেছনের ছবি একসাথে A4 পাতার মাঝে নিখুঁতভাবে বসিয়ে ফটোকপি বের করুন।'
                      : 'Snap photos of the front and back of an ID card; automatically auto-align and center them side-by-side on an A4 sheet.'}
                  </p>
                </div>

                {/* 4. High-Contrast Photocopy Cleaner */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
                      <Printer className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? 'হাই-কনট্রাস্ট সাদাকালো লেজার ক্লিন-আপ' : 'High-Contrast B&W Laser Clean-Up'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'মোবাইল ছবির ধূসর ব্যাকগ্রাউন্ড ও ছায়া সরিয়ে একদম ঝকঝকে সাদা পাতা ও কালো অক্ষরের প্রিন্ট করুন।'
                      : 'Remove grayish paper background, shadows, and yellowed tint from mobile photos to output pure black & white laser copies.'}
                  </p>
                </div>

                {/* 5. AI Old Photo Restorer */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? 'এআই ফটো শার্পনার ও ফেস এনহ্যান্সার' : 'AI Photo Sharpener & Face Enhancer'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'হোয়াটসঅ্যাপ থেকে পাওয়া ঘোলাটে বা অস্পষ্ট মুখমণ্ডল প্রিন্ট করার আগে পরিষ্কার ও স্পষ্ট করে নিন।'
                      : 'Fix blurry, low-resolution WhatsApp profile pictures before printing on photo paper.'}
                  </p>
                </div>

                {/* 6. Multi-Photo Stamp Size Grid */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                      {isBn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    {isBn ? 'স্ট্যাম্প সাইজ মাল্টি-প্রিন্ট গ্রিড' : 'Stamp Size Multi-Print Grid'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isBn 
                      ? 'ভর্তি বা সনদের জন্য এক শিটে ১৬ বা ২৪ টি স্ট্যাম্প সাইজ ছবি সাজিয়ে প্রিন্ট করুন।'
                      : 'Auto-tile 16 or 24 stamp-size photos for admission and certificate forms on a single print sheet.'}
                  </p>
                </div>

              </div>
            </div>
          )}


        </div>

      </div>
    </div>
  );
}
