
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { User, Mail, Lock, ArrowRight, ChevronLeft, Loader2, Eye, EyeOff, Facebook } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: any) => void;
  onBack: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onBack }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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
                    BudgetFlow
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {mode === 'signin' ? 'Welcome back! Sign in to continue.' : 'Create an account to sync your data.'}
                </p>
            </div>

            <Card className="p-6 border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
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
                <div className="mt-4 text-center">
                    {mode === 'signin' && (
                        <button className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-medium transition-colors">
                            Forgot Password?
                        </button>
                    )}
                </div>

                {/* Social Login Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400 font-medium">Or continue with</span>
                    </div>
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => handleSocialLogin('Google')} 
                        disabled={isLoading}
                        className="flex items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95 disabled:opacity-50"
                        aria-label="Sign in with Google"
                    >
                        <GoogleIcon />
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('Apple')} 
                        disabled={isLoading}
                        className="flex items-center justify-center p-3 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white rounded-xl hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50"
                        aria-label="Sign in with Apple"
                    >
                        <AppleIcon />
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('Facebook')} 
                        disabled={isLoading}
                        className="flex items-center justify-center p-3 bg-[#1877F2] text-white rounded-xl hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50"
                        aria-label="Sign in with Facebook"
                    >
                        <Facebook size={24} fill="currentColor" strokeWidth={0} />
                    </button>
                </div>
            </Card>

            <div className="mt-8 text-center">
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

// Internal Icon Components
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.289 L -25.464 53.289 L -25.464 56.379 C -23.484 60.309 -19.424 63.239 -14.754 63.239 Z" />
      <path fill="#FBBC05" d="M -21.484 53.289 C -21.734 52.539 -21.864 51.749 -21.864 50.939 C -21.864 50.129 -21.734 49.339 -21.484 48.589 L -21.484 45.499 L -25.464 45.499 C -26.284 47.129 -26.754 48.979 -26.754 50.939 C -26.754 52.899 -26.284 54.749 -25.464 56.379 L -21.484 53.289 Z" />
      <path fill="#EA4335" d="M -14.754 43.389 C -12.984 43.389 -11.404 43.999 -10.154 45.189 L -6.734 41.769 C -8.804 39.839 -11.514 38.639 -14.754 38.639 C -19.424 38.639 -23.484 41.569 -25.464 45.499 L -21.484 48.589 C -20.534 45.499 -17.884 43.389 -14.754 43.389 Z" />
    </g>
  </svg>
);

const AppleIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.6 12.32c.04 2.96 2.58 3.95 2.61 3.96-.02.06-.41 1.4-1.35 2.77-.81 1.18-1.66 2.36-3 2.38-1.3.02-1.72-.77-3.22-.77-1.5 0-1.97.75-3.21.79-1.29.05-2.27-1.29-3.09-2.48-1.68-2.43-2.97-6.88-1.24-9.88.86-1.49 2.4-2.43 4.08-2.46 1.28-.02 2.49.86 3.27.86.78 0 2.24-1.06 3.78-.9 1.61.12 2.84.65 3.61 1.78-3.04 1.5-2.53 5.92.03 6.93h-.03zM15.69 6.07c.68-.82 1.14-1.97 1.01-3.11-1.07.04-2.36.71-3.13 1.61-.62.72-1.16 1.88-1.02 3.02 1.2.09 2.42-.6 3.14-1.52z" />
    </svg>
);
