# 09 --- Route Handlers

> Next.js App Router --- `route.ts`, HTTP methods, `Request` /
> `NextRequest`, `NextResponse`, dynamic params, query strings, body
> parsing, cookies & headers, caching, streaming, CORS, webhooks,
> authentication, error handling, Route Handlers vs Server Actions,
> common mistakes & interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
                 ROUTE HANDLERS

   Any client                          Next.js
 (browser, mobile,                 ┌──────────────┐
  webhook, curl)    HTTP request   │  route.ts    │
  ───────────────────────────────► │  GET / POST  │
  ◄─────────────────────────────── │  PUT / DELETE│
        HTTP response              └──────────────┘
```

Think:

``` text
page.tsx   → returns UI
route.ts   → returns a Response
```

Route Handlers are the App Router's way to build:

``` text
REST-style APIs
Webhook receivers
File downloads
Streaming endpoints
Auth callbacks (OAuth)
Public integration endpoints
```

They use the standard Web `Request` and `Response` APIs.

------------------------------------------------------------------------

# 2. Why Route Handlers Matter

Use them when you need:

``` text
A stable, public URL
Non-React consumers (mobile apps, partners)
Webhooks (Stripe, GitHub, CMS)
Custom HTTP methods and headers
Non-HTML responses (JSON, CSV, PDF, images, XML)
Streaming / Server-Sent Events
```

Do not use them for:

``` text
Fetching data to render your own pages
   → Server Components can query data directly

Mutations from your own forms
   → Server Actions
```

Avoid the "fetch my own API from a Server Component" anti-pattern:

``` text
Server Component → fetch("/api/products") → Route Handler → DB   ❌
Server Component → DB / service function                         ✅
```

------------------------------------------------------------------------

# 3. Creating a Route Handler

File convention:

``` text
app/
└── api/
    └── hello/
        └── route.ts      →  /api/hello
```

``` ts
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: "Hello" })
}
```

Supported methods:

``` text
GET
POST
PUT
PATCH
DELETE
HEAD
OPTIONS
```

Rules:

``` text
File must be named route.ts / route.js
A route.ts cannot live in the same segment as page.tsx
Unsupported methods automatically return 405
OPTIONS is auto-implemented if you don't define it
```

Conflict example:

``` text
app/dashboard/page.tsx
app/dashboard/route.ts      ❌ conflict (same URL)
```

------------------------------------------------------------------------

# 4. All Methods Example

``` ts
// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const posts = await db.post.findMany({ take: 20 })
  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const post = await db.post.create({ data: body })
  return NextResponse.json(post, { status: 201 })
}
```

``` ts
// app/api/posts/[id]/route.ts
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const post = await db.post.findUnique({ where: { id } })

  if (!post) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json(post)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  const post = await db.post.update({ where: { id }, data })
  return Response.json(post)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.post.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
```

Note: in Next.js 15+, `params` is a **Promise** and must be awaited.

------------------------------------------------------------------------

# 5. Request Data

### Query string

``` ts
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get("q")
  const page = Number(searchParams.get("page") ?? 1)

  return Response.json({ q, page })
}
```

URL:

``` text
/api/search?q=shoes&page=2
```

### JSON body

``` ts
export async function POST(request: Request) {
  const body = await request.json()
  return Response.json({ received: body })
}
```

### Form data

``` ts
const formData = await request.formData()
const name = formData.get("name")
```

### Raw text (webhooks)

``` ts
const raw = await request.text()
```

### Headers & cookies

``` ts
import { cookies, headers } from "next/headers"

export async function GET() {
  const token = (await cookies()).get("token")?.value
  const ua = (await headers()).get("user-agent")
  return Response.json({ token: !!token, ua })
}
```

------------------------------------------------------------------------

# 6. Responses

``` ts
// JSON
return Response.json(data)
return NextResponse.json(data, { status: 201 })

// Plain text
return new Response("OK")

// No content
return new Response(null, { status: 204 })

