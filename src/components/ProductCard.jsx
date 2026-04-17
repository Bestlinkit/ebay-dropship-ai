import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ChevronRight, 
  Zap,
  Package,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import sourcingService from '../services/sourcing';

/**
 * Deterministic Sparkline (v1.0)
 */
const MomentumGraph = ({ data }) => {
    if (!data || data.length < 2) return <span className="text-[8px] text-slate-600 uppercase">No trend data available</span>;
    
    const width = 100;
    const height = 24;
    const padding = 2;
    
    const points = data.map((p, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - (p.y / 100) * (height - padding * 2) - padding;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline 
                fill="none" 
                stroke="#10B981" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                points={points} 
            />
        </svg>
    );
};

/**
 * Deterministic Product Card (v16.0 - UI Recovery Phase)
 * PIXEL-PERFECT MATCH OF SUPPLIER DISCOVERY TEMPLATE.
 */
const ProductCard = React.memo(({ product, onAdd, batchContext }) => {
    const navigate = useNavigate();
    if (!product) return null;

    const [isAdded, setIsAdded] = useState(false);
    const sellData = useMemo(() => sourcingService.calculateSellScore(product, batchContext), [product.id, batchContext]);
    const { metrics, interpretation } = sellData;
    const labels = interpretation?.labels || {};

    const getScoreColor = (score) => {
        if (score >= 70) return "text-emerald-500";
        if (score >= 40) return "text-yellow-500";
        return "text-rose-500";
    };

    const handleViewDetails = () => {
        navigate(`/intelligence-review/${product.id}`, { state: { product, batchContext } });
    };

    return (
        <div className="group relative bg-[#0B1121] border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-8 transition-colors hover:bg-[#0E1629]">
            
            {/* 1. LEFT - IMAGE (Rounded with Padding) */}
            <div className="w-40 h-40 bg-white rounded-3xl p-4 shrink-0 overflow-hidden relative shadow-inner">
                <img 
                    src={product?.thumbnail || product?.image || product?.images?.[0] || product?.image_url || "/placeholder-product.png"} 
                    alt={product.title} 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                    onError={(e) => { e.target.src = "/placeholder-product.png"; }}
                />
            </div>

            {/* 2. CENTER - DATA STACK (High Density) */}
            <div className="flex-1 min-w-0 space-y-5">
                {/* Internal Tags */}
                <div className="flex items-center gap-3">
                    <div className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-[8px] font-black uppercase tracking-widest rounded border border-orange-500/10">
                        SOURCE: EBAY MARKET
                    </div>
                    <div className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded border border-indigo-500/10">
                        MOMENTUM: {labels.growthVector}
                    </div>
                    <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded border border-emerald-500/10">
                        ECONOMY
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight line-clamp-1">
                    {product.title}
                </h3>

                <div className="flex items-center gap-10">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">LIST PRICE</span>
                        <span className="text-2xl font-bold text-white tracking-tight">
                            {product.price ? `$${Number(product.price).toFixed(2)}` : 'N/A'}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">DEMAND</span>
                        <span className="text-[12px] font-bold text-white uppercase tracking-tight">
                            {labels.confidence} CONFIDENCE
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">COMPETITION</span>
                        <span className="text-[12px] font-bold text-white uppercase tracking-tight">
                            {labels.competition}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">MOMENTUM</span>
                        <div className="h-6 flex items-center">
                            <MomentumGraph data={sellData.momentum} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. RIGHT - KPI & ACTIONS */}
            <div className="flex items-center gap-12 shrink-0">
                <div className="flex flex-col items-end gap-1 px-8 border-l border-white/5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">RESELL SCORE</span>
                    <span className={cn("text-4xl font-bold tracking-tighter", getScoreColor(sellData.resellScore))}>
                        {sellData.resellScore}%
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded border border-white/10 mt-1">
                        <ShieldCheck size={10} className="text-slate-500" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">RELIABILITY: HIGH</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => {
                            onAdd({ ...product, sellData });
                            setIsAdded(true);
                        }}
                        className={cn(
                            "w-48 py-4 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between shadow-xl",
                            isAdded ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-white text-slate-950 hover:bg-slate-100"
                        )}
                    >
                        {isAdded ? "CAPTURED" : "CONTINUE"}
                        <ChevronRight size={14} />
                    </button>
                    <button 
                        onClick={handleViewDetails}
                        className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest pl-4 text-left transition-colors"
                    >
                        Review Data History
                    </button>
                </div>
            </div>
        </div>
    );
});

export default ProductCard;
