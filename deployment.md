# Travelora deployment and setup guide

## 1. Verified stack and prerequisites

Travelora uses:

- Node.js compatible with the installed Next.js 16.4.4 dependency.
- npm.
- PostgreSQL (Neon is the documented hosting target).
- Prisma 6.16.1.
- Next.js 16.4.4 App Router, React 19.3.0, TypeScript and Tailwind CSS v4.
- Auth.js Credentials provider.
- Vitest 3.2.7 for deterministic tests.
- Playwright Test for browser-level tests (Chromium must be installed locally).

Git is required to clone the repository. Gemini and Upstash are optional for a
local application boot, but production AI and distributed rate limiting require
their respective credentials.

## 2. Windows local setup

Open PowerShell and run:

```powershell
git clone https://github.com/rakeshkumar280205/travelora-travel-platform.git
Set-Location .\travelora-travel-platform
npm install
Copy-Item .env.example .env
npx playwright install chromium
```

Edit `.env` locally. Never commit it, paste secrets into chat, or include it in
the submission archive.

Start the development server:

```powershell
npm run dev
```

Open `http://localhost:3000`. Public packages are at `/packages`; staff sign in
at `/admin/signin`.

## 3. Environment variables

The following names are defined in `.env.example`:

```text
DATABASE_URL
DIRECT_URL
AUTH_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
GEMINI_API_KEY
GEMINI_MODEL
NEXT_PUBLIC_APP_URL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RATE_LIMIT_PUBLIC_ENQUIRY_MAX
RATE_LIMIT_PUBLIC_ENQUIRY_WINDOW
RATE_LIMIT_AI_MAX
RATE_LIMIT_AI_WINDOW
```

Required application values:

- `DATABASE_URL`: PostgreSQL connection URL. In production with Neon, configure
  this with the **pooled connection string** (containing `-pooler` and
  `?sslmode=require`). Prisma Client uses this connection at runtime for queries
  across serverless lambdas.
- `DIRECT_URL`: PostgreSQL direct connection URL. In production with Neon,
  configure this with the **direct unpooled connection string** (without `-pooler`).
  Prisma CLI uses this connection for migrations (`npx prisma migrate deploy`),
  which require advisory locks not supported by PgBouncer transaction pooling.
- `AUTH_SECRET`: random value of at least 32 characters.
- `NEXTAUTH_SECRET`: the Auth.js secret; configure it consistently with
  `AUTH_SECRET`.
- `NEXTAUTH_URL`: application base URL.

Development seed values:

- `SEED_ADMIN_EMAIL`: local administrator email.
- `SEED_ADMIN_PASSWORD`: local seed password; use at least 12 characters.

AI values:

- `GEMINI_API_KEY`: server-only Google Gemini key. It is never sent to client
  code.
- `GEMINI_MODEL`: optional server-side override. The safe default is
  `gemini-3.5-flash-lite`.

SEO value:

- `NEXT_PUBLIC_APP_URL`: optional verified production site URL. When set, it is
  used for absolute canonical metadata, `sitemap.xml`, and `robots.txt`. Do not
  invent or use a placeholder production domain.

Distributed rate-limit values:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST
  credentials.
- `RATE_LIMIT_PUBLIC_ENQUIRY_MAX` and
  `RATE_LIMIT_PUBLIC_ENQUIRY_WINDOW`: public enquiry bucket; defaults are `5`
  requests per `1 h`.
- `RATE_LIMIT_AI_MAX` and `RATE_LIMIT_AI_WINDOW`: authenticated AI bucket;
  defaults are `10` requests per `1 m`.

Rate limiting is enabled via distributed Upstash Redis buckets. In production
(`NODE_ENV=production`), Upstash credentials (`UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`) are mandatory. If either or both are missing in
production, protected endpoints fail closed with HTTP 503 (`RATE_LIMIT_UNAVAILABLE`)
to guarantee that production cannot silently run unprotected. In local development
and test environments (`NODE_ENV=development` or `test`), omitting both permits
requests so local workflows do not require external credentials.

## 4. Database and migrations

Configure both `DATABASE_URL` (pooled connection for runtime queries) and
`DIRECT_URL` (direct unpooled connection for migrations), then run:

```powershell
npx prisma generate
npx prisma migrate deploy
npx prisma migrate status
```

The repository currently contains Prisma migrations for core schema, package
versioning, enquiry workflow and activity tracking, blog publishing, and quote
generation. For local schema development only:

```powershell
npm run db:migrate
```

Do not run reset commands against shared or production databases.

## 5. Development seed and demo login

