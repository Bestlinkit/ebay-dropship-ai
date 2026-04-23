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
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import cjService from '../services/cj.service';
import { normalizeProduct } from '../services/cj.schema';

/**
 * 🔍 CJ DEEP DETAIL ENGINE (v3.0 - STABLE FIX)
 * Objective: Description and Variants ALWAYS visible.
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
                if (enriched.variants?.length > 0) {
                    setSelectedVariant(enriched.variants[0]);
                }
            } catch (err) {
                console.error("Detail Fetch Fault:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    const image = product?.images?.[0] || "https://via.placeholder.com/300";
    const cjCost = parseFloat(selectedVariant?.price || selectedVariant?.variantSellPrice || product?.cjCost || 0);
    const shipping = product?.shipping || { cost: 0, delivery: "7-15 Days", name: "Standard Shipping" };
    const netProfit = targetPrice - (cjCost + parseFloat(shipping.cost || 0));

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
                    <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm relative">
                        <img 
                            src={image} 
                            alt="" 
                            className="w-full aspect-square object-contain p-10 bg-white"
                        />
                    </div>

                    {/* Phase 5: Description ALWAYS visible */}
                    <div className="p-10 bg-slate-50 border border-slate-200 rounded-[3rem] space-y-10">
                        <section className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <Info size={14} /> Product Description
                            </h4>
                            <div 
                                className="text-sm font-medium text-slate-600 leading-relaxed max-h-[500px] overflow-y-auto pr-4 custom-scrollbar"
                                dangerouslySetInnerHTML={{ __html: product?.description || "No description available." }}
                            />
                        </section>
                    </div>
                </div>

                {/* Data Panel */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-tight uppercase">
                            {product?.title}
                        </h1>
                    </div>

                    {/* Profit Card */}
                    <div className="p-8 bg-white border-2 border-slate-950 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Net Profit ($)</p>
                                <p className={cn(
                                    "text-4xl font-black italic tracking-tighter",
                                    netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {netProfit < 0 ? `-$${Math.abs(netProfit).toFixed(2)}` : `+$${netProfit.toFixed(2)}`}
                                </p>
                            </div>

                            <div className="h-[1px] bg-slate-100 w-full" />
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CJ Cost</p>
                                    <p className="text-lg font-black text-slate-950">${cjCost.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Shipping</p>
                                    <p className="text-lg font-black text-slate-950">${parseFloat(shipping.cost).toFixed(2)}</p>
                                </div>
                            </div>

                             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Truck size={14} /> {shipping.delivery}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe size={14} /> {product?.warehouse || "CN"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phase 5: Variants ALWAYS render */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Inventory Matrix ({product?.variants?.length || 0})</h4>
                        <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {product?.variants?.length > 0 ? product.variants.map((v, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setSelectedVariant(v)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 text-left transition-all",
                                        selectedVariant === v ? "border-slate-950 bg-slate-50" : "border-slate-100 hover:border-slate-300 bg-white"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[8px] font-black text-slate-400 uppercase truncate max-w-[80px]">{v.color || v.variantKey || "Standard"}</span>
                                        <span className="text-[10px] font-black text-slate-950">${parseFloat(v.price || v.sellPrice || 0).toFixed(2)}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-600 truncate">SKU: {v.sku || v.variantSku || "N/A"}</p>
                                </button>
                            )) : (
                                <div className="col-span-2 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    No variants found
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-8">
                        <button className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-2xl group">
                            <Zap size={20} className="group-hover:animate-pulse" /> Finalize Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierProductDetail;
