# HuaHed Document Hub

ศูนย์รวมเอกสารบริษัท HuaHed — ค้นหา เปิด ทำงานได้ทันที

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS (Mobile-first)
- **Auth:** Google OAuth (restricted to @huahed.com and @procandid.com)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (PDF/images) + Google Drive (Docs/Sheets/Slides)
- **Deploy:** Netlify

## Getting Started

```bash
npm install
cp .env.example .env   # Fill in Supabase credentials
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

## Database Setup

Run `supabase/schema.sql` in your Supabase SQL editor to create tables, indexes, RLS policies, and seed data.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
