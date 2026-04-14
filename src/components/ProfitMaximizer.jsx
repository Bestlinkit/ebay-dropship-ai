import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Info,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import sourcingService from '../services/sourcing';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const StatBox = ({ label, value, subtext, color = "text-slate-900" }) => (
  <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-full">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <Info size={12} className="text-slate-300" />
    </div>
    <div className="mt-3">
      <span className={cn("text-2xl font-black tracking-tighter", color)}>{value}</span>
      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{subtext}</p>
    </div>
  </div>
);

/**
 * AI Profit Maximizer Suite (v1.0)
 * Intelligent price orchestration with real-time profit safety protocols.
 */
const ProfitMaximizer = ({ product, supplierCost, onPriceChange }) => {
  const [price, setPrice] = useState(product?.price || 0);
  const [intelligence, setIntelligence] = useState(null);

  useEffect(() => {
    if (product && supplierCost) {
      const intel = sourcingService.getPricingIntelligence(product, supplierCost);
      setIntelligence(intel);
      setPrice(parseFloat(intel.suggestedPrice));
    }
  }, [product, supplierCost]);

  const handlePriceDrag = (e) => {
    const newPrice = parseFloat(e.target.value);
    setPrice(newPrice);
    
    // Dynamically recompute intelligence based on user-adjusted price
    const intel = sourcingService.getPricingIntelligence({ ...product, price: newPrice }, supplierCost);
    setIntelligence(intel);
    
    if (onPriceChange) onPriceChange(newPrice, intel);
  };

  if (!intelligence) return null;

  const isSafe = parseFloat(intelligence.breakdown.margin) >= 15;
  const marketAvg = product?.priceRange?.avg || product.price;

  return (
    <div className="space-y-8 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100">
      {/* 1. HEADER: The Suggested Goal */}
      <div className="flex items-end justify-between gap-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl text-white">
              <Calculator size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">AI Profit Maximizer</h2>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Price Orchestration System</p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Recommended Selling Price</span>
           <div className="flex items-center gap-4">
              <div className={cn(
                "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                intelligence.positioning.label === 'Competitive' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                {intelligence.positioning.label} Strategy
              </div>
              <span className="text-5xl font-black text-slate-900 tracking-tighter">${price.toFixed(2)}</span>
           </div>
        </div>
      </div>

      {/* 2. CORE STATS: Fee & Profit Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBox 
          label="Net Margin" 
          value={`${intelligence.breakdown.margin}%`} 
          subtext="After all estimated fees"
          color={isSafe ? "text-emerald-600" : "text-rose-600"}
        />
        <StatBox 
          label="Estimated Profit" 
          value={`$${intelligence.breakdown.netProfit}`} 
          subtext="Per successful sale"
          color="text-slate-900"
        />
        <StatBox 
          label="Sourcing Cost" 
          value={`$${intelligence.breakdown.cost}`} 
          subtext="Product + Shipping"
        />
        <StatBox 
          label="Market Positioning" 
          value={`${intelligence.marketDiff}%`} 
          subtext={parseFloat(intelligence.marketDiff) < 0 ? "Below market average" : "Above market average"}
          color={parseFloat(intelligence.marketDiff) < 0 ? "text-emerald-600" : "text-amber-600"}
        />
      </div>

      {/* 3. INTERACTIVE: Price Control Cluster */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Real-Time Adjustment</h3>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Sales Probability</span>
               <div className={cn(
                 "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                 intelligence.probability === 'High' ? "bg-emerald-500 text-white shadow-xl shadow-emerald-200" : 
                 intelligence.probability === 'Medium' ? "bg-amber-500 text-white" : "bg-slate-300 text-slate-700"
               )}>
                 <TrendingUp size={12} />
                 {intelligence.probability} Probability
               </div>
            </div>
          </div>

          <div className="relative pt-6 pb-2">
            <input 
              type="range" 
              min={marketAvg * 0.5} 
              max={marketAvg * 1.5} 
              step="0.01"
              value={price}
              onChange={handlePriceDrag}
              className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900 transition-all hover:h-4"
            />
            <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>$ {(marketAvg * 0.5).toFixed(2)} (Aggressive)</span>
              <span>$ {(marketAvg * 1.5).toFixed(2)} (Premium)</span>
            </div>
          </div>
        </div>

        {/* 4. MARKET POSITION BAR */}
        <div className="space-y-4">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Competitive Placement</span>
              <span className="text-[11px] font-bold text-slate-400 italic">Target: Market Sweet Spot</span>
           </div>
           <div className="h-6 w-full bg-slate-50 rounded-full p-1 border border-slate-100 relative overflow-hidden flex">
              <div className="flex-1 bg-emerald-100/50 flex items-center justify-center text-[8px] font-bold text-emerald-600 uppercase tracking-tighter">Budget</div>
              <div className="flex-1 bg-sky-100/50 flex items-center justify-center text-[8px] font-bold text-sky-600 uppercase tracking-tighter">Mainstream</div>
              <div className="flex-1 bg-amber-100/50 flex items-center justify-center text-[8px] font-bold text-amber-600 uppercase tracking-tighter">Premium</div>
              
              <motion.div 
                className="absolute top-1 bottom-1 w-1 bg-slate-900 rounded-full shadow-2xl z-10"
                animate={{ left: `${((price - (marketAvg * 0.5)) / (marketAvg)) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
           </div>
        </div>
      </div>

      {/* 5. FEE & SAFETY LOG LAYER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-start gap-5">
            <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
               <AlertCircle size={20} />
            </div>
            <div className="space-y-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fee Transparency</span>
               <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                 Estimated eBay Final Value Fee: <span className="text-slate-900">${intelligence.breakdown.ebayFee}</span>. 
                 Includes category-aware percentage + fixed $0.30 processing node.
               </p>
            </div>
         </div>

         <AnimatePresence mode="wait">
            {isSafe ? (
              <motion.div 
                key="safe"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-emerald-500 p-8 rounded-[2.5rem] flex items-start gap-5 text-white shadow-xl shadow-emerald-100"
              >
                <div className="p-3 bg-white/20 rounded-2xl">
                   <CheckCircle2 size={20} />
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block">Profit Safety Protocol</span>
                   <p className="text-[11px] font-bold text-white leading-relaxed">
                     PRODUCT RECOMMENDED. Current pricing maintains a <span className="font-black underline">healthy {intelligence.breakdown.margin}% ROI</span>, exceeding the safety threshold of 15%.
                   </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="unsafe"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-rose-500 p-8 rounded-[2.5rem] flex items-start gap-5 text-white shadow-xl shadow-rose-100"
              >
                <div className="p-3 bg-white/20 rounded-2xl">
                   <AlertCircle size={20} />
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block">Margin Danger Warning</span>
                   <p className="text-[11px] font-bold text-white leading-relaxed">
                     NOT RECOMMENDED. Profit margin (<span className="font-black">{intelligence.breakdown.margin}%</span>) is below the 15% safety floor. Adjust pricing or source cost.
                   </p>
                </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfitMaximizer;