// Redirect
return NextResponse.redirect(new URL("/login", request.url))

// Custom headers
return Response.json(data, {
  headers: { "Cache-Control": "no-store", "X-Request-Id": id },
})

// Set cookie
const res = NextResponse.json({ ok: true })
res.cookies.set("session", token, { httpOnly: true, secure: true, sameSite: "lax" })
return res
```

Common status codes:

``` text
200 OK
201 Created
204 No Content
400 Bad Request           → invalid input
401 Unauthorized          → not authenticated
403 Forbidden             → authenticated but not allowed
404 Not Found
409 Conflict              → duplicate / state conflict
422 Unprocessable Entity  → validation failed
429 Too Many Requests     → rate limited
500 Internal Server Error
503 Service Unavailable
```

------------------------------------------------------------------------

# 7. Validation

Always validate request data.

``` ts
import { z } from "zod"

const createPostSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().min(1),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = createPostSchema.safeParse(json)

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const post = await db.post.create({ data: parsed.data })
  return Response.json(post, { status: 201 })
}
```

Notes:

``` text
.catch(() => null) handles malformed JSON safely
Validate params and query strings too
Never pass raw request bodies directly to the database
```

------------------------------------------------------------------------

# 8. Authentication & Authorization

Route Handlers are public endpoints. Check every time.

``` ts
import { verifySession } from "@/lib/dal"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()          // returns null if not logged in
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const order = await db.order.findUnique({ where: { id } })

  if (!order || order.userId !== session.userId) {
    return Response.json({ error: "Not found" }, { status: 404 })   // hide existence
  }

  return Response.json(order)
}
```

For API clients:

``` ts
const auth = request.headers.get("authorization")
if (!auth?.startsWith("Bearer ")) {
  return Response.json({ error: "Unauthorized" }, { status: 401 })
}
const token = auth.slice(7)
```

Rule:

``` text
401 = who are you?
403 = you can't do this
404 = hide resources the user shouldn't know exist
```

See: `10-authentication-authorization.md`, `17-security.md`.

------------------------------------------------------------------------

# 9. Caching Behavior

Newer versions (Next.js 15+):

``` text
GET handlers are dynamic by default
Other methods are never cached
```

Opt in to static:

``` ts
export const dynamic = "force-static"
export const revalidate = 3600

export async function GET() {
  const data = await getCategories()
  return Response.json(data)
}
```

Notes:

``` text
Using the Request object, cookies(), or headers() → dynamic
Add Cache-Control headers for CDN caching of public data
```

CDN-friendly response:

``` ts
return Response.json(data, {
  headers: {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
  },
})
```

Never cache user-specific responses publicly:

``` ts
headers: { "Cache-Control": "private, no-store" }
```

See: `07-caching-revalidation.md`.

------------------------------------------------------------------------

# 10. Webhooks

Example: Stripe-style signed webhook.

``` ts
// app/api/webhooks/stripe/route.ts
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()                  // RAW body required
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed":
      await markOrderPaid(event.data.object)
      break
  }

  return new Response("ok")        // respond quickly
}
```

Webhook rules:

``` text
Use request.text() — signature verification needs the raw body
Verify the signature
Respond 2xx quickly; move heavy work to a queue
Make handlers idempotent (events can be delivered twice)
Log event IDs to avoid reprocessing
```

------------------------------------------------------------------------

# 11. CORS

Same-origin app calls need no CORS.

For other origins:

``` ts
const allowed = ["https://app.example.com"]

function cors(origin: string | null) {
  const allow = origin && allowed.includes(origin) ? origin : ""
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request.headers.get("origin")) })
}

