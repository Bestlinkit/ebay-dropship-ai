import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const AuthCallback = () => {
  const [status, setStatus] = useState('syncing'); // 'syncing' | 'success' | 'error'
  const navigate = useNavigate();
  const location = useLocation();
  const initialized = React.useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (initialized.current) return;
      initialized.current = true;
      
      try {
        const query = new URLSearchParams(location.search);
        const code = query.get('code');
        
        if (!code) {
            if (location.pathname.includes('declined')) {
                setStatus('error');
                toast.error("Marketplace authorization declined.");
            }
            return;
        }

        // Exchange code for token via backend
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/ebay/exchange-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();

        if (data.access_token) {
            // Success! Save to Firestore via a temporary bridge update logic
            // In a real app, you'd send this to your backend
            // Here we'll update the user doc directly if possible
            const { db } = await import('../config/firebase');
            const { doc, updateDoc } = await import('firebase/firestore');
            const { auth } = await import('../config/firebase');
            
            if (auth.currentUser) {
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    ebayToken: data.access_token,
                    ebay_refresh_token: data.refresh_token,
                    ebay_token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
                    ebay_linked_at: new Date().toISOString(),
                    bridge_type: 'PERMANENT_18_MONTH'
                });
            }

            setStatus('success');
            toast.success("Identity Bridge established for 18 months!");
            setTimeout(() => navigate('/dashboard'), 2000);
        } else {
            throw new Error(data.error_description || "Token exchange failed.");
        }
      } catch (error) {
        console.error("Bridge Exchange Error:", error);
        setStatus('error');
        toast.error(`Vector sync failed: ${error.message}`);
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
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Linking Store</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol 5.4 Active</p>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Please wait while we establish secure connection with eBay...</p>
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
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Store Link Successful</p>
                    </div>
                    <p className="text-slate-400 text-sm font-medium italic">Connection confirmed. Redirecting to Dashboard...</p>
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
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Connection Rejection</p>
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
