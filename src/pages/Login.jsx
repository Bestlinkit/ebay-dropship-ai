import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Mail, 
  Lock, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        await signup(email, password);
        toast.success("Welcome to the ecosystem.");
      } else {
        await login(email, password);
        toast.success("Terminal Access Granted.");
      }
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      toast.success("Handshake Successful. Welcome.");
      navigate('/');
    } catch (error) {
      console.error("Auth Error:", error);
      toast.error(`Authorization Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-outfit overflow-hidden relative selection:bg-primary-500/30">
      
      {/* Background Pulse Nodes */}
      <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -top-64 -left-64 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-64 -right-64 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px]" 
          />
          
          {/* Animated Matrix Grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Floating Value Badges (Desktop Only) */}
      <div className="hidden xl:block absolute inset-0 z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="absolute top-[20%] left-[10%] glass-card p-6 rounded-3xl border-white/5 space-y-3"
          >
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                  <TrendingUp size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Market Efficiency</p>
              <h4 className="text-2xl font-black text-white">+12.4x</h4>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-[20%] right-[10%] glass-card p-6 rounded-3xl border-white/5 space-y-3"
          >
              <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500">
                  <Zap size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Neural Response</p>
              <h4 className="text-2xl font-black text-white">24ms</h4>
          </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 w-full max-w-[1240px] grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-24 items-center"
      >
        {/* Left Side: Brand Narrative */}
        <div className="space-y-12 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                <div className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Zap className="text-primary-400 fill-primary-400" size={28} />
                </div>
                <span className="text-3xl font-black text-white tracking-tight uppercase italic">Geonoyc.</span>
            </div>

            <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl xl:text-8xl font-black text-white tracking-tighter leading-[0.9] text-balance">
                    Sync Your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">Profit Vector.</span>
                </h1>
                <p className="text-slate-400 text-lg md:text-xl font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
                    The autonomous terminal for high-velocity eBay dropshipping. Orchestrate products, media, and marketing with neural precision.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md mx-auto lg:mx-0">
                <div className="flex items-start gap-4 p-4 border border-white/5 bg-white/2 rounded-2xl">
                    <ShieldCheck className="text-primary-500 shrink-0" size={20} />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Protocol</p>
                        <p className="text-xs text-slate-500 font-medium">Secure API handshakes</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 p-4 border border-white/5 bg-white/2 rounded-2xl">
                    <Globe className="text-indigo-400 shrink-0" size={20} />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Scale</p>
                        <p className="text-xs text-slate-500 font-medium">Multi-market coverage</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Handshake Hub */}
        <div className="relative">
            {/* Decorative background glow for the form */}
            <div className="absolute inset-0 bg-primary-500/20 blur-[100px] rounded-full scale-75" />
            
            <motion.div 
                layout
                className="relative z-10 glass-card p-10 md:p-14 rounded-[3.5rem] border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]"
            >
                <div className="mb-10 space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
                        {isRegistering ? "Initialize Node" : "Access Terminal"}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                        {isRegistering ? "Register your enterprise credentials." : "Enter vectors to enter the hub."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Vector Identifier</label>
                        <div className="relative">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-16 bg-slate-900 border border-white/5 rounded-3xl pl-16 pr-6 text-white text-sm font-bold focus:ring-4 focus:ring-primary-500/20 transition-all placeholder:text-slate-700"
                                placeholder="name@geonoyc.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pass-Key</label>
                            {!isRegistering && (
                                <button type="button" className="text-[9px] font-black text-primary-400 uppercase tracking-[0.2em] hover:text-white transition-colors">Key Reset</button>
                            )}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-16 bg-slate-900 border border-white/5 rounded-3xl pl-16 pr-6 text-white text-sm font-bold focus:ring-4 focus:ring-primary-500/20 transition-all placeholder:text-slate-700"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-16 bg-white text-slate-900 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-primary-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin" />
                        ) : (
                            <>
                                {isRegistering ? "Deploy Account" : "Access Console"}
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="my-10 flex items-center gap-6">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Auth-Bridge</span>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-16 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest text-white disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-6 h-6 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 bg-white rounded-lg p-1" />
                            Sign-in with Google
                        </>
                    )}
                </button>

                <p className="mt-10 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {isRegistering ? "Existing Node?" : "New Deployment?"}{" "}
                    <button 
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-primary-400 hover:text-white transition-colors"
                    >
                        {isRegistering ? "Access Console" : "Initialize Account"}
                    </button>
                </p>
            </motion.div>
        </div>
      </motion.div>

      {/* Footer System Info */}
      <div className="mt-20 lg:mt-32 relative z-20 flex flex-col md:flex-row items-center gap-12 text-[10px] font-black text-slate-600 tracking-[0.4em] uppercase">
          <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Primary Node Live
          </div>
          <div className="flex items-center gap-3">
              <ShieldCheck size={14} />
              End-to-End Encrypted
          </div>
          <div className="flex items-center gap-3">
              <Globe size={14} />
              Central Standard v5.4
          </div>
      </div>
    </div>
  );
};

export default LoginPage;
