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

            {/* PRODUCT VISUAL (v4.7 Image Logic) */}
            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-2 border-white/10 shrink-0 shadow-2xl relative bg-slate-900 group-hover:border-indigo-500/30 transition-colors">
                <img 
                    src={product.mainImage || product.image} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                    onError={(e) => { 
                        e.target.src = 'https://placehold.co/400x400/1e293b/white?text=CJ+Image+Not+Available'; 
                    }}
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                    <span className="text-[8px] font-black italic tracking-widest text-indigo-400 uppercase">CJ ID: {product.product_id}</span>
                </div>
            </div>

            {/* DATA CORE */}
            <div className="flex-1 min-w-0 space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                        MATCHING CATEGORY FAMILY
                    </span>
                    <span className="px-4 py-1.5 bg-slate-800 text-slate-400 border border-white/5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Globe size={10} /> {shippingOrigin}
                    </span>
                    <span className="px-4 py-1.5 bg-slate-800 text-slate-400 border border-white/5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                         <Box size={10} /> {stock} STOCK
                    </span>
                    <span className="px-4 py-1.5 bg-slate-800 text-slate-400 border border-white/5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Star size={10} className="text-amber-500" /> {rating}
                    </span>
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter line-clamp-1 leading-none group-hover:text-indigo-400 transition-colors italic">
                        {product.title}
                    </h3>
                </div>

                {/* KPI SECTION (v4.7 HERO PRIORITY) */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 pt-6 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Net Profit ($)</span>
                        <div className={cn("text-4xl font-black italic tracking-tighter", getProfitColor(profit))}>
                            {profitFormatted}
                        </div>
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">{profitStatus}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">CJ Cost</span>
                        <div className="text-3xl font-black text-white italic tracking-tighter">
                            ${parseFloat(product.price).toFixed(2)}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">eBay Target</span>
                        <div className="text-3xl font-black text-slate-400 italic tracking-tighter">
                            ${parseFloat(targetPrice).toFixed(2)}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Delivery</span>
                        <div className="flex items-center gap-2 mt-2">
                            <Truck size={14} className="text-indigo-400" />
                            <span className="text-[11px] font-black text-slate-200 uppercase tracking-tight">{deliveryTime}</span>
                        </div>
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">SHIP: {shippingLabel}</span>
                    </div>

                    <div className="hidden lg:flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Match Score</span>
                        <div className={cn("text-3xl font-black italic tracking-tighter", getScoreColor(finalScore).split(' ')[0])}>
                            {finalScore}%
                        </div>
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">{product.matchReason?.toUpperCase()}</span>
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
