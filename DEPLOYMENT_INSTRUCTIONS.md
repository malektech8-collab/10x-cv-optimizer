# Firebase Paymob Deployment - Step-by-Step

## Quick Reference

```bash
# Copy and paste these commands one at a time in PowerShell/Terminal

# 1. Navigate to project directory
cd C:\Users\hr\.claude-worktrees\10-xCV-main\dazzling-raman

# 2. Set API Key
firebase functions:config:set paymob.api_key="YOUR_API_KEY_HERE"

# 3. Set Merchant ID
firebase functions:config:set paymob.merchant_id="YOUR_MERCHANT_ID_HERE"

# 4. Set Secret Key
firebase functions:config:set paymob.secret_key="YOUR_SECRET_KEY_HERE"

# 5. Verify configuration
firebase functions:config:get

# 6. Deploy to Firebase
firebase deploy --only functions

# 7. Verify functions deployed
firebase functions:list
```

---

## Where to Get Paymob Credentials

1. **Go to**: https://accept.paymobsolutions.com
2. **Log in** with your Paymob account
3. **Navigate to**: Settings → API Keys (or Integration Settings)
4. **Copy**:
   - API Key (long base64 string starting with `eyJ`)
   - Merchant ID (usually a number)
   - Secret Key (another long string)

---

## Detailed Steps

### Step 1: Get Credentials from Paymob

Navigate to https://accept.paymobsolutions.com and:
- Click on your profile/settings
- Find "API Keys" or "Integration Settings"
- You'll see:
  ```
  API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Merchant ID: 12345
  Secret Key: your_secret_key_string
  ```

Copy these three values.

---

### Step 2: Open Terminal/PowerShell

On Windows:
1. Press `Win + R`
2. Type `powershell`
3. Press Enter

---

### Step 3: Navigate to Project Directory

```bash
cd C:\Users\hr\.claude-worktrees\10-xCV-main\dazzling-raman
```

---

### Step 4: Set Firebase Environment Variables

**First command** - Set API Key:
```bash
firebase functions:config:set paymob.api_key="PASTE_YOUR_API_KEY_HERE"
```

Replace `PASTE_YOUR_API_KEY_HERE` with your actual API Key from Paymob.

Press Enter and wait for success message.

---

**Second command** - Set Merchant ID:
```bash
firebase functions:config:set paymob.merchant_id="PASTE_YOUR_MERCHANT_ID_HERE"
```

Replace `PASTE_YOUR_MERCHANT_ID_HERE` with your Merchant ID.

Press Enter and wait for success message.

---

**Third command** - Set Secret Key:
```bash
firebase functions:config:set paymob.secret_key="PASTE_YOUR_SECRET_KEY_HERE"
```

Replace `PASTE_YOUR_SECRET_KEY_HERE` with your Secret Key.

Press Enter and wait for success message.

---

### Step 5: Verify Configuration

To confirm all three values were saved:
```bash
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

The values are masked with `***` for security - that's normal!

---

### Step 6: Deploy to Firebase

Now deploy the Cloud Functions with your new configuration:

```bash
firebase deploy --only functions
```

This will:
- Upload your functions code
- Apply the environment variables
- Deploy `initiatePayment()`, `verifyPaymentStatus()`, etc.

Wait for it to complete. You should see `✔ Deploy complete!`

---

### Step 7: Verify Functions Are Live

Check that all functions deployed:
```bash
firebase functions:list
```

You should see:
- initiatePayment ✅
- verifyPaymentStatus ✅
- optimizeResume ✅
- analyzeResume ✅
- chatWithConsultant ✅

---

## Testing After Deployment

Once deployed:

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Test the payment flow**:
   - Open http://localhost:3000
   - Upload a resume
   - Click "Analyze"
   - Click "Optimize"
   - Click "Unlock My Resume Now"
   - Enter test card: `4111111111111111` | `12/25` | `123`
   - Should see "Payment Successful!" ✅

3. **Check Cloud Function logs**:
   ```bash
   firebase functions:log --limit=50
   ```

4. **Verify Firestore**:
   - Firebase Console → Firestore
   - Check `optimizations` collection
   - Look for `is_paid: true` and `payment_transaction_id`

---

## Troubleshooting

**Error: "firebase: command not found"**
- Firebase CLI not installed
- Run: `npm install -g firebase-tools`

**Error: "Permission denied"**
- Not logged into Firebase
- Run: `firebase login`

**Error: "Project not found"**
- Wrong directory
- Verify you're in: `C:\Users\hr\.claude-worktrees\10-xCV-main\dazzling-raman`

**Functions still show as "not configured"**
- Deployment failed
- Check logs: `firebase deploy --only functions` (with verbose)
- Make sure env vars are set: `firebase functions:config:get`

**Payment still fails**
- Check you copied API Key correctly (no spaces)
- Verify Merchant ID is just numbers
- Check Secret Key copied fully
- Look at Cloud Function logs: `firebase functions:log`

---

## Summary

This process:
1. ✅ Gets your Paymob API credentials
2. ✅ Stores them securely in Firebase
3. ✅ Deploys your payment functions
4. ✅ Enables live payment processing

Total time: **5-10 minutes**

After this, your app will:
- Accept real credit card payments
- Process through Paymob
- Update Firestore with payment status
- Enable export features for paid users

---

**Questions?** Check the main documentation files:
- `PAYMOB_QUICK_START.md`
- `PAYMOB_INTEGRATION_GUIDE.md`