export async function GET(request: Request) {
  return Response.json({ ok: true }, { headers: cors(request.headers.get("origin")) })
}
```

Remember:

``` text
CORS is enforced by browsers only
It is not authentication
Never use * with credentials
```

------------------------------------------------------------------------

# 12. Streaming & Server-Sent Events

Stream a response:

``` ts
export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 1; i <= 5; i++) {
        controller.enqueue(encoder.encode(`data: tick ${i}\n\n`))
        await new Promise((r) => setTimeout(r, 1000))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
```

Client:

``` ts
const es = new EventSource("/api/stream")
es.onmessage = (e) => console.log(e.data)
```

Use for:

``` text
Progress updates
AI/LLM token streaming
Live notifications
```

Behind a proxy, disable buffering (e.g. `X-Accel-Buffering: no` for
nginx).

------------------------------------------------------------------------

# 13. File Downloads

``` ts
export async function GET() {
  const csv = "id,name\n1,Alice\n2,Bob"

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="users.csv"',
    },
  })
}
```

Binary:

``` ts
const buffer = await generatePdf()
return new Response(buffer, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'inline; filename="invoice.pdf"',
  },
})
```

Authorize before sending any file.

------------------------------------------------------------------------

# 14. Error Handling

Centralize patterns:

``` ts
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function handler(fn: (req: Request, ctx: any) => Promise<Response>) {
  return async (req: Request, ctx: any) => {
    try {
      return await fn(req, ctx)
    } catch (err) {
      if (err instanceof ApiError) {
        return Response.json({ error: err.message }, { status: err.status })
      }
      console.error("Unhandled API error", err)
      return Response.json({ error: "Internal Server Error" }, { status: 500 })
    }
  }
}
```

Usage:

``` ts
export const GET = handler(async (req, { params }) => {
  const { id } = await params
  const item = await getItem(id)
  if (!item) throw new ApiError(404, "Not found")
  return Response.json(item)
})
```

Rules:

``` text
Consistent JSON error shape
Never leak stack traces or internals
Log details on the server
Use correct status codes
```

------------------------------------------------------------------------

# 15. Rate Limiting

``` ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous"
  const { success, reset } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) } }
    )
  }

  return Response.json({ ok: true })
}
```

Use a shared store (Redis/KV). In-memory counters fail in serverless
and multi-instance setups.

------------------------------------------------------------------------

# 16. Runtime

``` ts
export const runtime = "nodejs"   // default: full Node APIs
export const runtime = "edge"     // fast cold start, limited APIs
```

Choose:

``` text
Node.js → database drivers, fs, crypto, heavy libs
Edge    → lightweight, global, simple logic
```

Other segment config:

``` ts
export const maxDuration = 30        // seconds (platform-dependent)
export const dynamic = "force-dynamic"
```

------------------------------------------------------------------------

# 17. Route Handlers vs Server Actions

``` text
                    Route Handler            Server Action
─────────────────────────────────────────────────────────────────
Purpose             HTTP API                 UI mutation
Consumers           Anyone                   Your React app
Methods             All                      POST only
URL                 Public, stable           Internal
Response            Any (JSON, file, stream) Serialized result / UI
Webhooks            ✅                       ❌
Forms               Manual                   Native
Caching             Configurable             Not cached
```

Rule:

``` text
My own form/button → Server Action
Outside world / non-React / webhook → Route Handler
Reading data for my pages → Server Component
```

------------------------------------------------------------------------

# 18. Organizing API Code

``` text
app/
└── api/
    ├── posts/
    │   ├── route.ts           # list + create
    │   └── [id]/route.ts      # get + update + delete
    ├── webhooks/
    │   └── stripe/route.ts
    └── health/route.ts
lib/
├── services/
│   └── posts.ts               # business logic
├── validations/
│   └── posts.ts               # zod schemas
└── api.ts                     # error helpers
```

Pattern:

``` text
route.ts (thin)
   ↓
Validate
   ↓
Authorize
   ↓
Service function
   ↓
Response
```

Share service functions between Route Handlers, Server Actions and
Server Components.

------------------------------------------------------------------------

# 19. Testing Route Handlers

Direct unit test:

``` ts
import { GET } from "@/app/api/hello/route"

