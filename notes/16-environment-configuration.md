# 16 --- Environment Configuration

> Next.js App Router --- `.env` files, load order, `process.env`,
> `NEXT_PUBLIC_`, build-time vs runtime variables, server-only secrets,
> validation with Zod, typing, per-environment config, Docker/CI,
> secrets management, common mistakes & interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
              ENVIRONMENT CONFIGURATION

                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
    .env files      process.env     Platform
       │               │               │
       ▼               ▼               ▼
  Local values     Read in code    Vercel / Docker
  per environment  server / client  CI / Secrets manager
```

Think:

``` text
Same code
   ↓
Different environment
   ↓
Different configuration
```

Never:

``` text
Hardcode values per environment inside the code
```

Instead:

``` text
Code stays the same
Configuration changes outside the code
```

------------------------------------------------------------------------

# 2. Why Environment Configuration Matters

Environment variables control:

``` text
Database connection
API keys
Auth secrets
Third-party services
Feature flags
Public URLs
Analytics IDs
Environment-specific behavior
```

Bad configuration causes:

``` text
Leaked secrets
Broken production builds
Wrong database used
Dev keys in production
"Works on my machine" bugs
Crashes at runtime
```

Good configuration gives:

``` text
Security
Predictable deployments
Easy local setup
Safe environment separation
```

------------------------------------------------------------------------

# 3. Environment Files

Next.js loads these files automatically:

``` text
.env
.env.local
.env.development
.env.development.local
.env.production
.env.production.local
.env.test
.env.test.local
```

Mental model:

``` text
.env                → defaults for all environments
.env.development    → only `next dev`
.env.production     → only `next build` / `next start`
.env.test           → only test runs
.env*.local         → machine-specific / secret overrides (NOT committed)
```

Example `.env`:

``` bash
APP_NAME=MyShop
DATABASE_URL=postgres://user:pass@localhost:5432/myshop
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

------------------------------------------------------------------------

# 4. Load Order

Next.js looks for variables in this order and stops at the first match:

``` text
1. process.env            (already set by the OS / platform)
2. .env.$(NODE_ENV).local
3. .env.local             (not loaded when NODE_ENV=test)
4. .env.$(NODE_ENV)
5. .env
```

Example in development:

``` text
process.env
   ↓
.env.development.local
   ↓
.env.local
   ↓
.env.development
   ↓
.env
```

Important:

``` text
Real environment variables always win over .env files
```

This is why platforms like Vercel and Docker can override your files.

------------------------------------------------------------------------

# 5. Reading Variables

On the server:

``` tsx
export default async function Page() {
  const dbUrl = process.env.DATABASE_URL
  // use it on the server
}
```

Works in:

``` text
Server Components
Route Handlers
Server Actions
Middleware / proxy
next.config.js
```

Mental model:

``` text
process.env.SECRET
      ↓
Available on the server only
```

------------------------------------------------------------------------

# 6. `NEXT_PUBLIC_` Variables

By default, variables are **server-only**.

To expose a variable to the browser, prefix it:

``` bash
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GA_ID=G-XXXXXXX
```

Then in a Client Component:

``` tsx
"use client"

export function Analytics() {
  return <p>{process.env.NEXT_PUBLIC_GA_ID}</p>
}
```

Mental model:

``` text
No prefix
   ↓
Server only

NEXT_PUBLIC_ prefix
   ↓
Inlined into the JavaScript bundle
   ↓
Visible to every user
```

Rule:

``` text
If a user must never see it → no NEXT_PUBLIC_
```

------------------------------------------------------------------------

# 7. Build-Time vs Runtime (Critical)

`NEXT_PUBLIC_` values are **replaced at build time**.

``` text
next build
    ↓
Finds process.env.NEXT_PUBLIC_API_URL
    ↓
Replaces it with the literal string
    ↓
Frozen inside the bundle
```

So:

``` text
Change NEXT_PUBLIC_API_URL after build
        ↓
Nothing changes
        ↓
You must rebuild
```

Server-only variables are different:

