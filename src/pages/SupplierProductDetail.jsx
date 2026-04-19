import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  ShieldCheck, 
  Star, 
  Truck, 
  Package, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Info,
  Loader2,
  Lock,
  Layers,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import sourcingService from '../services/sourcing';
import { cn } from '../lib/utils';

const SupplierProductDetail = () => {
    const { source, id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Context from previous search
    const targetProduct = location.state?.targetProduct;
    const targetPrice = Number(location.state?.targetPrice || 0);
    const ebayItemUrl = location.state?.ebayItemUrl || "#";
    const sellData = location.state?.sellData;

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        const fetchDeepDetails = async () => {
            // v4.6 - Optimized State Detection
            if (location.state?.preFetchedProduct) {
                const data = location.state.preFetchedProduct;
                setProduct(data);
                if (data.variants && data.variants.length > 0) {
                    setSelectedVariant(data.variants[0]);
                    if (data.variants[0].image) {
                        // If variant has image, we can prioritize it, but we keep gallery index
                    }
                }
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // If we don't have prefetched state, we fetch via PID
                const result = await sourcingService.getProductDetails(id);
                if (result.status === 'SUCCESS') {
                    setProduct(result.data);
                    if (result.data.variants && result.data.variants.length > 0) {
                        setSelectedVariant(result.data.variants[0]);
                    }
                } else {
                    toast.error(`CJ API Fetch Failure: ${result.message}`);
                }
            } catch (error) {
                console.error("Deep Enrichment Fault:", error);
                toast.error(`CJ API Connection Lost`);
            } finally {
                setLoading(false);
            }
        };

        fetchDeepDetails();
    }, [source, id, location.state]);

    const handleOptimize = () => {
        if (!product) return;

        const vendorSnapshot = {
            title: product.title,
            images: product.images || [product.image],
            description: product.description,
            pricing: {
                selectedVariantPrice: selectedVariant?.price || product.price,
                totalCost: (selectedVariant?.price || product.price) + 5.00, // $5 shipping fallback
                targetPrice: targetPrice
            },
            supplier: {
                source: 'CJ',
                id: product.product_id,
                sku: selectedVariant?.sku_id || product.sku,
                url: `https://cjdropshipping.com/product-detail.html?id=${product.product_id}`,
                rating: product.rating
            }
        };

        navigate('/optimize/new', { 
            state: { 
                importedProduct: vendorSnapshot 
            } 
        });
        toast.success("Intelligence Snapshot Captured. Launching Optimization Studio.");
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock size={20} className="text-slate-400" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-950 italic">Compiling Metadata</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Processing CJ Sourcing Payload...</p>
                </div>
            </div>
        );
    }

    // Intelligence Metrics
    const currentPrice = selectedVariant?.price || product.price;
    const shippingCost = 5.00; // Standard CJ Fallback
    const profit = targetPrice - currentPrice - shippingCost;
    const roi = (profit / currentPrice) * 100;

    const gallery = product.images || [];

    return (
        <div className="max-w-[1400px] mx-auto px-6 pb-40 pt-10 animate-in fade-in duration-700">
            {/* 1. Header Navigation */}
            <div className="flex items-center justify-between mb-12">
                <button onClick={() => navigate(-1)} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 transition-all text-[11px] font-black uppercase tracking-widest shadow-sm">
                    <ArrowLeft size={16} /> Return to Sourcing Results
                </button>
                <div className="flex items-center gap-4">
                    <div className="px-6 py-3 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                        <ShieldCheck size={14} className="text-emerald-400" /> CJ Intelligence v4.6 Secure
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* 2. Visual Intelligence (Left Column) */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm relative group">
                        <img 
                            src={selectedVariant?.image || gallery[activeImage]} 
                            alt={product.title} 
                            className="w-full aspect-square object-contain p-10 bg-white"
                        />
                         <div className="absolute top-10 left-10">
                            <span className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-xl bg-slate-900">
                                SKU: {selectedVariant?.sku_id || product.sku}
                            </span>
                        </div>
                        <div className="absolute bottom-10 left-10 flex items-center gap-2">
                            <span className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-xl bg-indigo-600">
                                {gallery.length} Production Images
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-6 gap-4">
                        {gallery.slice(0, 12).map((img, i) => (
                            <button 
                                key={i}
                                onClick={() => {
                                    setActiveImage(i);
                                    setSelectedVariant(null); // Deselect variant to show gallery image
                                }}
                                className={cn(
                                    "aspect-square rounded-2xl border-2 overflow-hidden transition-all bg-white",
                                    activeImage === i && !selectedVariant ? "border-slate-950 shadow-md" : "border-slate-200 opacity-60 hover:opacity-100"
                                )}
                            >
                                <img src={img} className="w-full h-full object-cover" alt="" />
                            </button>
                        ))}
                    </div>

                    {/* Description Analysis (v4.6 Rich HTML) */}
                    <div className="p-10 bg-slate-50 border border-slate-200 rounded-[3rem] space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                            <Info size={14} /> Global Product Description
                        </h4>
                        <div 
                            className="text-sm font-medium text-slate-600 leading-relaxed max-h-96 overflow-y-auto pr-4 custom-scrollbar supplier-description-preview"
                            dangerouslySetInnerHTML={{ __html: product.description || "No detailed description provided by CJ Dropshipping. Review variants for technical specifications." }}
                        />
                    </div>
                </div>

                {/* 3. Decision Logic (Right Column) */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-none uppercase">
                            {product.title}
                        </h1>
                        <div className="flex items-center gap-6">
                            <a 
                                href={`https://cjdropshipping.com/product-detail.html?id=${product.product_id}`}
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-slate-950 transition-all border-b border-slate-200 pb-1"
                            >
                                CJ Global Portal <ExternalLink size={12} />
                            </a>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                ID: {product.product_id}
                            </span>
                        </div>
                    </div>

                    {/* ROI Pulse Card */}
                    <div className="p-8 bg-white border-2 border-slate-950 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <TrendingUp size={40} className="text-slate-50 opacity-10" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sourcing Cost (USD)</p>
                                    <p className="text-4xl font-black text-slate-950 italic">${currentPrice.toFixed(2)}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated ROI</p>
                                    <p className={cn(
                                        "text-4xl font-black italic",
                                        roi > 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {roi.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            
                            {roi < 0 && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                                    <AlertTriangle size={16} className="text-rose-500" />
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">NEGATIVE MARGIN DETECTED (CHECK TARGET PRICE)</p>
                                </div>
                            )}

                            <div className="h-[1px] bg-slate-100 w-full" />
                            
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <div className="flex items-center gap-2"><Truck size={14} /> Est. Shipping: $5.00</div>
                                <div className="flex items-center gap-2"><Package size={14} /> {product.warehouse || "CHINA"}</div>
                                <div className="flex items-center gap-2 font-black text-slate-950 underline decoration-indigo-500 underline-offset-4">{sellData?.resellScore || "N/A"} CONFIDENCE</div>
                            </div>
                        </div>
                    </div>

                    {/* 🧠 MARKET INTELLIGENCE ENGINE REPORT (v4.6 Sync) */}
                    {sellData && (
                        <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-8 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                    <Zap size={16} className="text-emerald-500 fill-emerald-500" /> Market Intelligence Report
                                </h4>
                                <div className="px-3 py-1 bg-slate-950 text-white rounded-lg text-[10px] font-black italic shadow-lg">
                                    Resell Score: {sellData.resellScore}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Zap size={40} className="text-emerald-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star size={14} className="text-emerald-500 fill-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match Reliability Basis</span>
                                    </div>
                                    <p className="text-[12px] font-black text-white italic leading-snug">
                                        {sellData.grade === 'Premium Supplier Match' ? 
                                         "Strategic alignment confirmed. High fidelity between eBay listing intent and CJ supplier capabilities." :
                                         "Market verification passed. Sourcing cost allows for viable margin within the current eBay price cluster."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Variant Matrix Hub (v4.6 Enhanced) */}
                    {product.variants && product.variants.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Layers size={14} /> Variant Inventory Matrix
                                </h4>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product.variants.length} Options</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {product.variants.map((variant, i) => (
                                    <button 
                                        key={variant.sku_id || i}
                                        onClick={() => {
                                            setSelectedVariant(variant);
                                            // Optional: If variant has image, scrollToTop/Switch active?
                                        }}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                                            selectedVariant?.sku_id === variant.sku_id 
                                                ? "border-slate-950 bg-slate-50 shadow-sm" 
                                                : "border-slate-100 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px]">
                                                {variant.attributes}
                                            </span>
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest underline underline-offset-2 decoration-emerald-500/30">
                                                ${variant.price.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {variant.image && (
                                                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                                    <img src={variant.image} className="w-full h-full object-cover" alt="" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-slate-900 truncate">SKU: {variant.sku_id}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Stock: {variant.stock}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Master Action */}
                    <div className="pt-8">
                        <button 
                            onClick={handleOptimize}
                            className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-2xl group"
                        >
                            <Target size={20} className="group-hover:animate-ping" /> Import & Optimize Product
                        </button>
                        <p className="text-center mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Full Intelligence payload (SKU: {selectedVariant?.sku_id || product.sku}) will be captured
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierProductDetail;
