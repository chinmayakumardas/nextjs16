# 17 --- Security

> Next.js App Router --- server/client boundary, authentication vs
> authorization, Data Access Layer, Server Actions security, XSS, CSRF,
> security headers, CSP, CORS, rate limiting, SSRF, secrets, input
> validation, common mistakes & interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
                  NEXT.JS SECURITY

                        │
     ┌──────────┬───────┼───────┬──────────┐
     ▼          ▼       ▼       ▼          ▼
  Identity    Data    Input   Browser    Secrets
     │          │       │       │          │
     ▼          ▼       ▼       ▼          ▼
  AuthN /     DAL     Zod     Headers    server-only
  AuthZ     checks  validate   CSP       env vars
```

Think:

``` text
Never trust the client
Never trust the input
Never trust the middleware alone
Check permissions where the data lives
```

Security is layers:

``` text
Edge / proxy checks
       ↓
Route / action checks
       ↓
Data access checks
       ↓
Database rules
```

If one layer fails, the next one still protects you.

------------------------------------------------------------------------

# 2. Why Security Matters

Security failures cause:

``` text
Data breaches
Account takeover
Financial loss
Legal trouble (GDPR, PCI, etc.)
Loss of user trust
```

A feature can work perfectly and still be vulnerable because of:

``` text
Missing authorization checks
Unvalidated input
Leaked secrets
Unsafe HTML rendering
Public Server Actions
Missing security headers
```

------------------------------------------------------------------------

# 3. Threat Map

``` text
Threat                  Typical Defense
────────────────────────────────────────────────────
XSS                     Escape output, CSP, sanitize HTML
CSRF                    SameSite cookies, Origin checks
Broken access control   Authorize in the data layer
Injection (SQL/NoSQL)   ORM / parameterized queries
Secret leakage          server-only, env discipline
Clickjacking            frame-ancestors / X-Frame-Options
SSRF                    Allow-list outbound URLs
Brute force             Rate limiting, lockouts
Open redirect           Validate redirect targets
Vulnerable packages     npm audit, Dependabot
```

The most common real-world bug:

``` text
Broken access control
```

User A can read or edit User B's data because nobody checked.

------------------------------------------------------------------------

# 4. The Server / Client Boundary

``` text
        SERVER                         BROWSER
   ┌───────────────┐             ┌───────────────┐
   │ Server        │  props      │ Client        │
   │ Components    │ ─────────►  │ Components    │
   │ Actions       │             │ (public code) │
   │ Route Handlers│             │               │
   └───────────────┘             └───────────────┘
     trusted                       untrusted
```

Rules:

``` text
Everything sent to the browser is visible to the user
Client Component props are serialized into the page
Client JavaScript can be read and modified
```

Common leak:

``` tsx
// Server Component
const user = await db.user.findUnique({ where: { id } })

return <Profile user={user} />   // ❌ passes passwordHash, email, tokens...
```

Better:

``` tsx
return (
  <Profile
    user={{ name: user.name, avatar: user.avatar }}   // ✅ only what UI needs
  />
)
```

Mental model:

``` text
Props to a Client Component
        ↓
Treat as public data
```

------------------------------------------------------------------------

# 5. `server-only` and Taint APIs

Block accidental client imports:

``` bash
npm install server-only
```

``` ts
// lib/data.ts
import "server-only"

export async function getUserWithSecrets(id: string) { ... }
```

Result:

``` text
Client Component imports lib/data.ts
            ↓
Build error
```

Next.js also offers experimental taint APIs:

``` ts
import { experimental_taintObjectReference } from "react"

experimental_taintObjectReference(
  "Do not pass the full user object to the client",
  user
)
```

Think:

``` text
server-only          → protects modules
taint (experimental) → protects specific values
Neither replaces careful DTO design
```

------------------------------------------------------------------------

# 6. Authentication vs Authorization

``` text
Authentication (AuthN)
   ↓
Who are you?

Authorization (AuthZ)
   ↓
