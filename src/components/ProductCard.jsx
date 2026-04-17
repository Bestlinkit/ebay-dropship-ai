import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ChevronRight, 
  BarChart3, 
  Plus,
  ShoppingCart,
  TrendingUp,
  Activity,
  Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import sourcingService from '../services/sourcing';

/**
 * Deterministic Momentum Gauge (v1.0)
 */
const ScoreGauge = ({ score }) => {
    const size = 64;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#10B981"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-1000"
                />
            </svg>
            <span className="absolute text-sm font-black text-white italic">{score}</span>
        </div>
    );
};

const MomentumGraph = ({ data, color = "#10B981" }) => {
    if (!data || data.length < 2) return null;
    const width = 120;
    const height = 30;
    const padding = 2;
    const points = data.map((p, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - (p.y / 100) * (height - padding * 2) - padding;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
        </svg>
    );
};

/**
 * Product Card (v15.0 - System Override Lock)
 * STRICT 4-ZONE HORIZONTAL ROW LAYOUT.
 */
const ProductCard = React.memo(({ product, onAdd, batchContext }) => {
    const navigate = useNavigate();
    if (!product) return null;

    const [isAdded, setIsAdded] = useState(false);
    const sellData = useMemo(() => sourcingService.calculateSellScore(product, batchContext), [product.id, batchContext]);
    const { metrics, interpretation } = sellData;
    const labels = interpretation?.labels || {};

    const handleViewDetails = () => {
        navigate(`/intelligence-review/${product.id}`, { state: { product } });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group relative bg-slate-950 border border-white/5 p-8 rounded-[3.5rem] flex flex-col xl:flex-row items-center gap-12 transition-all hover:border-emerald-500/20 shadow-2xl mb-6"
        >
            {/* 1. LEFT - IMAGE ZONE (Rounded Square) */}
            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-2 border-white/5 bg-slate-900 shrink-0 relative shadow-2xl">
                <img 
                    src={product?.images?.[0] || product?.image || "/placeholder-product.png"} 
                    alt={product.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
            </div>

            {/* 2. CENTER - DATA STACK ZONE */}
            <div className="flex-1 min-w-0 space-y-4">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter line-clamp-1 h-6">
                    {product.title}
                </h3>
                
                <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-white italic tracking-tightest">
                        {product.price ? `$${Number(product.price).toFixed(2)}` : 'N/A'}
                    </span>
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={12} /> [{labels.confidence} CONFIDENCE]
                    </div>
                </div>

                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight italic">
                    "Baseline market performance. Recommend observation."
                </p>

                {/* 3. BOTTOM ROW - MARKET SIGNALS */}
                <div className="flex flex-wrap items-center gap-12 pt-6 border-t border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Competition</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-md border border-white/5">
                            {labels.competition}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Growth Vector</span>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            labels.growthVector === 'ACCELERATING' ? "text-emerald-400" : 
                            labels.growthVector === 'DECLINING' ? "text-rose-500" : "text-amber-400"
                        )}>
                            {labels.growthVector}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Market Momentum</span>
                        <MomentumGraph data={sellData.momentum} />
                    </div>
                </div>
            </div>

            {/* 4. RIGHT - KPI & ACTION ZONE */}
            <div className="flex items-center gap-12 shrink-0 border-t xl:border-t-0 xl:border-l border-white/5 pt-10 xl:pt-0 xl:pl-12 w-full xl:w-auto justify-between xl:justify-end">
                <div className="flex flex-col items-center gap-2">
                    <ScoreGauge score={sellData.resellScore} />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Resell Score</span>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => {
                            onAdd({ ...product, sellData });
                            setIsAdded(true);
                        }}
                        className={cn(
                            "px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2",
                            isAdded ? "bg-emerald-500/10 text-emerald-500" : "bg-white text-slate-950 hover:bg-emerald-400"
                        )}
                    >
                        {isAdded ? "Selected" : "Add to Store"}
                        {!isAdded && <Plus size={14} />}
                    </button>
                    <button 
                        onClick={handleViewDetails}
                        className="px-10 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center justify-center gap-2 group/btn"
                    >
                        View Market Details
                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
});

export default ProductCard;
