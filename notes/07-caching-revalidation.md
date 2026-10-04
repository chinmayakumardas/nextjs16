# 07 --- Caching & Revalidation

> Next.js App Router --- the four caches, `fetch` caching options,
> `revalidate`, tags, `revalidatePath`, `revalidateTag`,
> `unstable_cache`, React `cache`, static vs dynamic rendering, Router
> Cache, ISR, `generateStaticParams`, multi-instance caching, common
> mistakes & interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
                  CACHING IN NEXT.JS

                        │
     ┌──────────┬───────┼───────┬──────────┐
     ▼          ▼       ▼       ▼          ▼
  Request     Data     Full     Router    Browser /
  Memoization Cache    Route    Cache     CDN
                       Cache
     │          │       │        │          │
     ▼          ▼       ▼        ▼          ▼
  Same render  fetch    HTML +   Client-side  HTTP
  pass only    results  RSC      route        headers
                        payload  payload
```

Think:

``` text
Request
   ↓
Is there a cached copy?
   ↓
Yes → serve it (fast)
No  → compute → store → serve
```

Caching answers two questions:

``` text
1. What can I reuse?
2. When must I refresh it?
```

------------------------------------------------------------------------

# 2. Why Caching Matters

Caching improves:

``` text
Speed (TTFB, LCP)
Server load
Database / API cost
Scalability
Resilience when upstream is slow
```

Bad caching causes:

``` text
Stale data shown to users
Personalized data leaked to others
"I updated it but nothing changed"
Inconsistent pages across servers
```

Rule:

``` text
Cache what is the same for everyone
Never cache what is personal without keying it by user
```

------------------------------------------------------------------------

# 3. Version Warning

Caching defaults changed between Next.js versions.

``` text
Next.js 14  → fetch cached by default (force-cache)
Next.js 15  → fetch NOT cached by default
              GET Route Handlers NOT cached by default
              Router Cache: page segments staleTime = 0
Newer       → moving toward explicit "use cache" / Cache Components
```

Always check the docs for the version you run.

``` text
Do not assume. Verify.
```

This file explains the concepts first, then the common APIs.

------------------------------------------------------------------------

# 4. The Four Caches

``` text
┌──────────────────────┬───────────┬─────────────────────┬──────────────┐
│ Cache                │ Where     │ What                │ Lasts        │
├──────────────────────┼───────────┼─────────────────────┼──────────────┤
│ Request Memoization  │ Server    │ Same fetch/function │ One request  │
│ Data Cache           │ Server    │ fetch results       │ Persistent   │
│ Full Route Cache     │ Server    │ HTML + RSC payload  │ Persistent   │
│ Router Cache         │ Browser   │ RSC payload         │ Session/time │
└──────────────────────┴───────────┴─────────────────────┴──────────────┘
```

Flow:

``` text
Browser Router Cache
        ↓ miss
Full Route Cache (static pages)
        ↓ miss / dynamic
Render on server
        ↓
Data Cache (fetch results)
        ↓ miss
Database / API
```

------------------------------------------------------------------------

# 5. Request Memoization

Same request, called many times in one render pass, runs once.

``` tsx
// layout.tsx
const user = await fetch("https://api.example.com/me").then((r) => r.json())

// page.tsx
const user = await fetch("https://api.example.com/me").then((r) => r.json())
```

Mental model:

``` text
Two components ask for the same data
          ↓
One network request
```

For non-`fetch` data (database, ORM), use React `cache`:

``` ts
import { cache } from "react"

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } })
})
```

Notes:

``` text
Lasts only for the current server render
Applies to GET requests with the same URL + options
Not shared between users or requests
```

So you can fetch where you need data instead of drilling props.

------------------------------------------------------------------------

# 6. Data Cache

Stores `fetch` results across requests and deployments (until
revalidated).

``` tsx
// Cache indefinitely until revalidated
await fetch("https://api.example.com/products", {
  cache: "force-cache",
})

// Never cache
await fetch("https://api.example.com/cart", {
  cache: "no-store",
})

// Time-based revalidation
await fetch("https://api.example.com/products", {
  next: { revalidate: 3600 },        // seconds
})

