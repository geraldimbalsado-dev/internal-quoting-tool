# QuoteTool — Internal Sales Quoting Tool

A simple internal quoting tool for small sales teams. Create clients, build quotes with products, generate logo mockups, send to clients for review, export to PDF.

## Quick Start

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account (for emails)

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase and Resend credentials.

### 3. Database Setup

In your Supabase project SQL editor, run these in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_seed_products.sql`

Then in Supabase Storage, create these buckets:
- `logos` (private)
- `mockups` (private)
- `product-images` (public)

### 4. Create Demo Users

After running migrations, create users in Supabase Auth dashboard:

- **Admin**: `admin@demo.com` / `demo1234` — set metadata `{ "role": "admin", "full_name": "Admin User" }`
- **Sales**: `sales@demo.com` / `demo1234` — set metadata `{ "role": "sales", "full_name": "Sarah Sales" }`

### 5. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full technical details.

## Implementation Phases

| Phase | Feature | Status |
|---|---|---|
| 0 | Architecture + Setup | ✅ Done |
| 1 | Auth + Roles | ✅ Done |
| 2 | Client Management | ⏳ |
| 3 | Quotes Foundation | ⏳ |
| 4 | Quote Items + Products | ⏳ |
| 5 | Logo Upload + Mockups | ⏳ |
| 6 | Quote Versioning | ⏳ |
| 7 | Public Review Page | ⏳ |
| 8 | Email Sending | ⏳ |
| 9 | PDF Export | ⏳ |
| 10 | Activity Log | ⏳ |
| 11 | Polish + QA | ⏳ |
