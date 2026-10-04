# 10 --- Authentication & Authorization

> Next.js App Router --- authentication vs authorization, sessions,
> cookies, JWT vs database sessions, signup/login/logout with Server
> Actions, Data Access Layer, middleware/proxy, protected routes,
> RBAC, OAuth, auth libraries, password handling, common mistakes &
> interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
               AUTH IN NEXT.JS

                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
  Authentication   Session       Authorization
   "Who are you?"  "Remember you" "What can you do?"
       │              │              │
       ▼              ▼              ▼
  Login / OAuth    Cookie +       Roles, ownership,
  Password / MFA   JWT / DB       permissions
```

Think:

``` text
Login
  ↓
Create session
  ↓
Store session ID/token in an httpOnly cookie
  ↓
Every request: verify session
  ↓
Check permission for the specific action/data
```

Golden rule:

``` text
Authenticate once.
Authorize on every sensitive operation.
```

------------------------------------------------------------------------

# 2. Authentication vs Authorization

``` text
Authentication (AuthN)
   ↓
Verify identity
   ↓
Example: valid email + password

Authorization (AuthZ)
   ↓
Verify permission
   ↓
Example: can this user edit THIS invoice?
```

Common bug:

``` text
User is logged in ✅
Developer assumes they can access everything ❌
```

That leads to IDOR / broken access control.

------------------------------------------------------------------------

# 3. Build vs Use a Library

Options:

``` text
Auth.js (NextAuth)   → OAuth + credentials + adapters
Better Auth          → modern full-featured TypeScript auth
Clerk / Auth0        → hosted, fast to ship
Supabase Auth        → if using Supabase
Firebase Auth        → if using Firebase
Custom (jose + DB)   → full control, more responsibility
```

Choosing:

``` text
Need to ship fast, MFA, social login, user management UI?
   → Hosted (Clerk, Auth0)

Need control, own database, open source?
   → Auth.js / Better Auth

Learning or very custom needs?
   → Custom sessions (as shown below)
```

Never write your own cryptography or password hashing algorithms. Use
proven libraries.

------------------------------------------------------------------------

# 4. Session Strategies

### Stateless (JWT in cookie)

``` text
Cookie contains signed/encrypted token
Server verifies signature
No DB lookup needed
```

Pros / cons:

``` text
✅ Fast, no session store
✅ Works well at the edge
❌ Hard to revoke instantly
❌ Token size limits
❌ Stale claims until expiry
```

### Database sessions

``` text
Cookie contains random session ID
Server looks up session in DB/Redis
```

Pros / cons:

``` text
✅ Easy revoke / logout everywhere
✅ Small cookie
✅ Always up-to-date user/role
❌ DB/Redis lookup per request
```

Typical choice:

``` text
Simple apps         → encrypted JWT cookie (jose)
Sensitive/enterprise→ database/Redis sessions
```

Hybrid: short-lived JWT + refresh token stored server-side.

------------------------------------------------------------------------

# 5. Session Management (JWT with `jose`)

``` bash
npm install jose server-only
```

``` ts
// lib/session.ts
import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const secretKey = process.env.SESSION_SECRET!        // 32+ random chars
const encodedKey = new TextEncoder().encode(secretKey)

type SessionPayload = { userId: string; role: "user" | "admin"; expiresAt: Date }

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)
}

export async function decrypt(token: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] })
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(userId: string, role: "user" | "admin") {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, role, expiresAt })

  const store = await cookies()
  store.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })
}

export async function deleteSession() {
  const store = await cookies()
  store.delete("session")
}
```

Cookie flags:

``` text
httpOnly → JS cannot read it (XSS protection)
secure   → HTTPS only
sameSite → CSRF mitigation
expires  → limit lifetime
```

Never store sessions in `localStorage`.

------------------------------------------------------------------------

# 6. Signup with Server Action

``` ts
// app/actions/auth.ts
"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { createSession, deleteSession } from "@/lib/session"

const SignupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().toLowerCase(),
  password: z.string().min(12, "At least 12 characters").max(128),
})

export type FormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

