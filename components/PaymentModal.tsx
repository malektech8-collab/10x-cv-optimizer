import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { translations, Language } from '../constants/translations';
import { createPaymentIntention, buildPaymobCheckoutUrl } from '../services/paymobService';
import { getAuth } from 'firebase/auth';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (optimizationId: string) => void;
  amount: number;
  currency: string;
  lang: Language;
  optimizationId?: string | null;
}

type Step = 'idle' | 'loading' | 'error';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  currency,
  lang,
  optimizationId,
}) => {
  const t = translations[lang];
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const displayCurrency = currency === 'SAR' ? 'ر.س' : currency;

  useEffect(() => {
    if (!isOpen) {
      setStep('idle');
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleInitiatePayment = async () => {
    setStep('loading');
    setErrorMsg('');

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user || !user.email) {
        setErrorMsg('You must be signed in to make a payment.');
        setStep('error');
        return;
      }

      const nameParts = (user.displayName || '').split(' ');

      const { clientSecret, optimizationId: orderId } = await createPaymentIntention({
        amount,
        currency,
        email: user.email,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: (user as any).phoneNumber || undefined,
        optimizationId: optimizationId || undefined,
      });

      sessionStorage.setItem('pendingOptimizationId', orderId);
      window.location.href = buildPaymobCheckoutUrl(clientSecret);
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setErrorMsg(err?.message || 'Failed to initiate payment. Please try again.');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#150D30]/60 backdrop-blur-sm animate-fade-in"
      dir={t.dir}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden border border-[#E8E2F0]">

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-[#E8E2F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/brand-assets/10-x logo.png" alt="10-x" className="w-9 h-9" />
            <span className="font-semibold text-[#150D30]">{t.payment.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-7">

          {/* ─── idle: confirm & pay ─── */}
          {step === 'idle' && (
            <div className="space-y-6">

              {/* Amount */}
              <div className="text-center py-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
                  {t.payment.total}
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-[#2D1065] tracking-tight">{amount}</span>
                  <span className="text-xl font-bold text-[#C9984A]">{displayCurrency}</span>
                </div>
              </div>

              {/* Security items */}
              <div className="bg-[#F2EEF9] rounded-xl p-4 space-y-2.5 border border-[#E8E2F0]">
                {[
                  'Payments processed securely by Paymob',
                  'PCI DSS compliant — your card data never touches our servers',
                  '3D Secure authentication supported',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>

              {/* Card logos */}
              <div className="flex items-center justify-center gap-5">
                <img src="/brand-assets/visa.svg" alt="Visa" className="h-6 opacity-70 hover:opacity-100 transition-opacity" />
                <img src="/brand-assets/mastercard.svg" alt="Mastercard" className="h-7 opacity-70 hover:opacity-100 transition-opacity" />
                <img src="/brand-assets/mada.svg" alt="mada" className="h-7 opacity-70 hover:opacity-100 transition-opacity" />
              </div>

              {/* CTA */}
              <button
                onClick={handleInitiatePayment}
                className="w-full py-3.5 bg-[#2D1065] text-white rounded-xl font-medium text-base hover:bg-[#220C4E] transition-colors flex items-center justify-center gap-2.5 shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
              >
                {t.payment.button
                  .replace('{amount}', amount.toString())
                  .replace('{currency}', displayCurrency)}
              </button>

              <p className="text-center text-xs text-slate-400">{t.payment.compliance}</p>
            </div>
          )}

          {/* ─── loading: redirecting ─── */}
          {step === 'loading' && (
            <div className="py-16 flex flex-col items-center justify-center gap-6 text-center">
              <div className="w-14 h-14 bg-[#EBE5F5] rounded-2xl flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-[#2D1065] animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#150D30]">{t.payment.verifying}</h3>
                <p className="text-slate-500 text-sm max-w-[240px] leading-relaxed">
                  Redirecting to secure payment page…
                </p>
              </div>
            </div>
          )}

          {/* ─── error ─── */}
          {step === 'error' && (
            <div className="py-10 flex flex-col items-center justify-center gap-5 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-[#150D30]">Payment Failed</h3>
                <p className="text-slate-500 text-sm max-w-xs leading-relaxed">{errorMsg}</p>
              </div>
              <button
                onClick={() => setStep('idle')}
                className="px-6 py-2.5 bg-[#2D1065] text-white rounded-xl font-medium text-sm hover:bg-[#220C4E] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