What are you allowed to do?
```

Example:

``` text
Logged in as Alice          → authenticated ✅
Editing Bob's invoice       → authorized? ❌
```

Many bugs happen because developers check only the first one.

Rule:

``` text
Every sensitive read/write needs BOTH
```

------------------------------------------------------------------------

# 7. Data Access Layer (DAL)

Centralize security checks close to the data.

``` text
Page / Component / Action
          │
          ▼
   Data Access Layer
   (verify session + authorize)
          │
          ▼
       Database
```

``` ts
// lib/dal.ts
import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { decrypt } from "@/lib/session"

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value
  const session = await decrypt(cookie)

  if (!session?.userId) redirect("/login")

  return { userId: session.userId as string, role: session.role as string }
})

export async function getInvoice(id: string) {
  const session = await verifySession()

  const invoice = await db.invoice.findUnique({ where: { id } })
  if (!invoice || invoice.ownerId !== session.userId) return null   // authz

  return {                                   // DTO: only safe fields
    id: invoice.id,
    total: invoice.total,
    status: invoice.status,
  }
}
```

Benefits:

``` text
One place for auth logic
Hard to forget a check
Returns DTOs, not raw rows
Reusable from pages, actions, handlers
```

------------------------------------------------------------------------

# 8. Middleware / Proxy Is Not Enough

Middleware is good for:

``` text
Optimistic redirects (not logged in → /login)
Locale routing
Adding headers (CSP nonce)
Cheap early checks
```

Middleware is NOT good as the only guard:

``` text
Matchers can miss routes
Server Actions are POST requests to the page URL
Framework bugs can bypass it
Heavy DB checks do not belong there
```

A real example: a 2025 vulnerability allowed attackers to bypass
middleware-based auth with a crafted internal header on affected
versions. Teams that relied only on middleware were exposed; teams
that also checked inside the data layer were not.

Rule:

``` text
Middleware  → convenience / first filter
DAL checks  → real security
```

Keep Next.js updated.

------------------------------------------------------------------------

# 9. Sessions & Cookies

Secure session cookie:

``` ts
import { cookies } from "next/headers"

export async function createSession(token: string) {
  const store = await cookies()
  store.set("session", token, {
    httpOnly: true,                       // JS cannot read it
    secure: process.env.NODE_ENV === "production",  // HTTPS only
    sameSite: "lax",                      // CSRF protection
    path: "/",
    maxAge: 60 * 60 * 24 * 7,             // 7 days
  })
}
```

Cookie flags:

``` text
httpOnly   → blocks XSS from stealing the cookie
secure     → only sent over HTTPS
sameSite   → limits cross-site sending (lax / strict)
maxAge     → limits lifetime
path       → scope
```

Storage comparison:

``` text
localStorage tokens    → readable by any XSS ❌
httpOnly cookies       → not readable by JS ✅
```

Prefer:

``` text
Opaque session ID in an httpOnly cookie
+ server-side session store
```

or a signed/encrypted JWT in an httpOnly cookie (e.g. with `jose`).

Use a proven library where possible:

``` text
Auth.js (NextAuth)
Better Auth
Clerk / Auth0 / Supabase Auth / Lucia-style patterns
```

Do not invent your own crypto.

------------------------------------------------------------------------

# 10. Password Handling

``` text
Never store plain-text passwords
Never use MD5 / SHA-1 / plain SHA-256 for passwords
```

Use a slow, salted hash:

``` text
argon2id (preferred)
bcrypt
scrypt
```

``` ts
import bcrypt from "bcryptjs"

const hash = await bcrypt.hash(password, 12)
const ok = await bcrypt.compare(password, hash)
```

Also:

``` text
Rate-limit login attempts
Use generic errors ("Invalid email or password")
Support MFA for sensitive apps
Require reasonable password length (length > complexity rules)
```

------------------------------------------------------------------------

# 11. Server Actions Are Public Endpoints

Key idea:

``` text
A Server Action looks like a function call
but it is really an HTTP POST endpoint
```

Anyone can call it with any input.

Therefore every action must:

``` text
1. Authenticate
2. Authorize
3. Validate input
4. Then perform the change
```

``` ts
"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"

