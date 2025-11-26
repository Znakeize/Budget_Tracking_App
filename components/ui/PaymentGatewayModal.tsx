
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, Smartphone, Globe, Wallet, Lock, ArrowRight, Loader2 } from 'lucide-react';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: string;
  itemTitle: string;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({ isOpen, onClose, onConfirm, amount, itemTitle }) => {
    const [selectedMethod, setSelectedMethod] = useState<'card' | 'apple' | 'google' | 'paypal' | 'wise' | null>('card');
    const [loading, setLoading] = useState(false);
    const [cardNum, setCardNum] = useState('');
    const [expiry, setExpiry] = useState('');

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            onConfirm();
        }, 2000);
    };

    const handleCardNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, '').substring(0, 16);
        v = v.match(/.{1,4}/g)?.join(' ') || v;
        setCardNum(v);
    };

    // Use Portal to render outside the main app container to avoid z-index stacking context issues
    return createPortal(
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-4 pb-safe-bottom sm:pb-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-2 duration-300 max-h-[80vh] overflow-y-auto custom-scrollbar mb-20 sm:mb-0">
                
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Checkout</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{itemTitle} • <span className="text-slate-900 dark:text-white font-bold">{amount}</span></p>
                    </div>
                    <button onClick={onClose} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Payment Methods Grid */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block ml-1">Select Payment Method</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={() => setSelectedMethod('card')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedMethod === 'card' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                            >
                                <CreditCard size={24} />
                                <span className="text-xs font-bold">Card</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setSelectedMethod('apple')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedMethod === 'apple' ? 'border-slate-900 bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white ring-1 ring-slate-900 dark:ring-white' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                            >
                                <div className="flex items-center gap-1">
                                    <Smartphone size={20} className="fill-current" /> 
                                    <span className="font-bold text-sm">Pay</span>
                                </div>
                                <span className="text-[10px] font-bold">Apple Pay</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setSelectedMethod('google')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedMethod === 'google' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                            >
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-lg">G</span> 
                                    <span className="font-bold text-sm">Pay</span>
                                </div>
                                <span className="text-[10px] font-bold">Google Pay</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setSelectedMethod('paypal')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedMethod === 'paypal' ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                            >
                                <Wallet size={24} />
                                <span className="text-xs font-bold">PayPal</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setSelectedMethod('wise')}
                                className={`col-span-2 p-3 rounded-xl border flex flex-row items-center justify-center gap-3 transition-all ${selectedMethod === 'wise' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                            >
                                <Globe size={20} />
                                <span className="text-xs font-bold">Wise / Other Transfer</span>
                            </button>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <form onSubmit={handlePay} className="space-y-4">
                        {selectedMethod === 'card' ? (
                            <div className="space-y-3 animate-in slide-in-from-top-2">
                                {/* Visual Card */}
                                <div className="bg-gradient-to-br from-slate-800 to-black text-white p-5 rounded-2xl shadow-lg mb-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-10 h-6 bg-yellow-500/20 rounded-md border border-yellow-500/50"></div>
                                        <span className="font-bold italic text-lg opacity-80">VISA</span>
                                    </div>
                                    <div className="font-mono text-xl tracking-widest mb-4">{cardNum || '0000 0000 0000 0000'}</div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xs opacity-70">
                                            <div className="text-[8px] uppercase mb-0.5">Card Holder</div>
                                            <div>YOUR NAME</div>
                                        </div>
                                        <div className="text-xs opacity-70">
                                            <div className="text-[8px] uppercase mb-0.5">Expires</div>
                                            <div>{expiry || 'MM/YY'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block ml-1">Card Number</label>
                                    <div className="relative">
                                        <CreditCard size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                        <input 
                                            value={cardNum}
                                            onChange={handleCardNumChange}
                                            maxLength={19}
                                            type="text" 
                                            placeholder="0000 0000 0000 0000" 
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-mono outline-none focus:border-indigo-500 transition-colors" 
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block ml-1">Expiry</label>
                                        <input 
                                            value={expiry}
                                            onChange={e => setExpiry(e.target.value)}
                                            maxLength={5}
                                            type="text" 
                                            placeholder="MM / YY" 
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-mono outline-none focus:border-indigo-500 transition-colors text-center" 
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block ml-1">CVC</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                            <input 
                                                type="password" 
                                                maxLength={3}
                                                placeholder="123" 
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-mono outline-none focus:border-indigo-500 transition-colors" 
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block ml-1">Cardholder Name</label>
                                    <input type="text" placeholder="John Doe" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-colors" required />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl text-center animate-in fade-in">
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                    You will be redirected to {selectedMethod === 'paypal' ? 'PayPal' : selectedMethod === 'wise' ? 'Wise' : selectedMethod === 'apple' ? 'Apple' : 'Google'} to securely complete your purchase.
                                </p>
                                <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full mx-auto flex items-center justify-center shadow-sm mb-2">
                                    <Globe className="text-slate-400" />
                                </div>
                            </div>
                        )}

                        {selectedMethod === 'card' && (
                            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 py-2 rounded-lg">
                                <Lock size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wide">SSL Secure Payment</span>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <React.Fragment>Pay {amount} <ArrowRight size={18}/></React.Fragment>}
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};
