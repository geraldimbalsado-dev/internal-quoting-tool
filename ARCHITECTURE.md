# QuoteTool — Architecture Summary

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components reduce client complexity; server actions simplify mutations |
| Language | TypeScript | Type safety across full stack |
| Styling | Tailwind CSS | Fast, consistent, no CSS files to maintain |
| Database + Auth + Storage | Supabase | All-in-one BaaS; Postgres + RLS + S3-compatible storage + auth |
| Image processing | Sharp | Reliable server-side compositing for logo mockups |
| PDF | @react-pdf/renderer | No headless browser needed; simpler deployment |
| Email | Resend | Simple API, good free tier |
| Validation | Zod | Schema validation shared between client and server |

## Project Structure

```
src/
  app/
    (auth)/login/          # Login page (public)
    (app)/                 # Protected app shell
      layout.tsx           # Auth check + sidebar
      dashboard/           # Stats overview
      clients/             # Client CRUD
      quotes/              # Quote CRUD + items + mockups
    review/[token]/        # Public client review (no auth)
    api/
      mockup/              # Mockup generation endpoint
      pdf/                 # PDF generation endpoint
  components/
    ui/                    # Primitive UI components (Button, Input, etc.)
    layout/                # Sidebar, nav
  lib/
    supabase/
      client.ts            # Browser Supabase client
      server.ts            # Server Supabase client
      middleware.ts        # Session refresh for middleware
    actions/               # Server actions (mutations)
    utils.ts               # Shared helpers
  types/
    index.ts               # All shared TypeScript types
  middleware.ts            # Auth redirect middleware
supabase/
  migrations/
    001_initial_schema.sql # Full DB schema + RLS
    002_seed_products.sql  # Product catalog seed
scripts/
  seed-demo-users.ts       # Demo user creation script
```

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Extends auth.users; stores role (admin/sales) |
| `products` | Seeded product catalog (read-only at runtime) |
| `clients` | Client companies; owned by sales user |
| `quotes` | Quote header; versioned; has public_token |
| `quote_items` | Line items with mockup_settings JSONB |
| `activity_logs` | Business event log |

## Access Control

- **Middleware**: redirects unauthenticated users to `/login`
- **RLS (Row Level Security)**: enforced at DB level
  - Sales users: see only own `clients`, `quotes`, `quote_items`
  - Admins: see everything via `get_user_role() = 'admin'` check
  - Public: `/review/[token]` bypasses auth; accesses via service role on token lookup
- **Server-side checks**: all mutations verify ownership before acting

## Quote Versioning

- `version` integer on `quotes` table (1, 2, 3...)
- `parent_quote_id` links back to original
- New version = clone of latest version with incremented version number
- Each version has its own `public_token`

## Logo / Mockup Pipeline

1. User uploads logo (PNG/JPG/SVG) → stored in Supabase storage `logos/`
2. Server processes with Sharp:
   - Remove background (if PNG/simple)
   - Convert to grayscale → apply silver tone curve
3. Composite onto product template image at stored x/y/scale
4. Save result to `mockups/` storage
5. Store `mockup_url` on `quote_item`

## Tradeoffs Made

- **No real-time updates**: polling or refresh is sufficient for 2-5 users
- **No background jobs**: all processing is synchronous (acceptable for MVP load)
- **No product admin UI**: products are seeded; editing via SQL or migration
- **No multi-tenancy**: single organization, roles only
- **PDF generated server-side**: no print-to-PDF browser tricks
- **Background removal is best-effort**: clear fallback if logo has complex background

## Deferred Beyond MVP

- Stripe / invoicing integration
- Rich text quote notes (Markdown/WYSIWYG)
- Quote expiry notifications (cron)
- Bulk PDF export
- Client portal with history
- Advanced analytics
