# Final Deployment Steps - Paymob Payment Integration

**Status**: Cloud Functions Deployed ✅
**Next Step**: Configure Paymob API Credentials
**Your Domain**: 10-x.online
**Firebase Project**: x-cv-optimizer
**Default URL**: https://x-cv-optimizer.web.app

---

## Step 1: Deploy Your Paymob Credentials ⚙️

### Option A: Manual Deployment (Recommended - Keep Your Credentials Private)

Open PowerShell and run these commands in your project directory:

```powershell
cd C:\Users\hr\.claude-worktrees\10-xCV-main\dazzling-raman

firebase functions:config:set paymob.api_key="YOUR_API_KEY_HERE"
firebase functions:config:set paymob.merchant_id="YOUR_MERCHANT_ID_HERE"
firebase functions:config:set paymob.secret_key="YOUR_SECRET_KEY_HERE"

firebase deploy --only functions
```

**Where to get credentials**:
1. Go to https://accept.paymobsolutions.com
2. Login to your Paymob account
3. Navigate to: **Settings → API Keys**
4. Copy:
   - **API Key** (long base64 string starting with `eyJ`)
   - **Merchant ID** (usually a number)
   - **Secret Key** (another long string)

### Option B: I Deploy For You

Reply with:
```
API Key: [paste_here]
Merchant ID: [paste_here]
Secret Key: [paste_here]
```

I'll deploy them immediately and delete them from chat.

---

## Step 2: Verify Configuration ✓

After deploying credentials, verify they were saved:

```powershell
firebase functions:config:get
```

Expected output:
```json
{
  "paymob": {
    "api_key": "***",
    "merchant_id": "***",
    "secret_key": "***"
  }
}
```

The values are masked with `***` for security (normal behavior).

---

## Step 3: Test Payment Flow Locally 🧪

### Start Development Server

```powershell
npm run dev
```

Open http://localhost:3000 in your browser.

### Test Payment Flow

1. **Upload a resume** (PDF or image)
2. **Click "Analyze"**
   - Wait for analysis to complete
3. **Click "Optimize"**
   - Wait for optimization to complete
   - You'll see "Resume Analysis Complete" modal
4. **Click "UNLOCK MY RESUME NOW"** button
   - Payment modal will open
5. **Enter test card details**:
   - Name: `Test User`
   - Card Number: `4111111111111111`
   - Expiry: `12/25`
   - CVV: `123`
6. **Click "Pay 39 SAR via Paymob"**
   - Should show processing spinner
7. **Expected Result**:
   - ✅ "Payment Successful!" message appears
   - Modal auto-closes after 2 seconds
   - Export buttons become enabled:
     - Copy Text ✅
     - Copy HTML ✅
     - Download PDF ✅
     - Download DOCX ✅

### Verify in Firestore

1. Open Firebase Console: https://console.firebase.google.com
2. Go to: **Firestore Database → optimizations collection**
3. Find the document created during test
4. Verify it contains:
   ```json
   {
     "is_paid": true,
     "payment_transaction_id": "paymob_...",
     "payment_amount": 39,
     "payment_currency": "SAR",
     "payment_date": "2025-03-..."
   }
```

---

## Step 4: Check Cloud Function Logs 📊

Monitor your functions for any errors:

```powershell
firebase functions:log --limit=50
```

Look for:
- ✅ `initiatePayment` being called
- ✅ Successful Paymob API responses
- ❌ Any errors (will show here)

---

## Step 5: Deploy to Production 🚀

Once testing is successful locally, deploy to your live domain:

```powershell
firebase deploy
```

This deploys:
- Frontend code (React app)
- Cloud Functions
- Hosting configuration

---

## Step 6: Test on Live Domain 🌍

After production deployment:

1. Go to: https://10-x.online (or https://x-cv-optimizer.web.app)
2. Repeat the payment test flow
3. Verify Firestore updates
4. Check Firebase logs for any errors

---

## Troubleshooting Guide

### Issue: "Payment service not configured"

**Cause**: Paymob credentials not set

**Solution**:
```powershell
firebase functions:config:get
# Should show paymob values, if empty, run:
firebase functions:config:set paymob.api_key="YOUR_KEY"
firebase deploy --only functions
```

---

### Issue: "Card declined" in test

**Cause**: Using wrong test card number

**Solution**: Use exactly: `4111111111111111` (14 ones)

---

### Issue: Export buttons stay locked after payment

**Cause**: Payment didn't actually process

**Check**:
1. Check Cloud Function logs: `firebase functions:log`
2. Verify Firestore: is `is_paid` field set to `true`?
3. Check payment processing error in modal

---

### Issue: "Cannot find module @google/genai"

**Cause**: Dependencies not installed

**Solution**:
```powershell
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

### Issue: Functions deployment fails

**Cause**: TypeScript compilation error

**Solution**:
```powershell
cd functions
npm run build
# Fix any errors shown
cd ..
firebase deploy --only functions
```

---

## Quick Reference

### Test Card Numbers
```
Visa:       4111111111111111  |  12/25  |  123
Mastercard: 5555555555554444  |  12/25  |  123
AmEx:       378282246310005   |  12/25  |  123
```

### Key URLs
- Paymob Dashboard: https://accept.paymobsolutions.com
- Firebase Console: https://console.firebase.google.com/project/x-cv-optimizer
- Local Dev: http://localhost:3000
- Live App: https://10-x.online
- Firebase URL: https://x-cv-optimizer.web.app

### Key Commands
```powershell
# Start dev server
npm run dev

# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# View logs
firebase functions:log

# Check config
firebase functions:config:get

# Set credentials
firebase functions:config:set paymob.api_key="KEY"
```

---

## Checklist Before Going Live

- [ ] Paymob API credentials obtained
- [ ] Credentials deployed to Firebase
- [ ] Local test successful (test card processed)
- [ ] Firestore shows `is_paid: true` for test payment
- [ ] Export buttons enabled after payment
- [ ] Cloud Function logs show no errors
- [ ] Deployed to production (`firebase deploy`)
- [ ] Live domain test successful
- [ ] Payment appears in Paymob dashboard
- [ ] Admin panel shows correct payment status

---

## Next Steps

1. **Get Paymob credentials** (if you don't have them)
   - Go to https://accept.paymobsolutions.com
   - Settings → API Keys
   - Copy the 3 values

2. **Deploy credentials** (choose Option A or B above)
   - Run firebase commands OR
   - Provide to me for secure deployment

3. **Test locally**
   - Run `npm run dev`
   - Follow test payment flow above

4. **Deploy to production**
   - Run `firebase deploy`

5. **Test on live domain**
   - Go to https://10-x.online
   - Repeat payment test

6. **Monitor**
   - Check logs and Firestore regularly
   - Monitor for payment errors

---

## Support

For issues:
1. Check Cloud Function logs: `firebase functions:log`
2. Verify credentials are set: `firebase functions:config:get`
3. Check Firestore for payment records
4. Review Paymob dashboard for transaction status

---

**You're almost there!** Just need to:
1. Get Paymob credentials
2. Deploy them
3. Test locally
4. Deploy to production
5. Done! 🎉

---

*Last Updated: March 4, 2025*
*Status: Ready for Final Steps*
