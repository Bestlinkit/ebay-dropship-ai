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
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Supplier Discovery Row (v10.0 - SaaS Elite Redesign)
 * High-fidelity dark layout as requested by the user.
 */
const SupplierResultRow = ({ product, targetPrice, onContinue }) => {
    
    // Derived Intelligence
    const roiData = product.roiData || { roi: "0", profit: "0", label: "Low Yield" };
    const sourceLabel = "AliExpress DS API";

    return (
        <motion.div 
            whileHover={{ y: -2, scale: 1.01 }}
            className="group relative bg-[#0B1120] border border-white/5 p-8 rounded-[3.5rem] flex flex-col xl:flex-row items-center gap-12 transition-all shadow-2xl overflow-hidden"
        >
            {/* Background Grain/Effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* PRODUCT VISUAL */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-2 border-white/10 shrink-0 shadow-2xl relative bg-slate-900 group-hover:border-emerald-500/30 transition-colors">
                <img 
                    src={product.image} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                />
            </div>

            {/* DATA CORE */}
            <div className="flex-1 min-w-0 space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="px-4 py-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                        Source: {sourceLabel}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Activity size={10} /> Thin Margin
                        </span>
                        <span className="px-4 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={10} /> Economy
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter line-clamp-1 leading-none group-hover:text-emerald-400 transition-colors">
                        {product.title}
                    </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pt-4 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Base Cost</span>
                        <div className="text-3xl font-black text-white italic tracking-tighter">
                            {typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : product.price}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Shipping</span>
                        <span className="text-[12px] font-black text-slate-300 uppercase tracking-tight">
                            Free (15-25 days)
                        </span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ships From</span>
                        <span className="text-[12px] font-black text-white uppercase tracking-widest">
                            {product.shipsFrom || 'CN'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ROI & ACTION ZONE */}
            <div className="flex items-center gap-12 shrink-0 border-t xl:border-t-0 xl:border-l border-white/5 pt-10 xl:pt-0 xl:pl-12 w-full xl:w-auto justify-between xl:justify-end">
                <div className="flex flex-col gap-6 text-right">
                    <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ROI Estimate</span>
                        <div className="text-4xl font-black text-emerald-400 italic tracking-tighter leading-none">
                            {roiData.roi}%
                        </div>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                        <div className="px-3 py-1 bg-slate-900 border border-white/10 rounded-lg flex items-center gap-2">
                           <ShieldCheck size={12} className="text-emerald-500" />
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Reliability: Low</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => onContinue(product)}
                        className="px-12 py-5 bg-white text-slate-950 hover:bg-emerald-400 rounded-full text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 group/btn hover:scale-105 active:scale-95"
                    >
                        Continue
                        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default SupplierResultRow;
