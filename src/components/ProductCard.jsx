import React from 'react';
import { 
  TrendingUp, 
  Zap,
  ArrowRight,
  Package,
  Shield,
  ExternalLink,
  ChevronRight,
  Target
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
          className="text-slate-100"
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
    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={cn("text-[10px] font-black", value === 'High' || value === 'Rising' || value === 'Low' ? "text-emerald-600" : "text-slate-600")}>
      {value}
    </span>
  </div>
);

/**
 * SaaS Innovation: Intelligence Panel Card (v6.0)
 * Deterministic data overlay with OPS scoring integration.
 */
const ProductCard = ({ product, onImport, onOptimize }) => {
  if (!product) return null;

  const ops = sourcingService.calculateOPS(product);
  const isHigh = ops.status === 'HIGH';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="group relative bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(30,41,59,0.12)] hover:border-primary/20 transition-all duration-500 overflow-hidden flex flex-col h-[480px]"
    >
      {/* 1. TOP SECTION: Visual & OPS Overlay */}
      <div className="relative h-48 overflow-hidden bg-slate-50">
        <img 
          src={product.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute top-5 left-5">
           <div className={cn(
             "px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-xl shadow-2xl border",
             isHigh ? "bg-emerald-500/90 text-white border-emerald-400/50" : "bg-slate-900/90 text-white border-slate-700/50"
           )}>
             <Target size={12} className={cn(isHigh ? "text-white" : "text-primary")} />
             OPS {ops.score}
           </div>
        </div>

        {/* eBay Transparency Badge */}
        <div className="absolute bottom-4 right-5">
          <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 shadow-lg flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9px] font-black text-slate-900 tracking-tighter">eBay Market Live</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Title & Primary Metrics */}
      <div className="p-6 flex-1 flex flex-col space-y-6">
        <div className="space-y-2">
          <h3 className="text-[14px] font-bold text-slate-900 leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tighter">${product.price}</span>
              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                Avg: ${product.priceRange?.avg || (product.price * 1.05).toFixed(2)}
              </span>
            </div>
            
            {/* OPS Score Ring */}
            <div className="flex items-center gap-3 bg-slate-50 pl-3 pr-1 py-1 rounded-3xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Market<br/>Grade</span>
              <OPSRing score={ops.score} color={ops.color} />
            </div>
          </div>
        </div>

        {/* 3. INTELLIGENCE STACK */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 p-4 bg-slate-50/50 rounded-3xl border border-slate-100/50">
           <IntelligenceLabel label="Demand" value={ops.labels.demand} />
           <IntelligenceLabel label="Competition" value={ops.labels.competition} />
           <IntelligenceLabel label="Profit Pot." value={ops.labels.profit} />
           <IntelligenceLabel label="Trend" value={ops.labels.trend} />
        </div>

        {/* 4. RECOMMENDATION INSIGHT LAYER */}
        <div className="flex-1 flex flex-col justify-end">
           <div className="p-3.5 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
              <div className="mt-1">
                <Shield size={14} className="text-primary fill-primary/20" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-[9px] font-black text-primary uppercase tracking-widest">Recommendation Pulse</span>
                <p className="text-[11px] font-bold text-slate-700 leading-relaxed italic">
                  "{ops.reasoning}"
                </p>
              </div>
           </div>
        </div>
      </div>

      {/* 5. ACTIONS: SaaS Grade Buttons */}
      <div className="px-6 pb-6 pt-2 flex gap-3">
         <button 
           onClick={() => window.open(`https://www.ebay.com/itm/${product.id}`, '_blank')}
           className="flex-1 h-11 rounded-2xl border border-slate-100 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all group/btn"
         >
           View Product <ExternalLink size={12} className="opacity-40 group-hover/btn:opacity-100 transition-opacity" />
         </button>
         <button 
           onClick={() => onOptimize(product)}
           className="flex-1 h-11 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary transition-all shadow-xl shadow-slate-200 group/opt"
         >
           Optimize Listing <ChevronRight size={14} className="group-hover/opt:translate-x-1 transition-transform" />
         </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
