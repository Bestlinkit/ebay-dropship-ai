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
    const exchangeCode = async () => {
      try {
        const query = new URLSearchParams(location.search);
        const code = query.get('code');
        
        if (!code) {
          setStatus('error');
          toast.error("No authorization code received from AliExpress.");
          return;
        }

        const proxyBase = import.meta.env.VITE_PROXY_URL || '';
        const endpoint = `${proxyBase}/oauth/token`;
        
        const payload = {
          grant_type: 'authorization_code',
          code: code,
          client_id: import.meta.env.VITE_ALI_APP_KEY || '532310',
          client_secret: import.meta.env.VITE_ALI_APP_SECRET || 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3',
          redirect_uri: 'https://geonoyc-dropshipping.web.app/callback'
        };

        console.log("[AliExpress OAuth] Exchange Request:", {
          endpoint,
          method: 'POST',
          payload: { ...payload, client_secret: '***' }
        });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('[AliExpress OAuth] Raw Response details:', {
          status: response.status,
          headers: Object.fromEntries(response.headers),
          bodyPreview: responseText.substring(0, 1000)
        });

        let data;
        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
          try {
            data = JSON.parse(responseText);
          } catch (pe) {
            throw new Error(`JSON Parse Error: ${pe.message}. Raw: ${responseText.substring(0, 100)}`);
          }
        } else {
          // If AliExpress returned HTML (e.g. 404 or 500 error page)
          throw new Error(`AliExpress returned non-JSON response (Status ${response.status}). Body starts with: ${responseText.substring(0, 100)}`);
        }

        if (data.access_token) {
          // Store in Session Storage for immediate use
          sessionStorage.setItem('ali_access_token', data.access_token);
          
          // Store in Firestore for persistence
          if (auth.currentUser) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
              aliexpress: {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_at: Date.now() + (data.expires_in * 1000),
                created_at: serverTimestamp(),
                linked_at: new Date().toISOString()
              }
            });
          }

          setStatus('success');
          toast.success("AliExpress Connection Verified!");
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          // Check for common OAuth error fields
          const errorMsg = data.error_description || data.msg || data.error || data.sub_msg || "Token exchange failed";
          const errorCode = data.error || data.code || "unknown_error";
          
          console.error(`[AliExpress OAuth] Detailed Error:`, { errorCode, errorMsg, data });
          throw new Error(`${errorMsg} (${errorCode})`);
        }
      } catch (error) {
        console.error("AliExpress Exchange Error:", error);
        setStatus('error');
        // Extract the most helpful part of the error message for the toast
        const displayError = error.message.length > 100 ? error.message.substring(0, 100) + "..." : error.message;
        toast.error(`Auth Failed: ${displayError}`);
      }
    };

    exchangeCode();
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
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Auth Failure</h2>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Protocol Interrupted</p>
              </div>
              <p className="text-slate-400 text-sm font-medium">We could not finalize the AliExpress link. Please try again.</p>
              <button 
                onClick={() => navigate('/settings')}
                className="w-full h-14 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Return to Settings
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AliExpressCallback;
