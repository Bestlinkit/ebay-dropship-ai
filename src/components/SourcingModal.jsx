import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Search, 
  PackageCheck, 
  Truck, 
  Star,
  Loader2,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Zap,
  Shield
} from 'lucide-react';
import eproloService from '../services/eprolo';
import aliExpressService from '../services/aliexpress';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

/**
 * Enhanced Sourcing Modal (Crystal Pulse)
 * Premium SaaS aesthetic with balanced typography.
 */
const SourcingModal = ({ ebayProduct, isOpen, onClose, onMatchSelect }) => {
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('eprolo'); 
  const [matches, setMatches] = useState([]);
  const [state, setState] = useState('IDLE'); 

  useEffect(() => {
    if (isOpen && ebayProduct) {
      performSourcing();
    }
  }, [isOpen, ebayProduct]);

  const performSourcing = async () => {
    setLoading(true);
    setMatches([]);
    
    // 1. STAGE: Eprolo Probe (Primary Source)
    try {
      setState('SEARCHING_EPROLO');
      console.log("[Sourcing Waterfall] Dispatching primary Eprolo probe...");
      const eproloResults = await eproloService.findMatches(ebayProduct);
      
      if (eproloResults && eproloResults.length > 0) {
        setMatches(eproloResults);
        setSource('eprolo');
        setState('RESULTS');
        setLoading(false);
        return;
      }
      throw new Error("Eprolo returned empty results.");
    } catch (e) {
      console.warn("[Sourcing Waterfall] Eprolo signal lost or empty. Attempting alternative sources...");
    }

    // 2. STAGE: AliExpress Fallback (Secondary Source)
    try {
      setState('SWITCHING_TO_FALLBACK'); 
      console.info("[Sourcing Waterfall] Initiating AliExpress recovery sequence...");
      
      // UX Delay for "Searching alternative sources..." message parity
      await new Promise(resolve => setTimeout(resolve, 2000));

      const aliResults = await aliExpressService.searchProducts(ebayProduct.title);
      
      if (aliResults && aliResults.length > 0) {
        setMatches(aliResults);
        setSource('aliexpress');
        setState('RESULTS');
      } else {
        setState('FINAL_NO_RESULTS');
      }
    } catch (err) {
      console.error("[Sourcing Waterfall] Final fallback failover reached.");
      setState('FINAL_NO_RESULTS');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !ebayProduct) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500 border border-slate-200">
        
        {/* Crystal Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <div className="bg-slate-900 text-white p-2 rounded-lg">
                      <PackageCheck size={18} />
                   </div>
                   <h2 className="text-xl font-bold text-slate-900">Sourcing Hub</h2>
                </div>
                <p className="text-xs text-slate-400 font-medium line-clamp-1 max-w-md">
                    Target: <span className="text-slate-900">{ebayProduct.title}</span>
                </p>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                    {['eprolo', 'aliexpress'].map(s => (
                        <button 
                            key={s}
                            onClick={() => setSource(s)}
                            className={cn(
                                "px-6 py-2 rounded-lg text-xs font-bold transition-all",
                                source === s ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-500'
                            )}
                        >
                            {s === 'eprolo' ? 'Eprolo' : 'AliExpress'}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Dynamic Sourcing Grid */}
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                {state === 'SEARCHING_EPROLO' ? 'Scanning Eprolo catalog...' : 'Searching alternative sources...'}
              </p>
            </div>
          ) : (state === 'FINAL_NO_RESULTS' || matches.length === 0) ? (
            <div className="text-center py-40 space-y-4">
              <AlertCircle className="mx-auto text-slate-200" size={48} />
              <h3 className="text-lg font-bold text-slate-900">No Matches Identified</h3>
              <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">Smart filters couldn't find a direct product match for this SKU across Eprolo or AliExpress.</p>
              <button 
                onClick={performSourcing}
                className="mt-4 px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all"
              >
                Retry Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {matches.map((match, i) => {
                const profitCalc = source === 'aliexpress' 
                  ? aliExpressService.calculateProfit(ebayProduct.price, match.price, match.shipping)
                  : {
                      profit: (ebayProduct.price - (match.wholesalePrice || 0) - (match.shippingCost || 0) - (ebayProduct.price * 0.12)).toFixed(2),
                      margin: (((ebayProduct.price - (match.wholesalePrice || 0) - (match.shippingCost || 0) - (ebayProduct.price * 0.12)) / ebayProduct.price) * 100).toFixed(0),
                    };

                return (
                  <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col">
                    <div className="flex gap-6 mb-8">
                      <div className="relative shrink-0">
                        <img src={match.imageUrl} className="w-24 h-24 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[8px] font-bold px-2 py-1 rounded-lg">
                           {source.toUpperCase()}
                        </div>
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex justify-between items-start">
                           <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", profitCalc.margin > 30 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500")}>
                              {profitCalc.margin}% ROI Potential
                           </span>
                           {source === 'eprolo' && <span className="text-[10px] font-bold text-primary">{match.matchScore}% Match</span>}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight">
                           {match.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-slate-400">
                           <Star size={12} className="text-amber-400 fill-amber-400" />
                           <span className="text-[10px] font-bold">{match.rating} Trust Factor</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
                      <div className="flex flex-col">
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Source Price</span>
                         <span className="text-lg font-bold text-slate-900">${(match.price || match.wholesalePrice || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Profits</span>
                         <span className="text-lg font-bold text-emerald-600">${profitCalc.profit}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex gap-3">
                      <button 
                        onClick={() => onMatchSelect(match)}
                        className="flex-1 bg-slate-900 text-white h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                         <Check size={18} /> Select Product
                      </button>
                      <a 
                        href={match.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Crystal Footer */}
        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500" />
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sourcing Integrity: High</p>
            </div>
            <div className="flex items-center gap-3">
                 <Shield size={14} className="text-slate-300" />
                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Encrypted Vector Protocol</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SourcingModal;
