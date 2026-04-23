import React from 'react';
import { 
  ChevronRight, 
  Truck, 
  Box, 
  Globe,
  DollarSign
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Supplier Discovery Row - CJ Dropshipping Edition (v3.0 - STABLE FIX)
 * Objective: ZERO "Fetching" loops. Immediate visibility.
 */
const SupplierResultRow = ({ product, targetPrice, onContinue }) => {
    
    // Phase 4: FORCE SAFE RENDER
    const image = product?.images?.[0] || "https://via.placeholder.com/300";
    const variants = product?.variants?.length || 0;
    const shipping = product?.shipping || { cost: 0, delivery: "7-15 Days", name: "Standard Shipping" };
    
    const cjCost = parseFloat(product?.cjCost || 0);
    const ebayPrice = parseFloat(targetPrice || 0);
    const shippingCost = parseFloat(shipping.cost || 0);
    
    // Profit Logic: price - (cjCost + shippingCost)
    const netProfit = ebayPrice - (cjCost + shippingCost);
    const profitFormatted = netProfit < 0 ? `-$${Math.abs(netProfit).toFixed(2)}` : `+$${netProfit.toFixed(2)}`;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-[#0B1121] border border-white/5 rounded-[2.5rem] p-6 hover:border-blue-500/30 transition-all duration-500 shadow-2xl"
        >
            <div className="flex flex-col md:flex-row gap-8">
                {/* 1. IMAGE DISPLAY */}
                <div className="relative w-full md:w-56 h-56 shrink-0 rounded-[2rem] overflow-hidden bg-slate-900 border border-white/5">
                    <img 
                        src={image} 
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    <div className="absolute top-4 left-4 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                        <Globe size={10} className="text-blue-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">{product?.origin || "CN"}</span>
                    </div>

                    <div className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 rounded-full text-[9px] font-black text-white shadow-xl">
                        {variants} VARIANTS
                    </div>
                </div>

                {/* 2. CORE INFO */}
                <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
                                    {product?.title}
                                </h3>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/50 rounded-lg border border-white/5">
                                        <Box size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ID: {product?.id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Profit Est.</div>
                                <div className={cn(
                                    "text-2xl font-black tracking-tighter transition-all",
                                    netProfit > 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {profitFormatted}
                                </div>
                                <div className="text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-widest">
                                    (est. before shipping)
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-6 font-medium">
                            {product?.description?.replace(/<[^>]*>/g, '') || "No description available."}
                        </p>
                    </div>

                    {/* 3. LOGISTICS BAR */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-600">
                                <DollarSign size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Unit Cost</span>
                            </div>
                            <div className="text-sm font-bold text-white">${cjCost.toFixed(2)}</div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Truck size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Shipping</span>
                            </div>
                            <div className="text-sm font-bold text-blue-400">
                                {shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : "FREE"}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Delivery</div>
                            <div className="text-sm font-bold text-slate-300">{shipping.delivery}</div>
                        </div>

                        <div className="flex items-end justify-end">
                            <button 
                                onClick={() => onContinue(product)}
                                className="w-full py-3 bg-white hover:bg-blue-500 text-slate-950 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
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
