# QuoteTool — Architecture Summary

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server components reduce client complexity; server actions simplify mutations |
| Language | TypeScript | Type safety across full stack |
| Styling | Tailwind CSS | Fast, consistent, no CSS files to maintain |
| Database + Auth + Storage | Supabase | All-in-one BaaS; Postgres + RLS + S3-compatible storage + auth |
| Image processing | Sharp | Reliable server-side compositing for logo mockups |
| PDF | @react-pdf/renderer | No headless browser needed; simpler deployment |
| Email | Resend | Simple API, good free tier |
| Validation | Zod | Schema validation in server actions |

## Project Structure

```
src/
  app/
    (auth)/
      login/               # Login page (public)
      signup/              # Sign up page (public)
    (app)/                 # Protected app shell
      layout.tsx           # Auth check + sidebar
      loading.tsx          # Skeleton loader
      error.tsx            # Error boundary
      dashboard/           # Stats overview
      clients/             # Client CRUD
      quotes/              # Quote CRUD + items + mockups
      products/            # Product catalog (admin only)
    review/[token]/        # Public client review (no auth)
    api/
      upload-logo/         # Logo upload to Supabase storage
      mockup/              # Mockup generation (Sharp)
      pdf/[id]/            # PDF generation (react-pdf)
  components/
    ui/                    # Primitive UI components (Button, Input, etc.)
    layout/                # Sidebar, nav
    quotes/                # Quote-specific components
    clients/               # Client-specific components
    pdf/                   # PDF document component
  lib/
    supabase/
      client.ts            # Browser Supabase client
      server.ts            # Server + service role Supabase clients
      middleware.ts        # Session refresh for proxy
    actions/               # Server actions (mutations)
    email.ts               # Resend email templates + send functions
    mockup.ts              # Sharp mockup generation (server-only)
    mockup-constants.ts    # Shared mockup constants (browser-safe)
    auth.ts                # requireAuth / requireAdmin helpers
    utils.ts               # Shared helpers
  types/
    index.ts               # All shared TypeScript types + calc helpers
  proxy.ts                 # Auth redirect proxy (Next.js 16 convention)
supabase/
  migrations/
    001_initial_schema.sql # Full DB schema + RLS
    002_seed_products.sql  # Product catalog seed (17 items)
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
| `activity_logs` | Business event log (capped at 100 per quote in UI) |

## Access Control

- **Proxy** (`proxy.ts`): redirects unauthenticated users to `/login`; public paths: `/login`, `/signup`, `/review`, `/403`
- **RLS (Row Level Security)**: enforced at DB level
  - Sales users: see only own `clients`, `quotes`, `quote_items`
  - Admins: see everything via `get_user_role() = 'admin'` check
  - Public: `/review/[token]` bypasses auth; accesses via service role on token lookup
- **Server-side checks**: all mutations verify ownership before acting
- **Status guards**: approved/rejected quotes block edits, deletes, and status changes at the server action level (not just UI)

## Quote Versioning

- `version` integer on `quotes` table (1, 2, 3...)
- `parent_quote_id` always points to the v1 root (never chains)
- New version = clone of current quote + items with incremented version number
- Each version has its own `public_token`
- Quote number format: `Q-01000`, `Q-01000-v2`, `Q-01000-v3`
- Concurrent version creation handled: unique constraint on `quote_number` returns a clear error

## Logo / Mockup Pipeline

1. User uploads logo (PNG/JPG/SVG, max 10MB) → stored in Supabase storage `logos/`
2. Server processes with Sharp (`/api/mockup`):
   - Convert to grayscale → apply silver tone curve → remove white pixels
   - Composite onto SVG-generated product template at stored x/y/scale
3. Result saved to `mockups/` storage bucket
4. `mockup_url` + `mockup_settings` stored on `quote_item`
5. Mockup images fetched as base64 (8s timeout per image) for PDF embedding

## Key Architectural Decisions

- **`proxy.ts` not `middleware.ts`**: Next.js 16 renamed the file convention and export
- **Service role client**: used only for public review page and review action — bypasses RLS since no authenticated user exists; security boundary is the 48-char hex `public_token`
- **Sharp server-only**: Sharp imports Node.js `fs`; constants extracted to `mockup-constants.ts` (browser-safe) to avoid bundling Sharp into client components
- **`calcLineTotal` / `calcQuoteTotal` in `@/types`**: co-located with types to avoid circular imports; used in both server and client contexts

## Tradeoffs Made

- **No real-time updates**: polling or refresh is sufficient for 2-5 users
- **No background jobs**: all processing is synchronous (acceptable for MVP load)
- **No rate limiting**: internal tool with known users; acceptable risk
- **No multi-tenancy**: single organization, roles only
- **PDF generated server-side on demand**: no caching; regenerated fresh each request
- **Background removal is best-effort**: grayscale + silver treatment works best on logos with transparent or white backgrounds

## Deferred Beyond MVP

- Stripe / invoicing integration
- Rich text quote notes (Markdown/WYSIWYG)
- Quote expiry notifications (cron)
- Bulk PDF export
- Client portal with history
- Advanced analytics
- Rate limiting on API routes
