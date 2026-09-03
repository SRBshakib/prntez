import React, { useState, useEffect } from 'react';
import {
  X, Star, Sparkles, Award, Clock, Gift, RefreshCw, Zap, ShieldCheck
} from 'lucide-react';

export default function ShopPointsModal({ shop, currentPoints = 0, onClose }) {
  const [loading, setLoading] = useState(true);
  const [pointsData, setPointsData] = useState({
    points_balance: currentPoints,
    lifetime_points: currentPoints,
    ledger: []
  });

  const fetchPointsData = async () => {
    if (!shop?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}/points`);
      const data = await res.json();
      if (data.success) {
        setPointsData({
          points_balance: data.points_balance ?? 0,
          lifetime_points: data.lifetime_points ?? 0,
          ledger: data.ledger || []
        });
      }
    } catch (err) {
      console.error('Failed to load points data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPointsData();
  }, [shop?.id]);

  const balance = pointsData.points_balance ?? currentPoints;
  const lifetime = pointsData.lifetime_points ?? currentPoints;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-amber-200/60 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with Warm Amber Gradient */}
        <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/30">
              <Star className="w-6 h-6 text-amber-100 fill-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">Shop Reward Points</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/25 text-white border border-white/30">
                  PrntEZ Club
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium">
                Earn points with every print job completed at your shop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Points Highlights Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Current Balance */}
            <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/80 shadow-xs">
              <div className="flex items-center justify-between text-amber-900">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Available Balance</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-amber-950 tracking-tight">
                  {balance.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-amber-700">pts</span>
              </div>
              <p className="mt-1 text-[11px] text-amber-800/80">
                Ready to accumulate for future partner offers & discounts
              </p>
            </div>

            {/* Lifetime Earned */}
            <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Lifetime Earned</span>
                <Award className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {lifetime.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-slate-500">pts</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Total points awarded since opening on PrntEZ
              </p>
            </div>
          </div>

          {/* How Points Are Earned */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              How You Earn Points
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200/70">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-black">
                  +10
                </div>
                <div>
                  <p className="font-bold text-slate-800">Per Completed Job</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Awarded automatically every time you click "Done" on an order.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200/70">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-black">
                  +1
                </div>
                <div>
                  <p className="font-bold text-slate-800">Bulk Print Bonus</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    +1 bonus point for every 5 pages in multi-page documents.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Future Offers & Redemption Notice */}
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 mt-0.5">
                <Gift className="w-5 h-5 text-amber-300" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  Future Offers & Rewards
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    Coming Soon
                  </span>
                </h4>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Keep accumulating your points! In upcoming updates, your points will be redeemable for wholesale paper & toner discounts, priority "Top Shop" platform placement, free customer SMS alerts, and partner cashback offers.
                </p>
              </div>
            </div>
          </div>

          {/* Points History Ledger */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Recent Points Activity
              </h3>
              <button
                onClick={fetchPointsData}
                disabled={loading}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold transition"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              {loading && pointsData.ledger.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Loading activity...
                </div>
              ) : pointsData.ledger.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Star className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No points activity yet</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    When you fulfill customer print orders and mark them as "Done", your points will be credited and logged here automatically!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {pointsData.ledger.map((item) => {
                    const dateStr = item.created_at
                      ? new Date(item.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '';
                    return (
                      <div
                        key={item.id}
                        className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/80 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-800 flex items-center justify-center shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.description || 'Job Completed'}
                            </p>
                            <p className="text-[10px] text-slate-400">{dateStr}</p>
                          </div>
                        </div>
                        <span className="font-black text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          +{item.points} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Points are safely secured to your shop account</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
