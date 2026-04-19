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
  ExternalLink,
  DollarSign,
  Truck,
  Package,
  Activity,
  Box,
  Warehouse,
  Globe
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Supplier Discovery Row - CJ Dropshipping Edition (v11.0)
 * High-fidelity ranking display with unified scoring engine output.
 */
const SupplierResultRow = ({ product, targetPrice, onContinue }) => {
    
    // Extract Normalized CJ Intelligence (v4.7 Data Truth)
    const intel = product.intelligence;
    const financials = intel?.financials;
    const finalScore = product.alignmentScore || 0;
    
    // Truth Metrics
    const rating = product.rating || "N/A";
    const stock = product.stock !== null ? product.stock : "UNKNOWN";
    const shippingOrigin = product.shipping?.origin || "GLOBAL";
    const deliveryTime = product.shipping?.delivery_estimate || "UNKNOWN";
    const shippingLabel = financials?.shipping_label || "UNKNOWN";
    const profitStatus = financials?.status || "UNKNOWN";

    const profit = financials?.net_profit || 0;
    const roiPercent = financials?.roi_percent || 0;

    const profitFormatted = profit < 0 
        ? `-$${Math.abs(profit).toFixed(2)}` 
        : `+$${profit.toFixed(2)}`;

    // Score Color Mapping (v4.7 Mandate)
    const getScoreColor = (val) => {
        if (val >= 80) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
        if (val >= 60) return "text-amber-400 border-amber-500/20 bg-amber-500/10";
        if (val >= 40) return "text-orange-400 border-orange-500/20 bg-orange-500/10";
        return "text-rose-400 border-rose-500/20 bg-rose-500/10";
    };

    const getProfitColor = (val) => {
        if (val > 0) return "text-emerald-400";
        if (val < 0) return "text-rose-400";
        return "text-slate-400";
    };

    return (
        <motion.div 
            whileHover={{ y: -2, scale: 1.005 }}
            className="group relative bg-[#020617] border border-white/5 p-8 rounded-[3.5rem] flex flex-col xl:flex-row items-center gap-10 transition-all shadow-2xl overflow-hidden"
        >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* PRODUCT VISUAL (v4.7.5 Visual Logic) */}
            <div className="w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 bg-white rounded-[2rem] flex items-center justify-center overflow-hidden border-2 border-white/5 shrink-0 shadow-2xl relative group-hover:border-indigo-500/30 transition-all p-2">
                {product.mainImage && product.mainImage !== 'INVALID_IMAGE' ? (
                    <img 
                        src={product.mainImage} 
                        alt={product.title} 
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                        <Box size={32} className="text-slate-900" />
                        <span className="text-[7px] font-black uppercase tracking-widest text-slate-900">ASSET PENDING</span>
                    </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/90 rounded-lg shadow-lg border border-white/5">
                    <span className="text-[7px] font-black text-white/50 uppercase tracking-[0.2em]">{product.product_id}</span>
                </div>
            </div>

            {/* DATA CORE */}
            <div className="flex-1 min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                        MATCHING CATEGORY FAMILY
                    </span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 border border-white/5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Globe size={10} /> {shippingOrigin}
                    </span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 border border-white/5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 uppercase">
                         <Box size={10} /> {stock} STOCK
                    </span>
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter line-clamp-1 leading-none group-hover:text-indigo-400 transition-colors italic pr-12">
                        {product.title}
                    </h3>
                </div>

                {/* KPI SECTION (v4.7.5 HARDENED FLUID GRID) */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8 pt-5 border-t border-white/5">
                    <div className="flex flex-col gap-1 min-w-[100px]">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic whitespace-nowrap">Net Profit ($)</span>
                        <div className={cn("text-2xl md:text-3xl font-black italic tracking-tighter whitespace-nowrap tabular-nums font-mono leading-none", getProfitColor(profit))}>
                            {profitFormatted}
                        </div>
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.15em] whitespace-nowrap">{profitStatus}</span>
                    </div>

                    <div className="flex flex-col gap-1 min-w-[80px]">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic whitespace-nowrap">CJ Cost</span>
                        <div className="text-xl md:text-2xl font-black text-white italic tracking-tighter whitespace-nowrap tabular-nums font-mono leading-none">
                            ${parseFloat(product.price).toFixed(2)}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 min-w-[80px]">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic whitespace-nowrap">eBay Target</span>
                        <div className="text-xl md:text-2xl font-black text-slate-400 italic tracking-tighter whitespace-nowrap tabular-nums font-mono leading-none">
                            ${parseFloat(targetPrice).toFixed(2)}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 min-w-[110px]">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic whitespace-nowrap">Logistics</span>
                        <div className="flex items-center gap-2 mb-0.5">
                            <Truck size={12} className="text-indigo-400 shrink-0" />
                            <span className="text-[10px] font-black text-slate-200 uppercase tracking-tight whitespace-nowrap leading-none">{deliveryTime}</span>
                        </div>
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.15em] whitespace-nowrap flex items-center gap-1.5">
                           SHIP: {shippingLabel} 
                        </span>
                    </div>

                    <div className="hidden lg:flex flex-col gap-1 min-w-[100px]">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic whitespace-nowrap">Match Score</span>
                        <div className={cn("text-xl md:text-2xl font-black italic tracking-tighter whitespace-nowrap leading-none", getScoreColor(finalScore).split(' ')[0])}>
                            {finalScore}%
                        </div>
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.15em] whitespace-nowrap">{product.matchReason?.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* ACTION ZONE */}
            <div className="flex items-center gap-10 shrink-0 border-t xl:border-t-0 xl:border-l border-white/5 pt-8 xl:pt-0 xl:pl-10 w-full xl:w-auto justify-between xl:justify-end">
                <div className="flex flex-col gap-1 text-right">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ROI (Est.)</span>
                    <div className="text-2xl font-black text-white italic tracking-tighter leading-none">
                        {roiPercent.toFixed(1)}%
                    </div>
                </div>

                <button 
                    onClick={() => onContinue(product)}
                    className="px-12 py-5 bg-white text-slate-950 hover:bg-indigo-500 hover:text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 group/btn hover:scale-105 active:scale-95"
                >
                    Select Supplier
                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
};

export default SupplierResultRow;