``` text
Server variable
     ↓
Read when the code runs (dynamic rendering)
     ↓
Can differ per deployment without rebuild
```

Caveat:

``` text
Statically rendered pages run once at build time
        ↓
Their env reads are also frozen at build time
```

Comparison:

``` text
                 Build time        Runtime
NEXT_PUBLIC_*       ✅ frozen         ❌
Server vars in
static pages        ✅ frozen         ❌
Server vars in
dynamic pages       ❌                ✅ read per request
Route Handlers
(dynamic)           ❌                ✅
```

------------------------------------------------------------------------

# 8. Static Replacement Rule

`NEXT_PUBLIC_` variables must be written **literally**.

Works:

``` tsx
const url = process.env.NEXT_PUBLIC_API_URL
```

Does NOT work:

``` tsx
const key = "NEXT_PUBLIC_API_URL"
const url = process.env[key]          // ❌ not inlined

const { NEXT_PUBLIC_API_URL } = process.env   // ❌ not inlined
```

Why?

``` text
The compiler looks for the exact text
process.env.NEXT_PUBLIC_API_URL
and swaps it for the value
```

Dynamic lookups are invisible to that replacement.

------------------------------------------------------------------------

# 9. Server-Only Secrets

Secrets belong on the server.

``` bash
DATABASE_URL=...
AUTH_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=...
```

Protect modules that touch secrets:

``` bash
npm install server-only
```

``` ts
// lib/db.ts
import "server-only"

export const db = createClient(process.env.DATABASE_URL!)
```

Now:

``` text
Client Component imports lib/db.ts
          ↓
Build fails with a clear error
```

Think:

``` text
server-only
   ↓
Build-time guardrail against accidental leaks
```

------------------------------------------------------------------------

# 10. Never Do This

``` bash
# ❌ Secret exposed to every visitor
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_DATABASE_URL=postgres://...
NEXT_PUBLIC_AUTH_SECRET=...
```

Safe split:

``` bash
# ✅ Public (safe to expose)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# ✅ Secret (server only)
STRIPE_SECRET_KEY=sk_live_...
```

Mental model:

``` text
Publishable / public key  → can be NEXT_PUBLIC_
Secret / private key      → server only, always
```

------------------------------------------------------------------------

# 11. `.gitignore` and `.env.example`

Never commit real secrets.

`.gitignore`:

``` text
.env*.local
.env.production
```

Typical rule:

``` text
.env                → safe defaults only (no secrets) – may be committed
.env.local          → real secrets – NEVER committed
.env.example        → template for teammates – committed
```

`.env.example`:

``` bash
# Database
DATABASE_URL=

# Auth
AUTH_SECRET=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Onboarding flow:

``` text
git clone
   ↓
cp .env.example .env.local
   ↓
fill in values
   ↓
npm run dev
```

------------------------------------------------------------------------

# 12. Validate Env with Zod

Problem:

``` text
Missing variable
      ↓
App starts anyway
      ↓
Crashes later with "undefined"
```

Solution: validate once, at startup.

``` bash
npm install zod
```

``` ts
// env.ts
import { z } from "zod"

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
})

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
})

// Client vars must be listed literally so they get inlined
const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
})

const serverEnv =
  typeof window === "undefined" ? serverSchema.parse(process.env) : ({} as z.infer<typeof serverSchema>)

export const env = { ...serverEnv, ...clientEnv }
```

Usage:

``` ts
import { env } from "@/env"

const db = createClient(env.DATABASE_URL)
```

Benefits:

``` text
Fail fast with a clear message
Type safety
One source of truth
No scattered process.env calls
```

Production-ready alternative:

``` text
@t3-oss/env-nextjs
   ↓
Same idea, with built-in server/client separation
```

------------------------------------------------------------------------

# 13. Typing `process.env`

Without validation, give TypeScript a hint:

``` ts
// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string
    AUTH_SECRET: string
    STRIPE_SECRET_KEY: string
    NEXT_PUBLIC_APP_URL: string
  }
}
```

Compare:

``` text
env.d.ts
  ↓
Types only. No runtime check.

Zod validation
  ↓
