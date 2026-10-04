# 08 --- Server Actions & Functions

> Next.js App Router --- `"use server"`, Server Functions vs Server
> Actions, forms, `useActionState`, `useFormStatus`, `useOptimistic`,
> `useTransition`, revalidation, redirects, errors, validation,
> security, file uploads, common mistakes & interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
                  SERVER ACTIONS

     Client (browser)                 Server
   ┌─────────────────┐          ┌─────────────────┐
   │ <form action>   │  POST    │ async function  │
   │ button / event  │ ───────► │ "use server"    │
   │                 │ ◄─────── │ DB / email / fs │
   └─────────────────┘  result  └─────────────────┘
```

Think:

``` text
Server Action
     ↓
An async function that runs on the server
     ↓
Called from the client like a function
     ↓
Actually an HTTP POST under the hood
```

Terminology:

``` text
Server Function → any async function marked "use server"
Server Action   → a Server Function used for a mutation
                  (form action or event handler)
```

------------------------------------------------------------------------

# 2. Why Server Actions Matter

They replace a lot of boilerplate:

``` text
Before                              After
─────────────────────────────────────────────────────────
Create /api route                   Write one function
fetch() from client                 Call function / form action
Parse JSON, handle errors           Typed arguments, simple return
Manual revalidation                 revalidatePath / revalidateTag
```

Benefits:

``` text
Less code
Type safety end-to-end
Progressive enhancement (forms work without JS)
Tight integration with caching
Secrets stay on the server
```

Use them for:

``` text
Mutations (create, update, delete)
Form submissions
Sending emails
Uploading files
Triggering server work from UI
```

Not for:

``` text
Fetching data to render (use Server Components)
Public REST APIs for third parties (use Route Handlers)
Webhooks (use Route Handlers)
```

------------------------------------------------------------------------

# 3. Defining a Server Action

### In a separate file (recommended)

``` ts
// app/actions/posts.ts
"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string

  await db.post.create({ data: { title } })

  revalidatePath("/posts")
}
```

Every exported function in the file becomes a Server Function.

### Inline in a Server Component

``` tsx
export default function Page() {
  async function create(formData: FormData) {
    "use server"
    await db.post.create({ data: { title: formData.get("title") as string } })
  }

  return (
    <form action={create}>
      <input name="title" />
      <button>Save</button>
    </form>
  )
}
```

Rules:

``` text
Inline "use server" is only for Server Components
Client Components must import actions from a "use server" file
Exported functions in "use server" files must be async
```

------------------------------------------------------------------------

# 4. Using a Form

``` tsx
import { createPost } from "@/app/actions/posts"

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="body" />
      <button type="submit">Create</button>
    </form>
  )
}
```

Flow:

``` text
User submits form
      ↓
Browser sends FormData (POST)
      ↓
Server runs createPost(formData)
      ↓
revalidatePath updates cache
      ↓
UI refreshes with new data
```

Progressive enhancement:

``` text
Works even before JavaScript loads (in Server Component forms)
Better resilience on slow devices
```

------------------------------------------------------------------------

# 5. Calling from Event Handlers

``` tsx
"use client"

import { deletePost } from "@/app/actions/posts"
import { useTransition } from "react"

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deletePost(id)
        })
      }
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  )
}
```

Mental model:

``` text
Form → action={fn}
Button / event → fn() inside startTransition
```

`startTransition` gives you:

``` text
isPending state
Non-blocking UI
Proper integration with React's rendering
```

------------------------------------------------------------------------

# 6. `useActionState` (Form State)

Handle validation errors and results from the server.

``` ts
// app/actions/auth.ts
"use server"

import { z } from "zod"

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
})

export type FormState = {
  errors?: { email?: string[]; password?: string[] }
  message?: string
} | undefined

export async function signup(prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  await createUser(parsed.data)
  return { message: "Account created" }
}
```

``` tsx
"use client"

