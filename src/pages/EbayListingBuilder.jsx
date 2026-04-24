import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  DollarSign, 
  Image as ImageIcon, 
  Video, 
  ShieldCheck, 
  Send,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Trophy,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { optimizeListing } from '../services/aiOptimization.service';

/**
 * 🚀 EBAY LISTING BUILDER (v1.0)
 * Objective: Optimization + Listing. No sourcing overlap.
 * REAL AI OR FAIL logic implemented in Tab 1.
 */
const EbayListingBuilder = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // DATA CONTRACT: id, title, description, images[], variants[], price, shipping
    const { product: cjProduct, targetPrice } = location.state || {};

    const [activeTab, setActiveTab] = useState(1);
    
    // TABS CONFIG
    const tabs = [
        { id: 1, name: "Title & Description", icon: <Sparkles size={18} /> },
        { id: 2, name: "Pricing & Variants", icon: <DollarSign size={18} /> },
        { id: 3, name: "Images", icon: <ImageIcon size={18} /> },
        { id: 4, name: "Video", icon: <Video size={18} /> },
        { id: 5, name: "Category & Policies", icon: <ShieldCheck size={18} /> },
        { id: 6, name: "Review & Publish", icon: <Send size={18} /> },
    ];

    // AI OPTIMIZATION STATE (TAB 1 ONLY)
    const [optimizedData, setOptimizedData] = useState(null);
    const [selectedTitle, setSelectedTitle] = useState(cjProduct?.title || "");
    const [description, setDescription] = useState(cjProduct?.description || "");
    const [tags, setTags] = useState([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationError, setOptimizationError] = useState(null);

    // 💰 PRICING & VARIANTS STATE (TAB 2)
    const [variants, setVariants] = useState([]);
    const [bulkPrice, setBulkPrice] = useState("");
    const [bulkInventory, setBulkInventory] = useState("");

    // Initialize Variants from CJ Product
    useEffect(() => {
        if (cjProduct?.variants) {
            const initialVariants = cjProduct.variants.map(v => {
                const cjPrice = parseFloat(v.sellPrice || v.variantPrice || 0);
                const ebayPrice = targetPrice || (cjPrice * 2); // Default 2x if no target
                
                return calculateMetrics({
                    name: v.variantKey || v.variantStandardEn || v.variantNameEn || "Standard",
                    sku: v.skuCode || v.variantSku || "N/A",
                    cj_price: cjPrice,
                    ebay_price: ebayPrice,
                    inventory: 10
                });
            });
            setVariants(initialVariants);
        }
    }, [cjProduct, targetPrice]);

    // Metric Calculation Logic
    function calculateMetrics(v) {
        const ebayPrice = parseFloat(v.ebay_price) || 0;
        const cjPrice = parseFloat(v.cj_price) || 0;
        const fees = ebayPrice * 0.12;
        const profit = ebayPrice - cjPrice - fees;
        const rio = cjPrice > 0 ? (profit / cjPrice) * 100 : 0;

        return {
            ...v,
            profit: parseFloat(profit.toFixed(2)),
            rio: parseFloat(rio.toFixed(1))
        };
    }

    const handleUpdateVariant = (index, field, value) => {
        setVariants(prev => {
            const next = [...prev];
            next[index] = calculateMetrics({ ...next[index], [field]: value });
            return next;
        });
    };

    const handleApplyBulk = () => {
        setVariants(prev => prev.map(v => calculateMetrics({
            ...v,
            ebay_price: bulkPrice !== "" ? parseFloat(bulkPrice) : v.ebay_price,
            inventory: bulkInventory !== "" ? parseInt(bulkInventory) : v.inventory
        })));
    };
    const handleSEOOptimize = async () => {
        if (!cjProduct) return;
        setIsOptimizing(true);
        setOptimizationError(null);

        try {
            const response = await fetch('http://localhost:3001/api/ai/optimize', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: cjProduct.title,
                    description: cjProduct.description
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                const seoData = result.data || {};
                setOptimizedData(seoData);
                setTags(seoData.tags || []);
                setDescription(seoData.description || cjProduct.description || "");
                
                if (seoData.titles?.length > 0) {
                    const firstTitle = typeof seoData.titles[0] === 'object' ? seoData.titles[0].text : seoData.titles[0];
                    setSelectedTitle(firstTitle);
                }
            } else {
                setOptimizationError(`Optimization Rejected: ${result.reason || "Context Lock Fault"}`);
            }
        } catch (err) {
            console.error("SEO Build Fault:", err);
            setOptimizationError("Bridge Timeout. Using Deterministic Baseline.");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(prev => prev.filter(t => t !== tagToRemove));
    };

    if (!cjProduct) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
                <AlertCircle size={48} className="text-rose-500" />
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Handshake Failed</h2>
                <button onClick={() => navigate('/discovery')} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">
                    Back to Discovery
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-12 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all bg-white shadow-sm group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-none">eBay Listing Builder</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Optimization Phase • Product {productId}</p>
                    </div>
                </div>
            </div>

            {/* TAB SYSTEM */}
            <div className="grid grid-cols-12 gap-10">
                {/* SIDEBAR NAVIGATION */}
                <div className="col-span-3 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-left group",
                                activeTab === tab.id 
                                    ? "bg-slate-950 text-white shadow-xl shadow-slate-200 translate-x-2" 
                                    : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50 hover:text-slate-600"
                            )}
                        >
                            <span className={cn(
                                "transition-colors",
                                activeTab === tab.id ? "text-indigo-400" : "text-slate-300 group-hover:text-slate-400"
                            )}>
                                {tab.icon}
                            </span>
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT AREA */}
                <div className="col-span-9 bg-white border border-slate-200 rounded-[3rem] p-12 min-h-[700px] shadow-sm">
                    {activeTab === 1 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Market Intelligence</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generate optimized titles based on real demand</p>
                                </div>
                                {!optimizedData && !isOptimizing && (
                                    <button 
                                        onClick={handleSEOOptimize}
                                        className="px-8 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all shadow-lg"
                                    >
                                        <Sparkles size={16} /> Run Market Optimizer
                                    </button>
                                )}
                            </div>

                            {isOptimizing && (
                                <div className="py-20 flex flex-col items-center justify-center gap-6">
                                    <RefreshCw size={48} className="text-indigo-600 animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Scraping eBay Demand Data...</p>
                                </div>
                            )}

                            {optimizationError && (
                                <div className="p-10 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] flex flex-col items-center gap-6 text-center">
                                    <AlertCircle size={40} className="text-rose-500" />
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-black text-rose-900 uppercase">Optimization Warning</h4>
                                        <p className="text-sm font-medium text-rose-600">{optimizationError}</p>
                                    </div>
                                    <button onClick={handleSEOOptimize} className="px-12 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl">
                                        Retry Market Handshake
                                    </button>
                                </div>
                            )}

                            {optimizedData && (
                                <div className="space-y-12 animate-in fade-in duration-700">
                                    {/* AUTO CATEGORY MATCH */}
                                    {optimizedData.category && (
                                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auto-Matched Category</p>
                                                    <p className="text-sm font-bold text-slate-900 uppercase">{optimizedData.category.name}</p>
                                                </div>
                                            </div>
                                            <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">Verified Match</span>
                                        </div>
                                    )}

                                    {/* TITLE SELECTION */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Trophy size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Ranked Title Options</span>
                                        </div>
                                        <div className="grid gap-4">
                                            {optimizedData.titles?.map((t, i) => {
                                                const titleText = typeof t === 'string' ? t : (t.text || "Untitled Title");
                                                const titleScore = typeof t === 'object' ? t.score : (optimizedData.scores?.[i] || 70);
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedTitle(titleText)}
                                                        className={cn(
                                                            "w-full p-6 rounded-2xl border-2 text-left transition-all relative group",
                                                            selectedTitle === titleText ? "border-slate-950 bg-slate-50/50" : "border-slate-100 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-black text-slate-400">SCORE</span>
                                                                <span className={cn(
                                                                    "text-[10px] font-black px-2 py-0.5 rounded",
                                                                    titleScore > 80 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                                                )}>
                                                                    {titleScore}/100
                                                                </span>
                                                            </div>
                                                            {i === 0 && (
                                                                <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase">
                                                                    <Trophy size={10} /> Recommended
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-[14px] font-bold text-slate-900 pr-20">{titleText}</p>
                                                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                                            {selectedTitle === titleText && <CheckCircle2 size={20} className="text-slate-950" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* DESCRIPTION EDITOR (PLAIN TEXT MODE) */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-slate-400">
                                                <Sparkles size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Listing Description</span>
                                            </div>
                                            <span className="text-[9px] font-black text-slate-300 uppercase">Raw Text Mode</span>
                                        </div>
                                        
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full h-80 p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-sm font-medium text-slate-600 leading-relaxed focus:border-indigo-500 focus:bg-white outline-none transition-all custom-scrollbar whitespace-pre-wrap"
                                            placeholder="Write your listing description here..."
                                        />
                                    </div>

                                    {/* SEO TAGS */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-slate-400">
                                                <ImageIcon size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Generated SEO Tags</span>
                                            </div>
                                            <span className="text-[9px] font-black text-slate-300 uppercase">{tags.length} TAGS GENERATED</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {tags?.map((tag, i) => (
                                                <div key={i} className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-tight group hover:border-slate-400 transition-all">
                                                    {tag}
                                                    <button onClick={() => handleRemoveTag(tag)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-10 flex justify-end">
                                        <button onClick={() => setActiveTab(2)} className="px-12 py-5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-indigo-600 transition-all shadow-xl group">
                                            Pricing & Variants <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!optimizedData && !isOptimizing && !optimizationError && (
                                <div className="py-32 flex flex-col items-center justify-center gap-8 border-2 border-dashed border-slate-100 rounded-[3rem]">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                                        <Sparkles size={40} />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h4 className="text-lg font-black text-slate-900 uppercase">Ready for Optimization</h4>
                                        <p className="text-sm font-medium text-slate-400">Click the button above to generate AI content for this product.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Pricing & Inventory</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adjust margins and stock levels across all variations</p>
                                </div>
                                {targetPrice && (
                                    <div className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Suggested Market Price</p>
                                        <p className="text-sm font-black text-indigo-600">${parseFloat(targetPrice).toFixed(2)}</p>
                                    </div>
                                )}
                            </div>

                            {/* BULK ACTIONS BAR */}
                            <div className="p-8 bg-slate-950 rounded-[2.5rem] shadow-xl shadow-slate-200">
                                <div className="flex items-end gap-6">
                                    <div className="flex-1 space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulk eBay Price ($)</label>
                                        <input 
                                            type="number"
                                            value={bulkPrice}
                                            onChange={(e) => setBulkPrice(e.target.value)}
                                            placeholder="Set all prices..."
                                            className="w-full bg-slate-900 border-none rounded-xl px-5 py-4 text-white text-sm font-bold focus:ring-2 ring-indigo-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulk Inventory</label>
                                        <input 
                                            type="number"
                                            value={bulkInventory}
                                            onChange={(e) => setBulkInventory(e.target.value)}
                                            placeholder="Set all stock..."
                                            className="w-full bg-slate-900 border-none rounded-xl px-5 py-4 text-white text-sm font-bold focus:ring-2 ring-indigo-500/50 outline-none"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleApplyBulk}
                                        className="px-10 py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
                                    >
                                        Apply to All
                                    </button>
                                </div>
                            </div>

                            {/* VARIANT TABLE */}
                            <div className="overflow-hidden border border-slate-100 rounded-[2rem] bg-slate-50/50">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Variant / SKU</th>
                                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">CJ Cost</th>
                                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">eBay Price</th>
                                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock</th>
                                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Profit</th>
                                            <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ROI %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {variants.map((v, idx) => (
                                            <tr key={idx} className="group hover:bg-white transition-colors">
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black text-slate-900 uppercase pr-4">{v.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1">{v.sku}</p>
                                                </td>
                                                <td className="px-6 py-6 text-xs font-bold text-slate-500">
                                                    ${v.cj_price.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">$</span>
                                                        <input 
                                                            type="number"
                                                            value={v.ebay_price}
                                                            onChange={(e) => handleUpdateVariant(idx, 'ebay_price', e.target.value)}
                                                            className={cn(
                                                                "w-24 pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-indigo-500 transition-all",
                                                                v.ebay_price < v.cj_price && "border-rose-300 bg-rose-50 text-rose-600"
                                                            )}
                                                        />
                                                    </div>
                                                    {v.ebay_price < v.cj_price && (
                                                        <p className="text-[8px] font-black text-rose-500 uppercase mt-1">Loss Warning</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-6">
                                                    <input 
                                                        type="number"
                                                        value={v.inventory}
                                                        onChange={(e) => handleUpdateVariant(idx, 'inventory', e.target.value)}
                                                        className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-indigo-500 transition-all"
                                                    />
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className={cn(
                                                        "text-xs font-black",
                                                        v.profit < 0 ? "text-rose-600" : "text-slate-900"
                                                    )}>
                                                        ${v.profit.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[10px] font-black",
                                                        v.rio > 50 ? "bg-emerald-100 text-emerald-700" : 
                                                        v.rio < 0 ? "bg-rose-100 text-rose-700" : 
                                                        "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {v.cj_price > 0 ? `${v.rio}%` : "N/A"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pt-10 flex justify-between">
                                <button onClick={() => setActiveTab(1)} className="px-8 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Back to Title
                                </button>
                                <button onClick={() => setActiveTab(3)} className="px-12 py-5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-indigo-600 transition-all shadow-xl group">
                                    Images <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab > 2 && (
                        <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                {tabs.find(t => t.id === activeTab)?.icon}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase">Section in Development</h3>
                            <p className="text-sm font-medium text-slate-400 max-w-xs">The {tabs.find(t => t.id === activeTab)?.name} stage is being prepared for the next release.</p>
                            <button onClick={() => setActiveTab(1)} className="mt-4 px-8 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                Back to Title & Description
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EbayListingBuilder;