Set `NODE_ENV=development` or `NODE_ENV=test`, configure
`SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, then run:

```powershell
npm run db:seed
```

The seed creates or updates one `ADMIN` user, one published Kerala package and
one draft Tamil Nadu package. No fixed credentials are published or implied.
Sign in at `/admin/signin` with the values you supplied locally. `EDITOR` and
`CONSULTANT` users are represented by the database role enum and should be
created through a controlled workflow.

## 6. Validation and production build

The current deterministic suite uses mocked repositories and mocked Gemini
responses; it makes no Gemini calls and does not require a test database.

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
npx prisma validate
npx prisma migrate status
```

Run the production server locally with:

```powershell
npm run start
```

The verified test suite produces 138 passing tests across 24 test
files. The test files cover AI service classifications, strict AI schemas,
admin AI routes, enquiry validation and routes, dynamic enquiry filtering,
package services and validation, rate limiting, quote calculations, vector
PDF generation, blog validation, API responses, SEO metadata routes, and legacy
redirect proxy behavior.

## 7. Browser-level end-to-end tests

The separate Playwright suite is run with:

```powershell
npm run test:e2e
```

Only the sign-in page and unauthenticated protection checks are safe without a
test database. Database-backed public and staff journeys are skipped unless
`E2E_DATABASE_URL` is set. This must point to a disposable database distinct
from `DATABASE_URL`; the Playwright configuration refuses an exact match.
Prepare it with `npx prisma migrate deploy` and
`NODE_ENV=test npm run db:seed` using test-only seed credentials.

Optional isolated-fixture variables are:

```text
E2E_DATABASE_URL
E2E_ADMIN_EMAIL
E2E_ADMIN_PASSWORD
E2E_EDITOR_EMAIL
E2E_EDITOR_PASSWORD
E2E_CONSULTANT_EMAIL
E2E_CONSULTANT_PASSWORD
E2E_UNASSIGNED_ENQUIRY_ID
E2E_ALLOW_MUTATIONS
```

The seed creates the ADMIN fixture and package fixtures. EDITOR, CONSULTANT
and assigned/unassigned enquiry fixtures must be provisioned manually in the
disposable test database; never use production or personal customer data.
Set `E2E_ALLOW_MUTATIONS=true` only for the acknowledgement test against that
disposable database. The suite never calls Gemini and never sends email or
WhatsApp messages.

## 8. PostgreSQL integration tests

Integration tests are strictly separated from Vitest unit tests (`vitest.config.ts`
excludes `tests/integration/**` and `tests/e2e/**`) and require an explicitly
configured disposable PostgreSQL database:

```text
TEST_DATABASE_URL
```

To run integration tests safely:

1. Create an isolated, disposable local or hosted PostgreSQL database (never use
   or connect to development or production databases).
2. Apply the migrations to the disposable test database explicitly:

```powershell
# Set DATABASE_URL to the disposable test database temporarily to apply migrations
$env:DATABASE_URL = "postgresql://<test-user>:<test-password>@<test-host>:5432/travelora_test?schema=public"
npx prisma migrate deploy

# Configure TEST_DATABASE_URL and clear or restore DATABASE_URL
$env:TEST_DATABASE_URL = $env:DATABASE_URL
Remove-Item Env:\DATABASE_URL   # or restore development DATABASE_URL (must not equal TEST_DATABASE_URL)
```

3. Execute the integration test suite:

```powershell
npm run test:integration
```

### Safety and isolation enforcement

- **Mandatory test URL**: The test runner (`scripts/run-integration-tests.mjs`)
  and the test suite (`requireTestDatabase()`) refuse to start without an explicit
  `TEST_DATABASE_URL`.
- **No fallback**: The suite never falls back to `DATABASE_URL`.
- **Target separation**: The runner and suite reject execution if
  `TEST_DATABASE_URL` matches `DATABASE_URL` (by exact string or by hostname and
  database path).
- **Production guard**: The runner rejects URLs targeting names containing
  `prod`, `production`, `live`, or `primary`.
- **No destructive schema operations**: The suite does not automatically create,
  migrate, seed, truncate, or drop any database or tables.
- **Strict record cleanup**: Tests clean up only the records created during the
  specific test run, identified by run-unique fixture IDs (`runId`), cleaning
  enquiries, packages (with circular FK dissociation), and test users.
- **Offline / no external services**: The integration suite makes zero Gemini API
  calls and sends zero email or WhatsApp messages.
- **Unexecuted by default**: If isolation cannot be positively established, the
  runner exits safely with an informational message and code 1, leaving the suite
  unexecuted.

### Test coverage

- **Package persistence and visibility**: Verifies package creation, seasonal
  price persistence with numeric precision, itinerary days, draft package
  exclusion from `listPublishedPackages()`, and visibility in `listAllPackages()`.
