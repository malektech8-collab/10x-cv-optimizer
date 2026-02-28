<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1hLwh66U97NgTQXUIwG9zsvYW6IMnPEAZ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure `.env` file based on the template, adding your `GEMINI_API_KEY` and `VITE_FIREBASE_*` variables.
3. Run the app locally:
   `npm run dev`

## Deployment

This app is configured to be deployed to **Cloudflare Pages** at the domain `10-x.online`.
You can deploy using Wrangler:
`npm run build`
`npx wrangler pages deploy dist --project-name 10-x-cv-optimizer`
