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
    const shippingOrigin = intel?.shipping?.origin || "GLOBAL";
    const deliveryTime = intel?.shipping?.delivery_estimate || "NO API DATA";
    const shippingLabel = financials?.shipping_label || "UNAVAILABLE";
    const profitStatus = financials?.status || "PENDING";
    const marginSignal = financials?.margin_signal || "Low Profit";

    const profit = financials?.net_profit;

    const profitFormatted = typeof profit === 'number'
        ? (profit < 0 ? `-$${Math.abs(profit).toFixed(2)}` : `+$${profit.toFixed(2)}`)
        : "N/A";

    const colors = Array.from(new Set((product.variants || []).map(v => v.color))).filter(c => c && c !== 'Standard');

    // Score Color Mapping (v5.0 Mandate)
    const getScoreColor = (val) => {
        if (val >= 80) return "text-emerald-400";
        if (val >= 60) return "text-amber-400";
        return "text-slate-400";
    };

    const getProfitColor = (val) => {
        if (typeof val !== 'number') return "text-slate-400";
        if (val > 10) return "text-emerald-400";
        if (val > 0) return "text-emerald-500/80";
        return "text-rose-400";
    };

    const [imgError, setImgError] = React.useState(false);
    const [retryCount, setRetryCount] = React.useState(0);
    const [currentImgIndex, setCurrentImgIndex] = React.useState(0);

    const images = product.gallery || [product.mainImage];

    const handleImgError = () => {
        if (retryCount < 1) {
            setRetryCount(prev => prev + 1);
            // Simulating a retry by refreshing src or just letting it render again
        } else {
            setImgError(true);
        }
    };

    return (
        <motion.div 
            whileHover={{ y: -2, scale: 1.005 }}
            className="group relative bg-[#020617] border border-white/5 p-8 rounded-[3.5rem] flex flex-col xl:flex-row items-center gap-10 transition-all shadow-2xl overflow-hidden"
        >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* PRODUCT VISUAL (v12.1 Discovery-First + Carousel) */}
            <div className="w-40 h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 bg-white rounded-[2rem] flex items-center justify-center overflow-hidden border-2 border-white/5 shrink-0 shadow-2xl relative group-hover:border-indigo-500/30 transition-all p-2">
                {!imgError && images[currentImgIndex] ? (
                    <img 
                        src={images[currentImgIndex]} 
                        alt={product.title} 
                        onError={handleImgError}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20 text-slate-900">
                        <Box size={32} />
                        <span className="text-[7px] font-black uppercase tracking-widest">ASSET PENDING</span>
                    </div>
                )}
                
                {images.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)); }}
                            className="w-8 h-8 rounded-full bg-slate-950/80 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors"
                        >
                            <ChevronRight size={14} className="rotate-180" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)); }}
                            className="w-8 h-8 rounded-full bg-slate-950/80 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                {images.length > 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-indigo-600 rounded-lg shadow-lg border border-white/10 flex items-center gap-1.5">
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">{currentImgIndex + 1}/{images.length}</span>
                    </div>
                )}
                
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/90 rounded-lg shadow-lg border border-white/5 font-mono">
                    <span className="text-[7px] font-black text-white/50 uppercase tracking-[0.2em]">{product.product_id}</span>
                </div>
            </div>

            {/* DATA CORE */}
            <div className="flex-1 min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 border border-white/5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                        <Globe size={10} /> ORIGIN: {shippingOrigin}
                    </span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 border border-white/5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                         <Box size={10} /> STOCK: {stock}
                    </span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <Activity size={10} className="text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                            Sellability: {intel?.financials?.sellability_score || 0}
                        </span>
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter line-clamp-1 leading-none group-hover:text-indigo-400 transition-colors italic pr-12">
                        {product.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {product.variants?.length > 0 ? (
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-400 rounded-md text-[7px] font-black uppercase tracking-widest">
                                    {product.variants.length} Variants
                                </span>
                                {colors.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        {colors.slice(0, 6).map(c => (
                                            <div 
                                                key={c} 
                                                title={c}
                                                className="w-3 h-3 rounded-full border border-white/20 bg-slate-700 shadow-sm transition-transform hover:scale-125"
                                            />
                                        ))}
                                        {colors.length > 6 && <span className="text-[7px] font-black text-slate-500">+{colors.length - 6}</span>}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded-md text-[7px] font-black uppercase tracking-widest">
                                Standard Variant
                            </span>
                        )}
                        {product.isEnriched && (
                            <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 rounded-md text-[7px] font-black uppercase tracking-widest flex items-center gap-1">
                                <ShieldCheck size={8} /> Detail Verified
                            </span>
                        )}
                    </div>
                </div>

                {/* KPI SECTION (v7.0 Strict Market Decision Engine) */}
                <div className="flex flex-wrap items-start gap-y-6 gap-x-12 pt-6 border-t border-white/5">
                    <div className="flex flex-col gap-1 min-w-[100px]">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic whitespace-nowrap">Net Profit ($)</span>
                        <div className={cn("text-2xl md:text-3xl font-black italic tracking-tighter whitespace-nowrap tabular-nums font-mono leading-none py-1", getProfitColor(profit))}>
                            {profit === null ? "UNAVAILABLE" : profitFormatted}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Zap size={10} className={cn(profit !== null && profit > 0 ? "text-emerald-500" : "text-slate-500")} />
                            <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.15em] whitespace-nowrap">
                                {profit === null ? "PENDING SHIPPING" : marginSignal.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic whitespace-nowrap">CJ Cost</span>
                        <div className="text-xl md:text-2xl font-black text-white italic tracking-tighter whitespace-nowrap tabular-nums font-mono leading-none py-1">
                            ${parseFloat(product.price).toFixed(2)}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic whitespace-nowrap">eBay Price</span>
                        <div className="text-xl md:text-2xl font-black text-slate-400 italic tracking-tighter whitespace-nowrap tabular-nums font-mono leading-none py-1">
                            ${parseFloat(targetPrice).toFixed(2)}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 min-w-[130px]">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic whitespace-nowrap">Target Logistics</span>
                        <div className="flex items-center gap-2 py-0.5">
                            <Truck size={12} className="text-indigo-400 shrink-0" />
                            <span className="text-[10px] font-black text-slate-200 uppercase tracking-tight whitespace-nowrap">{deliveryTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">SHIP: {shippingLabel}</span>
                            <span className={cn("px-1 py-0.5 rounded text-[6px] font-black", intel.shipping?.isReal ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500")}>
                                {intel.shipping?.isReal ? 'REAL' : 'FALLBACK'}
                            </span>
                        </div>
                    </div>

                    <div className="hidden lg:flex flex-col gap-1 min-w-[120px]">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic whitespace-nowrap">Shipping From</span>
                        <div className="text-xl md:text-2xl font-black text-indigo-400 italic tracking-tighter whitespace-nowrap leading-none flex items-center gap-2 py-0.5">
                            <Warehouse size={16} /> {shippingOrigin}
                        </div>
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.15em] whitespace-nowrap opacity-80 mt-0.5">
                            {product.warehouse || 'GLOBAL API DATA'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ACTION ZONE */}
            <div className="flex items-center gap-6 shrink-0 border-t xl:border-t-0 xl:border-l border-white/5 pt-8 xl:pt-0 xl:pl-10 w-full xl:w-auto justify-between xl:justify-end">
                <a 
                    href={product.cj_url || `https://cjdropshipping.com/product-detail.html?id=${product.product_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                    <ExternalLink size={20} />
                    <span className="text-[8px] font-black uppercase tracking-widest">View on CJ</span>
                </a>

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
