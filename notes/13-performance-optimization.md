# 13 --- Performance Optimization

> Next.js App Router --- Core Web Vitals (LCP, INP, CLS), Server vs
> Client Components, streaming & Suspense, data-fetching waterfalls,
> caching, bundle size, dynamic imports, `next/script`, prefetching,
> rendering strategy, React optimizations, measuring, common mistakes &
> interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
                 NEXT.JS PERFORMANCE

                        │
     ┌──────────┬───────┼───────┬──────────┐
     ▼          ▼       ▼       ▼          ▼
  Send less   Render   Fetch   Load      Measure
  JavaScript  smarter  smarter smarter
     │          │       │       │          │
     ▼          ▼       ▼       ▼          ▼
  Server      Static   Parallel Images    Web Vitals
  Components  Stream   Cache    Fonts     Lighthouse
  Dynamic     Suspense Dedupe   Scripts   Bundle
  imports                                 analyzer
```

Think:

``` text
Faster app
    ↓
Less work on the server
+
Less JavaScript in the browser
+
Less waiting on the network
+
Less layout movement
```

Performance is not one trick. It is:

``` text
Rendering strategy
+ Data strategy
+ Bundle strategy
+ Asset strategy
+ Measurement
```

------------------------------------------------------------------------

# 2. Why Performance Matters

Performance affects:

``` text
User experience
Conversion rate
SEO ranking (Core Web Vitals)
Bounce rate
Server cost
Mobile / low-end device usability
Accessibility on slow networks
```

A page can be correct and still lose users because it is:

``` text
Slow to show content
Slow to respond to taps
Jumpy while loading
Heavy on mobile data
```

------------------------------------------------------------------------

# 3. Core Web Vitals

Three user-centered metrics:

``` text
LCP  Largest Contentful Paint
     ↓
     How fast the main content appears
     Good: ≤ 2.5 s

INP  Interaction to Next Paint
     ↓
     How fast the page responds to interaction
     Good: ≤ 200 ms

CLS  Cumulative Layout Shift
     ↓
     How stable the layout is
     Good: ≤ 0.1
```

What usually hurts each:

``` text
LCP → big hero image, slow server, blocking data, render-blocking resources
INP → heavy JavaScript, long tasks, expensive re-renders
CLS → images without size, late fonts, injected banners/ads
```

Supporting metrics:

``` text
TTFB  Time To First Byte     → server / cache / network speed
FCP   First Contentful Paint → first visible content
TBT   Total Blocking Time    → lab proxy for main-thread blocking
```

Rule:

``` text
Optimize for real users (field data), verify with lab tools
```

------------------------------------------------------------------------

# 4. Where to Start (Priority Order)

``` text
1. Ship less JavaScript          (Server Components, dynamic imports)
2. Fix data waterfalls           (parallel fetching, streaming)
3. Cache and prerender           (static, ISR, data cache)
4. Optimize LCP asset            (image/font)
5. Remove layout shifts          (sizes, font strategy)
6. Control third-party scripts
7. Measure, then repeat
```

Think:

``` text
Measure first
     ↓
Fix the biggest bottleneck
     ↓
Measure again
```

Do not optimize blindly.

------------------------------------------------------------------------

# 5. Server Components by Default

In the App Router, components are Server Components unless marked:

``` tsx
"use client"
```

Why this is a performance feature:

``` text
Server Component
     ↓
Runs on the server
     ↓
Its code is NOT sent to the browser
     ↓
Only rendered output is sent
```

Example:

``` tsx
// Server Component – heavy library stays on the server
import { marked } from "marked"

export default async function Post({ md }: { md: string }) {
  const html = marked.parse(md)
  return <article dangerouslySetInnerHTML={{ __html: html }} />
}
```

Compare:

``` text
Client Component using `marked`
   ↓
Library shipped to every visitor
   ↓
Bigger bundle, slower page
```

Rule:

``` text
Default to Server Components
Add "use client" only when needed
```

------------------------------------------------------------------------

# 6. Push `"use client"` Down the Tree

Needs `"use client"` when you use:

``` text
useState / useEffect / useReducer
Event handlers (onClick, onChange)
Browser APIs (window, localStorage)
Client-only libraries
```

Bad:

``` tsx
// app/products/page.tsx
"use client"       // ❌ whole page becomes client JS

