
import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { translations, Language } from '../constants/translations';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  currency: string;
  lang: Language;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, amount, currency, lang }) => {
  const t = translations[lang];
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    
    // Simulate Paymob transaction processing
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }, 2500);
  };

  const formattedButton = t.payment.button
    .replace('{amount}', amount.toString())
    .replace('{currency}', currency);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300" dir={t.dir}>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/20">
        <button 
          onClick={onClose}
          className={`absolute top-6 ${t.dir === 'rtl' ? 'left-6' : 'right-6'} p-3 text-slate-400 hover:text-[#4D2B8C] hover:bg-slate-100 rounded-full transition-all`}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="bg-[#4D2B8C] p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-[#FFEF5F]" />
            </div>
            <span className="font-black text-xl text-[#4D2B8C] tracking-tight">{t.payment.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-5" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8" />
          </div>
        </div>

        <div className="p-10">
          {step === 'details' && (
            <form onSubmit={handlePay} className="space-y-8">
              <div className="text-center space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{t.payment.total}</p>
                <h3 className="text-5xl font-black text-[#4D2B8C] tracking-tighter">
                  {amount} <span className="text-2xl font-black text-[#EEA727]">{currency}</span>
                </h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-2 text-start">
                  <label className="text-xs font-black text-[#4D2B8C] uppercase tracking-widest">{t.payment.name}</label>
                  <input 
                    required
                    type="text"
                    placeholder="Full Name"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#85409D] focus:border-transparent transition-all outline-none font-bold placeholder:text-slate-300"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2 text-start">
                  <label className="text-xs font-black text-[#4D2B8C] uppercase tracking-widest">{t.payment.number}</label>
                  <div className="relative">
                    <input 
                      required
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      className={`w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#85409D] focus:border-transparent transition-all outline-none font-bold placeholder:text-slate-300 ${t.dir === 'rtl' ? 'pr-14' : 'pl-14'}`}
                      value={formData.cardNumber}
                      onChange={e => setFormData({...formData, cardNumber: e.target.value})}
                    />
                    <CreditCard className={`absolute top-1/2 -translate-y-1/2 text-[#4D2B8C] w-6 h-6 opacity-40 ${t.dir === 'rtl' ? 'right-5' : 'left-5'}`} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 text-start">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#4D2B8C] uppercase tracking-widest">{t.payment.expiry}</label>
                    <input 
                      required
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#85409D] focus:border-transparent transition-all outline-none font-bold placeholder:text-slate-300"
                      value={formData.expiry}
                      onChange={e => setFormData({...formData, expiry: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#4D2B8C] uppercase tracking-widest">{t.payment.cvv}</label>
                    <input 
                      required
                      type="text"
                      placeholder="123"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#85409D] focus:border-transparent transition-all outline-none font-bold placeholder:text-slate-300"
                      value={formData.cvv}
                      onChange={e => setFormData({...formData, cvv: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-[#85409D] text-white rounded-2xl font-black text-xl hover:bg-[#4D2B8C] transition-all shadow-xl shadow-purple-100 flex items-center justify-center gap-3 mt-4 transform hover:-translate-y-1"
              >
                {formattedButton}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span>{t.payment.compliance}</span>
              </div>
            </form>
          )}

          {step === 'processing' && (
            <div className="py-20 flex flex-col items-center justify-center space-y-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-200 blur-2xl animate-pulse rounded-full opacity-40"></div>
                <Loader2 className="w-20 h-20 text-[#85409D] animate-spin relative" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-[#4D2B8C] tracking-tight">{t.payment.verifying}</h3>
                <p className="text-slate-500 font-bold text-lg max-w-[280px] leading-relaxed">{t.payment.verifyingDesc}</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-20 flex flex-col items-center justify-center space-y-8 text-center animate-in zoom-in-95 duration-500">
              <div className="bg-green-50 p-6 rounded-full shadow-lg shadow-green-100">
                <CheckCircle2 className="w-20 h-20 text-green-500" />
              </div>
              <div className="space-y-3">
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{t.payment.success}</h3>
                <p className="text-slate-500 text-xl font-bold">{t.payment.successDesc}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
