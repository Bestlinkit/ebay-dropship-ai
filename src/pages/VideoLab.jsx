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
 * Multi-Objective 24s Production Engine
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

  // Update CTA when objective changes
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
      toast.info(`Neural scan initiated for "${selectedProduct.title}"...`);
      const newScenes = await aiService.generateVideoScript(selectedProduct);
      if (newScenes && Array.isArray(newScenes)) {
        // Ensure final scene matches objective
        newScenes[7] = adObjective === 'ebay' ? "Order Now - Link Below!" : "Shop Now - Limited Time!";
        setScenes(newScenes);
        toast.success("Viral Sequence Orchestrated!");
      }
    } catch (error) {
      toast.error("AI Scripting encounter a vector mismatch.");
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
      toast.error("Video Production failed. Check security vectors.");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-1000 pb-32 max-w-[1600px] mx-auto">
      
      {/* Command Console */}
      <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-8 md:gap-12">
        <div className="space-y-4 max-w-xl text-center xl:text-left">
           <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full w-fit mx-auto xl:mx-0">
              <Zap size={14} className="text-primary fill-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Production Hub v5.4</span>
           </div>
           <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">Viral Video Lab</h1>
           <p className="text-slate-400 font-medium text-sm md:text-base">Select a product and ad objective to auto-craft high-converting video assets.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full xl:w-auto">
            {/* Objective Toggle */}
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full md:w-auto">
                <button 
                    onClick={() => setAdObjective('ebay')}
                    className={cn("flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", adObjective === 'ebay' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}
                >
                    <ShoppingBag size={14} /> eBay Native
                </button>
                <button 
                    onClick={() => setAdObjective('social')}
                    className={cn("flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", adObjective === 'social' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}
                >
                    <Globe size={14} /> Social Ad
                </button>
            </div>

            <div className="relative w-full md:w-72 group">
                <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                <select 
                    value={selectedProduct?.id || ''}
                    onChange={(e) => setSelectedProduct(inventory.find(p => p.id === e.target.value))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-10 py-4 text-[10px] md:text-xs font-bold appearance-none outline-none focus:ring-4 focus:ring-primary/10 transition-all uppercase tracking-widest"
                >
                    {inventory.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
            </div>

            <button 
                onClick={handleAutoCraft}
                disabled={isAiProcessing}
                className="w-full md:w-auto px-10 h-16 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
                {isAiProcessing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Auto-Craft</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12 items-start px-4 lg:px-0">
        
        {/* Production Preview */}
        <div className="xl:col-span-5 2xl:col-span-4 order-2 xl:order-1">
            <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative group xl:sticky xl:top-28">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Live Vector Preview</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-900 uppercase">24s Active</span>
                    </div>
                </div>
                
                <div className="relative w-full aspect-[9/16] max-w-[400px] mx-auto rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-[8px] md:border-[12px] border-slate-900 bg-slate-900">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="w-full h-full relative"
                      >
                         <img 
                            src={images[activeIndex]}
                            className="w-full h-full object-cover opacity-60 transition-transform duration-[3000ms] scale-110 group-hover:scale-100"
                            alt="Preview Segment"
                         />
                         <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-white/10 backdrop-blur-2xl border border-white/20 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl"
                            >
                                <p className="text-white text-base md:text-lg font-extrabold uppercase leading-tight tracking-tight drop-shadow-xl italic">
                                    {scenes[activeIndex]}
                                </p>
                            </motion.div>
                         </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Progress Monitor */}
                    <div className="absolute bottom-10 md:bottom-12 left-0 right-0 px-8 md:px-10">
                         <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                             <motion.div 
                                className="bg-primary h-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                                animate={{ width: `${((activeIndex + 1) / 8) * 100}%` }}
                             />
                         </div>
                    </div>
                </div>

                <div className="mt-8 md:mt-10 flex items-center justify-center gap-3 bg-slate-50 px-6 py-4 rounded-[1.25rem] border border-slate-100">
                    <Music size={16} className="text-primary animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Neural Audio Sync Active</span>
                </div>
            </div>
        </div>

        {/* Matrix Console: Main Workspace */}
        <div className="lg:col-span-12 xl:col-span-7 2xl:col-span-8">
            <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 md:space-y-12">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                                <Layers size={24} className="text-primary" />
                                Sequence Architecture
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-9">8 Scenes | 3.0s Frequency | 4K Upscale</p>
                        </div>
                        <span className="text-[10px] font-bold text-white px-4 py-1.5 bg-slate-900 rounded-full tracking-widest">PRODUCTION READY</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {scenes.map((text, i) => (
                            <div 
                                key={i} 
                                className={cn(
                                    "p-8 rounded-[2rem] border transition-all duration-500 flex gap-6 items-center group/item relative overflow-hidden",
                                    activeIndex === i ? "bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]" : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-200"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                                    activeIndex === i ? "bg-primary text-white" : "bg-white text-slate-400 border border-slate-100"
                                )}>
                                    0{i+1}
                                </div>
                                <div className="flex-1">
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", activeIndex === i ? "text-primary" : "text-slate-400")}>
                                        {i === 0 ? 'Hook Vector' : i === 7 ? 'CTA Final' : `Segment ${i+1}`}
                                    </p>
                                    <p className={cn(
                                        "text-sm font-bold leading-relaxed",
                                        activeIndex === i ? "text-white italic" : "text-slate-900"
                                    )}>
                                        "{text}"
                                    </p>
                                </div>
                                {activeIndex === i && (
                                    <motion.div 
                                        layoutId="pulse"
                                        className="absolute bottom-0 left-0 h-1 bg-primary w-full"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 flex flex-col sm:flex-row gap-6">
                        <button 
                            onClick={handleExport}
                            disabled={isGenerating}
                            className="flex-1 bg-slate-900 text-white h-24 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/30 active:scale-95 transition-all group relative overflow-hidden"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="absolute inset-0 bg-primary/20 transition-all duration-500" style={{ width: `${progress}%` }} />
                                    <div className="relative z-10 flex items-center gap-4">
                                        <Loader2 className="animate-spin" size={24} />
                                        <span>PRODUCING: {progress}%</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Download size={24} className="group-hover:translate-y-1 transition-transform" />
                                    <span>Export Master Sequence</span>
                                </div>
                            )}
                        </button>
                        <button className="px-12 h-24 bg-white border border-slate-200 rounded-[2rem] text-slate-400 hover:text-primary transition-all flex items-center justify-center gap-3 group">
                            <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Resync</span>
                        </button>
                    </div>

                    {videoUrl && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] flex items-center justify-between"
                        >
                            <div className="flex items-center gap-6">
                                 <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                                    <CheckCircle size={32} />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-sm font-bold text-emerald-900 uppercase tracking-widest">MASTER EXPORT COMPLETE</p>
                                    <p className="text-xs font-medium text-emerald-600/80 italic">Vector alignment verified. Asset ready for deployment.</p>
                                 </div>
                            </div>
                            <button className="bg-emerald-500 text-white px-10 h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-xl">
                                 {adObjective === 'ebay' ? 'Push to eBay' : 'Push to Hub'} <ExternalLink size={16} />
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
      </div>
    </div>
  );
};

export default VideoLab;
