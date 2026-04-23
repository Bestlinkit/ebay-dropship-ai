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
 * Supplier Discovery Row - CJ Dropshipping Edition (v8.0 - Mapping Lock)
 * Objective: No Descriptions. Perfect Mapping. Zero Crash.
 */
const SupplierResultRow = ({ product, targetPrice, onContinue }) => {
    
    // Core Data Extraction (Rule 8: Failsafe Guard)
    const title = String(product?.title || "Unnamed Product");
    const image = (product?.images?.length > 0) ? product.images[0] : "https://via.placeholder.com/300";
    const variantsCount = Number(product?.variantCount || 0);
    
    const cjCost = parseFloat(product?.cjCost ?? 0);
    const ebayPrice = parseFloat(targetPrice || 0);
    const shippingCost = parseFloat(product?.shippingCost || 0);
    
    // Profit Logic
    const netProfit = (ebayPrice > 0 && cjCost > 0) ? (ebayPrice - (cjCost + shippingCost)) : null;
    const profitFormatted = netProfit !== null ? (netProfit < 0 ? `-$${Math.abs(netProfit).toFixed(2)}` : `+$${netProfit.toFixed(2)}`) : "N/A";

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-[#0B1121] border border-white/5 rounded-[2.5rem] p-6 hover:border-blue-500/30 transition-all duration-500 shadow-2xl"
        >
            <div className="flex flex-col md:flex-row gap-8">
                {/* 1. IMAGE DISPLAY */}
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
                        <span className="text-[8px] font-black uppercase tracking-widest text-white">{product?.warehouse || "CN"}</span>
                    </div>
                </div>

                {/* 2. PRODUCT DATA (Rule 6: No Descriptions) */}
                <div className="flex-1 flex flex-col justify-center py-2">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex-1 space-y-3">
                            <h3 className="text-xl font-bold text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
                                {title}
                            </h3>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-lg border border-white/5">
                                    <Package size={12} className="text-blue-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{variantsCount} VARIANTS</span>
                                </div>
                            </div>
                        </div>

                        {/* PROFIT ENGINE */}
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

                    {/* 3. LOGISTICS SUMMARY */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-500">
                                <DollarSign size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Sourcing</span>
                            </div>
                            <div className="text-sm font-bold text-white">
                                {cjCost > 0 ? `$${cjCost.toFixed(2)}` : "—"}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Truck size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Shipping</span>
                            </div>
                            <div className="text-sm font-bold text-blue-400">
                                {shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : "FREE"}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Delivery</div>
                            <div className="text-sm font-bold text-slate-300">{product?.deliveryTime || "7-15 Days"}</div>
                        </div>

                        <div className="flex items-end justify-end">
                            <button 
                                onClick={() => onContinue(product)}
                                className="w-full py-4 bg-white hover:bg-blue-500 text-slate-950 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
                            >
                                Select <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SupplierResultRow;
