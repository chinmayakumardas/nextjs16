# 11 --- Forms & Validation

> Next.js App Router --- native forms, Server Actions, `FormData`, Zod
> schemas, `useActionState`, `useFormStatus`, client + server
> validation, React Hook Form, accessibility, file uploads, multi-step
> forms, optimistic UI, security, common mistakes & interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
                    FORMS IN NEXT.JS

   User input
       │
       ▼
┌───────────────┐   instant UX    ┌────────────────┐
│ Client checks │ ──────────────► │ Show errors    │
│ (HTML, Zod)   │                 └────────────────┘
└───────────────┘
       │ submit
       ▼
┌───────────────┐   real safety   ┌────────────────┐
│ Server Action │ ──────────────► │ Validate (Zod) │
│ / Handler     │                 │ Authorize      │
└───────────────┘                 │ Save           │
                                  └────────────────┘
```

Think:

``` text
Client validation = better user experience
Server validation = actual security
```

Never skip the server.

------------------------------------------------------------------------

# 2. Why Forms & Validation Matter

Forms are the main way users send data. Bad forms cause:

``` text
Invalid or malicious data in the database
Security holes (injection, abuse, spam)
Frustrated users (unclear errors, lost input)
Accessibility failures
Duplicate submissions
```

Good forms provide:

``` text
Clear, immediate feedback
Safe, validated data
Accessible interaction
Resilience (works without JavaScript when possible)
```

------------------------------------------------------------------------

# 3. Native HTML Forms First

HTML already gives you a lot:

``` tsx
<form action={subscribe}>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    name="email"
    type="email"
    required
    autoComplete="email"
    maxLength={254}
  />

  <label htmlFor="age">Age</label>
  <input id="age" name="age" type="number" min={18} max={120} />

  <button type="submit">Subscribe</button>
</form>
```

Useful attributes:

``` text
required            → must be filled
type="email|url|number|tel|date"
min / max / minLength / maxLength
pattern             → regex
autoComplete        → browser autofill
inputMode           → mobile keyboard type
```

Rule:

``` text
Use native validation as a baseline
Add richer validation on top
```

The `name` attribute is what ends up in `FormData`. No `name`, no value.

------------------------------------------------------------------------

# 4. `FormData`

``` ts
"use server"

export async function createUser(formData: FormData) {
  const name = formData.get("name")           // string | File | null
  const email = formData.get("email")
  const interests = formData.getAll("interests")   // multiple values

  const raw = Object.fromEntries(formData)    // { name: "...", email: "..." }
}
```

Pitfalls:

``` text
Values are strings (or File), never numbers/booleans
Empty text input → "" (empty string), not null
Unchecked checkbox → field missing entirely
Checked checkbox → "on" (default value)
Multiple checkboxes with same name → use getAll()
Object.fromEntries drops duplicate names (keeps last)
```

Handling:

``` ts
const subscribed = formData.get("subscribed") === "on"
const tags = formData.getAll("tags").map(String)
```

------------------------------------------------------------------------

# 5. Zod Schemas

``` bash
npm install zod
```

``` ts
// lib/validations/user.ts
import { z } from "zod"