// Tag for on-demand invalidation
await fetch("https://api.example.com/products", {
  next: { tags: ["products"] },
})
```

Mental model:

``` text
cache: "force-cache"   → remember
cache: "no-store"      → always fresh
next.revalidate        → remember for N seconds
next.tags              → label so I can invalidate it later
```

------------------------------------------------------------------------

# 7. Time-Based Revalidation (ISR Idea)

``` tsx
await fetch(url, { next: { revalidate: 60 } })
```

Flow (stale-while-revalidate):

``` text
t=0     Request → fetch → cache (fresh)
t=30    Request → serve cached
t=61    Request → serve cached (stale) + refresh in background
t=62    Request → serve new data
```

Segment-level:

``` tsx
// page.tsx or layout.tsx
export const revalidate = 3600
```

Meaning:

``` text
This route can be reused for up to 1 hour
then regenerated in the background
```

Rule:

``` text
The lowest revalidate value among fetches/segment config
controls the route's freshness
```

Good for:

``` text
Blog posts
Product catalogs
Marketing pages
Public listings
```

------------------------------------------------------------------------

# 8. On-Demand Revalidation

Time-based is a guess. On-demand is exact.

``` text
Data changes
     ↓
You tell Next.js
     ↓
Cache is invalidated
     ↓
Next request regenerates
```

### `revalidatePath`

``` ts
"use server"
import { revalidatePath } from "next/cache"

export async function updatePost(id: string, data: PostInput) {
  await db.post.update({ where: { id }, data })

  revalidatePath("/blog")                  // list page
  revalidatePath(`/blog/${data.slug}`)     // detail page
}
```

Layout / dynamic segment forms:

``` ts
revalidatePath("/blog/[slug]", "page")
revalidatePath("/dashboard", "layout")     // layout and everything under it
```

### `revalidateTag`

``` ts
"use server"
import { revalidateTag } from "next/cache"

export async function createProduct(data: ProductInput) {
  await db.product.create({ data })
  revalidateTag("products")
}
```

Tagged fetch:

``` tsx
await fetch(url, { next: { tags: ["products"] } })
```

Note: newer versions change the `revalidateTag` signature (a cache-life
profile argument) and add APIs like `updateTag` / `refresh` for Server
Actions. Check the docs for your version.

Choosing:

``` text
revalidatePath → "this URL changed"
revalidateTag  → "this DATA changed, wherever it's used"
```

Tags scale better in larger apps.

------------------------------------------------------------------------

# 9. Webhook-Driven Revalidation

CMS or backend tells your app to refresh.

``` ts
// app/api/revalidate/route.ts
import { revalidateTag } from "next/cache"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret")

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { tag } = await req.json()
  revalidateTag(tag)

  return Response.json({ revalidated: true, now: Date.now() })
}
```

Flow:

``` text
Editor publishes in CMS
        ↓
CMS calls POST /api/revalidate
        ↓
Next.js invalidates tag "posts"
        ↓
Next visitor gets fresh content
```

Always authenticate this endpoint.

------------------------------------------------------------------------

# 10. `unstable_cache` (Database Queries)

`fetch` options don't apply to ORM calls. Wrap them:

``` ts
import { unstable_cache } from "next/cache"

export const getProducts = unstable_cache(
  async () => db.product.findMany(),
  ["products"],                           // cache key parts
  { revalidate: 3600, tags: ["products"] }
)
```

With parameters:

``` ts
export const getProduct = (id: string) =>
  unstable_cache(
    async () => db.product.findUnique({ where: { id } }),
    ["product", id],                      // include the param in the key
    { tags: ["products", `product-${id}`] }
  )()
```

Rules:

``` text
Key must include everything that changes the result
Do not read cookies()/headers() inside the cached function
Pass user-specific values as arguments (part of the key)
```

Note: newer Next.js versions favor the `"use cache"` directive; the
concept stays the same.

------------------------------------------------------------------------

# 11. `"use cache"` Direction (Newer Versions)

Idea:

``` tsx
"use cache"

export async function getProducts() {
  return db.product.findMany()
}
```

with cache lifetime/tag helpers:

``` ts
import { cacheLife, cacheTag } from "next/cache"