const schema = z.object({ id: z.string().uuid() })

export async function deletePost(formData: FormData) {
  const session = await verifySession()                       // 1. authN

  const { id } = schema.parse({ id: formData.get("id") })     // 3. validate

  const post = await db.post.findUnique({ where: { id } })
  if (!post || post.authorId !== session.userId) {            // 2. authZ
    throw new Error("Forbidden")
  }

  await db.post.delete({ where: { id } })
  revalidatePath("/posts")
}
```

Remember:

``` text
Hiding a button in the UI is NOT security
Unused exported actions can still be reachable
Never trust hidden form fields or bound arguments
```

Next.js protections that help:

``` text
POST-only invocation
Origin vs Host comparison (CSRF mitigation)
Encrypted closed-over variables
Unused action pruning
```

They help, but they do not replace your own checks.

------------------------------------------------------------------------

# 12. Server Actions Allowed Origins

By default Server Actions only accept requests where `Origin` matches
the host.

Behind a proxy or multiple domains:

``` ts
// next.config.ts
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["my-proxy.com", "*.my-proxy.com"],
      bodySizeLimit: "2mb",
    },
  },
}

export default nextConfig
```

Notes:

``` text
Only allow origins you control
bodySizeLimit prevents oversized payloads
```

------------------------------------------------------------------------

# 13. Route Handlers

Route Handlers are plain HTTP endpoints. Secure them like any API.

``` ts
// app/api/orders/[id]/route.ts
import { verifySession } from "@/lib/dal"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession()
  const { id } = await params

  const order = await db.order.findUnique({ where: { id } })

  if (!order || order.userId !== session.userId) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({ id: order.id, total: order.total })
}
```

Tips:

``` text
Return 404 instead of 403 to avoid revealing existence
Validate params, query and body
Return minimal fields
Set correct status codes
Verify webhook signatures
```

Webhook example:

``` ts
import crypto from "crypto"

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("x-signature") ?? ""

  const expected = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest("hex")

  const valid =
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))

  if (!valid) return new Response("Invalid signature", { status: 401 })

  // process event
  return new Response("ok")
}
```

------------------------------------------------------------------------

# 14. Input Validation

Treat all input as hostile:

``` text
Form data
Query strings
Route params
Headers
Cookies
JSON bodies
Uploaded files
Webhook payloads
```

Validate with a schema:

``` ts
import { z } from "zod"

export const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
  name: z.string().trim().min(1).max(80),
})

const result = signupSchema.safeParse(Object.fromEntries(formData))

if (!result.success) {
  return { errors: result.error.flatten().fieldErrors }
}
```

Mental model:

``` text
Unknown input
      ↓
Schema validation
      ↓
Typed, trusted-shape data
```

Client-side validation = UX.
Server-side validation = security.

------------------------------------------------------------------------

# 15. XSS (Cross-Site Scripting)

React escapes values by default:

``` tsx
<p>{userComment}</p>     // ✅ safe: rendered as text
```

Dangerous APIs:

``` tsx
<div dangerouslySetInnerHTML={{ __html: userHtml }} />   // ❌ if unsanitized
```

If you must render HTML, sanitize first:

``` ts
import DOMPurify from "isomorphic-dompurify"

const clean = DOMPurify.sanitize(userHtml)

return <div dangerouslySetInnerHTML={{ __html: clean }} />
```

Other XSS traps:

``` tsx
<a href={userUrl}>Link</a>      // ❌ javascript: URLs
```

Validate URL protocols:

``` ts
function safeUrl(input: string) {
  try {
    const url = new URL(input)
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#"
  } catch {
    return "#"
  }
}
```

Safe JSON in script tags:

``` tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  }}
/>
```

Defense stack:

``` text
React escaping
+ sanitization for HTML
+ URL validation
+ CSP
+ httpOnly cookies
```

------------------------------------------------------------------------

# 16. CSRF (Cross-Site Request Forgery)

Attack idea:

``` text
User logged into bank.com
        ↓
