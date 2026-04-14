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
    <div className={cn("relative overflow-hidden bg-[var(--bg-app)] rounded-3xl shrink-0 border border-[var(--border-color)]", className)}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-[var(--bg-app)] animate-pulse flex items-center justify-center">
            <ImageIcon size={20} className="text-[var(--text-secondary)]" />
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
    High: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
    Medium: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
    Low: "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20"
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
const MiniMomentumLine = ({ data, color = "var(--success)" }) => {
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
    <div className="flex flex-col gap-1.5 min-w-0">
       <div className="flex items-center justify-between gap-4">
          <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest truncate">Market Momentum</span>
          <Activity size={10} className={cn(data[data.length-1].y > 50 ? "text-[var(--success)]" : "text-[var(--warning)]")} />
       </div>
       <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" preserveAspectRatio="none">
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
 * Adaptive Market Analysis Node (v12.0 Responsive)
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
      whileHover={{ scale: 1.01, y: -2 }}
      className={cn(
        "group saas-card p-6 flex items-start gap-8 relative overflow-hidden transition-all duration-300 w-full",
        isTopPick && "border-[var(--success)]/40 shadow-[0_0_60px_rgba(34,197,94,0.1)]",
        isCompact ? "flex-col gap-6" : "flex-col tablet:flex-row"
      )}
    >
      {/* 🚀 TOP PICK INDICATOR */}
      {isTopPick && (
        <div className="absolute top-0 right-0 p-4">
           <div className="bg-[var(--success)] text-white px-3 py-1 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse shadow-2xl">
              <Sparkles size={12} className="fill-white" /> Market Leader
           </div>
        </div>
      )}

      {/* 1. VISUAL IDENTIFIER (Responsive Scaling) */}
      <SafeImage 
        src={product.thumbnail || product.image_url} 
        alt={product.title} 
        className={cn(
            "w-full max-w-full",
            isCompact ? "h-56" : "md:w-[140px] md:h-[140px]"
        )} 
      />

      {/* 2. CORE INTELLIGENCE BLOCK */}
      <div className="flex-1 min-w-0 space-y-5 w-full">
         <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-6">
               <h3 className="text-sm font-black text-[var(--text-primary)] leading-[1.3] line-clamp-2 transition-colors uppercase tracking-tight break-words">
                 {product.title}
               </h3>
               {!isCompact && (
                  <button 
                    onClick={() => onAdd(product)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2.5 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)] group-hover:border-[var(--primary-500)]"
                  >
                    <BarChart3 size={18} />
                  </button>
               )}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
               <span className="text-2xl font-black text-[var(--text-primary)] italic tracking-tighter leading-none">${product.price.toFixed(2)}</span>
               <div className="h-5 w-px bg-[var(--border-color)]" />
               <ConfidenceBadge level={sellData.confidence} />
               {isHighMargin && (
                  <div className="px-3 py-1 bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">
                     Premium Yield
                  </div>
               )}
            </div>
         </div>

         {/* EXPLAINABLE INSIGHT SUMMARY (Adaptive Wrap) */}
         <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed italic border-l-2 border-[var(--border-color)] pl-5 py-2 break-words">
            "{sellData.summary}"
         </p>

         {/* DATA-DRIVEN METRIC GRID (Rule 2: Responsive Columns) */}
         <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-8 pt-2">
            <div className="flex flex-col gap-2">
               <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Competition</span>
               <span className={cn("text-[11px] font-black tracking-tight uppercase leading-none truncate", product.totalFound < 500 ? "text-[var(--success)]" : "text-[var(--text-primary)]")}>
                  {product.totalFound < 300 ? 'Low Saturation' : (product.totalFound < 1000 ? 'Balanced' : 'High Density')}
               </span>
            </div>
            <div className="flex flex-col gap-2">
               <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Dataset Vector</span>
               <span className="text-[11px] font-black text-[var(--text-primary)] tracking-tight uppercase leading-none truncate">{sellData.metrics.batchRank}</span>
            </div>
            <div className="col-span-1 xs:col-span-2 md:col-span-1 pt-2 md:pt-0">
               <MiniMomentumLine data={sellData.momentum} color={sellData.color} />
            </div>
         </div>
      </div>

      {/* 3. STRATEGIC ACTIONS (Rule 4: Ellipsis Safety) */}
      <div className={cn("flex flex-col gap-6 shrink-0 w-full lg:w-auto", !isCompact && "lg:flex-row lg:items-center lg:gap-12")}>
         {/* SELL SCORE ANALYTIC (ADAPTIVE RANK) */}
         <div className="flex flex-row lg:flex-col items-center gap-4 lg:gap-3">
            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] lg:text-center">Resale Rank</span>
            <div className={cn(
               "w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl italic tracking-tighter border shadow-3xl transition-transform group-hover:rotate-12",
               isTopPick ? "bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]" : "bg-black border-[var(--border-color)] text-[var(--text-primary)] shadow-2xl"
            )}>
               {sellData.score}
            </div>
         </div>

         {/* PRIMARY INVESTMENT ACTION (Rule 1 & 4 Compliance) */}
         <div className="flex flex-col gap-4 w-full lg:min-w-[240px]">
            <button 
              onClick={() => onAdd(product)}
              className="w-full px-8 py-5 bg-[var(--text-primary)] text-[var(--bg-app)] hover:bg-[var(--primary-500)] hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 group/btn"
            >
              Add to Store
              <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
            </button>
            <button 
              onClick={() => onAdd(product)} 
              className="w-full px-8 py-4 bg-transparent border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--text-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
            >
              View Research <ArrowRight size={16} />
            </button>
         </div>
      </div>
    </motion.div>
  );
});

export default ProductCard;
