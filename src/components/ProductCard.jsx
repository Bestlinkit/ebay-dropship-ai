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
  ShieldQuestion
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

const ConfidenceBadge = ({ level }) => {
  const styles = {
    High: "bg-green-500/10 text-green-500 border-green-500/30",
    Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    Low: "bg-red-500/10 text-red-500 border-red-500/30"
  };
  const Icon = level === 'High' ? ShieldCheck : (level === 'Medium' ? ShieldQuestion : ShieldAlert);
  
  return (
    <div className={cn("px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest flex items-center gap-1", styles[level])}>
      <Icon size={10} /> {level} Confidence
    </div>
  );
};

/**
 * eBay Profit Engine: Product Analysis Node (v10.0)
 * Real-time marketplace intelligence with context-aware scoring.
 */
const ProductCard = React.memo(({ product, onAdd, batchContext }) => {
  if (!product) return null;

  const sellData = useMemo(() => sourcingService.calculateSellScore(product, batchContext), [product.id, batchContext]);
  const isTopPick = sellData.status === 'TOP PICK';
  const isLowValue = sellData.status === 'LOW VALUE';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
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
              <Sparkles size={10} /> Market Winner
           </div>
        </div>
      )}

      {/* 1. VISUAL IDENTIFIER */}
      <SafeImage src={product.thumbnail || product.image_url} alt={product.title} className="w-[85px] h-[85px]" />

      {/* 2. CORE INTELLIGENCE BLOCK */}
      <div className="flex-1 min-w-0">
         <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center justify-between gap-4">
               <h3 className="text-[13px] font-bold text-[#EAF0FF] leading-tight line-clamp-2 transition-colors">
                 {product.title}
               </h3>
               {product.itemWebUrl && (
                  <a 
                    href={product.itemWebUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-white transition-colors p-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                  </a>
               )}
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xl font-black text-white italic tracking-tighter">${product.price}</span>
               <div className="h-1 w-1 rounded-full bg-slate-700" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Market Data</span>
               <div className="h-1 w-1 rounded-full bg-slate-700" />
               <ConfidenceBadge level={sellData.confidence} />
            </div>
         </div>

         {/* COMPACT METRIC ROW */}
         <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Competition</span>
               <span className={cn("text-[10px] font-black leading-none", product.totalFound < 1000 ? "text-green-500" : "text-[#EAF0FF]")}>
                  {product.totalFound < 1000 ? 'Low' : 'Neutral'}
               </span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Yield</span>
               <span className={cn("text-[10px] font-black leading-none", sellData.metrics.priceYield > 0.1 ? "text-green-500" : "text-[#EAF0FF]")}>
                  {sellData.metrics.priceYield > 0 ? `+${(sellData.metrics.priceYield * 100).toFixed(0)}%` : 'Baseline'}
               </span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Performance</span>
               <TrendingUp size={11} className={cn(sellData.score >= 70 ? "text-green-500" : "text-slate-500")} />
            </div>
         </div>
      </div>

      {/* 3. DECISION TERMINAL */}
      <div className="flex items-center gap-8 shrink-0">
         {/* SELL SCORE ANALYTIC */}
         <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Yield Score</span>
            <div className={cn(
               "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg italic tracking-tighter border",
               isTopPick ? "bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]" : "bg-slate-900 border-slate-800 text-[#EAF0FF]"
            )}>
               {sellData.score}
            </div>
         </div>

         {/* PRIMARY ACTION */}
         <button 
           onClick={() => onAdd(product)}
           className="btn-decision btn-primary sm:w-48 group/btn bg-primary hover:bg-white text-slate-950 transition-colors"
         >
           Add to Store
           <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
         </button>
      </div>
    </motion.div>
  );
});

export default ProductCard;