Visits evil.com
        ↓
evil.com triggers a request to bank.com
        ↓
Browser attaches the cookie
```

Defenses:

``` text
SameSite=Lax or Strict cookies
Origin / Host verification (built into Server Actions)
CSRF tokens for custom forms / endpoints if needed
POST for state-changing operations
Never change state with GET
```

Wrong:

``` ts
// GET /api/delete-account  ❌
export async function GET() { await deleteAccount() }
```

Right:

``` ts
export async function POST() { ... }   // plus session + origin protection
```

------------------------------------------------------------------------

# 17. SQL / NoSQL Injection

Unsafe:

``` ts
const rows = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`      // ❌
)
```

Safe:

``` ts
const rows = await db.query(
  "SELECT * FROM users WHERE email = $1",
  [email]                                            // ✅ parameterized
)
```

ORMs help:

``` ts
await prisma.user.findUnique({ where: { email } })   // ✅
```

But be careful with raw queries:

``` ts
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`   // ✅ tagged template
await prisma.$queryRawUnsafe(`... ${email}`)                         // ❌
```

NoSQL:

``` ts
// ❌ attacker sends { "$ne": null }
User.findOne({ email: body.email })

// ✅ validate type first
const email = z.string().email().parse(body.email)
```

------------------------------------------------------------------------

# 18. Security Headers

Add headers globally in `next.config.ts`:

``` ts
// next.config.ts
import type { NextConfig } from "next"

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
}

export default nextConfig
```

What they do:

``` text
X-Content-Type-Options   → stop MIME sniffing
X-Frame-Options          → block clickjacking (older browsers)
Referrer-Policy          → limit referrer leakage
Strict-Transport-Security→ force HTTPS
Permissions-Policy       → disable unused browser features
poweredByHeader: false   → hide "X-Powered-By: Next.js"
```

Only enable HSTS `preload` when you are sure every subdomain supports
HTTPS.

------------------------------------------------------------------------

# 19. Content Security Policy (CSP)

CSP tells the browser what it may load or run.

``` text
Script from my domain      → allowed
Inline script injected     → blocked
Unknown third-party script → blocked
```

Nonce-based CSP using middleware:

``` ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const isDev = process.env.NODE_ENV === "development"

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ")

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("Content-Security-Policy", csp)
  return response
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [{ type: "header", key: "next-router-prefetch" }],
    },
  ],
}
```

Important:

``` text
Nonces require dynamic rendering
→ pages can no longer be fully static / CDN-cached
```

If you need static pages:

``` text
Use a hash/allow-list based CSP
or accept a less strict policy
or roll out in Report-Only mode first
```

Rollout strategy:

``` text
Content-Security-Policy-Report-Only
        ↓
Collect violations
        ↓
Fix third-party scripts
        ↓
Enforce
```

------------------------------------------------------------------------

# 20. CORS

CORS controls which **other origins** may read your API from a browser.

``` ts
// app/api/public/route.ts
const allowedOrigins = ["https://app.example.com"]

export async function GET(req: Request) {
  const origin = req.headers.get("origin") ?? ""
  const allow = allowedOrigins.includes(origin)

  return Response.json(
    { ok: true },
    {
      headers: {
        "Access-Control-Allow-Origin": allow ? origin : "",
        "Vary": "Origin",
      },
    }
  )
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
```

Never:

``` text
Access-Control-Allow-Origin: *
together with credentials
```

Remember:

``` text
CORS is a browser rule, not authentication
curl and servers ignore CORS
```

------------------------------------------------------------------------

# 21. Rate Limiting

Protect:

``` text
Login
Signup
Password reset
OTP / verification
Contact forms
Expensive APIs
Public search
```

Example with Upstash:

``` ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { headers } from "next/headers"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
})

