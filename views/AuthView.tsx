
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { User, Mail, Lock, ArrowRight, ChevronLeft, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: any) => void;
  onBack: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onBack }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API Network Request
    setTimeout(() => {
        setIsLoading(false);
        
        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        if (mode === 'signup' && !formData.name) {
            setError('Please enter your name');
            return;
        }

        // Mock Success
        const user = {
            name: mode === 'signup' ? formData.name : formData.email.split('@')[0],
            email: formData.email,
            joined: Date.now(),
            isPro: mode === 'signup' // Grant pro to new signups for demo
        };

        onLogin(user);
    }, 1500);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      if (!formData.email) {
          setError('Please enter your email address');
          return;
      }
      
      setIsLoading(true);
      // Simulate API
      setTimeout(() => {
          setIsLoading(false);
          setResetSent(true);
      }, 1500);
  };

  const handleSocialLogin = (provider: string) => {
      setIsLoading(true);
      setError('');
      
      setTimeout(() => {
          setIsLoading(false);
          onLogin({
              name: `${provider} User`,
              email: `user@${provider.toLowerCase()}.com`,
              joined: Date.now(),
              isPro: false
          });
      }, 1500);
  };

  return (
    <div className="flex flex-col h-full relative p-6 pt-12">
        {/* Back / Cancel Action (e.g. close if triggered from menu) */}
        <button 
            onClick={onBack}
            className="absolute top-6 left-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
        >
            <ChevronLeft size={24} />
        </button>

        <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-4 shadow-xl shadow-indigo-500/30 flex items-center justify-center transform -rotate-6">
                    <span className="text-3xl font-bold text-white">B</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                    Budget Tracker
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {mode === 'signin' ? 'Welcome back! Sign in to continue.' : mode === 'signup' ? 'Create an account to sync your data.' : 'Reset your password.'}
                </p>
            </div>

            <Card className="p-6 border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                {mode !== 'forgot' ? (
                    <>
                        {/* Toggle */}
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                            <button 
                                onClick={() => { setMode('signin'); setError(''); }}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'signin' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                Sign In
                            </button>
                            <button 
                                onClick={() => { setMode('signup'); setError(''); }}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'signup' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="space-y-1.5 animate-in slide-in-from-left-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Full Name</label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="John Doe"
                                            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input 
                                        type="email" 
                                        placeholder="name@example.com"
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Password</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all"
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium animate-in shake">
                                    <span className="block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    {error}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        {mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer Links */}
                        <div className="mt-2 text-center">
                            {mode === 'signin' && (
                                <button 
                                    type="button"
                                    onClick={() => { setMode('forgot'); setError(''); setResetSent(false); }}
                                    className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-medium transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            )}
                        </div>

                        {/* Social Login Divider */}
                        <div className="relative my-3">
                            <div className="absolute inset-0 flex items-top">
                                <div className="w-full border-t border-slate-200 dark:border-slate-700 mt-5"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className=" text-slate-500 dark:text-slate-400 font-bold">Or continue with</span>
                            </div>
                        </div>

                        {/* Social Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            <button 
                                onClick={() => handleSocialLogin('Google')} 
                                disabled={isLoading}
                                className="p-2 hover:scale-150 transition transform duration-300 flex items-center justify-center"
                                aria-label="Sign in with Google"
                            >
                                <img className="w-6 h-6" loading="lazy" src="https://ucarecdn.com/8f25a2ba-bdcf-4ff1-b596-088f330416ef/" alt="Google" />
                            </button>
                            <button 
                                onClick={() => handleSocialLogin('Facebook')} 
                                disabled={isLoading}
                                className="p-2 hover:scale-150 transition transform duration-300 flex items-center justify-center"
                                aria-label="Sign in with Facebook"
                            >
                                <img className="w-6 h-6" loading="lazy" src="https://ucarecdn.com/6f56c0f1-c9c0-4d72-b44d-51a79ff38ea9/" alt="Facebook" />
                            </button>
                            <button 
                                onClick={() => handleSocialLogin('Apple')} 
                                disabled={isLoading}
                                className="p-2 hover:scale-150 transition transform duration-300 flex items-center justify-center"
                                aria-label="Sign in with Apple"
                            >
                                <img className="w-6 h-6" loading="lazy" src="https://ucarecdn.com/3277d952-8e21-4aad-a2b7-d484dad531fb/" alt="Apple" />
                            </button>
                        </div>
                    </>
                ) : (
                    /* Forgot Password View */
                    <div className="animate-in fade-in slide-in-from-right-8">
                        {!resetSent ? (
                            <>
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset Password</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter your email to receive instructions.</p>
                                </div>

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                                            <input 
                                                type="email" 
                                                placeholder="name@example.com"
                                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all"
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium animate-in shake">
                                            <span className="block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                            {error}
                                        </div>
                                    )}

                                    <button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-4 animate-in zoom-in-95">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Check your email</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[240px] mx-auto">
                                    We've sent password reset instructions to <span className="font-bold text-slate-700 dark:text-slate-300">{formData.email}</span>.
                                </p>
                            </div>
                        )}

                        <button 
                            type="button"
                            onClick={() => { setMode('signin'); setError(''); setResetSent(false); }}
                            className="w-full mt-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            Back to Sign In
                        </button>
                    </div>
                )}
            </Card>

            <div className="mt-4 text-center">
                <button 
                    onClick={onBack}
                    className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    Continue as Guest
                </button>
            </div>
        </div>
    </div>
  );
};
