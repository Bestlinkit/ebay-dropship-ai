import React from 'react';
import { 
  Star, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight, 
  Clock, 
  Zap,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Supplier Result Row Component (v3.0)
 * Truth-based intelligence display for Eprolo and AliExpress searches.
 */
const SupplierResultRow = ({ product, targetPrice, isBest, onContinue }) => {
    // 💡 SOURCE INTELLIGENCE MAPPING
    const getPriceLabel = (roi) => {
        if (roi === null) return { text: "ROI Pending", color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200" };
        if (roi > 40) return { text: "High Yield", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
        if (roi > 20) return { text: "Market Match", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
        return { text: "Thin Margin", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
    };

    const getShippingLabel = (delivery) => {
        const days = parseInt(delivery) || 15;
        if (days <= 7) return { text: "Expedited", color: "text-emerald-600", bg: "bg-emerald-50" };
        if (days <= 14) return { text: "Standard", color: "text-blue-600", bg: "bg-blue-50" };
        return { text: "Economy", color: "text-amber-600", bg: "bg-amber-50" };
    };

    const priceIntel = getPriceLabel(product.roiRange?.expected || 0);
    const shipIntel = getShippingLabel(product.delivery);

    // 🕒 IRON FLOW 7.0: STATUS LABELS
    const isEnriching = product.enrichmentStatus === "PENDING";
    const isFailed = product.enrichmentStatus === "FAILED";

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
                    <Star size={10} className="fill-white" /> Optimal Selection
                </div>
            )}

            {/* PRODUCT VISUAL */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden border border-slate-100 shrink-0 shadow-lg">
                <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>

            {/* DATA CORE */}
            <div className="flex-1 min-w-0 space-y-4">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={cn(
                            "px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border",
                            product.source === 'Eprolo' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        )}>
                            Source: {product.source === 'Eprolo' ? 'Eprolo API' : 'AliExpress Scraper'}
                        </span>
                        
                        {/* 🧠 INTELLIGENCE BADGES */}
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border", priceIntel.bg, priceIntel.color, priceIntel.border)}>
                            <Zap size={8} /> {priceIntel.text}
                        </div>
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border", shipIntel.bg, shipIntel.color, "border-slate-100")}>
                            <Clock size={8} /> {shipIntel.text}
                        </div>

                        {product.hasVariantWarning && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-md text-[7px] font-black uppercase tracking-widest border border-yellow-500/20">
                                <AlertTriangle size={8} /> Variation Alert
                            </div>
                        )}
                    </div>
                    <h3 className="text-[13px] font-black text-slate-950 uppercase tracking-tight line-clamp-1">{product.title}</h3>
                    
                    {isEnriching && (
                        <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[7px] font-black uppercase tracking-widest border border-blue-100 animate-pulse">
                            <RefreshCw size={8} className="animate-spin" /> Deep Hydration in progress...
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-8 md:gap-12">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Base Cost</span>
                        <span className="text-xl font-black text-slate-950 italic tracking-tighter">
                            {isEnriching ? (
                                <span className="text-blue-500">Fetching...</span>
                            ) : (
                                product.price ? `$${product.price.toFixed(2)}` : <span className="text-rose-500">N/A</span>
                            )}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Shipping</span>
                        <span className="text-[11px] font-black text-slate-400 whitespace-nowrap">
                            {product.shipping ? `$${product.shipping.toFixed(2)}` : 'FREE'} ({product.delivery || 'Standard'})
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Ships From</span>
                        <span className="text-[11px] font-black text-slate-700">{product.shipsFrom}</span>
                    </div>
                </div>
            </div>

            {/* DECISION MATRIX */}
            <div className="flex items-center gap-10 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-10 w-full md:w-auto justify-between md:justify-end">
                <div className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">ROI Estimate</span>
                    <div>
                        <span className={cn(
                            "text-xl font-black italic tracking-tighter leading-none whitespace-nowrap",
                            isEnriching ? "text-slate-300" : "text-emerald-600"
                        )}>
                            {isEnriching ? (
                                'Calculating...'
                            ) : (
                                product.roiRange?.expected !== null ? (
                                    `${product.roiRange.conservative}% – ${product.roiRange.expected}%`
                                ) : (
                                    '--- %'
                                )
                            )}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-2.5">
                    <div className={cn(
                        "px-3 py-1.5 rounded-xl border flex items-center justify-center gap-2",
                        product.trust === 'High' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-200 text-slate-500"
                    )}>
                        <ShieldCheck size={14} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Reliability: {product.trust}</span>
                    </div>
                    <button 
                        onClick={() => onContinue(product)}
                        className={cn(
                            "px-10 py-4 bg-slate-950 text-white hover:bg-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 group/btn"
                        )}
                    >
                        Continue 
                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default SupplierResultRow;
