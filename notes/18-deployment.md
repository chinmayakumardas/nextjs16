# 18 --- Deployment

> Next.js App Router --- `next build`, build output, Vercel, self-hosting
> with Node, Docker + standalone output, static export, CDN & caching,
> ISR in multi-instance setups, CI/CD, preview environments, health
> checks, monitoring, rollbacks, common mistakes & interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
                    DEPLOYMENT PIPELINE

   Code ──► Build ──► Package ──► Deploy ──► Serve ──► Observe
    │         │          │          │          │          │
    ▼         ▼          ▼          ▼          ▼          ▼
   Git     next build  Docker /   Platform    CDN +     Logs,
  commit   + tests     artifact   / server    Node      metrics,
                                                         alerts
```

Think:

``` text
Works locally
      ↓
Is it built, configured, secured, cached, monitored and reversible?
```

Deployment is not "upload files". It is:

``` text
Build
+ Configuration
+ Hosting
+ Caching
+ Monitoring
+ Rollback plan
```

------------------------------------------------------------------------

# 2. Why Deployment Matters

Good deployment gives:

``` text
Fast pages
High availability
Safe releases
Easy rollbacks
Predictable environments
Lower cost
```

Poor deployment causes:

``` text
Broken builds in production
Missing env variables
Stale or inconsistent caches
Downtime during releases
Slow cold starts
Images not optimizing
"Works locally, fails in prod"
```

------------------------------------------------------------------------

# 3. The Build Step

``` bash
npm run build      # next build
npm run start      # next start (production server)
```

Mental model:

``` text
next dev
   ↓
Development: slow, hot reload, extra checks

next build
   ↓
Compile + optimize + pre-render what can be static

next start
   ↓
Run the production Node server
```

What `next build` does:

``` text
Type checks / lints (depending on config)
Compiles and minifies JavaScript
Splits bundles per route
Pre-renders static pages
Generates route manifests
Optimizes fonts and CSS
```

Build output example:

``` text
Route (app)                    Size     First Load JS
┌ ○ /                          5.2 kB        98 kB
├ ○ /about                     1.1 kB        94 kB
├ ƒ /dashboard                 3.4 kB        96 kB
├ ● /blog/[slug]               2.0 kB        95 kB
└ ƒ /api/orders                0 B            0 B

○  (Static)   prerendered as static content
●  (SSG)      prerendered with generateStaticParams
ƒ  (Dynamic)  server-rendered on demand
```

Read it like this:

``` text
○ Static   → built once, served from CDN
● SSG      → built for known params
ƒ Dynamic  → needs a running server per request
```

Use this to confirm routes render the way you expect.

------------------------------------------------------------------------

# 4. Deployment Options

``` text
Option                    Needs Node server?   Best for
──────────────────────────────────────────────────────────────
Vercel                    Managed              Fastest path, full features
Node server (VPS/EC2)     Yes                  Full control
Docker (standalone)       Yes                  Containers, K8s, ECS, Cloud Run
Static export             No                   Fully static sites
Serverless adapters       Managed              AWS/Cloudflare/Netlify setups
```

Choosing:

``` text
Want zero-ops and best Next.js feature support?
        ↓
Vercel

Need control, compliance or fixed cost?
        ↓
Docker / Node on your infrastructure

Pure marketing site, no server features?
        ↓
Static export + any static host / CDN
```

------------------------------------------------------------------------

# 5. Deploying to Vercel

Flow:

``` text
Push to GitHub
      ↓
Vercel builds automatically
      ↓
Preview deployment per branch / PR
      ↓
Merge to main
      ↓
Production deployment
```

Setup:

``` text
1. Import the Git repo in Vercel
2. Framework preset: Next.js (auto-detected)
3. Add environment variables (Production / Preview / Development)
4. Add a custom domain
5. Deploy
```

What you get:

``` text
Global CDN
Automatic HTTPS
Preview URLs
Instant rollbacks
Serverless / edge functions
ISR and image optimization built in
Analytics & Speed Insights
```

Trade-offs:

``` text
Usage-based pricing can grow
Vendor-specific platform features
Less low-level control
```

------------------------------------------------------------------------

# 6. Self-Hosting with Node

Simplest approach:

``` bash
npm ci
npm run build
npm run start
```

`package.json`:

``` json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