export async function signup(prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, password } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { errors: { email: ["Email already in use"] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: { name, email, passwordHash, role: "user" },
  })

  await createSession(user.id, user.role)
  redirect("/dashboard")
}
```

Notes:

``` text
Normalize email (lowercase, trim)
Hash passwords with bcrypt/argon2id (cost ≥ 12 for bcrypt)
Add a unique constraint on email in the DB (race conditions)
Rate limit signup
Consider email verification
```

------------------------------------------------------------------------

# 7. Login with Server Action

``` ts
export async function login(prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const { email, password } = parsed.data

  const user = await db.user.findUnique({ where: { email } })

  // Same message for "no user" and "wrong password"
  const valid = user && (await bcrypt.compare(password, user.passwordHash))
  if (!valid) return { message: "Invalid email or password" }

  await createSession(user.id, user.role)
  redirect("/dashboard")
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}
```

Security notes:

``` text
Generic error messages (prevent user enumeration)
Rate limit by IP + email
Lock/slow down after repeated failures
Log failed attempts
Support MFA for sensitive apps
```

Form UI:

``` tsx
"use client"
import { useActionState } from "react"
import { login } from "@/app/actions/auth"

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action}>
      <input name="email" type="email" autoComplete="email" required />
      <input name="password" type="password" autoComplete="current-password" required />
      {state?.message && <p role="alert">{state.message}</p>}
      <button disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button>
    </form>
  )
}
```

------------------------------------------------------------------------

# 8. Data Access Layer (DAL)

Centralize session verification and data access.

``` ts
// lib/dal.ts
import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { decrypt } from "@/lib/session"

export const verifySession = cache(async () => {
  const token = (await cookies()).get("session")?.value
  const session = await decrypt(token)

  if (!session?.userId) redirect("/login")

  return { isAuth: true as const, userId: session.userId, role: session.role }
})

export const getUser = cache(async () => {
  const session = await verifySession()

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },   // DTO
  })

  return user
})
```

Why:

``` text
One place to verify sessions
React cache() → one verification per request
Select only safe fields (never return passwordHash)
Used by pages, actions and route handlers
```

Mental model:

``` text
Component / Action / Route Handler
              ↓
         verifySession()
              ↓
         Authorize
              ↓
            Data
```

------------------------------------------------------------------------

# 9. Middleware / Proxy (Optimistic Checks)

Use it for fast, cheap redirects --- not as the only security layer.

``` ts
// middleware.ts   (newer versions may name this proxy.ts)
import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/session"

const protectedRoutes = ["/dashboard", "/settings"]
const authRoutes = ["/login", "/signup"]

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = protectedRoutes.some((r) => path.startsWith(r))
  const isAuthRoute = authRoutes.includes(path)

  const token = req.cookies.get("session")?.value
  const session = await decrypt(token)

  if (isProtected && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
```

Important:

``` text
Middleware reads the cookie only (no DB calls)
It gives fast redirects and nicer UX
It can miss routes or be bypassed by bugs
The REAL check happens in the DAL / action / handler
```

------------------------------------------------------------------------

# 10. Protecting Pages

### Server Component page

``` tsx
// app/dashboard/page.tsx
import { verifySession, getUser } from "@/lib/dal"

export default async function Dashboard() {
  await verifySession()
  const user = await getUser()

  return <h1>Welcome, {user?.name}</h1>
}
```

### Why not only in `layout.tsx`?

``` text
Layouts do NOT re-render on every navigation between child routes
(partial rendering)
        ↓
An auth check only in a layout may not run again
        ↓
Check authentication where data is fetched (DAL)
```

Rule:

``` text
Check close to the data, not only in the layout
```

### Conditional UI

``` tsx
export default async function Nav() {
  const session = await getOptionalSession()

  return session ? <UserMenu /> : <Link href="/login">Log in</Link>
}
```

UI hiding is for UX. Enforcement happens server-side.

------------------------------------------------------------------------

# 11. Authorization Patterns

### Ownership

``` ts
const post = await db.post.findUnique({ where: { id } })
if (!post || post.authorId !== session.userId) {
  throw new Error("Forbidden")
}
```

### Role-based access control (RBAC)

``` ts
export async function requireRole(role: "admin" | "editor") {
  const session = await verifySession()
  if (session.role !== role && session.role !== "admin") {
    redirect("/unauthorized")      // or throw / return 403
  }
  return session
}
```

``` ts
export async function deleteUser(id: string) {
  "use server"
  await requireRole("admin")
  await db.user.delete({ where: { id } })
}
```

### Permissions map

``` ts
const permissions = {
  admin:  ["post:create", "post:update", "post:delete", "user:delete"],
  editor: ["post:create", "post:update"],
  user:   ["post:create"],
} as const

export function can(role: keyof typeof permissions, action: string) {
  return (permissions[role] as readonly string[]).includes(action)
}
```

### Multi-tenant scoping

``` ts
// always scope by organization from the SESSION
await db.project.findMany({ where: { orgId: session.orgId } })
```

Rule:

``` text
Never trust IDs or roles from the client
Derive identity and tenant from the verified session
```

------------------------------------------------------------------------

# 12. Authorization in Server Actions & Route Handlers

Server Action:

``` ts
"use server"
export async function updatePost(id: string, formData: FormData) {
  const session = await verifySession()
  const post = await db.post.findUnique({ where: { id } })

  if (!post || post.authorId !== session.userId) {
    return { message: "Not allowed" }
  }
  ...
}
```

Route Handler:

``` ts
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const post = await db.post.findUnique({ where: { id } })
  if (!post || post.authorId !== session.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  ...
}
```

Remember:

``` text
Server Actions and Route Handlers are public endpoints
Every one needs its own checks
```

------------------------------------------------------------------------

# 13. OAuth / Social Login

Flow (Authorization Code + PKCE):

``` text
User clicks "Sign in with Google"
        ↓
Redirect to provider (with state + PKCE challenge)
        ↓
User approves
        ↓
Provider redirects to /api/auth/callback?code=...&state=...
        ↓
Server verifies state, exchanges code for tokens
        ↓
Fetch user profile
        ↓
Find or create local user
        ↓
Create session cookie
```

Security checks:

``` text
Verify the state parameter (CSRF protection)
Use PKCE
Restrict redirect URIs
Verify ID token (issuer, audience, expiry)
Link accounts by verified email carefully (avoid account takeover)
Store provider tokens encrypted, if stored at all
```

With Auth.js:

``` ts
// auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      session.user.id = token.sub!
      return session
    },
  },
})
```

``` ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

