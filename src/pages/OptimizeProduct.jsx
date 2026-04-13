import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowLeftRight,
  TrendingUp,
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
  Loader2
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import aiService from '../services/ai';
import ebayService from '../services/ebay';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import ebayTrading from '../services/ebay_trading';
import { cn } from '../lib/utils';

// High-level eBay Primary Categories for Drill-down
const EBAY_CATEGORIES = [
    { id: 11450, name: "Clothing, Shoes & Accessories" },
    { id: 26395, name: "Health & Beauty" },
    { id: 11700, name: "Home & Garden" },
    { id: 293, name: "Consumer Electronics" },
    { id: 888, name: "Sporting Goods" },
    { id: 220, name: "Toys & Hobbies" },
    { id: 267, name: "Books, Movies & Music" },
    { id: 1249, name: "Business & Industrial" },
    { id: 6000, name: "eBay Motors" }
];

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
  
  // Category Logic
  const [mainCategoryId, setMainCategoryId] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [aiLogs, setAiLogs] = useState([]);
  
  // Visual Studio States
  const [visualMood, setVisualMood] = useState("primary");
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualProgress, setVisualProgress] = useState(0);
  const [visualStep, setVisualStep] = useState("");
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
                addSystemLog(`Production Synapse: Capturing ID ${id}`, 'info');
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
                    addSystemLog(`Hydration Complete: ${baselineImages.length} images, ${fetchedProduct.description.length} description length`, 'success');
                }
            } catch (err) {
                addSystemLog(`Transmission Error: ${err.message}`, 'error');
                toast.error("Failed to fetch product baseline.");
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
    setAiLogs([]);
    const addLog = (msg) => setAiLogs(prev => [...prev, { msg, time: new Date().toLocaleTimeString() }]);
    
    try {
      addLog("Initializing Luminous Engine...");
      const insights = await ebayService.getCompetitorInsights(product.title);
      setCompetitorData(insights || []);
      
      addLog("Synthesizing Neural Vectors...");
      const optimization = await aiService.optimizeListing(product.title, price || product.price, insights);
      
      setTitles(optimization.titles || []);
      setSelectedTitle(optimization.titles?.[0]?.title || product.title);
      setDescription(optimization.description || product.description);
      setTags(optimization.tags || []);
      setPricingStrategy(optimization.pricingStrategy || "");
      setAiVerdict(optimization.aiVerdict || "Ready.");
      
      addLog("Calibration complete.");
    } catch (error) {
      toast.error("AI Service Offline.");
    } finally {
      setTimeout(() => setIsProcessing(false), 800);
    }
  };

  const handleGenerateVariations = async () => {
    if (!referenceImage) return toast.error("Select Reference Point.");
    setVisualLoading(true);
    setVisualProgress(0);
    
    const steps = ["Analyzing Reference", "Synthesizing Vector", "Applying Style", "Rendering Variations"];
    
    try {
      for(let i=0; i<steps.length; i++) {
          setVisualStep(steps[i]);
          setVisualProgress((i+1) * 25);
          await new Promise(r => setTimeout(r, 800));
      }
      
      const variations = await aiService.generateProductImageVariations(referenceImage, selectedTitle, visualMood);
      setGeneratedImages(variations);
      toast.success("Nano Banana Complete.");
    } catch (error) {
      toast.error("Visual Studio error.");
    } finally {
      setVisualLoading(false);
    }
  };

  const handlePushToStore = async () => {
    const toastId = toast.loading(`Broadcasting Optimized Vector...`);
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
        toast.success(`Production Listing Updated.`);
    } catch (e) {
        toast.dismiss(toastId);
        toast.error(`Sync Failed: ${e.message}`);
    }
  };

  if (isDeployed) {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in zoom-in-95 duration-500">
            <div className="max-w-xl w-full bg-white p-12 rounded-[3rem] border border-slate-100 shadow-3xl text-center space-y-8">
                <div className="mx-auto w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-xl">
                    <CheckCircle size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sync Complete</h2>
                    <p className="text-slate-500 font-medium">Listing broadcasted with Tier-1 SEO.</p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                    <button onClick={() => navigate('/inventory')} className="flex-1 bg-slate-900 text-white h-16 rounded-2xl font-bold">Inventory Hub</button>
                    <button onClick={() => setIsDeployed(false)} className="flex-1 bg-white text-slate-900 border border-slate-200 h-16 rounded-2xl font-bold">Continue Editing</button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
      
      {/* Header Evolution */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Sparkles size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Neural Hub</h1>
              <p className="text-slate-400 font-medium text-xs tracking-widest uppercase opacity-60">Elite Dropship Optimization V2.0</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={runOptimization}
                className="bg-slate-100 text-slate-600 px-6 h-14 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
                <RefreshCw size={18} className={cn("inline mr-2", isProcessing && "animate-spin")} />
                Re-Analyze
            </button>
            <button 
                onClick={handlePushToStore}
                className="bg-primary text-white h-14 px-10 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
            >
                Push To Production
                <ArrowRight size={18} className="inline ml-2" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        
        {/* Main Interface Core */}
        <div className="xl:col-span-3 space-y-8">
           
           <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit sticky top-4 z-40">
            {[
              { id: 'text', label: 'Copy & SEO', icon: Type },
              { id: 'images', label: 'Visual Studio', icon: Camera },
              { id: 'pricing', label: 'Pricing Matrix', icon: DollarSign },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                  activeTab === tab.id ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'text' && (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
               {/* 5-Option Title Matrix */}
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic opacity-50 flex items-center gap-2">
                        <Target size={14} className="text-primary" />
                        Active Title Profiles
                     </h3>
                     <span className="text-[10px] font-bold text-slate-400 uppercase">Select High-Velocity Match</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                     {titles.length > 0 ? titles.map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTitle(t.title)}
                          className={cn(
                            "group relative flex items-center justify-between p-6 rounded-3xl border-2 transition-all text-left",
                            selectedTitle === t.title ? "border-primary bg-primary/5 shadow-inner" : "border-slate-50 bg-white hover:border-slate-200"
                          )}
                        >
                           <div className="flex items-center gap-4 flex-1">
                              <div className={cn(
                                "w-6 h-6 rounded-full border-4 shrink-0 transition-all",
                                selectedTitle === t.title ? "border-primary bg-white shadow-[0_0_10px_rgba(30,190,230,0.5)]" : "border-slate-100"
                              )} />
                              <div>
                                 <p className={cn("text-base font-bold", selectedTitle === t.title ? "text-slate-950" : "text-slate-400")}>{t.title}</p>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1">{t.title.length}/80 Chars</p>
                              </div>
                           </div>
                           <div className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white shadow-lg",
                            idx === 0 ? "bg-emerald-500" : idx < 3 ? "bg-amber-500" : "bg-slate-400"
                           )}>
                              {t.rank}% RANK
                           </div>
                        </button>
                     )) : (
                        Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-slate-50 rounded-3xl animate-pulse" />)
                     )}
                  </div>
               </div>

               {/* Manual Category Drill-down */}
               <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-inner space-y-8">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic opacity-50 flex items-center gap-2">
                        <Layers size={14} className="text-primary" />
                        eBay Standardization
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">1. Select Primary Branch</label>
                            <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto no-scrollbar bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                {EBAY_CATEGORIES.map(cat => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => setMainCategoryId(cat.id)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl text-left transition-all",
                                            mainCategoryId === cat.id ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"
                                        )}
                                    >
                                        <span className="text-xs font-bold">{cat.name}</span>
                                        {mainCategoryId === cat.id && <CheckCircle size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">2. Search Sub-Category</label>
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={20} />
                                <input 
                                    className="w-full bg-white border border-slate-100 h-16 pl-16 pr-8 rounded-2xl font-bold text-sm outline-none focus:border-primary transition-all" 
                                    placeholder="Type specific category name (e.g. Creams)"
                                    value={subCategoryName}
                                    onChange={e => setSubCategoryName(e.target.value)}
                                />
                            </div>
                            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Category Pathing</p>
                                <p className="text-xs font-bold text-slate-900 break-words">
                                    {mainCategoryId ? EBAY_CATEGORIES.find(c => c.id === mainCategoryId)?.name : "Branch"} 
                                    <ChevronRight className="inline mx-2 text-slate-300" size={14} /> 
                                    {subCategoryName || "Sub-Selection"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">High-Intent Keywords</label>
                        <div className="flex flex-wrap gap-2">
                            {tags.length > 0 ? tags.map((tg, i) => (
                                <span key={i} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm">
                                    {tg}
                                </span>
                            )) : <div className="text-slate-300 italic text-xs">Awaiting neural analysis...</div>}
                        </div>
                    </div>
               </div>

               {/* Professional Copy Studio */}
               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
                        <h3 className="text-lg font-bold flex items-center gap-3">
                            <Terminal className="text-primary" size={22} />
                            Professional Selling Pitch
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase italic">
                           <span>No External Image Links Found</span>
                           <CheckCircle size={14} className="text-emerald-500" />
                        </div>
                    </div>
                    <div className="bg-white min-h-[400px] p-2">
                        <ReactQuill theme="snow" value={description} onChange={setDescription} className="h-full border-none" />
                    </div>
               </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-12 animate-in zoom-in-95 duration-500">
               
               {/* Broadcast Selection Bucket - Luminous Refinement */}
               <div className="bg-white p-10 rounded-[3rem] border-4 border-slate-50 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                      <ImageIcon size={120} />
                  </div>
                  <div className="flex items-center justify-between mb-10">
                      <div>
                          <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Production Bucket</h4>
                          <p className="text-[11px] font-bold text-slate-900">Final listing gallery staged.</p>
                      </div>
                      <div className="flex items-center gap-4">
                          <span className="text-3xl font-black text-slate-900">{maintainedImages.length}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Files Ready</span>
                      </div>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
                      {maintainedImages.map((img, i) => (
                          <div key={i} className={cn(
                              "relative w-32 h-32 rounded-[2rem] overflow-hidden shrink-0 border-4 transition-all shadow-xl",
                              primaryImage === img ? "border-primary shadow-primary/20 scale-105" : "border-slate-100"
                          )}>
                              <img src={img} className="w-full h-full object-cover" />
                              {primaryImage === img && (
                                  <div className="absolute top-2 right-2 bg-primary text-white p-1.5 rounded-lg shadow-lg">
                                      <Star size={12} fill="currentColor" />
                                  </div>
                              )}
                              <button 
                                onClick={() => setMaintainedImages(prev => prev.filter(item => item !== img))}
                                className="absolute bottom-2 right-2 bg-white/90 hover:bg-rose-500 hover:text-white p-2 rounded-xl backdrop-blur-md transition-all shadow-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                          </div>
                      ))}
                      {maintainedImages.length === 0 && (
                          <div className="w-full py-16 text-center text-[10px] font-black uppercase tracking-widest opacity-20 border-4 border-dashed border-slate-100 rounded-[2.5rem]">
                              Broadcast Ready. Link images from catalog below.
                          </div>
                      )}
                  </div>
               </div>

               {/* Nano Banana Progress Overlay */}
               <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                  {visualLoading && (
                      <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-12 animate-in fade-in">
                          <div className="w-full max-w-sm space-y-6">
                              <div className="flex justify-between items-end mb-2">
                                  <div>
                                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Status: Neural Forge</p>
                                      <p className="text-lg font-black text-slate-900">{visualStep}...</p>
                                  </div>
                                  <span className="text-xl font-black text-slate-900">{visualProgress}%</span>
                              </div>
                              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${visualProgress}%` }} />
                              </div>
                              <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Please do not refresh</p>
                          </div>
                      </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div>
                      <h3 className="text-3xl font-black mb-2 flex items-center gap-4">
                        <Sparkles className="text-primary" size={32} />
                        Nano Banana Studio
                      </h3>
                      <p className="text-slate-400 font-medium italic">High-Fidelity Neural Variations (Flux 1.0 Real-Time)</p>
                    </div>
                    <div className="flex bg-slate-50 p-2 rounded-2xl w-fit border border-slate-100">
                        {['primary', 'presentation', 'ingredients'].map(mood => (
                          <button 
                            key={mood}
                            onClick={() => setVisualMood(mood)}
                            className={cn(
                              "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              visualMood === mood ? "bg-white text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-600"
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
                    className="w-full md:w-fit px-12 bg-primary text-white h-20 rounded-2xl flex items-center justify-center gap-4 shadow-2xl shadow-primary/20 disabled:opacity-50 font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
                  >
                    {visualLoading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                    Generate {visualMood.toUpperCase()} Variant
                  </button>
               </div>

               {/* Variations Grid */}
               <div className="space-y-6">
                   <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Output Gallery</h4>
                      <span className="text-[10px] font-bold text-slate-300 italic">HuggingFace Inference XL</span>
                   </div>
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                       {generatedImages.map((img, i) => (
                           <div key={i} className="group relative rounded-[3rem] overflow-hidden aspect-square border-4 border-white transition-all shadow-xl hover:scale-[1.05] hover:shadow-2xl">
                               <img src={img} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                                   <div className="flex gap-4">
                                       <button onClick={() => setPreviewImage(img)} className="bg-white text-slate-950 p-4 rounded-2xl shadow-xl hover:scale-110 transition-all"><Eye size={20} /></button>
                                       <button 
                                          onClick={() => !maintainedImages.includes(img) && setMaintainedImages(p => [...p, img])} 
                                          className="bg-primary text-white p-4 rounded-2xl shadow-xl hover:scale-110 transition-all"
                                       >
                                          <CheckCircle size={20} />
                                       </button>
                                   </div>
                               </div>
                           </div>
                       ))}
                       {generatedImages.length === 0 && Array(4).fill(0).map((_, i) => (
                         <div key={i} className="rounded-[3rem] border-2 border-dashed border-slate-100 aspect-square flex items-center justify-center bg-slate-50 opacity-40">
                            <ImageIcon className="text-slate-200" size={48} />
                         </div>
                       ))}
                   </div>
               </div>

               {/* Source Catalog Overhaul */}
               <div className="space-y-10 pt-16 border-t border-slate-100">
                   <div className="px-2">
                        <h4 className="text-xl font-black text-slate-950 tracking-tight mb-2">Source Image Catalog</h4>
                        <p className="text-slate-400 text-xs font-medium italic">Enable images from the original package</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {product.images?.map((img, i) => (
                           <div key={i} className={cn(
                               "relative rounded-[2.5rem] p-6 border-2 flex items-center gap-6 transition-all",
                               maintainedImages.includes(img) ? "border-slate-100 bg-white shadow-xl" : "border-slate-50 opacity-50 grayscale"
                           )}>
                               <div className="w-28 h-28 rounded-3xl overflow-hidden shrink-0 border border-slate-100 relative group/img cursor-pointer">
                                  <img src={img} className="w-full h-full object-cover" />
                                  <div onClick={() => setPreviewImage(img)} className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-all"><Eye size={24} /></div>
                               </div>
                               <div className="flex-1 space-y-4">
                                  <div className="space-y-3">
                                     <label className="flex items-center gap-3 cursor-pointer group">
                                        <input 
                                           type="radio" 
                                           name="p-img"
                                           checked={primaryImage === img} 
                                           onChange={() => { setPrimaryImage(img); if(!maintainedImages.includes(img)) setMaintainedImages(p => [...p, img]); }} 
                                           className="w-5 h-5 accent-primary" 
                                        />
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", primaryImage === img ? "text-primary" : "text-slate-900")}>Primary</span>
                                     </label>
                                     <label className="flex items-center gap-3 cursor-pointer">
                                        <input 
                                           type="checkbox" 
                                           checked={maintainedImages.includes(img)} 
                                           onChange={() => setMaintainedImages(p => p.includes(img) ? p.filter(x => x !== img) : [...p, img])} 
                                           className="w-5 h-5 accent-slate-900" 
                                        />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Gallery</span>
                                     </label>
                                  </div>
                                  <button onClick={() => setReferenceImage(img)} className={cn("w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all", referenceImage === img ? "bg-slate-950 text-white shadow-lg" : "bg-white text-slate-400 hover:border-slate-200")}>
                                    {referenceImage === img ? "Active Reference" : "Set Reference"}
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
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-16">
                      <div className="flex items-center gap-6">
                         <div className="w-20 h-20 bg-emerald-500 rounded-[1.8rem] flex items-center justify-center text-white shadow-xl">
                            <DollarSign size={40} />
                         </div>
                         <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Price Architect</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Global Revenue Calibration</p>
                         </div>
                      </div>
                      <div className="flex-1 max-w-sm p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                             <TrendingUp size={14} /> AI Recommendation
                          </p>
                          <p className="text-xs font-bold text-slate-900 leading-relaxed italic">
                              "{pricingStrategy || "Analyzing market pulse..."}"
                          </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                       <div className="space-y-10">
                           <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-100 shadow-inner group">
                               <p className="text-[11px] text-slate-400 font-black uppercase mb-8 tracking-[0.3em]">Broadcast Value ($USD)</p>
                               <div className="flex items-center gap-8 border-b-4 border-slate-200 pb-4 focus-within:border-primary transition-all">
                                   <span className="text-5xl font-black text-slate-300 italic shrink-0 transition-all group-focus-within:text-primary">$</span>
                                   <input 
                                       type="number" 
                                       step="0.01"
                                       value={price} 
                                       onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} 
                                       className="bg-transparent text-8xl font-black text-slate-950 w-full outline-none tracking-tighter" 
                                   />
                               </div>
                           </div>
                           <div className="flex items-center justify-between px-4">
                               <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Context</span>
                                   <span className="text-sm font-bold text-slate-900">Competitors Avg: ${competitorData?.stats?.avg || '0.00'}</span>
                               </div>
                               <button 
                                  onClick={() => setPrice(parseFloat(competitorData?.stats?.avg || price))}
                                  className="h-12 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                               >
                                  Sync With Market
                               </button>
                           </div>
                       </div>
                       <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Competitor Intelligence (Live)</h4>
                            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                                {competitorData.length > 0 ? competitorData.map((comp, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl hover:shadow-xl transition-all">
                                        <div className="flex flex-col gap-1 max-w-[200px]">
                                            <span className="text-xs font-bold text-slate-900 truncate">{comp.title}</span>
                                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Global Top Seller</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-slate-950 tracking-tighter">${comp.price}</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] text-slate-300 font-bold italic">
                                        No Direct Competitors Found.
                                    </div>
                                )}
                            </div>
                       </div>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Dynamic Sidebar - Market Integrity Ring Fix */}
        <div className="xl:col-span-1 space-y-8 sticky top-4">
           
           {/* Ring Chart Fix */}
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl text-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 italic">Listing Health</h3>
              <div className="flex justify-center mb-10 relative">
                  <svg className="w-52 h-52 transform -rotate-90">
                      <circle cx="104" cy="104" r="90" className="stroke-slate-100 fill-none" strokeWidth="16" />
                      <circle 
                        cx="104" cy="104" r="90" 
                        className="stroke-primary fill-none transition-all duration-1000 ease-out" 
                        strokeWidth="16" 
                        strokeDasharray={565.48}
                        strokeDashoffset={565.48 - (565.48 * 0.98)} // 98% Health
                        strokeLinecap="round"
                      />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-6xl font-black text-slate-950 tracking-tighter italic">98</span>
                      <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Rating</span>
                  </div>
              </div>
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-600 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">AI Verdict</p>
                  <p className="text-[13px] font-bold leading-relaxed italic">"{aiVerdict}"</p>
              </div>
           </div>

           {/* Neural Handshake Hub - Dark Refined Column */}
           <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                  <Zap size={100} className="text-primary" />
               </div>
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-10 opacity-40">System Handshakes</h3>
               <div className="space-y-6">
                  {[
                      { label: "EBay Engine API", speed: "12ms", ok: true },
                      { label: "Neural Forge XL", speed: "250ms", ok: true },
                      { label: "Broadcast Terminal", speed: "Ready", ok: true }
                  ].map((sys, idx) => (
                      <div key={idx} className="flex justify-between items-center group cursor-default">
                          <div className="flex items-center gap-4">
                             <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_12px_#34d399] transition-all group-hover:scale-125" />
                             <span className="text-xs font-bold opacity-70 group-hover:opacity-100 transition-all">{sys.label}</span>
                          </div>
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">{sys.speed}</span>
                      </div>
                  ))}
               </div>

                {/* Real-time Diagnostic Console */}
                <div className="mt-12 p-8 bg-black/50 rounded-[2rem] border border-white/5 font-mono text-[9px] h-64 flex flex-col">
                   <div className="flex items-center gap-3 mb-6 sticky top-0 bg-transparent py-1 border-b border-white/10 pb-2">
                      <Terminal size={14} className="text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Diagnostic Data Stream</span>
                   </div>
                   <div className="space-y-4 overflow-y-auto no-scrollbar flex-1">
                      {systemLogs.length === 0 ? (
                        <div className="text-slate-600 italic opacity-40 py-8 text-center uppercase tracking-widest">Awaiting Handshake Signals...</div>
                      ) : systemLogs.map((log, i) => (
                        <div key={i} className={cn(
                            "flex gap-4 leading-relaxed p-2 rounded-lg border-l-4 transition-all hover:bg-white/5",
                            log.type === 'error' ? 'text-rose-400 border-rose-500' : 
                            log.type === 'success' ? 'text-emerald-400 border-emerald-500' : 'text-slate-400 border-slate-700'
                        )}>
                           <span className="opacity-30 flex-shrink-0">[{log.timestamp}]</span>
                           <span className="font-bold">{log.message}</span>
                        </div>
                      ))}
                   </div>
                </div>
           </div>

        </div>
      </div>

      {/* Lightbox Enhancement */}
      {previewImage && (
          <div className="fixed inset-0 z-[200] bg-slate-950/95 flex items-center justify-center p-8 md:p-20 backdrop-blur-3xl animate-in fade-in duration-300">
              <button onClick={() => setPreviewImage(null)} className="absolute top-12 right-12 text-white/40 hover:text-white transition-all transform hover:rotate-90">
                  <RefreshCw size={48} />
              </button>
              <div className="max-w-6xl w-full h-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-primary/10 blur-[150px] rounded-full" />
                  <img src={previewImage} className="max-w-full max-h-full object-contain rounded-[4rem] shadow-[0_0_100px_rgba(30,190,230,0.3)] z-10 border-4 border-white/10" />
              </div>
          </div>
      )}
    </div>
  );
};

export default OptimizeProduct;