- **Immutable version snapshots**: Verifies publishing via `publishPackage`,
  version numbering increments, snapshot rollback via `rollbackPackage`, and
  package version record tracking.
- **Enquiry and activity tracking**: Verifies enquiry creation, consultant
  assignment, note creation (`addEnquiryNote`), reply draft saving
  (`saveEnquiryReply`), and audit activity logging (`CREATED`, `STATUS_CHANGED`,
  `NOTE_ADDED`, `REPLY_DRAFT_SAVED`).
- **Role and assignment access**: Verifies service-layer access controls
  (`enquiry-admin-service`):
  - Unassigned consultants cannot add notes, replies, or update enquiries (`FORBIDDEN`).
  - Assigned consultants cannot reassign enquiries to other consultants (`FORBIDDEN`).
  - Invalid enquiry status transitions are rejected (`INVALID_STATUS_TRANSITION`).
  - Assigned consultants can add notes and save draft replies.
  - Administrators can reassign consultants and record `ASSIGNED` activities.
  - Consultant enquiry lists (`getEnquiryList`) properly filter records by assignment.

## 9. Gemini configuration and limitation

### Exact environment variable requirements

- `GEMINI_API_KEY`: Server-only Google Gemini API key (string). Required for AI consultant workflows:
  - `POST /api/admin/enquiries/[id]/extract` (structured requirement extraction)
  - `POST /api/admin/enquiries/[id]/recommendations` (package recommendations)
  - `POST /api/admin/enquiries/[id]/ai-reply` (reply draft generation)
  The key is never exposed to browser/client bundles, client responses, or server logs. If unconfigured, AI endpoints return safe HTTP 503 (`AI_UNAVAILABLE`).
- `GEMINI_MODEL`: Optional server-only model name override. Default is `gemini-3.5-flash-lite`. Can be configured to any compatible model (e.g., `gemini-2.5-flash`).

### Architecture and safeguards

- **Zero AI Price Generation**: AI never calculates, infers, or invents prices. Package recommendations retrieve package titles, descriptions, and seasonal pricing strictly from the PostgreSQL database (`SeasonalPrice` records with `amount > 0`).
- **Unsent Drafts Only**: Reply drafts generated by AI are stored in the database with `isDraft: true` and returned with `unsent: true`. No email or WhatsApp message is ever dispatched automatically; explicit consultant review and approval are mandatory.
- **Enquiry Assignment Enforcement**: AI endpoints strictly enforce staff authorization. Unauthenticated requests receive HTTP 401; EDITOR role receives HTTP 403; CONSULTANT role is restricted to enquiries assigned to them (unassigned enquiries return HTTP 403).
- **Safe Server Logging**: Provider generateContent errors redact API keys, tokens, and authorization headers (`key=[REDACTED]`, `Bearer [REDACTED]`). Zod validation issues log structured field paths and error messages while strictly excluding customer personal data and message contents.
- **Markdown Fence Stripping**: Raw responses from `@google/genai` are sanitized to strip markdown code fences (` ```json ... ``` `) before JSON parsing.

### Resolution of AI_SCHEMA_INVALID

The previously observed `AI_SCHEMA_INVALID` limitation has been addressed in code without weakening validation:
- Provider enum casing is normalized to lowercase (e.g. `"HIGH"` / `"Medium"` → `"high"` / `"medium"`).
- Currency codes are uppercase-normalized (e.g. `"inr"` → `"INR"`).
- Empty string representations (`""`) on nullable fields (`destination`, `travelStartDate`, `travelMonth`, `currency`, `hotelPreference`) normalize to `null`.
- Integer and numeric strings (e.g. `"2"`, `"120000"`) safely coerce to numbers.
- Nullable arrays (`missingFields`, `uncertainFields`, `specialRequirements`, `uncertaintyNotes`) default to `[]`.
- Strict validation gates remain active: ambiguous formats like undated month names (`"December"`), range strings (`"5-6 nights"`), non-ISO currency symbols (`"₹"`), and omitted required keys continue to be rejected with `AI_SCHEMA_INVALID`.

### Live verification status

- Unit tests (`tests/gemini-service.test.ts`, `tests/ai-schemas.test.ts`, `tests/ai-routes.test.ts`, `tests/extract-route.test.ts`) verify success, malformed JSON, schema rejection, provider request failure, key redaction, and timeout handling.
- Deterministic test coverage requires no live Gemini credits.
- **Verified live**: A controlled single live generation request using `gemini-3.5-flash-lite` was executed against synthetic enquiry requirements on 5 November 2026. Structured extraction succeeded and passed strict production Zod validation (`validationPassed: true`), correctly preserving uncertainty for undated month (`travelMonth: null`, added to `uncertainFields`) and duration ranges (`durationDays: null`, added to `uncertainFields`), without modifying any customer or database records.