``` tsx
import { auth, signIn } from "@/auth"

export default async function Page() {
  const session = await auth()
  if (!session) {
    return (
      <form action={async () => { "use server"; await signIn("google") }}>
        <button>Sign in with Google</button>
      </form>
    )
  }
  return <p>Hello {session.user?.name}</p>
}
```

Check the Auth.js docs for the current API for your version.

------------------------------------------------------------------------

# 14. Password Handling

``` text
Hash with argon2id or bcrypt
Never store plain text
Never use MD5 / SHA-1 / plain SHA-256
Unique salt per password (handled by the algorithm)
Minimum length 12 (length beats complexity rules)
Check against breached password lists when possible
```

Reset flow:

``` text
Request reset → generate random token (crypto)
        ↓
Store HASH of token + expiry
        ↓
Email link with token
        ↓
User sets new password
        ↓
Invalidate token + other sessions
```

Rules:

``` text
Tokens single-use and short-lived (15–60 min)
Same response whether email exists or not
Rate limit reset requests
Notify user by email on password change
```

------------------------------------------------------------------------

# 15. MFA & Step-Up Auth

Options:

``` text
TOTP (authenticator apps)
WebAuthn / Passkeys (best phishing resistance)
SMS (weakest; avoid for high-security)
Email magic links
```

Step-up authentication:

``` text
Sensitive action (change email, delete account, payments)
        ↓
Require recent re-authentication or MFA
```

Passkeys:

``` text
Public-key credentials stored on device
No password to steal or phish
Increasingly the recommended default
```

------------------------------------------------------------------------

# 16. Session Lifecycle

``` text
Create   → on login (regenerate on privilege change)
Verify   → on every request
Refresh  → sliding expiration or refresh token
Revoke   → logout, password change, admin action
Expire   → absolute lifetime + idle timeout
```

Sliding expiration:

``` ts
export async function updateSession() {
  const store = await cookies()
  const token = store.get("session")?.value
  const payload = await decrypt(token)
  if (!payload) return null

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  store.set("session", token!, { httpOnly: true, secure: true, sameSite: "lax", expires, path: "/" })
}
```

On logout everywhere / password change:

``` text
Database sessions → delete all rows for the user
JWT sessions → keep a token version/jti revocation list or short expiry
```

------------------------------------------------------------------------

# 17. Client-Side Access to Session

Don't read the cookie in the browser (it's httpOnly).

Pass safe user info from the server:

``` tsx
// app/layout.tsx
export default async function Layout({ children }) {
  const user = await getOptionalUser()    // minimal safe fields
  return <UserProvider user={user}>{children}</UserProvider>
}
```

Pattern:

``` text
Server verifies session
      ↓
Passes minimal DTO (id, name, role) to Client Components
      ↓
Client uses it for UI only
```

Never send:

