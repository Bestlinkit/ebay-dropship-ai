import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { db, auth } from '../config/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AliExpressCallback = () => {
  const [status, setStatus] = useState('exchanging'); // 'exchanging' | 'success' | 'error'
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const query = new URLSearchParams(location.search);
        const code = query.get('code');
        
        if (!code) {
          setStatus('error');
          toast.error("No authorization code received from AliExpress.");
          return;
        }

        console.log("[AliExpress Callback] Capturing Auth Code as Direct Session Token:", code);

        // 💾 Save to Firestore (Treating the code as the session token)
        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            aliexpress: {
              access_token: code, // Code is the session token in this model
              session: code,      // Explicitly store as session
              expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000), // Default 30 days
              created_at: serverTimestamp(),
              linked_at: new Date().toISOString(),
              model: 'DIRECT_SESSION'
            }
          });
        }

        // 🛡️ Store in session storage for immediate UI feedback
        sessionStorage.setItem('ali_access_token', code);

        setStatus('success');
        toast.success("AliExpress Connection Secured!");
        
        // Auto-close if in popup, else navigate
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ type: 'ALIEXPRESS_AUTH_SUCCESS' }, window.location.origin);
            window.close();
          } else {
            navigate('/settings');
          }
        }, 2000);

      } catch (error) {
        console.error("AliExpress Callback Error:", error);
        setStatus('error');
        toast.error(`Connection Failed: ${error.message}`);
      }
    };

    if (auth.currentUser) {
      handleCallback();
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-outfit relative overflow-hidden">
      {/* Background Aesthetics */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-md glass-card p-12 rounded-[3.5rem] border-white/5 text-center space-y-8"
      >
        <AnimatePresence mode="wait">
          {status === 'exchanging' && (
            <motion.div 
              key="sync"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="relative mx-auto w-24 h-24">
                <Loader2 className="animate-spin text-orange-500" size={96} strokeWidth={1} />
                <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Verifying Link</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">AliExpress DS Bridge</p>
              </div>
              <p className="text-slate-400 text-sm font-medium">Authenticating your marketplace credentials...</p>
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
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Access Granted</h2>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Dropship API Active</p>
              </div>
              <p className="text-slate-400 text-sm font-medium italic">Your store is now synced with AliExpress. Redirecting...</p>
            </motion.div>
          )}

          {status === 'error' && (
              <div className="space-y-4">
                <div className="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-500/20">
                  <AlertCircle size={48} className="text-rose-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Auth Failure</h2>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Protocol Interrupted</p>
                </div>
                
                {/* 🛡️ HYPER-VERBOSE DEBUG LOGS for USER */}
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 text-left overflow-hidden">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Diagnostic Data</p>
                  <pre className="text-[10px] text-rose-400 font-mono break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {sessionStorage.getItem('ali_last_error_debug') || 'Attempting to fetch logs...'}
                  </pre>
                </div>

                <p className="text-slate-400 text-sm font-medium">We could not finalize the AliExpress link. Please share the diagnostic data above with support.</p>
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-full h-14 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Return to Settings
                </button>
              </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AliExpressCallback;