Types AND runtime check.
```

Prefer Zod for anything important.

------------------------------------------------------------------------

# 14. Using Env in Server Code

### Server Component

``` tsx
import { env } from "@/env"

export default async function Page() {
  const res = await fetch(`${env.API_URL}/products`, {
    headers: { Authorization: `Bearer ${env.API_TOKEN}` },
  })
  const products = await res.json()
  return <ProductList products={products} />
}
```

### Route Handler

``` ts
// app/api/webhook/route.ts
import { env } from "@/env"

export async function POST(req: Request) {
  const sig = req.headers.get("x-signature")
  if (sig !== env.WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }
  return Response.json({ ok: true })
}
```

### Server Action

``` ts
"use server"
import { env } from "@/env"

export async function sendEmail(to: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({ to }),
  })
}
```

------------------------------------------------------------------------

# 15. Client Components Need a Proxy

Client Components cannot safely hold secrets.

Wrong:

``` tsx
"use client"
fetch("https://api.service.com", {
  headers: { Authorization: process.env.SECRET_KEY }   // undefined + unsafe idea
})
```

Right:

``` text
Client Component
      ↓
calls your Route Handler / Server Action
      ↓
Server adds the secret
      ↓
Calls the third-party API
```

Mental model:

``` text
Browser never sees the key
Server is the trusted middleman
```

------------------------------------------------------------------------

# 16. `env` in `next.config`

You can inline values at build time:

``` ts
// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  env: {
    BUILD_VERSION: process.env.npm_package_version,
  },
}

export default nextConfig
```

Notes:

``` text
Values in `env` are inlined at build time
They become accessible in the bundle
Do not put secrets here
```

You can also use env to change config itself:

``` ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: process.env.IMAGE_HOST! },
    ],
  },
}
```

------------------------------------------------------------------------

# 17. Variable Expansion

Next.js supports `$` references inside env files:

``` bash
HOSTNAME=localhost
PORT=3000
NEXT_PUBLIC_APP_URL=http://$HOSTNAME:$PORT
```

Literal dollar sign:

``` bash
PASSWORD=pa\$\$word
```

Use sparingly --- it hurts readability.

------------------------------------------------------------------------

# 18. Environments: Dev, Preview, Production

``` text
Local
  ↓
.env.local
Dev DB, test API keys

Preview (PR / branch)
  ↓
Platform "Preview" env vars
Staging DB, sandbox keys

Production
  ↓
Platform "Production" env vars
Live DB, live keys
```

Rules:

``` text
Never share one database across dev and prod
Never use live payment keys outside production
Never copy production secrets to a laptop
Use separate keys per environment
```

`NODE_ENV` is set by Next.js:

``` text
next dev     → development
next build   → production
next start   → production
test runner  → test
```

Do not set `NODE_ENV` manually to custom values like `staging`.

For staging, use a separate variable:

``` bash
APP_ENV=staging
```

------------------------------------------------------------------------

# 19. Runtime Config for Docker ("Build Once, Deploy Many")

Problem:

``` text
NEXT_PUBLIC_API_URL is frozen at build
        ↓
One Docker image per environment?
```

Better pattern: expose public config at runtime from the server.

### Option A --- Server Component passes values down

``` tsx
// app/layout.tsx
import { ConfigProvider } from "@/components/config-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const config = {
    apiUrl: process.env.API_URL!,          // read at runtime (dynamic)
    appName: process.env.APP_NAME!,
  }

  return (
    <html lang="en">
      <body>
        <ConfigProvider value={config}>{children}</ConfigProvider>
      </body>
    </html>
  )
}
```

### Option B --- Config endpoint

``` ts
// app/api/config/route.ts
export const dynamic = "force-dynamic"

export function GET() {
  return Response.json({
    apiUrl: process.env.API_URL,
  })
}
```

Mental model:

``` text
Build once
   ↓
Same image
   ↓
Config injected when the container starts
```

Make sure the layout is rendered dynamically, otherwise the value is frozen at build.

------------------------------------------------------------------------

# 20. Middleware / Proxy

Middleware runs on a restricted runtime.

``` ts
// middleware.ts
import { NextResponse } from "next/server"

