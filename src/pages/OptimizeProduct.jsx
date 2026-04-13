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
  Monitor
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import aiService from '../services/ai';
import ebayService from '../services/ebay';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import ebayTrading from '../services/ebay_trading';
import { cn } from '../lib/utils';

const OptimizeProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isStoreConnected, user } = useAuth();
  const { ebayProduct } = location.state || {};

  const [loading, setLoading] = useState(!ebayProduct);
  const [product, setProduct] = useState(ebayProduct || { title: "", price: 0, images: [], description: "" });

  // Optimization States
  const [titles, setTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [tags, setTags] = useState([]);
  const [pricingStrategy, setPricingStrategy] = useState("");
  const [aiVerdict, setAiVerdict] = useState("Awaiting analysis...");
  const [competitorData, setCompetitorData] = useState([]);
  
  // Official Category Taxonomy
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSearchingCategories, setIsSearchingCategories] = useState(false);

  const [activeTab, setActiveTab] = useState('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  
  // Nano Banana Engine
  const [visualMood, setVisualMood] = useState("primary");
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualProgress, setVisualProgress] = useState(0);
  const [visualStatus, setVisualStatus] = useState("Idle");
  const [generatedImages, setGeneratedImages] = useState([]);
  const [referenceImage, setReferenceImage] = useState(null);
  const [maintainedImages, setMaintainedImages] = useState([]);
  const [primaryImage, setPrimaryImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [systemLogs, setSystemLogs] = useState([]);
  const addSystemLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [{ timestamp, message, type }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const hydrate = async () => {
        if (id) {
            setLoading(true);
            try {
                addSystemLog(`Standard Handshake: Fetching production details for ${id}`, 'info');
                const fetchedProduct = await ebayService.getProductById(id);
                if (fetchedProduct) {
                    setProduct(fetchedProduct);
                    setPrice(fetchedProduct.price || 0);
                    setDescription(fetchedProduct.description);
                    
                    const baselineImages = fetchedProduct.images || [];
                    setMaintainedImages(baselineImages);
                    if (baselineImages.length > 0) {
                        setReferenceImage(baselineImages[0]);
                        setPrimaryImage(baselineImages[0]);
                    }
                    addSystemLog(`Payload Sync Successful. Found ${baselineImages.length} production images.`, 'success');
                }
            } catch (err) {
                addSystemLog(`Critical Failure: ${err.message}`, 'error');
                toast.error("Deep Synchronization Failed.");
            } finally {
                setLoading(false);
            }
        }
    };
    hydrate();
  }, [id]);

  useEffect(() => {
    if (product?.title && product.title !== "" && titles.length === 0) {
        runOptimization();
    }
  }, [product?.title]);

  const runOptimization = async () => {
    setIsProcessing(true);
    addSystemLog("Initializing Neural Engine V2.0...", 'info');
    try {
      const insights = await ebayService.getCompetitorInsights(product.title);
      setCompetitorData(insights || []);
      
      const optimization = await aiService.optimizeListing(product.title, price || product.price, insights);
      setTitles(optimization.titles || []);
      setSelectedTitle(optimization.titles?.[0]?.title || product.title);
      setDescription(optimization.description || product.description);
      setTags(optimization.tags || []);
      setPricingStrategy(optimization.pricingStrategy || "");
      setAiVerdict(optimization.aiVerdict || "Optimal Ready.");
      
      addSystemLog("Optimization vectors calculated successfully.", 'success');
    } catch (error) {
        addSystemLog(`AI Hub Offline: ${error.message}`, 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  const searchCategories = async (q) => {
    if (!q || q.length < 3) return;
    setIsSearchingCategories(true);
    try {
        const results = await ebayService.getCategorySuggestions(q);
        setCategorySuggestions(results);
    } catch (e) {
        toast.error("Category search failed.");
    } finally {
        setIsSearchingCategories(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!referenceImage) return toast.error("Select Reference Object.");
    setVisualLoading(true);
    setVisualProgress(0);
    
    const sequence = [
        { progress: 15, msg: "Analyzing Texture & Form" },
        { progress: 40, msg: "Synthesizing Neural Vibe" },
        { progress: 75, msg: "Applying Production Style" },
        { progress: 95, msg: "Finalizing XL Variations" }
    ];

    try {
      for(const step of sequence) {
          setVisualStatus(step.msg);
          setVisualProgress(step.progress);
          await new Promise(r => setTimeout(r, 600));
      }
      
      const variations = await aiService.generateProductImageVariations(referenceImage, selectedTitle, visualMood);
      setGeneratedImages(variations);
      setVisualProgress(100);
      setVisualStatus("Complete");
      addSystemLog(`Visual Studio: ${variations.length} professional variations rendered.`, 'success');
    } catch (error) {
      toast.error("Visual Studio error.");
    } finally {
      setTimeout(() => setVisualLoading(false), 500);
    }
  };

  const handlePushToStore = async () => {
    const toastId = toast.loading(`Broadcasting Production Payload...`);
    try {
        if (isStoreConnected) {
            const token = user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN;
            await ebayTrading.reviseItem(token, id, {
                title: selectedTitle,
                price: price,
                description: description,
                images: [primaryImage, ...maintainedImages.filter(i => i !== primaryImage)].filter(Boolean)
            });
        }
        setIsDeployed(true);
        toast.dismiss(toastId);
        toast.success(`Production Listing Broadcasted.`);
    } catch (e) {
        toast.dismiss(toastId);
        toast.error(`Broadcast Failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-[1700px] mx-auto">
      
      {/* Standard Pro Header */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-8">
           <div className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20">
              <Sparkles size={40} />
           </div>
           <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-none">SYSTEM CORE</h1>
              <div className="flex items-center gap-3 mt-3">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Production Mode</span>
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <p className="text-slate-400 font-bold text-xs">ID: {id}</p>
              </div>
           </div>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={handlePushToStore}
                className="bg-slate-900 text-white h-16 px-12 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all flex items-center gap-4"
            >
                Push To eBay Broadcast
                <ArrowRight size={20} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Workspace Column */}
        <div className="xl:col-span-3 space-y-8">
           
           <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-fit sticky top-4 z-[100]">
            {[
              { id: 'text', label: 'Copy & Intelligence', icon: Type },
              { id: 'images', label: 'Visual Studio', icon: Camera },
              { id: 'pricing', label: 'Pricing Matrix', icon: DollarSign },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-8 py-3.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                  activeTab === tab.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'text' && (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
               
               {/* 5-Option Profile Matrix */}
               <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                        <Target className="text-primary" size={20} />
                        Neural SEO Titles
                     </h3>
                     <button onClick={runOptimization} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-primary transition-all">
                        <RefreshCw size={20} className={cn(isProcessing && "animate-spin")} />
                     </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                     {titles.length > 0 ? titles.map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTitle(t.title)}
                          className={cn(
                            "group relative flex items-center justify-between p-7 rounded-[2.5rem] border-2 transition-all text-left",
                            selectedTitle === t.title ? "border-primary bg-primary/5 shadow-inner" : "border-slate-50 bg-white hover:border-slate-100"
                          )}
                        >
                           <div className="flex items-center gap-6">
                              <div className={cn(
                                "w-7 h-7 rounded-full border-[6px] shrink-0 transition-all",
                                selectedTitle === t.title ? "border-primary bg-white" : "border-slate-100 bg-white"
                              )} />
                              <div>
                                 <p className={cn("text-lg font-bold tracking-tight", selectedTitle === t.title ? "text-slate-950" : "text-slate-400")}>{t.title}</p>
                                 <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2 italic">{t.title.length} / 80 Standard Index</p>
                              </div>
                           </div>
                           <div className={cn(
                            "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase text-white shadow-lg",
                            idx === 0 ? "bg-emerald-500" : idx < 3 ? "bg-primary" : "bg-slate-300"
                           )}>
                              {t.rank}% Vector
                           </div>
                        </button>
                     )) : (
                        Array(5).fill(0).map((_, i) => <div key={i} className="h-24 bg-slate-50 rounded-[2rem] animate-pulse" />)
                     )}
                  </div>
               </div>

               {/* Official Taxonomy Search */}
               <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-inner space-y-10">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                        <Globe className="text-primary" size={20} />
                        EBay Standard Category Drill-Down
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="relative group max-w-2xl">
                            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all" size={24} />
                            <input 
                                className="w-full bg-white border border-slate-200 h-20 pl-20 pr-8 rounded-3xl font-black text-lg outline-none focus:border-primary focus:shadow-2xl transition-all shadow-xl shadow-slate-200/50" 
                                placeholder="Search eBay categories (e.g. Skin Care)"
                                value={categoryQuery}
                                onChange={e => {
                                    setCategoryQuery(e.target.value);
                                    searchCategories(e.target.value);
                                }}
                            />
                            {isSearchingCategories && <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-primary" size={24} />}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm max-h-[400px] overflow-y-auto no-scrollbar">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-4 italic">Official Suggestions (Taxonomy API)</p>
                                <div className="space-y-2">
                                    {categorySuggestions.map((cat, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "w-full text-left p-6 rounded-2xl transition-all group",
                                                selectedCategory?.id === cat.id ? "bg-slate-900 text-white shadow-xl" : "hover:bg-slate-50 text-slate-600"
                                            )}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-black">{cat.name}</span>
                                                <span className="text-[10px] font-bold opacity-30">ID: {cat.id}</span>
                                            </div>
                                            <p className={cn("text-[10px] font-medium opacity-50 truncate", selectedCategory?.id === cat.id ? "text-slate-300" : "text-slate-400")}>{cat.ancestors}</p>
                                        </button>
                                    ))}
                                    {categorySuggestions.length === 0 && !isSearchingCategories && <div className="p-12 text-center text-slate-300 font-bold italic">Start typing to see official eBay categories...</div>}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-6">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                        <Layers size={32} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selected Production Path</p>
                                        <h4 className="text-xl font-bold text-slate-950">
                                            {selectedCategory ? selectedCategory.name : "Uncategorized"}
                                        </h4>
                                        <p className="text-xs font-medium text-slate-400 mt-2 px-8 leading-relaxed">
                                            {selectedCategory ? selectedCategory.ancestors : "Choose a path from the suggestions to ensure high-rank indexing."}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Neural Keywords</label>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tg, i) => (
                                            <span key={i} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm">
                                                {tg}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
               </div>

               {/* Professional Description Logic */}
               <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                            <Box className="text-primary" size={28} />
                            Optimal Selling Copy
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">
                           <span>AI Sanitized: Image Tags Purged</span>
                           <CheckCircle size={16} />
                        </div>
                    </div>
                    <div className="bg-white min-h-[500px] p-4 text-slate-900 leading-relaxed font-medium">
                        <ReactQuill theme="snow" value={description} onChange={setDescription} className="h-full border-none" />
                    </div>
               </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-12 animate-in zoom-in-95 duration-500">
               
               {/* Selection Hub - Recovery Architecture */}
               <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform rotate-12">
                      <ImageIcon size={150} />
                  </div>
                  <div className="flex items-center justify-between mb-12">
                      <div>
                          <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Broadcast Inventory</h4>
                          <p className="text-lg font-black text-slate-950">Visual assets staged for production.</p>
                      </div>
                      <div className="flex items-center gap-6">
                          <span className="text-5xl font-black text-slate-950 leading-none">{maintainedImages.length}</span>
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Staged<br/>Files</span>
                      </div>
                  </div>
                  
                  <div className="flex gap-8 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
                      {maintainedImages.map((img, i) => (
                          <div key={i} className={cn(
                              "relative w-40 h-40 rounded-[2.5rem] overflow-hidden shrink-0 border-4 transition-all shadow-2xl group/bucket",
                              primaryImage === img ? "border-primary shadow-primary/20 scale-105" : "border-slate-50"
                          )}>
                              <img src={img} className="w-full h-full object-cover transition-transform group-hover/bucket:scale-110 duration-500" />
                              {primaryImage === img && (
                                  <div className="absolute top-3 right-3 bg-primary text-white p-2 rounded-xl shadow-xl">
                                      <Star size={16} fill="currentColor" />
                                  </div>
                              )}
                              <button 
                                onClick={() => setMaintainedImages(prev => prev.filter(item => item !== img))}
                                className="absolute bottom-3 right-3 bg-white/90 hover:bg-rose-500 hover:text-white p-2.5 rounded-2xl backdrop-blur-md transition-all shadow-xl opacity-0 group-hover/bucket:opacity-100"
                              >
                                <Trash2 size={18} />
                              </button>
                          </div>
                      ))}
                      {maintainedImages.length === 0 && (
                          <div className="w-full py-20 text-center text-xs font-black uppercase tracking-[0.3em] opacity-30 border-4 border-dashed border-slate-100 rounded-[3rem]">
                              Workspace Empty: Select from Catalog
                          </div>
                      )}
                  </div>
               </div>

               {/* Neural Forge Status Hub */}
               <div className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 p-12 opacity-5 pointer-events-none transform -rotate-12">
                      <Zap size={150} className="text-primary" />
                  </div>
                  
                  {visualLoading && (
                      <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-3xl flex flex-col items-center justify-center p-12 transition-all duration-700">
                          <div className="w-full max-w-lg space-y-10 text-center">
                              <div className="relative inline-block">
                                  <div className="w-32 h-32 border-8 border-primary/20 border-t-primary rounded-full animate-spin" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-2xl font-black italic">{visualProgress}%</span>
                                  </div>
                              </div>
                              <div>
                                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-primary mb-3">Neural Synapse Active</p>
                                  <h3 className="text-4xl font-black text-white italic transition-all duration-300 transform scale-105">
                                      {visualStatus}...
                                  </h3>
                              </div>
                              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary transition-all duration-700" style={{ width: `${visualProgress}%` }} />
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-16 relative">
                    <div className="space-y-3">
                      <h3 className="text-5xl font-black italic tracking-tighter flex items-center gap-6">
                        <Sparkles className="text-primary" size={56} />
                        NANO BANANA 
                      </h3>
                      <p className="text-slate-400 font-bold tracking-widest uppercase text-xs opacity-60">Visual Studio Optimization Layer</p>
                    </div>
                    <div className="flex bg-white/5 p-2 rounded-3xl border border-white/10 w-fit backdrop-blur-md">
                        {['primary', 'presentation', 'ingredients'].map(mood => (
                          <button 
                            key={mood}
                            onClick={() => setVisualMood(mood)}
                            className={cn(
                              "px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all",
                              visualMood === mood ? "bg-primary text-white shadow-xl shadow-primary/40" : "text-slate-400 hover:text-white"
                            )}
                          >
                            {mood}
                          </button>
                        ))}
                    </div>
                  </div>
                  
                  <button 
                    disabled={visualLoading || !referenceImage}
                    onClick={handleGenerateVariations}
                    className="w-full md:w-fit px-16 bg-white text-slate-950 h-24 rounded-[2rem] flex items-center justify-center gap-6 shadow-2xl disabled:opacity-20 font-black text-sm uppercase tracking-[0.3em] hover:scale-[1.05] transition-all relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-all" />
                    <Zap className={cn("text-primary", visualLoading && "animate-pulse")} size={28} />
                    Execute Neural Calibration
                  </button>
               </div>

               {/* Standard Output Grid */}
               <div className="space-y-12">
                   <div className="flex items-center gap-6 px-4">
                      <div className="w-10 h-1 bg-primary rounded-full" />
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Neural Output Vectors</h4>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                       {generatedImages.map((img, i) => (
                           <div key={i} className="group relative rounded-[3.5rem] overflow-hidden aspect-square border-8 border-white transition-all shadow-2xl hover:-translate-y-4 hover:shadow-primary/10">
                               <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                               <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all p-8 gap-4 backdrop-blur-sm">
                                   <button onClick={() => setPreviewImage(img)} className="bg-white text-slate-950 w-full py-4 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                                      <Eye size={18} />
                                      Preview
                                   </button>
                                   <button 
                                      onClick={() => !maintainedImages.includes(img) && setMaintainedImages(p => [...p, img])} 
                                      className="bg-primary text-white w-full py-4 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
                                   >
                                      <CheckCircle size={18} />
                                      Add to Gallery
                                   </button>
                               </div>
                           </div>
                       ))}
                       {generatedImages.length === 0 && Array(4).fill(0).map((_, i) => (
                         <div key={i} className="rounded-[3.5rem] border-4 border-dashed border-slate-100 aspect-square flex flex-col items-center justify-center bg-slate-50 gap-4">
                            <ImageIcon className="text-slate-100" size={64} />
                            <p className="text-[9px] font-black text-slate-200 uppercase tracking-widest italic">Awaiting Synapse...</p>
                         </div>
                       ))}
                   </div>
               </div>

               {/* Safe-Seek Catalog Overhaul */}
               <div className="space-y-10 pt-20 border-t border-slate-100">
                   <div className="flex justify-between items-center px-4">
                        <div>
                            <h4 className="text-3xl font-black text-slate-950 tracking-tight italic">Source Package Control</h4>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Verified Production Integrity</p>
                        </div>
                        <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase">
                            {product.images?.length || 0} Assets Identified
                        </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                       {product.images?.map((img, i) => (
                           <div key={i} className={cn(
                               "relative rounded-[3rem] p-8 border-4 flex items-center gap-8 transition-all hover:bg-slate-50/50",
                               maintainedImages.includes(img) ? "border-slate-100 bg-white shadow-2xl" : "border-slate-50 opacity-40 grayscale"
                           )}>
                               <div className="w-32 h-32 rounded-[2rem] overflow-hidden shrink-0 border-2 border-slate-100 relative group/img cursor-pointer shadow-lg hover:scale-105 transition-all">
                                  <img src={img} className="w-full h-full object-cover" />
                                  <div onClick={() => setPreviewImage(img)} className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-all"><Eye size={28} /></div>
                               </div>
                               <div className="flex-1 space-y-6">
                                  <div className="space-y-4">
                                     <label className="flex items-center gap-4 cursor-pointer group">
                                        <input 
                                           type="radio" 
                                           name="pri-img"
                                           checked={primaryImage === img} 
                                           onChange={() => { setPrimaryImage(img); if(!maintainedImages.includes(img)) setMaintainedImages(p => [...p, img]); }} 
                                           className="w-6 h-6 accent-primary" 
                                        />
                                        <div className="flex flex-col">
                                            <span className={cn("text-[11px] font-black uppercase tracking-widest", primaryImage === img ? "text-primary" : "text-slate-950")}>Primary Photo</span>
                                            {primaryImage === img && <span className="text-[8px] font-bold text-primary uppercase">Active Listing Lead</span>}
                                        </div>
                                     </label>
                                     <label className="flex items-center gap-4 cursor-pointer">
                                        <input 
                                           type="checkbox" 
                                           checked={maintainedImages.includes(img)} 
                                           onChange={() => setMaintainedImages(p => p.includes(img) ? p.filter(x => x !== img) : [...p, img])} 
                                           className="w-6 h-6 accent-slate-950" 
                                        />
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">In Gallery</span>
                                     </label>
                                  </div>
                                  <button onClick={() => setReferenceImage(img)} className={cn("w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all", referenceImage === img ? "bg-slate-950 text-white shadow-xl" : "bg-white text-slate-400 hover:border-slate-200")}>
                                    {referenceImage === img ? "Neural Focus Active" : "Set Calibration Context"}
                                  </button>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
            </div>
          )}

          {activeTab === 'pricing' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-16">
                      <div className="flex items-center gap-8">
                         <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/10">
                            <DollarSign size={52} />
                         </div>
                         <div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight italic">Global Architect</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-3">Production-Level Pricing Logic</p>
                         </div>
                      </div>
                      <div className="flex-1 max-w-sm p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                          <div className="flex items-center justify-between mb-4">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Strategy Vector</p>
                              <Activity size={14} className="text-emerald-500 animate-pulse" />
                          </div>
                          <p className="text-xs font-bold text-slate-900 leading-relaxed italic">
                              "{pricingStrategy || "Analyzing live marketplace signals..."}"
                          </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                       <div className="space-y-12">
                           <div className="bg-slate-50 p-16 rounded-[3.5rem] border border-slate-100 shadow-inner group transition-all hover:bg-white hover:shadow-2xl hover:border-emerald-50">
                               <p className="text-[12px] text-slate-400 font-black uppercase mb-10 tracking-[0.4em] italic flex items-center gap-3">
                                   <Monitor size={14} /> ACTIVE LISTING PRICE ($)
                               </p>
                               <div className="flex items-center gap-8 border-b-8 border-slate-200 pb-6 focus-within:border-emerald-400 transition-all">
                                   <span className="text-7xl font-black text-slate-300 italic shrink-0 transition-all group-focus-within:text-emerald-500">$</span>
                                   <input 
                                       type="number" 
                                       step="0.01"
                                       value={price} 
                                       onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} 
                                       className="bg-transparent text-9xl font-black text-slate-950 w-full outline-none tracking-tighter" 
                                   />
                               </div>
                           </div>
                           <div className="flex items-center justify-between px-8 py-8 bg-slate-950 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                   <TrendingUp size={80} className="text-emerald-400" />
                               </div>
                               <div className="flex flex-col gap-2 relative z-10">
                                   <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Market Pulse</span>
                                   <span className="text-2xl font-black italic tracking-tight">Sync Competitor Avg</span>
                                   <span className="text-sm font-bold text-emerald-400">${competitorData?.stats?.avg || '0.00'} / Base</span>
                               </div>
                               <button 
                                  onClick={() => setPrice(parseFloat(competitorData?.stats?.avg || price))}
                                  className="h-16 px-10 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all relative z-10"
                               >
                                  Auto-Sync Vector
                               </button>
                           </div>
                       </div>
                       <div className="space-y-8">
                            <h4 className="text-xs font-black text-slate-950 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                <Monitor size={18} /> LIVE MARKET COMPARISON
                            </h4>
                            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-4 no-scrollbar">
                                {competitorData.length > 0 ? competitorData.map((comp, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-8 bg-white border-2 border-slate-50 rounded-[2.5rem] hover:shadow-2xl hover:-translate-y-1 transition-all">
                                        <div className="flex flex-col gap-2 max-w-[240px]">
                                            <span className="text-sm font-bold text-slate-900 truncate tracking-tight">{comp.title}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Top Vector</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-3xl font-black text-slate-950 tracking-tighter italic">${comp.price}</span>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase mt-1">Free Ship Active</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-24 text-center border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-200 font-black uppercase tracking-widest italic flex flex-col items-center gap-6">
                                        <Globe size={48} className="opacity-20" />
                                        Scanning Global Signal...
                                    </div>
                                )}
                            </div>
                       </div>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Sidebar Intelligence Bar - PRO Standard */}
        <div className="xl:col-span-1 space-y-8 sticky top-4">
           
           {/* Ring Chart Reconstruction */}
           <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-12 bg-primary/5 blur-3xl rounded-full" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12 italic leading-relaxed">Listing Production Health</h3>
              <div className="flex justify-center mb-12 relative px-4">
                  <svg className="w-64 h-64 transform -rotate-90 drop-shadow-2xl">
                      <circle cx="128" cy="128" r="110" className="stroke-slate-50 fill-none" strokeWidth="20" />
                      <circle 
                        cx="128" cy="128" r="110" 
                        className="stroke-primary fill-none transition-all duration-1000 ease-out" 
                        strokeWidth="20" 
                        strokeDasharray={691.15}
                        strokeDashoffset={691.15 - (691.15 * 0.98)} 
                        strokeLinecap="round"
                      />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                      <span className="text-8xl font-black text-slate-950 tracking-tighter italic leading-none">98</span>
                      <span className="text-[12px] font-black text-primary uppercase tracking-[0.4em] mt-2">Elite Rank</span>
                  </div>
              </div>
              <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-600 shadow-xl shadow-emerald-500/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-60">Architect Verdict</p>
                  <p className="text-[14px] font-bold leading-relaxed italic tracking-tight">"{aiVerdict}"</p>
              </div>
           </div>

           {/* Production Handshake Stream */}
           <div className="bg-slate-950 p-12 rounded-[3.5rem] text-white shadow-[0_40px_100px_rgba(0,0,0,0.2)] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform rotate-12 scale-150">
                  <Box size={100} className="text-primary" />
               </div>
               <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-10 opacity-30 italic">Handshake Telemetry</h3>
               <div className="space-y-8 relative z-10">
                  {[
                      { label: "EBay Marketplace API", speed: "14ms", status: "Secure" },
                      { label: "Neural Forge XL Hub", speed: "210ms", status: "Active" },
                      { label: "Inventory Metadata", speed: "Synced", status: "Live" }
                  ].map((sys, idx) => (
                      <div key={idx} className="flex justify-between items-center group cursor-default">
                          <div className="flex items-center gap-5">
                             <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_#10b981] group-hover:scale-125 transition-all" />
                             <span className="text-[13px] font-bold opacity-70 group-hover:opacity-100 transition-all tracking-tight">{sys.label}</span>
                          </div>
                      </div>
                  ))}
               </div>

                {/* PRO Diagnostic Console */}
                <div className="mt-16 p-10 bg-white/5 rounded-[2.5rem] border border-white/5 font-mono text-[10px] h-[350px] flex flex-col relative group/console overflow-hidden">
                   <div className="flex items-center gap-4 mb-8 sticky top-0 bg-transparent py-1 border-b border-white/10 pb-4">
                      <Terminal size={18} className="text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Diagnostic Protocol Stream</span>
                   </div>
                   <div className="space-y-6 overflow-y-auto no-scrollbar flex-1 relative z-10">
                      {systemLogs.length === 0 ? (
                        <div className="text-slate-700 italic opacity-40 py-20 text-center uppercase tracking-widest font-black text-[12px]">Connecting to Signal...</div>
                      ) : systemLogs.map((log, i) => (
                        <div key={i} className={cn(
                            "flex gap-5 leading-relaxed p-3 rounded-2xl border-l-4 transition-all hover:bg-white/5",
                            log.type === 'error' ? 'text-rose-400 border-rose-500 bg-rose-500/5' : 
                            log.type === 'success' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5' : 'text-slate-400 border-white/10'
                        )}>
                           <span className="opacity-30 flex-shrink-0 font-bold">[{log.timestamp}]</span>
                           <span className="font-medium tracking-tight whitespace-pre-wrap">{log.message}</span>
                        </div>
                      ))}
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                </div>
           </div>

        </div>
      </div>

      {/* PRO Lightbox Modal */}
      {previewImage && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/98 flex items-center justify-center p-12 md:p-24 backdrop-blur-3xl animate-in fade-in zoom-in-110 duration-500">
              <button onClick={() => setPreviewImage(null)} className="absolute top-16 right-16 text-white/50 hover:text-white transition-all transform hover:rotate-90 group">
                  <RefreshCw size={56} className="transition-all group-hover:scale-110" />
              </button>
              <div className="max-w-[1400px] w-full h-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-primary/20 blur-[200px] rounded-full animate-pulse" />
                  <img src={previewImage} className="max-w-full max-h-full object-contain rounded-[5rem] shadow-[0_0_150px_rgba(30,190,230,0.4)] z-10 border-8 border-white/5" />
              </div>
          </div>
      )}
    </div>
  );
};

export default OptimizeProduct;
