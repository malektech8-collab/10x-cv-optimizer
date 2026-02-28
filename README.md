<div align="center">
  <img width="800" alt="10-x CV Optimizer Logo" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>10-x CV Optimizer</h1>
  <p>An advanced, AI-powered Resume Analyzer & ATS Optimizer supporting Dual-Language outputs (English & Arabic).</p>
</div>

---

## 🚀 Overview

**10-x CV Optimizer** is a full-stack progressive web application that acts as an intelligent career coach and resume writer. Leveraging the Google Gemini AI Platform, it provides users with instantaneous, score-based feedback on their resumes, identifying fatal ATS structural gaps. With a simple CTA, it completely rewrites the CV for maximum parsing success in major Application Tracking Systems like Taleo, Workday, and Greenhouse.

Featuring robust internationalization natively built out, clients can effortlessly optimize their resume to either English or professional Modern Standard Arabic.

## ⭐ Key Features

1. **Pre-Optimization ATS Analysis**  
   Dynamically scans uploaded PDFs & Image resumes, generating a custom JSON-based diagnostic report grading grammar, formatting, and keyword gaps to actively build trust with the client.

2. **Full Gemini AI Rewrites**  
   Completely structural overhaul. Outputs an HTML-parseable, action-verb-oriented resume optimized specifically for an 0.5-inch margin print format.

3. **Multi-Language & Bi-Directional Render System**  
   The application UI and the Gemini Prompt generation dynamically scale and shift between LTR English (`en`) and RTL Arabic (`ar`).

4. **Integrated Blog & Content Management**  
   Built-in read-only blog dynamically fetching records. Paired with a secure Admin dashboard CMS leveraging `react-simple-wysiwyg` for multi-language rich text authoring.

5. **Serverless Identity & Database**  
   Integrated with `Firebase Auth` (including Google Sign-In) and `Cloud Firestore` for persistent order tracking and historical analysis lookups.

---

## 🛠️ Technology Stack

- **Framework:** React 19 + TypeScript + Vite
- **Routing:** React Router DOM (v7)
- **Styling:** Tailwind CSS + Lucide React Icons
- **Generative AI:** Google Gen AI SDK (`gemini-2.5-flash`)
- **Backend & Database:** Google Firebase + Firestore
- **Deployment & DNS:** Firebase Hosting & Cloudflare Domains

---

## 💻 Running the Application Locally

1. **Install dependencies:**
   Ensure you have Node.js installed, then execute:
   ```bash
   npm install --legacy-peer-deps
   ```
   *(We utilize legacy peer deps to ensure perfect compatibility across our React 19 router bounds).*

2. **Configure Environment Variables:**
   Rename the `.env.example` (or your existing environment file) to `.env` and configure exactly the following parameters:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=x-cv-optimizer.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=x-cv-optimizer
   VITE_FIREBASE_STORAGE_BUCKET=x-cv-optimizer.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_API_KEY=your_google_gemini_api_key
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The site will securely execute locally on the designated un-utilized port (typically `http://localhost:3000`).

---

## 🚢 Production Deployment

The platform is configured for instantaneous deployment to **Firebase Hosting** and dynamically maps to your custom Cloudflare Apex configurations.

1. **Build the production SPA assets:**
   ```bash
   npm run build
   ```

2. **Deploy directly to your backend:**
   ```bash
   npx firebase deploy --only hosting
   ```

*A complete `firebase.json` intercepts Single Page Routing automatically without dropping 404 cache limits.*
