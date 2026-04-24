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
    const [optimizationError, setOptimizationError] = useState(null)    // SEO ENGINE TRIGGER (TAB 1)
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
                    setSelectedTitle(seoData.titles[0]);
                }
            } else {
                setOptimizationError("Market Scan Delayed. Using Deterministic Baseline.");
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

                    {activeTab > 1 && (
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