test("GET returns message", async () => {
  const res = await GET()
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ message: "Hello" })
})
```

With params:

``` ts
const res = await GET(new Request("http://localhost/api/posts/1"), {
  params: Promise.resolve({ id: "1" }),
})
```

Manual:

``` bash
curl -i http://localhost:3000/api/hello
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","body":"World"}'
```

------------------------------------------------------------------------

# 20. Common Mistakes

``` text
❌ Calling your own API from Server Components
❌ Putting route.ts and page.tsx in the same segment
❌ Forgetting to await params (Next.js 15+)
❌ No auth/authorization checks
❌ Trusting request bodies without validation
❌ Using request.json() for webhooks needing raw body
❌ Returning stack traces
❌ Wrong status codes (200 for errors)
❌ Caching private responses
❌ In-memory rate limiting on serverless
❌ Long-running work inside the request
❌ Ignoring idempotency in webhooks
❌ Wildcard CORS with credentials
❌ Using Route Handlers for simple form mutations
```

------------------------------------------------------------------------

# 21. Interview Questions

### Q1. What is a Route Handler?

A `route.ts` file that defines HTTP method functions using the Web
Request/Response APIs for API-style endpoints.

### Q2. How do Route Handlers differ from `pages/api`?

They use Web standard Request/Response, live in the `app` directory,
and are method-based exports instead of a single handler function.

### Q3. Can `route.ts` and `page.tsx` share a folder?

No, they would resolve to the same URL and conflict.

### Q4. How do you read query params?

`request.nextUrl.searchParams` with `NextRequest`.

### Q5. How do you read dynamic route params?

From the second argument: `{ params }` which is a Promise in newer
versions and must be awaited.

### Q6. Are GET Route Handlers cached?

Not by default in Next.js 15+. Opt in with `dynamic = 'force-static'`
and `revalidate`.

### Q7. How do you handle webhooks safely?

Read the raw body, verify the signature, respond quickly, and make
processing idempotent.

### Q8. When use a Route Handler vs Server Action?

Route Handler for public/external HTTP APIs and webhooks; Server Action
for your own UI mutations.

### Q9. How do you stream responses?

Return a `Response` with a `ReadableStream`, e.g. for SSE or LLM
output.

### Q10. How do you handle CORS?

Add the appropriate headers and implement `OPTIONS` for preflight
requests.

### Q11. Which status codes for auth issues?

401 for unauthenticated, 403 for forbidden, 404 to hide resources.

### Q12. Should Server Components fetch from your own Route Handlers?

No. Call shared service/DB functions directly to avoid extra network
hops.

------------------------------------------------------------------------

# 22. Interview Failure Points

Avoid:

``` text
❌ "I create API routes for everything."

❌ "Route Handlers are automatically protected."

❌ "CORS secures my API."

❌ "Webhooks don't need signature verification."

❌ "200 OK with an error message is fine."
```

Better mental model:

``` text
Route Handler
 ↓
Public HTTP boundary

Inside it
 ↓
Validate → authorize → service → response

For UI mutations
 ↓
Prefer Server Actions

For reads in pages
 ↓
Prefer Server Components
```

------------------------------------------------------------------------

# 23. Real-World Example: Product API

``` text
GET    /api/products          → list (paginated, cached)
POST   /api/products          → create (admin)
GET    /api/products/:id      → read
PATCH  /api/products/:id      → update (admin)
DELETE /api/products/:id      → delete (admin)
POST   /api/webhooks/stripe   → payment events
GET    /api/health            → health check
```

List handler:

``` ts
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const page = Math.max(1, Number(sp.get("page") ?? 1))
  const limit = Math.min(50, Number(sp.get("limit") ?? 20))

  const [items, total] = await Promise.all([
    db.product.findMany({ skip: (page - 1) * limit, take: limit }),
    db.product.count(),
  ])

  return Response.json(
    { items, page, limit, total },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  )
}
```

------------------------------------------------------------------------

# 24. Route Handler Decision Tree

``` text
Need an HTTP endpoint?
          │
          ▼