``` text
passwordHash, tokens, internal flags, other users' data
```

------------------------------------------------------------------------

# 18. Error Pages for Auth

``` tsx
// app/unauthorized/page.tsx
export default function Unauthorized() {
  return <h1>You don't have permission to view this page.</h1>
}
```

``` text
Not logged in       → redirect to /login (with return URL)
Logged in, no role  → 403 / unauthorized page
Resource not owned  → 404 (hide existence)
```

Return URL (validate it!):

``` ts
function safeNext(next?: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard"
  return next
}
```

Newer Next.js versions also include experimental
`unauthorized()` / `forbidden()` helpers; check the docs for your
version.

------------------------------------------------------------------------

# 19. Common Mistakes

``` text
❌ Checking auth only in middleware
❌ Checking auth only in layout.tsx
❌ Authorization missing (only authentication)
❌ Trusting userId/role from the client
❌ Storing JWT in localStorage
❌ Cookies without httpOnly/secure/sameSite
❌ Returning full user rows to Client Components
❌ Different error messages for "no user" vs "wrong password"
❌ No rate limiting on login/reset
❌ Weak password hashing
❌ Long-lived tokens that can't be revoked
❌ Open redirect after login
❌ Not invalidating sessions after password change
❌ Rolling your own crypto
❌ Hiding UI instead of enforcing on the server
```

------------------------------------------------------------------------

# 20. Interview Questions

### Q1. Authentication vs authorization?

Authentication verifies who you are; authorization verifies what you
are allowed to do.

### Q2. How do you implement sessions in Next.js?

Create a signed/encrypted token or session ID, store it in an httpOnly,
secure, SameSite cookie, and verify it on every request.

### Q3. JWT vs database sessions?

JWTs are stateless and fast but harder to revoke. Database sessions are
easy to revoke and always current but need a lookup.

### Q4. Why not store tokens in localStorage?

Any XSS can read localStorage; httpOnly cookies are inaccessible to
JavaScript.

### Q5. What is a Data Access Layer?

A server-only module that verifies sessions, authorizes access, and
returns safe DTOs, used by pages, actions and handlers.

### Q6. Is middleware enough for protecting routes?

No. It's an optimistic first filter; real checks must happen near the
data.

### Q7. Why not rely on layout.tsx for auth checks?

Layouts don't re-render on every navigation, so the check might not
run for child routes.

### Q8. How do you protect Server Actions?

Verify the session, check ownership/role, and validate input in each
action.

### Q9. How do you store passwords?

Hash with argon2id or bcrypt with proper cost; never store plain text.

### Q10. What is RBAC?

Role-Based Access Control: permissions are granted via roles such as
admin, editor, user.

### Q11. How does OAuth login work?

Redirect to a provider, user consents, callback with a code, server
exchanges it for tokens (with state and PKCE), creates/links a local
user and a session.

### Q12. How do you prevent user enumeration?

Use generic error messages and consistent responses for login and
password reset.

### Q13. How do you revoke JWT sessions?

Short expirations plus refresh tokens, a token version/revocation list,
or switch to database sessions.

------------------------------------------------------------------------

# 21. Interview Failure Points

Avoid:

``` text
❌ "Login is done once, so the user is trusted everywhere."

❌ "Middleware protects my app."

❌ "I hide the admin button for normal users."

❌ "JWT in localStorage is fine."

❌ "I'll write my own encryption."

❌ "Authentication and authorization are the same thing."
```

Better mental model:

``` text
Identity
 ↓
Verified from a secure cookie on every request

Permissions
 ↓
Checked per resource and action

Layers
 ↓
Middleware (UX) + DAL (security) + DB constraints

Sessions
 ↓
Short-lived, revocable, httpOnly
```

------------------------------------------------------------------------

# 22. Real-World SaaS Auth Architecture

``` text
                      SAAS
                        │
     ┌──────────┬───────┼───────┬───────────┐
     ▼          ▼       ▼       ▼           ▼
   Login      Session   Org    Roles     Billing
     │          │       │       │           │
  Password/   httpOnly  orgId  admin/     plan
  OAuth/MFA   cookie    in     member/    limits
                        session viewer
```

Request flow:

``` text
Request
   ↓
Middleware: cookie present? (optimistic redirect)
   ↓
Page / Action / Handler
   ↓
verifySession() → userId, orgId, role
   ↓
can(role, "project:update")?
   ↓
Query scoped by orgId
   ↓
Return DTO
```

------------------------------------------------------------------------

# 23. Auth Decision Tree

