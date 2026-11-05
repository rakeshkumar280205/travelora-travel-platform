<div align="center">

# 🌿 TRAVELORA
### *Journeys beyond ordinary.*

<p align="center">
  <strong>An enterprise-grade, bespoke travel atelier platform combining editorial journey discovery, immutable package & blog publishing, consultant workflow automation, deterministic quote building, and human-in-the-loop Gemini AI.</strong>
</p>

[![Next.js](https://img.shields.io/badge/Next.js-16.4.4-1b4332?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-2d3748?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.1-2d3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-121_Tests_Passing-6e9f18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Upstash](https://img.shields.io/badge/Upstash-Redis_Rate_Limiting-00e9a3?style=for-the-badge&logo=upstash&logoColor=black)](https://upstash.com/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-3.5_Flash_Lite-gold?style=for-the-badge&logo=google&logoColor=black)](https://ai.google.dev/)

<br />

[Explore Features](#-key-features) • [Architecture](#-system-architecture) • [Workflows](#-product-workflows) • [AI Safety](#-responsible-ai--safety) • [Getting Started](#-getting-started) • [Deployment](#-production-deployment)

---

</div>

## 📖 Executive Overview

Modern luxury tour operators and bespoke travel ateliers struggle with fragmented tools: brochure websites disconnected from back-office quotation systems, unstructured enquiries scattered across email and WhatsApp, error-prone manual calculations, and the risk of unverified AI hallucinations.

**Travelora** solves these challenges with an integrated, production-ready platform designed around **architectural safety, price integrity, and editorial elegance**:

- **Bespoke Discovery**: Editorial travel package discovery, multi-day itinerary schedules, and rich destination dispatches.
- **Data & Price Integrity**: Package and quote pricing are strictly database-backed via seasonal tiers; AI is fundamentally prohibited from computing, inferring, or discounting rates.
- **Responsible Human-in-the-Loop AI**: Google Gemini extracts structured traveler requirements and drafts personalized responses, but all drafts remain unsent until reviewed and approved by an authorized consultant.
- **Deterministic Quotation Engine**: Generates immutable quotation snapshots with custom vector PDF 1.4 generation and unguessable cryptographic client share links.
- **Enterprise Governance**: Role-based access control (`ADMIN`, `EDITOR`, `CONSULTANT`), consultant assignment isolation, immutable CMS version history with instant rollback, and fail-closed distributed rate limiting.

---

## 🌟 Key Features

### 1. Public Travel Discovery & Packages
- **Editorial Package Catalog** (`/packages`): Responsive grid featuring destination badges, duration tags, hotel categories, and verified seasonal pricing tiers.
- **Deep Itinerary Presentation** (`/packages/[slug]`): Complete day-by-day itineraries, inclusion/exclusion breakdowns, seasonal price cards, and interactive enquiry modals.
- **Accessible & Resilient UI**: Strict WCAG compliance, accessible form labels, mobile-first responsive design (tested at 375px, 768px, and 1440px), and fallback error states.

### 2. Seasonal Package Pricing & CMS
- **Database-Backed Seasonal Tiers**: Distinct pricing windows (e.g., *Peak*, *Monsoon*, *All-Year*) with explicit pricing bases (`Per person; indicative package price; GST treatment to be confirmed`).
- **Immutable Package Versioning**: Every publish action writes a complete JSON snapshot to `PackageVersion`.
- **Instant Rollback**: Administrators and editors can inspect historical versions and revert package state instantly without orphan records.

### 3. Enquiry Management & Consultant Operations
- **Centralized Staff Inbox** (`/admin/enquiries`): Filter by status (`NEW`, `IN_PROGRESS`, `WAITING_FOR_CUSTOMER`, `RESPONDED`, `CONVERTED`, `CLOSED`) and assigned consultant.
- **Consultant Assignment & Tenant Isolation**: Consultants can only access and reply to enquiries specifically assigned to them; administrators maintain global reassignment oversight.
- **Audit Activity Trail**: Automatic chronological logging of creation, assignment, status transitions, staff notes, and draft saves.

### 4. Human-in-the-Loop Gemini AI
- **Structured Requirement Extraction**: Leverages `gemini-3.5-flash-lite` with rigid Zod validation to extract destinations, traveler counts, travel months, and budgets.
- **Uncertainty & Ambiguity Preservation**: Incomplete inputs (e.g., *"around December"*, *"5-6 nights"*) are marked as uncertain rather than hallucinating exact dates.
- **Database-Sourced Recommendations**: Matches parsed requirements exclusively against active database packages with verified seasonal prices.
- **Unsent Draft Replies**: Generates context-aware, personalized correspondence drafts flagged as `isDraft: true` and `unsent: true`. **Zero automated messages are dispatched.**

### 5. Blog CMS & Publishing Atelier
- **Rich Publishing Workflow** (`/admin/blog`): Article drafting, category assignments, multi-tag indexing, SEO title/description configuration, and related package associations.
- **XSS-Safe Markdown Content**: Custom AST renderer sanitizes dangerous tags, inline event handlers, and malicious URI schemes without using `dangerouslySetInnerHTML`.
- **Version Tracking & Public Isolation**: Draft posts remain strictly hidden (HTTP 404) on public routes until published; full historical versioning mirrors the package CMS.

### 6. Quote Builder & Vector PDF Generation
- **Strict Price Integrity**: Derives quotations strictly from seasonal price records matching the travel window. Rejects ambiguous or unconfigured dates with HTTP 422 `PricingIntegrityError`.
- **Transparent Calculations**: Adult subtotals calculated deterministically (`Adults × Seasonal Rate`). Children remain explicitly unpriced with clear disclosures regarding hotel occupancy and permits.
- **Vector PDF 1.4 Engine**: Built using pure Node.js binary PDF composition with Helvetica typography, Travelora branding, and itemized tables. Requires no headless browsers or external SaaS.
- **Secure Shareable Links**: Generates unguessable 24-byte cryptographic tokens (`/quotes/[token]`) with one-click revocation.

### 7. Security, SEO & Infrastructure
- **Authentication**: Auth.js with secure JWT session tokens and bcrypt password hashing (12 rounds).
- **Distributed Rate Limiting**: Upstash Redis sliding-window algorithm protecting public enquiry submissions (`5 req / hr`) and staff AI endpoints (`10 req / min`). Fails closed (HTTP 503) in production if unconfigured.
- **Automated SEO**: Dynamic `sitemap.xml`, `robots.txt`, and OpenGraph metadata derived from `NEXT_PUBLIC_APP_URL`.
- **Production Headers**: Strict CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and restrictive permissions policies.

---

## 🔄 Product Workflows

### Traveller Discovery & Enquiry Journey
```mermaid
sequenceDiagram
    autonumber
    actor Traveller
    participant Web as Public Web (/packages)
    participant API as Enquiry API (/api/enquiries)
    participant Redis as Upstash Rate Limiter
    participant DB as Neon PostgreSQL

    Traveller->>Web: Browse packages & view day-by-day itinerary
    Traveller->>Web: Submit enquiry form (Dates, Adults, Children, Budget)
    Web->>API: POST /api/enquiries (JSON payload)
    API->>Redis: Check client IP sliding-window rate limit
    alt Rate Limit Exceeded
        Redis-->>Web: HTTP 429 Too Many Requests (Retry-After header)
    else Rate Limit Allowed
        API->>DB: Validate input & create Enquiry record (Status: NEW)
        DB-->>API: Persist record & log CREATED activity
        API-->>Web: HTTP 201 Created (Branded acknowledgement)
        Web-->>Traveller: Confirmation display with enquiry reference
    end
```

### Consultant Review, AI Assistance & Quote Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    actor Consultant as Assigned Consultant
    participant Inbox as Admin Enquiry Workspace
    participant AI as Gemini Service (gemini-3.5-flash-lite)
    participant Quote as Quote Service & PDF Engine
    participant DB as Neon PostgreSQL

    Admin->>Inbox: Review incoming enquiry & assign to Consultant
    Inbox->>DB: Update assignedConsultantId & log ASSIGNED activity
    Consultant->>Inbox: Open assigned enquiry detail view
    Consultant->>Inbox: Trigger "Extract Requirements with AI"
    Inbox->>AI: Send sanitized enquiry text
    AI-->>Inbox: Validated structured schema (Zod parsed)
    Consultant->>Inbox: Trigger "Generate AI Reply Draft"
    Inbox->>AI: Compose draft with DB package context
    AI-->>Inbox: Return editable reply draft (unsent: true)
    Consultant->>Inbox: Review, modify, and save draft to database
    Consultant->>Quote: Click "Build Formal Quotation"
    Quote->>DB: Match exact SeasonalPrice record for travel dates
    Quote->>Quote: Deterministic calculation (Adults × Rate)
    Quote->>Quote: Render vector PDF 1.4 binary buffer
    Quote->>DB: Save Quote snapshot & generate cryptographic token
    Quote-->>Consultant: Ready for PDF download or secure link sharing
```

---

## 🛠️ Technology Stack

| Domain | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) | `16.4.4` | App Router, Server Components, Route Handlers, Turbopack |
| **Runtime & UI** | [React](https://react.dev/) | `19.3.0` | React Server Components, Server Actions, modern hooks |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `5.x` | Strict type-checking with zero compilation warnings |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `v4` | High-performance atomic styling with Travelora palette |
| **Database** | [Neon](https://neon.tech/) | PostgreSQL 16/18 | Serverless PostgreSQL with connection pooling & branch isolation |
| **ORM** | [Prisma](https://www.prisma.io/) | `6.16.1` | Type-safe schema definition, Prisma Client, and DDL migrations |
| **Authentication** | [Auth.js](https://authjs.dev/) | `^4.24.15` | Credentials provider, JWT session strategy, bcryptjs hashing |
| **AI Integration** | [Google GenAI](https://ai.google.dev/) | `^2.32.0` | Official `@google/genai` SDK targeting `gemini-3.5-flash-lite` |
| **Rate Limiting** | [Upstash](https://upstash.com/) | `^2.2.0` | `@upstash/ratelimit` & `@upstash/redis` sliding-window limiter |
| **Validation** | [Zod](https://zod.dev/) | `^4.6.7` | Runtime type inference, strict AI schemas, API boundary checks |
| **Unit Testing** | [Vitest](https://vitest.dev/) | `^3.2.7` | Fast deterministic test harness (22 test suites, 121 tests) |
| **E2E Testing** | [Playwright](https://playwright.dev/) | `^1.64.1` | Cross-browser integration testing suite (Chromium) |

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client_Layer["Client & Device Layer"]
        A["Traveller Web / Mobile Browser"]
        B["Staff Atelier / Admin Workstation"]
    end

    subgraph Edge_Routing["Vercel Edge & Middleware"]
        C["Next.js App Router (Middleware / Proxy)"]
        D["Security Headers & Legacy URL Rewrites"]
    end

    subgraph Application_Core["Next.js Server Core"]
        E["Server Components (Static / Partial Prerender)"]
        F["Route Handlers (RESTful API /api/*)"]
        G["Auth.js Session & RBAC Enforcement"]
        H["Custom Vector PDF 1.4 Binary Generator"]
    end

    subgraph External_Services["Cloud Services & Security Perimeter"]
        I["Upstash Redis (Distributed Sliding Window)"]
        J["Google Gemini API (gemini-3.5-flash-lite)"]
    end

    subgraph Database_Layer["Database Layer (Neon PostgreSQL)"]
        K["Prisma Client (Runtime Pooled via PgBouncer)"]
        L["Prisma Migrate (Direct Connection with Advisory Locks)"]
        M[("Neon PostgreSQL 16/18")]
    end

    A -->|HTTPS / TLS| C
    B -->|HTTPS / TLS| C
    C --> D
    D --> E
    D --> F
    F --> G
    F --> H
    F -->|REST HTTP| I
    F -->|Structured JSON / Prompts| J
    E --> K
    F --> K
    K -->|DATABASE_URL:5432| M
    L -->|DIRECT_URL:5432| M
```

---

## 🛡️ Responsible AI & Safety Guarantees

Travelora enforces strict ethical and architectural boundaries around its artificial intelligence integrations:

1. **Zero Price Hallucination**: AI is **never** permitted to calculate, infer, estimate, or discount prices. All package rates are loaded directly from `SeasonalPrice` database records.
2. **Deterministic Schema Enforcement**: Raw output from Gemini is validated through strict Zod schemas (`src/lib/validation/ai-schemas.ts`). Unexpected enums, extra text, or unparseable JSON are flagged as `AI_SCHEMA_INVALID` and handled gracefully.
3. **Uncertainty Over Invention**: When travellers provide ambiguous dates (e.g., *"two weeks in winter"*), Gemini adds the fields to `uncertainFields` and sets the value to `null` rather than inventing an arrival date.
4. **Mandatory Human-in-the-Loop**: All AI-generated customer correspondence is saved with `isDraft: true` and returned with `unsent: true`. Consultants must inspect and approve replies before transmission.
5. **Verified Live Execution**: The extraction integration has undergone controlled live verification against `gemini-3.5-flash-lite` with synthetic enquiry requirements, passing strict Zod validation with 100% schema compliance.

---

## 🗄️ Database Schema & Migrations

Travelora uses 6 sequential PostgreSQL migrations managed through Prisma:

```text
prisma/migrations/
├── 20261104003000_init/               # Core enums, User, Package, SeasonalPrice, ItineraryDay
├── 20261104010000_package_versioning/ # PackageVersion snapshots & publishedVersionId
├── 20261104235900_enquiries/          # Customer enquiries, statuses, traveler metadata
├── 20261105001000_enquiry_inbox/      # Notes, replies, and audit activity tracking
├── 20261105183000_blog_cms/           # BlogPost, BlogPostVersion, taxonomy, and relations
└── 20261105191500_quote_builder/      # Quote, QuoteStatus, calculations, cryptographic tokens
```

### Database Dual-Connection Architecture
Prisma is configured in `prisma/schema.prisma` with dual connection targets:
- `url = env("DATABASE_URL")`: Points to Neon's **pooled connection string** (via PgBouncer on port 5432). Multiplexes connections efficiently across serverless lambdas.
- `directUrl = env("DIRECT_URL")`: Points to Neon's **direct connection string**. Used by Prisma CLI for migrations requiring PostgreSQL advisory locks.

---

## 📁 Project Structure

```text
travelora-travel-platform/
├── docs/                               # Technical design documents (.docx)
├── prisma/
│   ├── migrations/                     # 6 chronological PostgreSQL migrations
│   ├── schema.prisma                   # Canonical Prisma schema (PostgreSQL datasource)
│   └── seed.mjs                        # Production-guarded idempotent database seed
├── public/                             # Static brand assets and icons
├── scripts/
│   └── run-integration-tests.mjs       # Safe PostgreSQL integration test runner
├── src/
│   ├── app/                            # Next.js 16 App Router
│   │   ├── (public)/                   # Homepage, packages discovery, blog readers
│   │   ├── admin/                      # Staff portal (packages, blog, enquiries, quotes)
│   │   ├── api/                        # Secure route handlers & AI integration
│   │   ├── quotes/                     # Tokenized public quote preview
│   │   ├── sitemap.ts & robots.ts      # Automated SEO generation
│   │   └── not-found.tsx & error.tsx   # Custom error boundaries
│   ├── components/                     # Reusable React components
│   │   ├── admin/                      # CMS forms, enquiry inboxes, quote viewers
│   │   ├── blog/                       # Article cards, XSS-safe content renderer
│   │   ├── layout/                     # Atelier header, navigation, and footer
│   │   └── travel/                     # Package cards, seasonal pricing displays
│   ├── config/                         # Environment schema, legacy redirects
│   ├── lib/validation/                 # Zod validation schemas (Auth, AI, Blog, Quotes)
│   ├── server/                         # Server-only business logic & services
│   │   ├── ai/                         # Gemini SDK service & response sanitization
│   │   ├── db/                         # Prisma Client singleton
│   │   ├── repositories/               # Encapsulated database access layers
│   │   └── services/                   # Quote engine, PDF renderer, rate limiters
│   └── auth.ts                         # Auth.js credentials & JWT configuration
├── tests/                              # Comprehensive test suite (Vitest & Playwright)
├── deployment.md                       # Complete production deployment runbook
├── package.json                        # Project dependencies and npm scripts
└── tsconfig.json                       # Strict TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Compatible with Next.js 16 (`>= 18.18.0` or `>= 20.9.0`)
- **npm** (or pnpm/yarn)
- **Git**

### Local Setup (Windows PowerShell)

1. **Clone the Repository**:
   ```powershell
   git clone https://github.com/rakeshkumar280205/travelora-travel-platform.git
   Set-Location .\travelora-travel-platform
   ```

2. **Install Dependencies**:
   ```powershell
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example template to create your local `.env` (never commit this file):
   ```powershell
   Copy-Item .env.example .env
   ```

4. **Install Browser Binaries (For Optional E2E Tests)**:
   ```powershell
   npx playwright install chromium
   ```

5. **Start the Development Server**:
   ```powershell
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the public site. Access the staff atelier at [http://localhost:3000/admin/signin](http://localhost:3000/admin/signin).

---

## ⚙️ Environment Configuration

The following variables are defined in `.env.example`:

| Variable | Environment | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | All | Pooled PostgreSQL connection string (`?sslmode=require`). |
| `DIRECT_URL` | Migrations / Prod | Direct unpooled PostgreSQL connection string for DDL migrations. |
| `AUTH_SECRET` | All | Random string of at least 32 characters for Auth.js JWT signing. |
| `NEXTAUTH_SECRET` | All | Secret matching `AUTH_SECRET` for NextAuth v4 internal handlers. |
| `NEXTAUTH_URL` | All | Canonical application base URL (e.g. `http://localhost:3000`). |
| `NEXT_PUBLIC_APP_URL` | Production | Absolute base URL for SEO canonical tags, sitemap, and robots. |
| `UPSTASH_REDIS_REST_URL` | Production | Upstash Redis REST URL for distributed rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN`| Production | Upstash Redis REST authentication token. |
| `GEMINI_API_KEY` | Optional / Prod | Google AI Studio API key for consultant AI features. |
| `GEMINI_MODEL` | Optional | Model identifier (defaults to `gemini-3.5-flash-lite`). |
| `SEED_ADMIN_EMAIL` | Dev / Staging | Initial admin email for seed script (prohibited in prod). |
| `SEED_ADMIN_PASSWORD` | Dev / Staging | Initial admin password (min 12 characters; prohibited in prod). |

---

## 🗃️ Database Initialization & Seed

### 1. Apply Migrations to a Fresh Database
Once `DATABASE_URL` and `DIRECT_URL` are configured in `.env`:
```powershell
npx prisma generate
npx prisma migrate deploy
npx prisma migrate status
```

### 2. Bootstrap Initial Admin & Demo Journeys
The seed script (`prisma/seed.mjs`) is strictly protected and refuses to run when `NODE_ENV=production`. To bootstrap initial data on development or staging:
```powershell
$env:NODE_ENV = "development"
$env:SEED_ADMIN_EMAIL = "admin@travelora.com"
$env:SEED_ADMIN_PASSWORD = "YourSecurePassword123!"

npm run db:seed

# Clear variables from session
Remove-Item Env:\SEED_ADMIN_PASSWORD
Remove-Item Env:\SEED_ADMIN_EMAIL
```

---

## 🧪 Testing & Quality Gates

Travelora maintains strict testing standards across unit, typecheck, lint, and build stages:

```powershell
# 1. Run deterministic Vitest suite (121 tests across 22 files)
npm test

# 2. Run ESLint across entire codebase
npm run lint

# 3. Verify TypeScript type safety
npx tsc --noEmit

# 4. Compile Next.js production build (35 static and dynamic routes)
npm run build
```

### Specialized Test Suites
- **PostgreSQL Integration Tests**:
  Requires an isolated, disposable database (`TEST_DATABASE_URL`). Refuses to run if matching `DATABASE_URL` or production strings:
  ```powershell
  $env:TEST_DATABASE_URL = "postgresql://user:pass@localhost:5432/travelora_test"
  npm run test:integration
  ```
- **Playwright E2E Tests**:
  Runs browser-level end-to-end tests against Chromium:
  ```powershell
  npm run test:e2e
  ```

---

## 🚢 Production Deployment

Travelora is designed for zero-configuration deployment to **Vercel** with **Neon PostgreSQL** and **Upstash Redis**:

1. **Database**: Create a project on [Neon](https://console.neon.tech/) (PostgreSQL 16/18). Copy the pooled connection string to `DATABASE_URL` and the direct connection string to `DIRECT_URL`.
2. **Apply Migrations**: Execute `npx prisma migrate deploy` locally to establish all tables and indexes.
3. **Distributed Cache**: Create a Redis database on [Upstash](https://console.upstash.com/) and obtain REST credentials.
4. **Vercel Project Setup**:
   - Connect repository `rakeshkumar280205/travelora-travel-platform`.
   - Set framework preset to **Next.js**.
   - Configure all environment variables in project settings.
   - Deploy.

*For complete, detailed step-by-step instructions, see [`deployment.md`](./deployment.md).*

---

## 🔒 Security Architecture

- **Role-Based Authorization**: Every protected API route evaluates the authenticated user's role (`ADMIN`, `EDITOR`, `CONSULTANT`). Unauthorized mutations immediately return HTTP 403.
- **Tenant Isolation**: Consultants are barred from accessing or modifying enquiries and quotes assigned to other staff members.
- **Server-Side Secret Isolation**: API keys (`GEMINI_API_KEY`, Upstash tokens, database credentials) are never exposed to browser bundles or client responses.
- **Stored XSS Prevention**: Blog articles and customer notes are sanitized through strict React AST element construction without `dangerouslySetInnerHTML`.
- **Fail-Closed Protection**: In production (`NODE_ENV=production`), rate limiting fails closed with HTTP 503 if Upstash Redis credentials are omitted.

---

## 🗺️ Roadmap & Known Limitations

- **Legacy URL Mapping**: Next.js 16 redirect proxy infrastructure is active in `src/proxy.ts`, but the client inventory of 140 legacy URLs remains empty pending stakeholder delivery.
- **Production Domain**: Absolute canonical tags in `sitemap.xml` and `robots.txt` require `NEXT_PUBLIC_APP_URL` to be populated with the live production domain.
- **External Communications**: Email dispatch and WhatsApp delivery are intentionally disabled; quote PDFs and reply drafts require manual consultant review and dispatch.
- **Live AI Verification**: Requirement extraction has been verified live with `gemini-3.5-flash-lite`. AI package recommendations and reply drafting have passed comprehensive mock testing and await production API provisioning.

---

## 📄 Project Information

- **Brand**: Travelora Private Atelier
- **Tagline**: *Journeys beyond ordinary.*
- **Repository**: [https://github.com/rakeshkumar280205/travelora-travel-platform](https://github.com/rakeshkumar280205/travelora-travel-platform)
- **Architecture**: Enterprise App Router, Serverless PostgreSQL, Distributed Redis Rate Limiting, Pure Vector PDF 1.4 Composition.

<div align="center">
  <br />
  <sub>Crafted with architectural precision for bespoke tour operators and luxury travel ateliers.</sub>
</div>