import { useActionState } from "react"
import { signup } from "@/app/actions/auth"

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined)

  return (
    <form action={action}>
      <input name="email" type="email" />
      {state?.errors?.email && <p role="alert">{state.errors.email[0]}</p>}

      <input name="password" type="password" />
      {state?.errors?.password && <p role="alert">{state.errors.password[0]}</p>}

      <button disabled={pending}>{pending ? "Creating..." : "Sign up"}</button>
      {state?.message && <p>{state.message}</p>}
    </form>
  )
}
```

Signature:

``` text
const [state, formAction, isPending] = useActionState(action, initialState)

action(prevState, formData) → newState
```

Note: in older React/Next versions this hook was `useFormState` from
`react-dom`.

------------------------------------------------------------------------

# 7. `useFormStatus` (Pending in Child Components)

``` tsx
"use client"

import { useFormStatus } from "react-dom"

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving..." : children}
    </button>
  )
}
```

Usage:

``` tsx
<form action={createPost}>
  <input name="title" />
  <SubmitButton>Create</SubmitButton>
</form>
```

Important:

``` text
useFormStatus must be rendered INSIDE the <form>
It reads the status of the nearest parent form
```

Use:

``` text
useActionState  → state/result of the action
useFormStatus   → pending status in nested components
```

------------------------------------------------------------------------

# 8. `useOptimistic` (Instant UI)

Show the result immediately, reconcile later.

``` tsx
"use client"

import { useOptimistic } from "react"
import { addTodo } from "@/app/actions/todos"

export function Todos({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTitle: string) => [...state, { id: crypto.randomUUID(), title: newTitle, pending: true }]
  )

  async function action(formData: FormData) {
    const title = formData.get("title") as string
    addOptimistic(title)               // UI updates instantly
    await addTodo(title)               // server work
  }

  return (
    <>
      <form action={action}>
        <input name="title" />
        <button>Add</button>
      </form>

      <ul>
        {optimisticTodos.map((t) => (
          <li key={t.id} style={{ opacity: t.pending ? 0.5 : 1 }}>{t.title}</li>
        ))}
      </ul>
    </>
  )
}
```

Flow:

``` text
Click
  ↓
UI updates instantly (optimistic)
  ↓
Server action runs
  ↓
Real data arrives → replaces optimistic state
  ↓
On failure → optimistic change disappears
```

Good for:

``` text
Likes, favorites
Todo lists
Comments
Reordering
```

------------------------------------------------------------------------

# 9. Revalidation After Mutation

Typical action shape:

``` ts
"use server"

export async function updateProduct(id: string, data: ProductInput) {
  // 1. Authenticate
  // 2. Authorize
  // 3. Validate
  // 4. Mutate
  await db.product.update({ where: { id }, data })

  // 5. Refresh affected cache
  revalidateTag("products")
  revalidatePath(`/products/${id}`)
}
```

Mental model:

``` text
Mutation
   ↓
Invalidate caches
   ↓
Next render gets fresh data
```

See: `07-caching-revalidation.md`.

------------------------------------------------------------------------

# 10. `redirect()` in Actions

``` ts
"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createPost(formData: FormData) {
  const post = await db.post.create({ data: { title: formData.get("title") as string } })

  revalidatePath("/posts")
  redirect(`/posts/${post.id}`)        // must be called OUTSIDE try/catch
}
```

Important:

``` text
redirect() works by throwing a special error
Do not wrap it in try/catch (or rethrow it)
Call it after revalidatePath
Code after redirect() does not run
```

Wrong:

``` ts
try {
  await save()
  redirect("/done")       // ❌ caught by your own catch
} catch (e) {
  return { error: "Failed" }
}
```

Right:

``` ts
try {
  await save()
} catch {
  return { error: "Failed" }
}
redirect("/done")
```

Same applies to `notFound()`.

------------------------------------------------------------------------

# 11. Error Handling

Two kinds of errors:

``` text
Expected errors  → validation failed, email already used
                   Return them as values

Unexpected errors → DB down, bug
                   Throw; handled by error.tsx
```

Expected:

``` ts
export async function signup(prev: FormState, formData: FormData) {
  const exists = await db.user.findUnique({ where: { email } })
  if (exists) return { errors: { email: ["Email already in use"] } }
  ...
}
```

Unexpected:

``` ts
throw new Error("Database unavailable")
// → nearest error.tsx boundary
```

Pattern for non-form calls:

``` ts
type Result<T> = { ok: true; data: T } | { ok: false; error: string }

