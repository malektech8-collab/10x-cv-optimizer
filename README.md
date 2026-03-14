<div align="center">
  <img width="800" alt="10-x CV Optimizer Logo" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>10-x CV Optimizer</h1>
  <p>An advanced, AI-powered Resume Analyzer & ATS Optimizer supporting Dual-Language outputs (English & Arabic).</p>
</div>

---

## Overview

**10-x CV Optimizer** is a full-stack SaaS web application that acts as an intelligent career coach and resume writer. Leveraging Claude AI, it provides users with instantaneous, score-based feedback on their resumes, identifies ATS structural gaps, and completely rewrites the CV for maximum parsing success in systems like Taleo, Workday, and Greenhouse.

Users can optimize their resume in English or professional Modern Standard Arabic, choose from three professionally designed templates, and download the result as a PDF or DOCX file.

---

## Key Features

1. **Pre-Optimization ATS Analysis**
   Scans uploaded PDFs and images, generating a JSON-based diagnostic report grading grammar, formatting, and keyword gaps — with a 0–100 score and actionable recommendations.

2. **Full Claude AI Rewrites**
   Complete structural overhaul via Claude AI. Outputs structured `ResumeJsonData` which is rendered into clean, print-ready HTML.

3. **3 Resume Templates**
   - **Classic** — clean single-column layout
   - **Modern** — contemporary two-tone design
   - **Executive** — dark header band with gold section dividers
   All templates are fully RTL-aware for Arabic and produce self-contained HTML with embedded CSS.

4. **Multi-Language & Bi-Directional Rendering**
   The full UI and all AI-generated content dynamically switch between LTR English (`en`) and RTL Arabic (`ar`).

5. **DOCX & PDF Export**
   Download the optimized resume as a `.docx` Word document or print to PDF directly from the browser (with proper RTL rendering for Arabic).

6. **Paymob Payments (KSA)**
   Full Paymob Unified Checkout integration. Payment intentions are created server-side via a Cloud Function; an HMAC-verified webhook marks orders as paid in Firestore. Currency displayed as ر.س (SAR).

7. **Firebase Auth & Firestore**
   Google Sign-In, per-user optimization history, and persistent order tracking.

8. **Admin Panel (RBAC)**
   Secure CMS dashboard with role-based access. Supports rich-text blog authoring via `react-simple-wysiwyg`, user management, order tracking with expandable order details and invoice viewing.

9. **Blog & SEO**
   Built-in blog with dynamic SEO-friendly slugs, dynamically fetched from Firestore.

10. **Billing & Invoices**
    Users can view order history, download optimized CVs (PDF/DOCX), and view/print invoices from the Dashboard. Admins can view all orders and invoices from the Admin Panel.

11. **AI Career Consultant Chatbot**
    Built-in chatbot powered by Claude AI for career advice and resume guidance.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Firebase Cloud Functions v2 (Node.js) |
| AI | Claude AI (Anthropic) via `@anthropic-ai/sdk` |
| Database | Cloud Firestore |
| Auth | Firebase Authentication (Google Sign-In) |
| Payments | Paymob Unified Checkout (KSA region) |
| Hosting | Firebase Hosting |
| Routing | React Router DOM v7 |
| Export | `html-docx-js-typescript`, `file-saver` |
| Icons | Lucide React |

---

## Project Structure

```
├── pages/
│   ├── Home.tsx              # Main app flow (upload → analyze → optimize → pay)
│   ├── Dashboard.tsx         # User dashboard (order history, downloads, invoices)
│   ├── AdminPanel.tsx        # Admin dashboard (RBAC-protected)
│   ├── Blog.tsx              # Blog listing page
│   ├── BlogPost.tsx          # Individual blog post (dynamic slug)
│   ├── PaymentResult.tsx     # Post-payment redirect handler
│   ├── PrivacyPolicy.tsx
│   └── RefundPolicy.tsx
├── components/
│   ├── AnalysisView.tsx      # Resume score + feedback display
│   ├── AuthModal.tsx         # Authentication modal
│   ├── ChatBot.tsx           # AI career consultant chatbot
│   ├── ContactModal.tsx      # Support / contact form modal
│   ├── FileUpload.tsx        # Drag-and-drop / file picker
│   ├── HistoryView.tsx       # User's past optimizations
│   ├── InvoiceModal.tsx      # Invoice viewer + print-to-PDF
│   ├── Layout.tsx            # App shell / navigation
│   ├── PaymentModal.tsx      # Payment orchestration UI
│   └── ResumePreview.tsx     # Resume display + download / copy / print
├── templates/
│   ├── index.ts              # Template router — renderResumeHTML()
│   ├── classic.ts            # Classic template renderer
│   ├── modern.ts             # Modern template renderer
│   └── executive.ts          # Executive template renderer
├── services/
│   ├── aiService.ts          # Client-side wrappers for AI Cloud Functions
│   └── paymobService.ts      # Client-side wrappers for Paymob Cloud Functions
├── constants/
│   └── translations.ts       # i18n strings (EN + AR)
├── functions/
│   └── src/
│       ├── index.ts          # Cloud Functions entry point (Paymob + webhook)
│       ├── claudeService.ts  # Claude AI integration (analyze + optimize)
│       └── extractText.ts    # PDF/image text extraction
├── docs/                     # Paymob API reference documentation
├── types.ts                  # Shared TypeScript interfaces and enums
└── App.tsx                   # React Router setup
```

