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
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import cjService from '../services/cj.service';
import { normalizeProduct } from '../services/cj.schema';

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
    const cjCost = parseFloat(selectedVariant?.price ?? selectedVariant?.variantSellPrice ?? cj.price ?? 0);
    const shipping = cj.shipping || { cost: 0, delivery: "7-15 Days", name: "Standard Shipping" };
    const netProfit = (targetPrice > 0 && cjCost > 0) ? (targetPrice - (cjCost + parseFloat(shipping.cost ?? 0))) : null;

    return (
        <div className="max-w-[1400px] mx-auto px-6 pb-40 pt-10 animate-in fade-in duration-700">
            {/* 1. NAVIGATION BAR */}
            <div className="flex items-center justify-between mb-12">
                <button onClick={() => navigate(-1)} className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 transition-all text-[11px] font-black uppercase tracking-widest shadow-sm group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Search Results
                </button>
                <div className="flex items-center gap-4">
                    <a 
                        href={`https://cjdropshipping.com/product-detail.html?id=${product?.id}`} 
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
                    <div className="bg-white border border-slate-200 rounded-[3.5rem] overflow-hidden shadow-sm relative group">
                        <img 
                            src={image.startsWith('http') ? image : `https:${image}`} 
                            alt="" 
                            className="w-full aspect-square object-contain p-12 bg-white group-hover:scale-105 transition-transform duration-700"
                        />
                        
                        {cj.images?.length > 1 && (
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
                                {cj.images.slice(0, 6).map((img, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setProduct(prev => ({ ...prev, cj: { ...prev.cj, image: img } }))}
                                        className="w-12 h-12 rounded-xl border border-white/20 overflow-hidden hover:scale-110 transition-all"
                                    >
                                        <img src={img.startsWith('http') ? img : `https:${img}`} className="w-full h-full object-cover" alt="" />
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
                                    onClick={() => setSelectedVariant(v)}
                                    className={cn(
                                        "p-5 rounded-3xl border-2 text-left transition-all duration-300 relative group/v",
                                        selectedVariant === v ? "border-slate-950 bg-slate-50 shadow-xl" : "border-slate-100 hover:border-slate-300 bg-white"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                                            {(v.variantImage || cj.image) && (
                                                <img src={v.variantImage || cj.image} className="w-full h-full object-cover" alt="" />
                                            )}
                                        </div>
                                        <span className="text-xs font-black text-slate-950">${parseFloat(v.price ?? v.variantSellPrice ?? v.sellPrice ?? 0).toFixed(2)}</span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-900 uppercase truncate mb-1">{v.variantKey || v.color || v.size || "STANDARD"}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate">SKU: {v.sku || v.variantSku || "N/A"}</p>
                                    
                                    {selectedVariant === v && (
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle2 size={14} className="text-indigo-500" />
                                        </div>
                                    )}
                                </button>
                            )) : (
                                <div className="col-span-2 py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                    <Box size={24} className="mx-auto mb-4 opacity-20" />
                                    No variants found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACTION FOOTER */}
                    <div className="pt-10">
                        <button className="w-full py-10 bg-slate-950 text-white rounded-[3rem] text-sm font-black uppercase tracking-[0.25em] flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Zap size={24} className="group-hover:animate-pulse text-yellow-400" /> Confirm & Push to eBay
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierProductDetail;