export const SignupSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(80),
    email: z.string().trim().toLowerCase().email("Invalid email"),
    age: z.coerce.number().int().min(18, "Must be 18+").max(120),
    password: z.string().min(12, "At least 12 characters").max(128),
    confirmPassword: z.string(),
    terms: z.literal("on", { errorMap: () => ({ message: "You must accept the terms" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignupInput = z.infer<typeof SignupSchema>
```

Key tools:

``` text
z.string().trim().email()
z.coerce.number()           → "42" → 42
z.coerce.date()
z.enum([...])
z.array(z.string())
.optional() / .nullable() / .default()
.refine() / .superRefine()  → cross-field rules
.transform()                → normalize
z.infer<typeof Schema>      → TypeScript type
```

Empty strings:

``` ts
// Treat "" as undefined for optional fields
const optionalString = z.string().trim().transform((v) => v || undefined).optional()
```

One schema, used on both client and server:

``` text
lib/validations/*.ts
   ├── imported by Server Action (security)
   └── imported by client form (UX)
```

------------------------------------------------------------------------

# 6. Server Action + `useActionState`

### Action

``` ts
// app/actions/signup.ts
"use server"

import { SignupSchema } from "@/lib/validations/user"

export type SignupState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  values?: Record<string, string>
}

export async function signup(prev: SignupState, formData: FormData): Promise<SignupState> {
  const raw = Object.fromEntries(formData) as Record<string, string>
  const parsed = SignupSchema.safeParse(raw)

  if (!parsed.success) {
    const { password, confirmPassword, ...safeValues } = raw      // don't echo passwords
    return {
      errors: parsed.error.flatten().fieldErrors,
      values: safeValues,                                         // preserve input
    }
  }

  const exists = await db.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) {
    return { errors: { email: ["Email already in use"] }, values: { name: raw.name, email: raw.email } }
  }

  await createUser(parsed.data)
  return { message: "Account created" }
}
```

### Form

``` tsx
"use client"

import { useActionState } from "react"
import { signup } from "@/app/actions/signup"

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {})

  return (
    <form action={action} noValidate>
      <Field label="Name" name="name" defaultValue={state.values?.name} error={state.errors?.name?.[0]} />
      <Field label="Email" name="email" type="email" defaultValue={state.values?.email} error={state.errors?.email?.[0]} />
      <Field label="Password" name="password" type="password" error={state.errors?.password?.[0]} />
      <Field label="Confirm" name="confirmPassword" type="password" error={state.errors?.confirmPassword?.[0]} />

      <label>
        <input type="checkbox" name="terms" /> I accept the terms
      </label>
      {state.errors?.terms && <p role="alert">{state.errors.terms[0]}</p>}

      <button disabled={pending}>{pending ? "Creating..." : "Sign up"}</button>
      {state.message && <p role="status">{state.message}</p>}
    </form>
  )
}
```

Important behavior:

``` text
React resets uncontrolled form fields after an action completes
→ return submitted values and use defaultValue to preserve input
→ never send passwords back
```

------------------------------------------------------------------------

# 7. Reusable Field Component (Accessible)

``` tsx
type FieldProps = {
  label: string
  name: string
  type?: string
  defaultValue?: string
  error?: string
}

export function Field({ label, name, type = "text", defaultValue, error }: FieldProps) {
  const id = `field-${name}`
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
```

Accessibility rules:

``` text
Every input has a visible <label> linked via htmlFor/id
Errors tied to inputs via aria-describedby
aria-invalid on invalid inputs
role="alert" (or aria-live) for dynamic errors
Don't rely on color alone
Move focus to the first error after submit
Use autocomplete attributes
Disabled buttons: also indicate state in text
```

Focus first error:

``` tsx
const formRef = useRef<HTMLFormElement>(null)

useEffect(() => {
  if (state.errors) {
    formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()
  }
}, [state.errors])
```

------------------------------------------------------------------------

# 8. Pending State & Double Submit

Submit button:

``` tsx
"use client"
import { useFormStatus } from "react-dom"

export function SubmitButton({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? "Saving..." : label}
    </button>
  )
}
```

Prevent duplicates:

``` text
Disable the submit button while pending
Use idempotency keys for payments/orders
Add unique constraints in the database
```

Idempotency key:

``` tsx
<input type="hidden" name="idempotencyKey" value={crypto.randomUUID()} />
```

(generate once per form instance, not on each render)

Server:

``` ts
const existing = await db.order.findUnique({ where: { idempotencyKey } })
if (existing) return { orderId: existing.id }
```

------------------------------------------------------------------------

# 9. Client-Side Validation

Instant feedback with the same schema:

``` tsx
"use client"
import { useState } from "react"
import { SignupSchema } from "@/lib/validations/user"

export function EmailField() {
  const [error, setError] = useState<string>()

  return (
    <input
      name="email"
      type="email"
      onBlur={(e) => {
        const result = SignupSchema.shape.email.safeParse(e.target.value)
        setError(result.success ? undefined : result.error.issues[0].message)
      }}
      aria-invalid={!!error}
    />
  )
}
```

When to validate:

``` text
onBlur   → good default (after user leaves field)
onChange → only after first error (re-validate), or for passwords strength
onSubmit → always (final gate)
```

Avoid:

``` text
Showing errors while the user is still typing for the first time
Blocking submit with only client validation
```

------------------------------------------------------------------------

# 10. React Hook Form + Server Actions

For complex client-heavy forms (dynamic fields, wizards, rich UI).

``` bash
npm install react-hook-form @hookform/resolvers zod
```

``` tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { z } from "zod"
import { createProject } from "@/app/actions/projects"

const Schema = z.object({
  name: z.string().min(2, "Too short"),
  budget: z.coerce.number().positive(),
})
type Values = z.infer<typeof Schema>

export function ProjectForm() {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(Schema) })

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const result = await createProject(values)     // server re-validates!
      if (result?.errors) {
        Object.entries(result.errors).forEach(([field, messages]) =>
          setError(field as keyof Values, { message: messages?.[0] })
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} aria-invalid={!!errors.name} />
      {errors.name && <p role="alert">{errors.name.message}</p>}

      <input type="number" {...register("budget")} />
      {errors.budget && <p role="alert">{errors.budget.message}</p>}

      <button disabled={isPending}>Create</button>
    </form>
  )
}
```

Server side stays the same:

``` ts
"use server"
export async function createProject(values: unknown) {
  const parsed = Schema.safeParse(values)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }
  ...
}
```

Choosing:

``` text
Simple forms             → native form + useActionState
Complex dynamic forms    → React Hook Form + Zod
Need progressive enhancement → native forms + Server Actions
```

------------------------------------------------------------------------

# 11. Server Validation in Route Handlers

For API clients:

``` ts
export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = Schema.safeParse(json)

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }
  ...
}
```

Share schemas between actions, handlers and clients.

------------------------------------------------------------------------

# 12. File Upload Forms

``` tsx
<form action={uploadAvatar}>
  <input type="file" name="avatar" accept="image/png,image/jpeg,image/webp" />
  <SubmitButton label="Upload" />
</form>
```

``` ts
"use server"
import { z } from "zod"

const MAX = 2 * 1024 * 1024
const TYPES = ["image/png", "image/jpeg", "image/webp"]

const FileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, "Select a file")
  .refine((f) => f.size <= MAX, "Max 2 MB")
  .refine((f) => TYPES.includes(f.type), "PNG, JPEG or WebP only")

export async function uploadAvatar(formData: FormData) {
  const parsed = FileSchema.safeParse(formData.get("avatar"))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // store with a generated name, never the user's filename
}
```

Notes:

``` text
`accept` is only a hint — validate on the server
Check size AND type (ideally magic bytes)
Large files → pre-signed URL direct-to-storage upload
Show upload progress for big uploads
```

------------------------------------------------------------------------

# 13. Multi-Step Forms

Strategies:

``` text
1. Single client form + local state, submit once at end
2. Each step posts to the server, stored in DB draft / session
3. URL-based steps (/signup/step-1, /signup/step-2)
```

Client wizard sketch:

``` tsx
"use client"

const [step, setStep] = useState(1)
const [data, setData] = useState<Partial<Wizard>>({})

function next(partial: Partial<Wizard>) {
  setData((d) => ({ ...d, ...partial }))
  setStep((s) => s + 1)
}
```

Schemas per step:

``` ts
const Step1 = z.object({ email: z.string().email() })
const Step2 = z.object({ company: z.string().min(2) })
const Full = Step1.merge(Step2)           // validate everything at the end on the server
```

Rules:

``` text
Validate each step for UX
Re-validate the FULL payload on final submit (server)
Persist drafts for long forms
Allow back navigation without losing data
Reflect progress accessibly (aria-current, headings)
```

------------------------------------------------------------------------

# 14. Optimistic & Inline Forms

``` tsx
"use client"
import { useOptimistic } from "react"

export function Comments({ comments }: { comments: Comment[] }) {
  const [optimistic, add] = useOptimistic(comments, (state, text: string) => [
    ...state,
    { id: crypto.randomUUID(), text, pending: true },
  ])

  async function action(formData: FormData) {
    const text = String(formData.get("text") ?? "")
    add(text)
    await addComment(text)
  }

  return (
    <>
      <ul>{optimistic.map((c) => <li key={c.id} style={{ opacity: c.pending ? 0.6 : 1 }}>{c.text}</li>)}</ul>
      <form action={action}>
        <input name="text" required />
        <SubmitButton label="Post" />
      </form>
    </>
  )
}
```

Reset form after success:

``` tsx
const formRef = useRef<HTMLFormElement>(null)

async function action(formData: FormData) {
  await save(formData)
  formRef.current?.reset()
}
```

------------------------------------------------------------------------

# 15. Search & Filter Forms (GET)

Use GET forms for search so URLs are shareable.

``` tsx
// A native form that navigates with query params
<form action="/search">
  <input name="q" defaultValue={q} />
  <button>Search</button>
</form>
```

Or Next.js `Form` component:

``` tsx
import Form from "next/form"

<Form action="/search">
  <input name="q" />
  <button type="submit">Search</button>
</Form>
```

Benefits:

``` text
Shareable URLs
Back button works
Server Component reads searchParams
Client-side navigation with prefetch of loading UI
```

Page:

``` tsx
export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const results = q ? await search(q) : []
  ...
}
```

------------------------------------------------------------------------

# 16. Error Messages (UX)

Good messages:

``` text
Say what went wrong
Say how to fix it
Appear near the field
Are announced to screen readers
Keep user input
```

Bad vs good:

``` text
❌ "Invalid input"
✅ "Enter a valid email like name@example.com"

❌ "Error"
✅ "Password must be at least 12 characters"
```

Form-level errors:

``` text
"Could not create account. Please try again."
Show at the top with role="alert"
```

Server errors:

``` text
Don't expose internals ("duplicate key violates constraint...")
Map to friendly messages
Log details server-side
```

------------------------------------------------------------------------

# 17. Security for Forms

``` text
Validate on the server (always)
Authenticate and authorize actions
Sanitize/escape output (React escapes by default)
Rate limit login, signup, contact, reset forms
Add bot protection (honeypot, Turnstile, reCAPTCHA) on public forms
Limit input size (maxLength, body size limits)
Never trust hidden fields or bound IDs
Use CSRF protections (Server Actions check Origin/Host)
Don't echo sensitive values back (passwords, tokens)
```

Honeypot:

``` tsx
<input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
```

``` ts
if (formData.get("website")) return { message: "Thanks" }   // silently ignore bots
```

See: `17-security.md`.

------------------------------------------------------------------------

# 18. Contact Form Example (Complete)

Schema:

``` ts
// lib/validations/contact.ts
import { z } from "zod"

export const ContactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  message: z.string().trim().min(10, "At least 10 characters").max(2000),
})
```

Action:

``` ts
"use server"
import { ContactSchema } from "@/lib/validations/contact"
import { headers } from "next/headers"

export type ContactState = {
  errors?: Record<string, string[] | undefined>
  values?: Record<string, string>
  success?: boolean
}

export async function sendContact(prev: ContactState, formData: FormData): Promise<ContactState> {
  if (formData.get("website")) return { success: true }              // honeypot

  const ip = (await headers()).get("x-forwarded-for") ?? "anon"
  const { success: allowed } = await ratelimit.limit(`contact:${ip}`)
  if (!allowed) return { errors: { _form: ["Too many attempts. Try later."] } }

  const raw = Object.fromEntries(formData) as Record<string, string>
  const parsed = ContactSchema.safeParse(raw)

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, values: raw }
  }

  await sendEmail(parsed.data)
  return { success: true }
}
```

Form:

``` tsx
"use client"
import { useActionState } from "react"
import { sendContact } from "@/app/actions/contact"

export function ContactForm() {
  const [state, action] = useActionState(sendContact, {})

  if (state.success) return <p role="status">Thanks! We'll be in touch.</p>

  return (
    <form action={action} noValidate>
      <Field label="Name" name="name" defaultValue={state.values?.name} error={state.errors?.name?.[0]} />
      <Field label="Email" name="email" type="email" defaultValue={state.values?.email} error={state.errors?.email?.[0]} />
      <label htmlFor="message">Message</label>
      <textarea id="message" name="message" defaultValue={state.values?.message} />
      {state.errors?.message && <p role="alert">{state.errors.message[0]}</p>}
      {state.errors?._form && <p role="alert">{state.errors._form[0]}</p>}
      <SubmitButton label="Send" />
    </form>
  )
}
```

------------------------------------------------------------------------

# 19. Common Mistakes

``` text
❌ Only client-side validation
❌ Forgetting the name attribute on inputs
❌ Treating FormData values as numbers/booleans
❌ Not handling unchecked checkboxes (missing field)
❌ Losing user input after an error
❌ Echoing passwords back to the client
❌ Not showing pending state → double submits
❌ Missing labels / aria attributes
❌ Errors only shown by color
❌ Throwing for expected validation errors
❌ Not coercing numbers/dates (z.coerce)
❌ Trusting hidden fields (IDs, prices)
❌ No rate limiting or bot protection on public forms
❌ Different schema on client and server (drift)
❌ Exposing database error messages
❌ Using POST forms for search (breaks shareable URLs)
```

------------------------------------------------------------------------

# 20. Interview Questions

### Q1. Why validate on both client and server?

Client validation improves UX; server validation is the real security
boundary because clients can be bypassed.

### Q2. How do you handle form state with Server Actions?

Use `useActionState` to receive the action's returned state (errors,
messages, preserved values) and a pending flag.

### Q3. What does `useFormStatus` do?

Provides the pending state of the parent form to child components like
submit buttons.

### Q4. Why does `FormData` need coercion?

Values arrive as strings (or File). Use schema coercion like
`z.coerce.number()` to convert types.

### Q5. How do you handle checkboxes in FormData?

Unchecked boxes are absent; checked ones are `"on"` by default. Use
`=== "on"` or `getAll()` for groups.

### Q6. How do you preserve input after a server error?

Return submitted values (excluding secrets) from the action and use
them as `defaultValue`.

### Q7. How do you make forms accessible?

Labels, `aria-invalid`, `aria-describedby` for errors, `role="alert"`
messages, focus management, and no color-only cues.

### Q8. When use React Hook Form?

For complex client-side forms with dynamic fields, wizards or heavy
interactivity, still re-validating on the server.

### Q9. How do you prevent double submits?

Disable the button while pending, use idempotency keys and database
unique constraints.

### Q10. How do you share validation between client and server?

Put Zod schemas in a shared module and import them in both places.

### Q11. How do you handle file uploads securely?

Validate size and type on the server, generate your own filenames, store
in object storage, and use pre-signed URLs for large files.

### Q12. When should a form use GET?

For search and filter forms so URLs are shareable and the back button
works.

------------------------------------------------------------------------

# 21. Interview Failure Points

Avoid:

``` text
❌ "Client-side validation is enough."

❌ "FormData gives me typed values."

❌ "I return thrown errors for validation failures."

❌ "Accessibility is optional for forms."

❌ "Hidden fields are safe because users can't see them."

❌ "A disabled button prevents all duplicate submissions."
```

Better mental model:

``` text
Native form
 ↓
Baseline behavior + progressive enhancement

Zod
 ↓
Single schema → parse, coerce, normalize, type

Server
 ↓
Final validation + authorization

UX
 ↓
Inline, accessible, preserved input

Safety
 ↓
Rate limit, bot protection, idempotency
```

------------------------------------------------------------------------

# 22. Real-World Example: Checkout Form

``` text
Checkout
   │
   ├── Step 1: Contact (email, phone)
   ├── Step 2: Shipping address
   ├── Step 3: Payment (Stripe Elements – never touch card data)
   └── Step 4: Review & Place Order
```

Rules:

``` text
Validate each step on blur/continue
Server recomputes prices and totals (never trust client totals)
Idempotency key per order submission
Stripe handles card data (PCI compliance)
Persist draft/cart server-side
Clear, accessible errors and focus management
Autocomplete attributes for address/payment fields
```

------------------------------------------------------------------------

# 23. Form Decision Tree

``` text
New form
   │
   ▼
Search / filter?
   │
 ┌─┴─┐
 ▼   ▼
Yes  No
 │   │
 ▼   ▼
GET  Mutation
form    │
(next/  ▼
Form)  Complex, dynamic client UI?
          │
      ┌───┴───┐
      ▼       ▼
     Yes      No
      │       │
      ▼       ▼
 React Hook   Native form +
 Form + Zod   Server Action +
 + Action     useActionState
```

Validation location:

``` text
UX feedback  → client (HTML + Zod)
Security     → server (Zod + authorization)
```

------------------------------------------------------------------------

# 24. Production Checklist

``` text
- [ ] Every input has name, label and autocomplete
- [ ] Native validation attributes used where suitable
- [ ] Zod schema shared between client and server
- [ ] Server validates everything (never trust client)
- [ ] z.coerce / transforms used for FormData types
- [ ] Checkbox and empty-string cases handled
- [ ] Errors shown inline, accessible (aria-invalid, aria-describedby)
- [ ] Focus moves to first error
- [ ] Submitted values preserved (except secrets)
- [ ] Pending state and disabled submit button
- [ ] Idempotency / unique constraints for critical actions
- [ ] File uploads: size/type limits and safe storage
- [ ] Rate limiting and bot protection on public forms
- [ ] Authentication/authorization in actions
- [ ] Friendly error messages (no internals exposed)
- [ ] Search/filter forms use GET
- [ ] Works acceptably without JavaScript where feasible
- [ ] Tested with keyboard and screen reader
```

------------------------------------------------------------------------

# 25. 30-Second Revision

``` text
<form action={serverAction}>
↓
Native + progressive enhancement

FormData
↓
Strings/Files; coerce types

Zod
↓
Parse, coerce, normalize, type

useActionState
↓
Errors + values + pending

useFormStatus
↓
Pending in nested button

Client validation
↓
UX only

Server validation
↓
Security

Accessibility
↓
label + aria-invalid + aria-describedby

GET forms
↓
Search/filter with shareable URLs

Security
↓
Rate limit, honeypot, idempotency
```

------------------------------------------------------------------------

# 26. Final Interview Answer

> "For forms in Next.js I start with native HTML forms and Server
> Actions, which give me progressive enhancement. I define Zod schemas
> in a shared module and use them for fast client feedback and, more
> importantly, for server-side validation in the action, since the
> server is the real security boundary. I convert `FormData` values
> with `z.coerce` and handle edge cases like unchecked checkboxes and
> empty strings. With `useActionState` I return field errors and
> preserved values (never passwords), and `useFormStatus` drives pending
> states to prevent double submits, backed by idempotency keys or
> unique constraints where needed. I make forms accessible with labels,
> `aria-invalid`, `aria-describedby`, alert messages and focus
> management. For complex dynamic forms I use React Hook Form with the
> same Zod schema, still validating on the server, and I add rate
> limiting, bot protection and safe file upload checks on public
> forms."

------------------------------------------------------------------------

# 27. One-Line Rule

> **Validate for users on the client, validate for safety on the
> server --- with one shared schema and accessible errors.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
form action={fn}
→ Submit to Server Action

FormData
→ Strings/Files, no types

Zod
→ Schema validation + coercion

safeParse
→ Return errors without throwing

useActionState
→ State, errors, pending

useFormStatus
→ Pending in child components

useOptimistic
→ Instant UI

React Hook Form
→ Complex client forms

defaultValue
→ Preserve input after errors

aria-invalid / aria-describedby
→ Accessible errors

Idempotency key
→ Prevent duplicate effects

GET form / next/form
→ Search and filters

Honeypot + rate limit
→ Spam protection
```

### BEST GENERAL ARCHITECTURE

``` text
                  FORM SYSTEM
                       │
      ┌────────────────┼────────────────┐
      ▼                ▼                ▼
    Client           Schema           Server
      │                │                │
  HTML attrs      Zod (shared)     Server Action
  onBlur check    coerce/trim      safeParse
  Pending UI      types            authorize
  Accessible      messages         rate limit
  errors                           save + revalidate
      │                │                │
      └────────────────┼────────────────┘
                       ▼
          Friendly UX + Safe Data
```