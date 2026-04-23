import React, { useState, useEffect, useMemo } from 'react';
import cjService from '../../services/cj.service';
import { normalizeProduct } from '../../services/cj.schema';
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
  Globe,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Supplier Discovery Row - CJ Dropshipping Edition (v2.0 - Practical Mode)
 * Mandate: No "Fetching..." loops, Stable Images, Decoupled Profit.
 */
const SupplierResultRow = ({ product: rawProduct, targetPrice: rawTargetPrice, onContinue }) => {
    
    // Phase 1 & 8: SAFE NORMALIZATION
    const product = useMemo(() => normalizeProduct(rawProduct), [rawProduct]);
    
    // Numeric Safety (Phase 5)
    const targetPrice = parseFloat(rawTargetPrice || 0);
    const cjCost = parseFloat(product?.cjCost || 0);
    
    // 🚚 PHASE 4: SHIPPING (USA LOCK)
    const [shipping, setShipping] = useState(product?.shipping || { cost: 0, method: "Unavailable", deliveryTime: "N/A", status: "fallback" });
    const [loadingShipping, setLoadingShipping] = useState(false);

    useEffect(() => {
        const resolveShipping = async () => {
            // Rule: Only call freight API if detail data is missing
            if (product?.shipping?.status === "resolved" && product?.shipping?.method !== "Unavailable") {
                return;
            }

            setLoadingShipping(true);
            try {
                // Rule 2: USA LOCK
                const warehouseId = product?.variants?.[0]?.warehouseId || "CN";
                const { methods } = await cjService.getShippingOptions(product?.id, 'US', warehouseId, 1);
                
                if (methods && methods.length > 0) {
                    // Rule 1: FIRST valid method
                    setShipping({
                        cost: parseFloat(methods[0].cost || 0),
                        method: methods[0].name,
                        deliveryTime: methods[0].deliveryTime,
                        status: "resolved"
                    });
                }
            } catch (err) {
                console.error("Shipping resolution failed", err);
            } finally {
                setLoadingShipping(false);
            }
        };

        resolveShipping();
    }, [product?.id]);

    // 💰 PHASE 5: PROFIT ENGINE (DECOUPLED)
    const shippingCost = parseFloat(shipping?.cost || 0);
    const hasShipping = shipping?.status === "resolved";
    const netProfit = hasShipping ? (targetPrice - (cjCost + shippingCost)) : (targetPrice - cjCost);
    
    const profitFormatted = netProfit < 0 ? `-$${Math.abs(netProfit).toFixed(2)}` : `+$${netProfit.toFixed(2)}`;
    const profitStatusLabel = hasShipping ? "" : " (est. before shipping)";

    // 🖼️ PHASE 3: IMAGE STABILITY (Main image independent of variants)
    const mainImage = product?.images?.[0] || "/placeholder.png";
    const [imgError, setImgError] = useState(false);

    // 🧾 PHASE 6: DESCRIPTION LOCK (Product-level only)
    const description = product?.description || "";

    const colors = Array.from(new Set((product?.variants || []).map(v => v.color))).filter(c => c && c !== 'Standard');

    const getProfitColor = (val) => {
        if (typeof val !== 'number') return "text-slate-400";
        if (val > 10) return "text-emerald-400";
        if (val > 0) return "text-emerald-500/80";
        return "text-rose-400";
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-[#0B1121] border border-white/5 rounded-[2.5rem] p-6 hover:border-blue-500/30 transition-all duration-500 shadow-2xl"
        >
            <div className="flex flex-col md:flex-row gap-8">
                {/* 1. PRODUCT MEDIA — Image Stability (Phase 3) */}
                <div className="relative w-full md:w-56 h-56 shrink-0 rounded-[2rem] overflow-hidden bg-slate-900 border border-white/5 group-hover:border-blue-500/20 transition-colors">
                    {!imgError ? (
                        <img 
                            src={mainImage} 
                            alt={product?.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500 gap-2">
                            <Box size={24} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Image Unavailable</span>
                        </div>
                    )}
                    
                    {/* Hard Origin Mapping (Phase 6) */}
                    <div className="absolute top-4 left-4 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                        <Globe size={10} className="text-blue-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">{product?.origin}</span>
                    </div>

                    <div className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 rounded-full text-[9px] font-black text-white shadow-xl">
                        {(product?.variants?.length || 0)} VARIANTS
                    </div>
                </div>

                {/* 2. CORE INTELLIGENCE & PROFIT (Phase 5) */}
                <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
                                    {product?.title}
                                </h3>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/50 rounded-lg border border-white/5">
                                        <Box size={12} className="text-slate-500" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ID: {product?.id}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/50 rounded-lg border border-white/5">
                                        <Warehouse size={12} className="text-slate-500" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{product?.warehouse}</span>
                                    </div>
                                    {colors.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            {colors.slice(0, 3).map((c, idx) => (
                                                <div key={idx} className="w-2.5 h-2.5 rounded-full border border-white/10 bg-slate-800" title={c} />
                                            ))}
                                            {colors.length > 3 && <span className="text-[9px] font-bold text-slate-600">+{colors.length - 3}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Profit Est.</div>
                                <div className={cn("text-2xl font-black tracking-tighter transition-all", getProfitColor(netProfit))}>
                                    {profitFormatted}
                                </div>
                                <div className="text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-widest">
                                    {profitStatusLabel}
                                </div>
                            </div>
                        </div>

                        {/* Description Lock (Phase 6) */}
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-6 font-medium">
                            {description.replace(/<[^>]*>/g, '') || "Premium supplier product candidate with verified logistics."}
                        </p>
                    </div>

                    {/* 3. LOGISTICS BAR — Phase 4 Stable View */}
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
                            <div className="flex items-center gap-2">
                                {loadingShipping ? (
                                    <div className="flex items-center gap-2">
                                        <RefreshCw size={10} className="animate-spin text-blue-500" />
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Resolving...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-blue-400">
                                            {shipping?.cost > 0 ? `$${shipping.cost.toFixed(2)}` : "FREE"}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-500 truncate max-w-[80px]">
                                            {shipping?.method}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Clock size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Est. Delivery</span>
                            </div>
                            <div className="text-sm font-bold text-slate-300">{shipping?.deliveryTime}</div>
                        </div>

                        <div className="flex items-end justify-end">
                            <button 
                                onClick={() => onContinue(product)}
                                className="w-full py-3 bg-white hover:bg-blue-500 text-slate-950 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg shadow-white/5 flex items-center justify-center gap-2"
                            >
                                Select Supplier <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SupplierResultRow;
