import React, { useState, useEffect, useMemo } from 'react';
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
  Globe,
  Box,
  Warehouse
} from 'lucide-react';
import { cn } from '../lib/utils';
import cjService from '../services/cj.service';
import { normalizeProduct } from '../services/cj.schema';

/**
 * 🔍 CJ DEEP DETAIL ENGINE (v2.0 - Practical Mode)
 * Mandate: Stable Images, Single-Method Shipping, No infinite loops.
 */
const SupplierProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Context from previous search
    const targetProduct = location.state?.targetProduct;
    const targetPrice = parseFloat(location.state?.targetPrice || 0);

    const [loading, setLoading] = useState(true);
    const [rawDetail, setRawDetail] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    
    // 🚚 PHASE 4: SHIPPING (USA LOCK)
    const [shipping, setShipping] = useState({ cost: 0, method: "Unavailable", deliveryTime: "N/A", status: "fallback" });
    const [shippingLoading, setShippingLoading] = useState(false);

    // Phase 1: Normalization with merge safety
    const product = useMemo(() => normalizeProduct(rawDetail, location.state?.preFetchedProduct), [rawDetail]);

    useEffect(() => {
        const fetchDeepDetails = async () => {
            setLoading(true);
            try {
                const detail = await cjService.getProductDetail(id);
                if (detail) {
                    setRawDetail(detail);
                }
            } catch (error) {
                console.error("Deep Enrichment Fault:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDeepDetails();
    }, [id]);

    useEffect(() => {
        if (product?.variants?.length > 0 && !selectedVariant) {
            setSelectedVariant(product.variants[0]);
        }
    }, [product, selectedVariant]);

    // 🚚 PHASE 4: SHIPPING RESOLUTION
    useEffect(() => {
        const resolveShipping = async () => {
            if (!product?.id) return;

            // Rule: Only call freight API if detail data is missing
            if (product.shipping?.status === "resolved" && product.shipping?.method !== "Unavailable") {
                setShipping(product.shipping);
                return;
            }

            setShippingLoading(true);
            try {
                const warehouseId = selectedVariant?.warehouseId || product?.warehouseId || "CN";
                const { methods } = await cjService.getShippingOptions(product.id, 'US', warehouseId, 1);
                
                if (methods && methods.length > 0) {
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
                setShippingLoading(false);
            }
        };

        if (product?.id) resolveShipping();
    }, [product?.id, selectedVariant?.sku]);

    if (loading && !rawDetail) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-950 italic">Synchronizing Terminal</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enriching Product Data...</p>
                </div>
            </div>
        );
    }

    const cjCost = parseFloat(selectedVariant?.price || product?.cjCost || 0);
    const shippingCost = parseFloat(shipping?.cost || 0);
    const hasShipping = shipping?.status === "resolved";
    
    // 💰 PHASE 5: PROFIT ENGINE (DECOUPLED)
    const netProfit = hasShipping ? (targetPrice - (cjCost + shippingCost)) : (targetPrice - cjCost);
    const profitFormatted = netProfit < 0 ? `-$${Math.abs(netProfit).toFixed(2)}` : `+$${netProfit.toFixed(2)}`;
    const profitStatusLabel = hasShipping ? "" : " (est. before shipping)";

    // 🖼️ PHASE 3: IMAGE STABILITY (Main image independent of variants)
    const mainImage = product?.images?.[activeImage] || "/placeholder.png";

    return (
        <div className="max-w-[1400px] mx-auto px-6 pb-40 pt-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <button onClick={() => navigate(-1)} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 transition-all text-[11px] font-black uppercase tracking-widest shadow-sm">
                    <ArrowLeft size={16} /> Return to Sourcing Grid
                </button>
                <div className="flex items-center gap-4">
                    <a 
                        href={`https://cjdropshipping.com/product-detail.html?id=${product?.id}`} 
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
                        <img 
                            src={mainImage} 
                            alt={product?.title} 
                            className="w-full aspect-square object-contain p-10 bg-white"
                        />
                        <div className="absolute top-10 left-10">
                            <span className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-xl bg-slate-900 border border-white/20">
                                SKU: {selectedVariant?.sku || product?.id}
                            </span>
                        </div>
                    </div>

                    {/* Gallery Carousel */}
                    {product?.images?.length > 1 && (
                        <div className="grid grid-cols-6 gap-4">
                            {product.images.slice(0, 12).map((img, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={cn(
                                        "aspect-square rounded-2xl border-2 overflow-hidden transition-all bg-white",
                                        activeImage === i ? "border-indigo-600 shadow-md" : "border-slate-200 opacity-60 hover:opacity-100"
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
                                <Info size={14} /> Product Description
                            </h4>
                            <div 
                                className="text-sm font-medium text-slate-600 leading-relaxed max-h-96 overflow-y-auto pr-4 custom-scrollbar supplier-description-preview"
                                dangerouslySetInnerHTML={{ __html: product?.description || "No description provided." }}
                            />
                        </section>
                    </div>
                </div>

                {/* Data Panel */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                <span className="text-[10px] font-black text-slate-900 uppercase">Supplier Verified</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
                                <Globe size={12} className="text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase">{product?.origin}</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-tight uppercase">
                            {product?.title}
                        </h1>
                        <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {product?.id}</span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">|</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-indigo-600">Warehouse: {product?.warehouse}</span>
                        </div>
                    </div>

                    {/* Profit Engine View */}
                    <div className="p-8 bg-white border-2 border-slate-950 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Net Profit ($)</p>
                                <p className={cn(
                                    "text-4xl font-black italic tracking-tighter",
                                    netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {profitFormatted}{profitStatusLabel}
                                </p>
                            </div>

                            <div className="h-[1px] bg-slate-100 w-full" />
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CJ Cost</p>
                                    <p className="text-lg font-black text-slate-950">${cjCost.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">eBay Price</p>
                                    <p className="text-lg font-black text-slate-950">${targetPrice.toFixed(2)}</p>
                                </div>
                            </div>

                             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Truck size={14} /> 
                                    {shippingLoading ? "Calculating..." : (shipping?.deliveryTime || "N/A")}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} /> 
                                    {selectedVariant?.stock || "IN STOCK"} 
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Method Lock */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Primary Logistics (US Lock)</h4>
                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem]">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-950 uppercase">{shipping?.method}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estimated Arrival: {shipping?.deliveryTime}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-indigo-600">{shipping?.cost > 0 ? `$${shipping.cost.toFixed(2)}` : "FREE"}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Standard Rate</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variant Selector */}
                    {product?.variants?.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Variant Configuration ({product.variants.length})</h4>
                            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {product.variants.map((v, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setSelectedVariant(v)}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 text-left transition-all",
                                            selectedVariant?.sku === v.sku 
                                                ? "border-slate-950 bg-slate-50" 
                                                : "border-slate-100 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px]">{v.color}</span>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierProductDetail;