export async function archivePost(id: string): Promise<Result<null>> {
  try {
    await db.post.update({ where: { id }, data: { archived: true } })
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: "Could not archive" }
  }
}
```

Rule:

``` text
Return expected failures
Throw unexpected failures
```

See: `12-loading-error-architecture.md`.

------------------------------------------------------------------------

# 12. Validation

Never trust input.

``` ts
"use server"
import { z } from "zod"

const schema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  price: z.coerce.number().positive(),
})

export async function updateItem(formData: FormData) {
  const data = schema.parse(Object.fromEntries(formData))
  ...
}
```

Notes:

``` text
FormData values are strings or File
Use z.coerce for numbers/dates
safeParse for user-facing errors, parse for programmer errors
Validate on the server even if the client also validates
```

See: `11-forms-validation.md`.

------------------------------------------------------------------------

# 13. Security

Server Actions are **public HTTP endpoints**.

``` text
Every action must:
1. Authenticate
2. Authorize (ownership / role)
3. Validate input
4. Then mutate
```

``` ts
"use server"

export async function deletePost(id: string) {
  const session = await verifySession()                  // 1

  const post = await db.post.findUnique({ where: { id } })
  if (!post || post.authorId !== session.userId) {       // 2
    throw new Error("Forbidden")
  }

  await db.post.delete({ where: { id } })                // 4
}
```

Remember:

``` text
Hiding a button is not security
Bound/closed-over values are encrypted but still shouldn't be trusted blindly
Don't return sensitive data
Rate limit sensitive actions (login, OTP, email)
CSRF: Next.js compares Origin and Host; configure allowedOrigins behind proxies
```

See: `17-security.md`.

------------------------------------------------------------------------

# 14. Passing Extra Arguments (`bind`)

``` tsx
import { updatePost } from "@/app/actions/posts"

export default function EditForm({ id }: { id: string }) {
  const updateWithId = updatePost.bind(null, id)

  return (
    <form action={updateWithId}>
      <input name="title" />
      <button>Save</button>
    </form>
  )
}
```

``` ts
export async function updatePost(id: string, formData: FormData) {
  // id comes first, formData last
}
```

Alternative:

``` tsx
<input type="hidden" name="id" value={id} />
```

Either way:

``` text
The server must re-check ownership of `id`
Never trust it just because it came from your form
```

------------------------------------------------------------------------

# 15. File Uploads

``` tsx
<form action={uploadAvatar}>
  <input type="file" name="avatar" accept="image/*" />
  <button>Upload</button>
</form>
```

``` ts
"use server"

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("avatar") as File | null

  if (!file || file.size === 0) return { error: "No file" }
  if (file.size > 2 * 1024 * 1024) return { error: "Max 2 MB" }
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return { error: "Invalid type" }
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  await storage.put(`avatars/${crypto.randomUUID()}`, bytes)
}
```

Limits:

``` ts
// next.config.ts
experimental: { serverActions: { bodySizeLimit: "2mb" } }
```

For large files:

``` text
Use pre-signed URLs and upload directly to object storage (S3/R2/Blob)
Don't stream big files through your server
```

------------------------------------------------------------------------

# 16. Cookies & Headers in Actions

``` ts
"use server"
import { cookies } from "next/headers"

export async function setTheme(theme: "light" | "dark") {
  const store = await cookies()
  store.set("theme", theme, { httpOnly: false, path: "/", maxAge: 60 * 60 * 24 * 365 })
}
```

Login example:

``` ts
export async function login(prev: unknown, formData: FormData) {
  ...
  const store = await cookies()
  store.set("session", token, { httpOnly: true, secure: true, sameSite: "lax" })
  redirect("/dashboard")
}
```

Notes:

``` text
cookies() is async in newer Next.js versions
Cookies can be set in Actions and Route Handlers, not during rendering
```

------------------------------------------------------------------------

# 17. Execution Behavior

``` text
Actions from the same client are queued and run one at a time
Each call is a separate POST request
Actions are not cached
Return values must be serializable (no functions, class instances)
```

Implications:

``` text
Don't use actions for fast-fire reads or search-as-you-type
Don't expect parallel execution of many actions
Return plain objects, strings, numbers, arrays
```

Search-as-you-type:

``` text
Use URL search params + Server Component rendering
or a Route Handler / debounced fetch
```

------------------------------------------------------------------------

# 18. Server Actions vs Route Handlers

``` text
                    Server Action           Route Handler
