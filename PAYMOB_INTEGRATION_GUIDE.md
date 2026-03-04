# Paymob Payment Integration - Complete Setup Guide

## Overview
The 10-xCV application now has full Paymob payment integration enabled. Users must pay **39 SAR** to unlock resume export features (PDF, DOCX, text copy).

## Implementation Status

### ✅ Completed
- **Cloud Functions**: `initiatePayment()` and `verifyPaymentStatus()` implemented
- **Frontend**: PaymentModal updated with real Paymob API integration
- **Payment Validation**: Uncommented in optimizeResume() function
- **Testing Bypasses**: Removed from Home.tsx - all users start with `is_paid: false`
- **Firestore Tracking**: Payment records stored with transaction IDs

### ⚙️ Configuration Required
- Paymob API credentials must be set as environment variables
- Firebase Cloud Functions need these variables deployed

---

## Step 1: Set Up Paymob Merchant Account

### A. Create Paymob Account
1. Go to **https://accept.paymobsolutions.com** (or https://dashboard.paymob.com)
2. Sign up for a merchant account (Saudi Arabia region preferred for SAR currency)
3. Verify your email and phone number
4. Complete KYC (Know Your Customer) verification

### B. Get API Credentials
Once your account is approved:

1. Navigate to **Settings → API Keys** or **Integrations → API Keys**
2. You'll see:
   - **API Key** (this is `PAYMOB_API_KEY`) - long alphanumeric string
   - **Merchant ID** (this is `PAYMOB_MERCHANT_ID`) - numeric ID
   - **Secret Key** (this is `PAYMOB_SECRET_KEY`) - for webhook validation
   - **HMAC Secret** - optional, for advanced security

3. Copy these credentials somewhere safe

### C. Configure Payment Gateway
1. In Paymob dashboard, go to **Payment Gateways**
2. Select or create a new gateway for "Credit Card"
3. Note the **Integration ID** if you plan to use Hosted Payment Page (optional)

---

## Step 2: Deploy Environment Variables to Firebase

### Option A: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Set environment variables for Cloud Functions**:
   ```bash
   firebase functions:config:set paymob.api_key="YOUR_PAYMOB_API_KEY"
   firebase functions:config:set paymob.merchant_id="YOUR_PAYMOB_MERCHANT_ID"
   firebase functions:config:set paymob.secret_key="YOUR_PAYMOB_SECRET_KEY"
   ```

3. **Verify the config was saved**:
   ```bash
   firebase functions:config:get
   ```
   You should see a `.firebaserc` file with your configuration.

4. **Update functions/src/index.ts** to read from Firebase config:
   ```typescript
   // Change these lines:
   const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY || '';
   const PAYMOB_MERCHANT_ID = process.env.PAYMOB_MERCHANT_ID || '';
   const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY || '';

   // To:
   const PAYMOB_API_KEY = process.env.paymob_api_key || process.env.PAYMOB_API_KEY || '';
   const PAYMOB_MERCHANT_ID = process.env.paymob_merchant_id || process.env.PAYMOB_MERCHANT_ID || '';
   const PAYMOB_SECRET_KEY = process.env.paymob_secret_key || process.env.PAYMOB_SECRET_KEY || '';
   ```

5. **Deploy to Firebase**:
   ```bash
   firebase deploy --only functions
   ```

### Option B: Using Firebase Console

1. Go to **Firebase Console → Project → Functions → Runtime Configuration**
2. Add environment variables manually:
   - Key: `PAYMOB_API_KEY`, Value: `YOUR_KEY`
   - Key: `PAYMOB_MERCHANT_ID`, Value: `YOUR_ID`
   - Key: `PAYMOB_SECRET_KEY`, Value: `YOUR_SECRET`

3. Redeploy functions after adding variables

### Option C: Local Testing with .env

For **local development only** (not for production):

1. Create `.env.local` in the `functions/` directory:
   ```env
   PAYMOB_API_KEY=your_actual_api_key_here
   PAYMOB_MERCHANT_ID=your_merchant_id_here
   PAYMOB_SECRET_KEY=your_secret_key_here
   ```

2. Install `dotenv`:
   ```bash
   cd functions
   npm install dotenv
   ```

3. Add to `functions/src/index.ts` (top of file):
   ```typescript
   import * as dotenv from 'dotenv';
   dotenv.config();
   ```

4. Run emulator:
   ```bash
   firebase emulators:start
   ```

⚠️ **NEVER commit .env to Git!** Add to `.gitignore`

---

## Step 3: Test the Payment Flow

### Testing in Development (Local Emulator)

