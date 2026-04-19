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
  Warehouse
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Supplier Discovery Row - CJ Dropshipping Edition (v11.0)
 * High-fidelity ranking display with unified scoring engine output.
 */
const SupplierResultRow = ({ product, targetPrice, onContinue }) => {
    
    // Extract True CJ Intelligence outputs if parsed
    const intel = product.intelligence;
    const sellScoreNum = intel ? intel.sell_score.sell_score : (product.sellData?.resellScore || 50);
    const profitMarginPercent = intel ? intel.roi.roi_percent : 0;
    const riskLevel = intel ? intel.risk.risk_level : "UNKNOWN";
    const shippingEstimate = intel ? intel.shipping.delivery_estimate : product.shipping;
    const profitVal = intel ? intel.roi.roi_value : parseFloat(targetPrice - product.price);

    const sourceLabel = "CJ Dropshipping API";

    // Score Color Mapping
    const getScoreColor = (val) => {
        if (val >= 80) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
        if (val >= 50) return "text-amber-400 border-amber-500/20 bg-amber-500/10";
        return "text-red-400 border-red-500/20 bg-red-500/10";
    };

    return (
        <motion.div 
            whileHover={{ y: -2, scale: 1.01 }}
            className="group relative bg-[#0B1120] border border-white/5 p-8 rounded-[3.5rem] flex flex-col xl:flex-row items-center gap-10 transition-all shadow-2xl overflow-hidden"
        >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* RANK & SCORE HEX */}
            <div className="flex flex-col items-center justify-center shrink-0 w-24 h-24 bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl group-hover:border-emerald-500/50 transition-colors">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none text-center">Engine<br/>Score</span>
                 <span className={cn("text-3xl font-black italic tracking-tighter mt-1", getScoreColor(sellScoreNum).split(' ')[0])}>
                    {sellScoreNum}
                 </span>
            </div>

            {/* PRODUCT VISUAL */}
            <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-2 border-white/10 shrink-0 shadow-2xl relative bg-slate-900 group-hover:border-emerald-500/30 transition-colors">
                <img 
                    src={product.image} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                />
            </div>

            {/* DATA CORE */}
            <div className="flex-1 min-w-0 space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                        {sourceLabel}
                    </span>
                    <span className={cn("px-4 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest", getScoreColor(profitMarginPercent))}>
                        Margin: {profitMarginPercent}%
                    </span>
                    <span className="px-4 py-1.5 bg-slate-800 text-slate-400 border border-white/5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Warehouse size={10} /> {intel ? intel.shipping.warehouse : "CN"}
                    </span>
                    {intel && intel.variants.has_variants && (
                       <span className="px-4 py-1.5 border border-white/10 bg-white/5 rounded-full text-[8px] font-black text-slate-300 uppercase tracking-widest">
                          {intel.variants.variants.length} Variants
                       </span>
                    )}
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter line-clamp-1 leading-none group-hover:text-emerald-400 transition-colors">
                        {product.title}
                    </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-4 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Lowest Cost</span>
                        <div className="text-2xl font-black text-white italic tracking-tighter">
                            ${parseFloat(product.price).toFixed(2)}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Delivery Est.</span>
                        <span className="text-[12px] font-black text-slate-300 uppercase tracking-tight flex items-center gap-2">
                            <Clock size={12} className="text-amber-400" /> {shippingEstimate}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Risk Factor</span>
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={12} className={cn(riskLevel === 'LOW' ? "text-emerald-500" : (riskLevel === "MEDIUM" ? "text-amber-500" : "text-rose-500"))} />
                            <span className="text-[12px] font-black text-white uppercase tracking-widest">
                                {riskLevel}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">ROI Potential</span>
                        <div className="text-2xl font-black text-emerald-400 italic tracking-tighter">
                            +${profitVal.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* ROI & ACTION ZONE */}
            <div className="flex items-center gap-10 shrink-0 border-t xl:border-t-0 xl:border-l border-white/5 pt-8 xl:pt-0 xl:pl-10 w-full xl:w-auto justify-between xl:justify-end">
                <div className="flex flex-col gap-6 text-right">
                    <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Identity Match</span>
                        <div className="text-4xl font-black text-white italic tracking-tighter leading-none">
                            {product.alignmentScore}%
                        </div>
                    </div>
                </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-2">
                             <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{product.matchReason}</div>
                        </div>
                        <button 
                            onClick={() => onContinue(product)}
                            className="px-10 py-5 bg-white text-slate-950 hover:bg-emerald-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 group/btn hover:scale-105 active:scale-95"
                        >
                            Select Supplier
                            <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
            </div>
        </motion.div>
    );
};

export default SupplierResultRow;
