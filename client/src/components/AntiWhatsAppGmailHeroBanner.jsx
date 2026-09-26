import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  AlertOctagon,
  Eye,
  FileX,
  PhoneOff,
  Unlock,
  CheckCircle2,
  Trash2,
  Lock,
  Zap,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export default function AntiWhatsAppGmailHeroBanner({ onAction = () => {} }) {
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp' | 'gmail' | 'prntez'

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-5 sm:p-7 border-2 border-slate-800 shadow-2xl text-white relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Warning Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 animate-prohibition">
            <AlertOctagon className="w-5 h-5 animate-danger-wiggle" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-rose-400 uppercase tracking-wider">
                Critical Privacy Advisory
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-black border border-rose-500/30">
                STOP SHARING CONTACTS
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-100 tracking-tight mt-0.5">
              Why You Should Never Use WhatsApp or Gmail to Print
            </h3>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/60 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'whatsapp'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <span className="text-rose-300">🚫</span>
            <span>WhatsApp Risk</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'gmail'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <span className="text-amber-300">🚫</span>
            <span>Gmail Risk</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prntez')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'prntez'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>prntez Solution</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Visual Symbol with Animated Prohibition */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 relative">
          {activeTab === 'whatsapp' && (
            <div className="flex flex-col items-center text-center space-y-3 animate-fade-up">
              {/* WhatsApp Icon with Animated Circle-Slash Prohibition Badge */}
              <div className="relative flex items-center justify-center w-28 h-28">
                {/* Pulsing red danger aura */}
                <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"></div>

                {/* WhatsApp Green Icon Box */}
                <div className="w-20 h-20 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-lg transform transition group-hover:scale-95 opacity-85">
                  <svg className="w-12 h-12 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.813 2.796.814 3.179 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086.159.058 1.011.477 1.184.564.173.087.289.13.332.203.043.072.043.419-.101.824z" />
                  </svg>
                </div>

                {/* Animated Prohibition Symbol (Circle with 45-deg slash) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 rounded-full border-[5px] border-rose-500 relative animate-prohibition flex items-center justify-center">
                    <div className="w-full h-[5px] bg-rose-500 rotate-45 transform origin-center shadow-lg shadow-rose-500/50"></div>
                  </div>
                </div>

                {/* Red BANNED stamp badge */}
                <div className="absolute -bottom-2 px-3 py-1 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xl border border-rose-400 rotate-[-6deg] animate-stamp">
                  🚫 NEVER USE WHATSAPP
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs font-black text-rose-400 uppercase tracking-widest">
                  High Security Risk
                </div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-snug">
                  Personal phone number exposed to cyber cafes and stored permanently.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'gmail' && (
            <div className="flex flex-col items-center text-center space-y-3 animate-fade-up">
              {/* Gmail Icon with Animated Prohibition */}
              <div className="relative flex items-center justify-center w-28 h-28">
                {/* Pulsing amber danger aura */}
                <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>

                {/* Gmail Red/White Icon Box */}
                <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-lg opacity-90 p-3">
                  <svg className="w-12 h-12" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                    />
                  </svg>
                </div>

                {/* Animated Prohibition Symbol */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 rounded-full border-[5px] border-amber-500 relative animate-prohibition flex items-center justify-center">
                    <div className="w-full h-[5px] bg-amber-500 rotate-45 transform origin-center shadow-lg shadow-amber-500/50"></div>
                  </div>
                </div>

                {/* BANNED stamp badge */}
                <div className="absolute -bottom-2 px-3 py-1 bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xl border border-amber-400 rotate-[-6deg] animate-stamp">
                  ⚠️ NEVER USE GMAIL ON PUBLIC PC
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest">
                  Account Hijack Danger
                </div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-snug">
                  Unlogged Google sessions and left-behind downloads on public computers.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'prntez' && (
            <div className="flex flex-col items-center text-center space-y-3 animate-fade-up">
              {/* Prntez Verified Shield */}
              <div className="relative flex items-center justify-center w-28 h-28">
                {/* Glowing emerald aura */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>

                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <ShieldCheck className="w-12 h-12 text-white" />
                </div>

                <div className="absolute -bottom-2 px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xl border border-emerald-300 rotate-[-4deg] animate-stamp">
                  🛡️ ZERO FOOTPRINT APPROVED
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                  Cryptographic Auto-Purge
                </div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-snug">
                  No login, no phone number, and instant self-destruction post-print.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Leak Breakdown & Bullet Proof Points */}
        <div className="lg:col-span-7 space-y-3">
          {activeTab === 'whatsapp' && (
            <div className="space-y-2.5 animate-fade-up">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                <PhoneOff className="w-4 h-4 text-rose-500" />
                <span>What WhatsApp Exposes Every Single Time You Print:</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-900/80 text-rose-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-rose-200">
                      Private Mobile Number Leak
                    </div>
                    <div className="text-[11px] text-rose-300/80 leading-relaxed">
                      You are forced to save a stranger’s phone number or broadcast yours to counter attendants and everyone standing in line.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-900/80 text-rose-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-rose-200">
                      Permanent Storage in Shopkeeper’s Phone Gallery
                    </div>
                    <div className="text-[11px] text-rose-300/80 leading-relaxed">
                      WhatsApp automatically downloads PDFs, National IDs, passports, and bank statements into the shop’s internal phone memory.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-900/80 text-rose-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-rose-200">
                      Destructive Image & Vector Compression
                    </div>
                    <div className="text-[11px] text-rose-300/80 leading-relaxed">
                      Images and graphics are heavily compressed, resulting in blurry, degraded prints and pixelated barcodes.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gmail' && (
            <div className="space-y-2.5 animate-fade-up">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <FileX className="w-4 h-4 text-amber-500" />
                <span>The Dangers of Logging into Cyber Cafe Gmail:</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-900/80 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-amber-200">
                      Left-Behind Google Session Hijacking
                    </div>
                    <div className="text-[11px] text-amber-300/80 leading-relaxed">
                      Users routinely forget to log out or uncheck “Remember password”. The next customer has full access to your emails and Google Drive.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-900/80 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-amber-200">
                      Files Left in Windows “Downloads” Folder
                    </div>
                    <div className="text-[11px] text-amber-300/80 leading-relaxed">
                      Downloading your attachment stores an unencrypted copy on the cyber cafe PC that remains there for weeks or months.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-900/80 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-amber-200">
                      Hardware Keyloggers & Malware
                    </div>
                    <div className="text-[11px] text-amber-300/80 leading-relaxed">
                      Public shared keyboards frequently harbor spyware and keyloggers recording your Google password in plain text.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prntez' && (
            <div className="space-y-2.5 animate-fade-up">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>How prntez Solves This 100% Contactless:</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-900/80 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-emerald-200">
                      Zero Contact & Zero Personal Data
                    </div>
                    <div className="text-[11px] text-emerald-300/80 leading-relaxed">
                      You never share your phone number, name, or email. You simply scan the counter QR and receive a random 4-digit pickup code.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-900/80 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-emerald-200">
                      Automated File Shredder (Self-Destruct)
                    </div>
                    <div className="text-[11px] text-emerald-300/80 leading-relaxed">
                      Once the print spooler finishes printing, the document is mathematically purged and wiped from the hard drive with zero trace.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-900/80 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-emerald-200">
                      Direct High-DPI Vector Hardware Spooling
                    </div>
                    <div className="text-[11px] text-emerald-300/80 leading-relaxed">
                      Uncompressed, lossless vector PDFs sent straight to the shop printer driver at native 600–1200 DPI clarity.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium">
              Ready to print safely without leaving a trace?
            </div>
            <button
              type="button"
              onClick={onAction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 active:scale-95"
            >
              <span>Print Securely with prntez</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
