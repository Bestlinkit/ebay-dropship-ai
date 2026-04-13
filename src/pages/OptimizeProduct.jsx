import React, { useState, useEffect } from 'react';
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
  Eye
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
  const { ebayProduct, sourceProduct } = location.state || {};

  const [loading, setLoading] = useState(!ebayProduct);
  const [product, setProduct] = useState(ebayProduct || {
    title: "",
    price: 0,
    images: [],
    description: ""
  });

  // Optimization States
  const [titles, setTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [pricingStrategy, setPricingStrategy] = useState("");
  const [competitorData, setCompetitorData] = useState(null);
  
  const [activeTab, setActiveTab] = useState('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [aiLogs, setAiLogs] = useState([]);
  
  // Visual Studio States
  const [visualMood, setVisualMood] = useState("primary");
  const [visualLoading, setVisualLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [referenceImage, setReferenceImage] = useState(null);
  const [maintainedImages, setMaintainedImages] = useState([]);

  useEffect(() => {
    const hydrate = async () => {
        if (id) {
            setLoading(true);
            try {
                const fetchedProduct = await ebayService.getProductById(id);
                if (fetchedProduct) {
                    setProduct(fetchedProduct);
                    setPrice(fetchedProduct.price || 0);
                    setDescription(fetchedProduct.description);
                    setMaintainedImages(fetchedProduct.images || []);
                    if (fetchedProduct.images?.length > 0) {
                        setReferenceImage(fetchedProduct.images[0]);
                    }
                }
            } catch (err) {
                toast.error("Failed to fetch product baseline.");
            } finally {
                setLoading(false);
            }
        }
    };
    hydrate();
  }, [id]);

  useEffect(() => {
    if (product?.title && product.title !== "" && !titles.length) {
        runOptimization();
    }
  }, [product?.title]);

  const runOptimization = async () => {
    setIsProcessing(true);
    setAiLogs([]);
    const addLog = (msg) => setAiLogs(prev => [...prev, { msg, time: new Date().toLocaleTimeString() }]);
    
    try {
      addLog("Initializing Production AI Suite...");
      await new Promise(r => setTimeout(r, 800));
      
      addLog("Consulting Category Compass...");
      const insights = await ebayService.getCompetitorInsights(product.title);
      setCompetitorData(insights);
      
      addLog("Synthesizing Neural SEO Metrics...");
      const optimization = await aiService.optimizeListing(product.title, price, insights);
      
      setTitles(optimization.titles || []);
      setSelectedTitle(optimization.titles?.[0]?.title || product.title);
      setDescription(optimization.description || product.description);
      setMainCategory(optimization.mainCategory || "Uncategorized");
      setSubCategory(optimization.subCategory || "General");
      setTags(optimization.tags || []);
      setPricingStrategy(optimization.pricingStrategy || "Analyze market trends.");
      
      addLog("Visual Engine Calibration complete.");
    } catch (error) {
      console.error(error);
      toast.error("AI Suite Synchronization Offline.");
    } finally {
      setTimeout(() => setIsProcessing(false), 1200);
    }
  };

  const handlePushToStore = async () => {
    if (!id) return;
    setLoading(true);
    const label = isStoreConnected ? "eBay Production" : "Internal Hub";
    const toastId = toast.loading(`Synchronizing Optimized Vector...`);
    
    try {
        if (isStoreConnected) {
            const token = user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN;
            await ebayTrading.reviseItem(token, id, {
                title: selectedTitle || product.title,
                price: price,
                description: description,
                images: maintainedImages
            });
        } else {
            await new Promise(r => setTimeout(r, 1500));
        }
        
        setIsDeployed(true);
        toast.dismiss(toastId);
        toast.success(`Success: Broadcasted to ${label}`);
    } catch (e) {
        toast.dismiss(toastId);
        toast.error(`Sync Failed: ${e.message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!referenceImage) {
        toast.error("Select a Reference Point first.");
        return;
    }
    setVisualLoading(true);
    try {
      // In production, each generation would use a specific prompt based on visualMood
      const variations = await aiService.generateProductImageVariations(referenceImage);
      setGeneratedImages(variations);
      toast.success(`8 variations generated [Mood: ${visualMood.toUpperCase()}]`);
    } catch (error) {
      toast.error("Visual Studio error.");
    } finally {
      setVisualLoading(false);
    }
  };

  const toggleMaintainedImage = (img) => {
    setMaintainedImages(prev => 
        prev.includes(img) ? prev.filter(i => i !== img) : [...prev, img]
    );
  };

  if (isDeployed) {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in zoom-in-95 duration-700">
            <div className="max-w-xl w-full bg-white p-16 rounded-[4rem] border border-slate-100 shadow-3xl text-center space-y-10">
                <div className="mx-auto w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl">
                    <CheckCircle size={48} />
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Broadcast Successful</h2>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed">
                        Data synchronized. Your listing now features optimal neural SEO.
                    </p>
                </div>
                <div className="pt-8 flex flex-col sm:flex-row gap-4">
                    <button onClick={() => navigate('/marketing')} className="flex-1 bg-slate-900 text-white h-20 rounded-[1.5rem] font-bold">Marketing Hub</button>
                    <button onClick={() => navigate('/inventory')} className="flex-1 bg-white text-slate-900 border border-slate-200 h-20 rounded-[1.5rem] font-bold">Back to Inventory</button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {isProcessing && (
          <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex items-center justify-center">
              <div className="max-w-md w-full text-center p-12 bg-white rounded-3xl shadow-2xl border border-slate-100">
                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center mb-6">
                      <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                      <Cpu className="text-primary" size={48} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Neural Optimization</h2>
                  <div className="space-y-3 mt-8">
                      {aiLogs.map((log, i) => (
                          <div key={i} className="flex gap-3 text-left">
                              <div className="w-1 bg-primary rounded-full" />
                              <p className="text-xs text-slate-500 font-medium">{log.msg}</p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">SYSTEM CORE</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Production-Level Intelligence.</p>
        </div>
        <button 
          onClick={handlePushToStore}
          className="bg-primary text-white flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
        >
          {isStoreConnected ? "PUSH TO PRODUCTION" : "SAVE TO HUB"}
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
            {[
              { id: 'text', label: 'Copy & SEO', icon: Type },
              { id: 'images', label: 'Visual Studio', icon: Camera },
              { id: 'pricing', label: 'Market Logic', icon: DollarSign },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${
                  activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'text' && (
            <div className="space-y-8 animate-in slide-in-from-left-4">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-bold flex items-center gap-3 italic text-primary">
                    <Sparkles size={24} />
                    Tiered SEO Strategy
                  </h3>
                  <button onClick={runOptimization} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-primary transition-all">
                      <RefreshCw size={20} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Title Selection Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Select Active Title Profile</label>
                    <div className="relative">
                      <select 
                        value={selectedTitle}
                        onChange={(e) => setSelectedTitle(e.target.value)}
                        className="w-full h-20 px-8 rounded-3xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-900 appearance-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                      >
                        {titles.map((t, i) => (
                          <option key={i} value={t.title}>{t.title} ({t.rank}% Ranking)</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" size={20} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={12} />
                            eBay Main Category
                        </label>
                        <input className="w-full bg-white border border-slate-200 p-4 rounded-xl font-bold text-sm" value={mainCategory} onChange={e => setMainCategory(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={12} />
                            Specific Sub-Category
                        </label>
                        <input className="w-full bg-white border border-slate-200 p-4 rounded-xl font-bold text-sm" value={subCategory} onChange={e => setSubCategory(e.target.value)} />
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                        <Tag size={12} />
                        Indexed Tags ({tags.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, i) => (
                            <span key={i} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                                {tag}
                            </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-bold flex items-center gap-3">
                        <Type className="text-primary" size={22} />
                        Professional Description
                    </h3>
                </div>
                <div className="bg-white min-h-[400px]">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} className="h-full" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-12 animate-in zoom-in-95">
               {/* Visual Mood Switcher */}
               <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                      <Zap size={120} />
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                    <div>
                      <h3 className="text-3xl font-black mb-2 flex items-center gap-4">
                        <Sparkles className="text-amber-500" fill="currentColor" />
                        Nano Banana Studio
                      </h3>
                      <p className="text-slate-400 font-medium">Calibrate neural variations for the selected Reference Point.</p>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                        {['primary', 'presentation', 'ingredients'].map(mood => (
                          <button 
                            key={mood}
                            onClick={() => setVisualMood(mood)}
                            className={cn(
                              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              visualMood === mood ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
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
                    {visualLoading ? <RefreshCw className="animate-spin" size={24} /> : <Zap size={24} />}
                    Generate {visualMood} Variant
                  </button>
               </div>

               {/* Stage 1: AI Variations */}
               <div className="space-y-6">
                   <div className="flex items-center justify-between px-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Neural Variations</h4>
                      {generatedImages.length > 0 && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase italic">8 high-res ready</span>}
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       {generatedImages.map((img, i) => (
                           <div 
                             key={`gen-${i}`} 
                             className="group relative rounded-[2.5rem] overflow-hidden aspect-square border-4 border-slate-50 transition-all shadow-xl hover:scale-[1.02]"
                           >
                               <img src={img} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                                   <p className="text-white text-[10px] font-black uppercase tracking-widest mb-4">Neural Variant</p>
                                   <button className="bg-white text-slate-900 p-3 rounded-full shadow-lg">
                                       <Eye size={20} />
                                   </button>
                               </div>
                           </div>
                       ))}
                       {generatedImages.length === 0 && Array(4).fill(0).map((_, i) => (
                         <div key={`skel-${i}`} className="rounded-[2.5rem] border border-dashed border-slate-200 aspect-square flex items-center justify-center bg-slate-50/50">
                            <ImageIcon className="text-slate-200" size={32} />
                         </div>
                       ))}
                   </div>
               </div>

               {/* Stage 2: Source Catalog Management */}
               <div className="space-y-6 pt-12 border-t border-slate-100">
                   <div className="px-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-2">Source Image Catalog</h4>
                    <p className="text-slate-400 text-[11px] font-medium italic">Enable/Disable images for the final broadcast. Select one as the AI Reference.</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {product.images?.map((img, i) => (
                           <div 
                             key={`src-${i}`} 
                             className={cn(
                               "relative rounded-3xl p-4 border-2 flex items-center gap-4 transition-all",
                               maintainedImages.includes(img) ? "border-slate-100 bg-white" : "border-slate-50 opacity-40 bg-slate-50 grayscale"
                             )}
                           >
                               <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                                  <img src={img} className="w-full h-full object-cover" />
                               </div>
                               <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                     <input 
                                       type="checkbox" 
                                       checked={maintainedImages.includes(img)}
                                       onChange={() => toggleMaintainedImage(img)}
                                       className="w-5 h-5 rounded-lg text-primary focus:ring-primary border-slate-200 cursor-pointer"
                                     />
                                     <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Maintain</span>
                                  </div>
                                  <button 
                                    onClick={() => setReferenceImage(img)}
                                    className={cn(
                                      "w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                      referenceImage === img ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                    )}
                                  >
                                    {referenceImage === img ? "ACTIVE REFERENCE" : "SET REFERENCE"}
                                  </button>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
            </div>
          )}

          {activeTab === 'pricing' && (
             <div className="space-y-8 animate-in slide-in-from-right-4">
                <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm">
                   <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-6">
                         <div className="w-20 h-20 bg-slate-950 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
                            <DollarSign size={40} />
                         </div>
                         <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Price Matrix</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Optimizing for global revenue</p>
                         </div>
                      </div>
                      <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Neural Recommendation</p>
                          <span className={cn(
                              "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
                              pricingStrategy.toLowerCase().includes("decrease") ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                              {pricingStrategy || "Analyzing Market Feed..."}
                          </span>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                       <div className="space-y-8">
                           <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
                               <p className="text-[10px] text-slate-400 font-black uppercase mb-6 tracking-widest">Global Marketplace Value</p>
                               <div className="flex items-center gap-8 relative">
                                   <span className="text-6xl font-black text-slate-400 italic shrink-0">$</span>
                                   <input 
                                     type="number"
                                     value={price}
                                     onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                                     className="bg-transparent text-7xl font-black text-slate-950 w-full outline-none focus:text-primary transition-colors tracking-tighter"
                                   />
                               </div>
                           </div>
                           
                           <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-start gap-6">
                               <TrendingUp className="text-primary mt-1" size={24} />
                               <div>
                                   <p className="text-[11px] font-black text-primary uppercase mb-2">Market Sentiment Analyzer</p>
                                   <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                                       Competitor baseline stands at <b>${competitorData?.stats?.avg || 'N/A'}</b>. 
                                       Your current vector of <b>${price.toFixed(2)}</b> provides a healthy buffer while maintaining competitive advantage.
                                   </p>
                               </div>
                           </div>
                       </div>

                       <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Competitor Live Vector</h4>
                            <div className="space-y-4">
                                {competitorData?.map((comp, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-6 bg-white border-2 border-slate-50 rounded-3xl hover:border-slate-100 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] mb-1">{comp.title}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{comp.seller}</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-950 tracking-tighter">${comp.price}</span>
                                    </div>
                                ))}
                                {!competitorData && <div className="p-16 text-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 rounded-3xl">Synchronizing market intel...</div>}
                            </div>
                       </div>
                   </div>

                   <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 pt-16 border-t border-slate-100">
                        <div className="text-center group">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest group-hover:text-slate-900 transition-colors">Base Origin Cost</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter font-serif italic">${sourceProduct?.price || 0}</p>
                        </div>
                        <div className="text-center group border-x border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest group-hover:text-slate-900 transition-colors">Platform Excise Fee</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter font-serif italic">${(price * 0.12).toFixed(2)}</p>
                        </div>
                        <div className="text-center group">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest group-hover:text-slate-900 transition-colors">Projected Net ROI</p>
                            <p className="text-4xl font-black text-emerald-500 tracking-tight italic">
                              ${(price - (sourceProduct?.price || 0) - (price * 0.12)).toFixed(2)}
                            </p>
                        </div>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Sidebar Status Column */}
        <div className="xl:col-span-1 space-y-8">
           <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center justify-center gap-2 italic">
                 Market Health
              </h3>
              <div className="flex justify-center mb-10 relative">
                  <div className="w-48 h-48 flex items-center justify-center">
                      <div className="absolute inset-0 border-[16px] border-slate-50 rounded-full" />
                      <div className="absolute inset-0 border-[16px] border-primary rounded-full border-t-transparent animate-spin-slow rotate-[145deg]" />
                      <div className="flex flex-col items-center">
                          <span className="text-6xl font-black text-slate-950 tracking-tighter italic">98</span>
                          <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Rank %</span>
                      </div>
                  </div>
              </div>
              <div className="p-6 bg-slate-950 rounded-[1.5rem] text-white shadow-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">AI Verdict</p>
                  <p className="text-[13px] font-medium leading-relaxed italic">"Optimal vector identified. Prime for Tier-1 broadcast."</p>
              </div>
           </div>

           <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Info size={80} />
               </div>
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 opacity-40">System Handshakes</h3>
               <div className="space-y-6">
                  <div className="flex gap-4 items-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <p className="text-[12px] font-bold opacity-80 uppercase tracking-widest">EBay Browse API V1.0</p>
                  </div>
                  <div className="flex gap-4 items-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <p className="text-[12px] font-bold opacity-80 uppercase tracking-widest">Gemini 1.5 Ultra Optimized</p>
                  </div>
                  <div className="flex gap-4 items-center">
                      <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse" />
                      <p className="text-[12px] font-bold opacity-80 uppercase tracking-widest">Nano Banana Ready</p>
                  </div>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizeProduct;