export function middleware() {
  const maintenance = process.env.MAINTENANCE_MODE === "true"
  if (maintenance) {
    return NextResponse.rewrite(new URL("/maintenance", "https://example.com"))
  }
  return NextResponse.next()
}
```

Notes:

``` text
Env vars are available in middleware
Node-only APIs may not be (Edge runtime)
Keep secrets use minimal here
Newer Next.js versions rename middleware to proxy – same idea
```

------------------------------------------------------------------------

# 21. Feature Flags via Env

Simple flags:

``` bash
FEATURE_NEW_CHECKOUT=true
NEXT_PUBLIC_FEATURE_BETA_BANNER=false
```

``` tsx
const newCheckout = process.env.FEATURE_NEW_CHECKOUT === "true"

return newCheckout ? <NewCheckout /> : <OldCheckout />
```

Remember:

``` text
Env values are always strings
"false" is truthy!
```

Wrong:

``` ts
if (process.env.FEATURE_X) { ... }      // "false" passes
```

Right:

``` ts
if (process.env.FEATURE_X === "true") { ... }
```

Or coerce with Zod:

``` ts
FEATURE_X: z.enum(["true", "false"]).transform((v) => v === "true"),
```

When you need per-user flags or instant toggling:

``` text
Use a flag service (LaunchDarkly, Statsig, GrowthBook, Vercel Flags)
instead of env vars
```

------------------------------------------------------------------------

# 22. Secrets Management

Local:

``` text
.env.local (never committed)
```

Team / production:

``` text
Vercel / Netlify / Railway environment settings
AWS Secrets Manager / SSM Parameter Store
GCP Secret Manager
Azure Key Vault
HashiCorp Vault
Doppler / Infisical / 1Password
```

Flow:

``` text
Secret store
     ↓
Injected as environment variables at deploy/start
     ↓
