import React, { useState } from 'react';
import {
  X, BookOpen, QrCode, Printer, Percent, DollarSign, ShieldCheck,
  CheckCircle2, Volume2, Sparkles, HelpCircle, ArrowRight, ArrowLeft, Download,
  Layers, Copy, ExternalLink, Laptop, Smartphone, FileText, Check, AlertCircle, Eye
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ShopManualModal({ shop, onClose }) {
  const { isBn } = useLanguage();
  const [activeStep, setActiveStep] = useState(1); // 1 to 6
  const [guideLang, setGuideLang] = useState(isBn ? 'bn' : 'en');

  const isManualBn = guideLang === 'bn';

  // Direct 1-Click Print of Ultra-Simple A4 Shopkeeper Guidebook
  const handlePrintGuide = () => {
    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${shop?.name || 'Prntez'} - সহজ দোকানদার সহায়িকা</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700;800&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 7mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: 'Hind Siliguri', 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            body {
              background: #fff;
              color: #0f172a;
              padding: 10px;
              font-size: 13px;
              line-height: 1.4;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .header {
              border-bottom: 3px solid #2563eb;
              padding-bottom: 8px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .header h1 {
              font-size: 22px;
              font-weight: 800;
              color: #1e3a8a;
            }
            .header p {
              font-size: 12px;
              color: #64748b;
            }
            .badge-top {
              background: #eff6ff;
              color: #1d4ed8;
              border: 1px solid #bfdbfe;
              font-weight: 800;
              font-size: 11px;
              padding: 4px 12px;
              border-radius: 9999px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .card {
              border: 1.5px solid #cbd5e1;
              border-radius: 12px;
              padding: 10px 12px;
              background: #f8fafc;
              page-break-inside: avoid;
            }
            .card-title {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 6px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
            }
            .num-badge {
              background: #dc2626;
              color: #fff;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 900;
              flex-shrink: 0;
            }
            .steps {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .steps li {
              position: relative;
              padding-left: 18px;
              margin-bottom: 5px;
              font-size: 11.5px;
            }
            .steps li::before {
              content: '👉';
              position: absolute;
              left: 0;
              font-size: 10px;
            }
            .highlight-box {
              background: #fef3c7;
              border: 1px solid #fde68a;
              color: #92400e;
              border-radius: 8px;
              padding: 5px 8px;
              font-size: 10.5px;
              margin-top: 6px;
              font-weight: 700;
            }
            .footer {
              margin-top: 12px;
              border-top: 1px solid #e2e8f0;
              padding-top: 6px;
              text-align: center;
              font-size: 10.5px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${isManualBn ? 'সহজ Prntez দোকানদার গাইড (কাউন্টার কর্মচারীদের জন্য)' : 'Prntez Counter Staff Operational Guide'}</h1>
              <p>${shop?.name || 'Shop'} • ${isManualBn ? 'কাউন্টার আইডি: ' : 'Counter ID: '}${shop?.qr_slug || ''}</p>
            </div>
            <div class="badge-top">
              ${isManualBn ? '১ মিনিটে শিখুন' : 'Quick 1-Minute Guide'}
            </div>
          </div>

          <div class="grid">
            <!-- 1 -->
            <div class="card">
              <div class="card-title">
                <span class="num-badge">১</span>
                <span>${isManualBn ? 'কাউন্টার QR পোস্টার লাগানো' : 'Hang the Counter QR Poster'}</span>
              </div>
              <ul class="steps">
                <li>${isManualBn ? 'ড্যাশবোর্ডের <strong>স্ট্যান্ডি</strong> বাটনে চাপ দিয়ে পূর্ণ A4 পোস্টার প্রিন্ট করুন।' : 'Click <strong>Standee</strong> button on topbar and print full A4 poster.'}</li>
                <li>${isManualBn ? 'ক্যাশ কাউন্টারে কাস্টমারের চোখের সামনে এটি ঝুলিয়ে দিন।' : 'Hang prominently at your cash counter.'}</li>
                <li>${isManualBn ? 'কাস্টমার মোবাইলের ক্যামেরা দিয়ে স্ক্যান করলেই ফাইল পাঠাতে পারবে।' : 'Customers scan with phone camera to send files instantly.'}</li>
              </ul>
              <div class="highlight-box">
                💡 ${isManualBn ? 'হোয়াটসঅ্যাপে নম্বর সেভ করার কোনো দরকার নেই।' : 'No WhatsApp number saving required!'}
              </div>
            </div>

            <!-- 2 -->
            <div class="card">
              <div class="card-title">
                <span class="num-badge">২</span>
                <span>${isManualBn ? 'অর্ডার আসা ও শব্দ বাজা' : 'New Order Chime & Queue'}</span>
              </div>
              <ul class="steps">
                <li>${isManualBn ? 'কাস্টমার ফাইল দিলে কম্পিউটারে টিং শব্দ বাজবে এবং নতুন কার্ড আসবে।' : 'Audio chime plays when new document is uploaded.'}</li>
                <li>${isManualBn ? 'কার্ডে টোকেন নম্বর (যেমন #A12) ও কত কপি তা বড় করে লেখা থাকে।' : 'Token number (#A12) and copy count are clearly shown.'}</li>
                <li>${isManualBn ? 'কাস্টমারকে তার মোবাইলের টোকেন নম্বর জিজ্ঞেস করে মিলিয়ে নিন।' : 'Match token code with customer mobile screen.'}</li>
              </ul>
              <div class="highlight-box">
                🔔 ${isManualBn ? 'ড্যাশবোর্ডের সাউন্ড অন রাখুন যাতে অর্ডার মিস না হয়।' : 'Keep computer volume turned on.'}
              </div>
            </div>

            <!-- 3 -->
            <div class="card">
              <div class="card-title">
                <span class="num-badge">৩</span>
                <span>${isManualBn ? '১-ক্লিকে প্রিন্ট করা' : '1-Click Direct Print'}</span>
              </div>
              <ul class="steps">
                <li>${isManualBn ? 'অর্ডার কার্ডের নীল <strong>প্রিন্ট (Print)</strong> বাটনে ১-ক্লিক করুন।' : 'Click the blue <strong>Print</strong> button on the order card.'}</li>
                <li>${isManualBn ? 'প্রিন্ট ডায়ালগে আপনার প্রিন্টার সিলেক্ট করে Enter চাপুন।' : 'Select printer and hit Enter.'}</li>
                <li>${isManualBn ? 'প্রিন্ট শেষ হলে সবুজ <strong>সম্পন্ন (Done)</strong> বাটনে ক্লিক করুন।' : 'Click green <strong>Done</strong> button after printing.'}</li>
              </ul>
              <div class="highlight-box">
                ⚡ ${isManualBn ? 'প্রিন্ট করার আগে প্রয়োজনে চোখের আইকনে চাপ দিয়ে ফাইল দেখে নেওয়া যায়।' : 'Click the Eye icon anytime to preview file.'}
              </div>
            </div>

            <!-- 4 -->
            <div class="card">
              <div class="card-title">
                <span class="num-badge">৪</span>
                <span>${isManualBn ? 'প্রিন্ট রেট ও ডিসকাউন্ট ঠিক করা' : 'Set Rates & Auto Discounts'}</span>
              </div>
              <ul class="steps">
                <li>${isManualBn ? 'টপবারের <strong>প্রোফাইল > রেটস</strong>-এ যান।' : 'Open <strong>Profile > Rates</strong> from topbar.'}</li>
                <li>${isManualBn ? 'সাদা-কালো (B&W) ও রঙিন প্রতি পাতার দাম লিখে সেভ করুন।' : 'Enter per page price for B&W and Color.'}</li>
                <li>${isManualBn ? '৫০+ পাতার বড় অর্ডারে ছাড় দিতে বাল্ক ডিসকাউন্ট সুইচ অন রাখুন।' : 'Turn on Bulk Discount switch for 50+ page orders.'}</li>
              </ul>
              <div class="highlight-box">
                💰 ${isManualBn ? 'কাস্টমারের স্ক্রিনে স্বয়ংক্রিয়ভাবে মোট টাকার হিসাব হয়ে যাবে।' : 'Bill is auto-calculated for the customer.'}
              </div>
            </div>

            <!-- 5 -->
            <div class="card">
              <div class="card-title">
                <span class="num-badge">৫</span>
                <span>${isManualBn ? 'দোকানে বাইন্ডিং না থাকলে কী করবেন?' : 'No Binding in Shop? Turn It Off'}</span>
              </div>
              <ul class="steps">
                <li>${isManualBn ? 'আপনার দোকানে বাইন্ডিং না থাকলে প্রোফাইলে গিয়ে বাইন্ডিং <strong>বন্ধ (Disabled)</strong> করে দিন।' : 'Go to Profile > Services and toggle Binding to Disabled.'}</li>
                <li>${isManualBn ? 'সুইচ বন্ধ থাকলে কাস্টমার বাইন্ডিং অপশন দেখতে পাবে না।' : 'Customers will not see binding option on upload.'}</li>
                <li>${isManualBn ? 'এতে কোনো ভুল বা অনাকাঙ্ক্ষিত অর্ডার আসবে না।' : 'Prevents customer misunderstandings.'}</li>
              </ul>
              <div class="highlight-box">
                🛠️ ${isManualBn ? 'যখন মেশিন বা কাঁচামাল থাকবে তখন আবার অন করে দিতে পারবেন।' : 'Turn back on whenever spiral material is in stock.'}
              </div>
            </div>

            <!-- 6 -->
            <div class="card">
              <div class="card-title">
                <span class="num-badge">৬</span>
                <span>${isManualBn ? 'টাকা নেওয়া ও ফাইল ডিলিট' : 'Collecting Payment & Privacy'}</span>
              </div>
              <ul class="steps">
                <li>${isManualBn ? 'নগদ ক্যাশ টাকা হাতে বুঝে নিয়ে পেইড মার্ক করুন।' : 'Collect cash at counter and hand over documents.'}</li>
                <li>${isManualBn ? 'বিকাশ বা নগদে কাস্টমার শেষ ৪ ডিজিট দিলে মিলিয়ে অনুমোদন করুন।' : 'For bKash, verify the last 4 digits on screen.'}</li>
                <li>${isManualBn ? 'প্রিন্ট শেষ হলে কাস্টমারের ফাইল সার্ভার থেকে নিজ থেকেই মুছে যায়।' : 'Customer files auto-delete from server.'}</li>
              </ul>
              <div class="highlight-box">
                🔒 ${isManualBn ? '১০০% নিরাপদ: দোকানে পেনড্রাইভ বা ভাইরাস ছড়ানোর কোনো ভয় নেই।' : 'Zero pendrive virus risk.'}
              </div>
            </div>
          </div>

          <div class="footer">
            ${isManualBn ? 'Prntez ক্লাউড প্রিন্ট পিওএস • www.prntez.com • সহজ ও দ্রুত প্রিন্ট ব্যবসার সমাধান' : 'Prntez Cloud Print POS • www.prntez.com • Simple & Fast Print Solution'}
          </div>
        </body>
      </html>
    `;

    let printFrame = document.getElementById('manual-print-frame');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'manual-print-frame';
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

  // 6 Ultra-Simple Steps with UI Screenshots / Mockups
  const steps = [
    {
      num: 1,
      titleBn: 'কাউন্টার QR পোস্টার লাগানো',
      titleEn: 'Hang the Counter QR Poster',
      summaryBn: 'কাস্টমার দোকানে আসলে তাকে সরাসরি QR কোডটি স্ক্যান করতে বলুন। কোনো অ্যাপ লাগবে না!',
      summaryEn: 'Ask walk-in customers to simply scan the QR standee. No app installation needed!'
    },
    {
      num: 2,
      titleBn: 'নতুন অর্ডার আসা ও শব্দ বাজা',
      titleEn: 'New Order Alert & Live Card',
      summaryBn: 'কাস্টমার ফাইল পাঠানোর সাথে সাথে কম্পিউটারে শব্দ হবে এবং টোকেন নম্বরসহ নতুন কার্ড আসবে।',
      summaryEn: 'A pleasant chime plays when files arrive, showing token number and copy details.'
    },
    {
      num: 3,
      titleBn: '১-ক্লিকে প্রিন্ট ও ডেলিভারি',
      titleEn: '1-Click Direct Print',
      summaryBn: 'নীল রঙের "প্রিন্ট" বাটনে ১-ক্লিক করুন। প্রিন্ট হয়ে গেলে "সম্পন্ন" বাটনে চাপ দিন।',
      summaryEn: 'Click the blue "Print" button to send to printer. Click "Done" when handed over.'
    },
    {
      num: 4,
      titleBn: 'প্রিন্ট রেট ও ডিসকাউন্ট ঠিক করা',
      titleEn: 'Set Rates & Auto Discount',
      summaryBn: 'সাদা-কালো ও রঙিন প্রতি পাতার দাম লিখে সেভ করুন। বড় অর্ডারে ডিসকাউন্ট সুইচ অন রাখুন।',
      summaryEn: 'Set per-page pricing. Enable the auto bulk discount toggle for large print orders.'
    },
    {
      num: 5,
      titleBn: 'বাইন্ডিং সার্ভিস চালু বা বন্ধ রাখা',
      titleEn: 'Binding Service On/Off',
      summaryBn: 'দোকানে বাইন্ডিং না থাকলে সহজেই তা বন্ধ করে রাখুন, যাতে কাস্টমার ভুল অর্ডার না দেয়।',
      summaryEn: 'Disable binding if your shop doesn’t offer it, so customers don’t order by mistake.'
    },
    {
      num: 6,
      titleBn: 'টাকা গ্রহণ ও ফাইল ডিলিট',
      titleEn: 'Cash / bKash & Auto Purge',
      summaryBn: 'ক্যাশ বা বিকাশ বুঝে নিন। প্রিন্ট শেষ হলে কাস্টমারের ফাইল নিজে থেকেই মুছে যাবে।',
      summaryEn: 'Collect payment and hand over documents. Files auto-shred after printing for safety.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl flex flex-col w-full max-w-4xl h-[92vh] max-h-[860px] overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                  {isManualBn ? 'সহজ দোকানদার সহায়িকা (ছবি ও দিকনির্দেশনা)' : 'Visual Shopkeeper Manual (Step-by-Step)'}
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {isManualBn ? 'খুব সহজ ১-২-৩ নিয়ম' : 'Easy 1-2-3 Guide'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isManualBn
                  ? 'কাউন্টারের যে কেউ খুব সহজে ১ মিনিটে বুঝতে পারবে'
                  : 'Designed so any counter staff can understand within 1 minute'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-200 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setGuideLang('bn')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  guideLang === 'bn' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇧🇩 সহজ বাংলা
              </button>
              <button
                onClick={() => setGuideLang('en')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  guideLang === 'en' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇬🇧 English
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition font-bold cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 6 Step Selection Pills */}
        <div className="px-4 py-2 border-b border-slate-200 bg-white overflow-x-auto shrink-0 flex items-center gap-1.5 scrollbar-none">
          {steps.map((st) => (
            <button
              key={st.num}
              onClick={() => setActiveStep(st.num)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                activeStep === st.num
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                activeStep === st.num ? 'bg-white text-blue-600' : 'bg-slate-300 text-slate-700'
              }`}>
                {st.num}
              </span>
              <span>{isManualBn ? st.titleBn : st.titleEn}</span>
            </button>
          ))}
        </div>

        {/* Step Content Area with Clear Visual Mockups & Red Annotation Callouts */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 space-y-4">
          
          {/* Top Instruction Banner */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                {activeStep}
              </span>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-800">
                  {isManualBn ? steps[activeStep - 1].titleBn : steps[activeStep - 1].titleEn}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isManualBn ? steps[activeStep - 1].summaryBn : steps[activeStep - 1].summaryEn}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 shrink-0 hidden sm:inline-block">
              {isManualBn ? `ধাপ ${activeStep} / ৬` : `Step ${activeStep} of 6`}
            </span>
          </div>

          {/* SCREENSHOT & ANNOTATED DIAGRAMS */}
          
          {/* STEP 1: QR Standee Setup */}
          {activeStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              
              {/* Screenshot Frame */}
              <div className="md:col-span-6 bg-slate-900 rounded-2xl p-4 shadow-xl border-2 border-slate-800 text-white relative">
                {/* Browser top bar */}
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 mb-3 text-[10px] text-slate-400">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <span className="font-mono text-[9px] ml-1">কাউন্টার QR পোস্টার ভিউ</span>
                </div>

                {/* Standee Mockup */}
                <div className="bg-white text-slate-900 rounded-xl p-3 text-center border border-slate-200 relative">
                  {/* Pin 1 */}
                  <div className="absolute -top-3 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg animate-bounce">
                    ❶
                  </div>
                  <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    {isManualBn ? 'সেলফ-সার্ভিস প্রিন্ট' : 'SELF-SERVICE PRINT'}
                  </span>
                  <h5 className="font-black text-sm mt-1">{shop?.name || 'কাউন্টার শপ'}</h5>

                  {/* Pin 2: QR */}
                  <div className="relative my-2 p-2 bg-slate-50 border border-slate-200 rounded-xl inline-block mx-auto">
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                      ❷
                    </div>
                    <QrCode className="w-24 h-24 text-slate-800" />
                  </div>

                  {/* Pin 3: Rates */}
                  <div className="relative">
                    <div className="absolute -bottom-2 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                      ❸
                    </div>
                    <div className="bg-slate-100 p-1 rounded font-bold text-[10px] text-slate-700">
                      {isManualBn ? 'কালো-সাদা: ৳২.০০ · রঙিন: ৳১০.০০' : 'B&W: ৳2.00 · Color: ৳10.00'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanations */}
              <div className="md:col-span-6 space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❶</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'দোকানের নাম নিশ্চিত করা' : 'Shop Name'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'কাস্টমার পোস্টারে আপনার দোকানের নাম দেখতে পাবে।' : 'Confirms the customer is at the right counter.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❷</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'কাস্টমার ফোনে স্ক্যান করবে' : 'Customer Scans QR'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'যেকোনো ফোনের ক্যামেরা বা বিকাশ অ্যাপ দিয়ে স্ক্যান করলেই ফাইল আপলোড পেজ খুলে যাবে।' : 'Scans with normal phone camera or bKash app directly.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❸</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'প্রিন্ট রেট পরিষ্কার লেখা থাকে' : 'Clear Transparent Rates'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'কাস্টমার কোনো দরদাম না করে সঠিক মূল্যে অর্ডার করতে পারবে।' : 'Prevents customer bargaining and displays exact pricing.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Live Queue & Sound */}
          {activeStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              
              {/* Order Card Mockup */}
              <div className="md:col-span-6 bg-slate-50 rounded-2xl p-4 border-2 border-indigo-400 shadow-md relative text-xs">
                {/* Header with Pin 1 */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 relative">
                  <div className="absolute -top-3 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                    ❶
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-blue-600 text-sm">#A192</span>
                    <span className="font-bold text-slate-800">কাস্টমার: রহিম</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {isManualBn ? 'নতুন অর্ডার' : 'New Order'}
                  </span>
                </div>

                {/* Details with Pin 2 */}
                <div className="my-2.5 relative space-y-1">
                  <div className="absolute -left-3 top-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                    ❷
                  </div>
                  <p className="font-bold text-slate-800">CV_and_Certificate.pdf</p>
                  <p className="text-slate-500 text-[11px]">
                    {isManualBn ? 'মোট ৪ পাতা • ১ কপি • সাদা-কালো (B&W)' : '4 Pages • 1 Copy • B&W'}
                  </p>
                  <div className="text-right font-black text-base text-slate-900">
                    ৳8.00
                  </div>
                </div>

                {/* Sound Indicator with Pin 3 */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] relative">
                  <div className="absolute -bottom-2 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                    ❸
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                    <Volume2 className="w-4 h-4" />
                    <span>{isManualBn ? 'সাউন্ড অ্যালার্ট চালু আছে' : 'Sound Alert Active'}</span>
                  </div>
                  <span className="text-slate-400">১ মিনিট আগে</span>
                </div>
              </div>

              {/* Explanations */}
              <div className="md:col-span-6 space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❶</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'টোকেন কোড (#A192)' : 'Pickup Token Code'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'কাস্টমার কাউন্টারে এসে তার মোবাইলে এই টোকেন নম্বর দেখাবে।' : 'Customer shows this matching code on their phone.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❷</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'ফাইলের নাম ও মোট টাকা' : 'Document & Bill'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'কয় পাতা এবং কত টাকা বিল হয়েছে তা স্ক্রিনে নিজে থেকেই হিসাব হয়ে যাবে।' : 'Auto-calculated pages and exact total price.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❸</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'মিষ্টি শব্দে নোটিফিকেশন' : 'Chime Notification'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'আপনি অন্য কোনো কাজ করলেও শব্দ শুনে বুঝতে পারবেন নতুন প্রিন্ট অর্ডার এসেছে।' : 'Audible alert plays so you never miss an incoming order.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 1-Click Print */}
          {activeStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              
              {/* Order Card Action Buttons Mockup */}
              <div className="md:col-span-6 bg-slate-50 rounded-2xl p-4 border-2 border-blue-400 shadow-md relative text-xs space-y-3">
                <div className="text-slate-600 font-bold flex items-center justify-between">
                  <span>অর্ডার অ্যাকশন বাটনসমূহ</span>
                  <span className="font-mono text-blue-600 font-black">#A192</span>
                </div>

                <div className="flex items-center gap-2 relative">
                  {/* Pin 1: Print Button */}
                  <div className="absolute -top-3 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                    ❶
                  </div>
                  <button className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/30">
                    <Printer className="w-4 h-4" />
                    <span>{isManualBn ? 'সরাসরি প্রিন্ট (Print)' : 'Print Now'}</span>
                  </button>

                  {/* Pin 2: Preview Eye */}
                  <div className="relative">
                    <div className="absolute -top-3 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                      ❷
                    </div>
                    <button className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mark Done with Pin 3 */}
                <div className="relative pt-2 border-t border-slate-200">
                  <div className="absolute -bottom-2 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                    ❸
                  </div>
                  <button className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isManualBn ? 'প্রিন্ট শেষ / ডেলিভার্ড (Done)' : 'Mark Delivered (Done)'}</span>
                  </button>
                </div>
              </div>

              {/* Explanations */}
              <div className="md:col-span-6 space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❶</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'নীল "প্রিন্ট" বাটনে ক্লিক করুন' : 'Click Blue "Print" Button'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'ক্লিক করলেই ব্রাউজারের প্রিন্ট ডায়ালগ ওপেন হবে এবং প্রিন্টার সিলেক্ট করে প্রিন্ট করতে পারবেন।' : 'Opens printer dialog instantly to print without downloading.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❷</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'চোখের আইকন (ফাইল ভিউ)' : 'Preview File'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'প্রিন্ট দেওয়ার আগে কাস্টমারের ফাইলটি এক নজর দেখতে চাইলে এখানে চাপ দিন।' : 'Quickly view the PDF or image before printing.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❸</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'সবুজ "সম্পন্ন" বাটনে ক্লিক করুন' : 'Click Green "Done"'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'কাগজ প্রিন্টার থেকে বের হলে কাস্টমারকে দিয়ে "সম্পন্ন" চাপুন। কাস্টমারের মোবাইলেও রেডি নোটিফিকেশন যাবে।' : 'Customer receives instant pickup notification on their screen.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Rates & Discounts */}
          {activeStep === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              
              {/* Rates Settings Mockup */}
              <div className="md:col-span-6 bg-slate-50 rounded-2xl p-4 border-2 border-emerald-400 shadow-md relative text-xs space-y-3">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>দোকান প্রোফাইল → প্রিন্ট রেটস</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">সেটিংস</span>
                </div>

                {/* Pin 1: Rates */}
                <div className="relative bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="absolute -top-3 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                    ❶
                  </div>
                  <span className="font-bold text-slate-700 block text-[11px]">প্রতি পেজের দাম (টাকা)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500">কালো-সাদা:</span>
                      <p className="font-black text-slate-800">৳2.00</p>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500">রঙিন:</span>
                      <p className="font-black text-slate-800">৳10.00</p>
                    </div>
                  </div>
                </div>

                {/* Pin 2: Bulk Discount Toggle */}
                <div className="relative bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 space-y-1">
                  <div className="absolute -top-3 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                    ❷
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">বাল্ক অটো-ডিসকাউন্ট রুল</span>
                    <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">সক্রিয় (ON)</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">৫০+ পাতা প্রিন্ট করলে ৫% স্বয়ংক্রিয় ছাড়</p>
                </div>
              </div>

              {/* Explanations */}
              <div className="md:col-span-6 space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❶</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'দাম পরিবর্তন করা' : 'Update Per-Page Rates'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'টপবারের "প্রোফাইল" বাটনে ক্লিক করে রেট ও মূল্য ট্যাবে আপনার পছন্দমতো রেট লিখে সেভ করুন।' : 'Change B&W and color page prices from Profile anytime.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❷</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'বড় অর্ডারে ছাড় (অটো ডিসকাউন্ট)' : 'Bulk Discount Switch'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'ছাত্র বা অফিসের বড় অর্ডারের জন্য ছাড় দিতে চাইলে সুইচটি অন রাখুন। ছাড় না দিতে চাইলে বন্ধ রাখুন।' : 'Toggle on to give automatic discounts for large volume prints.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Service Toggles (Binding/Photo) */}
          {activeStep === 5 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              
              {/* Service Toggles Mockup */}
              <div className="md:col-span-6 bg-slate-50 rounded-2xl p-4 border-2 border-purple-400 shadow-md relative text-xs space-y-2.5">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>দোকানের সার্ভিস নিয়ন্ত্রণ</span>
                  <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">সুইচ</span>
                </div>

                {/* Pin 1: Binding Toggle */}
                <div className="relative bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="absolute -top-3 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                    ❶
                  </div>
                  <div>
                    <strong className="text-slate-800 block">📖 {isManualBn ? 'বুক বাইন্ডিং সার্ভিস' : 'Book Binding Service'}</strong>
                    <span className="text-[10px] text-slate-500">{isManualBn ? 'স্পাইরাল / হার্ডকভার' : 'Spiral / Hardcover'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {isManualBn ? 'নিষ্ক্রিয় (OFF)' : 'OFF'}
                  </span>
                </div>

                {/* Pin 2: Photo Print Toggle */}
                <div className="relative bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="absolute -top-3 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                    ❷
                  </div>
                  <div>
                    <strong className="text-slate-800 block">🖼️ {isManualBn ? 'পাসপোর্ট ফটো প্রিন্ট' : 'Photo Print'}</strong>
                    <span className="text-[10px] text-slate-500">{isManualBn ? 'ছবি প্রিন্ট ও সাইজ' : 'Photo Studio'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {isManualBn ? 'সক্রিয় (ON)' : 'ON'}
                  </span>
                </div>
              </div>

              {/* Explanations */}
              <div className="md:col-span-6 space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❶</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'বাইন্ডিং না থাকলে সুইচ অফ রাখুন' : 'Turn Off If No Binding Machine'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'দোকানে বাইন্ডিং মেশিন না থাকলে সুইচটি "নিষ্ক্রিয়" করে দিন। কাস্টমার তাহলে শুধু সাধারণ প্রিন্ট দিতে পারবে।' : 'Disables binding completely from customer ordering page.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❷</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'সার্ভিস যখন খুশি অন/অফ করা যায়' : 'Toggle Services Anytime'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'ফটো পেপারের স্টক শেষ হয়ে গেলে তাৎক্ষণিকভাবে ফটো প্রিন্ট অফ করে রাখতে পারবেন।' : 'Turn services off when material is out of stock.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Payments & Privacy */}
          {activeStep === 6 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              
              {/* Payment & Security Mockup */}
              <div className="md:col-span-6 bg-slate-50 rounded-2xl p-4 border-2 border-amber-400 shadow-md relative text-xs space-y-3">
                {/* Pin 1: bKash Digits */}
                <div className="relative bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="absolute -top-3 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                    ❶
                  </div>
                  <span className="font-bold text-slate-800 text-[11px] block">বিকাশ / নগদ পেমেন্ট যাচাই</span>
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                    <span className="text-[11px] text-amber-900">শেষ ৪ সংখ্যা: <strong>৭৮৪৫</strong></span>
                    <button className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold text-[10px]">
                      অনুমোদন
                    </button>
                  </div>
                </div>

                {/* Pin 2: Auto Delete */}
                <div className="relative bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 space-y-1">
                  <div className="absolute -top-3 -left-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                    ❷
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{isManualBn ? 'ফাইল স্বয়ংক্রিয় মুছে ফেলা (অটো-ডিলিট)' : 'Automatic File Shred'}</span>
                  </div>
                  <p className="text-[10px] text-emerald-800 leading-snug">
                    {isManualBn ? 'প্রিন্ট শেষ হওয়ার সাথে সাথে সার্ভার থেকে কাস্টমারের ফাইল নিরাপদভাবে মুছে যায়।' : 'Server completely deletes files after printing.'}
                  </p>
                </div>
              </div>

              {/* Explanations */}
              <div className="md:col-span-6 space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❶</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'ক্যাশ বা বিকাশ নেওয়া' : 'Collect Cash or bKash'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'ক্যাশ টাকা হাতে বুঝে নিন। আর বিকাশ দিলে কাস্টমারের মোবাইল নম্বরের শেষের ৪ ডিজিট মিলিয়ে নিন।' : 'Match last 4 digits for mobile banking payments.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">❷</span>
                    <strong className="text-slate-900 font-bold">{isManualBn ? 'কম্পিউটার ভাইরাস ও ঝামেলা মুক্ত' : '100% Virus & Clutter Free'}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    {isManualBn ? 'পেনড্রাইভ বা হোয়াটসঅ্যাপে ফাইল নামাতে হয় না, তাই কম্পিউটারে ভাইরাস আসার কোনো ঝুঁকি নেই।' : 'No pendrive virus and no WhatsApp storage hassle.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Step Navigation Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
              disabled={activeStep === 1}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isManualBn ? 'আগের ধাপ' : 'Previous Step'}</span>
            </button>

            <div className="flex gap-1.5">
              {steps.map(s => (
                <button
                  key={s.num}
                  onClick={() => setActiveStep(s.num)}
                  className={`w-2.5 h-2.5 rounded-full transition cursor-pointer ${
                    activeStep === s.num ? 'bg-blue-600 w-6' : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setActiveStep(prev => Math.min(6, prev + 1))}
              disabled={activeStep === 6}
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
            >
              <span>{isManualBn ? 'পরবর্তী ধাপ' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>
              {isManualBn
                ? 'দোকানদার ও কর্মচারীদের জন্য সহজ ১-২-৩ পিকটোরিয়াল গাইড'
                : '1-2-3 simple pictorial operational guide for counter staff'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* 1-Click Print Full A4 Manual Guide */}
            <button
              onClick={handlePrintGuide}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="Print Full A4 Guidebook"
            >
              <Printer className="w-4 h-4" />
              <span>{isManualBn ? '🖨️ পূর্ণ A4 গাইডবুক প্রিন্ট / PDF' : '🖨️ Print Full A4 Manual / PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {isManualBn ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
