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
  Wand2 as Sparkles,
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
    <div className={cn("relative overflow-hidden bg-[#0A0F1E] rounded-2xl shrink-0 border border-white/5", className)}>
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
    <div className={cn("px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest flex items-center gap-1", styles[level])}>
      <Icon size={10} /> {level} Confidence
    </div>
  );
};

/**
 * SVG-Based Mini Momentum Line (Real-Data Adaptive Visual)
 */
const MiniMomentumLine = ({ data, color = "#22C55E" }) => {
  if (!data || data.length < 2) return null;
  
  const width = 80;
  const height = 24;
  const padding = 2;
  
  const points = data.map((p, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - (p.y / 100) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col gap-1">
       <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Demand Trend</span>
       <svg width={width} height={height} className="overflow-visible">
         <polyline
           fill="none"
           stroke={color}
           strokeWidth="2"
           strokeLinecap="round"
           strokeLinejoin="round"
           points={points}
           className="drop-shadow-[0_0_5px_rgba(34,197,94,0.2)]"
         />
       </svg>
    </div>
  );
};

/**
 * High-Performance Market Research Row (v11.4 RESTORATION)
 * Full-width horizontal architecture based on Image 2 reference.
 */
const ProductCard = React.memo(({ product, onAdd, batchContext, isCompact = false }) => {
  if (!product) return null;

  const sellData = useMemo(() => sourcingService.calculateSellScore(product, batchContext), [product.id, batchContext]);
  const isTopPick = sellData.status === 'TOP PICK';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "group saas-card p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden",
        isTopPick && "border-green-500/30 shadow-[0_30px_60px_rgba(0,0,0,0.5)]",
        "bg-[#111C33] rounded-[2.5rem]"
      )}
    >
      {/* 🚀 1. TITLE HEADER (FULL WIDTH) */}
      <h3 className="text-[11px] md:text-[13px] font-black text-white leading-tight uppercase tracking-tight line-clamp-1 opacity-90 group-hover:opacity-100 transition-opacity">
        {product.title}
      </h3>

      {/* 📦 2. CONTENT CORE (HORIZONTAL FLEX) */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12">
        
        {/* LEFT: VISUAL */}
        <SafeImage 
          src={product?.images?.[0] || product?.image || product?.thumbnail || product?.image_url || "/placeholder-product.png"} 
          alt={product?.title} 
          className="w-24 h-24 md:w-32 md:h-32 shadow-2xl" 
        />

        {/* CENTER: PRIMARY DATA & INSIGHTS */}
        <div className="flex-1 min-w-0 space-y-4">
           {/* PRICE & CONFIDENCE ROW */}
           <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-white italic tracking-tighter">
                {typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'N/A'}
              </span>
              <ConfidenceBadge level={sellData.confidence} />
           </div>

           {/* INSIGHT TEXT (MUTED) */}
           <p className="text-[10px] md:text-[11px] font-medium text-slate-400 italic line-clamp-2 leading-relaxed max-w-2xl border-l border-slate-700/50 pl-4 py-0.5">
              "{sellData.summary}"
           </p>

           <div className="flex items-center gap-8 md:gap-12 pt-2">
              <div className="flex flex-col gap-0.5">
                 <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Competition Level</span>
                 <span className={cn("text-[9px] font-black text-white")}>
                    {product.totalFound < 300 ? 'Low Saturation' : 'Balanced Market'}
                 </span>
              </div>
              <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Market Price</p>
              <span className="text-3xl font-black text-white italic tracking-tighter">
                {typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'N/A'}
              </span>
            </div>
              <div className="hidden sm:block">
                 <MiniMomentumLine data={sellData.momentum} color={sellData.color} />
              </div>
           </div>
        </div>

        {/* RIGHT: PERFORMANCE & CALLS-TO-ACTION */}
        <div className="flex items-center gap-8 md:gap-12 shrink-0 w-full md:w-auto justify-between md:justify-end border-t border-slate-800/50 md:border-0 pt-6 md:pt-0">
           
           {/* PERFORMANCE SCORE */}
           <div className="flex flex-col items-center gap-1.5 order-1 md:order-1">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Resell Score</span>
              <div className={cn(
                "w-12 h-12 md:w-16 md:h-16 rounded-[1.25rem] flex items-center justify-center font-black text-xl md:text-2xl italic border shadow-2xl relative",
                isTopPick ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-slate-900/50 border-white/5 text-white"
              )}>
                 {sellData.resellScore}
                 <div className="absolute -bottom-2 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[6px] font-black uppercase tracking-widest whitespace-nowrap">
                    {sellData.resellScore >= 80 ? "Strong" : (sellData.resellScore >= 60 ? "Decent" : "Weak")}
                 </div>
              </div>
           </div>

           {/* ACTION STACK */}
           <div className="flex flex-col gap-2.5 order-2 md:order-2">
              <button 
                onClick={() => onAdd({
                  ...product,
                  id: product.id,
                  title: product.title,
                  price: Number(product.price) || 0,
                  image: product.image || product.thumbnail || product.image_url || null
                })}
                className="px-8 md:px-12 py-3.5 md:py-4.5 bg-white text-slate-950 hover:bg-[#22C55E] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 group/btn flex items-center justify-center gap-2"
              >
                Add to Store <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
              </button>
              <button 
                onClick={() => onAdd(product)}
                className="px-8 md:px-12 py-3 md:py-4 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center"
              >
                View Details
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
});

export default ProductCard;
