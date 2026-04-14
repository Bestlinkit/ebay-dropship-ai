import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  RefreshCw,
  ArrowRight,
  Type,
  Camera,
  DollarSign,
  ChevronRight,
  CheckCircle,
  Cpu,
  Target,
  Zap,
  Tag,
  Layers,
  Info,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  Eye,
  Terminal,
  Search,
  ExternalLink,
  Loader2,
  Star,
  Activity,
  Box,
  Globe,
  Monitor,
  TrendingUp,
  Percent,
  BarChart3,
  Search as SearchIcon,
  X,
  ChevronDown,
  ChevronLeft,
  Check,
  LayoutDashboard,
  Package,
  Edit3,
  Shield
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import aiService from '../services/ai';
import ebayService from '../services/ebay';
import sourcingService from '../services/sourcing';
import NanoBanana from '../components/NanoBanana';
import ProfitMaximizer from '../components/ProfitMaximizer';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import ebayTrading from '../services/ebay_trading';
import { cn } from '../lib/utils';
import { matchPrimaryCategory, PRIMARY_CATEGORIES } from '../constants/ebayTaxonomy';
import { motion, AnimatePresence } from 'framer-motion';

const OptimizeProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isStoreConnected, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [originalProduct, setOriginalProduct] = useState(null);
  const [rank, setRank] = useState(null);

  // Core Product Object Model (Unified Registry)
  const [registry, setRegistry] = useState({
    titles: [],
    selectedTitle: '',
    description: '',
    optimizedDescription: "",
    tags: [],
    category: '',
    categoryPath: [],
    images: [],
    excludedImages: [],
    price: 0,
    suggestedPrice: 0,
    supplierCost: 35.00, // Baseline for maximization pulse
    margin: "0%",
    competition: "Low",
    probability: 0,
    marketStats: null
  });

  // Hierarchy Selection Stack (Categories)
  const [categoryStack, setCategoryStack] = useState([]); // [{id, name, level}]
  const [currentLevelLevels, setCurrentLevelLevels] = useState([]); // Children of last selected
  const [categoryLoading, setCategoryLoading] = useState(false);

  // UI States
  const [activeTab, setActiveTab] = useState('intelligence');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);
  
  const addSystemLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [{ timestamp, message, type }, ...prev].slice(0, 30));
  };

  // HYDRATION & PRELOADER: Synchronize with Discovery Marketplace Vectors
  useEffect(() => {
    const hydrateStudio = async () => {
        setLoading(true);
        try {
            // Case A: Product passed via Discovery Hub State (Internal Node)
            if (location.state?.ebayProduct) {
                const ep = location.state.ebayProduct;
                setOriginalProduct(ep);
                const r = sourcingService.rankProduct(ep);
                setRank(r);

                setRegistry(prev => ({
                    ...prev,
                    selectedTitle: ep.title || "",
                    price: ep.price || 0,
                    images: ep.additionalImages || ep.images || [ep.thumbnail],
                    marketStats: ep.stats || null,
                    category: ep.categoryId || '',
                    description: ep.description || ''
                }));
                setLoading(false);
                return;
            }

            // Case B: Product passed via Supplier Extraction (New Listing Vector)
            if (location.state?.importedProduct) {
                const ip = location.state.importedProduct;
                console.log("[STUDIO HYDRATION] Ingesting Supplier Vector:", ip);
                
                // 🧠 AUTO-TAXONOMY: Match primary category based on title
                const matchedId = matchPrimaryCategory(ip.title);
                const matchedCat = PRIMARY_CATEGORIES.find(c => c.id === matchedId);
                
                if (matchedCat) {
                    setCategoryStack([{ id: matchedCat.id, name: matchedCat.name, level: 0 }]);
                    fetchChildren(matchedId); // Warm up the sub-category engine
                }

                setOriginalProduct({
                    title: ip.title,
                    price: ip.pricing.selectedVariantPrice,
                    images: ip.images,
                    description: ip.description
                });

                setRegistry(prev => ({
                    ...prev,
                    selectedTitle: ip.title,
                    price: ip.pricing.selectedVariantPrice,
                    supplierCost: ip.pricing.totalCost,
                    images: ip.images,
                    description: ip.description,
                    optimizedDescription: ip.description,
                    category: matchedId || '', 
                }));

                addSystemLog("Supplier extraction node ingested successfully.", 'success');
                setLoading(false);

                // 🔥 AUTO-SWEEP (Step 4): Trigger AI Optimization immediately for new imports
                setTimeout(() => runFullOptimization(), 1000);
                return;
            }

            // Case C: Direct navigation with ID (Fetch from eBay API - Revision Flow)
            if (id && id !== 'new') {
                const product = await ebayService.getProductById(id);
                setOriginalProduct(product);
                const r = sourcingService.rankProduct(product);
                setRank(r);
                
                setRegistry(prev => ({
                    ...prev,
                    selectedTitle: product.title || "",
                    price: product.price || 0,
                    images: product.additionalImages || product.images || [],
                    category: product.categoryId || '',
                    description: product.description || ''
                }));
            }
        } catch (e) {
            console.error("Studio Hydration Fault:", e);
        } finally {
            setLoading(false);
        }
    };
    hydrateStudio();
  }, [id, location.state]);

  const fetchChildren = async (parentId) => {
    setCategoryLoading(true);
    try {
        const subs = await ebayService.getSubCategories(parentId);
        setCurrentLevelLevels(subs);
    } catch (e) {
        toast.error("Taxonomy node retrieval failed.");
    } finally {
        setCategoryLoading(false);
    }
  };

  const handleCategorySelect = async (cat) => {
    const newStack = [...categoryStack, { id: cat.id, name: cat.name, level: categoryStack.length }];
    setCategoryStack(newStack);
    if (!cat.isLeaf) {
        fetchChildren(cat.id);
    } else {
        setCurrentLevelLevels([]);
        addSystemLog(`Terminal category leaf locked: ${cat.name}`, 'success');
    }
  };

  const popCategory = (index) => {
    const newStack = categoryStack.slice(0, index + 1);
    setCategoryStack(newStack);
    fetchChildren(newStack[newStack.length - 1].id);
  };

  // Phase 2: Optimization Engine
  const runFullOptimization = async () => {
    setIsProcessing(true);
    addSystemLog("SaaS Intelligence Analysis started...", 'info');
    try {
      const keyword = registry.selectedTitle.split(' ').slice(0, 4).join(' ');
      const competitors = await ebayService.getCompetitorInsights(keyword);
      
      const opt = await aiService.optimizeListing(registry.selectedTitle, registry.price, competitors);
      
      setRegistry(prev => ({
        ...prev,
        titles: opt.titles || [],
        optimizedDescription: opt.description,
        tags: opt.tags || [],
        suggestedPrice: opt.pricing?.suggested || prev.price,
        competition: opt.pricing?.competition || 'Medium',
        probability: opt.pricing?.salesProbability || 75,
        marketStats: competitors.stats || null
      }));
      
      addSystemLog("Optimization vectors locked and validated.", 'success');
    } catch (e) {
      addSystemLog(`AI Sync Failure: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePushToStore = async () => {
    const currentCat = categoryStack[categoryStack.length - 1];
    
    // 🧱 ENFORCEMENT: Category is Mandatory for New Listings
    if (id === 'new' && (!currentCat || !currentCat.id)) {
        toast.error("eBay requires a primary category for new listings.");
        setActiveTab('logistics'); // Switch to category tab
        return;
    }

    setIsDeploying(true);
    const toastId = toast.loading(id === 'new' ? "Initial Node Deployment..." : "Broadcasting Registry Update...");
    
    try {
        const token = user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN;
        const activeImages = registry.images.filter(img => !registry.excludedImages.includes(img));

        const itemPayload = {
            title: registry.selectedTitle,
            price: registry.price,
            description: registry.optimizedDescription || registry.description,
            categoryId: currentCat?.id || registry.category,
            images: activeImages
        };

        if (id === 'new') {
            console.log("[PRODUCTION DEPLOY] Initiating AddItem call for new listing:", itemPayload);
            const result = await ebayTrading.publishItem(itemPayload, token);
            
            // Extract New Item ID from XML Response
            const itemIdMatch = result.match(/<ItemID>(.*?)<\/ItemID>/);
            const newId = itemIdMatch ? itemIdMatch[1] : 'unknown';
            
            toast.success("Product successfully materialized on eBay.");
            addSystemLog(`Deployment successful. New Item ID: ${newId}`, 'success');
            
            // Redirect to the newly created product node (Revision path)
            setTimeout(() => navigate(`/optimize-product/${newId}`), 2000);
        } else {
            console.log("[PRODUCTION UPDATE] Initiating ReviseItem call for node:", id);
            await ebayTrading.reviseItem(token, id, itemPayload);
            toast.success("Production update confirmed.");
            addSystemLog("Node successfully updated on eBay.", 'success');
        }
    } catch (e) {
        console.error("eBay Deployment Fault:", e);
        toast.error(`Broadcast failed: ${e.message}`);
        addSystemLog(`Deployment failure: ${e.message}`, 'error');
    } finally {
        setIsDeploying(false);
        toast.dismiss(toastId);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="animate-spin text-slate-200" size={64} strokeWidth={1} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Hydrating SaaS Environment...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto font-inter">
      
      <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Zap size={32} className="text-primary-400" />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Optimization Studio.</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Status: Stable Connectivity Node {id}</p>
           </div>
        </div>
        <button 
            disabled={isDeploying}
            onClick={handlePushToStore}
            className="bg-slate-950 text-white h-14 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl"
        >
            {isDeploying ? <RefreshCw className="animate-spin" size={16} /> : <Globe size={16} />}
            Push to Production
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        <div className="xl:col-span-3 space-y-8">
           
           <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm w-fit">
              {[
                { id: 'intelligence', label: 'Market Intelligence', icon: Activity },
                { id: 'visual', label: 'Visual Forge', icon: Camera },
                { id: 'logistics', label: 'Taxonomy & Price', icon: DollarSign },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    activeTab === tab.id ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
           </div>

           {activeTab === 'intelligence' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                
                {/* 1. Title Archetype Matrix */}
                <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Type size={16} className="text-primary-500" /> Archetype Title Matrix
                      </h3>
                      <button onClick={runFullOptimization} className="p-2.5 bg-slate-50 text-slate-400 rounded-lg hover:text-primary-500 transition-all">
                        <RefreshCw size={16} className={cn(isProcessing && "animate-spin")} />
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                      <button 
                         onClick={() => setRegistry(prev => ({ ...prev, selectedTitle: originalProduct?.title }))}
                         className={cn(
                           "flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left",
                           registry.selectedTitle === originalProduct?.title ? "border-slate-950 bg-slate-50" : "border-slate-50 hover:border-slate-100"
                         )}
                      >
                         <div className="flex items-center gap-4">
                            <div className={cn("w-5 h-5 rounded-full border-4 transition-all", registry.selectedTitle === originalProduct?.title ? "border-slate-950 bg-white" : "border-slate-200")} />
                            <p className="text-xs font-bold text-slate-900">{originalProduct?.title}</p>
                         </div>
                         <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Baseline</span>
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {registry.titles.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setRegistry(prev => ({ ...prev, selectedTitle: t.title }))}
                            className={cn(
                              "flex flex-col gap-4 p-6 rounded-2xl border-2 transition-all text-left relative",
                              registry.selectedTitle === t.title ? "border-slate-950 bg-white shadow-xl shadow-slate-900/5 scale-[1.02] z-10" : "border-slate-50 bg-white hover:border-slate-100"
                            )}
                          >
                             <div className="flex items-center justify-between">
                                <div className={cn("w-5 h-5 rounded-full border-4", registry.selectedTitle === t.title ? "border-slate-950 bg-white" : "border-slate-100")} />
                                <span className={cn(
                                    "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                                    t.type === 'SEO' ? 'bg-blue-50 text-blue-600' : 
                                    t.type === 'Benefit' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                )}>{t.type}</span>
                             </div>
                             <p className="text-[11px] font-bold leading-relaxed text-slate-950">{t.title}</p>
                          </button>
                        ))}
                        {isProcessing && Array(3).fill(0).map((_, i) => <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse" />)}
                      </div>
                   </div>
                </div>

                {/* 2. Real Market Pulse */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Activity size={16} className="text-primary-500" /> Market Real-Time Heatmap
                      </h3>
                      {!registry.marketStats ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center gap-3">
                            <AlertCircle className="text-slate-300" size={32} />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Market telemetry not available for this node</p>
                            <button onClick={runFullOptimization} className="mt-2 text-[9px] font-black text-primary-500 uppercase underline">Retry Vector</button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <div className="p-5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Marketplace Price</p>
                                 <p className="text-2xl font-black text-slate-950 tabular-nums">${registry.marketStats.avg}</p>
                              </div>
                              <DollarSign className="text-slate-200" size={32} />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                 <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Low Bound</p>
                                 <p className="text-lg font-black text-slate-900">${registry.marketStats.min}</p>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">High Bound</p>
                                 <p className="text-lg font-black text-slate-900">${registry.marketStats.max}</p>
                              </div>
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Tag size={16} className="text-primary-500" /> Context-Bound Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                         {registry.tags.map((tg, i) => (
                           <div key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                              {tg.text}
                              <X size={10} className="hover:text-rose-500 cursor-pointer" onClick={() => setRegistry(p => ({ ...p, tags: p.tags.filter(t => t.text !== tg.text) }))} />
                           </div>
                         ))}
                         {registry.tags.length === 0 && !isProcessing && <p className="text-[9px] font-black text-slate-300 uppercase italic py-8 text-center w-full">No derivative tags generated</p>}
                      </div>
                      <button onClick={runFullOptimization} className="w-full h-10 border border-dashed border-slate-200 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all">Regenerate Keywords</button>
                   </div>
                </div>

                {/* 3. Description Output */}
                <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                          <Box size={16} className="text-primary-500" /> Professional Copy Staging
                        </h3>
                        <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase flex items-center gap-2">
                            <Shield size={10} /> Validated Output
                        </div>
                    </div>
                    <div className="p-2 min-h-[400px]">
                        <ReactQuill theme="snow" value={registry.optimizedDescription || registry.description} onChange={(val) => setRegistry(p => ({ ...p, optimizedDescription: val }))} className="h-full border-none" />
                    </div>
                </div>
             </div>
           )}

           {activeTab === 'visual' && (
             <div className="space-y-12 animate-in zoom-in-95 duration-500">
                <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                       <div className="space-y-1">
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tighter">AI Visual Studio</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Nano Banana 8-Image Synthesis Pipeline</p>
                       </div>
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><Sparkles size={24} /></div>
                    </div>
                    
                    <NanoBanana 
                      product={originalProduct} 
                      onGallerySync={(newImages) => setRegistry(prev => ({ ...prev, images: [...prev.images, ...newImages] }))} 
                    />
                </section>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {registry.images.map((img, i) => (
                      <div key={i} className={cn("group relative rounded-[1.5rem] aspect-square overflow-hidden border-2 transition-all shadow-md hover:shadow-xl", registry.excludedImages.includes(img) ? "opacity-30 grayscale border-slate-200" : "border-white")}>
                         <img src={img} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all p-4">
                            <button onClick={() => setRegistry(p => ({ ...p, excludedImages: p.excludedImages.includes(img) ? p.excludedImages.filter(x => x !== img) : [...p.excludedImages, img] }))} className="w-full bg-white text-slate-950 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest">
                                {registry.excludedImages.includes(img) ? "Restore" : "Remove"}
                            </button>
                         </div>
                      </div>
                    ))}
                    <div className="aspect-square bg-slate-100 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 text-slate-300 border border-dashed border-slate-200 group cursor-pointer hover:bg-slate-200/50 hover:text-slate-500 transition-all">
                        <ImageIcon size={32} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Add Node</span>
                    </div>
                </div>
             </div>
           )}

           {activeTab === 'logistics' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                
                {/* Full Depth Taxonomy Engine */}
                <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-8">
                   <div className="flex items-center justify-between">
                       <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Layers size={16} className="text-primary-500" /> High-Resolution Taxonomy Depth
                       </h3>
                   </div>

                   <div className="flex flex-wrap gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        {categoryStack.map((cat, i) => (
                            <div key={cat.id} className="flex items-center gap-4 group">
                                <button 
                                    onClick={() => popCategory(i)}
                                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-900 uppercase tracking-widest hover:border-slate-950 transition-all shadow-sm"
                                >
                                    {cat.name}
                                </button>
                                {i < categoryStack.length - 1 && <ChevronRight className="text-slate-300" size={14} />}
                            </div>
                        ))}
                        {categoryLoading && <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse"><RefreshCw className="animate-spin" size={12} /> Syncing Node...</div>}
                   </div>

                   {currentLevelLevels.length > 0 && (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                           {currentLevelLevels.map(cat => (
                               <button 
                                   key={cat.id}
                                   onClick={() => handleCategorySelect(cat)}
                                   className="p-4 text-left bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 hover:border-slate-950 hover:text-slate-950 transition-all hover:shadow-sm flex items-center justify-between group"
                               >
                                   <span className="truncate">{cat.name}</span>
                                   {!cat.isLeaf && <ChevronRight size={14} className="text-slate-200 group-hover:text-slate-950" />}
                               </button>
                           ))}
                       </div>
                   )}
                </div>

                <div className="space-y-12">
                   <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-8">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                           <DollarSign size={16} className="text-primary-500" /> Procurement Logistics
                         </h3>
                      </div>
                      <div className="flex flex-col md:flex-row gap-8 items-end">
                         <div className="flex-1 space-y-4">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Supplier Sourcing Cost (USD)</label>
                            <div className="relative">
                               <input 
                                 type="number" step="0.01" value={registry.supplierCost} 
                                 onChange={(e) => setRegistry(p => ({ ...p, supplierCost: parseFloat(e.target.value) || 0 }))}
                                 className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-2xl font-black text-slate-900 outline-none focus:border-primary/50 transition-all"
                               />
                               <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Input Node</div>
                            </div>
                         </div>
                         <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                            <Shield size={16} className="text-emerald-500" />
                            <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-tight">Sourcing Logic Active</p>
                         </div>
                      </div>
                   </div>

                   <ProfitMaximizer 
                     product={{...originalProduct, price: registry.price, categoryId: registry.category}} 
                     supplierCost={registry.supplierCost}
                     onPriceChange={(newPrice, intel) => {
                       setRegistry(p => ({ 
                         ...p, 
                         price: newPrice, 
                         suggestedPrice: parseFloat(intel.suggestedPrice),
                         probability: parseInt(intel.probability === 'High' ? 95 : (intel.probability === 'Medium' ? 70 : 40))
                       }));
                     }}
                   />
                </div>
             </div>
           )}
        </div>

        {/* Intelligence Telemetry Sidebar */}
        <div className="space-y-8">
            {/* AI INTELLIGENCE DEEP DIVE PANEL */}
            {rank && (
                <section className="bg-slate-950 p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:scale-150 transition-all duration-1000" />
                    <div className="relative z-10 flex items-center justify-between mb-2">
                       <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Winner Intelligence</h4>
                       <div className="px-3 py-1 bg-primary-500 text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">{rank.score}% Score</div>
                    </div>
                    <div className="relative z-10 space-y-6">
                        <p className="text-sm font-bold leading-tight text-white/90">
                            {sourcingService.getExplanation(rank)}
                        </p>
                        <div className="space-y-5 pt-4 border-t border-white/5">
                            {sourcingService.getDeepDive(rank).signals.map((s, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{s.label} ({s.weight})</span>
                                        <span className="text-[10px] font-bold text-primary-400">{s.value}%</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${s.value}%` }}
                                          className="h-full bg-primary-500" 
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-500 italic uppercase leading-none">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

           <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm text-center space-y-10">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Production Confidence</h3>
              <div className="relative flex justify-center h-48 items-center">
                  <svg className="w-40 h-40 transform -rotate-90">
                      <circle cx="80" cy="80" r="70" className="stroke-slate-50 fill-none" strokeWidth="12" />
                      <circle 
                        cx="80" cy="80" r="70" 
                        className="stroke-slate-950 fill-none transition-all duration-1000 ease-out" 
                        strokeWidth="12" 
                        strokeDasharray={439.82}
                        strokeDashoffset={439.82 - (439.82 * (registry.probability / 100))} 
                        strokeLinecap="round"
                      />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-slate-950 italic tracking-tighter">{registry.probability}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">SaaS Index</span>
                  </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-500 leading-relaxed italic">
                 "This listing vector is currently indexed at {registry.probability}% effectiveness relative to market competitors."
              </div>
           </div>

           <div className="bg-slate-950 p-8 rounded-[1.5rem] text-white shadow-xl relative overflow-hidden">
               <h3 className="text-[9px] font-black uppercase tracking-[0.4em] mb-8 opacity-30 italic">Protocol Log Stream</h3>
               <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar font-mono text-[9px]">
                  {systemLogs.map((log, i) => (
                    <div key={i} className={cn(
                        "flex gap-4 p-2 rounded-lg border-l-2 transition-all",
                        log.type === 'error' ? 'text-rose-400 border-rose-500 bg-rose-500/5' : 
                        log.type === 'success' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5' : 'text-slate-400 border-white/10'
                    )}>
                       <span className="font-medium tracking-tight whitespace-pre-wrap">{log.message}</span>
                    </div>
                  ))}
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizeProduct;