process.env in the app
```

Rotation checklist:

``` text
Rotate immediately if a secret was committed
Remove it from git history (not just the latest commit)
Revoke the old key at the provider
Use short-lived credentials when possible
```

------------------------------------------------------------------------

# 23. CI/CD and Env

GitHub Actions:

``` yaml
- name: Build
  run: npm run build
  env:
    NEXT_PUBLIC_APP_URL: ${{ vars.NEXT_PUBLIC_APP_URL }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Docker build args (for `NEXT_PUBLIC_`):

``` dockerfile
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build
```

Docker runtime (for server secrets):

``` bash
docker run -e DATABASE_URL=... -e AUTH_SECRET=... myapp
```

Rule:

``` text
Public build-time values  → build args / CI vars
Secrets                   → runtime env / secret store
Never bake secrets into an image
```

------------------------------------------------------------------------

# 24. Test Environment

``` text
NODE_ENV=test
     ↓
.env.test and .env are loaded
.env.local is NOT loaded
```

Why?

``` text
Tests should be repeatable on every machine
Local overrides should not change test results
```

Use `.env.test`:

``` bash
DATABASE_URL=postgres://localhost:5432/myshop_test
AUTH_SECRET=test-secret-test-secret-test-secret
```

Load env in Jest / Vitest setup if needed:

``` ts
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())
```

------------------------------------------------------------------------

# 25. Debugging Env Problems

Variable is `undefined`?

``` text
Is the file named correctly?          (.env.local, not env.local)
Is it in the project root?            (next to package.json)
Did you restart `next dev`?           (env files load on startup)
Client code without NEXT_PUBLIC_?     → undefined
Dynamic process.env[key] on client?   → undefined
Changed NEXT_PUBLIC_ after build?     → rebuild needed
Typo or trailing spaces/quotes?
Platform missing the variable?        (Vercel/Docker/CI)
```

Quick check on the server only:

``` ts
console.log("DB set:", Boolean(process.env.DATABASE_URL))
```

Never log the value of a secret.

------------------------------------------------------------------------

# 26. Common Mistakes

``` text
❌ Putting secrets in NEXT_PUBLIC_ variables
❌ Committing .env.local
❌ Expecting NEXT_PUBLIC_ to change without rebuild
❌ Using process.env[dynamicKey] on the client
❌ Not validating env at startup
❌ Treating "false" as false
❌ Same database for dev and prod
❌ Setting NODE_ENV=staging
❌ Logging secrets
❌ Baking secrets into Docker images
❌ Reading env deep inside random files
❌ Forgetting to add env vars on the hosting platform
```

------------------------------------------------------------------------

# 27. Interview Questions

### Q1. How does Next.js load environment variables?

From `.env*` files and `process.env`, in a defined order, with real
environment variables taking priority over files.

### Q2. What does `NEXT_PUBLIC_` do?

It exposes a variable to the browser by inlining its value into the
JavaScript bundle at build time.

### Q3. Are non-prefixed variables available in Client Components?

No. They are only available on the server.

### Q4. When are `NEXT_PUBLIC_` values resolved?

At build time. Changing them later requires a rebuild.

### Q5. Why does `process.env[key]` fail in the browser?

Inlining is a static text replacement of `process.env.NEXT_PUBLIC_X`.
Dynamic lookups are not detected.

### Q6. What is the load order?

`process.env` → `.env.$(NODE_ENV).local` → `.env.local` →
`.env.$(NODE_ENV)` → `.env`. `.env.local` is skipped in test.

### Q7. Which files should be committed?

`.env` (safe defaults) and `.env.example`. Not `.env*.local`.

### Q8. How do you protect server-only code?

Use the `server-only` package so importing it from a Client Component
fails the build.

### Q9. How do you validate env variables?

Parse them with Zod (or `@t3-oss/env-nextjs`) at startup so the app
fails fast with a clear error.

### Q10. How do you "build once, deploy many"?

Avoid relying on `NEXT_PUBLIC_` for per-environment values. Read server
variables at runtime and pass the needed public config to the client.

### Q11. Why is `if (process.env.FLAG)` risky?

Env values are strings, so `"false"` is truthy.

### Q12. Where should production secrets live?

In the platform's secret store or a secrets manager, injected at runtime
--- not in the repository or the image.

------------------------------------------------------------------------

# 28. Interview Failure Points

Avoid:

``` text
❌ "NEXT_PUBLIC_ just makes the variable available in more places."

❌ "I can change a NEXT_PUBLIC_ value in production without rebuilding."

❌ "Secrets are fine in .env as long as the repo is private."

❌ "process.env works the same in the browser as on the server."

❌ "Env validation is unnecessary if I have TypeScript types."

❌ "NODE_ENV can be any environment name."
```

Better mental model:

``` text
Server variable
 ↓
Private, runtime (for dynamic code)

NEXT_PUBLIC_ variable
 ↓
Public, frozen at build

Validation
 ↓
Fail fast at startup

Secrets
 ↓
Secret store + server only
```

------------------------------------------------------------------------

# 29. Real-World E-Commerce Env Architecture

``` text
                     E-COMMERCE
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
     Public            Secret           Flags
     config            config
        │                │                │
        ▼                ▼                ▼
 NEXT_PUBLIC_*       Server-only       FEATURE_*
        │                │                │
        ▼                ▼                ▼
  App URL            DATABASE_URL      New checkout
  Stripe pk          STRIPE_SECRET     Beta banner
  Analytics ID       AUTH_SECRET
                     WEBHOOK_SECRET
```

Environment matrix:

``` text
                Local        Preview       Production
DATABASE_URL    local DB     staging DB    production DB
STRIPE keys     test         test          live
APP_URL         localhost    preview URL   real domain
Emails          console      sandbox       real sending
Analytics       off          off           on
```

------------------------------------------------------------------------

# 30. Real-World File Layout

``` text
project/
├── .env                  # safe defaults
├── .env.example          # template (committed)
├── .env.local            # real secrets (ignored)
├── .env.test             # test config
├── env.ts                # validation (single source of truth)
├── env.d.ts              # optional typing
├── next.config.ts
└── lib/
    ├── db.ts             # import "server-only"
    └── stripe.ts         # import "server-only"
```

Goal:

``` text
One place defines env
One place validates env
Every file imports from env.ts
```

------------------------------------------------------------------------

# 31. Env Decision Tree

``` text
New configuration value
          │
          ▼
Must the browser know it?
          │
     ┌────┴────┐
     ▼         ▼
    Yes        No
     │         │
     ▼         ▼
Is it safe     Server-only variable
for everyone?  (no prefix)
     │
 ┌───┴───┐
 ▼       ▼
Yes      No
 │       │
 ▼       ▼
NEXT_    Keep on server,
PUBLIC_  expose via
         Route Handler /
         Server Action
```

Does it change per deployment without rebuild?

``` text
Yes → read at runtime on the server
No  → NEXT_PUBLIC_ build-time value is fine
```

------------------------------------------------------------------------

# 32. Production Checklist

``` text
- [ ] No secrets in NEXT_PUBLIC_ variables
- [ ] .env*.local is in .gitignore
- [ ] .env.example is committed and up to date
- [ ] Env validated at startup (Zod)
- [ ] Secret modules use `server-only`
- [ ] Separate databases for dev / preview / prod
- [ ] Separate API keys per environment
- [ ] All variables added on the hosting platform
- [ ] NEXT_PUBLIC_ values set BEFORE the build
- [ ] Secrets injected at runtime, not baked into images
- [ ] Secrets stored in a secret manager
- [ ] Boolean flags compared with === "true"
- [ ] No secret values in logs
- [ ] Rotation plan for leaked / old secrets
- [ ] NODE_ENV not customized
```

------------------------------------------------------------------------

# 33. 30-Second Revision

``` text
.env files
↓
Defaults and per-environment values

.env.local
↓
Local secrets, never committed

process.env
↓
Server-side access, highest priority

NEXT_PUBLIC_
↓
Exposed to browser, frozen at build

server-only
↓
Prevents accidental client import

Zod validation
↓
Fail fast at startup

Runtime config
↓
Build once, deploy many

Secrets manager
↓
Real production secrets

"false"
↓
Is a truthy string
```

------------------------------------------------------------------------

# 34. Final Interview Answer

> "In Next.js, I keep configuration out of the code and in environment
> variables. Next.js loads `.env` files in a defined order, with real
> environment variables winning, and I commit only safe defaults and an
> `.env.example` while keeping `.env.local` ignored. Variables are
> server-only by default; only `NEXT_PUBLIC_` variables are exposed to
> the browser, and those are inlined at build time, so they need a
> rebuild to change and must never contain secrets. I validate all
> variables with Zod in a single `env.ts` so the app fails fast, protect
> secret-handling modules with `server-only`, and expose anything the
> client needs through Server Components, Route Handlers or Server
> Actions. For deployment, I use separate keys and databases per
> environment, inject secrets at runtime from the platform or a secrets
> manager, and use a runtime-config pattern when I want to build once
> and deploy many times."

------------------------------------------------------------------------

# 35. One-Line Rule

> **Keep secrets on the server, expose only what the browser truly
> needs, validate everything at startup --- and remember that public
> values are frozen at build time.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
.env / .env.local
→ Env files (local never committed)

process.env.X
→ Server-side access

NEXT_PUBLIC_X
→ Browser-visible, build-time inlined

server-only
→ Block client imports

Zod env.ts
→ Validate and type env

.env.example
→ Team template

Load order
→ process.env > .env.$NODE_ENV.local > .env.local > .env.$NODE_ENV > .env

Static rendering
→ Env frozen at build

Dynamic rendering
→ Env read at runtime

Docker secrets
→ Runtime, not baked in image

Boolean flags
→ === "true"

NODE_ENV
→ development | production | test only
```

### BEST GENERAL ARCHITECTURE

``` text
                  ENV SYSTEM
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     Sources        Validation       Usage
        │              │              │
  .env files        env.ts (Zod)    Server code
  Platform vars     Typed object    Route Handlers
  Secret manager    Fail fast       Server Actions
        │              │              │
        └──────────────┼──────────────┘
                       ▼
              Secure + Predictable
                 Configuration
```