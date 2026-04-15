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
  ShieldCheck
} from 'lucide-react';
import eproloService from '../services/eprolo';
import { interpretSupplierResponse } from '../utils/sourcingInterpreter';
import { SourcingUIState } from '../constants/sourcing';
import { cn } from '../lib/utils';

/**
 * Truth-Based Sourcing Modal (v4.0)
 * Uses a deterministic state machine for platform discovery.
 * Strictly manual AliExpress exploration.
 */
const SourcingModal = ({ ebayProduct, isOpen, onClose, onMatchSelect }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [uiState, setUiState] = useState(SourcingUIState.IDLE);
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
    setUiState(SourcingUIState.EPROLO_SEARCHING);
    setDebugInfo(null);
    
    try {
      const result = await eproloService.findMatches(ebayProduct);
      const nextState = interpretSupplierResponse(result, 'eprolo');
      
      setDebugInfo(result.debugInfo);
      setUiState(nextState);
      
      if (nextState === SourcingUIState.EPROLO_SUCCESS) {
        setMatches(result.data);
      }
    } catch (e) {
      setUiState(SourcingUIState.EPROLO_ERROR);
      setDebugInfo({ error: e.message, timestamp: new Date().toISOString() });
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
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500 border border-slate-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <div className="bg-slate-900 text-white p-2 rounded-lg">
                      <PackageCheck size={18} />
                   </div>
                   <h2 className="text-xl font-bold text-slate-900 italic tracking-tight">Eprolo Discovery</h2>
                </div>
                <p className="text-xs text-slate-400 font-medium line-clamp-1 max-w-md">
                    Target: <span className="text-slate-900">{ebayProduct.title}</span>
                </p>
            </div>

            <div className="flex items-center gap-6">
                <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar">
          {uiState === SourcingUIState.EPROLO_SEARCHING ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="animate-spin text-slate-900" size={40} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                Inquiring Eprolo API...
              </p>
            </div>
          ) : uiState === SourcingUIState.EPROLO_EMPTY ? (
            <div className="text-center py-32 space-y-10">
              <div className="w-20 h-20 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200 shadow-sm">
                 <Search size={40} />
              </div>
              <div className="space-y-3">
                 <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">No results found on Eprolo</h3>
                 <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                   Eprolo catalog contains no direct match.
                 </p>
              </div>
              <button 
                onClick={handleManualAliSearch}
                className="px-10 py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 transition-all shadow-xl flex items-center gap-3 mx-auto"
              >
                🚀 Search AliExpress Manually
              </button>
            </div>
          ) : uiState === SourcingUIState.EPROLO_ERROR ? (
            <div className="text-center py-32 space-y-10">
              <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-[2.5rem] flex items-center justify-center mx-auto text-red-500 shadow-sm">
                 <AlertCircle size={40} />
              </div>
              <div className="space-y-3">
                 <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter text-red-600">Eprolo API Error</h3>
                 <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                   Technical connection failure. Check credentials or endpoint status.
                 </p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={performSourcing}
                  className="px-10 py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl"
                >
                  Retry Inquiry
                </button>
                <button 
                   onClick={handleManualAliSearch}
                   className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 transition-colors"
                >
                  Search AliExpress Instead
                </button>
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
                  <div key={match.id || i} className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col">
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
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight">
                           {match.title}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
                      <div className="flex flex-col">
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Source Price</span>
                         <span className="text-lg font-bold text-slate-900">
                             {typeof match.price === 'number' ? `$${match.price.toFixed(2)}` : 'N/A'}
                         </span>
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
                      <a href={match.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Technical Debug Area */}
        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <div className={cn("w-2 h-2 rounded-full", loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{loading ? "Searching..." : "Ready"}</p>
                   </div>
                   {debugInfo && (
                       <button 
                          onClick={() => setShowDebug(!showDebug)}
                          className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                       >
                          <Terminal size={12} />
                          Technical Details {showDebug ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                       </button>
                   )}
                </div>
                <div className="flex items-center gap-3 opacity-30">
                     <ShieldCheck size={14} className="text-slate-900" />
                     <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest italic">Truth-Based Engine v4.0</p>
                </div>
            </div>

            {showDebug && debugInfo && (
                <div className="mt-6 p-6 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 animate-in slide-in-from-top-2 duration-300">
                    <pre className="text-[10px] font-mono text-emerald-400 whitespace-pre-wrap break-all custom-scrollbar max-h-40 overflow-y-auto">
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