export default function Page() { ... }
```

Good:

``` text
Page (Server)
 ├── Header (Server)
 ├── ProductList (Server)  ← data + markup
 │     └── AddToCartButton (Client) ← only interactive part
 └── Footer (Server)
```

``` tsx
// app/products/page.tsx  (Server)
import AddToCartButton from "./add-to-cart-button"

export default async function Page() {
  const products = await getProducts()

  return products.map((p) => (
    <div key={p.id}>
      <h2>{p.name}</h2>
      <AddToCartButton id={p.id} />
    </div>
  ))
}
```

``` tsx
// add-to-cart-button.tsx
"use client"
import { useState } from "react"

export default function AddToCartButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  return <button onClick={() => setLoading(true)}>Add</button>
}
```

Mental model:

``` text
Small client "islands"
inside a mostly server-rendered page
```

------------------------------------------------------------------------

# 7. Children Pattern (Keep Server Content Inside Client Wrappers)

A Client Component can receive Server Components as `children`:

``` tsx
// modal.tsx
"use client"
export default function Modal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return open ? <div className="modal">{children}</div> : null
}
```

``` tsx
// page.tsx (Server)
<Modal>
  <ExpensiveServerContent />   {/* stays server-rendered */}
</Modal>
```

Think:

``` text
Client wrapper
   ↓
Interactivity

children (Server)
   ↓
Zero extra client JS
```

------------------------------------------------------------------------

# 8. Data Fetching Waterfalls

Waterfall (slow):

``` tsx
const user = await getUser()
const posts = await getPosts(user.id)      // waits for user
const comments = await getComments()       // waits for posts
```

Timeline:

``` text
getUser ─────►
              getPosts ─────►
                             getComments ─────►
Total = sum of all
```

Parallel (fast) when requests are independent:

``` tsx
const [user, posts, comments] = await Promise.all([
  getUser(),
  getPosts(),
  getComments(),
])
```

Timeline:

``` text
getUser     ─────►
getPosts    ─────►
getComments ─────►
Total = slowest one
```

Rule:

``` text
Independent requests → Promise.all
Dependent requests   → sequential, but stream the rest
```

------------------------------------------------------------------------

# 9. Streaming with Suspense

Without streaming:

``` text
Wait for ALL data
      ↓
Send whole page
```

With streaming:

``` text
Send shell immediately
      ↓
Stream slow parts when ready
```

``` tsx
import { Suspense } from "react"

export default function Page() {
  return (
    <>
      <Header />                          {/* instant */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews />                       {/* slow, streams later */}
      </Suspense>
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </>
  )
}
```

``` tsx
async function Reviews() {
  const reviews = await getReviews()       // slow
  return <ReviewList reviews={reviews} />
}
```

Benefits:

``` text
Faster FCP / LCP for important content
Slow data doesn't block the whole page
Better perceived performance
```

Also:

``` text
loading.tsx → automatic Suspense boundary for a route segment
```

Avoid:

``` text
One giant Suspense boundary around everything
(then nothing streams independently)
```

------------------------------------------------------------------------

# 10. Avoid Duplicate Work (Request Dedupe & `cache`)

Same data needed in multiple components:

``` tsx
import { cache } from "react"

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } })
})
```

Now:

``` text
Layout calls getUser(id)
Page calls getUser(id)
Component calls getUser(id)
        ↓
One database query per request
```

`fetch` calls with the same URL/options in one render pass are also
deduplicated.

Preload pattern (start early):

``` tsx
export const preload = (id: string) => { void getUser(id) }

export default async function Page({ params }) {
  const { id } = await params
  preload(id)                   // start now
  const other = await getOther()
  const user = await getUser(id) // likely already resolved
}
```

------------------------------------------------------------------------

# 11. Caching Strategy

Caching is often the biggest win.

``` text
Browser cache
   ↓
CDN
   ↓
Next.js caches
   ↓
Database / API
```

Time-based:

``` tsx
await fetch("https://api.example.com/products", {
  next: { revalidate: 3600 },
})
```

Tag-based:

``` tsx
await fetch(url, { next: { tags: ["products"] } })

