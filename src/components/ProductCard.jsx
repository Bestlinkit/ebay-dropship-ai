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
  
  // Defensive check for malformed data
  if (!sellData || !sellData.metrics) {
    return (
      <div className="p-5 bg-slate-900 border border-white/5 rounded-[2.5rem] opacity-50 flex items-center justify-center h-40">
        <span className="text-[10px] font-black text-slate-500 uppercase">Analysis Pending...</span>
      </div>
    );
  }

  const { metrics } = sellData;
  const isTopPick = sellData.status === 'TOP PICK';
  const remark = sellData.remark || "Analyzing Category...";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={cn(
        "saas-card group relative p-5 bg-slate-900 border border-white/5 rounded-[2.5rem] transition-all duration-500 hover:border-emerald-500/30 overflow-hidden",
        isTopPick && "border-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      )}
    >
      {/* 🚀 1. IMAGE & TOP BADGE */}
      <div className="relative aspect-square rounded-3xl overflow-hidden mb-5 bg-[#0A0F1E]">
        <SafeImage 
          src={product?.images?.[0] || product?.image || product?.thumbnail || product?.image_url || "/placeholder-product.png"} 
          alt={product?.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        
        {remark && (
          <div className={cn(
            "absolute top-4 right-4 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-500",
            remark === 'HOT CAKE' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
            remark === 'RISKY' ? "bg-rose-500/20 border-rose-500/30 text-rose-400" :
            "bg-slate-950/40 border-white/10 text-slate-400"
          )}>
            <div className="flex items-center gap-1.5">
              {remark === 'HOT CAKE' && <Zap size={10} className="fill-emerald-400" />}
              <span className="text-[9px] font-black uppercase tracking-widest">{remark}</span>
            </div>
          </div>
        )}

        {isTopPick && (
          <div className="absolute top-4 left-4 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-2xl rotate-12">
            <StarIcon size={16} className="fill-white" />
          </div>
        )}
      </div>

      {/* 📦 2. CONTENT CORE */}
      <div className="space-y-4">
        <div>
          <h3 className="text-[11px] font-black text-white/90 uppercase tracking-tighter line-clamp-2 leading-tight group-hover:text-white transition-colors h-8">
            {product.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 opacity-40">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{product.id}</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white italic tracking-tightest">
              {product.price ? `$${Number(product.price).toFixed(2)}` : 'N/A'}
            </span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Market Value</span>
          </div>
          <div className="text-right">
            <div className="text-[18px] font-black text-emerald-400 italic leading-none">{sellData.resellScore}</div>
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Resell Score</div>
          </div>
        </div>

        {/* 📉 TREND PREVIEW */}
        <div className="py-3 border-y border-white/5 space-y-2">
           <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Growth Pulse</span>
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                {metrics?.velocity?.ratio ? `${metrics.velocity.ratio.toFixed(1)}% Velocity` : 'Calibrating...'}
              </span>
           </div>
           <div className="h-8 flex items-end opacity-60 hover:opacity-100 transition-opacity">
              <MiniMomentumLine data={sellData.momentum} color={sellData.color} width={300} height={32} />
           </div>
        </div>

        {/* 🏷️ LABELS GRID */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Strategy</span>
            <p className="text-[9px] font-black text-white uppercase italic truncate">
              {sellData.interpretation?.labels?.position === 'At Market Median' ? 'COMPETITIVE' : 
               (sellData.interpretation?.labels?.position === 'Below Market Median' ? 'OPTIMIZED' : 'PREMIUM')}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Saturation</span>
            <p className="text-[9px] font-black text-white uppercase italic truncate">{sellData.interpretation?.labels?.saturation}</p>
          </div>
        </div>
      </div>

      {/* 🛠️ 3. ACTION FOOTER */}
      <div className="flex items-center gap-2 mt-6">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAdd({
              ...product,
              sellData
            });
            setIsAdded(true);
          }}
          className={cn(
            "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl",
            isAdded ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500" : "bg-white text-slate-950 hover:bg-emerald-400"
          )}
        >
          {isAdded ? "Added" : <><Plus size={12} /> Add to Store</>}
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleViewAnalysis();
          }}
          className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors shrink-0"
          title="View Analysis"
        >
          <BarChart3 size={14} />
        </button>
      </div>

      {/* 🤖 RECOMMENDATION TOOLTIP HOVER EFFECT (Glassmorphism) */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500">
         <ShieldCheck size={24} className="text-emerald-500 mb-4" />
         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Strategic Insight</span>
         <p className="text-[11px] font-medium text-white italic leading-relaxed">
            "{sellData.summary?.split(']').pop()?.trim()}"
         </p>
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
