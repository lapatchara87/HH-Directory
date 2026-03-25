# HuaHed Document Hub

ศูนย์รวมเอกสารบริษัท HuaHed — ค้นหา เปิด ทำงานได้ทันที

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS (Mobile-first)
- **Auth:** Firebase Authentication + Google OAuth (restricted to @huahed.com and @procandid.com)
- **Database:** Cloud Firestore
- **Storage:** Firebase Storage (PDF/images) + Google Drive (Docs/Sheets/Slides)
- **Deploy:** Netlify

## Getting Started

```bash
npm install
cp .env.example .env   # Fill in Firebase credentials
npm run dev
```

## Features

- Google OAuth login (domain-locked)
- 11 document categories with card-based directory
- Full-text search with filters (category, file type, sort)
- One-click open: Google Docs/Sheets/Slides in new tab, PDF/image preview in modal
- Upload documents (file upload or Google Drive link)
- Onboarding checklist for new employees
- Admin panel (manage documents, onboarding steps, dashboard)
- Fully responsive mobile-first UI
- Demo mode: works without Firebase config for testing

## Firebase Setup

See `SETUP.md` for step-by-step instructions (in Thai).

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
