import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  Package, 
  Truck, 
  DollarSign, 
  Star,
  Zap,
  Tag,
  Info,
  Layers,
  Activity,
  ChevronRight,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

/**
 * Product Import Preview Page (v1.0)
 * Premium review layer for decision-grade sourcing.
 */
const ProductImportPreview = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const product = location.state?.product;

    if (!product) {
        return (
            <div className="p-20 text-center space-y-6">
                <p className="text-slate-500 uppercase tracking-widest font-black text-xs">No active extraction detected.</p>
                <button onClick={() => navigate('/discovery')} className="px-8 py-4 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    Return to Discovery
                </button>
            </div>
        );
    }

    const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0] || {});
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // 💰 REAL-TIME ROI RECALCULATION
    const roiMetrics = useMemo(() => {
        const cost = (selectedVariant.price || 0) + (product.shipping?.cost || 0);
        const targetPrice = product.pricing?.basePrice || 0;
        
        const profit = targetPrice - cost - (targetPrice * 0.12) - 0.30; // 12% eBay fee + $0.30 fixed
        const margin = targetPrice > 0 ? (profit / targetPrice) * 100 : 0;

        return {
            profit: typeof profit === 'number' ? profit.toFixed(2) : '0.00',
            margin: typeof margin === 'number' ? Math.round(margin) : 0,
            cost: typeof cost === 'number' ? cost.toFixed(2) : '0.00'
        };
    }, [selectedVariant, product]);

    const handleConfirmImport = () => {
        // Enforce Structured Storage Format (Production Vector)
        const finalProductVector = {
            title: product.title,
            description: product.description,
            images: product.images,
            variants: product.variants,
            selectedVariant: selectedVariant,
            pricing: {
                ...product.pricing,
                selectedVariantPrice: selectedVariant.price,
                totalCost: parseFloat(roiMetrics.cost),
                profit: parseFloat(roiMetrics.profit),
                margin: roiMetrics.margin
            },
            shipping: product.shipping,
            sourcePlatform: product.sourcePlatform,
            sourceId: product.sourceId,
            importedAt: new Date().toISOString()
        };

        console.log("[IMPORT] Handing off vector to Optimization Studio:", finalProductVector);
        toast.success(`Product vector stabilized. Transitioning to Neural Studio.`);
        
        // 🚀 NAVIGATION REDIRECT: Preview -> Optimization
        navigate('/optimize-product/new', { 
            state: { 
                importedProduct: finalProductVector 
            } 
        });
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 pb-40 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 🧭 HEADER & SOURCE LABELS */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all bg-slate-900/50">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={12} /> Live Supplier Data
                             </span>
                             <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                Source: {product.sourcePlatform}
                             </span>
                        </div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Review Import.</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
                            Source ID (SKU): <span className="text-white">{product.sourceId}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleConfirmImport}
                        className="px-12 py-5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 shadow-2xl"
                    >
                        Continue to Optimization <Sparkles size={16} className="text-emerald-500" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* 🖼️ VISUAL CORE (40%) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="aspect-square bg-slate-900/50 border border-slate-800 rounded-[3rem] overflow-hidden group relative">
                        <img 
                            src={product.images && product.images[activeImageIndex]} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                            alt="" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                        
                        {/* Navigation Arrows */}
                        {product.images?.length > 1 && (
                            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => setActiveImageIndex(i => (i > 0 ? i - 1 : product.images.length - 1))}
                                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button 
                                    onClick={() => setActiveImageIndex(i => (i < product.images.length - 1 ? i + 1 : 0))}
                                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        {product.images?.map((img, i) => (
                            <button 
                                key={i}
                                onClick={() => setActiveImageIndex(i)}
                                className={cn(
                                    "w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all",
                                    activeImageIndex === i ? "border-emerald-500 scale-105" : "border-slate-800 opacity-50 hover:opacity-100"
                                )}
                            >
                                <img src={img} className="w-full h-full object-cover" alt="" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* 📊 PRODUCT INTELLIGENCE (60%) */}
                <div className="lg:col-span-7 space-y-10">
                    
                    {/* TITLE & PRICE */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-tight">
                            {product.title}
                        </h2>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em]">Market Target</span>
                                <span className="text-3xl font-black text-white italic tracking-tighter">
                                    {typeof (product.pricing?.basePrice || 0) === 'number' ? `$${(product.pricing?.basePrice || 0).toFixed(2)}` : '$0.00'}
                                </span>
                            </div>
                            <div className="h-10 w-px bg-slate-800" />
                            <div className="flex flex-col">
                                <span className="text-[7px] font-black text-emerald-600 uppercase tracking-[0.3em]">Estimated Profit</span>
                                <span className="text-3xl font-black text-emerald-500 italic tracking-tighter">${roiMetrics.profit}</span>
                            </div>
                            <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <span className="text-xs font-black text-emerald-500 italic">{roiMetrics.margin}% ROI</span>
                            </div>
                        </div>
                    </div>

                    {/* DATA CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#111C33] border border-[#2A3A55] p-6 rounded-[2.5rem] space-y-4">
                            <div className="flex items-center gap-3 text-blue-400">
                                <Package size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Pricing Matrix</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-500">Selected Variant Cost</span>
                                    <span className="text-white font-black">
                                        {typeof selectedVariant.price === 'number' ? `$${selectedVariant.price.toFixed(2)}` : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-500">Shipping Mode Cost</span>
                                    <span className="text-white font-black">
                                        {typeof product.shipping?.cost === 'number' ? `$${product.shipping.cost.toFixed(2)}` : 'FREE'}
                                    </span>
                                </div>
                                <div className="h-px bg-slate-800 my-2" />
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-400 font-bold">Total Acquisition Cost</span>
                                    <span className="text-white font-black">${roiMetrics.cost}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#111C33] border border-[#2A3A55] p-6 rounded-[2.5rem] space-y-4">
                            <div className="flex items-center gap-3 text-orange-400">
                                <Truck size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Logistics Chain</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white font-black tracking-tighter uppercase">{product.shipping?.estimate}</p>
                                        <p className="text-[8px] text-slate-500 font-black uppercase">{product.shipping?.method}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
                                    <Info size={12} className="text-slate-500" />
                                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Global Fulfillment Optimized</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VARIANT SELECTOR */}
                    {product.variants?.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                <Layers size={18} className="text-slate-500" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Select Configuration ({product.variants.length})</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {product.variants.map((variant) => (
                                    <button
                                        key={variant.id}
                                        onClick={() => setSelectedVariant(variant)}
                                        className={cn(
                                            "p-4 rounded-2xl border transition-all text-left space-y-1 relative group overflow-hidden",
                                            selectedVariant.id === variant.id 
                                                ? "bg-white border-white text-slate-950 shadow-2xl shadow-emerald-500/20" 
                                                : "bg-slate-900/40 backdrop-blur-md border-slate-800 text-white hover:border-slate-600"
                                        )}
                                    >
                                        {/* Pulse Effect for selected variant */}
                                        {selectedVariant.id === variant.id && (
                                            <motion.div 
                                                layoutId="pulse"
                                                className="absolute inset-0 bg-emerald-500/5 animate-pulse" 
                                            />
                                        )}
                                        <p className="text-[9px] font-black uppercase tracking-tighter line-clamp-1 relative z-10">{variant.title}</p>
                                        <p className={cn(
                                            "text-xs font-black italic relative z-10",
                                            selectedVariant.id === variant.id ? "text-slate-950" : "text-emerald-500"
                                        )}>${(variant.price || 0).toFixed(2)}</p>
                                        
                                        {selectedVariant.id === variant.id && (
                                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white scale-110 shadow-lg relative z-20">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DESCRIPTION PREVIEW */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                             <Zap size={18} className="text-slate-500" />
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Extracted Description</h3>
                        </div>
                        <div className="bg-slate-900/30 p-8 rounded-[3rem] border border-slate-800/50">
                             <div 
                                className="text-slate-400 text-sm leading-relaxed prose prose-invert max-w-none prose-p:text-slate-400 prose-headings:text-white"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                             />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProductImportPreview;
