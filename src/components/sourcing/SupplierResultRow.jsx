import React from 'react';
import { 
  ChevronRight, 
  Truck, 
  Box, 
  Globe,
  DollarSign,
  Package
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Supplier Discovery Row - CJ Dropshipping Edition (v10.0 - ISOLATION)
 * Objective: Read ONLY from cjProduct.cj.* namespace.
 */
const SupplierResultRow = ({ product, targetPrice, onContinue, source = "CJ" }) => {
    
    // ⚠️ STEP 7: SAFETY GUARD
    if (source !== "CJ") return null;

    // ⚠️ STEP 5: CJ UI ONLY (SCOPED)
    // Map strictly from the 'cj' namespace
    const cj = product?.cj || {};
    
    const name = String(cj.name || "Unnamed Product");
    const image = String(cj.image || "https://via.placeholder.com/300");
    const variantsCount = Array.isArray(cj.variants) ? cj.variants.length : 0;
    const price = parseFloat(cj.price || 0);
    
    const target = parseFloat(targetPrice || 0);
    const cost = parseFloat(cj.cost || 0);
    const shipping = cj.shipping || { cost: 0, delivery: "7-15 Days" };
    const shippingCost = parseFloat(shipping.cost || 0);

    // Profit calculation using isolated CJ data
    const netProfit = (target > 0 && price > 0) ? (target - (price + shippingCost)) : null;
    const profitFormatted = netProfit !== null ? (netProfit < 0 ? `-$${Math.abs(netProfit).toFixed(2)}` : `+$${netProfit.toFixed(2)}`) : "N/A";

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-[#0B1121] border border-white/5 rounded-[2.5rem] p-6 hover:border-blue-500/30 transition-all duration-500 shadow-2xl"
        >
            <div className="flex flex-col md:flex-row gap-8">
                {/* 1. IMAGE DISPLAY (CJ ONLY) */}
                <div className="relative w-full md:w-48 h-48 shrink-0 rounded-[2rem] overflow-hidden bg-slate-900 border border-white/5">
                    <img 
                        src={image.startsWith('http') ? image : `https:${image}`} 
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300";
                            e.target.onerror = null;
                        }}
                    />
                    
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                        <Globe size={10} className="text-blue-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white">{cj.warehouse || "CN"}</span>
                    </div>
                </div>

                {/* 2. PRODUCT DATA (SCOPED) */}
                <div className="flex-1 flex flex-col justify-center py-2">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex-1 space-y-3">
                            <h3 className="text-xl font-bold text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
                                {name}
                            </h3>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-lg border border-white/5">
                                    <Package size={12} className="text-blue-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{variantsCount} VARIANTS</span>
                                </div>
                            </div>
                        </div>

                        {/* PROFIT ENGINE (SCOPED) */}
                        <div className="text-right shrink-0 bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 min-w-[180px]">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Profit Est.</div>
                            <div className={cn(
                                "text-2xl font-black tracking-tighter transition-all",
                                netProfit === null ? "text-slate-600" : (netProfit > 0 ? "text-emerald-400" : "text-rose-400")
                            )}>
                                {profitFormatted}
                            </div>
                        </div>
                    </div>

                    {/* 3. LOGISTICS SUMMARY (SCOPED) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-500">
                                <DollarSign size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">CJ Price</span>
                            </div>
                            <div className="text-sm font-bold text-white">
                                {price > 0 ? `$${price.toFixed(2)}` : "—"}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Truck size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Logistics</span>
                            </div>
                            <div className="text-sm font-bold text-blue-400">
                                {shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : "FREE"}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Delivery</div>
                            <div className="text-sm font-bold text-slate-300">{shipping.delivery}</div>
                        </div>

                        <div className="flex items-end justify-end">
                            <button 
                                onClick={() => onContinue(product)}
                                className="w-full py-4 bg-white hover:bg-blue-500 text-slate-950 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
                            >
                                Source Scoped <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SupplierResultRow;