cacheLife("hours")
cacheTag("products")
```

Mental model:

``` text
Old model: everything implicit, opt out of caching
New model: dynamic by default, opt in to caching explicitly
```

This is enabled through configuration in versions that support it.
Verify against your installed version before using it.

------------------------------------------------------------------------

# 12. Full Route Cache

Static routes are rendered at build time (or on first request) and
stored.

``` text
Route is static
     ↓
HTML + RSC payload stored
     ↓
Served instantly
```

Routes become dynamic when they use:

``` text
cookies()
headers()
searchParams (in a page)
connection()
fetch with cache: "no-store"
export const dynamic = "force-dynamic"
export const revalidate = 0
```

Check in the build output:

``` text
○ Static
● SSG (generateStaticParams)
ƒ Dynamic
```

Segment config:

``` tsx
export const dynamic = "force-static"     // force static
export const dynamic = "force-dynamic"    // force dynamic
export const dynamicParams = true         // allow params not pre-built
```

------------------------------------------------------------------------

# 13. `generateStaticParams`

Pre-build dynamic routes:

``` tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export const dynamicParams = true   // others rendered on demand, then cached
```

Result:

``` text
Known slugs → built ahead of time
Unknown slugs → rendered on first visit, then cached
dynamicParams = false → unknown slugs return 404
```

Combine with revalidation:

``` tsx
export const revalidate = 3600
```

This is classic ISR: static speed, fresh content.

------------------------------------------------------------------------

# 14. Router Cache (Client)

The browser caches RSC payloads for visited/prefetched routes.

``` text
User clicks link
      ↓
Router Cache hit?
      ↓
Yes → instant navigation
No  → fetch from server
```

Behavior (Next.js 15 defaults, approximate):

``` text
Page segments        → not reused by default (staleTime 0)
Layouts / loading    → reused
Prefetched static    → cached for a longer window
Prefetched dynamic   → short window
```

Control it:

``` ts
// next.config.ts
const nextConfig = {
  experimental: {
    staleTimes: { dynamic: 30, static: 180 },
  },
}
```

Refresh from the client:

``` tsx
"use client"
import { useRouter } from "next/navigation"

const router = useRouter()
router.refresh()        // refetch current route's server data
```

Server Actions that call `revalidatePath` / `revalidateTag` also
invalidate the Router Cache.

------------------------------------------------------------------------

# 15. Opting Out of Caching

Per request:

``` tsx
await fetch(url, { cache: "no-store" })
```

Per route:

``` tsx
export const dynamic = "force-dynamic"
```

Using dynamic APIs:

``` tsx
import { cookies } from "next/headers"

const token = (await cookies()).get("token")   // route becomes dynamic
```

Use dynamic rendering for:

``` text
Personalized pages (dashboards, carts)
Real-time data
Anything depending on the request
```

Tip:

``` text
Keep the dynamic part small
Wrap it in Suspense
Let the rest stay static
```

------------------------------------------------------------------------

# 16. Route Handler Caching

``` ts
// app/api/products/route.ts
export const dynamic = "force-static"
export const revalidate = 600

export async function GET() {
  const products = await getProducts()
  return Response.json(products)
}
```

Notes:

``` text
In newer versions GET handlers are dynamic by default
Opt in to static with `dynamic = "force-static"`
POST/PUT/DELETE are never cached
Using the Request object makes a handler dynamic
```

Also set HTTP cache headers for CDN:

``` ts
return Response.json(data, {
  headers: {
    "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
  },
})
```

------------------------------------------------------------------------

# 17. Caching and Personalization

Danger:

``` text
Personalized response cached
        ↓
Served to another user
        ↓
Data leak
```

Rules:

``` text
Never cache responses that depend on cookies/session without keying
Use Cache-Control: private for per-user HTTP responses
Keep user data in dynamic regions
Pass userId as part of cache keys when caching user-specific data
```

Pattern:

``` text
Static shell (cached)
   +