export async function login(formData: FormData) {
  "use server"
  const ip = (await headers()).get("x-forwarded-for") ?? "anonymous"
  const { success } = await ratelimit.limit(`login:${ip}`)

  if (!success) return { error: "Too many attempts. Try again later." }

  // continue login
}
```

Notes:

``` text
Rate limit by IP AND by account/email
In-memory counters fail on serverless / multi-instance
Use Redis / KV / edge rate limiting
Trust x-forwarded-for only behind a known proxy
```

------------------------------------------------------------------------

# 22. SSRF & Remote Images

SSRF idea:

``` text
Attacker supplies a URL
        ↓
Your server fetches it
        ↓
Server reaches internal services / cloud metadata
```

Dangerous:

``` ts
const res = await fetch(req.nextUrl.searchParams.get("url")!)   // ❌
```

Safer:

``` ts
const ALLOWED_HOSTS = new Set(["images.example.com", "cdn.example.com"])

const url = new URL(input)

if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
  return new Response("Forbidden", { status: 403 })
}
```

Also block:

``` text
localhost / 127.0.0.1
10.x.x.x / 172.16-31.x.x / 192.168.x.x
169.254.169.254 (cloud metadata)
```

Next.js images:

``` ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.example.com", pathname: "/products/**" },
  ],
}
```

Be as specific as possible --- never allow `**` for hostname.

------------------------------------------------------------------------

# 23. Open Redirects

Unsafe:

``` ts
redirect(searchParams.next)       // ❌ /login?next=https://evil.com
```

Safe:

``` ts
function safeRedirect(path: string | null | undefined) {
  if (!path) return "/"
  if (!path.startsWith("/") || path.startsWith("//")) return "/"
  return path
}

redirect(safeRedirect(next))
```

Rule:

``` text
Only redirect to relative paths you control
or to an allow-listed set of hosts
```

------------------------------------------------------------------------

# 24. File Uploads

Risks:

``` text
Malware
Huge files
Fake extensions
Path traversal
Executable uploads
```

Controls:

``` ts
const MAX = 5 * 1024 * 1024
const ALLOWED = ["image/png", "image/jpeg", "image/webp"]

if (file.size > MAX) throw new Error("File too large")
if (!ALLOWED.includes(file.type)) throw new Error("Invalid type")
```

Best practices:

``` text
Check size AND type (and ideally magic bytes)
Generate your own file names (never trust user names)
Store outside the web root / in object storage (S3, R2, Blob)
Use pre-signed URLs for direct upload
Serve user files from a separate domain when possible
Scan files if risk is high
```

------------------------------------------------------------------------

# 25. Secrets & Environment

``` text
Secrets stay on the server
Never prefix secrets with NEXT_PUBLIC_
Use `server-only` on secret modules
Never log secrets
Never commit .env.local
Rotate leaked keys immediately
Use a secrets manager in production
```

Detect leaks:

``` text
Search the built client bundle for sensitive strings
Use secret scanning (GitHub, gitleaks, trufflehog) in CI
```

See: `16-environment-configuration.md`.

------------------------------------------------------------------------

# 26. Dependency & Supply-Chain Security

``` text
npm audit
Dependabot / Renovate
Lockfile committed (package-lock.json / pnpm-lock.yaml)
npm ci in CI (exact lockfile install)
Review new packages (maintainers, downloads, size)
Avoid unnecessary dependencies
Pin critical versions
Keep Next.js and React updated
```

Commands:

``` bash
npm audit
npm audit fix
npm outdated
```

Mental model:

``` text
Every dependency
      ↓
Code you did not write
      ↓
Running with your permissions
```

------------------------------------------------------------------------

# 27. Error Handling & Information Leaks

Bad:

``` ts
return Response.json({ error: err.stack }, { status: 500 })   // ❌
```

Good:

``` ts
console.error("Order failed", { orderId, err })   // server log only
return Response.json({ error: "Something went wrong" }, { status: 500 })
```

Tips:

``` text
Generic messages to users
Detailed logs on the server
No stack traces in production responses
Same login error for "no user" and "wrong password"
Use error.tsx boundaries without exposing internals
Production Next.js hides server error details in client components
```

------------------------------------------------------------------------

# 28. Logging & Audit

Log security-relevant events:

``` text
Login success / failure
Password changes
Permission changes
Admin actions
Payment events
Rate-limit hits
Webhook signature failures
```

Do not log:

``` text
Passwords
Session tokens
Full card numbers
API keys
Personal data you do not need
```

Add:

``` text
Request ID / user ID
Timestamp
Action
Result
```

------------------------------------------------------------------------

# 29. Third-Party Scripts

Every script you add runs with full page power.

``` text
Analytics
Chat widgets
Ad scripts
Tag managers
```

Controls:

``` text
Load only what you need
Use next/script with a strategy
Pass the CSP nonce
Use Subresource Integrity (integrity attr) when scripts are static
Isolate heavy/untrusted widgets in sandboxed iframes
Review what tag managers can inject
```

``` tsx
import Script from "next/script"

<Script
  src="https://analytics.example.com/script.js"
  strategy="afterInteractive"
  nonce={nonce}
/>
```

------------------------------------------------------------------------

# 30. Common Mistakes

``` text
❌ Hiding admin buttons instead of enforcing permissions
❌ Checking auth only in middleware
❌ Trusting IDs from the client (IDOR)
❌ Passing whole DB rows to Client Components
❌ Secrets in NEXT_PUBLIC_ variables
❌ Server Actions without auth / validation
❌ Storing JWTs in localStorage
❌ dangerouslySetInnerHTML with raw user content
❌ State-changing GET endpoints
❌ Allow-origin * with credentials
❌ fetch(userSuppliedUrl)
❌ Unrestricted remotePatterns
❌ No rate limiting on login
❌ Verbose error messages in production
❌ Ignoring npm audit
❌ No security headers
```

IDOR example:

``` text
GET /api/invoices/123
        ↓
Attacker changes to /api/invoices/124
        ↓
No ownership check → sees someone else's invoice
```

------------------------------------------------------------------------

# 31. Interview Questions

### Q1. Where should authorization checks live?

Close to the data --- in a Data Access Layer or inside each action /
handler --- not only in middleware.

### Q2. Why is middleware alone insufficient?

It may miss routes, can be bypassed by framework bugs, and Server
Actions are reachable as POST requests. Use it as a first filter only.

### Q3. Are Server Actions secure by default?

They have some protections (POST only, Origin checks, encrypted bound
variables), but each action is still a public endpoint and must
authenticate, authorize and validate input.

### Q4. How does React protect against XSS?

It escapes interpolated values. Risk returns with
`dangerouslySetInnerHTML`, unsafe URLs and injected scripts.

### Q5. How do you prevent CSRF in Next.js?

SameSite cookies, Origin/Host checks (built into Server Actions), POST
for mutations, and CSRF tokens where custom endpoints need them.

### Q6. Where should session tokens be stored?

In httpOnly, secure, SameSite cookies --- not localStorage.

### Q7. What is a CSP?

A header that restricts which scripts, styles, images and frames the
browser may load, reducing XSS impact.

### Q8. Why do nonce-based CSPs affect caching?

Each request needs a fresh nonce, so pages must render dynamically and
cannot be fully static/CDN-cached.

### Q9. What is IDOR?

Insecure Direct Object Reference --- accessing another user's resource
by changing an ID because ownership is not checked.

### Q10. What does `server-only` do?

Causes a build error if a server module is imported into client code.

### Q11. What is SSRF?

Making the server fetch an attacker-controlled URL, potentially reaching
internal services. Prevent with allow-lists.

### Q12. What does CORS protect?

It controls which origins can read responses in a browser. It is not
authentication and does not stop non-browser clients.

### Q13. Which password hashing algorithms are recommended?

argon2id, bcrypt or scrypt --- slow, salted hashes.

### Q14. Why validate on the server if the client already validates?

Client code can be bypassed. Server validation is the real security
boundary.

------------------------------------------------------------------------

# 32. Interview Failure Points

Avoid:

``` text
❌ "Middleware protects all my routes."

❌ "Server Actions are safe because they are internal functions."

❌ "The button is hidden, so users can't do it."

❌ "I store the JWT in localStorage for convenience."

❌ "React makes XSS impossible."

❌ "CORS protects my API from attackers."

❌ "My repo is private, so secrets in it are fine."

❌ "Client-side validation is enough."
```

Better mental model:

``` text
Auth
 ↓
Verify identity AND permission at the data layer

Input
 ↓
Validate on the server with schemas

Output
 ↓
Return minimal DTOs, escape/sanitize content

Browser
 ↓
Headers + CSP + secure cookies

Secrets
 ↓
Server-only + secret manager

Operations
 ↓
Rate limit, log, update dependencies
```

------------------------------------------------------------------------

# 33. Real-World SaaS Security Architecture

``` text
                        SAAS APP
                           │
      ┌────────────┬───────┼───────┬────────────┐
      ▼            ▼       ▼       ▼            ▼
   Session       Tenant   Roles   Billing    Webhooks
      │            │       │       │            │
      ▼            ▼       ▼       ▼            ▼
  httpOnly      orgId     RBAC   Stripe     Signature
  cookie        scoping   checks  server     verify
```

Typical request:

``` text
Request
   ↓
Proxy: CSP nonce, optimistic redirect
   ↓
Server Component / Action
   ↓
verifySession()
   ↓
Authorize role + tenant
   ↓
Validate input (Zod)
   ↓
DB query scoped by orgId
   ↓
Return DTO
```

Multi-tenant rule:

``` text
Every query includes the tenant/org ID from the SESSION
never from the request body
```

``` ts
await db.project.findMany({
  where: { orgId: session.orgId },    // ✅ from session
})
```

------------------------------------------------------------------------

# 34. Real-World E-Commerce Security

``` text
Checkout
   ↓
Server computes price (never trust client price)
   ↓
Stripe session created server-side
   ↓
Webhook verifies payment signature
   ↓
Order marked paid
```

Rules:

``` text
Never accept price/total from the client
Verify webhook signatures
Use idempotency keys
Rate limit coupon attempts
Never store raw card data (use Stripe/PCI provider)
Scope order lookups to the logged-in user
```

------------------------------------------------------------------------

# 35. Security Decision Tree

``` text
New feature / endpoint
          │
          ▼
Does it read or change user data?
          │
      ┌───┴───┐
      ▼       ▼
     Yes      No
      │       │
      ▼       ▼
 Authenticate  Still validate
 Authorize     input & headers
 Validate
      │
      ▼
Does it accept a URL / file / HTML?
      │
 ┌────┴────┐
 ▼         ▼
Yes        No
 │         │
 ▼         ▼
Allow-list  Done
Sanitize
Limit size
```

For tokens:

``` text
Need to store a session?
        ↓
httpOnly + secure + SameSite cookie
```

------------------------------------------------------------------------

# 36. Production Checklist

``` text
- [ ] Authentication implemented with a proven library/pattern
- [ ] Authorization checked in the data layer
- [ ] Middleware used only as a first filter
- [ ] Every Server Action authenticates, authorizes, validates
- [ ] Route Handlers validate params/body and scope by user
- [ ] Zod (or similar) validation on all inputs
- [ ] DTOs returned instead of raw DB rows
- [ ] server-only on secret modules
- [ ] No secrets in NEXT_PUBLIC_ vars
- [ ] Session cookies: httpOnly, secure, SameSite
- [ ] Passwords hashed with argon2id/bcrypt
- [ ] Security headers configured
- [ ] CSP deployed (Report-Only first)
- [ ] poweredByHeader disabled
- [ ] CORS restricted to known origins
- [ ] Rate limiting on auth and expensive endpoints
- [ ] Outbound fetch allow-listed (SSRF)
- [ ] remotePatterns tightly scoped
- [ ] Redirect targets validated
- [ ] File uploads restricted and stored safely
- [ ] Webhook signatures verified
- [ ] Generic production errors, detailed server logs
- [ ] npm audit / Dependabot enabled
- [ ] Next.js and React kept up to date
- [ ] Secret scanning in CI
- [ ] Security events logged
```

------------------------------------------------------------------------

# 37. 30-Second Revision

``` text
Client
↓
Untrusted

Server
↓
Trusted, but validate input

DAL
↓
Authenticate + authorize + return DTOs

Middleware
↓
First filter, not the only guard

Server Actions
↓
Public POST endpoints

Cookies
↓
httpOnly + secure + SameSite

XSS
↓
Escape, sanitize, CSP

CSRF
↓
SameSite + Origin checks

Headers
↓
HSTS, nosniff, frame protection, Referrer-Policy

CSP
↓
Control allowed scripts (nonce + Report-Only rollout)

Secrets
↓
server-only + secret manager

SSRF
↓
Allow-list outbound URLs

Rate limiting
↓
Protect auth and costly endpoints
```

------------------------------------------------------------------------

# 38. Final Interview Answer

> "I treat security in Next.js as layered defense. The client is
> untrusted, so I validate all input on the server with schemas and
> return only minimal DTOs to Client Components. I authenticate and
> authorize inside a Data Access Layer next to the data rather than
> relying only on middleware, and I treat Server Actions and Route
> Handlers as public endpoints that must verify the session, check
> ownership or role, and validate input. Sessions live in httpOnly,
> secure, SameSite cookies, passwords use argon2id or bcrypt, and I
> use `server-only` and environment discipline to keep secrets off the
> client. In the browser layer I rely on React's escaping, sanitize any
> HTML I must render, and set security headers including HSTS and a CSP
> rolled out through Report-Only first. I protect auth and expensive
> endpoints with rate limiting, allow-list outbound URLs and image
> sources to prevent SSRF, verify webhook signatures, keep dependencies
> and Next.js updated, and log security events without leaking
> sensitive data."

------------------------------------------------------------------------

# 39. One-Line Rule

> **Never trust the client or the input --- verify identity and
> permission where the data lives, expose only what's needed, and layer
> your defenses.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
AuthN
→ Who are you?

AuthZ
→ What can you do?

DAL
→ Central auth checks + DTOs

Middleware
→ Not a sole security layer

Server Action
→ Public endpoint: auth + authz + validate

httpOnly cookie
→ Safer session storage

SameSite
→ CSRF defense

dangerouslySetInnerHTML
→ Sanitize first

CSP
→ Restrict scripts/resources

HSTS
→ Force HTTPS

server-only
→ Prevent client import of secrets

NEXT_PUBLIC_
→ Public by design

Zod
→ Server input validation

Rate limiting
→ Brute-force / abuse protection

SSRF
→ Allow-list outbound requests

IDOR
→ Check ownership on every resource

npm audit
→ Dependency vulnerabilities
```

### BEST GENERAL ARCHITECTURE

``` text
                  SECURITY SYSTEM
                         │
     ┌──────────┬────────┼────────┬──────────┐
     ▼          ▼        ▼        ▼          ▼
  Edge/Proxy   Server   Data     Browser   Operations
     │          Logic   Layer       │          │
     │           │        │         │          │
  headers     validate  authN     CSP        rate limit
  CSP nonce   (Zod)     authZ     cookies    logging
  redirects   actions   DTOs      sanitize   audit deps
     │           │        │         │          │
     └───────────┴────────┼─────────┴──────────┘
                          ▼
                 Defense in Depth
```