// later, after a mutation
import { revalidateTag } from "next/cache"
revalidateTag("products")
```

Cache a database call:

``` tsx
import { unstable_cache } from "next/cache"

const getCachedProducts = unstable_cache(
  async () => db.product.findMany(),
  ["products"],
  { revalidate: 3600, tags: ["products"] }
)
```

Notes:

``` text
Defaults changed across Next.js versions
(e.g. fetch is not cached by default in newer versions)
Newer versions are moving toward explicit caching APIs
Always check the docs for your installed version
```

Rule:

``` text
Static or cached if possible
Dynamic only when truly per-request
```

See: `07-caching-revalidation.md`.

------------------------------------------------------------------------

# 12. Static vs Dynamic Rendering

Static pages are fastest:

``` text
Built once
Served from CDN
No server work per request
```

Things that make a route dynamic:

``` text
cookies()
headers()
searchParams (in a page)
connection()
Uncached fetch with no-store
export const dynamic = "force-dynamic"
```

Check with `next build`:

``` text
○ Static
● SSG
ƒ Dynamic
```

Common mistake:

``` tsx
// layout.tsx
import { cookies } from "next/headers"

export default async function Layout({ children }) {
  const theme = (await cookies()).get("theme")   // ❌ whole subtree dynamic
  ...
}
```

Better:

``` text
Read cookies in the smallest component that needs them
and wrap it in Suspense
```

------------------------------------------------------------------------

# 13. Partial Prerendering (Static Shell + Dynamic Holes)

Idea:

``` text
Static shell (instant from CDN)
      +
Dynamic parts streamed in
```

``` text
┌─────────────────────────────┐
│ Header (static)             │
│ Product info (static)       │
│ ┌─────────────────────────┐ │
│ │ Cart / user (dynamic)   │ │  ← streamed
│ └─────────────────────────┘ │
│ Footer (static)             │
└─────────────────────────────┘
```

Usage is based on Suspense boundaries:

``` tsx
<Suspense fallback={<CartSkeleton />}>
  <Cart />            {/* uses cookies → dynamic hole */}
</Suspense>
```

Note:

``` text
PPR / Cache Components are evolving
Enable via the config flag for your Next.js version
Verify the current API in the docs before relying on it
```

------------------------------------------------------------------------

# 14. Bundle Size

Less JavaScript means faster load, parse and execute.

Check the build output:

``` text
Route (app)            Size     First Load JS
┌ ○ /                  5 kB          98 kB
└ ƒ /dashboard         45 kB        180 kB   ← investigate
```

Analyze:

``` bash
npm install @next/bundle-analyzer
```

``` ts
// next.config.ts
import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

export default withBundleAnalyzer({})
```

``` bash
ANALYZE=true npm run build
```

Look for:

``` text
Huge dependencies (moment, full lodash, chart libs)
Duplicate packages
Large JSON/data bundled into client code
Unused code
Server-only code leaking into client bundles
```

------------------------------------------------------------------------

# 15. Reduce Dependency Weight

Prefer small imports:

``` ts
// ❌ pulls the whole library
import _ from "lodash"

// ✅ import only what you need
import debounce from "lodash/debounce"
```

Replace heavy libraries:

``` text
moment        → date-fns / dayjs / Intl
lodash (full) → native JS or per-method imports
large icon packs → import individual icons
```

Barrel files can hurt tree shaking. Next.js can optimize some packages:

``` ts
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@mui/icons-material"],
  },
}
```

Rule:

``` text
Before adding a dependency, ask:
"What does this cost in kilobytes?"
```

Tools: bundlephobia, bundle analyzer.

------------------------------------------------------------------------

# 16. Dynamic Imports (Code Splitting)

Load heavy components only when needed.

``` tsx
"use client"

import dynamic from "next/dynamic"

const Chart = dynamic(() => import("@/components/chart"), {
  loading: () => <p>Loading chart...</p>,
})

export default function Dashboard() {
  return <Chart />
}
```

Client-only components (browser-only libraries):

``` tsx
const Map = dynamic(() => import("@/components/map"), {
  ssr: false,          // allowed in Client Components
})
```

Load on interaction:

``` tsx
"use client"
import { useState } from "react"
import dynamic from "next/dynamic"

const Editor = dynamic(() => import("./editor"))