────────────────────────────────────────────────────────────────────
Purpose             UI mutations            HTTP API endpoints
Called from         Your React UI           Anything (mobile, 3rd party)
URL                 Internal/hidden         Public, stable
Methods             POST only               GET/POST/PUT/DELETE...
Forms               Native support          Manual
Caching             Not cached              Configurable
Best for            Forms, buttons          Webhooks, public API, files
```

Rule:

``` text
Your own UI mutating data → Server Action
External consumers / webhooks → Route Handler
```

See: `09-route-handlers.md`.

------------------------------------------------------------------------

# 19. Organizing Actions

``` text
app/
├── actions/
│   ├── posts.ts
│   ├── auth.ts
│   └── billing.ts
├── lib/
│   ├── dal.ts          # auth + data access
│   └── validations.ts  # zod schemas
```

Pattern:

``` text
Action (thin)
   ↓
Validate (zod)
   ↓
Authorize (DAL)
   ↓
Service / DB
   ↓
Revalidate
```

Keep business logic in reusable service functions, not inside actions.

------------------------------------------------------------------------

# 20. Common Mistakes

``` text
❌ No auth/authz check inside the action
❌ Trusting hidden form fields and bound IDs
❌ Using actions to fetch data for rendering
❌ try/catch swallowing redirect()
❌ Forgetting revalidatePath / revalidateTag
❌ Returning non-serializable values
❌ Throwing for expected validation errors
❌ Client-only validation
❌ Using useFormStatus outside the form
❌ Large file uploads through the server
❌ Business logic duplicated across actions
❌ Not showing pending state
❌ Expecting parallel execution
```

------------------------------------------------------------------------

# 21. Interview Questions

### Q1. What is a Server Action?

An async function marked `"use server"` that runs on the server and can
be called from forms or event handlers.

### Q2. How does it work under the hood?

The client sends a POST request; Next.js routes it to the function and
returns the serialized result and updated UI.

### Q3. Are Server Actions secure by default?

They have helpful protections, but they are public endpoints. You must
authenticate, authorize and validate in each one.

### Q4. How do you handle validation errors?

Validate with Zod and return error objects using `useActionState`.

### Q5. What is `useFormStatus`?

A hook giving the pending status of the parent form, used in child
components like submit buttons.

### Q6. What is `useOptimistic`?

Shows an immediate optimistic UI while the server action runs, then
reconciles with real data.

### Q7. Why shouldn't `redirect()` be inside try/catch?

It throws a special error to perform the redirect; catching it breaks
the redirect.

### Q8. When use a Route Handler instead?

For public APIs, webhooks, non-React clients, or non-POST HTTP methods.

### Q9. How do you refresh data after a mutation?

Call `revalidatePath` or `revalidateTag` in the action.

### Q10. Can Server Actions fetch data?

Technically yes, but they are for mutations. Use Server Components for
reads.

### Q11. How do you pass additional arguments to an action?

Use `.bind(null, arg)` or hidden inputs, and re-validate on the server.

### Q12. Do Server Actions run in parallel?

Actions from the same client are queued and run sequentially.

------------------------------------------------------------------------

# 22. Interview Failure Points

Avoid:

``` text
❌ "Server Actions are just internal functions, so they're safe."

❌ "I use Server Actions for all data fetching."

❌ "I validate only on the client."

❌ "redirect() returns like a normal function."

❌ "Actions replace all API routes."
```

Better mental model:

``` text
Action
 ↓
Public POST endpoint with a friendly function API

Mutations
 ↓
Auth → authorize → validate → mutate → revalidate

Reads
 ↓
Server Components

Errors
 ↓
Expected = return, unexpected = throw
```

------------------------------------------------------------------------

# 23. Real-World Example: Comment System

``` text
Page (Server) → loads comments
   │
   ├── CommentList (Server)
   └── CommentForm (Client)
          │
          ├── useActionState → validation errors
          ├── useOptimistic  → instant comment
          └── SubmitButton   → useFormStatus
