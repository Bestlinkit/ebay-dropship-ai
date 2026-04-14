import React from 'react';
import { 
  TrendingUp, 
  Zap,
  ArrowRight,
  Package,
  Shield,
  ExternalLink,
  ChevronRight,
  Target,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import sourcingService from '../services/sourcing';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const OPSRing = ({ score, color }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-slate-800"
        />
        <motion.circle
          cx="28"
          cy="28"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[13px] font-black tracking-tighter" style={{ color }}>
        {score}
      </span>
    </div>
  );
};

const IntelligenceLabel = ({ label, value, color }) => (
  <div className="flex flex-col">
    <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">{label}</span>
    <span className={cn(
      "text-[10px] font-black uppercase tracking-tight", 
      (value === 'High' || value === 'Rising') ? "text-emerald-400" : (value === 'Low' ? "text-rose-400" : "text-text-primary")
    )}>
      {value}
    </span>
  </div>
);

/**
 * SaaS Intelligence Terminal: Product Node (v7.0)
 * High-performance data card with deterministic status glow and premium deep theme.
 */
const ProductCard = ({ product, onOptimize }) => {
  if (!product) return null;

  const ops = sourcingService.calculateOPS(product);
  const isWinner = ops.score >= 80;
  const isWeak = ops.score <= 49;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -10 }}
      className={cn(
        "group relative bg-slate-900 border border-slate-800 rounded-[2.5rem] transition-all duration-500 overflow-hidden flex flex-col h-[520px]",
        isWinner ? "shadow-[0_0_50px_-10px_rgba(16,185,129,0.15)] border-emerald-500/20" : "hover:border-primary/30 shadow-2xl",
        isWeak && "opacity-75 contrast-75 saturate-[0.2]"
      )}
    >
      {/* 1. VISUAL LAYER */}
      <div className="relative h-56 overflow-hidden bg-slate-950/50">
        <img 
          src={product.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        
        {/* Intelligence Overlay Buttons */}
        <div className="absolute top-5 left-5 flex flex-col gap-2">
           <div className={cn(
             "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-xl border transition-all",
             isWinner ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-slate-950/80 text-white border-slate-700"
           )}>
             <Target size={12} className={cn(isWinner ? "text-slate-950" : "text-primary")} />
             OPS {ops.score}
           </div>
           {isWinner && (
             <motion.div 
               initial={{ x: -20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               className="px-4 py-1.5 bg-primary text-slate-950 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 border border-blue-400 shadow-xl"
             >
                <Sparkles size={10} /> Market Winner
             </motion.div>
           )}
        </div>

        {/* Live Marketplace Status */}
        <div className="absolute bottom-4 right-5">
          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-2xl flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isWinner ? "bg-emerald-500" : "bg-primary")} />
            <span className="text-[9px] font-black text-text-primary tracking-tighter uppercase leading-none">Market Synchronization</span>
          </div>
        </div>
      </div>

      {/* 2. DATA CONTENT LAYER */}
      <div className="p-7 flex-1 flex flex-col space-y-6">
        <div className="space-y-3">
          <h3 className="text-[14px] font-bold text-text-primary leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white italic tracking-tighter">${product.price}</span>
              <span className="text-[9px] font-black text-text-muted flex items-center gap-1 uppercase tracking-widest">
                Delta: <span className={product.price < (product.priceRange?.avg || product.price) ? "text-emerald-500" : "text-rose-500"}>
                  {product.price < (product.priceRange?.avg || product.price) ? 'Optimal' : '+8%'}
                </span>
              </span>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-950/50 pl-4 pr-1 py-1 rounded-[2rem] border border-slate-800/50">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none">Opportunity<br/>Grade</span>
              <OPSRing score={ops.score} color={ops.color} />
            </div>
          </div>
        </div>

        {/* 3. DETERMINISTIC ANALYTICS STACK */}
        <div className="grid grid-cols-2 gap-4 p-5 bg-slate-950/30 rounded-[2rem] border border-slate-800/50 relative overflow-hidden">
           {isWinner && <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />}
           <IntelligenceLabel label="Market Demand" value={ops.labels.demand} />
           <IntelligenceLabel label="Listings Density" value={ops.labels.competition} />
           <IntelligenceLabel label="Margin Potential" value={ops.labels.profit} />
           <IntelligenceLabel label="Interest Trend" value={ops.labels.trend} />
        </div>

        {/* 4. RECOMMENDATION INSIGHT */}
        <div className="flex-1 flex flex-col justify-end">
           <div className={cn(
             "p-4 rounded-2xl border flex items-start gap-3 transition-all",
             isWinner ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-950 border-slate-800"
           )}>
              <div className="mt-1">
                <Shield size={14} className={cn(isWinner ? "text-emerald-500" : "text-primary")} />
              </div>
              <div className="space-y-1">
                <span className={cn("block text-[9px] font-black uppercase tracking-widest", isWinner ? "text-emerald-500" : "text-primary")}>Intelligence Insight</span>
                <p className="text-[11px] font-bold text-text-muted leading-relaxed italic">
                  "{ops.reasoning}"
                </p>
              </div>
           </div>
        </div>
      </div>

      {/* 5. PRODUCTION ACTIONS */}
      <div className="px-7 pb-7 pt-2 flex gap-3">
         <button 
           onClick={() => window.open(`https://www.ebay.com/itm/${product.id}`, '_blank')}
           className="flex-1 h-12 rounded-xl border border-slate-800 bg-slate-950 text-text-primary font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all hover:border-slate-700"
         >
           Teleport <ExternalLink size={12} className="opacity-40" />
         </button>
         <button 
           onClick={() => onOptimize(product)}
           className="flex-1 h-12 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-400 transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
         >
           Optimize Registry <ChevronRight size={14} />
         </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
