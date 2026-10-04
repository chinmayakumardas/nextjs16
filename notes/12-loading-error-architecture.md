# 12 --- Loading & Error Architecture

> Next.js App Router --- `loading.tsx`, Suspense, streaming skeletons,
> `error.tsx`, `global-error.tsx`, `not-found.tsx`, `notFound()`,
> expected vs unexpected errors, error boundaries, `reset()`, logging,
> `template.tsx`, parallel routes defaults, resilience patterns, common
> mistakes & interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
               LOADING & ERROR ARCHITECTURE

                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
     Loading           Error            Missing
        │                │                │
        ▼                ▼                ▼
   loading.tsx       error.tsx        not-found.tsx
   <Suspense>        global-error     notFound()
   Skeletons         reset()
```

Think:

``` text
Every page can be in one of these states:

Loading   → data is not ready
Success   → data is ready
Error     → something failed
Empty     → no data
Not found → resource doesn't exist
```

Good architecture designs ALL states on purpose.

------------------------------------------------------------------------

# 2. Why This Matters

Without a plan:

``` text
Blank white screens
Layout jumping when data arrives
Whole app crashes from one failing component
Users stuck with no way to retry
Confusing 404 / 500 pages
Lost context (header/nav disappear on error)
```

With a plan:

``` text
Instant visual feedback
Stable layouts (low CLS)
Errors contained to the smallest area
Clear recovery paths
Meaningful 404s
Better perceived performance
```

------------------------------------------------------------------------

# 3. File Conventions

``` text
app/
├── layout.tsx
├── loading.tsx          # Suspense fallback for the segment
├── error.tsx            # Error boundary for the segment (Client Component)
├── global-error.tsx     # Root layout errors (Client Component)
├── not-found.tsx        # 404 UI
├── template.tsx         # Like layout, but re-mounts on navigation
└── dashboard/
    ├── layout.tsx
    ├── loading.tsx
    ├── error.tsx
    ├── not-found.tsx
    └── page.tsx
```

Component tree Next.js builds for a segment:

``` text
<Layout>
  <Template>
    <ErrorBoundary fallback={<Error />}>
      <Suspense fallback={<Loading />}>
        <ErrorBoundary fallback={<NotFound />}>
          <Page />
        </ErrorBoundary>
      </Suspense>
    </ErrorBoundary>
  </Template>
</Layout>
```

Key insight:

``` text
error.tsx and loading.tsx wrap the PAGE and children
They do NOT wrap the layout.tsx in the same segment
```

------------------------------------------------------------------------

# 4. `loading.tsx`

``` tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200" />
      <div className="h-40 w-full animate-pulse rounded bg-gray-200" />
    </div>
  )
}
```

What it does:

``` text
Shows instantly while the segment's page is loading
Enables streaming: layout renders first, page streams in
Navigation feels instant (the loading UI is prefetched)
Navigation is interruptible
```

Flow:

``` text
User clicks /dashboard
        ↓
Layout stays visible
        ↓
loading.tsx shows immediately
        ↓
Server finishes rendering page
        ↓
Page replaces loading UI
```

Rules:

``` text
Keep loading UI lightweight (no data fetching)
Match the final layout dimensions (prevent CLS)
It is a Server Component by default
```

------------------------------------------------------------------------

# 5. Granular Loading with `<Suspense>`

`loading.tsx` blocks the whole page area. Suspense lets parts stream
independently.

``` tsx
import { Suspense } from "react"