export function Comments() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Write comment</button>
      {open && <Editor />}      {/* downloaded only after click */}
    </>
  )
}
```

Good candidates:

``` text
Charts
Rich text editors
Maps
Modals / drawers
Admin-only tools
Below-the-fold widgets
```

Mental model:

``` text
Initial page
   ↓
Small bundle

Heavy feature
   ↓
Downloaded later, when needed
```

------------------------------------------------------------------------

# 17. Third-Party Scripts (`next/script`)

Third-party scripts are a common cause of slow pages and poor INP.

``` tsx
import Script from "next/script"

<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"
  strategy="afterInteractive"
/>
```

Strategies:

``` text
beforeInteractive → critical scripts, before hydration (use sparingly)
afterInteractive  → default: after page becomes interactive
lazyOnload        → idle time, lowest priority
worker            → off main thread (experimental)
```

Guidelines:

``` text
Load only what you need
Use lazyOnload for chat widgets, social embeds
Audit tag managers regularly
Remove unused trackers
Prefer server-side / lightweight analytics where possible
```

Heavy embeds:

``` tsx
<iframe src="https://www.youtube.com/embed/ID" loading="lazy" />
```

or use a "click to load" facade for video players.

------------------------------------------------------------------------

# 18. Images, Fonts & Assets

Short version (details in `15-images-fonts-assets.md`):

``` text
next/image
   ↓
Correct dimensions, sizes, modern formats, lazy loading

LCP image
   ↓
Mark as high priority (priority / fetchPriority)

next/font
   ↓
Self-hosted fonts, fewer layout shifts

Only needed weights and subsets
```

Never:

``` text
Lazy-load the LCP image
Mark every image as priority
Ship multi-megabyte originals
```

------------------------------------------------------------------------

# 19. Prefetching & Navigation

`<Link>` prefetches routes in the viewport (in production).

``` tsx
import Link from "next/link"

<Link href="/products">Products</Link>
```

Effect:

``` text
Link visible
    ↓
Route data/code prefetched
    ↓
Click feels instant
```

Disable for rarely visited or heavy routes:

``` tsx
<Link href="/admin/reports" prefetch={false}>Reports</Link>
```

Use `<Link>`, not `<a>`, for internal navigation:

``` text
<Link> → client-side transition, no full reload, prefetch
<a>    → full page reload
```

Programmatic:

``` tsx
"use client"
import { useRouter } from "next/navigation"

const router = useRouter()
router.prefetch("/checkout")
```

Long lists of links:

``` text
Hundreds of prefetching Links can waste bandwidth
→ consider prefetch={false} for large tables/lists
```

------------------------------------------------------------------------

# 20. Interaction Performance (INP)

Slow interactions come from main-thread work.

### `useTransition` for non-urgent updates

``` tsx
"use client"
import { useState, useTransition } from "react"

export function Search({ items }: { items: string[] }) {
  const [query, setQuery] = useState("")
  const [filtered, setFiltered] = useState(items)
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <input
        value={query}
        onChange={(e) => {
          const value = e.target.value
          setQuery(value)                       // urgent: keep typing smooth
          startTransition(() => {               // non-urgent: heavy filter
            setFiltered(items.filter((i) => i.includes(value)))
          })
        }}
      />
      {isPending && <p>Updating...</p>}
      <List items={filtered} />
    </>
  )
}
```

### `useDeferredValue`

``` tsx
const deferredQuery = useDeferredValue(query)
const results = useMemo(() => filter(items, deferredQuery), [deferredQuery])
```

### Debounce expensive handlers

``` ts
const onSearch = useMemo(() => debounce(runSearch, 300), [])
```

### Virtualize long lists

``` text
10,000 rows in the DOM  → slow
Render only visible rows → fast
```

Libraries: `@tanstack/react-virtual`, `react-window`.

Also:

``` text
Break long tasks into smaller chunks
Avoid heavy work in render
Move heavy computation to the server or a Web Worker
```

------------------------------------------------------------------------

# 21. React Re-render Optimization

Use only after measuring.

``` tsx
const total = useMemo(() => expensiveCalc(items), [items])

const onClick = useCallback(() => { ... }, [])

