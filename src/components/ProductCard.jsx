import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Target,
  Image as ImageIcon,
  Zap,
  TrendingUp,
  ExternalLink,
  Plus,
  ArrowRight,
  Sparkles,
  BarChart3,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  LineChart,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import sourcingService from '../services/sourcing';

// High-performance image component with CLS protection
const SafeImage = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fallback = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200';

  return (
    <div className={cn("relative overflow-hidden bg-[#0A0F1E] rounded-3xl shrink-0 border border-white/5", className)}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-[#0A0F1E] animate-pulse flex items-center justify-center">
            <ImageIcon size={20} className="text-slate-800" />
        </div>
      )}
      <img
        src={error ? fallback : src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "w-full h-full object-cover transition-all duration-700",
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
        )}
      />
    </div>
  );
};

const ConfidenceBadge = ({ level }) => {
  const styles = {
    High: "bg-green-500/10 text-green-500 border-green-500/20",
    Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Low: "bg-red-500/10 text-red-500 border-red-500/20"
  };
  const Icon = level === 'High' ? ShieldCheck : (level === 'Medium' ? ShieldQuestion : ShieldAlert);
  
  return (
    <div className={cn("px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5", styles[level])}>
      <Icon size={12} /> {level} Confidence
    </div>
  );
};

/**
 * SVG-Based Mini Momentum Line (Real-Data Adaptive Visual)
 */
const MiniMomentumLine = ({ data, color = "#22C55E" }) => {
  if (!data || data.length < 2) return null;
  
  const width = 100;
  const height = 30;
  const padding = 2;
  
  const points = data.map((p, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - (p.y / 100) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
       <div className="flex items-center justify-between">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Market Momentum (Estimated)</span>
          <Activity size={10} className={cn(data[data.length-1].y > 50 ? "text-green-500" : "text-yellow-500")} />
       </div>
       <svg width={width} height={height} className="overflow-visible">
         <polyline
           fill="none"
           stroke={color}
           strokeWidth="2.5"
           strokeLinecap="round"
           strokeLinejoin="round"
           points={points}
           className="drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
         />
       </svg>
    </div>
  );
};

/**
 * Adaptive Market Analysis Node (v11.0)
 * Real-time batch normalized intelligence.
 */
const ProductCard = React.memo(({ product, onAdd, batchContext, isCompact = false }) => {
  if (!product) return null;

  const sellData = useMemo(() => sourcingService.calculateSellScore(product, batchContext), [product.id, batchContext]);
  const isTopPick = sellData.status === 'TOP PICK';
  const isHighMargin = sellData.profitLevel === 'High';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005, y: -1 }}
      className={cn(
        "group saas-card p-4 flex items-center gap-6 relative overflow-hidden",
        isTopPick && "border-green-500/40 shadow-[0_0_60px_rgba(34,197,94,0.1)]",
        isCompact ? "flex-col items-start gap-4 p-6" : "flex-row"
      )}
      style={{ backgroundColor: '#111C33' }}
    >
      {/* 🚀 TOP PICK INDICATOR */}
      {isTopPick && (
        <div className="absolute top-0 right-0 p-3">
           <div className="bg-green-500 text-slate-950 px-3 py-1 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse shadow-2xl">
              <Sparkles size={12} className="fill-slate-950" /> Market Leader
           </div>
        </div>
      )}

      {/* 1. VISUAL IDENTIFIER */}
      <SafeImage 
        src={product.thumbnail || product.image_url} 
        alt={product.title} 
        className={cn(isCompact ? "w-full h-40" : "w-[90px] h-[90px]")} 
      />

      {/* 2. CORE INTELLIGENCE BLOCK */}
      <div className="flex-1 min-w-0 space-y-3">
         <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-6">
               <h3 className="text-xs font-black text-[#EAF0FF] leading-tight line-clamp-2 transition-colors group-hover:text-white uppercase tracking-tight">
                 {product.title}
               </h3>
               {!isCompact && (
                  <button 
                    onClick={() => onAdd(product)}
                    className="text-slate-500 hover:text-white transition-colors p-2 bg-slate-800/20 rounded-xl border border-white/5"
                  >
                    <BarChart3 size={16} />
                  </button>
               )}
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
               <span className="text-xl font-black text-white italic tracking-tighter leading-none">${product.price.toFixed(2)}</span>
               <div className="h-4 w-px bg-[#2A3A55]" />
               <ConfidenceBadge level={sellData.confidence} />
               {isHighMargin && (
                  <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[7px] font-black uppercase tracking-[0.15em] animate-pulse">
                     Premium Yield
                  </div>
               )}
            </div>
         </div>

         {/* EXPLAINABLE INSIGHT SUMMARY (CONTAINMENT HARDENED) */}
         <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic border-l-2 border-slate-800 pl-4 py-1 line-clamp-3">
            "{sellData.summary}"
         </p>

         {/* DATA-DRIVEN METRIC GRID */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
            <div className="flex flex-col gap-1">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Competition</span>
               <span className={cn("text-xs font-black tracking-tight", product.totalFound < 500 ? "text-green-500" : "text-[#EAF0FF]")}>
                  {product.totalFound < 300 ? 'Low Saturation' : (product.totalFound < 1000 ? 'Balanced' : 'High Saturation')}
               </span>
            </div>
            <div className="flex flex-col gap-1">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Growth Vector</span>
               <span className="text-xs font-black text-[#EAF0FF] tracking-tight">{sellData.metrics.batchRank}</span>
            </div>
            <div className="col-span-2">
               <MiniMomentumLine data={sellData.momentum} color={sellData.color} />
            </div>
         </div>
      </div>

      {/* 3. STRATEGIC ACTIONS */}
      <div className={cn("flex items-center gap-6 shrink-0", isCompact && "w-full justify-between")}>
         {/* SELL SCORE ANALYTIC (ADAPTIVE RANK) */}
         <div className="flex flex-col items-center gap-2">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resale Score</span>
            <div className={cn(
               "w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl italic tracking-tighter border shadow-2xl",
               isTopPick ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-slate-900 border-[#2A3A55] text-[#EAF0FF]"
            )}>
               {sellData.score}
            </div>
         </div>

         {/* PRIMARY INVESTMENT ACTION */}
         <div className="flex flex-col gap-2.5">
            <button 
              onClick={() => onAdd(product)}
              className="px-6 py-3.5 bg-white text-slate-950 hover:bg-[#22C55E] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl shadow-white/5 flex items-center gap-2.5 active:scale-95 group/btn"
            >
              Add to Store
              <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
            </button>
            <button 
              onClick={() => onAdd(product)} // Routes to details via state
              className="px-6 py-3 bg-transparent border border-[#2A3A55] text-[#EAF0FF] hover:bg-[#1A2742] hover:border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
            >
              View Details <ArrowRight size={12} />
            </button>
         </div>
      </div>
    </motion.div>
  );
});

export default ProductCard;
