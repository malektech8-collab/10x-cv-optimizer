# Quick Start - Payment Testing

## Ready to Go! ✅

All Cloud Functions are deployed and Paymob credentials are configured.

---

## Test Locally (2 minutes)

### Step 1: Start Dev Server
```powershell
cd C:\Users\hr\.claude-worktrees\10-xCV-main\dazzling-raman
npm run dev
```

### Step 2: Open Browser
Go to: `http://localhost:5173`

### Step 3: Upload Resume
1. Click upload area
2. Select any PDF or image

### Step 4: Test Payment Flow
1. Click "Analyze" button
2. Wait for analysis (1-2 minutes with Gemini AI)
3. Click "Optimize" button
4. Wait for optimization (1-2 minutes)
5. Click "UNLOCK MY RESUME NOW" button
6. Enter payment details:
   ```
   Name: Test User
   Card: 4111111111111111
   Expiry: 12/25
   CVV: 123
   ```
7. Click "Pay 39 SAR via Paymob"
8. See "Payment Successful!" ✅

### Step 5: Verify Payment
- Export buttons should be enabled
- Click any export button (Copy Text, PDF, DOCX, etc.)

---

## Deploy to Production (1 minute)

```powershell
cd C:\Users\hr\.claude-worktrees\10-xCV-main\dazzling-raman
firebase deploy
```

Then test at: `https://10-x.online`

---

## Test Card Details

**Always use this test card** (works in both dev and production):

| Field | Value |
|-------|-------|
| Card Number | 4111111111111111 |
| Expiry | 12/25 |
| CVV | 123 |
| Name | Any name (e.g., "Test User") |

---

## What to Expect

### Before Payment
- Upload resume ✓
- Analyze resume ✓
- Optimize resume ✓
- See "UNLOCK MY RESUME NOW" button ✓
- **Export buttons LOCKED** 🔒

### During Payment
- Payment modal opens ✓
- Card processing (1-2 seconds) ⏳
- Shows "Processing..." message

### After Payment Success
- Modal shows "Payment Successful!" ✅
- Modal closes (2 second auto-close)
- **Export buttons NOW ENABLED** 🔓
- Export to: PDF, DOCX, Text, HTML

---

## Checking Payment in Firebase

1. Go to: https://console.firebase.google.com/project/x-cv-optimizer
2. Click "Firestore Database"
3. Click "optimizations" collection
4. Look for latest document
5. Should see:
   ```
   is_paid: true
   payment_transaction_id: paymob_[transaction_id]
   payment_amount: 39
   payment_currency: SAR
   payment_date: [timestamp]
   ```

---

## If Something Goes Wrong

### Payment Shows "Payment service not properly configured"
```powershell
firebase functions:config:get
```
If empty, credentials weren't saved. Run:
```powershell
firebase functions:config:set paymob.api_key="YOUR_KEY"
firebase functions:config:set paymob.merchant_id="9205"
firebase functions:config:set paymob.secret_key="YOUR_SECRET"
firebase deploy --only functions
```

### Card Gets Declined
- Check you typed card exactly: `4111111111111111`
- Check expiry is `12/25`
- Check CVV is `123`
- Try again

### Export Buttons Stay Locked
- Check Firebase logs: `firebase functions:log`
- Look for errors
- Try refreshing page
- Try payment again

---

## All Systems Go! 🚀

Your payment system is:
- ✅ Deployed
- ✅ Configured
- ✅ Ready to test
- ✅ Ready for production

**Next**: Run `npm run dev` and test the payment flow!

---

*Last Updated: March 4, 2025*