Run on a custom port:

``` bash
PORT=8080 npm run start
```

Keep it alive with a process manager:

``` bash
npm install -g pm2
pm2 start npm --name "myapp" -- start
pm2 save
pm2 startup
```

Put a reverse proxy in front (nginx / Caddy):

``` text
Internet
   ↓
Nginx / Caddy (HTTPS, compression, caching)
   ↓
Next.js on localhost:3000
```

------------------------------------------------------------------------

# 7. Docker with Standalone Output

Enable standalone output:

``` ts
// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
}

export default nextConfig
```

What it does:

``` text
Traces only the files needed to run
Creates .next/standalone with a minimal server.js
Much smaller Docker images
```

Dockerfile (multi-stage):

``` dockerfile
FROM node:22-alpine AS base

# 1. Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public build-time values only
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# 3. Run
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

Important:

``` text
public/ and .next/static are NOT copied automatically
You must copy them (or serve them from a CDN)
```

Build and run:

``` bash
docker build -t myapp --build-arg NEXT_PUBLIC_APP_URL=https://example.com .
docker run -p 3000:3000 -e DATABASE_URL=... -e AUTH_SECRET=... myapp
```

`.dockerignore`:

``` text
node_modules
.next
.git
.env*.local
Dockerfile
README.md
```

Mental model:

``` text
Build stage      → heavy tools, source code
Runner stage     → tiny, non-root, only what runs
Secrets          → injected at runtime, never baked in
```

------------------------------------------------------------------------

# 8. Static Export

For fully static sites:

``` ts
// next.config.ts
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
}

export default nextConfig
```

``` bash
npm run build
```

Output:

``` text
out/
├── index.html
├── about/index.html
└── _next/static/...
```

Host anywhere:

``` text
S3 + CloudFront
Cloudflare Pages
GitHub Pages
Netlify
Nginx
```

Limitations:

``` text
❌ No Server Actions
❌ No dynamic Route Handlers (request-based)
❌ No middleware
❌ No ISR / on-demand revalidation
❌ No cookies()/headers() based rendering
❌ Default image optimization needs a server
❌ No rewrites/redirects/headers from next.config at runtime
```

Think:

``` text
Static export
   ↓
HTML files only
   ↓
Great for brochure sites, docs, landing pages
```

------------------------------------------------------------------------

# 9. Environment Variables in Deployment

Two kinds:

``` text
Build-time  → NEXT_PUBLIC_* (frozen into the bundle)
Runtime     → server secrets (read when code runs)
```

Deployment rules:

``` text
Set NEXT_PUBLIC_ values BEFORE the build
Inject secrets at runtime (platform settings / secret manager)
Use different values for Preview vs Production
Never bake secrets into Docker images
Validate env at startup (Zod)
```

Common production bug:

``` text
Added env var on the platform
      ↓
Did not redeploy / rebuild
      ↓
NEXT_PUBLIC_ value still old
```

See: `16-environment-configuration.md`.

------------------------------------------------------------------------

# 10. Caching & CDN

Layers:

``` text
Browser cache
     ↓
CDN / edge cache
     ↓
Next.js cache (data cache / full route cache)
     ↓
Origin server
     ↓