## 10. SEO and legacy redirects

When `NEXT_PUBLIC_APP_URL` is configured:

- `src/app/sitemap.ts` includes the homepage, `/packages`, and published
  package detail URLs only.
- `src/app/robots.ts` allows public pages, disallows `/admin` and `/api`, and
  references the sitemap.
- Root and package metadata use absolute canonical URLs.
- Missing or unpublished package pages remain `noindex, nofollow`.

Next.js 16 uses `src/proxy.ts` for legacy redirects. The mapping in
`src/config/legacy-redirects.ts` is intentionally empty because the client's
verified inventory of 140 old URLs was not supplied. No mappings were
invented. Once supplied, mappings use HTTP 308, preserve source query strings
when the target has no query string, and avoid same-path loops.

## 11. Blog CMS and migration (Phase 8, Step 1)

The blog publishing workflow adds two models to the Prisma schema:
- `BlogPost`: Stores dispatches, slugs, markdown content (`@db.Text`), categories, tags, SEO metadata, featured image with alt text, author attribution, and related package links.
- `BlogPostVersion`: Immutable version history snapshots storing serializable JSON snapshots for publishing audits and instantaneous rollbacks.

### Safe migration execution
The migration is located at `prisma/migrations/20261105183000_blog_cms/migration.sql`.

To apply the migration safely against a verified non-production or staging database:

```powershell
# Set DATABASE_URL to your staging or target deployment database
$env:DATABASE_URL = "postgresql://<user>:<password>@<host>:5432/<dbname>?schema=public"

# Deploy the pending migration non-destructively
npx prisma migrate deploy
```

### Migration safety characteristics
- **Non-destructive**: Does not drop, alter, or recreate existing `Package`, `Enquiry`, `EnquiryActivity`, `EnquiryNote`, or `User` columns.
- **Cascading & Referential integrity**:
  - `BlogPost.authorId` references `User(id)` with `ON DELETE SET NULL`.
  - `BlogPost.relatedPackageId` references `Package(id)` with `ON DELETE SET NULL`.
  - `BlogPostVersion.postId` references `BlogPost(id)` with `ON DELETE CASCADE`.
- **Performance indexes**:
  - `BlogPost(status, publishedAt)` for indexed public listing queries.
  - `BlogPost(category, status)` for category filtering.
  - `BlogPost(slug)` for unique index lookups.
  - `BlogPostVersion(postId, versionNumber)` unique compound index for version tracking.