``` text
Need authentication?
        │
        ▼
Need to ship fast with social login + MFA?
        │
   ┌────┴────┐
   ▼         ▼
  Yes        No
   │         │
   ▼         ▼
Hosted     Need own DB & control?
(Clerk/        │
Auth0)    ┌────┴────┐
          ▼         ▼
         Yes       Learning/simple
          │         │
          ▼         ▼
     Auth.js /    Custom sessions
     Better Auth  (jose + DAL)
```

Session type:

``` text
Need instant revocation?
   Yes → database/Redis sessions
   No  → encrypted JWT cookie with short expiry
```

------------------------------------------------------------------------

# 24. Production Checklist

``` text
- [ ] Passwords hashed with argon2id/bcrypt
- [ ] Session cookie: httpOnly, secure, SameSite
- [ ] Session secret in env, 32+ random bytes
- [ ] Sessions have expiry and a revocation strategy
- [ ] verifySession() in a DAL used everywhere
- [ ] Auth checked near data, not only in middleware/layout
- [ ] Authorization (ownership/role) on every sensitive operation
- [ ] Server Actions and Route Handlers authenticate + authorize
- [ ] DTOs returned, never raw user rows
- [ ] Generic login/reset error messages
- [ ] Rate limiting on login, signup, reset, OTP
- [ ] MFA/passkeys for sensitive apps
- [ ] Email verification and password reset flow secured
- [ ] OAuth: state + PKCE + redirect URI allow-list
- [ ] Redirect-after-login validated (no open redirect)
- [ ] Sessions invalidated on password change
- [ ] Failed logins and admin actions logged
- [ ] Unique constraints on email at DB level
```

------------------------------------------------------------------------

# 25. 30-Second Revision

``` text
AuthN
↓
Who are you?

AuthZ
↓
What can you do?

Session
↓
httpOnly + secure + SameSite cookie

JWT
↓
Stateless, hard to revoke

DB session
↓
Revocable, lookup per request

DAL
↓
verifySession + authorize + DTO

Middleware
↓
Optimistic redirect only

Layout
↓
Not a reliable auth boundary

Passwords
↓
argon2id / bcrypt

OAuth
↓
Code + PKCE + state

RBAC / ownership
↓
Check on every operation
```

------------------------------------------------------------------------

# 26. Final Interview Answer

> "For authentication in Next.js I either use a proven solution like
> Auth.js, Better Auth or a hosted provider, or implement sessions
> myself with an encrypted JWT or database session stored in an
> httpOnly, secure, SameSite cookie. Passwords are hashed with
> argon2id or bcrypt, login errors are generic, and I rate limit auth
> endpoints. I centralize verification in a Data Access Layer using
> `verifySession`, and I use middleware only for optimistic redirects
> because it isn't a complete security boundary, and I don't rely on
> layouts since they don't re-render on every navigation. Authorization
> is enforced separately in every page, Server Action and Route Handler
> by checking ownership or roles, scoping queries by user or tenant from
> the session, and returning minimal DTOs. For OAuth I use the
> authorization code flow with state and PKCE, and I validate redirect
> targets, revoke sessions on password changes, and add MFA or passkeys
> for sensitive apps."

------------------------------------------------------------------------

# 27. One-Line Rule

> **Verify identity from a secure cookie on every request, and check
> permission for every resource --- at the data layer.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
AuthN
→ Identity

AuthZ
→ Permission

httpOnly cookie
→ Safe session storage

jose
→ Sign/encrypt JWTs

bcrypt / argon2id
→ Password hashing

DAL
→ Central auth + DTOs

Middleware
→ Optimistic checks

Layout
→ Not enough for auth

RBAC
→ Roles/permissions

Ownership check
→ Prevent IDOR

OAuth
→ Code + PKCE + state

MFA / Passkeys
→ Stronger auth

Generic errors
→ Prevent enumeration

Session revocation
→ DB sessions / short JWT
```

### BEST GENERAL ARCHITECTURE

``` text
                  AUTH SYSTEM
                       │
     ┌─────────────────┼─────────────────┐
     ▼                 ▼                 ▼
  Identity           Session          Permissions
     │                 │                 │
  Password          httpOnly           RBAC
  OAuth             cookie             Ownership
  MFA / Passkeys    JWT / DB           Tenant scope
     │                 │                 │
     └─────────────────┼─────────────────┘
                       ▼
                Data Access Layer
        verifySession → authorize → DTO
                       │
                       ▼
            Secure, Revocable Access
```