import React, { useState } from 'react';
import {
  Wrench, Calculator, FileText, Printer, BookOpen, Scissors,
  Layers, DollarSign, Receipt, Sparkles, Check, Copy, X, Plus, Trash2,
  Maximize2, HelpCircle, Wand2, Image as ImageIcon, FileSpreadsheet, Lock,
  FileCheck, Shield, Sparkle, RefreshCw, Zap, ArrowRight
} from 'lucide-react';

export default function ShopToolsModal({ shop, onClose }) {
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
                <h3 className="font-extrabold text-sm text-slate-800">Print & Photocopy Counter Tool Suite</h3>
                <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                  FREE PRO TOOLS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Quick calculators, paper sheets converter, walk-in receipts & counter drawer</p>
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
            { id: 'calc', label: '📖 Book & Binding Pricing', icon: Calculator },
            { id: 'duplex', label: '📑 Duplex & Sheets Helper', icon: Layers },
            { id: 'receipt', label: '🧾 Walk-in Cash Memo', icon: Receipt },
            { id: 'sizes', label: '📐 Paper & Photo Sizes', icon: Maximize2 },
            { id: 'cash', label: '💰 Counter Cash Register', icon: DollarSign },
            { id: 'pdf_tools', label: '📄 PDF Power Tools', icon: FileText, badge: 'SOON' },
            { id: 'image_tools', label: '🖼️ Image & Photo Studio', icon: Sparkles, badge: 'SOON' }
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
                  <label className="font-bold text-slate-700 block mb-1">Total Document Pages</label>
                  <input
                    type="number"
                    value={calcPages}
                    onChange={e => setCalcPages(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Number of Book Sets / Copies</label>
                  <input
                    type="number"
                    value={calcCopies}
                    onChange={e => setCalcCopies(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Print Color & Duplex Mode</label>
                  <select
                    value={calcPrintType}
                    onChange={e => setCalcPrintType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  >
                    <option value="bw_simplex">⬛ Black & White (Single Sided)</option>
                    <option value="bw_duplex">⬛ Black & White (Double Sided / Both Side)</option>
                    <option value="color_simplex">🎨 Color Laser (Single Sided)</option>
                    <option value="color_duplex">🎨 Color Laser (Double Sided)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paper Weight (GSM)</label>
                  <select
                    value={calcGsm}
                    onChange={e => setCalcGsm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  >
                    <option value="70">70 GSM (Standard Copy Paper)</option>
                    <option value="80">80 GSM (Double A / Premium Paper +৳0.30/p)</option>
                    <option value="100">100 GSM (Thesis / Heavy Paper +৳1.00/p)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Binding Method</label>
                  <select
                    value={calcBinding}
                    onChange={e => setCalcBinding(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  >
                    <option value="none">No Binding (Loose Sheets)</option>
                    <option value="spiral">Spiral Binding (Plastic Ring + PVC Sheet - ৳30)</option>
                    <option value="comb">Comb Binding (৳25)</option>
                    <option value="tape">Strip / Tape Binding (৳15)</option>
                    <option value="hard">Hardcover Gold Foil Thesis Binding (৳150)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cover Lamination</label>
                  <select
                    value={calcLaminate}
                    onChange={e => setCalcLaminate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  >
                    <option value="none">No Lamination</option>
                    <option value="gloss_a4">Glossy A4 Lamination (+৳20)</option>
                    <option value="matte_a4">Matte Velvet A4 Lamination (+৳30)</option>
                  </select>
                </div>

              </div>

              {/* Estimate Calculation Summary Card */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-left w-full">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-extrabold text-[10px] rounded-full uppercase">
                      Suggested Customer Price
                    </span>
                    <span className="text-[11px] text-slate-300 font-mono">
                      Physical Sheets: {bookCalc.sheetsUsed} sheets
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold text-white">৳{bookCalc.total.toFixed(2)}</h2>
                  <p className="text-[11px] text-slate-300">
                    Print Cost: ৳{bookCalc.printCost.toFixed(2)} · Binding: ৳{bookCalc.bindingCost.toFixed(2)} · Lamination: ৳{bookCalc.lamCost.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Quotation: ৳${bookCalc.total.toFixed(2)} for ${calcCopies} book set(s) (${calcPages} pages, ${calcBinding} binding).`);
                    alert('✓ Quote copied to clipboard!');
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shrink-0 transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Quote
                </button>
              </div>
            </div>
          )}

          {/* TOOL 2: Duplex Sheet & Ream Helper */}
          {activeTool === 'duplex' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total PDF Document Pages</label>
                  <input
                    type="number"
                    value={duplexPages}
                    onChange={e => setDuplexPages(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Number of Copy Sets</label>
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
                  <p className="text-slate-400 font-semibold text-[11px]">Single Sided (Simplex)</p>
                  <h4 className="text-xl font-extrabold text-slate-800 mt-1">{duplexPages * duplexCopies} Sheets</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">({((duplexPages * duplexCopies) / 500).toFixed(2)} Reams of paper)</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
                  <p className="text-indigo-600 font-semibold text-[11px]">Double Sided (Duplex)</p>
                  <h4 className="text-xl font-extrabold text-indigo-700 mt-1">{Math.ceil(duplexPages / 2) * duplexCopies} Sheets</h4>
                  <p className="text-[10px] text-indigo-600 mt-0.5">50% paper savings! ({((Math.ceil(duplexPages / 2) * duplexCopies) / 500).toFixed(2)} Reams)</p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <p className="text-emerald-700 font-semibold text-[11px]">Paper Saved</p>
                  <h4 className="text-xl font-extrabold text-emerald-800 mt-1">{(duplexPages * duplexCopies) - (Math.ceil(duplexPages / 2) * duplexCopies)} Sheets</h4>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Eco-friendly printing</p>
                </div>
              </div>

              {/* Manual Duplex Flipping Guide */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1.5">
                <p className="font-extrabold text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  Manual Duplex Counter Printing Step Guide:
                </p>
                <p className="text-[11px] leading-relaxed">
                  1. Print **ODD Pages First** (1, 3, 5, 7...).<br />
                  2. Take the printed stack without reordering, flip on **Long Edge (or Short Edge if Landscape)** and reinsert into tray.<br />
                  3. Print **EVEN Pages in REVERSE ORDER** (if printer outputs face-up).
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
                    <label className="font-bold text-slate-700 block mb-1">Customer Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Shakib"
                      value={receiptCustomer}
                      onChange={e => setReceiptCustomer(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone Number (Optional)</label>
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
                  <p className="font-bold text-slate-700">Receipt Line Items</p>
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
                        placeholder="Qty"
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
                        placeholder="Rate"
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
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-[11px] inline-flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600">Discount (৳):</span>
                    <input
                      type="number"
                      value={receiptDiscount}
                      onChange={e => setReceiptDiscount(e.target.value)}
                      className="w-24 bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold">Total Payable</p>
                    <h3 className="text-2xl font-extrabold text-slate-900">৳{receiptTotal.toFixed(2)}</h3>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handlePrintReceipt}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Print Cash Memo
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
                  { name: 'A4 Document', dim: '210 × 297 mm', in: '8.27 × 11.69 in', px: '2480 × 3508 px (300 DPI)', badge: 'Standard' },
                  { name: 'Legal / Folio Paper', dim: '216 × 356 mm', in: '8.5 × 14.0 in', px: '2550 × 4200 px (300 DPI)', badge: 'Deeds / Stamp' },
                  { name: 'A3 Poster Sheet', dim: '297 × 420 mm', in: '11.69 × 16.53 in', px: '3508 × 4960 px (300 DPI)', badge: 'Large Format' },
                  { name: 'Passport Photo (Bangladesh)', dim: '40 × 50 mm', in: '1.57 × 1.97 in', px: '472 × 591 px (300 DPI)', badge: 'Visa / Gov' },
                  { name: 'US Visa 2×2 Photo', dim: '51 × 51 mm', in: '2.0 × 2.0 in', px: '600 × 600 px (300 DPI)', badge: 'US Visa' },
                  { name: 'Stamp Size Photo', dim: '20 × 25 mm', in: '0.79 × 0.98 in', px: '236 × 295 px (300 DPI)', badge: 'Admissions' }
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Opening Drawer Cash</p>
                  <input
                    type="number"
                    value={cashOpening}
                    onChange={e => setCashOpening(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-extrabold text-slate-800 mt-1"
                  />
                </div>
                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Total Cash IN</p>
                  <h4 className="text-lg font-extrabold text-emerald-800 mt-1">+৳{totalCashIn.toFixed(2)}</h4>
                </div>
                <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200">
                  <p className="text-[10px] font-bold text-rose-600 uppercase">Total Cash OUT</p>
                  <h4 className="text-lg font-extrabold text-rose-800 mt-1">-৳{totalCashOut.toFixed(2)}</h4>
                </div>
                <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase">Current Drawer Total</p>
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
                  <option value="in">🟢 Cash IN (Sale/Print)</option>
                  <option value="out">🔴 Cash OUT (Expense/Change)</option>
                </select>

                <input
                  type="text"
                  placeholder="Description (e.g. Paper Purchase, Customer Cash)..."
                  value={newEntryDesc}
                  onChange={e => setNewEntryDesc(e.target.value)}
                  className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                />

                <input
                  type="number"
                  placeholder="Amount (৳)"
                  value={newEntryAmount}
                  onChange={e => setNewEntryAmount(e.target.value)}
                  className="w-28 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                />

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                >
                  Record
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
                        {e.type === 'in' ? 'Cash IN' : 'Cash OUT'}
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
                      🚀 In Development
                    </span>
                    <span className="text-xs font-extrabold text-indigo-200">Printez Counter PDF Engine</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">Browser-Based PDF Utility Suite</h3>
                  <p className="text-xs text-slate-300">
                    Process, split, compress, and reorder heavy customer PDFs directly in your browser with zero upload wait times.
                  </p>
                </div>

                <div className="px-3 py-1.5 bg-white/10 rounded-xl text-indigo-300 font-extrabold text-xs shrink-0 border border-white/10">
                  Release: Q4 2026
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
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">PDF Merge & Chapter Combiner</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Combine multiple lecture notes, thesis chapters, or scan pages into a single print-ready PDF book.
                  </p>
                </div>

                {/* 2. PDF Page Range Splitter */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Page Range Split & Extract</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Extract specific page ranges (e.g., pages 15-40) from huge 500-page textbooks without printing unwanted pages.
                  </p>
                </div>

                {/* 3. PDF Size Compressor */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">High-Speed PDF Compressor</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Shrink heavy 60MB phone scans down to 2MB without losing text crispness for lightning-fast laser spooling.
                  </p>
                </div>

                {/* 4. Multi-Page Slide N-Up Layout */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">2-in-1 / 4-in-1 Slide Handouts</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Auto-tile 2, 4, or 6 slides per page for university student handouts to save paper and printing cost.
                  </p>
                </div>

                {/* 5. Auto Deskew & Clean Scans */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Auto Deskew & Tilted Scan Fix</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Automatically straighten tilted mobile phone camera scans and remove black scanner edges.
                  </p>
                </div>

                {/* 6. Thesis Watermark & Numbers */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Watermark & Page Numbering</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Add custom confidential watermarks, department stamps, or page numbers before final hardcover binding.
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
                      ✨ AI Photo Studio
                    </span>
                    <span className="text-xs font-extrabold text-purple-200">Printez Image & Passport Tools</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">Counter Photo Studio & ID Enhancer</h3>
                  <p className="text-xs text-slate-300">
                    Instant passport photo tiling, 1-click AI background removal, and 2-side ID card merging for walk-in counter customers.
                  </p>
                </div>

                <div className="px-3 py-1.5 bg-white/10 rounded-xl text-purple-300 font-extrabold text-xs shrink-0 border border-white/10">
                  Release: Q4 2026
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
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Passport Photo 8-in-1 Sheet Tiler</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Upload 1 customer photo and auto-tile 8 or 12 copies on standard 4R (4×6") glossy photo paper with scissor cut guides.
                  </p>
                </div>

                {/* 2. AI Background Remover */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">AI Background Remover & Blue/White BG</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    1-click remove messy phone backgrounds and replace with solid Studio White or Sky Blue for visa & job applications.
                  </p>
                </div>

                {/* 3. NID / Student ID 2-Side Merger */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">NID & ID Card Front/Back 1-Page Merger</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Snap photos of the front and back of an ID card; automatically auto-align and center them side-by-side on an A4 sheet.
                  </p>
                </div>

                {/* 4. High-Contrast Photocopy Cleaner */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
                      <Printer className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">High-Contrast B&W Laser Clean-Up</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Remove grayish paper background, shadows, and yellowed tint from mobile photos to output pure black & white laser copies.
                  </p>
                </div>

                {/* 5. AI Old Photo Restorer */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">AI Photo Sharpener & Face Enhancer</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Fix blurry, low-resolution WhatsApp profile pictures before printing on photo paper.
                  </p>
                </div>

                {/* 6. Multi-Photo Stamp Size Grid */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Stamp Size Multi-Print Grid</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Auto-tile 16 or 24 stamp-size photos for admission and certificate forms on a single print sheet.
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