```

``` ts
"use server"

export async function addComment(prev: State, formData: FormData): Promise<State> {
  const session = await verifySession()

  const parsed = commentSchema.safeParse({
    postId: formData.get("postId"),
    body: formData.get("body"),
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  await db.comment.create({
    data: { ...parsed.data, authorId: session.userId },
  })

  revalidateTag(`comments-${parsed.data.postId}`)
  return { message: "Comment added" }
}
```

------------------------------------------------------------------------

# 24. Action Decision Tree

``` text
Need to change data from my UI?
          │
         Yes
          ▼
Is it a form / button in my app?
          │
      ┌───┴───┐
      ▼       ▼
     Yes      No (external / webhook / public)
      │       │
      ▼       ▼
Server Action  Route Handler
      │
      ▼
Needs field errors?
      │
  ┌───┴───┐
  ▼       ▼
 Yes      No
  │       │
useActionState   call in startTransition
```

------------------------------------------------------------------------

# 25. Production Checklist

``` text
- [ ] Actions live in "use server" files
- [ ] Every action authenticates
- [ ] Every action authorizes (ownership/role)
- [ ] Input validated with Zod on the server
- [ ] Expected errors returned, not thrown
- [ ] redirect()/notFound() outside try/catch
- [ ] revalidatePath/Tag after mutations
- [ ] Pending state shown (useActionState/useFormStatus)
- [ ] Optimistic UI where appropriate
- [ ] File size/type limits enforced
- [ ] bodySizeLimit configured if needed
- [ ] Rate limiting on sensitive actions
- [ ] Return values are serializable
- [ ] Business logic in reusable services
- [ ] allowedOrigins configured behind proxies
```

------------------------------------------------------------------------

# 26. 30-Second Revision

``` text
"use server"
↓
Marks Server Functions

<form action={fn}>
↓
Native form + progressive enhancement

useActionState
↓
Form state, errors, pending

useFormStatus
↓
Pending in child components

useOptimistic
↓
Instant UI

startTransition
↓
Call actions from events

revalidatePath / Tag
↓
Refresh data

redirect()
↓
Outside try/catch

Security
↓
Auth + authz + validate every time

Reads
↓
Server Components, not actions
```

------------------------------------------------------------------------

# 27. Final Interview Answer

> "Server Actions are async functions marked with `'use server'` that I
> use for mutations from forms and event handlers. Under the hood they
> are POST endpoints, so in every action I authenticate, authorize,
> validate input with Zod, mutate, and then call `revalidatePath` or
> `revalidateTag`. For forms I use `useActionState` to show server-side
> validation errors, `useFormStatus` for pending buttons, and
> `useOptimistic` for instant feedback. I return expected errors as
> values, throw unexpected ones to the error boundary, and keep
> `redirect()` outside try/catch. I use Server Components for reading
> data and Route Handlers for webhooks or public APIs. For large files
> I use pre-signed uploads, and for sensitive actions I add rate
> limiting."

------------------------------------------------------------------------

# 28. One-Line Rule

> **Treat every Server Action as a public API: authenticate,
> authorize, validate, mutate, revalidate.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
"use server"
→ Server Function marker

form action={fn}
→ Submit to server

useActionState
→ State + errors + pending

useFormStatus
→ Pending inside form

useOptimistic
→ Optimistic updates

startTransition
→ Non-form invocation

revalidatePath/Tag
→ Refresh cache

redirect
→ Navigate (throws)

bind
→ Extra arguments

Return vs throw
→ Expected vs unexpected errors

Route Handler
→ External/public endpoints
```

### BEST GENERAL ARCHITECTURE

``` text
                 ACTION SYSTEM
                       │
      ┌────────────────┼────────────────┐
      ▼                ▼                ▼
    Client           Action           Server
      │                │                │
  form / button   authenticate     DB / services
  useActionState  authorize        revalidateTag
  useOptimistic   validate (Zod)   redirect
  pending UI      return result    emails, files
      │                │                │
      └────────────────┼────────────────┘
                       ▼
             Safe + Simple Mutations
```