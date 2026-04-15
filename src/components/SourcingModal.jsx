import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';
import { cn } from '../lib/utils';

/**
 * Deterministic Sourcing Hub (v3.0)
 * Enforces verified-only automatic probes with manual exploration overrides.
 */
const SourcingModal = ({ ebayProduct, isOpen, onClose, onMatchSelect }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('eprolo'); 
  const [matches, setMatches] = useState([]);
  const [state, setState] = useState('IDLE'); // IDLE, EPROLO_SEARCHING, EPROLO_RESULTS, EPROLO_EMPTY

  useEffect(() => {
    if (isOpen && ebayProduct) {
      performSourcing();
    }
  }, [isOpen, ebayProduct]);

  const performSourcing = async () => {
    setLoading(true);
    setMatches([]);
    setState('EPROLO_SEARCHING');
    
    console.log("SOURCE: EPROLO");
    console.log(`[Sourcing Hub] Dispatching primary Eprolo probe for "${ebayProduct.title}"...`);

    try {
      const eproloResults = await eproloService.findMatches(ebayProduct);
      console.log("EPROLO RESPONSE:", eproloResults);
      
      if (eproloResults && eproloResults.length > 0) {
        setMatches(eproloResults);
        setSource('eprolo');
        setState('EPROLO_RESULTS');
      } else {
        setState('EPROLO_EMPTY');
      }
    } catch (e) {
      console.error("EPROLO CRITICAL FAILURE:", e.message);
      toast.error(e.message || "Eprolo Node Unreachable");
      setState('EPROLO_EMPTY');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAliSearch = () => {
    onClose();
    navigate('/ali-sourcing', { state: { product: ebayProduct, query: ebayProduct.title } });
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
                   <h2 className="text-xl font-bold text-slate-900 italic tracking-tight">Eprolo Verified Network</h2>
                </div>
                <p className="text-xs text-slate-400 font-medium line-clamp-1 max-w-md">
                    Target Node: <span className="text-slate-900">{ebayProduct.title}</span>
                </p>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                   <Shield size={12} className="text-emerald-500" />
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Official Supplier Node</span>
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
              <Loader2 className="animate-spin text-slate-900" size={40} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                Probing Verified Network...
              </p>
            </div>
          ) : (state === 'EPROLO_EMPTY' || matches.length === 0) ? (
            <div className="text-center py-32 space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="w-20 h-20 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200 shadow-sm">
                 <Search size={40} />
              </div>
              <div className="space-y-3">
                 <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">No Verified Matches Identified</h3>
                 <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                   Smart filters couldn't identify a deterministic product match within Eprolo's verified supplier network.
                 </p>
              </div>
              
              <div className="flex flex-col items-center gap-5">
                <button 
                  onClick={handleManualAliSearch}
                  className="px-10 py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-3"
                >
                  🚀 Search AliExpress Manually
                </button>
                <div className="flex items-center gap-4">
                    <button 
                      onClick={performSourcing}
                      className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                      Retry Probe
                    </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {matches.map((match, i) => {
                const profitCalc = {
                    profit: (ebayProduct.price - (match.price || 0) - (ebayProduct.price * 0.12) - 0.30).toFixed(2),
                    margin: (((ebayProduct.price - (match.price || 0) - (ebayProduct.price * 0.12) - 0.30) / ebayProduct.price) * 100).toFixed(0),
                };

                return (
                  <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col">
                    <div className="flex gap-6 mb-8">
                      <div className="relative shrink-0">
                        <img src={match.image} className="w-24 h-24 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[8px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest">
                           {match.source}
                        </div>
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex justify-between items-start">
                           <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", profitCalc.margin > 30 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500")}>
                              {profitCalc.margin}% ROI Potential
                           </span>
                           <div className="flex items-center gap-1.5 text-slate-400">
                             <Truck size={12} className="text-slate-400" />
                             <span className="text-[9px] font-bold uppercase">{match.shipsFrom}</span>
                           </div>
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
                         <span className="text-lg font-bold text-slate-900">${(match.price).toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Est. Profits</span>
                         <span className="text-lg font-bold text-emerald-600">${profitCalc.profit}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex gap-3">
                      <button 
                        onClick={() => onMatchSelect(match)}
                        className="flex-1 bg-slate-900 text-white h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
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
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Status: Secured</p>
            </div>
            <div className="flex items-center gap-3">
                 <Shield size={14} className="text-slate-300" />
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Deterministic Sourcing Protocol v3.0</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SourcingModal;
