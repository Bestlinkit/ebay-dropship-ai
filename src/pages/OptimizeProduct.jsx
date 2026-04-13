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
  X
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import aiService from '../services/ai';
import ebayService from '../services/ebay';
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
  const { ebayProduct } = location.state || {};

  const [loading, setLoading] = useState(!ebayProduct);
  const [product, setProduct] = useState(ebayProduct || { title: "", price: 0, images: [], description: "" });

  // Core Product Object Model (Unified Registry)
  const [registry, setRegistry] = useState({
    originalTitle: ebayProduct?.title || "",
    selectedTitle: ebayProduct?.title || "",
    categoryId: null,
    categoryName: "",
    subCategories: [],
    selectedSubId: null,
    description: ebayProduct?.description || "",
    optimizedDescription: "",
    tags: [],
    images: ebayProduct?.images || [],
    excludedImages: [],
    price: ebayProduct?.price || 0,
    suggestedPrice: 0,
    margin: "0%",
    competition: "Low",
    probability: 0,
    stats: { min: 0, max: 0, avg: 0 }
  });

  // UI States
  const [activeTab, setActiveTab] = useState('intelligence');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [titles, setTitles] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  
  // Nano Banana Engine
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualProgress, setVisualProgress] = useState({ current: 0, total: 4 });
  const [generatedImages, setGeneratedImages] = useState([]);

  const addSystemLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [{ timestamp, message, type }, ...prev].slice(0, 30));
  };

  // Phase 1: Deep Hydration & Taxonomy Entry
  useEffect(() => {
    const hydrate = async () => {
      setLoading(true);
      try {
        addSystemLog(`Syncing node ${id}...`, 'info');
        const fetched = await ebayService.getProductById(id);
        if (fetched) {
          const primaryId = matchPrimaryCategory(fetched.title);
          const catName = PRIMARY_CATEGORIES.find(c => c.id === primaryId)?.name || 'Marketplace General';
          
          setRegistry(prev => ({
            ...prev,
            ...fetched,
            originalTitle: fetched.title,
            selectedTitle: fetched.title,
            categoryId: primaryId,
            categoryName: catName,
            images: fetched.images || []
          }));
          
          addSystemLog(`Node matched to: ${catName}`, 'success');
        }
      } catch (e) {
        addSystemLog(`Registry fault: ${e.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, [id]);

  // Phase 2: Intelligence Generation
  useEffect(() => {
    if (registry.originalTitle && titles.length === 0) {
      runFullOptimization();
    }
  }, [registry.originalTitle]);

  const runFullOptimization = async () => {
    setIsProcessing(true);
    addSystemLog("Neural analysis initiated...", 'info');
    try {
      // 1. Market Comparison
      const competitors = await ebayService.getCompetitorInsights(registry.originalTitle);
      
      // 2. AI Optimization
      const opt = await aiService.optimizeListing(registry.originalTitle, registry.price, competitors);
      
      setTitles(opt.titles || []);
      setRegistry(prev => ({
        ...prev,
        optimizedDescription: opt.description,
        tags: opt.tags || [],
        suggestedPrice: opt.pricing?.suggested || prev.price,
        margin: opt.pricing?.estimatedMargin || '15%',
        competition: opt.pricing?.competition || 'Medium',
        probability: opt.pricing?.salesProbability || 75,
        stats: competitors.stats || { min: 0, max: 0, avg: 0 }
      }));
      
      addSystemLog("Market intelligence vectors calculated.", 'success');
    } catch (e) {
      addSystemLog(`AI Sync Failure: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePushToStore = async () => {
    setIsDeploying(true);
    const toastId = toast.loading("Broadcasting Registry Update...");
    try {
        const token = user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN;
        await ebayTrading.reviseItem(token, id, {
            title: registry.selectedTitle,
            price: registry.price,
            description: registry.optimizedDescription || registry.description,
            images: registry.images.filter(img => !registry.excludedImages.includes(img))
        });
        toast.dismiss(toastId);
        toast.success("Registry update confirmed by eBay server.");
        addSystemLog("Node successfully deployed.", 'success');
    } catch (e) {
        toast.dismiss(toastId);
        toast.error(`Broadcast failed: ${e.message}`);
    } finally {
        setIsDeploying(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="animate-spin text-slate-200" size={64} strokeWidth={1} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Hydrating Optimization Environment...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto">
      
      {/* SaaS Studio Header */}
      <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Zap size={32} className="text-primary-400" />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Optimization Studio.</h1>
              <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-black text-slate-400 underline decoration-primary-500 decoration-2 underline-offset-4 uppercase tracking-widest">Listing Node: {id}</span>
              </div>
           </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                disabled={isDeploying}
                onClick={handlePushToStore}
                className="bg-slate-950 text-white h-14 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl shadow-slate-950/20"
            >
                {isDeploying ? <RefreshCw className="animate-spin" size={16} /> : <Globe size={16} />}
                Deploy to Marketplace
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Workspace: Bento Sections */}
        <div className="xl:col-span-3 space-y-8">
           
           <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm w-fit">
              {[
                { id: 'intelligence', label: 'Market Intelligence', icon: Activity },
                { id: 'visual', label: 'Visual Forge', icon: Camera },
                { id: 'logistics', label: 'Logistics & Price', icon: DollarSign },
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
             <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                
                {/* Section A: Title Matrix */}
                <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Type size={16} className="text-primary-500" /> Neural SEO Title Matrix
                      </h3>
                      <button onClick={runFullOptimization} className="p-2.5 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-950 transition-all">
                        <RefreshCw size={16} className={cn(isProcessing && "animate-spin")} />
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                      {/* Original Option */}
                      <button 
                         onClick={() => setRegistry(prev => ({ ...prev, selectedTitle: registry.originalTitle }))}
                         className={cn(
                           "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group",
                           registry.selectedTitle === registry.originalTitle ? "border-slate-950 bg-slate-50" : "border-slate-50 hover:border-slate-100"
                         )}
                      >
                         <div className={cn("w-5 h-5 rounded-full border-4 shrink-0 transition-all", registry.selectedTitle === registry.originalTitle ? "border-slate-950 bg-white" : "border-slate-200")} />
                         <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Baseline Listing</p>
                            <p className="text-sm font-bold text-slate-900">{registry.originalTitle}</p>
                         </div>
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {titles.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setRegistry(prev => ({ ...prev, selectedTitle: t.title }))}
                            className={cn(
                              "flex flex-col gap-4 p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                              registry.selectedTitle === t.title ? "border-primary-500 bg-primary-50/20" : "border-slate-50 bg-white hover:border-slate-100"
                            )}
                          >
                            <div className="flex items-center justify-between relative z-10">
                               <div className={cn("w-5 h-5 rounded-full border-4 transition-all", registry.selectedTitle === t.title ? "border-primary-500 bg-white" : "border-slate-100")} />
                               <div className="px-2 py-1 bg-primary-100 text-primary-600 rounded text-[9px] font-black">{t.score}% Score</div>
                            </div>
                            <p className={cn("text-xs font-bold leading-relaxed relative z-10", registry.selectedTitle === t.title ? "text-slate-950" : "text-slate-400")}>{t.title}</p>
                          </button>
                        ))}
                        {titles.length === 0 && Array(3).fill(0).map((_, i) => <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />)}
                      </div>
                   </div>
                </div>

                {/* Section B: Category Engine */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Layers size={16} className="text-primary-500" /> Taxonomy Matcher
                      </h3>
                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-500"><Box size={24} /></div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Proposed Match</p>
                            <h4 className="text-sm font-black text-slate-900 uppercase truncate">{registry.categoryName}</h4>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Advanced Manual Override</p>
                         <div className="relative">
                            <select 
                                value={registry.categoryId || ''}
                                onChange={(e) => setRegistry(prev => ({ 
                                    ...prev, 
                                    categoryId: e.target.value,
                                    categoryName: PRIMARY_CATEGORIES.find(c => c.id == e.target.value)?.name || ''
                                }))}
                                className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-[11px] font-bold outline-none appearance-none focus:ring-2 focus:ring-slate-950/10 transition-all cursor-pointer"
                            >
                                {PRIMARY_CATEGORIES.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={14} />
                         </div>
                      </div>
                   </div>

                   <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Tag size={16} className="text-primary-500" /> Keyword Cloud
                      </h3>
                      <div className="flex flex-wrap gap-2">
                         {registry.tags.map((tg, i) => (
                           <div key={i} className="group px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-slate-950 hover:text-white transition-all cursor-pointer shadow-sm">
                              {tg.text}
                              <button onClick={() => setRegistry(prev => ({ ...prev, tags: prev.tags.filter(t => t.text !== tg.text) }))}>
                                <X size={10} className="opacity-40 group-hover:opacity-100" />
                              </button>
                           </div>
                         ))}
                         {registry.tags.length === 0 && !isProcessing && <div className="p-8 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest italic w-full">No keywords staged</div>}
                      </div>
                      <button onClick={runFullOptimization} className="w-full h-10 border border-dashed border-slate-200 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:border-slate-900 hover:text-slate-900 transition-all">
                        Regenerate Cloud Vector
                      </button>
                   </div>
                </div>

                {/* Section C: Description Studio */}
                <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                          <Box size={16} className="text-primary-500" /> Neural Copy Staging
                        </h3>
                        <div className="flex items-center gap-4 text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">
                           <span>SaaS Guard: Image Content Stripped</span>
                           <CheckCircle size={14} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-100">
                      <div className="p-6">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4">Original Broadcast Link</p>
                        <div className="prose prose-sm max-h-[400px] overflow-y-auto no-scrollbar opacity-30 pointer-events-none" dangerouslySetInnerHTML={{ __html: registry.description }} />
                      </div>
                      <div className="p-6 bg-slate-50/30">
                        <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest mb-4">Optimized Output Staging</p>
                        <div className="bg-white rounded-xl border border-slate-200 p-2 min-h-[400px]">
                           <ReactQuill theme="snow" value={registry.optimizedDescription || registry.description} onChange={(val) => setRegistry(p => ({ ...p, optimizedDescription: val }))} className="h-full border-none" />
                        </div>
                      </div>
                    </div>
                </div>

             </div>
           )}

           {activeTab === 'visual' && (
             <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <div className="bg-slate-950 p-10 rounded-[1.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                       <div className="space-y-2">
                          <h3 className="text-3xl font-black italic tracking-tighter flex items-center gap-4">
                            <Sparkles className="text-primary-400" size={32} /> NANO BANANA XL
                          </h3>
                          <p className="text-slate-400 font-bold tracking-widest uppercase text-[9px]">Neural Image Synthesis Logic</p>
                       </div>
                       <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit backdrop-blur-md">
                          <button onClick={() => runFullOptimization()} className="bg-primary-500 text-slate-950 px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-500/20 flex items-center gap-2">
                             {visualLoading ? <RefreshCw className="animate-spin" size={12} /> : <Zap size={12} />}
                             Synthesize Variations (0/4)
                          </button>
                       </div>
                    </div>
                    {/* Visual Progress Skeleton Layer */}
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                       {Array(4).fill(0).map((_, i) => (
                         <div key={i} className="aspect-square bg-white/5 border border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center gap-3">
                            <ImageIcon className="text-white/10" size={32} />
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">Awaiting Synapse</p>
                         </div>
                       ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {registry.images.map((img, i) => (
                      <div key={i} className={cn("group relative rounded-[1.5rem] aspect-square overflow-hidden border-2 transition-all shadow-md hover:shadow-xl", registry.excludedImages.includes(img) ? "opacity-30 grayscale border-slate-200" : "border-white")}>
                         <img src={img} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all p-4 gap-2">
                            <button onClick={() => setRegistry(p => ({ ...p, excludedImages: p.excludedImages.includes(img) ? p.excludedImages.filter(x => x !== img) : [...p.excludedImages, img] }))} className="w-full bg-white text-slate-950 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg">
                                {registry.excludedImages.includes(img) ? "Restore Node" : "Discard from Registry"}
                            </button>
                         </div>
                      </div>
                    ))}
                </div>
             </div>
           )}

           {activeTab === 'logistics' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-12">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                      <div className="space-y-10 flex-1">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 italic">Registry Price Set ($)</p>
                            <div className="flex items-center gap-6 border-b-4 border-slate-100 pb-3 focus-within:border-slate-950 transition-all">
                                <span className="text-3xl font-black text-slate-300 italic shrink-0">$</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={registry.price} 
                                    onChange={(e) => setRegistry(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                                    className="bg-transparent text-6xl font-black text-slate-950 w-full outline-none tracking-tighter" 
                                />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-5 bg-slate-950 text-white rounded-2xl flex flex-col gap-1 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={40} className="text-primary-400" /></div>
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">AI Target Pivot</span>
                                <span className="text-xl font-black italic tracking-tight">${registry.suggestedPrice}</span>
                                <button onClick={() => setRegistry(p => ({ ...p, price: registry.suggestedPrice }))} className="mt-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Apply Vector</button>
                             </div>
                             <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Market Midpoint</span>
                                <span className="text-xl font-black italic tracking-tight text-slate-950">${registry.stats.avg || '0.00'}</span>
                                <button onClick={() => setRegistry(p => ({ ...p, price: registry.stats.avg }))} className="mt-3 py-2 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Sync to Avg</button>
                             </div>
                          </div>
                      </div>

                      <div className="w-full md:w-80 space-y-4">
                         <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div className="space-y-0.5">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Profit Margin</p>
                               <p className="text-xl font-black text-emerald-500">{registry.margin}</p>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500"><Percent size={20} /></div>
                         </div>
                         <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div className="space-y-0.5">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Competition Level</p>
                               <p className="text-xl font-black text-slate-900 uppercase italic">{registry.competition}</p>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400"><Monitor size={20} /></div>
                         </div>
                         <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div className="space-y-0.5">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sales Probability</p>
                               <p className="text-xl font-black text-slate-950">{registry.probability}%</p>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-500"><Activity size={20} /></div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Intelligence Telemetry Sidebar */}
        <div className="xl:col-span-1 space-y-8">
           
           <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm text-center space-y-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Listing Production Health</h3>
              <div className="relative flex justify-center py-4">
                  <svg className="w-40 h-40 transform -rotate-90">
                      <circle cx="80" cy="80" r="70" className="stroke-slate-50 fill-none" strokeWidth="12" />
                      <circle 
                        cx="80" cy="80" r="70" 
                        className="stroke-emerald-500 fill-none transition-all duration-1000 ease-out" 
                        strokeWidth="12" 
                        strokeDasharray={439.82}
                        strokeDashoffset={439.82 - (439.82 * (registry.probability / 100))} 
                        strokeLinecap="round"
                      />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-slate-950 tracking-tighter italic">{registry.probability}</span>
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">Health Index</span>
                  </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5 opacity-60">Neural Verdict</p>
                  <p className="text-[11px] font-bold leading-relaxed italic text-slate-600">"This listing node is currently indexed at {registry.probability}% effectiveness relative to market competitors."</p>
              </div>
           </div>

           <div className="bg-slate-950 p-8 rounded-[1.5rem] text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform rotate-12"><Terminal size={80} className="text-primary-400" /></div>
               <h3 className="text-[9px] font-black uppercase tracking-[0.4em] mb-8 opacity-30 italic">Protocol Stream</h3>
               <div className="space-y-6 max-h-[400px] overflow-y-auto no-scrollbar font-mono text-[9px]">
                  {systemLogs.map((log, i) => (
                    <div key={i} className={cn(
                        "flex gap-4 p-2 rounded-lg border-l-2 transition-all",
                        log.type === 'error' ? 'text-rose-400 border-rose-500 bg-rose-500/5' : 
                        log.type === 'success' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5' : 'text-slate-400 border-white/10'
                    )}>
                       <span className="opacity-20 flex-shrink-0">[{log.timestamp}]</span>
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