const Row = React.memo(function Row({ item }: { item: Item }) {
  return <li>{item.name}</li>
})
```

Common causes of wasted renders:

``` text
Creating new objects/arrays/functions inline as props
Context value changing too often
State placed too high in the tree
Large lists re-rendering on every keystroke
```

Fixes:

``` text
Move state closer to where it is used
Split contexts
Memoize expensive children
Use stable keys (not array index for dynamic lists)
```

React Compiler (when enabled) can auto-memoize:

``` ts
// next.config.ts
const nextConfig = {
  reactCompiler: true,     // check availability for your version
}
```

Rule:

``` text
Don't scatter useMemo/useCallback everywhere
Profile → fix the real hotspot
```

------------------------------------------------------------------------

# 22. Server-Side Performance

Slow server = slow TTFB.

Checklist:

``` text
Database indexes on filtered / sorted columns
Avoid N+1 queries
Select only needed columns
Paginate large lists
Use connection pooling (serverless!)
Cache expensive queries
Keep APIs close to the database (region)
```

N+1 problem:

``` ts
// ❌ 1 query + N queries
const posts = await db.post.findMany()
for (const p of posts) {
  p.author = await db.user.findUnique({ where: { id: p.authorId } })
}

// ✅ one query with join/include
const posts = await db.post.findMany({ include: { author: true } })
```

Pagination:

``` ts
await db.post.findMany({
  take: 20,
  cursor: lastId ? { id: lastId } : undefined,
  skip: lastId ? 1 : 0,
  orderBy: { id: "asc" },
})
```

Place compute near data:

``` text
Server Components fetching directly from DB
      ↓
Avoid extra network hops through your own API
```

------------------------------------------------------------------------

# 23. Runtime & Region Choices

``` text
Node.js runtime → full APIs, most compatible
Edge runtime    → fast cold starts, global, limited APIs
```

Rule of thumb:

``` text
Data lives in one region?
   ↓
Run compute in/near that region
```

Edge compute far from the database can be slower:

``` text
User → Edge (fast) → DB in another continent (slow)
```

Use Edge for:

``` text
Lightweight auth checks
Redirects / rewrites
Geolocation-based routing
```

------------------------------------------------------------------------

# 24. Compression, CDN & HTTP

``` text
Enable gzip/brotli (platform or proxy)
Serve static assets from a CDN
Cache hashed /_next/static/* for a year (immutable)
Use HTTP/2 or HTTP/3
Keep response payloads small
```

API response size:

``` text
Return only needed fields
Avoid sending huge JSON to the client
Paginate
```

Rule:

``` text
Bytes not sent are the fastest bytes
```

------------------------------------------------------------------------

# 25. CSS Performance

``` text
Tailwind/CSS Modules → scoped & tree-shaken at build time
Avoid huge global CSS files
Avoid runtime CSS-in-JS in Server Components (limited support)
Remove unused CSS
Avoid layout thrashing animations
```

Animations:

``` css
/* ✅ GPU-friendly */
transform: translateY(0);
opacity: 1;

/* ❌ triggers layout */
top: 0;
width: 200px;
```

Respect user preferences:

``` css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

Reserve space to prevent CLS:

``` css
.hero { aspect-ratio: 16 / 9; }
.skeleton { min-height: 200px; }
```

------------------------------------------------------------------------

# 26. Avoiding Layout Shift (CLS)

Common causes and fixes:

``` text
Images without dimensions      → width/height or fill + aspect ratio
Late-loading fonts             → next/font
Ads / embeds with no space     → reserve container size
Banners injected at the top    → reserve space or overlay
Skeletons different from final → match dimensions
Dynamic content above existing → insert below or reserve space
```

Skeleton pattern:

``` tsx
function ProductSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded bg-gray-200" />
}
```

Rule:

``` text
Reserve space before content arrives
```

------------------------------------------------------------------------

# 27. Measuring Performance

Lab tools (controlled tests):

``` text
Lighthouse (Chrome DevTools)
PageSpeed Insights
WebPageTest
Chrome Performance panel
React DevTools Profiler
```

Field tools (real users):

``` text
Chrome UX Report (CrUX)
Vercel Speed Insights / Analytics
Google Search Console – Core Web Vitals
Custom RUM via useReportWebVitals
```

Report vitals:

