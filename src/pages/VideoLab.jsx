import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Plus, 
  Trash2, 
  Sparkles, 
  Music,
  Loader2,
  CheckCircle,
  Layout,
  Type,
  Zap,
  Volume2,
  ImageIcon,
  ChevronRight,
  Download,
  Shuffle,
  RefreshCw,
  Stars,
  Palette,
  ArrowRight,
  Package,
  Layers,
  ChevronDown,
  Globe,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import videoService from '../services/video';
import aiService from '../services/ai';
import ebayService from '../services/ebay';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

/**
 * Crystal Pulse Video Lab (V5.4)
 * Premium Multi-Objective 24s Production Hub
 */
const VideoLab = () => {
  const [inventory, setInventory] = useState([
    { id: '1', title: 'Loading Inventory...', img: 'https://via.placeholder.com/400' },
  ]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchRealInventory = async () => {
        try {
            const products = await ebayService.searchProducts('trending');
            if (products && products.length > 0) {
                const mapped = products.map(p => ({
                    id: p.id,
                    title: p.title,
                    img: p.thumbnail,
                    price: p.price
                }));
                setInventory(mapped);
                setSelectedProduct(mapped[0]);
            }
        } catch (error) {
            console.error("Video Lab Inventory Sync Fail:", error);
        }
    };
    fetchRealInventory();
  }, []);

  const [adObjective, setAdObjective] = useState('ebay'); // 'ebay' | 'social'
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);

  // 8 Scenes for 24s video (3s each)
  const [scenes, setScenes] = useState([
    "STOP SCROLLING!",
    "Meet your new favorite routine.",
    "Pro-grade performance daily.",
    "Engineered for results.",
    "Trusted by thousands.",
    "Transform your lifestyle.",
    "5-Star Quality Guaranteed.",
    "Order Now - Link Below!"
  ]);

  const images = Array.from({ length: 8 }).map((_, i) => 
    `https://images.unsplash.com/photo-${1500000000000 + (i * 1000000)}?auto=format&fit=crop&q=80&w=400&h=700`
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % 8);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setScenes(prev => {
        const newScenes = [...prev];
        newScenes[7] = adObjective === 'ebay' 
            ? "Order Now - Link Below!" 
            : "Shop Now - Link in Bio!";
        return newScenes;
    });
  }, [adObjective]);

  const handleAutoCraft = async () => {
    if (!selectedProduct) return;
    setIsAiProcessing(true);
    try {
      toast.info(`Smart scan initiated for "${selectedProduct.title}"...`);
      const newScenes = await aiService.generateVideoScript(selectedProduct);
      if (newScenes && Array.isArray(newScenes)) {
        newScenes[7] = adObjective === 'ebay' ? "Order Now - Link Below!" : "Shop Now - Limited Time!";
        setScenes(newScenes);
        toast.success("Viral Sequence Orchestrated!");
      }
    } catch (error) {
      toast.error("AI Scripting error.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleExport = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setProgress(0);
    
    try {
      toast.info("Initializing Crystal Production Engine...");
      const resultUrl = await videoService.generateProAd(
        images, 
        scenes, 
        (p) => setProgress(p)
      );
      setVideoUrl(resultUrl);
      toast.success("24s Multi-Objective Ad Produced!");
      
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = `${adObjective}-ad-${selectedProduct.id}.mp4`;
      link.click();
    } catch (error) {
      toast.error("Video Production failed.");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-32 max-w-[1700px] mx-auto">
      
      {/* Editorial Hero Header */}
      <section className="relative min-h-[400px] flex flex-col items-center justify-center text-center px-6 overflow-hidden rounded-[3.5rem] bg-slate-900 shadow-3xl mx-4 lg:mx-0">
         <div className="absolute inset-0 bg-gradient-to-b from-slate-800/20 to-slate-900" />
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -mr-64 -mt-64" />
         
         <div className="relative z-10 space-y-10 w-full max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 text-primary-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
                    <Stars size={14} className="fill-primary-400" />
                    Professional Video Suite
                </div>
                <h1 className="text-5xl md:text-7xl font-outfit font-black text-white tracking-tighter uppercase italic">Viral Video.</h1>
                <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl mx-auto text-balance">
                    Generate high-velocity video assets powered by AI-driven scripting and automated motion graphics.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch max-w-3xl mx-auto w-full">
                <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 flex-1">
                    {[
                        { id: 'ebay', label: 'eBay Native', icon: ShoppingBag },
                        { id: 'social', label: 'Social Ad', icon: Globe }
                    ].map(obj => (
                        <button
                            key={obj.id}
                            onClick={() => setAdObjective(obj.id)}
                            className={cn(
                                "flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                                adObjective === obj.id ? "bg-white text-slate-900 shadow-2xl" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <obj.icon size={16} />
                            {obj.label}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 group">
                    <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
                    <select 
                        value={selectedProduct?.id || ''}
                        onChange={(e) => setSelectedProduct(inventory.find(p => p.id === e.target.value))}
                        className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl pl-14 pr-10 h-full py-5 text-[10px] font-black text-white appearance-none outline-none focus:ring-4 focus:ring-primary-500/20 transition-all uppercase tracking-widest"
                    >
                        {inventory.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                </div>

                <button 
                  onClick={handleAutoCraft}
                  disabled={isAiProcessing}
                  className="px-10 h-full py-5 bg-primary-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 transition-all active:scale-95 shadow-2xl shadow-primary-500/20 flex items-center justify-center gap-3"
                >
                  {isAiProcessing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="fill-white" />}
                  Auto-Craft
                </button>
            </div>
         </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 px-4 lg:px-0">
        
        {/* Production Preview */}
        <div className="xl:col-span-5 2xl:col-span-4">
            <div className="glass-card p-10 rounded-[3.5rem] relative group xl:sticky xl:top-28">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Project Monitor</h3>
                    <div className="px-3 py-1 bg-emerald-500/10 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                    </div>
                </div>
                
                <div className="relative w-full aspect-[9/16] rounded-[2.5rem] overflow-hidden shadow-3xl border-[12px] border-slate-900 bg-slate-900">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="w-full h-full relative"
                      >
                         <img 
                            src={images[activeIndex]}
                            className="w-full h-full object-cover opacity-60 transition-transform duration-[3000ms] scale-110 group-hover:scale-100"
                            alt="Preview Segment"
                         />
                         <div className="absolute inset-0 p-10 flex flex-col items-center justify-center text-center">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2rem] shadow-2xl"
                            >
                                <p className="text-white text-lg font-black uppercase leading-tight tracking-tighter drop-shadow-2xl italic">
                                    {scenes[activeIndex]}
                                </p>
                            </motion.div>
                         </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Timeline */}
                    <div className="absolute bottom-12 left-0 right-0 px-10">
                         <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                             <motion.div 
                                className="bg-primary-500 h-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                                animate={{ width: `${((activeIndex + 1) / 8) * 100}%` }}
                             />
                         </div>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <Music size={18} className="text-primary-500 animate-bounce" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Sync Active</span>
                </div>
            </div>
        </div>

        {/* Scene Architecture */}
        <div className="xl:col-span-7 2xl:col-span-8 space-y-12">
            <div className="glass-card p-10 rounded-[3.5rem] space-y-10">
                <div className="flex items-center justify-between border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em]">Scene Sequence</h3>
                        <p className="text-2xl font-outfit font-black text-slate-900 uppercase">Architecture Hub.</p>
                    </div>
                    <div className="hidden md:block px-5 py-2 bg-slate-900 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest">Production Ready</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                    {scenes.map((text, i) => (
                        <div 
                            key={i} 
                            className={cn(
                                "p-8 rounded-[2.5rem] border transition-all duration-500 flex gap-6 items-center group relative overflow-hidden",
                                activeIndex === i ? "bg-slate-900 border-slate-900 text-white shadow-3xl scale-[1.02]" : "bg-white border-slate-100 hover:border-primary-200"
                            )}
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 transition-all",
                                activeIndex === i ? "bg-primary-500 text-white rotate-6" : "bg-slate-50 text-slate-400 border border-slate-100"
                            )}>
                                0{i+1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1.5", activeIndex === i ? "text-primary-400" : "text-slate-400")}>
                                    {i === 0 ? 'Engagement Hook' : i === 7 ? 'Conversion CTA' : `Scene ${i+1}`}
                                </p>
                                <input 
                                    type="text"
                                    value={text}
                                    onChange={(e) => {
                                        const newScenes = [...scenes];
                                        newScenes[i] = e.target.value;
                                        setScenes(newScenes);
                                    }}
                                    className={cn(
                                        "w-full bg-transparent border-none outline-none text-sm font-bold tracking-tight px-0",
                                        activeIndex === i ? "text-white italic placeholder:text-white/20" : "text-slate-900 placeholder:text-slate-200"
                                    )}
                                />
                            </div>
                            {activeIndex === i && (
                                <motion.div layoutId="scenePulse" className="absolute bottom-0 left-0 h-1.5 bg-primary-500 w-full" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="pt-6 flex flex-col md:flex-row gap-6">
                    <button 
                        onClick={handleExport}
                        disabled={isGenerating}
                        className="flex-1 overflow-hidden relative h-[90px] bg-slate-900 text-white rounded-[2rem] flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] shadow-3xl active:scale-95 transition-all group"
                    >
                        {isGenerating ? (
                            <>
                                <div className="absolute inset-0 bg-primary-500/20 transition-all duration-500" style={{ width: `${progress}%` }} />
                                <Loader2 className="animate-spin" size={20} />
                                <span className="relative z-10">Producing Master: {progress}%</span>
                            </>
                        ) : (
                            <>
                                <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                                <span>Export Native Assets</span>
                            </>
                        )}
                    </button>
                    <button className="px-12 h-[90px] bg-white border border-slate-100 rounded-[2rem] text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center gap-4 group">
                        <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Resync</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {videoUrl && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-10 bg-emerald-900 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8 border border-emerald-800 shadow-3xl text-white"
                    >
                        <div className="flex items-center gap-8 text-center md:text-left">
                             <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl">
                                <CheckCircle size={40} className="fill-emerald-500 text-white" />
                             </div>
                             <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Export Complete</p>
                                <h4 className="text-xl font-outfit font-black uppercase tracking-tight">Master Sequence Ready.</h4>
                             </div>
                        </div>
                        <button className="w-full md:w-auto px-12 h-16 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3">
                             Deploy to Channel <ExternalLink size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VideoLab;
