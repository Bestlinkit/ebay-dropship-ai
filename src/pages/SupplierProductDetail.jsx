import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Truck, 
  Package, 
  Info, 
  DollarSign,
  Activity,
  Zap,
  Globe,
  Box,
  CheckCircle2,
  Sparkles,
  Trophy,
  Tag,
  Plus,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import cjService from '../services/cj.service';
import { normalizeProduct } from '../services/cj.schema';
import { optimizeListing } from '../services/aiOptimization.service';

/**
 * 🔍 CJ DEEP DETAIL ENGINE (v6.0 - Full Hydration)
 * Objective: Structured Descriptions. Accurate Variants. High-Stability.
 */
const SupplierProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const preFetched = location.state?.preFetchedProduct;
    const targetPrice = parseFloat(location.state?.targetPrice || 0);

    const [product, setProduct] = useState(normalizeProduct(preFetched, {}));
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState(null);

    // AI OPTIMIZATION STATE
    const [optimizedData, setOptimizedData] = useState(null);
    const [selectedTitle, setSelectedTitle] = useState(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationError, setOptimizationError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                // Ensure we use the latest normalization even for prefetched
                const enriched = await cjService.enrichSingleProduct(preFetched || { id });
                setProduct(enriched);
                
                const variants = enriched.cj?.variants || [];
                if (variants.length > 0) {
                    setSelectedVariant(variants[0]);
                }
            } catch (err) {
                console.error("Detail Hydration Fault:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    const cj = product?.cj || {};
    const image = cj.image || "https://via.placeholder.com/600";
    
    // Exhaustive price discovery for variants
    const vPrice = selectedVariant?.variantSellPrice || selectedVariant?.sellPrice || selectedVariant?.price || 0;
    const cjCost = parseFloat(vPrice || cj.price || 0);
    
    const shipping = cj.shipping || { cost: 0, delivery: "7-15 Days", name: "Standard Shipping" };
    const netProfit = (targetPrice > 0 && cjCost > 0) ? (targetPrice - (cjCost + parseFloat(shipping.cost ?? 0))) : null;

    // AI OPTIMIZATION LOGIC
    const handleOptimize = async () => {
        setIsOptimizing(true);
        setOptimizationError(null);
        
        const productSnapshot = {
            id: cj.id,
            title: cj.name || "Unnamed Product",
            description: cj.description || "",
            images: cj.images || [],
            variants: cj.variants || [],
            price: cj.price || 0,
        };

        try {
            const result = await optimizeListing(productSnapshot);
            
            // Safety: Ensure description is a string
            const safeResult = {
                ...result,
                description: typeof result.description === 'string' ? result.description : JSON.stringify(result.description)
            };

            setOptimizedData(safeResult);

            // Auto-select best title
            const best = [...result.titles].sort((a, b) => b.score - a.score)[0];
            setSelectedTitle(best?.text || cj.name);

        } catch (err) {
            console.error("AI Optimization Failed", err);
            setOptimizationError(err.message || "Optimization failed. Check if server is running.");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const newTag = e.target.value.trim();
            if (!optimizedData.tags.includes(newTag)) {
                setOptimizedData({
                    ...optimizedData,
                    tags: [...optimizedData.tags, newTag]
                });
            }
            e.target.value = '';
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setOptimizedData({
            ...optimizedData,
            tags: optimizedData.tags.filter(t => t !== tagToRemove)
        });
    };

    const handleProceedToPricing = () => {
        const productSnapshot = {
            id: cj.id,
            title: cj.name || "Unnamed Product",
            description: cj.description || "",
            images: cj.images || [],
            variants: cj.variants || [],
            price: cj.price || 0,
        };

        const finalListing = {
            original: productSnapshot,
            optimized: {
                title: selectedTitle,
                description: optimizedData.description,
                tags: optimizedData.tags
            }
        };

        console.log("🚀 FINAL LISTING PREPARED FOR PRICING:", finalListing);
        // navigate('/pricing', { state: { finalListing } });
    };

    return (
        <div className="max-w-[1400px] mx-auto px-6 pb-40 pt-10 animate-in fade-in duration-700">
            {/* 1. NAVIGATION BAR */}
            <div className="flex items-center justify-between mb-12">
                <button onClick={() => navigate(-1)} className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 transition-all text-[11px] font-black uppercase tracking-widest shadow-sm group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Search Results
                </button>
                <div className="flex items-center gap-4">
                    <a 
                        href={`https://cjdropshipping.com/product-detail.html?id=${cj.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-8 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-indigo-600 transition-colors"
                    >
                        <ExternalLink size={14} /> Open Supplier Portal
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* 2. MEDIA & DESCRIPTION (Phase 3 & 5) */}
                <div className="lg:col-span-7 space-y-10">
                    <div className="flex flex-col gap-8">
                        <div className="bg-white border border-slate-200 rounded-[3.5rem] overflow-hidden shadow-sm relative group">
                            <img 
                                src={image} 
                                alt="" 
                                referrerPolicy="no-referrer"
                                className="w-full aspect-square object-contain p-12 bg-white group-hover:scale-105 transition-transform duration-700"
                                onError={(e) => {
                                    if (!e.target.src.includes('placeholder') && !e.target.src.includes('aliyuncs')) {
                                        try {
                                            const path = new URL(image).pathname;
                                            e.target.src = `https://cc-west-usa.oss-accelerate.aliyuncs.com${path}`;
                                        } catch (err) {
                                            e.target.src = "https://via.placeholder.com/600?text=Image+Not+Found";
                                        }
                                    }
                                }}
                            />
                        </div>

                        {/* HIGH-END GALLERY SYSTEM */}
                        {cj.images?.length > 1 && (
                            <div className="grid grid-cols-5 gap-4">
                                {cj.images.map((img, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setProduct(prev => ({ ...prev, cj: { ...prev.cj, image: img } }))}
                                        className={cn(
                                            "aspect-square rounded-2xl border-2 overflow-hidden transition-all hover:scale-105",
                                            image === img ? "border-slate-950 shadow-lg scale-105" : "border-slate-100 opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img 
                                            src={img} 
                                            className="w-full h-full object-cover" 
                                            alt="" 
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                if (!e.target.src.includes('placeholder') && !e.target.src.includes('aliyuncs')) {
                                                    try {
                                                        const path = new URL(img).pathname;
                                                        e.target.src = `https://cc-west-usa.oss-accelerate.aliyuncs.com${path}`;
                                                    } catch (err) {
                                                        e.target.src = "https://via.placeholder.com/150?text=Error";
                                                    }
                                                }
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* PHASE 5: STRUCTURED DESCRIPTION */}
                    <div className="p-12 bg-slate-50 border border-slate-200 rounded-[3.5rem] space-y-12">
                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
                                    <Info size={16} className="text-indigo-500" /> Full Product Intelligence
                                </h4>
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">
                                    <CheckCircle2 size={12} /> Verified Description
                                </div>
                            </div>
                            
                            <div 
                                className="text-sm font-medium text-slate-600 leading-relaxed max-h-[800px] overflow-y-auto pr-6 custom-scrollbar description-render"
                                dangerouslySetInnerHTML={{ __html: cj.description || "Analysis pending for this product description." }}
                            />
                        </section>
                    </div>
                </div>

                {/* 3. CONFIGURATION PANEL (Phase 4) */}
                <div className="lg:col-span-5 space-y-10">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-tight uppercase">
                            {cj.name || "Hydrating Product..."}
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">REF: {cj.id}</p>
                    </div>

                    {/* PROFIT INTELLIGENCE CARD */}
                    <div className="p-10 bg-white border-2 border-slate-950 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                        
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-2">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Calculated Net Profit</p>
                                <p className={cn(
                                    "text-5xl font-black italic tracking-tighter",
                                    netProfit === null ? "text-slate-300" : (netProfit >= 0 ? "text-emerald-500" : "text-rose-500")
                                )}>
                                    {netProfit === null ? "CALCULATING..." : (netProfit < 0 ? `-$${Math.abs(netProfit).toFixed(2)}` : `+$${netProfit.toFixed(2)}`)}
                                </p>
                            </div>

                            <div className="h-[1px] bg-slate-100 w-full" />
                            
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sourcing (CJ)</p>
                                    <p className="text-xl font-black text-slate-950 italic">${cjCost.toFixed(2)}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logistics Fee</p>
                                    <p className="text-xl font-black text-slate-950 italic">
                                        ${parseFloat(shipping.cost ?? 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Truck size={16} className="text-indigo-500" /> {shipping.delivery}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Globe size={16} className="text-indigo-500" /> {cj.warehouse || "CN"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PHASE 4: INVENTORY MATRIX */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Inventory Matrix</h4>
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">{cj.variants?.length || 0} SKU AVAILABLE</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                            {cj.variants?.length > 0 ? cj.variants.map((v, i) => (
                                <button 
                                    key={i}
                                    onClick={() => {
                                        setSelectedVariant(v);
                                        if (v.variantImage) {
                                            setProduct(prev => ({ ...prev, cj: { ...prev.cj, image: v.variantImage } }));
                                        }
                                    }}
                                    className={cn(
                                        "p-6 rounded-3xl border-2 text-left transition-all duration-300 relative group/v",
                                        selectedVariant === v ? "border-slate-950 bg-slate-50 shadow-xl scale-[1.02] z-10" : "border-slate-100 hover:border-slate-300 bg-white"
                                    )}
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className="w-full aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                                            {(v.variantImage || cj.image) && (
                                                <img src={v.variantImage || cj.image} className="w-full h-full object-cover group-hover/v:scale-110 transition-transform duration-500" alt="" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[14px] font-black text-slate-950">${parseFloat(v.price ?? v.variantSellPrice ?? v.sellPrice ?? 0).toFixed(2)}</span>
                                                {selectedVariant === v && <CheckCircle2 size={16} className="text-indigo-500" />}
                                            </div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase truncate">{v.variantKey || v.variantName || v.variantStandard || v.color || v.size || "STANDARD"}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate opacity-60">SKU: {v.sku || v.variantSku || v.skuId || "N/A"}</p>
                                        </div>
                                    </div>
                                </button>
                            )) : (
                                <div className="col-span-2 py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                    <Box size={24} className="mx-auto mb-4 opacity-20" />
                                    No variants found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACTION FOOTER / AI OPTIMIZATION INTERFACE */}
                    <div className="pt-10 space-y-10">
                        {optimizationError && (
                            <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={20} />
                                <div className="flex-1 text-[11px] font-bold uppercase tracking-widest">{optimizationError}</div>
                                <button onClick={handleOptimize} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors">
                                    Retry
                                </button>
                            </div>
                        )}

                        {!optimizedData ? (
                            <button 
                                onClick={handleOptimize}
                                disabled={isOptimizing}
                                className="w-full py-10 bg-slate-950 text-white rounded-[3rem] text-sm font-black uppercase tracking-[0.25em] flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl group relative overflow-hidden disabled:opacity-50"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <Zap size={24} className={cn("group-hover:animate-pulse text-yellow-400", isOptimizing && "animate-spin")} /> 
                                {isOptimizing ? "Running AI Engine..." : "Confirm & Push to eBay"}
                            </button>
                        ) : (
                            <div className="p-10 bg-indigo-50 border-2 border-indigo-200 rounded-[3.5rem] space-y-10 animate-in slide-in-from-bottom duration-500">
                                <div className="flex items-center gap-4 text-indigo-600">
                                    <Sparkles size={24} />
                                    <h3 className="text-xl font-black uppercase tracking-tighter italic">AI Optimization Active</h3>
                                </div>

                                {/* TITLE SELECTION */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Trophy size={16} className="text-amber-500" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Optimized eBay Titles</p>
                                    </div>
                                    <div className="space-y-3">
                                        {optimizedData.titles.map((t, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => setSelectedTitle(t.text)}
                                                className={cn(
                                                    "w-full p-6 rounded-2xl border-2 text-left transition-all relative group/t",
                                                    selectedTitle === t.text ? "border-indigo-600 bg-white shadow-lg" : "border-indigo-100 bg-indigo-50/50 hover:border-indigo-300"
                                                )}
                                            >
                                                <div className="flex justify-between items-start gap-4">
                                                    <p className="text-[13px] font-bold text-slate-900 leading-snug">{t.text}</p>
                                                    <div className="shrink-0 px-2 py-1 bg-indigo-100 rounded-md text-[9px] font-black text-indigo-600 uppercase">
                                                        {t.score}% Match
                                                    </div>
                                                </div>
                                                {selectedTitle === t.text && (
                                                    <div className="absolute -right-2 -top-2 bg-indigo-600 text-white p-1 rounded-full border-2 border-white">
                                                        <CheckCircle2 size={12} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* DESCRIPTION EDITING */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Enhanced Description</p>
                                    <textarea
                                        value={optimizedData.description}
                                        onChange={(e) =>
                                            setOptimizedData({
                                                ...optimizedData,
                                                description: e.target.value
                                            })
                                        }
                                        className="w-full h-48 p-6 bg-white border-2 border-indigo-100 rounded-2xl text-xs font-medium text-slate-600 leading-relaxed focus:border-indigo-600 outline-none transition-all custom-scrollbar"
                                    />
                                </div>

                                {/* SEO TAGS */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">High-Intent SEO Tags</p>
                                        <span className="text-[9px] font-bold text-slate-400">{optimizedData.tags.length} TAGS</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {optimizedData.tags.map((tag, i) => (
                                            <span 
                                                key={i} 
                                                className="px-3 py-1.5 bg-white border border-indigo-100 rounded-full text-[10px] font-bold text-indigo-700 flex items-center gap-2 group/tag shadow-sm"
                                            >
                                                {tag}
                                                <button onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                        <input 
                                            placeholder="Add tag..."
                                            onKeyDown={handleAddTag}
                                            className="px-4 py-1.5 bg-transparent border-b border-indigo-200 outline-none text-[10px] font-black uppercase tracking-widest placeholder:text-indigo-300 w-24 focus:w-32 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* NEXT STAGE TRIGGER */}
                                <button 
                                    onClick={handleProceedToPricing}
                                    className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                                >
                                    Proceed to Pricing & Logistics <ArrowRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierProductDetail;
