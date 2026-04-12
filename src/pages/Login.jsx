import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if already logged in (important for Redirect flow return)
  React.useEffect(() => {
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
        toast.success("Account created successfully!");
      } else {
        await login(email, password);
        toast.success("Welcome back!");
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
      toast.success("Welcome to Crystal Pulse!");
      navigate('/');
    } catch (error) {
      console.error("Google Auth Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Sign-in window closed. Please check if your browser blocked the pop-up.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // This happens if another popup is opened before the first one settles
        console.warn("Auth request cancelled - already in progress.");
      } else {
        toast.error(`Auth Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Brand/Intro */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Package className="text-white" size={32} />
            </div>
            <span className="font-display font-bold text-4xl">DropAI</span>
          </div>
          <h1 className="text-5xl font-bold font-display leading-tight mb-6">
            Automate Your eBay Profits with AI.
          </h1>
          <p className="text-white/80 text-lg mb-10">
            Search trending products, find sourcing matches on Eprolo, and optimize listings with powerful AI — all from one dashboard.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-secondary" />
              <span>Direct eBay Integration</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-secondary" />
              <span>AI Product Copywriting</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-secondary" />
              <span>One-Click Video Creation</span>
            </div>
          </div>
        </div>
        
        {/* Abstract background shapes */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Package className="text-white" size={24} />
            </div>
            <span className="font-display font-bold text-2xl">DropAI</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-2">
              {isRegistering ? "Start Your Free Trial" : "Sign In to DropAI"}
            </h2>
            <p className="text-slate-500">
              {isRegistering 
                ? "Join thousands of successful eBay sellers today." 
                : "Enter your credentials to access your dashboard."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full pl-10 h-11"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                {!isRegistering && (
                  <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full pl-10 h-11"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full h-11 flex items-center justify-center shadow-lg hover:translate-y-[-1px] active:translate-y-[0px]"
            >
              {loading 
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : (isRegistering ? "Create Account" : "Sign In")
              }
            </button>
          </form>

          <div className="my-8 flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <div className="h-px w-full bg-slate-100" />
            <span>OR</span>
            <div className="h-px w-full bg-slate-100" />
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-11 border border-slate-200 rounded-lg flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </>
            )}
          </button>

          <p className="mt-8 text-center text-slate-600">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-primary font-bold hover:underline"
            >
              {isRegistering ? "Sign In" : "Sign Up for Free"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