<Suspense> dynamic user section (not cached)
```

------------------------------------------------------------------------

# 18. Multi-Instance Caching

Default caches live on the server file system / memory.

``` text
Instance A revalidates /blog
Instance B still serves old /blog
```

Fix with a shared cache handler:

``` ts
// next.config.ts
const nextConfig = {
  cacheHandler: require.resolve("./cache-handler.js"),
  cacheMaxMemorySize: 0,
}
```

Backed by Redis / object storage or a managed platform.

See: `18-deployment.md`.

------------------------------------------------------------------------

# 19. Choosing a Strategy

``` text
Content                         Strategy
────────────────────────────────────────────────────────────
Marketing page                  Static
Blog post                       Static + tag revalidation
Product catalog                 ISR (revalidate) + tags
Product price / stock           Short revalidate or dynamic
Dashboard                       Dynamic (+ cached sub-queries)
Cart / checkout                 Dynamic, no-store
Search results                  Dynamic or short cache
User profile                    Dynamic / keyed by user
Public API (GET)                Cache-Control + revalidate
```

Decision:

``` text
Same for everyone?
   Yes → cache it
   No  → dynamic (or cache with user key)

Changes rarely?
   Yes → long cache + on-demand revalidation
   No  → short revalidate or no-store
```

------------------------------------------------------------------------

# 20. Common Mistakes

``` text
❌ Assuming fetch is cached (or not) without checking the version
❌ Forgetting to revalidate after a mutation
❌ Using revalidatePath for everything instead of tags
❌ Caching user-specific data globally
❌ Reading cookies() in a layout and making everything dynamic
❌ Missing parameters in unstable_cache keys
❌ Unauthenticated revalidation endpoints
❌ Not testing with a production build
❌ Expecting changes to show instantly in the Router Cache
❌ Multi-instance deployment without shared cache
❌ Very long revalidate with no on-demand path
❌ Caching error responses
```

------------------------------------------------------------------------

# 21. Debugging Cache Issues

Stale data:

``` text
Run next build && next start (dev behaves differently)
Check route type in build output (○ ● ƒ)
Check fetch options and segment config
Check whether a revalidate call actually runs
Check tag names match exactly
Check CDN / browser cache headers
Check multiple instances
```

Too slow / too dynamic:

``` text
Look for cookies()/headers()/searchParams usage
Look for cache: "no-store"
Look for force-dynamic
Look for uncached DB queries
```

Logging fetch cache status in dev:

``` ts
// next.config.ts
logging: { fetches: { fullUrl: true } }
```

------------------------------------------------------------------------

# 22. Interview Questions

### Q1. What are the main caches in Next.js?

Request Memoization, Data Cache, Full Route Cache and the client-side
Router Cache.

### Q2. What is request memoization?

Identical `fetch` calls (or `cache`-wrapped functions) in a single
render pass run once.

### Q3. How does time-based revalidation work?

`revalidate: N` serves cached data and, after N seconds, refreshes it in
the background (stale-while-revalidate).

### Q4. `revalidatePath` vs `revalidateTag`?

Path invalidates a URL's cache. Tag invalidates all cached data labeled
with that tag, wherever it is used.

### Q5. How do you cache a database query?

Wrap it with `unstable_cache` (or `"use cache"` in newer versions) and
React `cache` for per-request dedupe.

### Q6. What makes a route dynamic?

Using `cookies()`, `headers()`, `searchParams`, uncached fetches, or
`force-dynamic`.

### Q7. What is `generateStaticParams`?

It pre-renders dynamic route params at build time; others render on
demand depending on `dynamicParams`.

### Q8. What is the Router Cache?

A client-side cache of RSC payloads that makes navigation fast.

### Q9. How do you refresh data after a mutation?

Call `revalidatePath` / `revalidateTag` in the Server Action (and
`router.refresh()` on the client if needed).

### Q10. What changed in Next.js 15 about caching?

`fetch` and GET Route Handlers are no longer cached by default, and page
segments are not reused by default in the Router Cache.

### Q11. How do you avoid leaking personalized data?

Don't cache per-user responses globally; use dynamic rendering, private
cache headers or user-keyed cache entries.

### Q12. What is a problem with caching in multi-instance deployments?

Each instance has its own local cache, so you need a shared cache
handler for consistency.

------------------------------------------------------------------------

# 23. Interview Failure Points

Avoid:

``` text
❌ "Next.js caches everything automatically."

❌ "revalidate means the page updates exactly every N seconds."

❌ "Caching is only a performance concern."

❌ "I'll just set no-store everywhere to be safe."

❌ "Dev mode shows how production caching behaves."
```

Better mental model:

``` text
Default
 ↓
Know your version's defaults

Static data
 ↓
Cache + tag + revalidate on change

Personal data
 ↓
