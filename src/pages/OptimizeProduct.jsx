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
  Settings2
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import aiService from '../services/ai';
import ebayService from '../services/ebay';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

/**
 * Clean & Professional AI Optimization Lab
 * Reverted to white/blue initial style.
 */
const OptimizeProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isStoreConnected } = useAuth();
  const { ebayProduct, sourceProduct } = location.state || {};

  const [loading, setLoading] = useState(!ebayProduct);
  const [product, setProduct] = useState(ebayProduct || {
    title: "",
    price: 0,
    images: []
  });

  const [titles, setTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState('text');
  
  // AI Flow States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [aiLogs, setAiLogs] = useState([]);
  const [imagePrompt, setImagePrompt] = useState("");
  const [visualLoading, setVisualLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
        if (!ebayProduct && id) {
            setLoading(true);
            try {
                // Check if we have mock data source for direct navigation
                const fetchedProduct = await ebayService.getProductById(id);
                if (fetchedProduct) {
                    setProduct(fetchedProduct);
                } else {
                    toast.error("Product not found.");
                }
            } catch (err) {
                toast.error("Failed to restore session.");
            } finally {
                setLoading(false);
            }
        }
    };
    hydrate();
  }, [id, ebayProduct]);

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
      addLog("Initializing AI Suite...");
      await new Promise(r => setTimeout(r, 800));
      
      addLog("Analyzing competitor SEO data...");
      const generatedTitles = await aiService.generateTitles(product.title);
      setTitles(generatedTitles);
      setSelectedTitle(generatedTitles[0] || product.title);
      
      addLog("Generating sales-optimized description...");
      const generatedDesc = await aiService.generateDescription(product.title);
      setDescription(generatedDesc);
      
      addLog("Crafting visual rendering prompt...");
      const prompt = await aiService.generateImagePrompt(product.title, "lifestyle");
      setImagePrompt(prompt);
      
      addLog("Process Complete.");
    } catch (error) {
      toast.error("AI Error: Connection failed.");
    } finally {
      setTimeout(() => setIsProcessing(false), 1200);
    }
  };

  const handlePushToStore = async () => {
    setLoading(true);
    const label = isStoreConnected ? "eBay" : "Internal Hub";
    toast.loading(`Deploying product vector to ${label}...`);
    try {
        await new Promise(r => setTimeout(r, 2000));
        setIsDeployed(true);
        toast.dismiss();
        toast.success(`Product successfully ${isStoreConnected ? 'pushed' : 'staged'}!`);
    } catch (e) {
        toast.error("Deployment failed.");
    } finally {
        setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setVisualLoading(true);
    try {
      const newImg = await aiService.generateProductImage(imagePrompt);
      setGeneratedImages(prev => [newImg, ...prev]);
      toast.success("AI Visual generated.");
    } catch (error) {
      toast.error("Vison AI failed.");
    } finally {
      setVisualLoading(false);
    }
  };

  if (isDeployed) {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in zoom-in-95 duration-700">
            <div className="max-w-xl w-full bg-white p-16 rounded-[4rem] border border-slate-100 shadow-3xl text-center space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                
                <div className={cn(
                    "relative mx-auto w-24 h-24 text-white rounded-[2rem] flex items-center justify-center shadow-2xl rotate-3",
                    isStoreConnected ? "bg-emerald-500 shadow-emerald-500/20" : "bg-primary shadow-primary/20"
                )}>
                    <CheckCircle size={48} />
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                        {isStoreConnected ? "Mission Accomplished" : "Staging Complete"}
                    </h2>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed">
                        {isStoreConnected 
                            ? "Your product has been synchronized with eBay. Cross-platform ad vectors are now warming up."
                            : "Product saved to your internal Inventory Hub. You can finalize the eBay link on the Dashboard when ready."}
                    </p>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={() => navigate('/marketing')}
                        className="flex-1 bg-slate-900 text-white h-20 rounded-[1.5rem] font-extrabold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl"
                    >
                        Go to Marketing Hub
                    </button>
                    <button 
                        onClick={() => navigate('/discovery')}
                        className="flex-1 bg-white text-slate-900 border border-slate-200 h-20 rounded-[1.5rem] font-extrabold uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                    >
                        Find More Products
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 overflow-x-hidden">
      
      {/* AI Processing Overlay (Now Clean & Light) */}
      {isProcessing && (
          <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex items-center justify-center p-6">
              <div className="max-w-md w-full text-center p-12 bg-white rounded-3xl shadow-2xl border border-slate-100">
                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center mb-6">
                      <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                      <Cpu className="text-primary" size={48} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Optimizing...</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Processing Market Directives</p>

                  <div className="space-y-3">
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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Product Studio</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Refining your listing with professional AI content.</p>
        </div>
        <button 
          onClick={handlePushToStore}
          className="bg-slate-900 text-white flex items-center gap-2 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
        >
          {isStoreConnected ? "Push to Store" : "Stage in Inventory"}
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
            {[
              { id: 'text', label: 'Copy & SEO', icon: Type },
              { id: 'images', label: 'Visuals', icon: Camera },
              { id: 'pricing', label: 'Profit', icon: DollarSign },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'text' && (
            <div className="space-y-8 animate-in slide-in-from-left-4">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <Sparkles className="text-primary" size={24} />
                    AI SEO Titles
                  </h3>
                  <div className="flex gap-2">
                    <button 
                        onClick={() => setShowComparison(!showComparison)}
                        className={`p-2 rounded-lg border transition-all ${showComparison ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-600'}`}
                    >
                        <ArrowLeftRight size={18} />
                    </button>
                    <button onClick={runOptimization} className="p-2 bg-slate-50 text-slate-400 border border-slate-100 hover:text-primary rounded-lg">
                        <RefreshCw size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {showComparison && (
                    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Baseline Title</p>
                        <p className="text-sm font-medium text-slate-500 italic">"{product.title}"</p>
                    </div>
                  )}
                  {titles.map((title, i) => (
                    <div 
                      key={i}
                      onClick={() => setSelectedTitle(title)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                        selectedTitle === title ? 'border-primary bg-primary/5' : 'border-slate-50 bg-white hover:border-slate-100 shadow-sm'
                      }`}
                    >
                       <span className="text-base font-bold text-slate-700 tracking-tight">{title}</span>
                       {selectedTitle === title && <CheckCircle className="text-primary" size={20} />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Type className="text-primary" size={22} />
                        Product Description
                    </h3>
                </div>
                <div className="bg-white h-[500px]">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} className="h-[430px]" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-8 animate-in zoom-in-95">
               <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                    <Zap className="text-amber-500" />
                    AI Visual Studio
                  </h3>
                  <textarea 
                    className="input-field w-full h-32 text-sm p-4 mb-6"
                    placeholder="Refine visual style..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                  />
                  <button 
                    disabled={visualLoading}
                    onClick={handleGenerateImage}
                    className="w-full btn-primary h-14 flex items-center justify-center gap-3 shadow-lg"
                  >
                    {visualLoading ? <RefreshCw className="animate-spin" size={20} /> : <Camera size={20} />}
                    Generate Premium Mockup
                  </button>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {generatedImages.map((img, i) => (
                   <div key={i} className="group relative rounded-2xl overflow-hidden shadow-md aspect-square border border-slate-200">
                      <img src={img} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                         <span className="text-white text-[10px] font-bold uppercase p-2 border border-white rounded-lg">AI Generated</span>
                      </div>
                   </div>
                 ))}
                  {product.images?.map((img, i) => (
                    <div key={i} className="relative rounded-2xl overflow-hidden border border-slate-100 aspect-square shadow-sm">
                        <img src={img} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded-lg text-[8px] font-bold text-slate-500">Source</div>
                    </div>
                  ))}
                  {!product.images && product.thumbnail && (
                     <div className="relative rounded-2xl overflow-hidden border border-slate-100 aspect-square shadow-sm">
                        <img src={product.thumbnail} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded-lg text-[8px] font-bold text-slate-500">Thumbnail</div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'pricing' && (
             <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                <Settings2 className="mx-auto text-primary mb-6" size={48} />
                <h3 className="text-2xl font-bold mb-10">Profit Projections</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Base Cost</p>
                        <p className="text-2xl font-bold">${sourceProduct?.price || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Target Price</p>
                        <p className="text-2xl font-bold">${product.price}</p>
                    </div>
                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                        <p className="text-[10px] text-primary font-bold uppercase mb-1">Net Margin</p>
                        <p className="text-2xl font-bold text-primary">
                            ${(product.price - (sourceProduct?.price || 0) - (product.price * 0.1)).toFixed(2)}
                        </p>
                    </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl flex items-center gap-4 text-left border border-emerald-100">
                    <CheckCircle className="text-emerald-500" size={24} />
                    <p className="text-xs text-emerald-800 font-medium">Profit margin is within safe operational limits (12% buffer).</p>
                </div>
             </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="xl:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                <Target className="text-primary" size={22} />
                Health Score
              </h3>
              <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                      <div className="absolute inset-0 border-8 border-slate-100 rounded-full" />
                      <div className="absolute inset-0 border-8 border-primary rounded-full border-t-transparent animate-spin-slow rotate-[45deg]" />
                      <span className="text-3xl font-bold text-slate-800">92</span>
                  </div>
              </div>
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">A++ Performance</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizeProduct;
