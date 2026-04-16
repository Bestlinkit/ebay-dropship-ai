import React from 'react';
import { 
  Star, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight, 
  Clock, 
  Zap,
  Info,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Supplier Discovery Row (v8.0)
 * Optimized for Stage 1 (Discovery).
 */
const SupplierResultRow = ({ product, targetPrice, isBest, onContinue }) => {
    
    // 💡 SOURCE INTELLIGENCE MAPPING
    const getSourceLabel = (src) => {
        const s = (src || "").toLowerCase();
        if (s === 'eprolo') return { name: "Eprolo API", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" };
        if (s === 'aliexpress') return { name: "AliExpress", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" };
        return { name: "Unknown", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" };
    };

    const sourceIntel = getSourceLabel(product.source);

    return (
        <motion.div 
            whileHover={{ y: -2 }}
            className={cn(
                "group relative bg-white border p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-10 transition-all shadow-sm",
                isBest ? "border-emerald-500/30 shadow-[0_20px_60px_rgba(34,197,94,0.05)]" : "border-slate-200 hover:border-slate-300"
            )}
        >
            {isBest && (
                <div className="absolute -top-4 left-10 px-4 py-1.5 bg-emerald-500 rounded-full flex items-center gap-2 text-[8px] font-black text-white uppercase tracking-widest shadow-lg">
                    <Star size={10} className="fill-white" /> High Match
                </div>
            )}

            {/* PRODUCT VISUAL */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden border border-slate-100 shrink-0 shadow-lg relative">
                <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>

            {/* DATA CORE */}
            <div className="flex-1 min-w-0 space-y-4">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={cn(
                            "px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border",
                            sourceIntel.bg, sourceIntel.color, sourceIntel.border
                        )}>
                            Source: {sourceIntel.name}
                        </span>
                        
                        {product.price && targetPrice > 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[7px] font-black uppercase tracking-widest border border-emerald-100">
                                <TrendingUp size={8} /> Competitive Pricing
                            </div>
                        )}
                    </div>
                    <h3 className="text-[14px] font-black text-slate-950 uppercase tracking-tight line-clamp-1">{product.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-12">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Base Cost</span>
                        <span className="text-xl font-black text-slate-950 italic tracking-tighter">
                            {product.price ? `$${product.price.toFixed(2)}` : <span className="text-rose-500">N/A</span>}
                        </span>
                    </div>
                    {product.source === 'aliexpress' && (
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Trust Metrics</span>
                            <div className="flex items-center gap-4">
                                <span className="text-xl font-black text-slate-950 italic tracking-tighter flex items-center gap-1.5">
                                    <Star size={16} className="fill-orange-400 text-orange-400" />
                                    {product.rating ? product.rating.toFixed(1) : "N/A"}
                                </span>
                                {product.variants?.length > 0 && (
                                    <div className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md text-[7px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-1">
                                        <Zap size={8} className="fill-indigo-500" /> {product.variants.length} Variants
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ACTION GATE */}
            <div className="flex items-center gap-10 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-10 w-full md:w-auto justify-between md:justify-end">
                <div className="flex flex-col gap-2.5">
                    <button 
                        onClick={() => onContinue(product)}
                        className={cn(
                            "px-10 py-4 bg-slate-950 text-white hover:bg-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 group/btn"
                        )}
                    >
                        View Details
                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">
                        Mandatory Enrichment
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default SupplierResultRow;
