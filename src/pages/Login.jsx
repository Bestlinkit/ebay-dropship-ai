import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  Target, 
  Layout, 
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authState, setAuthState] = useState('login'); // 'login', 'signup', 'forgot'
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle, forgotPassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authState === 'signup') {
        await signup(email, password);
        toast.success("Account initialized successfully.");
      } else if (authState === 'login') {
        await login(email, password);
        toast.success("Access granted. Syncing hub...");
      } else {
        await forgotPassword(email);
        toast.success("Reset protocol transmitted to your inbox.");
        setAuthState('login');
      }
      if (authState !== 'forgot') navigate('/');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success("OAuth connection established.");
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-inter selection:bg-primary-500/10">
      
      {/* Left Side: Performance Landing (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-slate-50 flex-col overflow-hidden p-20">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-100/50 rounded-full blur-[150px] -mr-96 -mt-96 animate-pulse" />
         
         <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
               <div className="flex items-center gap-3 mb-12">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                     <Zap size={20} className="text-primary-400 fill-primary-400" />
                  </div>
                  <span className="font-black text-2xl tracking-tighter uppercase italic text-slate-900">DropAI.</span>
               </div>

               <div className="space-y-6 max-w-2xl">
                  <h1 className="text-6xl xl:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase italic">
                     AI-Powered <br />
                     <span className="text-primary-500">Optimization</span> <br />
                     for eBay.
                  </h1>
                  <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-lg">
                     Automatically optimize titles, pricing, images, and categories using real marketplace intelligence. 
                  </p>
               </div>

               <div className="mt-12 space-y-4">
                  {[
                    { icon: Zap, text: "Smart Product Optimization" },
                    { icon: TrendingUp, text: "Real-Time Pricing Intelligence" },
                    { icon: Layout, text: "AI Image Enhancement" },
                    { icon: Target, text: "Bulk Listing Automation" }
                  ].map((f, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      key={i} 
                      className="flex items-center gap-3"
                    >
                       <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                          <CheckCircle2 size={12} />
                       </div>
                       <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{f.text}</span>
                    </motion.div>
                  ))}
               </div>
            </div>

            <motion.div 
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ duration: 1, delay: 0.2 }}
               className="relative mt-20"
            >
                <div className="absolute inset-0 bg-primary-500/20 blur-[100px] rounded-full scale-110" />
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bbbda536639a?auto=format&fit=crop&q=80&w=2000" 
                  alt="Dashboard Preview" 
                  className="relative rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-white"
                />
            </motion.div>
         </div>
      </div>

      {/* Right Side: High-Conversion Auth (40%) */}
      <div className="w-full lg:w-[40%] bg-white flex items-center justify-center p-8 lg:p-20 relative overflow-y-auto">
         <div className="w-full max-w-md space-y-10">
            
            <div className="space-y-4">
               <div className="lg:hidden flex items-center gap-2 mb-8">
                  <Zap size={24} className="text-primary-500" />
                  <span className="font-black text-xl tracking-tighter uppercase italic">DropAI</span>
               </div>
               
               {authState === 'forgot' ? (
                 <button 
                  onClick={() => setAuthState('login')}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors mb-4"
                 >
                   <ChevronLeft size={14} /> Back to Entry
                 </button>
               ) : null}

               <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                  {authState === 'login' && "Welcome Back."}
                  {authState === 'signup' && "Get Started."}
                  {authState === 'forgot' && "Recover Access."}
               </h2>
               <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  {authState === 'login' && "Connect your eBay store and start AI-driven fulfillment."}
                  {authState === 'signup' && "Create your enterprise hub credentials to begin."}
                  {authState === 'forgot' && "Enter your identity identifier to reset security protocols."}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-1">Email Address</label>
                     <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={16} />
                        <input 
                           type="email" 
                           placeholder="name@company.com" 
                           required
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 text-[13px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all outline-none placeholder:text-slate-300" 
                        />
                     </div>
                  </div>

                  {authState !== 'forgot' && (
                    <div className="space-y-2">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Secret Key</label>
                          {authState === 'login' && (
                            <button 
                              type="button"
                              onClick={() => setAuthState('forgot')}
                              className="text-[9px] font-black text-primary-500 uppercase tracking-widest hover:underline"
                            >
                               Lost protocol?
                            </button>
                          )}
                       </div>
                       <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={16} />
                          <input 
                             type="password" 
                             placeholder="••••••••" 
                             required
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 text-[13px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all outline-none placeholder:text-slate-300" 
                          />
                       </div>
                    </div>
                  )}
               </div>

               <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary-500 transition-all hover:scale-[1.01] active:scale-95 shadow-xl shadow-slate-900/10 disabled:opacity-50"
               >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      {authState === 'login' && "Sync Identity"}
                      {authState === 'signup' && "Initialize Hub"}
                      {authState === 'forgot' && "Transmit Reset"}
                      <ArrowRight size={16} />
                    </>
                  )}
               </button>
            </form>

            {authState !== 'forgot' && (
               <>
                  <div className="relative flex items-center gap-4 py-2">
                     <div className="flex-1 h-px bg-slate-100" />
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-2">Secure OAuth Tunnel</span>
                     <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <button 
                     onClick={handleGoogleLogin}
                     disabled={loading}
                     className="w-full h-12 bg-white border border-slate-200 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                  >
                     {loading ? <Loader2 className="animate-spin" size={18} /> : (
                        <>
                           <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                           Proceed with Google
                        </>
                     )}
                  </button>
               </>
            )}

            <div className="text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {authState === 'login' ? "New account?" : "Already registered?"}
                  <button 
                     onClick={() => setAuthState(authState === 'login' ? 'signup' : 'login')}
                     className="ml-2 text-primary-500 hover:underline"
                  >
                     {authState === 'login' ? "Register Store" : "Access Terminal"}
                  </button>
               </p>
            </div>

            <div className="pt-12 flex flex-col items-center gap-4 border-t border-slate-50">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-[9px] font-black tracking-widest uppercase italic">
                  <ShieldCheck size={12} />
                  Mainframe Connectivity: High
               </div>
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Integrated with eBay Marketplace Ecosystem v1.0</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Login;
