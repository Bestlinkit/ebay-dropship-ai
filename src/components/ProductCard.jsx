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
  Activity,
  Rocket,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
const MiniMomentumLine = ({ data, color = "#22C55E", width = 80, height = 24 }) => {
  if (!data || data.length < 2) return null;
  
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
 * High-Performance Product Card (v12.0 - Premium Hardening)
 * Optimized for high-end aesthetics and "Punchy" AI remarks.
 */
const ProductCard = React.memo(({ product, onAdd, batchContext, isCompact = false }) => {
  const navigate = useNavigate();
  if (!product) return null;

  const [isAdded, setIsAdded] = useState(false);
  const sellData = useMemo(() => sourcingService.calculateSellScore(product, batchContext), [product.id, batchContext]);
  const { metrics } = sellData;
  const isTopPick = sellData.status === 'TOP PICK';
  const remark = sellData.remark || "Analyzing Category...";

  if (isCompact) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5, scale: 1.02 }}
        onClick={() => onAdd(product)}
        className={cn(
          "group relative flex flex-col gap-4 p-5 bg-slate-900 border border-white/5 rounded-[2.5rem] cursor-pointer hover:border-emerald-500/50 transition-all shadow-xl",
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
              <div className="px-2 py-1 bg-emerald-500 text-white rounded-md text-[7px] font-black uppercase tracking-widest shadow-xl">
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
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "group saas-card p-6 md:p-10 flex flex-col gap-8 relative overflow-hidden",
        isTopPick && "border-emerald-500/20 shadow-[0_40px_80px_rgba(0,0,0,0.6)]",
        "bg-slate-900 border border-white/5 rounded-[3.5rem] transition-all duration-500"
      )}
    >
      {/* 🚀 1. TITLE & PUNCHY VERDICT HEADER */}
      <div className="flex items-center justify-between gap-6">
         <div className="flex flex-col gap-1 flex-1">
            <h3 className="text-[12px] md:text-[14px] font-black text-white leading-tight uppercase tracking-tightest line-clamp-1 opacity-80 group-hover:opacity-100 transition-opacity italic">
               {product.title}
            </h3>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{product.id}</span>
            </div>
         </div>
         {remark && (
            <div className={cn(
               "px-4 py-2 rounded-full border flex items-center gap-3 animate-in slide-in-from-right-4 duration-500",
               remark === 'HOT CAKE' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
               remark === 'RISKY' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
               "bg-white/5 border-white/10 text-slate-400"
            )}>
               {remark === 'HOT CAKE' && <Zap size={14} className="fill-emerald-400 text-emerald-400" />}
               <span className="text-[10px] font-black uppercase tracking-widest italic">{remark}</span>
            </div>
         )}
      </div>

      {/* 📦 2. CONTENT CORE */}
      <div className="flex flex-col md:flex-row items-center gap-12">
         <div className="relative group/img shrink-0">
            <SafeImage 
              src={product?.images?.[0] || product?.image || product?.thumbnail || product?.image_url || "/placeholder-product.png"} 
              alt={product?.title} 
              className="w-32 h-32 md:w-44 md:h-44 shadow-3xl rounded-[2.5rem] object-cover transition-transform duration-700 group-hover/img:scale-105" 
            />
            {isTopPick && (
               <div className="absolute -top-3 -right-3 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-2xl rotate-12 group-hover/img:rotate-0 transition-transform">
                  <StarIcon size={24} className="fill-white" />
               </div>
            )}
         </div>

         <div className="flex-1 min-w-0 flex flex-col gap-8">
            <div className="flex items-center gap-10">
               <div className="flex flex-col">
                  <span className="text-5xl font-black text-white italic tracking-tightest">
                    {product.price ? `$${Number(product.price).toFixed(2)}` : 'N/A'}
                  </span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Target Retail Value</span>
               </div>
               <div className="h-12 w-px bg-white/10" />
               <ConfidenceBadge level={sellData.confidence} />
            </div>

            <div className="flex flex-wrap items-center gap-12">
               <div className="flex flex-col gap-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Saturation</span>
                  <div className="flex flex-col">
                     <span className="text-[13px] font-black text-white italic tracking-tight">{sellData.interpretation?.labels?.saturation}</span>
                     <span className="text-[9px] font-bold text-slate-600">Density: {metrics.saturation.density}</span>
                  </div>
               </div>
               <div className="flex flex-col gap-2 border-l border-white/5 pl-12">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Pricing Strategy</span>
                  <div className="flex flex-col">
                     <span className="text-[13px] font-black text-white italic tracking-tight">
                        {sellData.interpretation?.labels?.position === 'At Market Median' ? 'COMPETITIVE MARKET PRICE' : 
                         (sellData.interpretation?.labels?.position === 'Below Market Median' ? 'OPTIMIZED ENTRY VALUE' : 'PREMIUM POSITION')}
                     </span>
                     <span className="text-[9px] font-bold text-slate-600">Z-Score: {metrics.positioning.zScore.toFixed(2)}</span>
                  </div>
               </div>
               <div className="flex flex-col gap-2 border-l border-white/5 pl-12">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Growth Velocity</span>
                  <div className="flex flex-col">
                     <span className="text-[13px] font-black text-white italic tracking-tight">{sellData.interpretation?.labels?.demand}</span>
                     <span className="text-[9px] font-bold text-slate-600">Rate: {metrics.velocity.ratio.toFixed(1)}%</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="flex flex-col items-center gap-4 shrink-0">
            <div className={cn(
               "w-24 h-24 md:w-32 md:h-32 rounded-[3.5rem] flex flex-col items-center justify-center font-black italic border shadow-3xl relative transition-all duration-500 group-hover:scale-105",
               isTopPick ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-800/50 border-white/5 text-white"
            )}>
               <span className="text-4xl md:text-5xl">{sellData.resellScore}</span>
               <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Resell Score</span>
            </div>
         </div>
      </div>

      {/* 📊 RESTORED TREND GRAPH & ANALYTICAL PULSE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 bg-white/[0.01] border-y border-white/5">
          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <TrendingUp size={12} className="text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">30-Day Market Velocity</span>
             </div>
             <div className="h-12 w-full flex items-end">
                <MiniMomentumLine data={sellData.momentum} color={sellData.color} width={400} height={48} />
             </div>
          </div>
          <div className="flex flex-col justify-center gap-2 pr-6">
             <div className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Growth Recommendation</span>
             </div>
             <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic opacity-80 border-l-2 border-white/5 pl-4">
                "{sellData.summary?.split(']').pop()?.trim()}"
             </p>
          </div>
      </div>

      {/* 🛠️ 3. ACTION FOOTER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
         <div className="flex items-center gap-4">
            <div className="flex items-center -space-x-3">
               {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                     <img src={`https://i.pravatar.cc/100?u=${i + product.id}`} className="w-full h-full object-cover grayscale opacity-50" />
                  </div>
               ))}
            </div>
            <span className="text-[10px] font-bold text-slate-500">
               <span className="text-white">{sellData.sellerCount || 12}+ Sellers</span> optimized this niche
            </span>
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
            {!isAdded ? (
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   onAdd({
                     ...product,
                     id: product.id,
                     title: product.title,
                     price: Number(product.price) || 0,
                     image: product.image || product.thumbnail || product.image_url || null
                   });
                   setIsAdded(true);
                 }}
                 className="flex-1 md:flex-none px-12 py-5 bg-white text-slate-950 hover:bg-emerald-500 hover:text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 group/btn flex items-center justify-center gap-2"
               >
                 Add to Store <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
               </button>
            ) : (
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   navigate('/supplier-sourcing', { state: { ebayProduct: product, query: product.title, targetPrice: product.price, batchContext } });
                 }}
                 className="flex-1 md:flex-none px-12 py-5 bg-emerald-500 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 group/btn flex items-center justify-center gap-2 animate-in zoom-in-95"
               >
                 Explore Global Market <Rocket size={18} className="animate-bounce" />
               </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/intelligence-review/${product.id}`, { state: { product, batchContext } });
              }}
              className="flex-1 md:flex-none px-10 py-5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all group/detail flex items-center justify-center gap-2"
            >
              View Analysis <ChevronRight size={18} className="group-hover/detail:translate-x-1 transition-transform" />
            </button>
         </div>
      </div>
    </motion.div>
  );
});

const StarIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L14.81 8.62L22 9.24L16.55 13.97L18.18 21L12 17.27L5.82 21L7.45 13.97L2 9.24L9.19 8.62L12 2Z" fill="currentColor" />
  </svg>
);

export default ProductCard;