``` tsx
"use client"
import { useReportWebVitals } from "next/web-vitals"

export function WebVitals() {
  useReportWebVitals((metric) => {
    // name: LCP | INP | CLS | FCP | TTFB
    navigator.sendBeacon("/api/vitals", JSON.stringify(metric))
  })
  return null
}
```

Test conditions:

``` text
Production build (next build && next start), not next dev
Throttled CPU (4x) and slow 4G
Mid-range Android, not just a developer laptop
Incognito (no extensions)
```

Lab vs field:

``` text
Lab   → reproducible, good for debugging
Field → what users actually experience, what Google uses
```

------------------------------------------------------------------------

# 28. Performance Budgets & CI

Define limits:

``` text
LCP < 2.5 s
INP < 200 ms
CLS < 0.1
First Load JS per route < 170 kB (example target)
Total image weight per page < 1 MB (example target)
```

Automate:

``` yaml
- run: npm run build
- run: npx lhci autorun        # Lighthouse CI
```

Why:

``` text
Prevent performance regressions
Catch heavy dependencies in PRs
Make performance a team habit
```

------------------------------------------------------------------------

# 29. Common Mistakes

``` text
❌ "use client" at the top of every file
❌ Sequential awaits for independent data
❌ Fetching in client useEffect when the server could do it
❌ Making whole layouts dynamic with cookies()/headers()
❌ Importing huge libraries on the client
❌ Not using dynamic imports for heavy widgets
❌ Lazy-loading the LCP image
❌ Marking all images as priority
❌ Too many third-party scripts
❌ No Suspense boundaries around slow data
❌ N+1 database queries
❌ Returning massive JSON to the client
❌ Testing performance in next dev
❌ Over-using useMemo/useCallback without profiling
❌ Ignoring real-user (field) data
❌ Hundreds of auto-prefetching Links
```

------------------------------------------------------------------------

# 30. Debugging Slow Pages

Slow first load:

``` text
Check TTFB → server/DB/cache problem
Check LCP element → image? text? blocked by data?
Check bundle size → analyzer
Check render-blocking resources
Check third-party scripts
```

Slow interactions:

``` text
Record in Chrome Performance panel
Look for long tasks (> 50 ms)
Use React Profiler for expensive renders
Check large lists and heavy handlers
```

Layout jumps:

``` text
Chrome DevTools → Performance → Layout Shifts
Check images, fonts, injected content
```

Slow server:

``` text
Log query timings
Check indexes and N+1
Check cache hit rate
Check cold starts and region distance
```

Workflow:

``` text
Reproduce → Measure → Identify bottleneck → Fix one thing → Re-measure
```

------------------------------------------------------------------------

# 31. Interview Questions

### Q1. What are Core Web Vitals?

LCP (loading), INP (interactivity) and CLS (visual stability) --- user-
centered metrics used to evaluate page experience and SEO.

### Q2. Why are Server Components good for performance?

Their code is not sent to the browser, so bundles are smaller and heavy
logic/dependencies stay on the server.

### Q3. Where should `"use client"` be placed?

As low in the tree as possible, only on components that need state,
effects, event handlers or browser APIs.

### Q4. What is a data-fetching waterfall?

Sequential requests where each waits for the previous one. Fix
independent requests with `Promise.all` and restructure dependencies.

### Q5. How does Suspense improve performance?

It lets the server stream the shell immediately and slower sections
later, improving perceived and real loading times.

### Q6. What does `React.cache` do?

Memoizes a function per request so multiple components can call it
without duplicate work.

### Q7. When do you use `next/dynamic`?

For heavy, rarely used or browser-only components --- charts, editors,
maps, modals --- to split code and load it on demand.

### Q8. How do you reduce bundle size?

Server Components, dynamic imports, smaller dependencies, per-method
imports, `optimizePackageImports`, and analyzing with the bundle
analyzer.

### Q9. What causes poor INP and how do you fix it?

Long main-thread tasks and heavy re-renders. Use `useTransition`,
`useDeferredValue`, debouncing, list virtualization, smaller bundles
and less third-party script work.

### Q10. What causes poor CLS?

Images without dimensions, late fonts, injected content and missing
reserved space.

### Q11. How do third-party scripts hurt performance?

