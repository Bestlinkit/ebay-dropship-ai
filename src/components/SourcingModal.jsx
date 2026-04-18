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
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Terminal,
  ShieldCheck,
  Warehouse
} from 'lucide-react';
import sourcingService from '../services/sourcing';
import { cn } from '../lib/utils';

/**
 * CJ Unified Sourcing Modal (v5.0)
 * Uses the CJ Dropshipping Scoring Engine for real-time candidate ranking.
 */
const SourcingModal = ({ ebayProduct, isOpen, onClose, onMatchSelect }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [uiState, setUiState] = useState('IDLE');
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (isOpen && ebayProduct) {
      performSourcing();
    }
  }, [isOpen, ebayProduct]);

  const performSourcing = async () => {
    setLoading(true);
    setMatches([]);
    setUiState('CJ_SEARCHING');
    
    try {
      const context = sourcingService.createContext(ebayProduct.title, ebayProduct);
      const result = await sourcingService.runIterativePipeline(context);
      
      setDebugInfo(result.telemetry);
      
      if (result.status === 'SUCCESS' && result.products?.length > 0) {
        setMatches(result.products);
        setUiState('CJ_SUCCESS');
      } else {
        setUiState('CJ_EMPTY');
      }
    } catch (e) {
      setUiState('CJ_ERROR');
      setDebugInfo({ error: e.message, timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    onClose();
    navigate('/supplier-sourcing', { state: { ebayProduct, query: ebayProduct.title } });
  };

  if (!isOpen || !ebayProduct) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[#0B1120] w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500 border border-white/10">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <div className="bg-emerald-500 text-white p-2 rounded-lg">
                      <Warehouse size={18} />
                   </div>
                    <h2 className="text-xl font-bold text-white italic tracking-tight uppercase">CJ Sourcing Link</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-md">
                    Target: <span className="text-slate-300 font-bold">{ebayProduct.title}</span>
                </p>
            </div>

            <div className="flex items-center gap-6">
                <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-slate-900/50 custom-scrollbar">
          {uiState === 'CJ_SEARCHING' ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="animate-spin text-emerald-500" size={40} />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">
                Inquiring CJ Dropshipping Clusters...
              </p>
            </div>
          ) : uiState === 'CJ_EMPTY' ? (
            <div className="text-center py-32 space-y-10">
              <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-500 shadow-sm">
                 <Search size={40} />
              </div>
              <div className="space-y-3">
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">No high-rank matches found</h3>
                 <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                   CJ search depth exceeded with zero signal matches.
                 </p>
              </div>
              <button 
                onClick={handleManualSearch}
                className="px-10 py-5 bg-white text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-400 transition-all shadow-xl flex items-center gap-3 mx-auto"
              >
                🚀 Open Sourcing Intelligence Hub
              </button>
            </div>
          ) : uiState === 'CJ_ERROR' ? (
            <div className="text-center py-32 space-y-10">
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto text-red-500 shadow-sm">
                 <AlertCircle size={40} />
              </div>
              <div className="space-y-3">
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter text-red-500">API Connection Failed</h3>
                 <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                   CJ Dropshipping protocol bridge lost. Check backend logs.
                 </p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={performSourcing}
                  className="px-10 py-5 bg-white text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-400 transition-all shadow-xl"
                >
                  Retry CJ Linkage
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {matches.map((match, i) => {
                 const scores = match.scores || {};
                 return (
                  <div key={match.id || i} className="bg-slate-900 rounded-3xl p-6 border border-white/5 hover:border-emerald-500/30 transition-all group flex flex-col">
                    <div className="flex gap-6 mb-8">
                      <div className="relative shrink-0">
                        <img src={match.image} className="w-24 h-24 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[8px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest">
                           {scores.final}% RANK
                        </div>
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex justify-between items-start">
                           <span className={cn("text-[8px] font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest")}>
                               CJ Dropshipping
                           </span>
                        </div>
                       <h4 className="font-bold text-sm text-white line-clamp-2 leading-tight uppercase tracking-tight italic">
                           {match.title}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-2xl mb-6">
                      <div className="flex flex-col">
                         <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">CJ Base</span>
                         <span className="text-lg font-black text-white italic">
                             ${parseFloat(match.price).toFixed(2)}
                         </span>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Stock</span>
                         <span className="text-lg font-black text-emerald-400 italic">{scores.stability}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex gap-3">
                      <button 
                        onClick={() => onMatchSelect(match)}
                        className="flex-1 bg-white text-slate-950 h-12 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                         <Check size={18} /> Select Candidate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Technical Debug Area */}
        <div className="px-10 py-6 bg-slate-900 border-t border-white/5">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <div className={cn("w-2 h-2 rounded-full", loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{loading ? "CJ Probe Engaged" : "Bridge Stabilized"}</p>
                   </div>
                   {debugInfo && (
                       <button 
                          onClick={() => setShowDebug(!showDebug)}
                          className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                       >
                          <Terminal size={12} />
                          Telemetry {showDebug ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                       </button>
                   )}
                </div>
                <div className="flex items-center gap-3 opacity-30">
                     <ShieldCheck size={14} className="text-emerald-500" />
                     <p className="text-[9px] font-black text-white uppercase tracking-widest italic">Scoring Engine v5.0-ALPHA</p>
                </div>
            </div>

            {showDebug && debugInfo && (
                <div className="mt-6 p-6 bg-slate-950 rounded-2xl overflow-hidden border border-white/5 animate-in slide-in-from-bottom-2 duration-300">
                    <pre className="text-[10px] font-mono text-emerald-500 whitespace-pre-wrap break-all custom-scrollbar max-h-40 overflow-y-auto">
                        {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SourcingModal;