Dynamic or keyed by user

Mutation
 ↓
Always invalidate affected data

Production
 ↓
Test with build + start
```

------------------------------------------------------------------------

# 24. Real-World E-Commerce Caching

``` text
                    E-COMMERCE
                        │
     ┌──────────┬───────┼────────┬──────────┐
     ▼          ▼       ▼        ▼          ▼
  Home        Category  Product   Cart     Checkout
     │          │         │        │          │
  Static      ISR +     ISR +    Dynamic    Dynamic
  + revalidate tags     tags +   no-store   no-store
                        Suspense
                        for stock
```

Flow after admin edits a product:

``` text
Admin saves product
      ↓
Server Action updates DB
      ↓
revalidateTag("products") + revalidateTag(`product-${id}`)
      ↓
Category and product pages refresh on next request
```

------------------------------------------------------------------------

# 25. Production Checklist

``` text
- [ ] Know the caching defaults of your Next.js version
- [ ] Static routes verified in build output
- [ ] Fetches have explicit cache/revalidate strategy
- [ ] Tags used for shared data
- [ ] Mutations call revalidatePath / revalidateTag
- [ ] DB queries cached with unstable_cache / use cache
- [ ] Cache keys include all varying inputs
- [ ] Personalized data is dynamic or user-keyed
- [ ] cookies()/headers() isolated to small components
- [ ] Revalidation webhook is authenticated
- [ ] Cache-Control headers set for public API responses
- [ ] Shared cache handler for multiple instances
- [ ] Tested with next build && next start
- [ ] Stale-data scenarios tested after mutations
```

------------------------------------------------------------------------

# 26. 30-Second Revision

``` text
Request memoization
↓
Dedupe within one render

Data cache
↓
Persist fetch results

Full route cache
↓
Persist static HTML + RSC

Router cache
↓
Client navigation cache

revalidate
↓
Time-based refresh

revalidatePath / revalidateTag
↓
On-demand refresh

unstable_cache / use cache
↓
Cache non-fetch data

cookies() / headers()
↓
Make routes dynamic

Next.js 15
↓
Less implicit caching, more explicit control
```

------------------------------------------------------------------------

# 27. Final Interview Answer

> "Next.js has layered caching: request memoization for deduping within
> a render, a persistent data cache for fetch results, a full route
> cache for static HTML and RSC payloads, and a client Router Cache for
> fast navigation. I check the defaults of my Next.js version, because
> recent versions moved toward explicit caching. For public content I
> use static rendering or ISR with time-based `revalidate`, and I tag
> data so mutations can call `revalidateTag` or `revalidatePath` right
> after a Server Action or webhook. For database queries I use
> `unstable_cache` or `use cache` with proper keys, and for per-request
> dedupe I use React `cache`. I keep personalized data dynamic or keyed
> per user so nothing leaks, isolate `cookies()` and `headers()` to
> small Suspense regions, and use a shared cache handler when running
> multiple instances. I always verify behavior with a production
> build."

------------------------------------------------------------------------

# 28. One-Line Rule

> **Cache what's shared, keep what's personal dynamic, and always
> invalidate when data changes.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
Request Memoization
→ Same call, one render

Data Cache
→ Persistent fetch results

Full Route Cache
→ Static route output

Router Cache
→ Client navigation cache

cache: "force-cache"
→ Cache

cache: "no-store"
→ Don't cache

next.revalidate
→ Time-based refresh

next.tags
→ Label cached data

revalidatePath
→ Invalidate a route

revalidateTag
→ Invalidate by tag

unstable_cache
→ Cache non-fetch work

generateStaticParams
→ Pre-render params

force-dynamic
→ Always render per request

router.refresh()
→ Refetch current route on client
```

### BEST GENERAL ARCHITECTURE

``` text
                  CACHE SYSTEM
                       │
     ┌─────────────────┼─────────────────┐
     ▼                 ▼                 ▼
  Read path        Write path        Safety
     │                 │                 │
  Static / ISR     Server Action     No global
  Tagged fetch     revalidateTag     caching of
  Memoized         revalidatePath    personal data
  DB queries       Webhooks          Shared cache
     │                 │             for scale
     └─────────────────┼─────────────────┘
                       ▼
             Fast + Fresh + Correct
```