They compete for the main thread and network. Use `next/script` with
`afterInteractive` or `lazyOnload`, and audit regularly.

### Q12. Static vs dynamic rendering for performance?

Static pages are prebuilt and served from a CDN --- fastest. Dynamic
APIs (`cookies`, `headers`) make a route per-request, so use them in the
smallest possible part, wrapped in Suspense.

### Q13. What is Partial Prerendering?

A static shell served instantly with dynamic parts streamed in through
Suspense boundaries.

### Q14. How do you measure performance?

Lighthouse and DevTools in the lab; CrUX, Search Console, Speed
Insights and `useReportWebVitals` for field data --- on a production
build.

### Q15. Should I wrap everything in `useMemo`/`useCallback`?

No. Profile first and optimize real hotspots.

------------------------------------------------------------------------

# 32. Interview Failure Points

Avoid:

``` text
❌ "Performance is just image compression."

❌ "I add 'use client' so everything works."

❌ "Lighthouse score 100 means real users are fast."

❌ "useMemo everywhere makes React faster."

❌ "Dynamic rendering is fine for every page."

❌ "Third-party scripts don't affect my app."

❌ "I test performance in dev mode."
```

Better mental model:

``` text
JavaScript
 ↓
Send less (Server Components + code splitting)

Data
 ↓
Parallelize, cache, stream

Rendering
 ↓
Static when possible, dynamic only when needed

Assets
 ↓
Right size, right format, right priority

Interaction
 ↓
Keep the main thread free

Measurement
 ↓
Real users + production builds
```

------------------------------------------------------------------------

# 33. Real-World E-Commerce Performance Architecture

``` text
                      E-COMMERCE
                          │
     ┌──────────┬─────────┼─────────┬──────────┐
     ▼          ▼         ▼         ▼          ▼
  Listing    Product     Cart     Checkout   Search
   page       page
     │          │         │         │          │
     ▼          ▼         ▼         ▼          ▼
  Static/    Static +   Dynamic   Dynamic    Debounce +
  ISR        ISR +      island    + minimal  server
  + CDN      Suspense   (client)  JS         filtering
```

Product page:

``` text
Static shell (title, images, description)  ← instant
Suspense: stock + price personalization    ← streamed
Suspense: reviews                          ← streamed
Suspense: recommendations                  ← streamed
Client island: Add to Cart                 ← small JS
```

Wins:

``` text
LCP image prioritized with correct sizes
Reviews/recommendations don't block the page
Cart logic isolated in a small client component
Third-party chat loaded lazily
```

------------------------------------------------------------------------

# 34. Real-World Dashboard Performance Architecture

``` text
Dashboard
   │
   ├── Layout (static shell)
   ├── Summary cards  → parallel fetch, Suspense each
   ├── Charts         → dynamic import, client only
   ├── Data table     → server pagination + virtualization
   └── Filters        → useTransition / debounced
```

Goals:

``` text
Shell appears immediately
Cards stream independently
Heavy chart library loaded only on the dashboard
Table never renders thousands of DOM rows
Typing in filters stays smooth
```

------------------------------------------------------------------------

# 35. Performance Decision Tree

``` text
Page feels slow
      │
      ▼
First load or interaction?
      │
 ┌────┴─────┐
 ▼          ▼
First      Interaction
load           │
 │             ▼
 ▼          Long tasks?
TTFB high?     │
 │         ┌───┴───┐
 ┌─┴──┐    ▼       ▼
 ▼    ▼   Yes      No
Yes   No   │       │
 │    │    ▼       ▼
 ▼    ▼   Reduce   Check
Cache LCP  JS,      re-renders,
DB    asset transitions, lists
fix   bundle virtualization
      third-party
```

Rendering choice:

``` text
Same content for everyone?
        ↓ Yes
Static / ISR

Mostly static with small personalized parts?
        ↓ Yes
Static shell + Suspense (PPR-style)

Fully personalized per request?
        ↓ Yes
Dynamic + streaming + caching of sub-data
```

------------------------------------------------------------------------

# 36. Production Checklist