Who calls it?
          │
   ┌──────┴──────────┐
   ▼                 ▼
My React UI      External / non-React
   │                 │
   ▼                 ▼
Server Action    Route Handler
(mutation)           │
or Server            ▼
Component       Webhook? ──► verify signature, raw body
(read)          Public API? ─► versioning, rate limit, CORS
                Download? ───► headers + authorization
                Stream? ─────► ReadableStream / SSE
```

------------------------------------------------------------------------

# 25. Production Checklist

``` text
- [ ] route.ts does not conflict with page.tsx
- [ ] Methods explicitly defined
- [ ] params awaited (Next.js 15+)
- [ ] Input validated (body, params, query)
- [ ] Authentication and authorization enforced
- [ ] Correct status codes and consistent error shape
- [ ] No stack traces in responses
- [ ] Caching intentionally configured
- [ ] Private data uses Cache-Control: private/no-store
- [ ] Webhooks verify signatures and are idempotent
- [ ] Rate limiting on public/sensitive endpoints
- [ ] CORS restricted to known origins (if needed)
- [ ] Heavy work moved to background jobs
- [ ] Logging with request IDs
- [ ] Health check endpoint present
- [ ] Business logic shared via service layer
```

------------------------------------------------------------------------

# 26. 30-Second Revision

``` text
route.ts
↓
HTTP endpoint using Web Request/Response

GET POST PUT PATCH DELETE
↓
Exported functions

params
↓
Promise in Next.js 15+

request.nextUrl.searchParams
↓
Query string

request.json() / text() / formData()
↓
Body

NextResponse.json
↓
JSON response

GET caching
↓
Dynamic by default (15+)

Webhooks
↓
Raw body + signature + idempotent

CORS
↓
Browser-only, not auth

Server Actions
↓
For your own UI mutations
```

------------------------------------------------------------------------

# 27. Final Interview Answer

> "Route Handlers are `route.ts` files in the App Router that expose
> HTTP endpoints using the standard Request and Response APIs. I use
> them for public or external-facing needs --- REST-style APIs,
> webhooks, file downloads, streaming and OAuth callbacks --- while I
> use Server Components for reading data and Server Actions for my own
> UI mutations. In each handler I validate the body, params and query
> with Zod, authenticate and authorize, return correct status codes
> and a consistent error shape, and never leak internals. In
> Next.js 15 `params` is a Promise and GET handlers are dynamic by
> default, so I opt in to caching explicitly with `force-static`,
> `revalidate` or Cache-Control headers, and I never cache private
> responses. For webhooks I read the raw body, verify the signature,
> respond quickly and keep processing idempotent. I add rate limiting
> and restrictive CORS for public endpoints, and keep business logic
> in a shared service layer."

------------------------------------------------------------------------

# 28. One-Line Rule

> **Route Handlers are your public HTTP boundary --- validate,
> authorize, respond with the right status, and keep logic in services.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
route.ts
→ HTTP endpoint

Exports
→ GET POST PUT PATCH DELETE

NextRequest
→ nextUrl, cookies, headers

NextResponse
→ json, redirect, cookies

params
→ await in Next.js 15+

Raw body
→ request.text() for webhooks

Caching
→ force-static + revalidate (opt in)

401 / 403 / 404
→ Auth status codes

CORS
→ Headers + OPTIONS

Streaming
→ ReadableStream / SSE

Server Action
→ UI mutation

Server Component
→ Data reads
```

### BEST GENERAL ARCHITECTURE

``` text
                  API SYSTEM
                       │
      ┌────────────────┼────────────────┐
      ▼                ▼                ▼
   Clients          Route Handler     Services
      │                │                │
  Mobile / 3rd     validate (Zod)    business logic
  Webhooks         authenticate      DB access
  Browsers         authorize         queues / email
      │            status codes          │
      │            rate limit            │
      └────────────────┼────────────────┘
                       ▼
          Reliable + Secure HTTP Boundary
```