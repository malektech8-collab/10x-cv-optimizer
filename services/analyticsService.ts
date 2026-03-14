import { collection, addDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured, auth } from '../lib/firebase';

export type AnalyticsEvent =
  | 'ATS_ANALYSIS_STARTED'
  | 'ATS_ANALYSIS_COMPLETED'
  | 'OPTIMIZATION_CLICKED'
  | 'AI_RESUME_BUILDER_STARTED'
  | 'PAYMENT_COMPLETED';

export const trackEvent = async (
  event: AnalyticsEvent,
  metadata?: Record<string, any>,
): Promise<void> => {
  if (!isFirebaseConfigured) return;

  try {
    await addDoc(collection(db, 'analyticsEvents'), {
      event,
      userId: auth.currentUser?.uid || null,
      metadata: metadata || null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Analytics tracking failed (non-critical):', err);
  }
};
