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
  const { metrics } = sellData;
  const isTopPick = sellData.status === 'TOP PICK';

  if (isCompact) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5, scale: 1.02 }}
        onClick={() => onAdd(product)}
        className={cn(
          "group relative flex flex-col gap-4 p-5 bg-[#111C33] border border-[#2A3A55] rounded-[2rem] cursor-pointer hover:border-emerald-500/50 transition-all shadow-xl",
          isTopPick && "border-green-500/20 bg-green-500/5"
        )}
      >
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#0A0F1E] border border-white/5">
           <img 
             src={product?.images?.[0] || product?.image || product?.thumbnail || product?.image_url || "/placeholder-product.png"} 
             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
           />
           <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
              <ConfidenceBadge level={sellData.confidence} />
              <div className="px-2 py-0.5 bg-slate-950/80 backdrop-blur-md rounded-md border border-white/10 text-[7px] font-black text-white uppercase tracking-widest">
                Score: {sellData.resellScore}
              </div>
           </div>
        </div>
        
        <div className="space-y-2">
           <h4 className="text-[10px] font-black text-white uppercase tracking-tight line-clamp-1 opacity-80 group-hover:opacity-100">{product.title}</h4>
           <div className="flex items-center justify-between">
              <span className="text-xl font-black text-white italic tracking-tighter">${(Number(product.price) || 0).toFixed(2)}</span>
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                 <ArrowRight size={14} />
              </div>
           </div>
        </div>

        {isTopPick && (
          <div className="absolute -left-1 -top-1">
             <div className="bg-emerald-500 text-white text-[6px] font-black px-2 py-1 rounded-br-lg rounded-tl-xl uppercase tracking-tighter animate-pulse">
                Winner
             </div>
          </div>
        )}
      </motion.div>
    );
  }

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
                {product.price ? `$${product.price.toFixed(2)}` : 'N/A'}
              </span>
              <ConfidenceBadge level={sellData.confidence} />
           </div>

           {/* INSIGHT TEXT (ANALYTICAL REPORT) */}
           <div className="text-[10px] md:text-[11px] font-medium text-slate-400 border-l border-slate-700/50 pl-4 py-2 space-y-4 whitespace-pre-line leading-relaxed">
              {sellData.summary}
           </div>

           <div className="flex flex-wrap items-center gap-6 md:gap-8 pt-4 border-t border-white/5">
              <div className="flex flex-col gap-0.5">
                 <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Pricing Signal</span>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white italic">{metrics.positioning.signal}</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[6px] font-black text-slate-400">Score: {metrics.positioning.score}</span>
                 </div>
              </div>
              <div className="flex flex-col gap-0.5 border-l border-white/10 pl-6">
                 <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Density Analysis</span>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white italic">{metrics.saturation.density} QTY</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[6px] font-black text-slate-400">Score: {metrics.saturation.score}</span>
                 </div>
              </div>
              <div className="flex flex-col gap-0.5 border-l border-white/10 pl-6">
                 <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Velocity Lead</span>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white italic">+{metrics.velocity.ratio.toFixed(1)}%</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[6px] font-black text-slate-400">Score: {metrics.velocity.score}</span>
                 </div>
              </div>
              <div className="ml-auto hidden xl:block">
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
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd({
                    ...product,
                    id: product.id,
                    title: product.title,
                    price: Number(product.price) || 0,
                    image: product.image || product.thumbnail || product.image_url || null
                  })
                }}
                className="px-8 md:px-12 py-3.5 md:py-4.5 bg-white text-slate-950 hover:bg-[#22C55E] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 group/btn flex items-center justify-center gap-2"
              >
                Add to Store <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(product);
                }}
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