export default function Dashboard() {
  return (
    <>
      <h1>Dashboard</h1>                       {/* renders instantly */}

      <div className="grid grid-cols-3 gap-4">
        <Suspense fallback={<CardSkeleton />}>
          <RevenueCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <UsersCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <OrdersCard />
        </Suspense>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </>
  )
}
```

``` tsx
async function RevenueCard() {
  const revenue = await getRevenue()       // slow
  return <Card title="Revenue" value={revenue} />
}
```

Mental model:

``` text
loading.tsx      → "the whole page is loading"
<Suspense>       → "just this part is loading"
```

Best practice:

``` text
Use loading.tsx as a safety net
Use Suspense boundaries around slow data regions
Each boundary should map to a meaningful UI block
```

Avoid:

``` text
One giant boundary around everything
A boundary around every tiny element (popcorn effect)
```

------------------------------------------------------------------------

# 6. Skeleton Design

Good skeletons:

``` text
Match real content size and position
Use subtle animation
Respect prefers-reduced-motion
Don't flash for very fast loads
```

``` tsx
export function CardSkeleton() {
  return (
    <div className="rounded border p-4" role="status" aria-label="Loading">
      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-8 w-32 animate-pulse rounded bg-gray-200" />
    </div>
  )
}
```

CSS:

``` css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse { animation: none; }
}
```

Rule:

``` text
Skeleton shape ≈ final content shape
→ minimal layout shift
```

------------------------------------------------------------------------

# 7. Types of Errors

``` text
Expected errors
   ↓
Part of normal flow
Validation failed, email taken, item out of stock, 404
   ↓
Handle as VALUES / dedicated UI

Unexpected errors
   ↓
Bugs or infrastructure failures
DB down, network failure, null reference
   ↓
THROW → caught by error boundaries
```

Mapping:

``` text
Server Action validation error → return { errors }
Resource missing               → notFound()
Not authorized                 → redirect / forbidden UI
Unexpected exception           → throw → error.tsx
```

Never use thrown errors for normal control flow.

------------------------------------------------------------------------

# 8. `error.tsx`

Must be a Client Component.

``` tsx
// app/dashboard/error.tsx
"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // report to monitoring
    console.error(error)
  }, [error])

  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>We couldn't load your dashboard.</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

What `reset()` does:

``` text
Attempts to re-render the segment
If it succeeds → error UI replaced by content
If it fails again → error UI stays
```

Props:

``` text
error.message  → in production, server error messages are hidden
error.digest   → hash to match with server logs
reset          → retry rendering
```

Why `"use client"`:

``` text
Error boundaries are class-based React features
Need interactivity (reset button)
```

------------------------------------------------------------------------

# 9. Error Containment

Errors bubble to the nearest `error.tsx` above.

``` text
app/
├── error.tsx                 (root fallback)
└── dashboard/
    ├── layout.tsx            ← NOT covered by dashboard/error.tsx
    ├── error.tsx             ← covers dashboard/page and children
    └── analytics/
        ├── error.tsx         ← covers just analytics
        └── page.tsx
```

Behavior:

``` text
Analytics page throws
        ↓
analytics/error.tsx handles it
        ↓
Dashboard layout and nav remain interactive
```

Why this matters:

``` text
Contain failures to the smallest area
Keep navigation and shell usable
Offer local retry
```

Layout errors:

``` text
Error in dashboard/layout.tsx
        ↓
Handled by the PARENT segment's error.tsx
```

Component-level isolation (Client Components):

``` tsx
"use client"
import { ErrorBoundary } from "react-error-boundary"

<ErrorBoundary fallback={<p>Widget failed</p>}>
  <WeatherWidget />
</ErrorBoundary>
```

------------------------------------------------------------------------

# 10. `global-error.tsx`