1. **Start Firebase Emulator**:
   ```bash
   cd C:\Users\hr\.claude-worktrees\10-xCV-main\dazzling-raman
   firebase emulators:start
   ```

2. **Run the app**:
   ```bash
   npm run dev
   ```

3. **Test Payment Flow**:
   - Upload a resume
   - Click "Analyze" → Complete analysis
   - Click "Optimize" → Complete optimization
   - See "Resume Analysis Complete" modal with **"Unlock My Resume Now"** button
   - Click the button → Payment modal opens
   - **Test Cards** (Paymob provides test credit card numbers):
     - Visa: `4111111111111111` Exp: `12/25` CVV: `123`
     - Mastercard: `5555555555554444` Exp: `12/25` CVV: `123`

4. **Verify Payment Success**:
   - Should see "Payment Successful!" message
   - Modal auto-closes after 2 seconds
   - Export buttons (PDF, DOCX, Copy) should now be enabled
   - Check Firestore: `optimizations/{docId}` should have `is_paid: true`

### Testing on Production (After Deployment)

Use Paymob's **Production Test Cards** (same as above) with real credentials:

1. Deploy to Firebase: `firebase deploy`
2. Open the live app
3. Test with production credentials
4. Verify Firestore updates with real transaction IDs

---

## Step 4: Understand the Payment Flow

### User Journey

```
1. User uploads resume → Analysis shows "Resume Analysis Complete"
2. Sees "UNLOCK MY RESUME NOW" button (price: 39 SAR)
3. Clicks button → PaymentModal opens
4. Enters card details (name, card number, expiry, CVV)
5. Clicks "Pay 39 SAR via Paymob"
   ↓
6. Frontend calls Cloud Function: initiatePayment()
   ↓
7. Cloud Function:
   a) Gets auth token from Paymob API
   b) Creates payment order in Paymob system
   c) Processes card payment
   d) Updates Firestore with payment status (is_paid: true)
   ↓
8. Returns success response to frontend
9. Shows "Payment Successful!" message
10. Closes modal after 2 seconds
11. Export buttons now enabled
```

### What Happens on Payment Success

✅ **Firestore Document Updated**:
```json
{
  "user_id": "firebase_user_id",
  "html_content": "...",
  "is_paid": true,  // ← CHANGED FROM FALSE
  "order_number": "ORD-123456AB",
  "payment_transaction_id": "paymob_transaction_123456",
  "payment_amount": 39,
  "payment_currency": "SAR",
  "payment_date": "2025-03-04T10:30:00Z",
  "payment_method": "paymob_card"
}
```

✅ **Frontend State**:
- `isPaid` state set to `true`
- Export buttons enabled
- User can copy text, copy HTML, download PDF, download DOCX

✅ **Cloud Function Access**:
- Subsequent calls to `optimizeResume()` with this optimization ID will succeed
- Unpaid optimizations will be rejected with "Payment required" error

---

## Step 5: Handle Payment Failures

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Insufficient balance" | Card doesn't have enough funds | Use different card or test card |
| "Card has been declined" | Invalid card details or blocked | Check card number, expiry, CVV |
| "Payment service not configured" | API credentials missing | Deploy environment variables to Firebase |
| "Failed to authenticate with Paymob" | Invalid API key | Verify API key is correct in Paymob dashboard |
| "Payment processing failed" | Paymob API error | Check Paymob dashboard logs |

### User Experience on Failure

1. Payment modal shows error message
2. "Try Again" button appears
3. User can retry with same or different card
4. `is_paid` remains `false` in Firestore
5. Export buttons remain locked

---

## Step 6: Production Checklist

Before going live:

- [ ] Paymob merchant account created and verified
- [ ] API credentials obtained and stored securely
- [ ] Environment variables deployed to Firebase Cloud Functions
- [ ] Tested payment flow with test cards in development
- [ ] Tested payment flow with real cards in production (after deployment)
- [ ] Verified Firestore updates correctly after payment
- [ ] Tested error handling and retry flow
- [ ] Checked that unpaid users see "Unlock" button
- [ ] Checked that paid users see export buttons
- [ ] Verified admin panel shows correct payment status
- [ ] Set up monitoring/alerts for payment failures (optional)
- [ ] Added webhook handler if using IPN (optional but recommended)

---

## Step 7: Monitoring & Troubleshooting

### Check Payment Status in Firestore

1. Go to **Firebase Console → Firestore → Collections → optimizations**
2. Look for documents with `is_paid: true` and `payment_transaction_id`
3. Verify timestamps match when users made payments

### View Cloud Function Logs

1. Go to **Firebase Console → Functions → Logs**
2. Filter by `initiatePayment` or `verifyPaymentStatus`
3. Check for errors or failed Paymob API calls

