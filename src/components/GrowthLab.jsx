import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Zap, 
  ArrowUpRight, 
  Share2, 
  CheckCircle2, 
  RefreshCw,
  Search,
  Camera,
  Share,
  Music, // For TikTok
  Video,
  Copy,
  Mail,
  Users,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import aiService from '../services/ai';

/**
 * Growth Lab: External Marketplace & Social Media Promotion
 * Generates viral ad packs for TikTok, Instagram, and Facebook.
 */
const GrowthLab = () => {
  const [platform, setPlatform] = useState('tiktok');
  const [loading, setLoading] = useState(false);
  const [adPack, setAdPack] = useState(null);
  const [targetProduct, setTargetProduct] = useState("Face Serum - Luxury Glow");

  const generateAdPack = async () => {
    setLoading(true);
    try {
        // Simulated AI call for social media copy
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pack = {
            tiktok: {
                hook: "POV: You finally found the secret to a 5-minute glow up. ✨",
                caption: "Stop scrolling! 🛑 This eBay find is changing the game for your skin. #skincaretips #ebayseller #glowup",
                music: "Speed Up Viral Audio (Trending)",
                tags: "#amazonfinds #ebaydropshipping #viralproduct"
            },
            instagram: {
                hook: "Editorial Glow, Everyday Price.",
                caption: "Elevate your morning routine with our premium face serum. Get the luxury experience without the markup. Link in bio! 🌿 #luxurybeauty #skincareroutine",
                hashtags: "#selfcare #beautyhacks #skincarejunkie #ebayhome"
            },
            facebook: {
                hook: "Why 500+ women switched to this serum this month.",
                caption: "Forget expensive department stores. This serum delivers professional results at a fraction of the cost. Free shipping and 30-day returns. Order yours on eBay today!",
                hashtags: "#smartshopping #beautydeals #savings"
            }
        };
        setAdPack(pack[platform]);
        toast.success(`${platform.toUpperCase()} Ad Pack Generated!`);
    } catch (error) {
        toast.error("AI Generation failed.");
    } finally {
        setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Share2 className="text-primary" size={28} />
            Social Media Growth Lab
          </h2>
          <p className="text-slate-500 mt-1">Drive external traffic from viral content platforms.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
            {[
                { id: 'tiktok', icon: Music, label: 'TikTok' },
                { id: 'instagram', icon: Camera, label: 'Instagram' },
                { id: 'facebook', icon: Share, label: 'Facebook' },
            ].map(p => (
                <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        platform === p.id ? 'bg-white shadow-md text-primary' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <p.icon size={14} />
                    {p.label}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ad Generation Card */}
        <div className="glass-card p-8 rounded-[2.5rem] bg-white border-slate-100 shadow-xl flex flex-col justify-between">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Product to Promote</label>
                    <select className="input-field w-full h-12 bg-slate-50 border-none font-bold">
                        <option>{targetProduct}</option>
                        <option>Wireless Magnetic Power Bank</option>
                        <option>Portable Neck Fan</option>
                    </select>
                </div>
                
                <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Video size={14} /> AI Creative Logic
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                        "For {platform.toUpperCase()}, we are focusing on **Engagement Hooks**. The script is optimized to catch the eye in the first 3 seconds of scrolling."
                    </p>
                </div>
            </div>

            <button 
                onClick={generateAdPack}
                disabled={loading}
                className="mt-8 btn-primary w-full py-4 flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
            >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
                Generate Viral {platform.toUpperCase()} Pack
            </button>
        </div>

        {/* Output Panel */}
        <div className="glass-card p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
            
            {!adPack && !loading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20 text-center">
                    <Zap size={64} className="mb-6" />
                    <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Ready to generate <br/>your viral content pack.</p>
                </div>
            ) : loading ? (
                 <div className="flex flex-col items-center justify-center h-full text-center">
                    <RefreshCw size={48} className="animate-spin text-primary mb-6" />
                    <p className="text-xs font-black uppercase tracking-widest animate-pulse">AI is crafting your {platform} viral script...</p>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-500 relative z-10">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">The Hook (Opening Line)</span>
                            <button onClick={() => copyToClipboard(adPack.hook)} className="p-1 hover:text-primary"><Copy size={16} /></button>
                        </div>
                        <p className="text-sm font-bold bg-white/5 p-4 rounded-xl border border-white/5">{adPack.hook}</p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Caption Content</span>
                            <button onClick={() => copyToClipboard(adPack.caption)} className="p-1 hover:text-emerald-400"><Copy size={16} /></button>
                        </div>
                        <p className="text-xs font-medium text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{adPack.caption}</p>
                    </div>

                    <div>
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-2">Trending Tags</span>
                        <p className="text-xs font-black text-primary tracking-widest">{adPack.hashtags || adPack.tags}</p>
                    </div>
                </div>
            )}

            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                    <Users size={14} className="text-secondary" />
                    <span className="text-[10px] font-bold text-white/40 uppercase">Influencer Ready</span>
                </div>
                <button className="text-[10px] font-black text-white hover:text-secondary flex items-center gap-2 group uppercase tracking-widest">
                    Get Influencer Brief <ChevronRight size={14} className="group-hover:translate-x-1" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthLab;
