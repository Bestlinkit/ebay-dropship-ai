import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  ChevronRight, 
  Target,
  Image as ImageIcon,
  Zap,
  TrendingUp,
  ExternalLink,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import sourcingService from '../services/sourcing';

// High-performance image node with CLS protection
const SafeImage = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fallback Registry
  const fallback = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200';

  return (
    <div className={cn("relative overflow-hidden bg-slate-950/20 rounded-2xl", className)}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
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

/**
 * SaaS Intelligence Terminal: Product Node (v8.0)
 * High-density horizontal row architecture with deterministic data metrics.
 * Wrapped in React.memo to prevent unnecessary re-renders during tab switching.
 */
const ProductCard = React.memo(({ product, onOptimize }) => {
  if (!product) return null;

  const ops = useMemo(() => sourcingService.calculateOPS(product), [product.id, product.price]);
  const isWinner = ops.score >= 80;
  const isWeak = ops.score <= 49;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      layout
      className={cn(
        "group relative saas-card p-4 flex items-center gap-6",
        isWinner && "shadow-[0_0_40px_rgba(16,185,129,0.1)] border-emerald-500/20",
        isWeak && "opacity-60 contrast-75 saturate-[0.3]"
      )}
    >
      {/* 1. LEFT: Compact Image Node */}
      <SafeImage 
        src={product.thumbnail || product.image_url || product.galleryURL} 
        alt={product.title} 
        className="w-[100px] h-[100px] shrink-0 shadow-lg border border-slate-800/50"
      />

      {/* 2. CENTER: Title & Valuation */}
      <div className="flex-1 min-w-0 space-y-2">
         <h3 className="text-sm font-bold text-text-primary truncate-2-lines leading-snug group-hover:text-primary transition-colors">
            {product.title}
         </h3>
         <div className="flex items-center gap-4">
            <div className="flex flex-col">
               <span className="text-lg font-black text-white italic tracking-tighter leading-none">${product.price}</span>
               <div className="flex items-center gap-1.5 mt-1">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isWinner ? "bg-emerald-500" : "bg-primary"
                  )} />
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none">Market Sync Active</span>
               </div>
            </div>
            
            <div className="h-8 w-px bg-slate-800/50" />

            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Price Delta</span>
               <span className={cn(
                 "text-[10px] font-bold uppercase tracking-tight",
                 product.price < (product.priceRange?.avg || product.price) ? "text-emerald-400" : "text-rose-400"
               )}>
                 {product.price < (product.priceRange?.avg || product.price) ? 'Competitive' : 'Market High'}
               </span>
            </div>
         </div>
      </div>

      {/* 3. RIGHT: Deterministic Intelligence Stack */}
      <div className="flex items-center gap-6 shrink-0">
          {/* Metric 1 (Required): OPS Badge */}
          <div className="flex flex-col items-center gap-1.5">
             <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none">OPS Score</span>
             <div className={cn(
               "w-12 h-12 rounded-xl border flex flex-col items-center justify-center transition-all",
               isWinner ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-950 border-slate-800 text-text-primary"
             )}>
                <span className="text-[13px] font-black tabular-nums leading-none tracking-tighter">{ops.score}</span>
             </div>
          </div>

          {/* Metric 2 (Required): Demand Badge */}
          <div className="hidden sm:flex flex-col items-center gap-1.5">
             <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none">Demand</span>
             <div className="badge-saas text-emerald-400 border-emerald-500/10">
                <Target size={11} /> {ops.labels.demand}
             </div>
          </div>

          {/* Metric 3 (Optional extra): Trend Velocity */}
          <div className="hidden lg:flex flex-col items-center gap-1.5">
             <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none">Velocity</span>
             <div className="badge-saas text-primary border-primary/10">
                <TrendingUp size={11} /> {ops.labels.trend}
             </div>
          </div>

          <div className="h-10 w-px bg-slate-800/50 mx-2" />

          {/* ACTIONS */}
          <div className="flex items-center gap-2">
             <button 
                onClick={() => window.open(`https://www.ebay.com/itm/${product.id}`, '_blank')}
                className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-700 transition-all"
             >
                <ExternalLink size={16} />
             </button>
             <button 
                onClick={() => onOptimize(product)}
                className="h-11 px-6 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 transition-all shadow-xl shadow-blue-500/10 active:scale-95 flex items-center gap-2"
             >
                Optimize <ArrowUpRight size={14} />
             </button>
          </div>
      </div>
    </motion.div>
  );
});

export default ProductCard;