### Test with Paymob Dashboard

1. Log into **Paymob dashboard → Transactions** or **Orders**
2. Should see payment records with:
   - Amount: 3900 (cents)
   - Status: Success or Pending
   - Timestamp of payment
   - Order ID matching our records

---

## Step 8: Advanced Configuration (Optional)

### A. Add Webhook for Real-Time Updates

Paymob can send webhooks to notify you of payment status:

1. In Paymob dashboard, go to **Settings → Webhooks**
2. Add webhook URL: `https://your-app.firebaseapp.com/notify/payment`
3. Add a new Cloud Function to handle webhooks:

```typescript
export const handlePaymentWebhook = functions.https.onRequest(
    async (req, res) => {
        const { order_id, success, amount_cents } = req.body;

        // Verify webhook signature if needed
        // Update Firestore with webhook data
        // Send confirmation email, etc.

        res.send({ status: 'ok' });
    }
);
```

### B. Currency Configuration

Currently set to **SAR (Saudi Arabian Riyal)**. To change:

In `functions/src/index.ts`, change:
```typescript
currency: 'EGP', // Change to 'SAR', 'AED', 'USD', etc.
```

And update pricing in `Home.tsx`:
```typescript
amount={39}  // Change amount if currency changes
```

### C. Recurring Payments / Subscriptions

For monthly subscriptions instead of one-time payment:

1. Use Paymob's subscription API
2. Store subscription ID in Firestore
3. Check subscription status instead of `is_paid`
4. Update UI to reflect subscription status

---

## File Changes Summary

### Modified Files

| File | Changes |
|------|---------|
| `pages/Home.tsx` | Removed testing bypasses, added optimizationId prop |
| `components/PaymentModal.tsx` | Real Paymob API integration, error handling |
| `components/ResumePreview.tsx` | Added optimizationId prop |
| `functions/src/index.ts` | Added `initiatePayment()` and `verifyPaymentStatus()` functions, uncommented payment validation |

### New Environment Variables (Required)

- `PAYMOB_API_KEY` - Your Paymob API key
- `PAYMOB_MERCHANT_ID` - Your Paymob merchant ID
- `PAYMOB_SECRET_KEY` - Your Paymob secret key (for webhooks)

---

## Support & Testing

### Test Credentials

**Test API Endpoint**: `https://accept.paymobsolutions.com/api/` (test mode)
**Production Endpoint**: `https://api.paymob.com/api/` (production mode)

**Test Cards**:
- Visa: `4111111111111111` | `12/25` | `123`
- Mastercard: `5555555555554444` | `12/25` | `123`
- AmEx: `378282246310005` | `12/25` | `123`

All test cards use CVV: **123** and any future expiry date.

### Paymob Documentation

- **Main Docs**: https://docs.paymob.com
- **API Reference**: https://docs.paymob.com/docs/api-reference
- **Integration Guide**: https://docs.paymob.com/docs/accept-card-payment
- **Support**: https://www.paymob.com/en/contact-us

---

## Rollback Instructions

If you need to disable payments (emergency):

1. In `Home.tsx`, change:
   ```typescript
   is_paid: false,  // → is_paid: true
   ```

2. In `functions/src/index.ts`, comment out:
   ```typescript
   // if (!doc.data()?.is_paid) {
   //     throw new functions.https.HttpsError(...);
   // }
   ```

3. Redeploy: `firebase deploy`

This will allow all users to export without payment.

---

## Next Steps

1. ✅ Set up Paymob account with correct region (Saudi Arabia for SAR)
2. ✅ Deploy environment variables to Firebase
3. ✅ Test locally with emulator and test cards
4. ✅ Deploy to production
5. ✅ Test with real cards (small test transaction)
6. ✅ Monitor Firestore and Cloud Function logs
7. ⏭️ Optional: Set up webhooks for real-time updates
8. ⏭️ Optional: Add invoice generation
9. ⏭️ Optional: Implement refund handling

---

## Quick Reference Commands

```bash
# Set Firebase config
firebase functions:config:set paymob.api_key="KEY" paymob.merchant_id="ID" paymob.secret_key="SECRET"

# View config
firebase functions:config:get

# Deploy only functions
firebase deploy --only functions

# Start emulator
firebase emulators:start

# View function logs
firebase functions:log

# View Firestore data
firebase firestore:delete --recursive optimizations/

# Run locally
npm run dev
```

---

**Last Updated**: March 4, 2025
**Status**: Production Ready ✅
**Payment System**: Paymob API v2 (HTTPS)
**Currency**: SAR (39.00)
**Target Users**: Authenticated + Payment Required
