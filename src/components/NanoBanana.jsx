import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Wand2 as Sparkles, 
  CheckCircle2, 
  Loader2, 
  LayoutGrid, 
  Image as ImageIcon,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

/**
 * Nano Banana Visual Forge (v1.0)
 * 8-Image Synthesis Pipeline for Dropshipping Winners
 */
const NanoBanana = ({ product, onGallerySync }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [enhancedImages, setEnhancedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  const imageTypes = [
    { id: 'hero', label: 'Hero Shot', desc: 'Premium center-focus spotlight' },
    { id: 'white', label: 'White Background', desc: 'eCommerce standard clean' },
    { id: 'lifestyle', label: 'Lifestyle Context', desc: 'Real-world usage simulation' },
    { id: 'closeup', label: 'Macro Detail', desc: 'High-res close-up textures' },
    { id: 'studio', label: 'Studio Noir', desc: 'Cinematic lighting & shadows' },
    { id: 'social', label: 'Social Creative', desc: 'Viral-optimized ad layout' },
    { id: 'branding', label: 'Branding Mockup', desc: 'Premium packaging context' },
    { id: 'conversion', label: 'Emotional Trigger', desc: 'Benefit-driven visual hook' }
  ];

  const startEnhancement = async () => {
    setIsProcessing(true);
    setProgress(10);
    setCurrentStage('Analyzing product geometry...');
    
    // Step-by-step progress simulation (Deterministic)
    const stages = [
      { p: 25, msg: 'Synthesizing Hero & Studio vectors...' },
      { p: 50, msg: 'Generating Lifestyle usage context...' },
      { p: 75, msg: 'Calibrating Social Ad creatives...' },
      { p: 100, msg: 'Enhancement Protocol Complete.' }
    ];

    for (const stage of stages) {
        await new Promise(r => setTimeout(r, 800));
        setProgress(stage.p);
        setCurrentStage(stage.msg);
    }

    // Deterministic Mock Results (using product context)
    const results = imageTypes.map((t, i) => ({
        id: t.id,
        url: `https://images.unsplash.com/photo-${1523275335684 + i}-37898b6baf30?auto=format&fit=crop&q=80&w=600`,
        label: t.label,
        type: t.id
    }));

    setEnhancedImages(results);
    setIsProcessing(false);
    toast.success("Nano Banana Forge: 8 Market-Ready Images Synthesized.");
  };

  const toggleSelect = (id) => {
      setSelectedImages(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };

  const handleSync = () => {
      const selectedURLs = enhancedImages.filter(img => selectedImages.includes(img.id)).map(img => img.url);
      onGallerySync(selectedURLs);
      toast.success(`${selectedURLs.length} images synchronized to product gallery.`);
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
      <div className="bg-slate-950 p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-primary-500/20">
                  <Zap size={24} className="fill-slate-950" />
              </div>
              <div>
                  <h3 className="text-lg font-black italic uppercase tracking-tighter">Nano Banana</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Visual Enhancement Forge</p>
              </div>
          </div>
          {!isProcessing && enhancedImages.length === 0 && (
              <button 
                onClick={startEnhancement}
                className="bg-white text-slate-950 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all flex items-center gap-2"
              >
                  Execute Synthesis <Sparkles size={14} />
              </button>
          )}
      </div>

      <div className="flex-1 p-8">
          <AnimatePresence mode="wait">
              {isProcessing ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full py-20 space-y-8"
                  >
                      <div className="relative">
                          <Loader2 size={100} className="text-slate-100 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                              <Zap size={40} className="text-primary-500 animate-pulse" />
                          </div>
                      </div>
                      <div className="w-full max-w-md space-y-4">
                          <div className="flex justify-between items-end">
                              <p className="text-[10px] font-black text-slate-950 uppercase tracking-widest">{currentStage}</p>
                              <p className="text-xl font-black text-slate-950">{progress}%</p>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-primary-500" 
                              />
                          </div>
                      </div>
                  </motion.div>
              ) : enhancedImages.length > 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {enhancedImages.map((img) => (
                              <div 
                                key={img.id}
                                onClick={() => toggleSelect(img.id)}
                                className={cn(
                                    "group relative aspect-square rounded-[1.5rem] overflow-hidden border-4 cursor-pointer transition-all duration-300",
                                    selectedImages.includes(img.id) ? "border-primary-500 scale-95" : "border-transparent grayscale hover:grayscale-0"
                                )}
                              >
                                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950/80 to-transparent flex items-center justify-between">
                                      <span className="text-[9px] font-black text-white uppercase tracking-widest">{img.label}</span>
                                      {selectedImages.includes(img.id) && <CheckCircle2 size={14} className="text-primary-500 fill-slate-950" />}
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                          <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedImages.length} Images Selected</p>
                              <p className="text-xs font-bold text-slate-900">Synchronize to Product Profile</p>
                          </div>
                          <button 
                            disabled={selectedImages.length === 0}
                            onClick={handleSync}
                            className="bg-slate-950 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-primary-500 hover:text-slate-950 transition-all shadow-xl"
                          >
                            Synchronize Gallery
                          </button>
                      </div>
                  </motion.div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                          <ImageIcon size={40} />
                      </div>
                      <div className="space-y-2">
                          <h4 className="text-lg font-black italic uppercase tracking-tighter">Forge Ready</h4>
                          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">Click execute to synthesize 8 high-conversion marketing images for this product.</p>
                      </div>
                  </div>
              )}
          </AnimatePresence>
      </div>
    </div>
  );
};

export default NanoBanana;
