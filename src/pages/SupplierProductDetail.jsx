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
  X,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import cjService from '../services/cj.service';
import { normalizeProduct } from '../services/cj.schema';

/**
 * 🔍 CJ DEEP DETAIL ENGINE (v7.0 - Sourcing Only)
 * Objective: Fetch products, map data, display product, allow selection.
 * NO AI in this flow.
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
    
    const vPrice = selectedVariant?.variantSellPrice || selectedVariant?.sellPrice || selectedVariant?.price || 0;
    const cjCost = parseFloat(vPrice || cj.price || 0);
    
    const shipping = cj.shipping || { cost: 0, delivery: "7-15 Days", name: "Standard Shipping" };
    const netProfit = (targetPrice > 0 && cjCost > 0) ? (targetPrice - (cjCost + parseFloat(shipping.cost ?? 0))) : null;

    /**
     * 🚀 TRIGGER EBAY LISTING BUILDER
     * Moves to the next stage with the normalized CJ data.
     */
    const handleConfirmAndPush = () => {
        // DATA CONTRACT: id, title, description, images[], variants[], price, shipping
        const normalizedPushData = {
            id: cj.id,
            title: cj.nameEn || cj.name || "Unnamed Product",
            description: cj.description || "",
            images: cj.images || [],
            variants: cj.variants || [],
            price: cjCost,
            shipping: shipping
        };

        navigate(`/ebay-builder/${cj.id}`, { 
            state: { 
                product: normalizedPushData,
                targetPrice 
            } 
        });
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                <RefreshCw size={40} className="animate-spin text-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Hydrating Product Intelligence...</p>
            </div>
        );
    }

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
                {/* 2. MEDIA & DESCRIPTION */}
                <div className="lg:col-span-7 space-y-10">
                    <div className="flex flex-col gap-8">
                        <div className="bg-white border border-slate-200 rounded-[3.5rem] overflow-hidden shadow-sm relative group">
                            <img 
                                src={image} 
                                alt="" 
                                referrerPolicy="no-referrer"
                                className="w-full aspect-square object-contain p-12 bg-white group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>

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
                                        <img src={img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-12 bg-slate-50 border border-slate-200 rounded-[3.5rem] space-y-12">
                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
                                    <Info size={16} className="text-indigo-500" /> Full Product Intelligence
                                </h4>
                            </div>
                            <div 
                                className="text-sm font-medium text-slate-600 leading-relaxed max-h-[800px] overflow-y-auto pr-6 custom-scrollbar description-render"
                                dangerouslySetInnerHTML={{ __html: cj.description || "Analysis pending..." }}
                            />
                        </section>
                    </div>
                </div>

                {/* 3. CONFIGURATION PANEL */}
                <div className="lg:col-span-5 space-y-10">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-tight uppercase">
                            {cj.name || "Hydrating..."}
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">REF: {cj.id}</p>
                    </div>

                    <div className="p-10 bg-white border-2 border-slate-950 rounded-[3rem] shadow-2xl relative overflow-hidden group">
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

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sourcing (CJ)</p>
                                    <p className="text-xl font-black text-slate-950 italic">${cjCost.toFixed(2)}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logistics Fee</p>
                                    <p className="text-xl font-black text-slate-950 italic">${parseFloat(shipping.cost ?? 0).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Inventory Matrix</h4>
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">{cj.variants?.length || 0} SKU</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                            {cj.variants?.map((v, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setSelectedVariant(v)}
                                    className={cn(
                                        "p-6 rounded-3xl border-2 text-left transition-all",
                                        selectedVariant === v ? "border-slate-950 bg-slate-50 shadow-xl" : "border-slate-100 hover:border-slate-300 bg-white"
                                    )}
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className="w-full aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                                            <img src={v.variantImage || cj.image} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[14px] font-black text-slate-950">${parseFloat(v.price || 0).toFixed(2)}</span>
                                            <p className="text-[10px] font-black text-slate-900 uppercase truncate">{v.variantKey || "STANDARD"}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleConfirmAndPush}
                        className="w-full py-10 bg-slate-950 text-white rounded-[3rem] text-sm font-black uppercase tracking-[0.25em] flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl"
                    >
                        Confirm & Push to eBay <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupplierProductDetail;