Handles errors in the **root layout** (where `error.tsx` can't).

``` tsx
// app/global-error.tsx
"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <h1>Something went seriously wrong</h1>
        <button onClick={() => reset()}>Reload</button>
      </body>
    </html>
  )
}
```

Rules:

``` text
Must define its own <html> and <body>
Replaces the root layout when active
Keep it minimal and self-contained
Only used in production (dev shows the error overlay)
```

Think:

``` text
error.tsx        → segment-level safety net
global-error.tsx → last line of defense
```

------------------------------------------------------------------------

# 11. `not-found.tsx` and `notFound()`

Trigger a 404 from data fetching:

``` tsx
// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation"

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  return <article>{post.title}</article>
}
```

Custom UI:

``` tsx
// app/blog/[slug]/not-found.tsx
import Link from "next/link"

export default function NotFound() {
  return (
    <div>
      <h2>Post not found</h2>
      <p>The article you're looking for doesn't exist.</p>
      <Link href="/blog">Back to blog</Link>
    </div>
  )
}
```

Global 404:

``` text
app/not-found.tsx
→ shown for unmatched URLs and notFound() with no closer boundary
```

Notes:

``` text
notFound() sets HTTP status 404 (when not already streaming)
Works like redirect(): it throws, don't catch it
Don't return 200 with "not found" text (bad for SEO)
Use 404 to hide resources the user shouldn't know exist
```

------------------------------------------------------------------------

# 12. Streaming and Status Codes

Important behavior:

``` text
Once streaming starts, the HTTP status is already sent (200)
```

Implications:

``` text
notFound() inside a streamed Suspense boundary
→ UI shows 404 content but the status may remain 200
  (Next.js adds a noindex meta tag in this case)

To get a real 404 status:
→ Call notFound() before streaming begins
  (e.g. in the page/layout, before the first Suspense boundary resolves)
```

Pattern:

``` tsx
export default async function Page({ params }) {
  const { id } = await params
  const product = await getProduct(id)       // await BEFORE rendering shell
  if (!product) notFound()                   // proper 404 status

  return (
    <>
      <ProductInfo product={product} />
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews id={id} />                  // stream slower parts
      </Suspense>
    </>
  )
}
```

Rule:

``` text
Check existence early
Stream non-critical content
```

------------------------------------------------------------------------

# 13. Expected Errors in Server Actions

Return errors, don't throw.

``` ts
"use server"

export async function addToCart(prev: State, formData: FormData): Promise<State> {
  const id = String(formData.get("productId"))
  const product = await getProduct(id)

  if (!product) return { error: "Product no longer exists" }
  if (product.stock < 1) return { error: "Out of stock" }

  await cart.add(product)
  return { success: true }
}
```

``` tsx
"use client"
const [state, action, pending] = useActionState(addToCart, {})

return (
  <form action={action}>
    <input type="hidden" name="productId" value={id} />
    <button disabled={pending}>Add to cart</button>
    {state.error && <p role="alert">{state.error}</p>}
  </form>
)
```

Unexpected failure:

``` ts
throw new Error("Cart service unavailable")   // → nearest error.tsx
```

Calls from event handlers (not forms):

``` tsx
"use client"
startTransition(async () => {
  try {
    await archive(id)
  } catch {
    setError("Could not archive. Try again.")
  }
})
```

Note: errors thrown during a Server Action called from an event handler
are not automatically caught by `error.tsx` unless re-thrown during
rendering. Handle them explicitly.

See: `08-server-actions-functions.md`.

------------------------------------------------------------------------

# 14. Error Messages in Production

Next.js hides server error details from the client:

``` text
Development → full message + stack
Production  → generic message + digest
```

Server logs contain the real error. Match them with `error.digest`.

Show users:

``` text
A friendly message
A retry action
A support reference (digest) for serious failures
```

Never show:

``` text
Stack traces
SQL errors
Internal paths
Secrets
```

Custom user-safe errors:

``` ts
class UserFacingError extends Error {}

// In actions, catch and return { error: err.message } only for safe errors
```

------------------------------------------------------------------------

# 15. Logging & Monitoring

Report from `error.tsx`:

``` tsx
"use client"
import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
  ...
}
```

Server-side hook (`instrumentation.ts`):

``` ts
export async function onRequestError(err: unknown, request: { path: string; method: string }) {
  // send to your logging/monitoring system
  console.error("Request error", { path: request.path, method: request.method, err })
}
```

Log:

``` text
Error message + stack (server)
digest
Route / method
User ID (if available and allowed)
Request ID
Release/version
```

Alert on:

``` text
Spikes in 5xx
New error types after deploy
Error boundary renders (client)
```

------------------------------------------------------------------------

# 16. `template.tsx` and Re-mounting

`layout.tsx` persists across navigation. `template.tsx` re-mounts.

``` tsx
// app/template.tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="fade-in">{children}</div>
}
```

Use template when you need:

``` text
Enter/exit animations on every navigation
Resetting state on each navigation
Re-running effects (e.g. page view logging)
```

Remember:

``` text
Layout   → state preserved, no re-render between sibling pages
Template → new instance for each navigation
```

------------------------------------------------------------------------

# 17. Parallel Routes: Loading & Errors

With parallel routes (`@analytics`, `@team`), each slot can have its own:

``` text
app/dashboard/
├── layout.tsx
├── page.tsx
├── @analytics/
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
└── @team/
    ├── page.tsx
    ├── loading.tsx
    └── error.tsx
```

``` tsx
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <>
      {children}
      {analytics}
      {team}
    </>
  )
}
```

Benefit:

``` text
Slots load and fail independently
Analytics failing doesn't break Team
```

Also provide `default.tsx` for unmatched slots on hard navigation.

------------------------------------------------------------------------

# 18. Empty States

Empty is not loading and not error.

``` tsx
export default async function Orders() {
  const orders = await getOrders()

  if (orders.length === 0) {
    return (
      <div className="text-center">
        <h2>No orders yet</h2>
        <p>When you place an order, it will appear here.</p>
        <Link href="/products">Browse products</Link>
      </div>
    )
  }

  return <OrderList orders={orders} />
}
```

Good empty states:

``` text
Explain why it's empty
Offer a next action
Don't look like an error
```

Search with no results:

``` text
"No results for 'xyz'. Try different keywords."
```

------------------------------------------------------------------------

# 19. Retry & Recovery Patterns

``` text
Transient failure (network)    → automatic retry with backoff
User-triggered retry           → reset() button
Stale data available           → show stale + banner "Couldn't refresh"
Partial failure                → render available sections, error in one
Total failure                  → global-error with reload
```

Retry in fetch helper:

``` ts
export async function fetchWithRetry(url: string, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
      if (res.status < 500) throw new Error(`Client error ${res.status}`)   // don't retry 4xx
    } catch (e) {
      if (attempt === retries - 1) throw e
    }
    await new Promise((r) => setTimeout(r, 2 ** attempt * 200))             // backoff
  }
  throw new Error("Unreachable")
}
```

Graceful degradation:

``` tsx
async function Recommendations() {
  try {
    const items = await getRecommendations()
    return <List items={items} />
  } catch {
    return null              // non-critical: hide quietly instead of breaking the page
  }
}
```

Choose carefully:

``` text
Critical content  → let it fail to error.tsx
Non-critical      → degrade gracefully
```

------------------------------------------------------------------------

# 20. Client-Side Loading States

For client interactions:

``` tsx
"use client"
import { useTransition } from "react"

const [isPending, startTransition] = useTransition()

<button onClick={() => startTransition(() => router.push("/reports"))}>
  {isPending ? "Loading..." : "Reports"}
</button>
```

Navigation pending indicator:

``` tsx
"use client"
import { useLinkStatus } from "next/link"

function Spinner() {
  const { pending } = useLinkStatus()
  return pending ? <span aria-hidden>…</span> : null
}
```

(`useLinkStatus` is available in newer versions; check your version.)

Other tools:

``` text
useFormStatus     → form submit pending
useActionState    → action pending
useOptimistic     → instant UI
Top progress bar  → global route transitions (e.g. nextjs-toploader)
```

------------------------------------------------------------------------

# 21. Accessibility

``` text
aria-busy="true" on loading regions
role="status" / aria-live="polite" for loading announcements
role="alert" for error messages
Move focus to the error heading or retry button when appropriate
Don't remove focus context on navigation
Provide text, not just spinners
Respect prefers-reduced-motion
```

Error UI:

``` tsx
<div role="alert">
  <h2 tabIndex={-1} ref={headingRef}>Something went wrong</h2>
  <button onClick={reset}>Try again</button>
</div>
```

Loading UI:

``` tsx
<div role="status" aria-live="polite">
  <span className="sr-only">Loading dashboard</span>
  <Skeleton />
</div>
```

------------------------------------------------------------------------

# 22. Common Mistakes

``` text
❌ No loading.tsx or Suspense → blank/frozen UI
❌ error.tsx without "use client"
❌ Expecting error.tsx to catch layout errors in the same segment
❌ No global-error.tsx for root layout failures
❌ Using try/catch around notFound() or redirect()
❌ Throwing errors for validation instead of returning them
❌ Skeletons that don't match final layout (CLS)
❌ One giant Suspense boundary (no independent streaming)
❌ Too many tiny boundaries (popcorn loading)
❌ Showing raw error messages to users
❌ No retry option on error screens
❌ Returning "Not found" text with HTTP 200
❌ Not logging errors / ignoring digest
❌ Treating empty data as an error
❌ Swallowing all errors silently
```

------------------------------------------------------------------------

# 23. Interview Questions

### Q1. What does `loading.tsx` do?

It creates an instant Suspense fallback for a route segment, enabling
streaming and fast perceived navigation.

### Q2. `loading.tsx` vs `<Suspense>`?

`loading.tsx` wraps the whole segment's page; `<Suspense>` boundaries
let individual components stream independently.

### Q3. Why must `error.tsx` be a Client Component?

Error boundaries are client-side React features, and it needs
interactivity like the `reset` function.

### Q4. What does `reset()` do?

Retries rendering the errored segment.

### Q5. Does `error.tsx` catch errors in the same segment's `layout.tsx`?

No. It wraps the page and children below the layout. Layout errors
bubble to the parent segment's `error.tsx`.

### Q6. When use `global-error.tsx`?

For errors in the root layout; it must include its own `<html>` and
`<body>`.

### Q7. How do you show a 404?

Call `notFound()` and provide a `not-found.tsx` for the UI.

### Q8. Expected vs unexpected errors?

Expected errors (validation, missing item) are handled as return values
or dedicated UI; unexpected ones are thrown and caught by error
boundaries.

### Q9. How do streaming and HTTP status codes interact?

Once streaming starts the status is sent, so `notFound()` after
streaming begins may not change the status; check existence before
streaming.

### Q10. What is `error.digest`?

A hash that identifies the server-side error so you can match the
client report with server logs.

### Q11. `template.tsx` vs `layout.tsx`?

Layouts preserve state across navigation; templates create a new
instance (re-mount) on each navigation.

### Q12. How do you contain failures?

Nested `error.tsx` files, Suspense boundaries, parallel route slots and
component-level error boundaries.

### Q13. How do you avoid layout shift with loading UI?

Make skeletons match final content dimensions.

------------------------------------------------------------------------

# 24. Interview Failure Points

Avoid:

``` text
❌ "loading.tsx and Suspense are the same."

❌ "error.tsx catches everything."

❌ "I'll wrap everything in try/catch and return null."

❌ "A spinner is enough for a loading state."

❌ "404 pages are just a design detail."

❌ "Errors should show the full message to help users."
```

Better mental model:

``` text
Loading
 ↓
Stream shell first + skeletons that match layout

Errors
 ↓
Contain locally, recover with reset(), report with digest

Not found
 ↓
notFound() + not-found.tsx + correct status

Expected failures
 ↓
Return values / dedicated UI

Unexpected failures
 ↓
Throw → boundary → log → alert
```

------------------------------------------------------------------------

# 25. Real-World E-Commerce Architecture

``` text
app/
├── layout.tsx                     # header, footer (persistent)
├── error.tsx                      # generic recoverable error
├── global-error.tsx               # root crash
├── not-found.tsx                  # site-wide 404
├── products/
│   ├── loading.tsx                # grid skeleton
│   ├── error.tsx
│   └── [slug]/
│       ├── page.tsx               # notFound() if missing
│       ├── not-found.tsx          # "Product not found" + suggestions
│       └── loading.tsx            # product skeleton
└── checkout/
    ├── error.tsx                  # payment-safe messaging + retry
    └── page.tsx
```

Product page streaming:

``` text
Shell (title, images, price)        ← instant after existence check
<Suspense> stock / delivery info    ← streamed
<Suspense> reviews                  ← streamed
<Suspense> recommendations          ← streamed, failures hidden quietly
```

Error behavior:

``` text
Reviews service down      → reviews section shows "Reviews unavailable"
Recommendations fail      → section hidden
Product DB down           → products/error.tsx with retry
Unknown slug              → 404 with search + popular products
Root layout crashes       → global-error.tsx
```

------------------------------------------------------------------------

# 26. Decision Tree

``` text
Something might not be ready or might fail
              │
              ▼
Is it slow data?
       │
   ┌───┴───┐
   ▼       ▼
  Yes      No
   │       │
   ▼       ▼
Whole page  Is it missing?
or part?        │
   │        ┌───┴───┐
 ┌─┴──┐     ▼       ▼
 ▼    ▼    Yes      No
Page  Part  │       │
 │    │     ▼       ▼
loading Suspense  notFound()   Could it throw?
.tsx    boundary  not-found.tsx    │
                              ┌────┴────┐
                              ▼         ▼
                          Expected   Unexpected
                              │         │
                              ▼         ▼
                         Return value  error.tsx
                         / inline UI   (+ reset, logging)
```

------------------------------------------------------------------------

# 27. Production Checklist

``` text
- [ ] Root error.tsx and global-error.tsx exist
- [ ] Root not-found.tsx exists
- [ ] loading.tsx for major route segments
- [ ] Suspense boundaries around slow data regions
- [ ] Skeletons match final layout (no CLS)
- [ ] error.tsx are Client Components with reset()
- [ ] Errors contained at meaningful boundaries
- [ ] Layout errors considered (parent boundary)
- [ ] notFound() used for missing resources with real 404 status
- [ ] Existence checks happen before streaming starts
- [ ] Expected errors returned, not thrown
- [ ] No sensitive info shown in error UI
- [ ] error.digest logged and monitored
- [ ] Monitoring (Sentry/OTel) reports client and server errors
- [ ] Non-critical sections degrade gracefully
- [ ] Empty states designed
- [ ] Accessible loading and error announcements
- [ ] Retry / recovery paths provided
- [ ] Tested: slow network, API failure, 404, offline
```

------------------------------------------------------------------------

# 28. 30-Second Revision

``` text
loading.tsx
↓
Instant segment fallback (streaming)

<Suspense>
↓
Granular loading for components

Skeleton
↓
Match final layout

error.tsx
↓
Client boundary for segment + reset()

global-error.tsx
↓
Root layout failures (own html/body)

not-found.tsx + notFound()
↓
404 UI and status

Expected errors
↓
Return values

Unexpected errors
↓
Throw → boundary

digest
↓
Match client error to server log

template.tsx
↓
Re-mounts on navigation

Parallel routes
↓
Independent loading/error per slot
```

------------------------------------------------------------------------

# 29. Final Interview Answer

> "I design loading and error handling as part of the architecture. For
> loading, I use `loading.tsx` as a segment-level fallback and add
> Suspense boundaries around slow data regions so the shell and fast
> content stream first, with skeletons that match the final layout to
> avoid layout shift. For errors, I distinguish expected failures ---
> validation or missing items --- which I return as values or handle
> with `notFound()`, from unexpected failures, which throw to the
> nearest `error.tsx`, a Client Component that offers `reset()` and
> reports the error with its digest to monitoring. I nest error
> boundaries so failures stay local, remember that a segment's
> `error.tsx` doesn't cover its own layout, and add `global-error.tsx`
> for root layout crashes. I check resource existence before streaming
> so 404s return the correct status, degrade non-critical sections
> gracefully, design empty states, and make loading and error states
> accessible."

------------------------------------------------------------------------

# 30. One-Line Rule

> **Show something immediately, contain failures locally, give users a
> way to recover --- and log everything.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
loading.tsx
→ Segment fallback

Suspense
→ Component-level streaming

error.tsx
→ Segment error boundary ("use client")

reset()
→ Retry render

global-error.tsx
→ Root layout errors

not-found.tsx
→ 404 UI

notFound()
→ Trigger 404

error.digest
→ Link to server logs

template.tsx
→ Re-mounting layout alternative

Expected errors
→ Return values

Unexpected errors
→ Throw

Skeletons
→ Match final layout

Parallel routes
→ Independent loading/error slots
```

### BEST GENERAL ARCHITECTURE

``` text
              RESILIENT UI SYSTEM
                       │
      ┌────────────────┼────────────────┐
      ▼                ▼                ▼
   Loading           Errors          Missing
      │                │                │
 loading.tsx       error.tsx        notFound()
 <Suspense>        global-error     not-found.tsx
 Skeletons         reset()          Correct 404
 Streaming         Monitoring       Empty states
      │                │                │
      └────────────────┼────────────────┘
                       ▼
        Fast Feedback + Contained Failures
```