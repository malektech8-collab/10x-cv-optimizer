# Paymob Integration - Quick Start (5 Minutes)

## TL;DR - What Changed

✅ Payment system is **now fully implemented** and **ready to use**
✅ Users must now **pay 39 SAR** to unlock export features
✅ Need to **deploy Paymob API credentials** to make it work

---

## Step 1: Get Paymob API Credentials (5 mins)

1. Go to: https://accept.paymobsolutions.com
2. Create account → Verify → Complete KYC
3. Go to **Settings → API Keys**
4. Copy:
   - `PAYMOB_API_KEY` (long string)
   - `PAYMOB_MERCHANT_ID` (number)
   - `PAYMOB_SECRET_KEY` (string)

---

## Step 2: Deploy to Firebase (2 mins)

```bash
cd C:\Users\hr\.claude-worktrees\10-xCV-main\dazzling-raman

firebase functions:config:set \
  paymob.api_key="PASTE_YOUR_API_KEY_HERE" \
  paymob.merchant_id="PASTE_YOUR_MERCHANT_ID_HERE" \
  paymob.secret_key="PASTE_YOUR_SECRET_KEY_HERE"

firebase deploy --only functions
```

---

## Step 3: Test It (3 mins)

### Local Testing
```bash
npm run dev
```
1. Upload resume
2. Click "Unlock My Resume Now"
3. Enter test card: `4111111111111111` | `12/25` | `123`
4. Should see ✅ "Payment Successful!"
5. Export buttons now enabled

### Production Testing
```bash
firebase deploy
```
Then test on live app with same test card.

---

## What's Changed in Code

| File | What | Status |
|------|------|--------|
| `Home.tsx` | Removed "free" testing bypass | ✅ Done |
| `PaymentModal.tsx` | Real Paymob API integration | ✅ Done |
| `functions/index.ts` | Payment handler + validation | ✅ Done |
| `ResumePreview.tsx` | Payment tracking | ✅ Done |

---

## Files You Need to Read

1. **PAYMOB_QUICK_START.md** (this file) - 5 minute overview
2. **PAYMOB_IMPLEMENTATION_SUMMARY.md** - Detailed changes
3. **PAYMOB_INTEGRATION_GUIDE.md** - Complete setup guide

---

## Testing Cards

```
Visa:       4111111111111111  Exp: 12/25  CVV: 123
Mastercard: 5555555555554544  Exp: 12/25  CVV: 123
```

Any future expiry date works.

---

## Troubleshooting

**"Payment service not configured"**
→ Missing API credentials, run Step 2 again

**"Card declined"**
→ Using wrong test card, use 4111111111111111

**Export buttons still locked**
→ Payment didn't process, check Cloud Function logs

**Can't find API keys in Paymob**
→ Account not verified yet, complete KYC first

---

## Verification

After deployment, run:

```bash
firebase functions:list
```

Should see:
- `initiatePayment` ✅
- `verifyPaymentStatus` ✅
- `optimizeResume` ✅
- `analyzeResume` ✅
- `chatWithConsultant` ✅

---

## One-Liner Checklist

- [ ] Paymob account created
- [ ] API credentials copied
- [ ] Firebase env vars set
- [ ] Firebase deployed
- [ ] Local test passed
- [ ] Live test passed
- [ ] Firestore verified (is_paid: true for paid users)

---

## Emergency Rollback

If something breaks:

```bash
# Allow all users to export without payment
git checkout HEAD -- pages/Home.tsx functions/src/index.ts
firebase deploy
```

---

## Next Steps

1. ✅ Get Paymob API credentials
2. ✅ Deploy to Firebase
3. ✅ Test with test cards
4. ✅ Monitor Cloud Function logs
5. Optional: Set up webhooks (see PAYMOB_INTEGRATION_GUIDE.md)

---

## Questions?

See:
- **PAYMOB_IMPLEMENTATION_SUMMARY.md** - Technical details
- **PAYMOB_INTEGRATION_GUIDE.md** - Complete guide + troubleshooting
- Paymob Docs: https://docs.paymob.com

---

**Implementation**: ✅ COMPLETE
**Deployment**: ⏳ AWAITING YOUR ACTION
**Status**: Ready to activate

---

*Last updated: March 4, 2025*
