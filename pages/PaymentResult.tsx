import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Language } from '../constants/translations';

type ResultStatus = 'verifying' | 'success' | 'failed' | 'timeout';

interface PaymentResultProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const PaymentResult: React.FC<PaymentResultProps> = ({ lang, setLang }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ResultStatus>('verifying');
  const [optimizationId, setOptimizationId] = useState<string | null>(null);

  useEffect(() => {
    // Paymob passes ?success=true/false in the redirect URL
    const paymobSuccess = searchParams.get('success');
    if (paymobSuccess === 'false') {
      setStatus('failed');
      return;
    }

    // Resolve the optimizationId: sessionStorage (primary), oid query param (fallback from redirect URL),
    // merchant_order_id (legacy Paymob param)
    const storedId =
      sessionStorage.getItem('pendingOptimizationId') ||
      searchParams.get('oid') ||
      searchParams.get('merchant_order_id');

    if (!storedId) {
      navigate('/', { replace: true });
      return;
    }

    setOptimizationId(storedId);

    // Wait for Firebase auth to fully restore before listening to Firestore.
    // After a full-page redirect (Paymob checkout), Firebase auth state takes
    // a moment to restore. We wait for a non-null user (or a short grace period)
    // before starting the Firestore listener.
    let timeoutId: ReturnType<typeof setTimeout>;
    let unsubSnapshot: (() => void) | null = null;
    let resolved = false;

    const startListening = () => {
      if (resolved) return;
      resolved = true;

      const docRef = doc(db, 'optimizations', storedId);

      unsubSnapshot = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists() && snap.data()?.is_paid === true) {
            clearTimeout(timeoutId);
            unsubSnapshot?.();
            sessionStorage.removeItem('pendingOptimizationId');
            setStatus('success');
          }
        },
        (err) => {
          console.error('Firestore snapshot error:', err);
        }
      );
    };

    // Wait up to 3s for auth to restore, then start listening regardless
    const authGraceTimeout = setTimeout(() => startListening(), 3000);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        clearTimeout(authGraceTimeout);
        unsubAuth();
        startListening();
      }
    });

    // 45 second total timeout — webhook is typically < 5s but auth + network can add delay
    timeoutId = setTimeout(() => {
      unsubSnapshot?.();
      if (!resolved) setStatus('timeout');
      else setStatus((prev) => prev === 'verifying' ? 'timeout' : prev);
    }, 45_000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(authGraceTimeout);
      unsubSnapshot?.();
      unsubAuth();
    };
  }, []);

  const goHome = () =>
    navigate('/', {
      replace: true,
      state: { confirmedOptimizationId: optimizationId, isPaid: true },
    });

  return (
    <Layout lang={lang} onLanguageChange={setLang}>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-[2rem] shadow-xl p-10 sm:p-14 max-w-lg w-full text-center space-y-7 border border-slate-100">

          {status === 'verifying' && (
            <>
              <Loader2 className="w-20 h-20 text-[#9B4DCA] animate-spin mx-auto" />
              <h2 className="text-3xl font-black text-[#2D1065]">Verifying Payment…</h2>
              <p className="text-slate-500 font-bold">
                Confirming with our server — this takes just a moment.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto" />
              <h2 className="text-4xl font-black text-slate-900">Payment Successful!</h2>
              <p className="text-slate-500 text-lg font-bold">
                Your resume optimization is now unlocked.
              </p>
              <button
                onClick={goHome}
                className="w-full py-5 bg-[#9B4DCA] text-white rounded-2xl font-black text-xl hover:bg-[#2D1065] transition-all shadow-xl shadow-purple-100"
              >
                View My Optimized Resume
              </button>
            </>
          )}

          {(status === 'failed' || status === 'timeout') && (
            <>
              <XCircle className="w-24 h-24 text-red-500 mx-auto" />
              <h2 className="text-3xl font-black text-slate-900">
                {status === 'failed' ? 'Payment Failed' : 'Verification Timed Out'}
              </h2>
              <p className="text-slate-500 font-bold">
                {status === 'failed'
                  ? 'Your card was declined. No charge was made.'
                  : 'We could not verify your payment in time. If you were charged, please contact support.'}
              </p>
              <button
                onClick={() => navigate('/', { replace: true })}
                className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black text-xl hover:bg-slate-900 transition-all"
              >
                Back to Home
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};
