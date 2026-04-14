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
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import sourcingService from '../services/sourcing';

// High-performance image node with CLS protection
const SafeImage = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fallback = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200';

  return (
    <div className={cn("relative overflow-hidden bg-slate-950/20 rounded-2xl shrink-0", className)}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
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
 * eBay Profit Engine: Product Node (v9.0)
 * High-density compact row architecture focused on one decision: "Add to Store".
 * Strictly money-first metrics.
 */
const ProductCard = React.memo(({ product, onAdd }) => {
  if (!product) return null;

  const sellData = useMemo(() => sourcingService.calculateSellScore(product), [product.id, product.price]);
  const isTopPick = sellData.status === 'TOP PICK';
  const isLowValue = sellData.status === 'LOW VALUE';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "group saas-card p-4 flex items-center gap-6 relative overflow-hidden",
        isTopPick && "border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.15)]",
        isLowValue && "opacity-60 contrast-75 grayscale-[0.5]"
      )}
    >
      {/* 🟢 TOP PICK INDICATOR */}
      {isTopPick && (
        <div className="absolute top-0 right-0 p-2">
           <div className="bg-green-500 text-slate-950 px-2 py-0.5 rounded-bl-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
              <Sparkles size={10} /> Top Pick
           </div>
        </div>
      )}

      {/* 1. VISUAL NODE */}
      <SafeImage src={product.thumbnail || product.image_url} alt={product.title} className="w-[85px] h-[85px]" />

      {/* 2. CORE INTELLIGENCE BLOCK */}
      <div className="flex-1 min-w-0">
         <div className="flex flex-col gap-1 mb-3">
            <h3 className="text-[13px] font-bold text-text-primary leading-tight line-clamp-2 pr-12 group-hover:text-blue-400 transition-colors">
              {product.title}
            </h3>
            <div className="flex items-center gap-2">
               <span className="text-xl font-black text-white italic tracking-tighter">${product.price}</span>
               <div className="h-1 w-1 rounded-full bg-slate-700" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Market Data</span>
            </div>
         </div>

         {/* COMPACT METRIC ROW */}
         <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Demand</span>
               <span className={cn("text-[10px] font-black leading-none", sellData.labels.demand === 'High' ? "text-green-500" : "text-text-primary")}>
                  {sellData.labels.demand}
               </span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Profit</span>
               <span className={cn("text-[10px] font-black leading-none", sellData.labels.profit === 'High' ? "text-green-500" : "text-text-primary")}>
                  {sellData.labels.profit}
               </span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Trend</span>
               <TrendingUp size={11} className={cn(sellData.labels.trend === 'Rising' ? "text-green-500" : "text-slate-500")} />
            </div>
         </div>
      </div>

      {/* 3. DECISION HUB */}
      <div className="flex items-center gap-8 shrink-0">
         {/* SELL SCORE ANALYTIC */}
         <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sell Score</span>
            <div className={cn(
               "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg italic tracking-tighter border",
               isTopPick ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-slate-900 border-slate-800 text-text-primary"
            )}>
               {sellData.score}
            </div>
         </div>

         {/* PRIMARY ACTION */}
         <button 
           onClick={() => onAdd(product)}
           className="btn-decision btn-primary sm:w-48 group/btn"
         >
           Add to Store
           <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
         </button>
      </div>
    </motion.div>
  );
});

export default ProductCard;