Database / APIs
```

Static assets:

``` text
/_next/static/*   → content-hashed, cache "immutable" for 1 year
/public/*         → cached by headers you configure
```

Custom cache headers:

``` ts
// next.config.ts
async headers() {
  return [
    {
      source: "/images/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ]
}
```

Caching summary:

``` text
Hashed build assets   → cache forever
Static pages          → cache at CDN, revalidate on schedule/demand
Dynamic pages         → usually private / short-lived
API responses         → set explicit Cache-Control
```

Rule:

``` text
Never cache personalized responses in a shared CDN
```

------------------------------------------------------------------------

# 11. ISR & Revalidation in Production

Incremental Static Regeneration:

``` tsx
export const revalidate = 3600   // seconds

export default async function Page() { ... }
```

On-demand:

``` ts
import { revalidatePath, revalidateTag } from "next/cache"

revalidatePath("/blog")
revalidateTag("products")
```

Flow:

``` text
Request → serve cached page instantly
            ↓
        Revalidate in background
            ↓
        Next request gets fresh page
```

Multi-instance problem:

``` text
Instance A regenerates a page
Instance B still has the old cache
        ↓
Users see inconsistent content
```

Fix: shared cache handler.

``` ts
// next.config.ts
const nextConfig = {
  cacheHandler: require.resolve("./cache-handler.js"),
  cacheMaxMemorySize: 0,   // disable in-memory cache, use shared store
}
```

Typical shared stores:

``` text
Redis
S3 / object storage
Managed platform cache
```

Rule:

``` text
Single server         → default file-system cache is fine
Multiple instances    → use a shared cache handler (or a platform that provides it)
```

------------------------------------------------------------------------

# 12. Images in Deployment

`next/image` optimization runs on the server.

For Node/Docker deployments:

``` bash
npm install sharp
```

Notes:

``` text
sharp provides fast image processing
Allow only needed remotePatterns
Cache optimized images (CDN in front helps a lot)
Consider a custom loader (Cloudinary, imgix) for heavy image sites
Static export requires unoptimized or a custom loader
```

Custom loader:

``` ts
// next.config.ts
images: {
  loader: "custom",
  loaderFile: "./lib/image-loader.ts",
}
```

See: `15-images-fonts-assets.md`.

------------------------------------------------------------------------

# 13. Reverse Proxy (Nginx)

``` nginx
server {
  listen 80;
  server_name example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name example.com;

  ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

  gzip on;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  location /_next/static/ {
    proxy_pass http://127.0.0.1:3000;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }
}
```

If you use streaming (Suspense / loading UI):

``` text
Disable proxy buffering for streamed responses
→ add header from Next.js: X-Accel-Buffering: no
→ or proxy_buffering off for those routes
```

Otherwise streaming may appear to "wait then show everything".

Forward correct headers so Server Actions' Origin checks pass.

------------------------------------------------------------------------

# 14. CI/CD with GitHub Actions

``` text
Push / PR
    ↓
Install → Lint → Type check → Test → Build
    ↓
Deploy (preview or production)
```

`.github/workflows/ci.yml`:

``` yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test --if-present

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_APP_URL: ${{ vars.NEXT_PUBLIC_APP_URL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Cache the Next.js build cache for faster builds:

``` yaml
- uses: actions/cache@v4
  with:
    path: .next/cache
    key: nextjs-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

Rules:

``` text
Use npm ci (exact lockfile)
Fail the pipeline on lint/type/test errors
Keep secrets in CI secret storage
Deploy only from a green main branch
```

------------------------------------------------------------------------

# 15. Environments: Preview, Staging, Production

``` text
Feature branch
     ↓
Preview deployment (unique URL per PR)
     ↓
Staging (production-like, test data)
     ↓
Production
```

Differences:

``` text
                 Preview       Staging       Production
Database         test/branch   staging       live
Payment keys     test          test          live
Email            sandbox       sandbox       real
Indexing         noindex       noindex       indexable
Analytics        off           off           on
```

Prevent search engines from indexing non-production:

``` ts
// app/robots.ts
export default function robots() {
  if (process.env.APP_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } }
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://example.com/sitemap.xml",
  }
}
```

------------------------------------------------------------------------

# 16. Database Migrations

Never let deploys and schema drift apart.

``` text
Deploy new code
   ↓
Code expects new column
   ↓
Migration not applied
   ↓
Production errors
```

Safe order for most changes:

``` text
1. Apply backward-compatible migration (add column, nullable)
2. Deploy code that uses it
3. Backfill data
4. Later: remove old column in a separate release
```

Run migrations as a separate pipeline step:

``` bash
npx prisma migrate deploy
```

Avoid:

``` text
Running migrations automatically inside every app instance start
(race conditions with multiple instances)
Destructive migrations in the same release as code changes
```

------------------------------------------------------------------------

# 17. Zero-Downtime, Rollbacks & Version Skew

Zero-downtime strategies:

``` text
Rolling deploy      → replace instances gradually
Blue/green          → switch traffic to a new environment
Canary              → small percentage first
```

Health-check gate:

``` text
New instance starts
      ↓
Health check passes
      ↓
Receives traffic
      ↓
Old instance drained
```

Rollback plan:

``` text
Keep previous image / build available
One command or click to revert
Backward-compatible DB migrations make rollback safe
```

Version skew:

``` text
User has old JS loaded
      ↓
You deploy a new version
      ↓
Old client calls new server (e.g. Server Action IDs changed)
      ↓
Errors
```

Mitigations:

``` text
Use a deployment ID / skew protection (supported on Vercel)
Keep previous assets available during rollout
Use a stable build ID across instances
Handle failures gracefully with error boundaries and refresh prompts
```

Stable build ID for multiple instances:

``` ts
// next.config.ts
const nextConfig = {
  generateBuildId: async () => process.env.GIT_SHA ?? "dev",
}
```

Encryption key for Server Actions across instances:

``` text
Set NEXT_SERVER_ACTIONS_ENCRYPTION_KEY to the same value on all instances
(otherwise bound action arguments fail between instances/builds)
```

------------------------------------------------------------------------

# 18. Health Checks

``` ts
// app/api/health/route.ts
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return Response.json({ status: "ok" })
  } catch {
    return Response.json({ status: "degraded" }, { status: 503 })
  }
}
```

Two kinds:

``` text
Liveness   → is the process running?  (cheap, no DB)
Readiness  → can it serve traffic?    (checks DB/cache)
```

Docker healthcheck:

``` dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
```

Kubernetes / load balancers use these to:

``` text
Route traffic only to healthy instances
Restart failed containers
Block bad releases
```

------------------------------------------------------------------------

# 19. Monitoring & Observability

Three pillars:

``` text
Logs      → what happened
Metrics   → how much / how fast
Traces    → where time was spent
```

Tools:

``` text
Sentry                 → errors
Datadog / Grafana      → metrics & dashboards
OpenTelemetry          → traces
Vercel Analytics       → traffic & Web Vitals
Uptime monitors        → availability
```

`instrumentation.ts`:

``` ts
// instrumentation.ts (project root or src/)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
}

export async function onRequestError(err: unknown, request: Request) {
  // report server errors here
}
```

Report Web Vitals:

``` tsx
"use client"
import { useReportWebVitals } from "next/web-vitals"

export function WebVitals() {
  useReportWebVitals((metric) => {
    navigator.sendBeacon("/api/vitals", JSON.stringify(metric))
  })
  return null
}
```

Alert on:

``` text
5xx error rate
Latency (p95/p99)
Core Web Vitals regressions
Memory/CPU saturation
Failed deployments
Failed cron jobs / webhooks
```

------------------------------------------------------------------------

# 20. Logging

Guidelines:

``` text
Structured JSON logs
Include request ID, user ID, route, status
Log at proper levels (info / warn / error)
Never log secrets or sensitive personal data
Ship logs to a central system
```

Example:

``` ts
console.log(
  JSON.stringify({
    level: "info",
    msg: "order_created",
    orderId,
    userId,
    ts: new Date().toISOString(),
  })
)
```

Containers log to stdout/stderr:

``` text
Next.js app → stdout
Docker/K8s  → collects
Log platform → searches & alerts
```

------------------------------------------------------------------------

# 21. Pre-Deploy Performance Checks

``` text
Analyze bundle size
Check Lighthouse / PageSpeed
Verify Core Web Vitals (LCP, CLS, INP)
Test on slow networks / mid-range phones
Check unnecessary Client Components
```

Bundle analyzer:

``` bash
npm install @next/bundle-analyzer
```

``` ts
// next.config.ts
import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

export default withBundleAnalyzer({ /* config */ })
```

``` bash
ANALYZE=true npm run build
```

Look for:

``` text
Large libraries (moment, lodash full import)
Duplicate dependencies
Heavy components that can be dynamically imported
```

------------------------------------------------------------------------

# 22. Domains, HTTPS & Redirects

Checklist:

``` text
Custom domain connected
DNS records correct (A / CNAME)
HTTPS enabled (auto on Vercel; Let's Encrypt elsewhere)
HTTP → HTTPS redirect
www ↔ non-www canonical redirect
HSTS enabled
```

Redirect in config:

``` ts
async redirects() {
  return [
    {
      source: "/old-blog/:slug",
      destination: "/blog/:slug",
      permanent: true,
    },
  ]
}
```

Canonical host redirect:

``` ts
{
  source: "/:path*",
  has: [{ type: "host", value: "www.example.com" }],
  destination: "https://example.com/:path*",
  permanent: true,
}
```

------------------------------------------------------------------------

# 23. SEO Items at Deploy Time

``` text
robots.txt / robots.ts
sitemap.xml / sitemap.ts
Metadata API (title, description, OpenGraph)
Canonical URLs
Correct status codes (404 for missing, 301 for moves)
noindex on staging / preview
```

Check after deploy:

``` text
View source → content present in HTML
/robots.txt loads
/sitemap.xml loads
OpenGraph preview works
Search Console verified
```

------------------------------------------------------------------------

# 24. Scaling & Cost

Scaling shape:

``` text
Static pages        → almost free, scales via CDN
Dynamic SSR         → CPU per request
Server Actions/API  → depends on DB and logic
Image optimization  → CPU-heavy
```

Cost levers:

``` text
Cache aggressively (CDN, ISR, data cache)
Prefer static where possible
Optimize images (format, size, CDN)
Avoid unnecessary dynamic rendering (cookies()/headers() opt out of static)
Right-size instances
Use connection pooling for databases (serverless!)
```

Serverless database warning:

``` text
Many function instances
      ↓
Each opens DB connections
      ↓
Database connection limit hit
```

Use a pooler (PgBouncer, Prisma Accelerate, Neon/Supabase pooling).

------------------------------------------------------------------------

# 25. Common Mistakes

``` text
❌ Deploying without running next build locally/CI first
❌ Forgetting env vars on the hosting platform
❌ Changing NEXT_PUBLIC_ vars without rebuilding
❌ Baking secrets into Docker images
❌ Not copying public/ and .next/static in standalone Docker
❌ Using static export while relying on server features
❌ Multi-instance ISR without a shared cache
❌ No health checks
❌ No rollback plan
❌ Running DB migrations from every instance
❌ Destructive migrations shipped with code
❌ Missing sharp / image setup on self-hosted servers
❌ Proxy buffering breaks streaming
❌ Indexing staging/preview sites
❌ No monitoring or alerts
❌ Running the container as root
❌ Ignoring build warnings and type errors
```

------------------------------------------------------------------------

# 26. Debugging Deployment Failures

Build fails:

``` text
Read the first error, not the last
Type errors? Run `tsc --noEmit` locally
Missing env var at build? Check static pages reading env
Node version mismatch? Pin engines / .nvmrc
Out of memory? Increase build memory / reduce parallelism
Case-sensitive imports (works on macOS, fails on Linux)
```

Works locally, fails in production:

``` text
NODE_ENV differences
Missing environment variables
Case-sensitive file names
Different Node version
Static vs dynamic rendering differences
Stale cache
Different database / network access
```

Runtime errors:

``` text
Check server logs first
Check health endpoint
Check env validation errors
Check outbound network / DNS / firewall
Check memory limits (OOM kills)
Check proxy headers (Host, X-Forwarded-*)
```

Local production test:

``` bash
npm run build && npm run start
```

Always test the production build locally before blaming the platform.

------------------------------------------------------------------------

# 27. Interview Questions

### Q1. What does `next build` do?

Compiles and optimizes the app, splits code per route, pre-renders
static routes, and generates the production output.

### Q2. What is the difference between `next dev` and `next start`?

`next dev` is for development with hot reload. `next start` runs the
optimized production server built by `next build`.

### Q3. What does `output: "standalone"` do?

It traces and copies only the files needed to run the app, producing a
minimal `server.js` for smaller Docker images.

### Q4. What does `output: "export"` do and what are its limits?

It generates a fully static site. It cannot use Server Actions,
middleware, dynamic server rendering, ISR or default image
optimization.

### Q5. Why do `NEXT_PUBLIC_` variables require a rebuild?

Their values are inlined into the bundle at build time.

### Q6. How do you deploy Next.js with Docker?

Use a multi-stage Dockerfile with standalone output, copy `public/` and
`.next/static`, run as a non-root user, and inject secrets at runtime.

### Q7. What problem does ISR have with multiple instances?

Each instance has its own local cache. Use a shared cache handler so
revalidated pages stay consistent.

### Q8. What are static (○) vs dynamic (ƒ) routes?

Static routes are pre-rendered at build time and served from cache/CDN.
Dynamic routes render per request on a server.

### Q9. How do you do a safe release?

CI checks, preview deployment, health-checked rolling or blue/green
rollout, backward-compatible migrations, monitoring, and quick
rollback.

### Q10. What is version skew?

A client running an older build talks to a newer server. Mitigate with
skew protection, stable build IDs and graceful error handling.

### Q11. How do you stop staging from being indexed?

Use `noindex` / a disallow-all `robots` rule for non-production
environments.

### Q12. Why use a health check endpoint?

So load balancers and orchestrators route traffic only to healthy
instances and can restart failed ones.

### Q13. How do you handle database migrations in deployment?

Run them as a separate controlled step, keep them backward compatible,
and avoid destructive changes in the same release as code.

### Q14. Vercel vs self-hosting?

Vercel: fastest, managed, full feature support, usage-based cost.
Self-hosting: more control and predictable cost, but you manage
scaling, caching, images, security and monitoring.

------------------------------------------------------------------------

# 28. Interview Failure Points

Avoid:

``` text
❌ "Deployment is just running npm start on a server."

❌ "I can change NEXT_PUBLIC_ variables after the build."

❌ "Static export supports everything dynamic mode does."

❌ "I bake my .env file into the Docker image."

❌ "I don't need rollbacks, I'll just fix forward."

❌ "ISR works the same across any number of servers by default."

❌ "If it works in next dev, it will work in production."

❌ "Monitoring is optional."
```

Better mental model:

``` text
Build
 ↓
Reproducible, tested, env-aware

Package
 ↓
Small, non-root, no secrets baked in

Release
 ↓
Health-checked, gradual, reversible

Cache
 ↓
CDN + ISR + shared cache for scale

Operate
 ↓
Logs, metrics, traces, alerts
```

------------------------------------------------------------------------

# 29. Real-World SaaS Deployment Architecture

``` text
                    USERS
                      │
                      ▼
                 CDN / Edge
                      │
                      ▼
               Load Balancer
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Next.js     Next.js     Next.js
       container   container   container
          │           │           │
          └───────────┼───────────┘
                      ▼
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
    PostgreSQL      Redis      Object storage
   (with pooler)  (cache/rate)   (uploads)
                      │
                      ▼
            Logs / Metrics / Alerts
```

Pipeline:

``` text
GitHub PR
   ↓
CI: lint + types + tests + build
   ↓
Preview deploy
   ↓
Merge to main
   ↓
Build Docker image (tagged with git SHA)
   ↓
Run migrations
   ↓
Rolling deploy with health checks
   ↓
Smoke tests + monitoring
```

------------------------------------------------------------------------

# 30. Real-World Marketing Site Deployment

``` text
Next.js static export (or mostly-static app)
        ↓
Build in CI
        ↓
Upload to CDN / static host
        ↓
Cache invalidation on release
```

Characteristics:

``` text
Very cheap
Very fast
Minimal ops
Forms handled by third-party/API
CMS webhooks trigger rebuilds
```

------------------------------------------------------------------------

# 31. Deployment Decision Tree

``` text
Which deployment?
        │
        ▼
Need server features?
(Server Actions, middleware, SSR, ISR)
        │
   ┌────┴────┐
   ▼         ▼
  No         Yes
   │         │
   ▼         ▼
Static     Managed platform?
export         │
          ┌────┴────┐
          ▼         ▼
         Yes        No
          │         │
          ▼         ▼
       Vercel /   Docker standalone
       Netlify    on ECS / K8s / Cloud Run / VPS
```

Scaling question:

``` text
More than one server instance?
        ↓
Shared cache handler
Same build ID
Same Server Actions encryption key
Central logging
```

------------------------------------------------------------------------

# 32. Production Checklist

``` text
- [ ] npm run build passes in CI
- [ ] Lint, type check and tests pass
- [ ] Production build tested locally (build + start)
- [ ] All env vars set for the target environment
- [ ] NEXT_PUBLIC_ values set before build
- [ ] Secrets injected at runtime, not baked in
- [ ] output: "standalone" used for Docker
- [ ] public/ and .next/static copied in the image
- [ ] Container runs as non-root
- [ ] sharp installed for image optimization (self-hosted)
- [ ] CDN/HTTPS/domain configured
- [ ] HTTP→HTTPS and www redirects set
- [ ] Security headers configured
- [ ] Cache-Control set for static assets
- [ ] Shared cache handler for multi-instance ISR
- [ ] Stable build ID and Server Actions key across instances
- [ ] Health check endpoint implemented
- [ ] DB migrations applied in a controlled step
- [ ] Rollback plan tested
- [ ] Monitoring, logs and alerts enabled
- [ ] noindex on preview/staging
- [ ] robots.txt and sitemap verified
- [ ] Core Web Vitals checked
```

------------------------------------------------------------------------

# 33. 30-Second Revision

``` text
next build
↓
Compile, optimize, pre-render

next start
↓
Production Node server

Vercel
↓
Managed, easiest

Docker + standalone
↓
Portable, small, self-hosted

Static export
↓
HTML only, no server features

NEXT_PUBLIC_
↓
Frozen at build

Secrets
↓
Injected at runtime

CDN
↓
Cache static assets and pages

ISR + multi-instance
↓
Needs shared cache

Health checks
↓
Safe rollouts

Rollback
↓
Always have one

Monitoring
↓
Logs + metrics + traces + alerts
```

------------------------------------------------------------------------

# 34. Final Interview Answer

> "For deploying a Next.js App Router application, I start with a CI
> pipeline that installs with `npm ci`, runs lint, type checks and
> tests, and then runs `next build`. The build output tells me which
> routes are static and which are dynamic. For hosting, I use Vercel
> when I want a managed platform with previews and instant rollbacks,
> or Docker with `output: 'standalone'` when I need control --- a
> multi-stage image that copies `public` and `.next/static`, runs as a
> non-root user and receives secrets at runtime. I remember that
> `NEXT_PUBLIC_` values are frozen at build time, so they must be set
> before building. I put a CDN in front, set cache headers for static
> assets, and for multiple instances I use a shared cache handler, a
> stable build ID and a shared Server Actions encryption key. Releases
> are health-checked and gradual, database migrations are backward
> compatible and run as a separate step, and I always keep a rollback
> path. Finally, I add logging, error tracking, metrics and alerts, and
> keep staging and preview environments out of search indexes."

------------------------------------------------------------------------

# 35. One-Line Rule

> **Build once, configure per environment, release gradually, cache
> smartly --- and always be able to roll back.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
next build / next start
→ Production build and server

output: "standalone"
→ Minimal self-hosted / Docker output

output: "export"
→ Static HTML only

Vercel
→ Managed Next.js hosting

Dockerfile
→ Multi-stage, non-root, copy public + static

NEXT_PUBLIC_
→ Build-time

Runtime secrets
→ Platform / secret manager

CDN
→ Cache static and public content

ISR
→ Time or on-demand regeneration

cacheHandler
→ Shared cache across instances

generateBuildId
→ Stable ID across instances

Health check
→ /api/health for orchestrators

Rolling / blue-green / canary
→ Safe release strategies

Skew protection
→ Handle old client + new server

Migrations
→ Backward compatible, separate step

Observability
→ Logs, metrics, traces, alerts
```

### BEST GENERAL ARCHITECTURE

``` text
                 DEPLOYMENT SYSTEM
                         │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
    Build              Release            Operate
      │                  │                  │
  CI: lint,          Preview →          Logs, metrics,
  types, tests       staging →          traces, alerts
  next build         production              │
  Docker image       health checks      Rollback ready
      │              rolling deploy          │
      └──────────────────┼───────────────────┘
                         ▼
              Reliable + Fast + Reversible
```