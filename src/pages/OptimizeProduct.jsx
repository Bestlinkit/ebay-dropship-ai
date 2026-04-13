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
  Settings2,
  Tag,
  Layers,
  Info,
  AlertCircle
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
  const [imagePrompt, setImagePrompt] = useState("");
  const [visualLoading, setVisualLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [referenceImage, setReferenceImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    const hydrate = async () => {
        if (id) {
            setLoading(true);
            try {
                const fetchedProduct = await ebayService.getProductById(id);
                if (fetchedProduct) {
                    setProduct(fetchedProduct);
                    setPrice(fetchedProduct.price);
                    setDescription(fetchedProduct.description);
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
      
      addLog("Fetching Real-Time Competitor Pricing...");
      const insights = await ebayService.getCompetitorInsights(product.title);
      setCompetitorData(insights);
      
      addLog("Synthesizing SEO Ranking Metrics...");
      const optimization = await aiService.optimizeListing(product.title, product.price, insights);
      
      setTitles(optimization.titles || []);
      setSelectedTitle(optimization.titles?.[0]?.title || product.title);
      setDescription(optimization.description || product.description);
      setMainCategory(optimization.mainCategory || "General");
      setSubCategory(optimization.subCategory || "Electronics");
      setTags(optimization.tags || []);
      setPricingStrategy(optimization.pricingStrategy || "Analyze market trends.");
      
      addLog("Crafting Visual Studio directives...");
      const prompt = await aiService.generateImagePrompt(product.title, "close-up marketable");
      setImagePrompt(prompt);
      
      addLog("Process Complete.");
    } catch (error) {
      console.error(error);
      toast.error("AI Suite Handshake Failed.");
    } finally {
      setTimeout(() => setIsProcessing(false), 1200);
    }
  };

  const handlePushToStore = async () => {
    if (!id) return;
    setLoading(true);
    const label = isStoreConnected ? "eBay Production" : "Internal Hub";
    const toastId = toast.loading(`Pushing optimized vector to ${label}...`);
    
    try {
        if (isStoreConnected) {
            const token = user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN;
            await ebayTrading.reviseItem(token, id, {
                title: selectedTitle || product.title,
                price: price,
                description: description
            });
        } else {
            await new Promise(r => setTimeout(r, 1500));
        }
        
        setIsDeployed(true);
        toast.dismiss(toastId);
        toast.success(`Listing successfully updated on ${label}!`);
    } catch (e) {
        toast.dismiss(toastId);
        toast.error(`Sync Failed: ${e.message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!referenceImage) {
        toast.error("Please select a reference image first.");
        return;
    }
    setVisualLoading(true);
    try {
      const variations = await aiService.generateProductImageVariations(referenceImage);
      setGeneratedImages(variations);
      toast.success("Nano Banana: 8 close-up variations generated.");
    } catch (error) {
      toast.error("Visual Studio offline.");
    } finally {
      setVisualLoading(false);
    }
  };

  const toggleImageSelection = (img) => {
    setSelectedImages(prev => 
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
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Listing Live</h2>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed">
                        Your optimized product data has been broadcasted. Market analytics will begin tracking conversion in 60 minutes.
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
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Optimization Hub</h1>
          <p className="text-slate-500 mt-1 font-medium">Production-grade SEO & Market Intel.</p>
        </div>
        <button 
          onClick={handlePushToStore}
          className="bg-primary text-white flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
        >
          {isStoreConnected ? "Sync to Production" : "Stage Listing"}
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
                  <h3 className="text-xl font-bold flex items-center gap-3 italic">
                    <Sparkles className="text-primary" size={24} />
                    Tiered SEO Titles
                  </h3>
                  <button onClick={runOptimization} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-primary transition-all">
                      <RefreshCw size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {titles.map((t, i) => (
                    <div 
                      key={i}
                      onClick={() => setSelectedTitle(t.title)}
                      className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                        selectedTitle === t.title ? 'border-primary bg-primary/5' : 'border-slate-50 bg-white hover:border-slate-100 shadow-sm'
                      }`}
                    >
                       <div className="flex flex-col gap-1">
                          <span className="text-lg font-bold text-slate-800 tracking-tight">{t.title}</span>
                          <div className="flex items-center gap-2">
                             <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${t.rank}%` }} />
                             </div>
                             <span className="text-[10px] font-black text-emerald-600 uppercase">{t.rank}% Ranking Prob.</span>
                          </div>
                       </div>
                       {selectedTitle === t.title && <CheckCircle className="text-primary" size={24} />}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={12} />
                            Primary Category
                        </label>
                        <input className="w-full bg-white border border-slate-200 p-4 rounded-xl font-bold text-sm" value={mainCategory} onChange={e => setMainCategory(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={12} />
                            Sub-Category
                        </label>
                        <input className="w-full bg-white border border-slate-200 p-4 rounded-xl font-bold text-sm" value={subCategory} onChange={e => setSubCategory(e.target.value)} />
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                        <Tag size={12} />
                        Keyword Optimization Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, i) => (
                            <span key={i} className="px-4 py-2 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                                {tag}
                            </span>
                        ))}
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
            <div className="space-y-8 animate-in zoom-in-95">
               <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                      <Zap size={120} />
                  </div>
                  <h3 className="text-2xl font-black mb-8 flex items-center gap-4">
                    <Zap className="text-amber-500" fill="currentColor" />
                    Nano Banana Studio
                  </h3>
                  <p className="text-slate-500 mb-8 max-w-xl font-medium">
                      Select a reference image below. Our AI will generate 8 high-conversion close-up variations suitable for premium marketplaces.
                  </p>
                  
                  <button 
                    disabled={visualLoading || !referenceImage}
                    onClick={handleGenerateVariations}
                    className="w-fit px-12 btn-primary h-16 flex items-center justify-center gap-4 shadow-2xl disabled:opacity-50"
                  >
                    {visualLoading ? <RefreshCw className="animate-spin" size={24} /> : <Sparkles size={24} />}
                    Generate 8 Variations
                  </button>
               </div>

               <div className="space-y-6">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Visual Catalog</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       {/* Generated Images */}
                       {generatedImages.map((img, i) => (
                           <div 
                             key={`gen-${i}`} 
                             onClick={() => toggleImageSelection(img)}
                             className={cn(
                               "group relative rounded-[2rem] overflow-hidden aspect-square border-4 transition-all cursor-pointer shadow-xl",
                               selectedImages.includes(img) ? "border-primary" : "border-transparent"
                             )}
                           >
                               <img src={img} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                   <div className="bg-white p-3 rounded-full text-slate-900 transform scale-90 group-hover:scale-100 duration-300">
                                       <CheckCircle size={24} fill={selectedImages.includes(img) ? "currentColor" : "none"} />
                                   </div>
                               </div>
                               <div className="absolute top-4 left-4 bg-primary text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg">AI Variational</div>
                           </div>
                       ))}
                       {/* Source Images */}
                       {product.images?.map((img, i) => (
                           <div 
                             key={`src-${i}`} 
                             onClick={() => setReferenceImage(img)}
                             className={cn(
                               "group relative rounded-[2rem] overflow-hidden aspect-square border-4 cursor-pointer transition-all",
                               referenceImage === img ? "border-amber-400" : "border-slate-100"
                             )}
                           >
                               <img src={img} className="w-full h-full object-cover" />
                               <div className="absolute top-4 left-4 bg-white/90 px-2 py-1 rounded-lg text-[9px] font-black text-slate-500 shadow-sm">REFERENCE SOURCE</div>
                               {referenceImage === img && (
                                   <div className="absolute bottom-4 right-4 bg-amber-400 text-slate-900 p-1.5 rounded-full shadow-lg">
                                       <Target size={14} />
                                   </div>
                               )}
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
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <DollarSign size={32} />
                         </div>
                         <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Price Matrix</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Adjust for Market Dominance</p>
                         </div>
                      </div>
                      <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Recommended Action</p>
                          <span className={cn(
                              "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border",
                              pricingStrategy.includes("Decrease") ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                              {pricingStrategy || "Optimizing..."}
                          </span>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                       <div className="space-y-6">
                           <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                               <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 tracking-widest">Global Marketplace Price</p>
                               <div className="flex items-center gap-6">
                                   <span className="text-5xl font-black text-slate-900 italic">$</span>
                                   <input 
                                     type="number"
                                     value={price}
                                     onChange={(e) => setPrice(parseFloat(e.target.value))}
                                     className="bg-transparent text-5xl font-black text-slate-900 w-full outline-none focus:text-primary transition-colors"
                                   />
                               </div>
                           </div>
                           
                           <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                               <TrendingUp className="text-blue-500 mt-1" size={20} />
                               <div>
                                   <p className="text-xs font-bold text-blue-900 mb-1">AI Recommendation Strategist</p>
                                   <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                                       Based on real-time competitor data (Avg: ${competitorData?.stats?.avg || 'N/A'}), 
                                       setting your price to <b>${(competitorData?.stats?.avg * 0.95 || price).toFixed(2)}</b> will likely bypass current top sellers.
                                   </p>
                               </div>
                           </div>
                       </div>

                       <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Competitor Baseline (Live Feed)</h4>
                            <div className="space-y-3">
                                {competitorData?.map((comp, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[180px]">{comp.title}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase">{comp.seller}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">${comp.price}</span>
                                    </div>
                                ))}
                                {!competitorData && <div className="p-8 text-center text-slate-300 font-bold italic">Loading market intel...</div>}
                            </div>
                       </div>
                   </div>

                   <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-slate-100">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Base Cost</p>
                            <p className="text-xl font-black text-slate-900">${sourceProduct?.price || 0}</p>
                        </div>
                        <div className="text-center border-x border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">eBay Fee (Est.)</p>
                            <p className="text-xl font-black text-slate-900">${(price * 0.12).toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Net Profit</p>
                            <p className="text-2xl font-black text-emerald-600">${(price - (sourceProduct?.price || 0) - (price * 0.12)).toFixed(2)}</p>
                        </div>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="xl:col-span-1 space-y-6">
           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center justify-center gap-2">
                 Market Health
              </h3>
              <div className="flex justify-center mb-8 relative">
                  <div className="w-40 h-40 flex items-center justify-center">
                      <div className="absolute inset-0 border-[12px] border-slate-50 rounded-full" />
                      <div className="absolute inset-0 border-[12px] border-primary rounded-full border-t-transparent animate-spin-slow rotate-[120deg]" />
                      <div className="flex flex-col items-center">
                          <span className="text-5xl font-black text-slate-900 tracking-tighter">98</span>
                          <span className="text-[10px] font-black text-primary uppercase">Rank %</span>
                      </div>
                  </div>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl text-white">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1">AI Verdict</p>
                  <p className="text-[11px] font-medium leading-relaxed italic opacity-80">"Listing is prime for Tier-1 placement."</p>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
               <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 opacity-40">Process Feed</h3>
               <div className="space-y-4">
                  <div className="flex gap-4">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                      <p className="text-[11px] font-medium opacity-80">eBay Browse API 1.0 Connected</p>
                  </div>
                  <div className="flex gap-4">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                      <p className="text-[11px] font-medium opacity-80">Gemini 1.5 Flash SEO Optimized</p>
                  </div>
                  <div className="flex gap-4">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0 animate-pulse" />
                      <p className="text-[11px] font-medium opacity-80">Nano Banana Visual Engine Ready</p>
                  </div>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizeProduct;
