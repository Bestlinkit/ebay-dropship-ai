import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const AuthCallback = () => {
  const [status, setStatus] = useState('syncing'); // 'syncing' | 'success' | 'error'
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // In a real app, you'd exchange the code/token here
        const query = new URLSearchParams(location.search);
        const code = query.get('code');
        
        // Simulating node synchronization
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        if (location.pathname.includes('declined')) {
            setStatus('error');
            toast.error("Marketplace authorization declined.");
        } else {
            setStatus('success');
            toast.success("eBay Nodes Synchronized successfully!");
            setTimeout(() => navigate('/dashboard'), 2000);
        }
      } catch (error) {
        setStatus('error');
        toast.error("Vector sync failed.");
      }
    };

    handleAuth();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-outfit overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-slate-900" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-md glass-card p-12 rounded-[3.5rem] border-white/5 text-center space-y-8 shadow-3xl"
      >
        <AnimatePresence mode="wait">
            {status === 'syncing' && (
                <motion.div 
                    key="sync"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                >
                    <div className="relative mx-auto w-24 h-24">
                        <Loader2 className="animate-spin text-slate-100" size={96} strokeWidth={1} />
                        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-500" size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Syncing Vectors</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol 5.4 Active</p>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Please wait while we establish secure handshake with eBay Production Nodes...</p>
                </motion.div>
            )}

            {status === 'success' && (
                <motion.div 
                    key="success"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-6"
                >
                    <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                        <CheckCircle2 size={48} className="text-white" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Channel Linked</h2>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Success Vector Detected</p>
                    </div>
                    <p className="text-slate-400 text-sm font-medium italic">Handshake confirmed. Redirecting to Command Center...</p>
                </motion.div>
            )}

            {status === 'error' && (
                <motion.div 
                    key="error"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-6"
                >
                    <div className="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-500/20">
                        <AlertCircle size={48} className="text-rose-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Sync Failure</h2>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Node Rejection</p>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">The authorization sequence was terminated. Returning to safe zone.</p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full h-14 bg-slate-900 border border-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                        Return to Login
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AuthCallback;