``` text
- [ ] Server Components used by default
- [ ] "use client" only on interactive leaves
- [ ] Independent fetches use Promise.all
- [ ] Slow sections wrapped in Suspense
- [ ] Shared data wrapped with React cache
- [ ] Caching/revalidation strategy defined
- [ ] Static rendering preserved where possible
- [ ] cookies()/headers() used in smallest scope
- [ ] Bundle analyzed; large deps reviewed
- [ ] Heavy components loaded with next/dynamic
- [ ] Per-method imports / optimizePackageImports
- [ ] Third-party scripts loaded with next/script strategies
- [ ] LCP image optimized and prioritized
- [ ] Images have dimensions / sizes
- [ ] next/font used, minimal weights/subsets
- [ ] No layout shifts from late content
- [ ] Links prefetch appropriately
- [ ] Long lists paginated or virtualized
- [ ] Heavy updates wrapped in transitions / debounced
- [ ] DB indexes added; no N+1 queries
- [ ] Compression and CDN enabled
- [ ] Core Web Vitals measured in production (field data)
- [ ] Lighthouse CI / performance budget in CI
- [ ] Tested on throttled mobile in production mode
```

------------------------------------------------------------------------

# 37. 30-Second Revision

``` text
LCP / INP / CLS
↓
Loading / Responsiveness / Stability

Server Components
↓
Less client JavaScript

"use client"
↓
Push down to small interactive leaves

Promise.all
↓
Avoid waterfalls

Suspense + streaming
↓
Show shell first, stream slow parts

cache()
↓
Dedupe work per request

Static / ISR / caching
↓
Fastest responses

next/dynamic
↓
Split heavy components

next/script
↓
Control third-party scripts

next/image + next/font
↓
Optimized assets, stable layout

useTransition / useDeferredValue
↓
Better INP

Bundle analyzer + Lighthouse + field data
↓
Measure before and after
```

------------------------------------------------------------------------

# 38. Final Interview Answer

> "When optimizing a Next.js App Router app, I focus on Core Web Vitals
> --- LCP, INP and CLS --- and always measure first, using Lighthouse and
> the bundle analyzer in the lab and real-user data in the field. I
> default to Server Components so less JavaScript reaches the browser,
> and I push `'use client'` down to small interactive leaves. I remove
> data waterfalls with `Promise.all`, dedupe work with `React.cache`,
> stream slow sections with Suspense, and keep routes static or cached
> whenever possible, using dynamic APIs like `cookies()` only in the
> smallest scope. I reduce bundle size with dynamic imports and lighter
> dependencies, load third-party scripts with `next/script` strategies,
> and use `next/image` and `next/font` to protect LCP and CLS. For
> interaction performance I use transitions, debouncing and
> virtualization, and on the server I fix N+1 queries, add indexes and
> paginate. Finally, I set performance budgets in CI and verify results
> on a production build under throttled mobile conditions."

------------------------------------------------------------------------

# 39. One-Line Rule

> **Send less JavaScript, fetch in parallel, cache and stream
> aggressively, reserve space for everything --- and measure with real
> users.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
LCP
→ Main content speed (≤ 2.5 s)

INP
→ Interaction responsiveness (≤ 200 ms)

CLS
→ Layout stability (≤ 0.1)

Server Components
→ No client JS for server-only logic

"use client"
→ Only where interactivity is needed

Promise.all
→ Parallel independent fetches

Suspense
→ Streaming and partial loading

React cache()
→ Per-request memoization

revalidate / tags
→ Time and on-demand cache control

next/dynamic
→ Code splitting

next/script
→ Third-party script strategy

Link prefetch
→ Faster navigation

useTransition
→ Non-urgent updates, better INP

Virtualization
→ Large lists

Bundle analyzer
→ Find heavy dependencies

Lighthouse + field data
→ Verify improvements
```

### BEST GENERAL ARCHITECTURE

``` text
                PERFORMANCE SYSTEM
                        │
     ┌──────────┬───────┼────────┬───────────┐
     ▼          ▼       ▼        ▼           ▼
  Rendering   Data    Bundle   Assets    Measurement
     │          │       │        │           │
  Static/ISR  Parallel  Server   Image/    Lighthouse
  Streaming   Cache     Comps    Font      Web Vitals
  Suspense    Dedupe    Dynamic  Script    Budgets/CI
     │          │       imports    │           │
     └──────────┴───────┼────────┴───────────┘
                        ▼
              Fast + Stable + Responsive
```