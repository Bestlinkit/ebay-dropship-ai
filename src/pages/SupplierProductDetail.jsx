import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  ShieldCheck, 
  Star, 
  Truck, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Info, 
  Lock, 
  Layers, 
  Target,
  DollarSign,
  Activity,
  RefreshCw,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import cjService from '../services/cj.service';

/**
 * 🔍 CJ DEEP DETAIL ENGINE (v4.7 - Profit First)
 */
const SupplierProductDetail = () => {
    const { source, id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Context from previous search (v4.7 Sync)
    const targetProduct = location.state?.targetProduct;
    const targetPrice = Number(location.state?.targetPrice || 0);
    const sellData = location.state?.sellData;

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    
    // v13.0 Shipping Options State
    const [shippingOptions, setShippingOptions] = useState([]);
    const [selectedShipping, setSelectedShipping] = useState(null);
    const [shippingLoading, setShippingLoading] = useState(false);

    useEffect(() => {
        const fetchDeepDetails = async () => {
            setLoading(true);
            try {
                // 1. Initial State Consumption (Search results)
                let initialProduct = location.state?.preFetchedProduct;
                if (!initialProduct && targetProduct) {
                    initialProduct = targetProduct;
                }
                
                if (initialProduct) {
                    setProduct(initialProduct);
                    if (initialProduct.variants?.length > 0) setSelectedVariant(initialProduct.variants[0]);
                }

                // 2. MANDATORY DEEP SYNC (v14.7 - Intelligence Preservation)
                const enriched = await cjService.enrichSingleProduct(id, targetProduct);
                if (enriched) {
                    setProduct(enriched);
                    // Update variant if none selected or if matching search result
                    if (enriched.variants?.length > 0 && (!selectedVariant || enriched.variants.length > (initialProduct?.variants?.length || 0))) {
                        setSelectedVariant(enriched.variants[0]);
                    }
                }

            } catch (error) {
                console.error("Deep Enrichment Fault:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDeepDetails();
    }, [id]); // Only re-run when ID changes

    /**
     * v14.7 VARIANT-LEVEL LOGISTICS ENGINE
     * Triggers whenever SKU or Warehouse changes.
     */
    useEffect(() => {
        const fetchLogistics = async () => {
            const currentSku = selectedVariant?.sku || product?.sku;
            if (!currentSku) return;

            setShippingLoading(true);
            try {
                const { methods, status } = await cjService.getShippingOptions(
                    currentSku, 
                    'US', 
                    selectedVariant?.warehouseId || product?.warehouseId, 
                    1
                );
                setShippingOptions(methods);
                
                // 🧠 v14.13: Explicit status handling for zero-cost routing
                if (methods.length > 0) {
                    setSelectedShipping(methods[0]);
                } else {
                    setSelectedShipping(null);
                }
            } catch (err) {
                console.error("Logistics Failure:", err);
            } finally {
                setShippingLoading(false);
            }
        };

        if (product) fetchLogistics();
    }, [selectedVariant?.sku, product?.product_id]);

    // v13.0 Gallery Sync Effect
    useEffect(() => {
        if (selectedVariant?.image && product?.gallery) {
            const index = product.gallery.indexOf(selectedVariant.image);
            if (index !== -1) setActiveImage(index);
        }
    }, [selectedVariant, product?.gallery]);

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-950 italic">Synchronizing Terminal</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">v4.7 Profit-First Intelligence Booting...</p>
                </div>
            </div>
        );
    }

    if (!product) return <div className="p-20 text-center font-black uppercase tracking-widest text-slate-400">Enforcement Failure: Metadata Unreachable</div>;

    const financials = product.intelligence?.financials;
    const logistics = product.intelligence?.shipping;
    const currentPrice = Number(selectedVariant?.price || product.price);
    
    // v14.7 Profit Engine (Stabilized)
    const hasShipping = selectedShipping?.cost !== undefined;
    const shippingCost = hasShipping ? selectedShipping.cost : 0;
    
    const netProfit = (targetPrice > 0 && currentPrice > 0) 
        ? targetPrice - (currentPrice + shippingCost) 
        : null;

    const profitFormatted = netProfit !== null ? (netProfit < 0 ? `-$${Math.abs(netProfit).toFixed(2)}` : `+$${netProfit.toFixed(2)}`) : "N/A";
    const marginSignal = netProfit !== null ? (netProfit > 10 ? "High Profit" : (netProfit >= 3 ? "Medium Profit" : "Low Profit")) : "UNVERIFIED";
    const profitStatusLabel = hasShipping ? "" : " (est. before shipping)";

    const gallery = product.gallery || [];

    return (
        <div className="max-w-[1400px] mx-auto px-6 pb-40 pt-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <button onClick={() => navigate(-1)} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 transition-all text-[11px] font-black uppercase tracking-widest shadow-sm">
                    <ArrowLeft size={16} /> Return to Sourcing Grid
                </button>
                <div className="flex items-center gap-4">
                    <a 
                        href={product.cj_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-indigo-600 transition-colors"
                    >
                        <ExternalLink size={14} /> View on CJ
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Visuals */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm relative group">
                        {gallery.length > 0 ? (
                            <img 
                                src={selectedVariant?.image || gallery[activeImage]} 
                                alt={product.title} 
                                className="w-full aspect-square object-contain p-10 bg-white"
                            />
                        ) : (
                            <div className="w-full aspect-square flex items-center justify-center bg-slate-50 text-slate-300 font-black uppercase tracking-[0.2em] text-sm">
                                CJ Image Not Available
                            </div>
                        )}
                        <div className="absolute top-10 left-10">
                            <span className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-xl bg-slate-900 border border-white/20">
                                SKU: {selectedVariant?.sku || product.sku}
                            </span>
                        </div>
                    </div>

                    {/* v5.0 - UNLIMITED GALLERY LOOP */}
                    {gallery.length > 1 && (
                        <div className="grid grid-cols-6 gap-4">
                            {gallery.map((img, i) => (
                                <button 
                                    key={i}
                                    onClick={() => {
                                        setActiveImage(i);
                                        setSelectedVariant(null);
                                    }}
                                    className={cn(
                                        "aspect-square rounded-2xl border-2 overflow-hidden transition-all bg-white",
                                        activeImage === i && !selectedVariant ? "border-indigo-600 shadow-md" : "border-slate-200 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="p-10 bg-slate-50 border border-slate-200 rounded-[3rem] space-y-10">
                        <section className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <Info size={14} /> Production Description
                            </h4>
                            <div 
                                className="text-sm font-medium text-slate-600 leading-relaxed max-h-96 overflow-y-auto pr-4 custom-scrollbar supplier-description-preview"
                                dangerouslySetInnerHTML={{ __html: product.description || "No description provided." }}
                            />
                        </section>

                        {/* v14.0 Technical Specifications (Pure API) */}
                        <section className="space-y-6 pt-6 border-t border-slate-200">
                             <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <Layers size={14} /> Technical Specifications
                            </h4>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Weight</p>
                                    <p className="text-[11px] font-bold text-slate-900 uppercase">{(product.weight || "N/A")}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dimensions</p>
                                    <p className="text-[11px] font-bold text-slate-900 uppercase">{(product.dimensions || "N/A")}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Material</p>
                                    <p className="text-[11px] font-bold text-slate-900 uppercase">{(product.material || "N/A")}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CJ Direct Stock</p>
                                    <p className="text-[11px] font-bold text-emerald-600 uppercase">{(product.stock_cj || 0)} Units</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Factory Stock</p>
                                    <p className="text-[11px] font-bold text-indigo-600 uppercase">{(product.stock_factory || 0)} Units</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Packing List</p>
                                    <p className="text-11px font-bold text-slate-900 uppercase">{(product.packing_list || "N/A")}</p>
                                </div>
                            </div>
                        </section>

                        {/* v14.14 Strategic Intelligence Brief */}
                        <section className="space-y-6 pt-10 border-t border-slate-200">
                             <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                 <ShieldCheck size={14} className="text-indigo-600" /> Strategic Intelligence Brief
                             </h4>
                             
                             <div className="bg-slate-950 rounded-[2rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                     <Globe size={80} />
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-8 relative z-10">
                                     <div className="space-y-2">
                                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Market Integrity</p>
                                         <div className="flex items-center gap-2 text-xs font-black italic uppercase">
                                             <div className={cn(
                                                 "w-2 h-2 rounded-full animate-pulse",
                                                 product.intelligence?.strategic?.market_integrity === "HIGH-AUTHORITY" ? "bg-emerald-400" : "bg-amber-400"
                                             )} />
                                             {product.intelligence?.strategic?.market_integrity || "VERIFYING"}
                                         </div>
                                     </div>
                                     <div className="space-y-2 text-right">
                                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Momentum Intensity</p>
                                         <div className="text-xs font-black italic text-indigo-400 uppercase">
                                             {product.intelligence?.strategic?.momentum_intensity || "STABLE"}
                                         </div>
                                     </div>
                                 </div>

                                 <div className="h-[1px] bg-white/10 w-full" />

                                 <div className="space-y-3 relative z-10">
                                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Strategic Advantage</p>
                                     <p className="text-sm font-black italic tracking-tight leading-snug uppercase">
                                         {product.intelligence?.strategic?.strategic_advantage || "Analyzing market vectors..."}
                                     </p>
                                     <div className="pt-2">
                                         <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-300">
                                             Signal Verified
                                         </span>
                                     </div>
                                 </div>
                             </div>
                        </section>
                    </div>
                </div>

                {/* Data */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                <span className="text-[10px] font-black text-slate-900 uppercase">{product.rating || "No Ratings"}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <Layers size={12} className="text-indigo-600" />
                                <span className="text-[10px] font-black text-indigo-600 uppercase">{product.lists || 0} Lists</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
                                <Activity size={12} className="text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase">Score: {product.intelligence?.financials?.sellability_score || 0}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-none uppercase">
                                {product.title}
                            </h1>
                            {product.intelligence?.strategic?.momentum_intensity && (
                                <div className={cn(
                                    "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-lg shrink-0",
                                    product.intelligence?.strategic?.momentum_intensity === "HIGH" ? "bg-rose-500 animate-pulse" : "bg-indigo-500"
                                )}>
                                    {product.intelligence?.strategic?.momentum_intensity} MOMENTUM
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {product.product_id}</span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">|</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-indigo-600">Shipping From: {product.shipping?.from || product.warehouse || "PENDING"}</span>
                        </div>
                    </div>

                    {/* v4.7 Profit Pulse */}
                    <div className="p-8 bg-white border-2 border-slate-950 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <DollarSign size={40} className="text-slate-50 opacity-10" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Net Profit ($)</p>
                                    <p className={cn(
                                        "text-4xl font-black italic tracking-tighter",
                                        (netProfit !== null && netProfit >= 0) ? "text-emerald-500" : (netProfit === null ? "text-slate-300" : "text-rose-500")
                                    )}>
                                        {netProfit === null ? "PENDING DATA" : `${profitFormatted}${profitStatusLabel}`}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Zap size={10} className={cn(netProfit !== null ? "text-indigo-400" : "text-slate-200")} />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                            {shippingLoading ? "Fetching..." : (selectedShipping ? marginSignal.toUpperCase() : "Awaiting selection")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[1px] bg-slate-100 w-full" />
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CJ Cost</p>
                                    <p className="text-lg font-black text-slate-950">${currentPrice.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">eBay Price</p>
                                    <p className="text-lg font-black text-slate-950">${targetPrice.toFixed(2)}</p>
                                </div>
                            </div>

                             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Truck size={14} /> 
                                    {shippingLoading ? "Determining route..." : (selectedShipping?.deliveryTime || "ROUTE UNAVAILABLE")}
                                    <span className="text-slate-300 mx-1">|</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-md text-[8px]",
                                        (selectedVariant?.warehouseId || "").toString().toUpperCase().includes('US') ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                                    )}>
                                        FROM: {(selectedVariant?.warehouseId || "").toString().toUpperCase().includes('US') ? "UNITED STATES" : "CHINA"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} /> 
                                    STOCK: {product.stock || 0} 
                                    {selectedVariant && <span className="text-indigo-400"> ({selectedVariant.inventory})</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* v13.0 Shipping Option Selector */}
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                            Available Shipping Methods
                            {shippingLoading && <RefreshCw size={10} className="animate-spin" />}
                        </h4>
                        <div className="space-y-3 bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
                            {shippingOptions.length > 0 ? (
                                shippingOptions.map((opt, i) => (
                                    <label 
                                        key={`${opt.name}-${i}`}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50",
                                            selectedShipping?.name === opt.name ? "border-slate-950 bg-slate-50" : "border-slate-50 bg-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="radio" 
                                                name="shipping"
                                                checked={selectedShipping?.name === opt.name}
                                                onChange={() => setSelectedShipping(opt)}
                                                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600" 
                                            />
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black text-slate-950 uppercase">{opt.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{opt.deliveryTime}</p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-black text-indigo-600">
                                            {opt.cost === 0 ? "FREE SHIPPING" : `$${opt.cost.toFixed(2)}`}
                                        </span>
                                    </label>
                                ))
                            ) : (
                                <div className="text-center py-4 opacity-50 text-[10px] font-bold uppercase tracking-widest italic">
                                    {shippingLoading ? "Fetching..." : "No shipping routes available"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Variant Engine (v4.7) */}
                    {product.variants && product.variants.length > 0 && (
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Inventory Matrix ({product.variants.length})</h4>
                            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {product.variants.map((v, i) => (
                                    <button 
                                        key={v.sku_id || i}
                                        onClick={() => setSelectedVariant(v)}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 text-left transition-all",
                                            selectedVariant?.sku_id === v.sku_id 
                                                ? "border-slate-950 bg-slate-50" 
                                                : "border-slate-100 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px]">{v.color} {v.size !== "Standard" ? `(${v.size})` : ""}</span>
                                            <span className="text-[10px] font-black text-slate-950">${v.price.toFixed(2)}</span>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-600 truncate">SKU: {v.sku}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-8">
                        <button 
                            className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-2xl group"
                        >
                            <Zap size={20} className="group-hover:animate-pulse" /> Finalize Selection
                        </button>
                        <p className="text-center mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            RATING: {product.rating || "No rating yet"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierProductDetail;