### Blog CMS security model
- **Stored XSS defense**: Rich content is validated against unsafe HTML tags (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<button>`, `<svg>`, `<style>`), inline event handlers (`on*=`), and dangerous URI schemes (`javascript:`, `vbscript:`, `data:`). All rich content is rendered into safe React AST nodes with zero `dangerouslySetInnerHTML`.
- **Role-based authorization**:
  - `ADMIN` and `EDITOR` roles can create, edit, publish, and rollback articles.
  - `CONSULTANT` role has read-only access to staff article listings and preview, but mutations return `403 FORBIDDEN`.
- **Public isolation**: Draft articles are completely hidden from public endpoints (`/blog` and `/blog/[slug]`), returning HTTP 404 for unauthenticated or non-published requests.

## 12. Quote Builder and migration (Phase 8, Step 2)

The quote generation workflow adds the `Quote` model and `QuoteStatus` enum to the Prisma schema:
- `Quote`: Stores formal quotes linked to enquiries, published packages, seasonal prices, customer contact details, travel dates, traveller counts, financial calculations, immutable package/version snapshots, and public sharing tokens.
- `QuoteStatus`: Enum representing the lifecycle states: `DRAFT`, `GENERATED`, `SENT`, `ACCEPTED`, `REJECTED`, `EXPIRED`.

### Safe migration execution
The migration is located at `prisma/migrations/20261105191500_quote_builder/migration.sql`.

To apply the migration safely against a verified non-production or staging database:

```powershell
# Set DATABASE_URL to your staging or target deployment database
$env:DATABASE_URL = "postgresql://<user>:<password>@<host>:5432/<dbname>?schema=public"

# Deploy the pending migration non-destructively
npx prisma migrate deploy
```

### Migration safety characteristics
- **Non-destructive**: Does not drop, alter, or modify any existing tables or columns.
- **Cascading & Referential integrity**:
  - `Quote.packageId` references `Package(id)` with `ON DELETE RESTRICT` to guarantee historical quotations cannot be invalidated by package deletion.
  - `Quote.enquiryId` references `Enquiry(id)` with `ON DELETE SET NULL`.
  - `Quote.seasonalPriceId` references `SeasonalPrice(id)` with `ON DELETE SET NULL`.
  - `Quote.createdById` references `User(id)` with `ON DELETE SET NULL`.
- **Performance indexes**:
  - `Quote(quoteNumber)` unique index for fast reference lookups (`TRV-QT-YYYY-XXXX`).
  - `Quote(publicToken)` unique index for unguessable public preview routing.
  - `Quote(status, createdAt)` compound index for staff listing and status filtering.
  - `Quote(enquiryId)` and `Quote(packageId)` foreign key lookup indexes.

### Price integrity and calculation principles
- **Zero AI calculation**: AI never calculates, infers, or discounts quote prices.
- **Database seasonal rates**: Rates are sourced strictly from database `SeasonalPrice` records matching the package and selected travel date window (`season.startDate <= travelDate <= season.endDate`).
- **Strict date validation**: If travel dates do not match a published season, or if ambiguous overlapping seasons exist, quote generation is blocked with explicit `PricingIntegrityError` codes (`UNMATCHED_SEASONAL_DATE` or `AMBIGUOUS_SEASONAL_RATES`, HTTP 422).
- **Child pricing policy**: Children remain unpriced unless an explicit policy is supplied. The system does not assume an adult rate or invent child discounts.
- **GST policy**: All quotes state clearly that GST is subject to confirmation upon final booking.
- **Immutable snapshot**: When a quote is created, an immutable JSON snapshot of the package itinerary, seasonal price record, inclusions, exclusions, and booking disclaimers is persisted.

### Secure PDF document generation
- Built with a pure Node.js vector PDF 1.4 binary engine (`generateQuotePdfBuffer`) using Helvetica vector fonts, Travelora branding, and table rendering.
- Requires no external paid services, headless browser instances, or native binaries.
- Automatically generates downloadable quotes for consultants and clients.

### Quote sharing and authorization
- **Cryptographic tokens**: Shared client previews use 24-byte unguessable base64url tokens. Internal database IDs and enquiry staff notes are never exposed.
- **Link revocation**: Consultants and administrators can instantly revoke public access links.
- **Consultant assignment enforcement**: `ADMIN` has full access; `CONSULTANT` access is strictly limited to assigned enquiries or quotes created by them; `EDITOR` has read-only access.
- **Controlled communication**: Quotes require explicit staff action; no emails or WhatsApp messages are dispatched automatically.

## 13. Vercel deployment

### Verified live production deployment
- **Production URL**: https://travelora-travel-platform.vercel.app
- **Platform**: Vercel Serverless (Node.js App Router)
- **Database**: Neon Serverless PostgreSQL with PgBouncer connection pooling
- **Status**: Verified active and returning HTTP 200 with the complete product experience, public package discovery, destination showcase, blog journal, and admin access.

To deploy deliberately:

1. Import the GitHub repository into Vercel.
2. Use the detected Next.js build settings.
3. Configure all required environment names in the Vercel project settings.
4. Add the target Neon `DATABASE_URL` (pooled connection) and `DIRECT_URL`
   (direct unpooled connection).
5. Run `npx prisma migrate deploy` (which uses `DIRECT_URL` to apply migrations
   with advisory locks) as a controlled deployment step.
6. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the verified deployment URL.
7. Configure both Upstash credentials for production rate limiting.
8. Set Gemini credentials only if the AI limitation is understood and the key
   is stored server-side.
9. Run smoke checks and role/authorization checks after deployment.

Do not run the development seed against production unless that is an explicit,
isolated operation with controlled credentials.

## 14. Security and known limitations

- Staff access uses Auth.js sessions and ADMIN, EDITOR and CONSULTANT roles.
- EDITOR is denied protected enquiry operations; CONSULTANT access is limited
  to assigned enquiries.
- Public package reads expose published content only.
- Zod validates API inputs and strict AI extraction output.
- Rate limiting uses distributed Upstash buckets when configured.
- Secrets and Gemini credentials remain server-only.
- Public and admin API errors are sanitized.
- Browser-level end-to-end tests are implemented using Playwright (runnable against a disposable database).
- Email and WhatsApp delivery are intentionally not automated (staff manual dispatch required).
- Gemini extraction was verified live on 5 November 2026 using `gemini-3.5-flash-lite`, passing strict Zod validation.
- Actual legacy URL mappings and a production domain remain client/deployment
  inputs, not repository assumptions.