---

## Data Flow

```
User uploads PDF / image
        │
        ▼
analyzeResume (Cloud Function)
  └─ Claude AI reads file → returns AnalysisReport JSON
        │
        ▼
User reviews score → clicks "Optimize"
        │
        ▼
optimizeResume (Cloud Function)
  └─ Claude AI rewrites → returns ResumeJsonData JSON
  └─ Saved to Firestore: optimizations/{id}
        │
        ▼
ResumePreview renders HTML via templates/renderResumeHTML()
        │
        ▼
User selects template → clicks "Pay"
        │
        ▼
createPaymobIntention (Cloud Function)
  └─ Creates Paymob intention, passes optimizationId
  └─ Redirects to Paymob Unified Checkout
        │
        ▼
paymobWebhook (Cloud Function)
  └─ Verifies HMAC → marks Firestore doc as paid
        │
        ▼
PaymentResult page fetches HTML from Firestore → shows final resume
```

---

## Cloud Functions

| Function | Trigger | Description |
|---|---|---|
| `analyzeResume` | HTTPS Callable | Sends resume file to Claude AI; returns `AnalysisReport` |
| `optimizeResume` | HTTPS Callable | Full AI rewrite; returns `ResumeJsonData`; saves to Firestore |
| `createPaymobIntention` | HTTPS Callable | Creates Paymob payment intention; links to existing Firestore doc |
| `paymobWebhook` | HTTPS Request | Verifies HMAC signature; marks optimization as paid |

---

## Environment Variables

### Frontend (`.env` — never commit)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=x-cv-optimizer.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=x-cv-optimizer
VITE_FIREBASE_STORAGE_BUCKET=x-cv-optimizer.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Cloud Functions — Firebase Secret Manager

```
PAYMOB_SECRET_KEY
PAYMOB_HMAC_SECRET
PAYMOB_INTEGRATION_IDS    # JSON string: {"card":123456,"wallet":789012}
ANTHROPIC_API_KEY          # Claude AI API key
```

### Cloud Functions — `firebase.json` environmentVariables

```
FUNCTIONS_BASE_URL        # https://us-central1-x-cv-optimizer.cloudfunctions.net
HOSTING_BASE_URL          # https://x-cv-optimizer.web.app
```

---

## Running Locally

1. **Install frontend dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Create `.env`** with the variables listed above.

3. **Install and build Cloud Functions:**
   ```bash
   cd functions
   npm install
   npm run build
   cd ..
   ```

4. **Start the dev server:**
   ```bash
   npm run dev
   ```

---

## Production Deployment

> On Windows, use `cmd.exe` — PowerShell blocks Firebase CLI `.ps1` scripts.

```cmd
cd /d d:\Projects\10-xCV-main\10-xCV-main
npm run build
firebase deploy
```

Deploy only specific targets:
```cmd
firebase deploy --only hosting
firebase deploy --only functions
```

---

## Key Types

```ts
// types.ts
ResumeJsonData       // Structured resume (contact, workExperience, education, skills, …)
AnalysisReport       // score + grammarIssues + structureGaps + atsCompatibility + impactOptimizations
TemplateType         // 'classic' | 'modern' | 'executive'
AppStatus            // IDLE | UPLOADING | ANALYZING | ANALYSIS_COMPLETED | PROCESSING | COMPLETED | ERROR
```

---

## Adding a New Template

1. Create `templates/my-template.ts` exporting `renderMyTemplate(data: ResumeJsonData, lang: 'en' | 'ar'): string`
2. Add `'my-template'` to the `TemplateType` union in `types.ts`
3. Import it in `templates/index.ts` and register it in both `TEMPLATE_NAMES` and the `renderResumeHTML` switch

---

## License

Private — all rights reserved.
