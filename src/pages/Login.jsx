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
      toast.success("Login Successful. Welcome.");
      navigate('/');
    } catch (error) {
      console.error("Auth Error:", error);
      toast.error(`Authorization Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-outfit overflow-hidden relative selection:bg-primary-500/30">
      
      {/* Background Layer: Abstract Tech Reality */}
      <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000" 
            alt="Infrastructure" 
            className="w-full h-full object-cover opacity-10 grayscale brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 w-full max-w-md"
      >
        {/* Access Portal: Glassmorphic Core */}
        <div className="relative">
            {/* Soft Ambient Glow */}
            <div className="absolute inset-0 bg-primary-500/10 blur-[120px] rounded-full scale-110" />
            
            <div className="relative z-10 bg-white/5 backdrop-blur-3xl p-10 md:p-12 rounded-[4rem] border border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)]">
                
                <div className="mb-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto border border-primary-500/20 mb-6">
                        <Zap className="text-primary-400 fill-primary-400" size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase italic leading-none">
                            {isRegistering ? "Initialize Node" : "Access Terminal"}
                        </h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
                            {isRegistering ? "Register Enterprise Credentials" : "Enter Credentials To Sync Hub"}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Account Identifier</label>
                        <div className="relative group">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-400 transition-all" size={18} />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-16 bg-slate-900/60 border border-white/5 rounded-3xl pl-16 pr-6 text-white text-sm font-bold focus:border-primary-500/50 focus:shadow-[0_0_20px_rgba(30,190,230,0.1)] transition-all placeholder:text-slate-700 outline-none"
                                placeholder="name@geonoyc.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Secret Pass-Key</label>
                            {!isRegistering && (
                                <button type="button" className="text-[9px] font-black text-primary-400 uppercase tracking-[0.3em] hover:text-white transition-colors">Recover Hub</button>
                            )}
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-400 transition-all" size={18} />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-16 bg-slate-900/60 border border-white/5 rounded-3xl pl-16 pr-6 text-white text-sm font-bold focus:border-primary-500/50 focus:shadow-[0_0_20px_rgba(30,190,230,0.1)] transition-all placeholder:text-slate-700 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-18 bg-primary-500 text-white rounded-[2.2rem] font-black text-[12px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary-500/20 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>
                                {isRegistering ? "Deploy Account" : "Access Terminal"}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="my-12 flex items-center gap-6">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Neural OAuth Bridge</span>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full h-16 bg-white text-slate-950 rounded-[1.8rem] flex items-center justify-center gap-4 hover:bg-slate-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                                Proceed with Google
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {isRegistering ? "Existing Node?" : "New Deployment?"}{" "}
                        <button 
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-primary-400 hover:text-white transition-colors"
                        >
                            {isRegistering ? "Access Console" : "Initialize Account"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
      </motion.div>

      {/* Footer Connectivity Info */}
      <div className="mt-16 relative z-20 flex flex-col md:flex-row items-center gap-12 text-[9px] font-black text-slate-700 tracking-[0.5em] uppercase opacity-40">
          <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Main Service Live
          </div>
          <div className="flex items-center gap-3">
              <ShieldCheck size={14} />
              Production Level Encryption
          </div>
      </div>
    </div>
  );
};

export default LoginPage;
