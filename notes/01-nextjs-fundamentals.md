# 01 — Next.js Fundamentals & App Router

> Complete Next.js 16 fundamentals revision notes for practical development and interviews.

---

# 1. What is Next.js?

Next.js is a React framework for building full-stack web applications.

React is primarily responsible for building user interfaces using components.

Next.js provides the application framework around React, including:

* File-system based routing
* App Router
* Server Components
* Client Components
* Server-side rendering capabilities
* Static/prerendered rendering
* Dynamic rendering
* Streaming
* Data fetching
* Caching
* Revalidation
* Server Functions / Server Actions
* Route Handlers
* Loading and error UI
* Metadata and SEO
* Image optimization
* Font optimization
* Environment configuration
* Production build tooling
* Deployment support

### Simple mental model

```text
React
│
└── UI library

Next.js
│
├── React
├── Routing
├── Rendering
├── Server capabilities
├── Data fetching
├── Caching
├── Mutations
├── SEO / Metadata
├── Optimizations
└── Production tooling
```

### Interview answer

> Next.js is a React framework for building full-stack web applications. It provides features such as file-system routing, Server and Client Components, rendering strategies, data fetching, caching, server-side functionality, metadata, and production optimizations.

---

# 2. Why do we need Next.js?

React by itself gives us the component model and UI layer.

A production application also needs decisions around:

* Routing
* Rendering
* Data fetching
* Server/client boundaries
* SEO
* Caching
* API endpoints
* Authentication
* Error handling
* Performance
* Deployment

Next.js provides an integrated framework for these concerns.

### Without a framework

You may need to choose and configure:

```text
React
+
Router
+
Bundler
+
Data fetching approach
+
Rendering strategy
+
API strategy
+
SEO solution
+
Build configuration
+
Deployment configuration
```

### With Next.js

Many of these capabilities are provided by the framework.

---

# 3. Next.js vs React

This is a very common interview question.

## React

React is a JavaScript library for building user interfaces.

It provides:

* Components
* JSX
* State
* Props
* Hooks
* Component composition

## Next.js

Next.js is a framework built around React.

It adds:

* Routing
* Server Components
* Rendering
* Server-side capabilities
* Data fetching patterns
* Caching
* Route Handlers
* Server Functions
* Metadata
* Image/font optimization
* Production tooling

### Interview answer

> React is the UI library, while Next.js is a framework built around React that provides application-level features such as routing, rendering, server capabilities, caching, metadata, and production tooling.

### Avoid saying

> Next.js is a replacement for React.

It is not.

Next.js uses React.

---

# 4. What is the App Router?

The App Router is the modern routing architecture in Next.js.

It is based on the `app` directory.

Example:

```text
app/
├── page.tsx
├── layout.tsx
├── about/
│   └── page.tsx
└── products/
    └── page.tsx
```

The App Router provides conventions for:

* Pages
* Layouts
* Loading UI
* Error UI
* Not-found UI
* Route Handlers
* Dynamic routes
* Route groups
* Parallel routes
* Intercepting routes
* Server and Client Components

The App Router is designed around modern React capabilities including Server Components.

---

# 5. App Router vs Pages Router

Next.js currently supports two routing architectures:

```text
App Router
    app/

Pages Router
    pages/
```

The App Router is the newer architecture.

The Pages Router is still supported for existing applications.

### App Router

```text
app/
├── page.tsx
├── layout.tsx
└── dashboard/
    └── page.tsx
```

### Pages Router

```text
pages/
├── index.tsx
└── dashboard.tsx
```

### Important interview distinction

Do not mix APIs between the two routers.

For example:

```tsx
// App Router
import { useRouter } from "next/navigation"
```

versus the older Pages Router API:

```tsx
import { useRouter } from "next/router"
```

If you are discussing a modern Next.js App Router application, prefer App Router concepts.

---

# 6. File-System Routing

Next.js uses file-system based routing.

The directory structure represents the URL structure.

Example:

```text
app/
├── page.tsx
├── about/
│   └── page.tsx
└── contact/
    └── page.tsx
```

Produces:

```text
/
/about
/contact
```

### Mental model

```text
folder
   ↓
route segment

page.tsx
   ↓
UI for that route
```

---

# 7. What is a Route Segment?

Each folder inside the `app` directory generally represents a route segment.

Example:

```text
app/
└── dashboard/
    └── settings/
        └── page.tsx
```

The route contains two segments:

```text
dashboard
settings
```

Result:

```text
/dashboard/settings
```

---

# 8. `page.tsx`

`page.tsx` is a special App Router file.

It defines the UI for a route.

Example:

```tsx
export default function HomePage() {
  return <h1>Home</h1>
}
```

Located at:

```text
app/page.tsx
```

URL:

```text
/
```

Another example:

```text
app/about/page.tsx
```

```tsx
export default function AboutPage() {
  return <h1>About</h1>
}
```

URL:

```text
/about
```

### Important

A folder does not automatically become a page.

You generally need a `page.tsx` file to make that route segment accessible as a page.

---

# 9. `layout.tsx`

`layout.tsx` defines UI shared by routes within its segment.

Example:

```text
app/
├── layout.tsx
├── page.tsx
└── about/
    └── page.tsx
```

The root layout surrounds the application's pages.

Typical root layout:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

The `children` represents the page or nested layout being rendered inside that layout.

---

# 10. Root Layout

The root layout is:

```text
app/layout.tsx
```

It is the top-level layout of an App Router application.

It is used for things such as:

* `<html>`
* `<body>`
* Global UI
* Global providers
* Metadata
* Fonts
* Application-wide structure

Example:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Interview point

The root layout is required in an App Router application.

---

# 11. Nested Layouts

Layouts can exist inside route segments.

Example:

```text
app/
├── layout.tsx
└── dashboard/
    ├── layout.tsx
    ├── page.tsx
    ├── customers/
    │   └── page.tsx
    └── settings/
        └── page.tsx
```

The dashboard layout applies to:

```text
/dashboard
/dashboard/customers
/dashboard/settings
```

### Mental model

```text
Root Layout
     ↓
Dashboard Layout
     ↓
Page
```

Layouts can be nested.

---

# 12. Why use layouts?

Imagine an application:

```text
Dashboard
├── Home
├── Customers
├── Reports
└── Settings
```

All dashboard pages need:

* Sidebar
* Header
* Dashboard navigation

Instead of repeating that UI in every page, use:

```text
dashboard/layout.tsx
```

Then:

```text
dashboard/
├── layout.tsx
├── page.tsx
├── customers/
│   └── page.tsx
└── reports/
    └── page.tsx
```

The shared dashboard UI lives in one place.

Next.js documentation describes this as shared UI and partial rendering: when navigating between routes, the relevant page content can update while the shared layout remains in place.

---

# 13. Nested Routing

Nested folders create nested routes.

Example:

```text
app/
└── dashboard/
    └── reports/
        └── page.tsx
```

URL:

```text
/dashboard/reports
```

Another:

```text
app/
└── products/
    └── electronics/
        └── page.tsx
```

URL:

```text
/products/electronics
```

---

# 14. Dynamic Routes

Dynamic routes are used when part of the URL is not known beforehand.

Example:

```text
app/
└── products/
    └── [id]/
        └── page.tsx
```

This can match:

```text
/products/1
/products/2
/products/100
```

The `[id]` part is dynamic.

### Example

```tsx
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <h1>Product {id}</h1>
}
```

For:

```text
/products/42
```

the parameter is:

```text
id = "42"
```

---

# 15. Dynamic Segment Naming

The name inside the brackets becomes the parameter name.

```text
[id]
```

gives:

```text
params.id
```

```text
[slug]
```

gives:

```text
params.slug
```

```text
[username]
```

gives:

```text
params.username
```

Example:

```text
app/blog/[slug]/page.tsx
```

URL:

```text
/blog/nextjs-fundamentals
```

Parameter:

```text
slug = "nextjs-fundamentals"
```

---

# 16. Catch-All Dynamic Routes

Catch-all routes use:

```text
[...slug]
```

Example:

```text
app/docs/[...slug]/page.tsx
```

Can match:

```text
/docs/getting-started
/docs/getting-started/routing
/docs/guides/nextjs/routing
```

The parameter contains multiple path segments.

Conceptually:

```text
slug = ["guides", "nextjs", "routing"]
```

---

# 17. Optional Catch-All Routes

Optional catch-all:

```text
[[...slug]]
```

Example:

```text
app/docs/[[...slug]]/page.tsx
```

Can match:

```text
/docs
/docs/getting-started
/docs/guides/routing
```

The difference is that the base route can also match.

---

# 18. Route Groups

Route groups use parentheses.

Example:

```text
app/
├── (marketing)/
│   ├── page.tsx
│   └── about/
│       └── page.tsx
└── (dashboard)/
    └── dashboard/
        └── page.tsx
```

The group name does not appear in the URL.

Therefore:

```text
app/(marketing)/about/page.tsx
```

maps to:

```text
/about
```

not:

```text
/marketing/about
```

### Why use route groups?

* Organize related routes
* Apply different layouts
* Separate application sections
* Keep URL structure clean

---

# 19. Private Folders

Folders beginning with `_` can be used for organization without becoming route segments.

Example:

```text
app/
├── _components/
├── _lib/
└── dashboard/
    └── page.tsx
```

This can help separate internal implementation files from route structure.

---

# 20. Colocation

The App Router allows related files to live close to their route.

Example:

```text
app/
└── dashboard/
    ├── page.tsx
    ├── loading.tsx
    ├── error.tsx
    ├── layout.tsx
    └── components/
        └── dashboard-card.tsx
```

This makes route-specific code easier to find.

### Important principle

Do not create an enormous global folder structure before you need it.

Start with the simplest structure that makes the code understandable.

---

# 21. Special App Router Files

Important conventions include:

```text
page.tsx
layout.tsx
loading.tsx
error.tsx
not-found.tsx
global-error.tsx
route.ts
```

Each has a specific purpose.

| File               | Purpose         |
| ------------------ | --------------- |
| `page.tsx`         | Route UI        |
| `layout.tsx`       | Shared UI       |
| `loading.tsx`      | Loading UI      |
| `error.tsx`        | Error UI        |
| `not-found.tsx`    | Not-found UI    |
| `global-error.tsx` | Global error UI |
| `route.ts`         | HTTP endpoint   |

We will study these more deeply in later concepts.

---

# 22. `loading.tsx`

A `loading.tsx` file provides loading UI for a route segment.

Example:

```text
app/
└── dashboard/
    ├── loading.tsx
    └── page.tsx
```

Example:

```tsx
export default function Loading() {
  return <p>Loading dashboard...</p>
}
```

This is especially useful with asynchronous rendering and streaming.

Detailed loading architecture belongs to Concept 12.

---

# 23. `error.tsx`

An `error.tsx` file provides error UI for a route segment.

Example:

```text
app/
└── dashboard/
    ├── error.tsx
    └── page.tsx
```

Because error handling uses React error boundaries, the error component is a Client Component.

Example:

```tsx
"use client"

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong.</h2>

      <button onClick={() => reset()}>
        Try again
      </button>
    </div>
  )
}
```

Detailed error architecture belongs to Concept 12.

---

# 24. `not-found.tsx`

Used for not-found UI.

Example:

```text
app/
└── products/
    ├── [id]/
    │   └── page.tsx
    └── not-found.tsx
```

A route can use:

```tsx
notFound()
```

to trigger the appropriate not-found UI.

---

# 25. `route.ts`

`route.ts` defines an HTTP endpoint.

Example:

```text
app/api/products/route.ts
```

Possible methods:

```tsx
export async function GET() {
  return Response.json({
    message: "Products",
  })
}
```

This is different from:

```text
page.tsx
```

because `page.tsx` renders UI, while `route.ts` handles HTTP requests.

Route Handlers are covered in Concept 09.

---

# 26. Navigation with `Link`

For internal navigation, Next.js provides:

```tsx
import Link from "next/link"
```

Example:

```tsx
<Link href="/about">
  About
</Link>
```

Instead of manually relying on normal browser navigation:

```tsx
<a href="/about">
  About
</a>
```

use `Link` for internal Next.js navigation.

Next.js can perform client-side navigation and route-level code splitting/prefetching behavior around `Link`.

---

# 27. Why `Link` instead of `<a>`?

Normal:

```html
<a href="/about">
```

causes standard browser navigation.

Next.js:

```tsx
<Link href="/about">
```

integrates with Next.js routing.

Benefits include:

* Client-side navigation
* Better transition experience
* Route-aware behavior
* Prefetching in production when appropriate
* Automatic route-level code splitting

### External links

For external websites, use a normal anchor:

```tsx
<a href="https://example.com">
  External site
</a>
```

---

# 28. Programmatic Navigation

When navigation needs to happen from application logic, use `useRouter`.

```tsx
"use client"

import { useRouter } from "next/navigation"

export default function LoginButton() {
  const router = useRouter()

  function handleLogin() {
    router.push("/dashboard")
  }

  return (
    <button onClick={handleLogin}>
      Login
    </button>
  )
}
```

Important:

```text
App Router
↓
next/navigation
```

not:

```text
next/router
```

---

# 29. Common `useRouter()` Methods

Common methods include:

```text
router.push()
router.replace()
router.back()
router.forward()
router.refresh()
```

### `push`

Adds a new history entry.

```tsx
router.push("/dashboard")
```

### `replace`

Navigates without adding a new history entry.

```tsx
router.replace("/dashboard")
```

### `back`

Goes backward in browser history.

```tsx
router.back()
```

### `forward`

Moves forward in history.

```tsx
router.forward()
```

### `refresh`

Requests a fresh server response while preserving appropriate client-side state.

```tsx
router.refresh()
```

---

# 30. `usePathname()`

`usePathname()` reads the current pathname.

```tsx
"use client"

import { usePathname } from "next/navigation"

export default function CurrentPath() {
  const pathname = usePathname()

  return <p>{pathname}</p>
}
```

For:

```text
/dashboard/settings
```

it returns:

```text
/dashboard/settings
```

Because it is a React hook, it is used in a Client Component.

---

# 31. `useSearchParams()`

`useSearchParams()` reads URL query parameters.

Example URL:

```text
/products?search=phone&page=2
```

Example:

```tsx
"use client"

import { useSearchParams } from "next/navigation"

export default function SearchInfo() {
  const searchParams = useSearchParams()

  const search = searchParams.get("search")
  const page = searchParams.get("page")

  return (
    <p>
      Search: {search}, Page: {page}
    </p>
  )
}
```

This becomes important in Concept 06.

---

# 32. Server Components

One of the most important App Router concepts.

In the App Router, components are Server Components by default.

Example:

```tsx
export default function Page() {
  return <h1>Hello</h1>
}
```

No:

```text
"use client"
```

is required.

Server Components can be useful for:

* Server-side data fetching
* Server-only libraries
* Database access through appropriate server-side code
* Reducing browser JavaScript
* Keeping secrets on the server

Server and Client Components are covered deeply in Concept 02.

---

# 33. Client Components

A Client Component is created using:

```tsx
"use client"
```

at the top of the module.

Example:

```tsx
"use client"

import { useState } from "react"

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  )
}
```

Client Components are appropriate when you need:

* State
* Event handlers
* Effects
* Browser APIs
* Interactive behavior
* Client-side hooks

Do not use `"use client"` automatically on every component.

---

# 34. Server vs Client Mental Model

Think:

```text
Server Component
    ↓
Server
    ↓
Data / database / server-only work
    ↓
HTML / React Server Component payload
    ↓
Browser
```

Client Component:

```text
Client Component
    ↓
Browser
    ↓
State / events / effects / browser APIs
```

The exact rendering pipeline is more sophisticated, but this mental model is useful for interviews.

---

# 35. `"use client"` Is a Boundary

This is an important interview concept.

When a file contains:

```tsx
"use client"
```

it marks that module as a Client Component boundary.

It does not mean:

> "The entire application is now client-side."

Instead, it defines where client-side capabilities are required.

Example:

```text
Server Page
   │
   ├── Server content
   │
   └── Client Counter
```

This allows you to keep most of the application server-oriented while making only interactive pieces client-side.

---

# 36. Can a Server Component Render a Client Component?

Yes.

Example:

```tsx
import Counter from "./Counter"

export default function Page() {
  return (
    <main>
      <h1>Product</h1>
      <Counter />
    </main>
  )
}
```

Here:

```text
Page
↓
Server Component

Counter
↓
Client Component
```

This composition is a core App Router pattern.

---

# 37. Can a Client Component Import a Server Component?

This is an area where interview answers need to be precise.

A Client Component should not simply import a Server Component module and expect arbitrary server-only behavior to work in the browser.

Instead, Server Components can pass UI into Client Components through supported composition patterns such as `children`.

Example:

```tsx
<ClientComponent>
  <ServerComponent />
</ClientComponent>
```

The Server Component can remain server-rendered while being passed through the component tree.

---

# 38. Rendering

Next.js supports different rendering behaviors depending on the route, data, and configuration.

Important concepts:

```text
Static / prerendered rendering
Dynamic / request-time rendering
Streaming
Caching
Cache Components
```

Do not reduce modern Next.js to simply:

```text
SSR
SSG
ISR
```

Those terms are still useful historically and conceptually, but modern Next.js has a broader rendering and caching model.

Detailed rendering belongs to:

```text
03-rendering/
```

---

# 39. Static Rendering

Static rendering means output can be prepared ahead of a request.

Benefits can include:

* Fast responses
* CDN caching opportunities
* Reduced server work
* Good performance for stable content

Typical examples:

* Documentation
* Marketing pages
* Static content

But whether something is static depends on the route's data and configuration.

---

# 40. Dynamic Rendering

Dynamic rendering happens when output depends on request-time information.

Examples may include:

* Authentication state
* Request headers
* Cookies
* Personalized information
* Dynamic request-dependent data

Dynamic rendering is useful when content cannot safely be predetermined.

---

# 41. Streaming

Streaming allows UI to be sent progressively instead of waiting for the entire page to become ready.

Conceptually:

```text
Request
  ↓
Shell
  ↓
Fast content
  ↓
Slow content
  ↓
More content
```

This works together with:

```text
loading.tsx
Suspense
async rendering
```

Detailed streaming and rendering belong to Concept 03.

---

# 42. Data Fetching

Next.js App Router supports data fetching in Server Components and other server-side mechanisms.

Example:

```tsx
export default async function ProductsPage() {
  const response = await fetch(
    "https://example.com/api/products"
  )

  const products = await response.json()

  return (
    <ul>
      {products.map((product: { id: string; name: string }) => (
        <li key={product.id}>
          {product.name}
        </li>
      ))}
    </ul>
  )
}
```

The important question is not just:

> How do I fetch data?

It is:

> Where should the data be fetched, how should it be cached, and who needs the result?

Detailed data fetching belongs to Concept 04.

---

# 43. Server-side Data Access

Server Components can access server-side resources through appropriate server-only code.

For example:

```text
Server Component
      ↓
Server-side service
      ↓
Database
```

This can avoid exposing database credentials or server-only logic to the browser.

Never put database credentials into client-side code.

---

# 44. Caching

Caching is a major part of Next.js architecture.

In modern Next.js 16, the Cache Components model is important.

Concepts include:

```text
"use cache"
cacheLife
cacheTag
```

and invalidation APIs such as:

```text
revalidateTag
updateTag
refresh
```

The important questions are:

```text
What is cached?
Where is it cached?
How long?
When should it become stale?
How is it invalidated?
Who needs fresh data?
```

Detailed caching belongs to Concept 07.

---

# 45. Server Functions / Server Actions

Server Functions allow server-side functions to be invoked from application interactions.

They are useful for mutations such as:

```text
Create
Update
Delete
Submit
```

A common flow:

```text
User interaction
       ↓
Client / form
       ↓
Server Function
       ↓
Validation
       ↓
Authorization
       ↓
Database mutation
       ↓
Cache invalidation
       ↓
Updated UI
```

Detailed Server Functions / Actions belong to Concept 08.

---

# 46. Route Handlers

Route Handlers create HTTP endpoints in the App Router.

Example:

```text
app/api/products/route.ts
```

Example:

```tsx
export async function GET() {
  return Response.json({
    products: [],
  })
}
```

This represents an HTTP endpoint rather than a UI page.

### Difference

```text
page.tsx
↓
UI

route.ts
↓
HTTP endpoint
```

Detailed Route Handlers belong to Concept 09.

---

# 47. Metadata

Next.js provides metadata APIs.

Example:

```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Products",
  description: "Browse products",
}
```

Metadata can be:

* Static
* Dynamic
* Route-specific
* Generated from data

Detailed metadata and SEO belong to Concept 14.

---

# 48. Static Assets

The `public` folder contains static assets.

Example:

```text
public/
├── logo.svg
├── favicon.ico
└── images/
    └── hero.jpg
```

A file such as:

```text
public/logo.svg
```

can be referenced through:

```text
/logo.svg
```

Image optimization itself is covered in Concept 15.

---

# 49. Images

Next.js provides the `next/image` component.

Example:

```tsx
import Image from "next/image"

export default function Profile() {
  return (
    <Image
      src="/profile.png"
      alt="Profile"
      width={200}
      height={200}
    />
  )
}
```

Benefits can include:

* Image optimization
* Responsive behavior
* Size handling
* Lazy loading where appropriate
* Better performance

Detailed image optimization belongs to Concept 15.

---

# 50. Fonts

Next.js provides `next/font`.

Example:

```tsx
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
})
```

Fonts can be integrated into the application while supporting optimization.

Detailed fonts belong to Concept 15.

---

# 51. Environment Variables

Environment variables are commonly used for configuration.

Example:

```text
DATABASE_URL
API_KEY
NEXT_PUBLIC_API_URL
```

A major distinction:

```text
DATABASE_URL
API_KEY
```

can remain server-only if used correctly.

While:

```text
NEXT_PUBLIC_API_URL
```

is intended to be available to browser code.

### Important interview point

Never treat:

```text
NEXT_PUBLIC_*
```

as secret.

If a value is exposed to client code, assume users can inspect it.

Detailed environment configuration belongs to Concept 16.

---

# 52. TypeScript in Next.js

Next.js works naturally with TypeScript.

Common file types:

```text
.ts
.tsx
```

Use TypeScript for:

* Props
* Route parameters
* API responses
* Server Function inputs
* Data models
* Component state
* Utility functions

Example:

```tsx
type Product = {
  id: string
  name: string
  price: number
}

export default function ProductCard({
  product,
}: {
  product: Product
}) {
  return (
    <article>
      <h2>{product.name}</h2>
      <p>{product.price}</p>
    </article>
  )
}
```

---

# 53. `next.config.ts`

Next.js configuration is generally placed in:

```text
next.config.ts
```

Depending on the application, configuration may cover:

* Images
* Redirects
* Rewrites
* Headers
* Framework settings
* Build behavior
* Other supported Next.js configuration

Do not place ordinary application logic inside the configuration file.

---

# 54. `package.json`

`package.json` defines:

* Project metadata
* Scripts
* Dependencies
* Development dependencies

Typical scripts include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

The exact generated scripts may vary with the current project setup.

---

# 55. Development Commands

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

Typical workflow:

```text
Development
    ↓
npm run dev

Test
    ↓
npm run build

Production
    ↓
npm run start
```

---

# 56. Development vs Production

Do not assume:

```text
works with npm run dev
```

means:

```text
production is guaranteed to work
```

A production build can expose:

* Type errors
* Build errors
* Invalid configuration
* Rendering problems
* Incorrect environment variables
* Server/client boundary mistakes

Always test:

```bash
npm run build
```

before treating a feature as production-ready.

---

# 57. Turbopack

Next.js 16 uses Turbopack as the modern bundler path for development and builds.

At a high level:

```text
Source code
    ↓
Turbopack
    ↓
Compiled / bundled application
```

For interviews, know what a bundler does:

* Processes modules
* Resolves dependencies
* Transforms code
* Produces output needed by the application

You generally do not need to explain Turbopack's internal implementation in a normal 2-year experience interview unless specifically asked.

---

# 58. Proxy in Next.js 16

Next.js 16 uses the `proxy.ts` convention for functionality that was previously associated with `middleware.ts`.

This is an important version-awareness point.

For interview preparation:

```text
Older terminology:
middleware.ts

Next.js 16:
proxy.ts
```

Do not blindly copy old tutorials without checking which Next.js version they target.

---

# 59. React Compiler Awareness

Next.js 16 includes support for the React Compiler.

The compiler can automatically optimize React code in supported configurations.

The important interview point is not to claim:

> "I never need to think about performance anymore."

You still need to understand:

* Rendering
* Component boundaries
* Data fetching
* Network requests
* Bundle size
* Client Components
* Caching
* Images
* Server work

Compiler optimizations do not replace architectural thinking.

---

# 60. Project Structure

A simple App Router project might look like:

```text
my-next-app/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── about/
│       └── page.tsx
│
├── public/
│
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── ...
```

As the application grows:

```text
app/
components/
lib/
services/
types/
public/
```

may appear.

But these folders should be introduced when the project needs them.

---

# 61. Do I Need `components/`?

No.

Next.js does not require a global:

```text
components/
```

directory.

You can colocate components:

```text
app/
└── dashboard/
    ├── page.tsx
    └── components/
        └── card.tsx
```

Or use:

```text
components/
```

for reusable application-wide components.

The decision should be based on maintainability, not a fixed rule.

---

# 62. Do I Need `lib/`?

No.

A `lib/` folder is a common convention for utilities, data-access code, and server-side helpers.

Example:

```text
lib/
├── db.ts
├── auth.ts
└── utils.ts
```

But Next.js does not require this structure.

---

# 63. Do I Need `services/`?

Not automatically.

A service layer can be useful in a larger application.

For a small feature, adding:

```text
services/
repositories/
adapters/
utils/
helpers/
```

without a real need can create unnecessary complexity.

### Interview point

A 2-year developer should demonstrate that they know when abstraction helps and when it does not.

---

# 64. Common Architecture Principle

Start simple.

Example:

```text
app/
└── products/
    └── page.tsx
```

Then if the feature grows:

```text
app/
└── products/
    ├── page.tsx
    ├── components/
    ├── lib/
    └── ...
```

Architecture should evolve with complexity.

---

# 65. Route-Level Code Organization

A route can keep related files close together.

Example:

```text
app/
└── dashboard/
    ├── layout.tsx
    ├── page.tsx
    ├── loading.tsx
    ├── error.tsx
    ├── components/
    │   ├── header.tsx
    │   └── card.tsx
    └── settings/
        └── page.tsx
```

This can make large applications easier to navigate.

---

# 66. Common Beginner Mistakes

## Mistake 1 — Thinking Next.js is just React

Next.js is a framework built around React.

---

## Mistake 2 — Using `"use client"` everywhere

Only use it when client capabilities are required.

---

## Mistake 3 — Using `useEffect` for every data fetch

In App Router applications, many server-side data requirements can be handled in Server Components.

Do not automatically reach for:

```tsx
useEffect()
```

just because you need data.

---

## Mistake 4 — Using `next/router` in App Router

Use:

```tsx
next/navigation
```

for App Router navigation APIs.

---

## Mistake 5 — Creating giant components

Break code down when there is a meaningful reason:

* Reuse
* Readability
* State isolation
* Client boundary
* Responsibility separation

---

## Mistake 6 — Creating unnecessary abstractions

Avoid creating architecture only because a tutorial does.

---

## Mistake 7 — Exposing secrets

Never put private API keys or database credentials into browser-accessible code.

---

## Mistake 8 — Confusing route folders and pages

A folder alone does not mean there is a page.

---

## Mistake 9 — Ignoring the production build

Always consider:

```bash
npm run build
```

before declaring a feature complete.

---

## Mistake 10 — Following outdated tutorials blindly

Next.js changes over time.

Always identify:

```text
Next.js version
Router being used
API being discussed
```

before copying implementation patterns.

---

# 67. Important Interview Concepts

For a 2-year Next.js developer, you should be comfortable explaining:

### Fundamentals

* What Next.js is
* React vs Next.js
* App Router
* Pages Router
* File-system routing
* Route segments
* `page.tsx`
* `layout.tsx`

### Routing

* Nested routes
* Dynamic routes
* Catch-all routes
* Optional catch-all routes
* Route groups
* Private folders

### Navigation

* `Link`
* `useRouter`
* `usePathname`
* `useSearchParams`

### Components

* Server Components
* Client Components
* `"use client"`
* Server/Client boundary
* Component composition

### Rendering

* Static rendering
* Dynamic rendering
* Streaming
* Caching
* Cache Components

### Application architecture

* Loading UI
* Error UI
* Not-found UI
* Route Handlers
* Server Functions

### Production

* Metadata
* Images
* Fonts
* Environment variables
* Performance
* Security
* Deployment

---

# 68. Interview Question — Explain a Next.js Application

A good answer should connect concepts rather than list APIs.

Example:

> "I would structure a modern Next.js application using the App Router. Routes are represented through the `app` directory, with `page.tsx` defining route UI and `layout.tsx` providing shared UI. Components are Server Components by default, and I introduce Client Components only where I need browser-side interactivity such as state or event handlers. For navigation I generally use `Link`, while `useRouter` is useful for programmatic navigation. Depending on the application requirements, I can use Server Components for server-side data access, Route Handlers for HTTP endpoints, Server Functions for mutations, and the caching and rendering features of Next.js to control how data and UI are reused."

That is much stronger than simply naming features.

---

# 69. Interview Question — How Would You Structure a Product Page?

Requirement:

```text
/products/123
```

Structure:

```text
app/
└── products/
    └── [id]/
        └── page.tsx
```

The page receives the dynamic route parameter.

Conceptually:

```text
/products/123
       ↓
[id]
       ↓
id = 123
```

Then decide:

```text
How is product data fetched?
        ↓
Server or Client?

Does it need caching?
        ↓
What cache behavior?

What if product does not exist?
        ↓
notFound()

What if data is slow?
        ↓
loading / streaming

What metadata is needed?
        ↓
metadata / generateMetadata
```

This shows architectural thinking.

---

# 70. Interview Question — Server or Client Component?

A useful decision process:

```text
Does it need state?
        ↓ yes
Client Component

Does it need event handlers?
        ↓ yes
Client Component

Does it need browser APIs?
        ↓ yes
Client Component

Does it mainly fetch/render server data?
        ↓
Consider Server Component

Does it use server-only resources?
        ↓
Keep it on server
```

This is not a rigid rule for every possible architecture, but it is a good starting mental model.

---

# 71. Interview Question — Why Keep Components on the Server?

Potential benefits include:

* Less JavaScript sent to the browser
* Server-side data access
* Server-only dependencies stay on the server
* Better separation of responsibilities
* Potentially better performance

The exact benefit depends on the application.

Do not say:

> "Server Components are always faster."

Performance depends on the complete application architecture.

---

# 72. Interview Question — What happens when navigating with `Link`?

At a high level:

```text
User clicks Link
       ↓
Next.js handles navigation
       ↓
Relevant route is loaded
       ↓
Only necessary UI/data changes
       ↓
Existing layouts can remain
```

Next.js also performs route-level code splitting and can prefetch linked routes in production when appropriate.

---

# 73. Interview Question — What is Partial Rendering?

With nested layouts, navigation can update the page segment that changed while preserving layouts that remain relevant.

Example:

```text
Dashboard Layout
       │
       ├── Customers Page
       │
       └── Reports Page
```

When moving:

```text
/dashboard/customers
```

to:

```text
/dashboard/reports
```

the dashboard layout can remain while the page content changes.

This is one reason layouts are useful.

---

# 74. Interview Question — How Does Next.js Routing Work?

Answer:

> Next.js uses file-system routing. In the App Router, folders represent route segments and special files such as `page.tsx` define the UI for a route. Dynamic segments use square brackets, route groups use parentheses, and layouts provide shared UI for a route segment.

Then give an example:

```text
app/
└── products/
    └── [id]/
        └── page.tsx
```

becomes:

```text
/products/:id
```

---

# 75. Interview Question — What is the Difference Between a Page and a Layout?

### Page

Represents the UI for a specific route.

```text
page.tsx
```

### Layout

Wraps pages and provides shared UI.

```text
layout.tsx
```

Example:

```text
layout
   ├── page
   ├── customers/page
   └── settings/page
```

---

# 76. Interview Question — What is a Route Group?

Answer:

> A route group is a folder wrapped in parentheses that allows me to organize routes or apply layouts without including that folder name in the URL.

Example:

```text
app/(marketing)/about/page.tsx
```

URL:

```text
/about
```

---

# 77. Interview Question — What is a Dynamic Route?

Answer:

> A dynamic route is a route where part of the URL is determined at runtime. In the App Router, dynamic segments are represented using square brackets.

Example:

```text
app/products/[id]/page.tsx
```

For:

```text
/products/123
```

the `id` parameter is `123`.

---

# 78. Interview Question — What is the Difference Between `Link` and `useRouter`?

### `Link`

Use for normal declarative navigation:

```tsx
<Link href="/products">
  Products
</Link>
```

### `useRouter`

Use for programmatic navigation:

```tsx
router.push("/products")
```

Example use case:

```text
Submit form
    ↓
Success
    ↓
router.push("/dashboard")
```

---

# 79. Interview Question — What is `usePathname()`?

It is a Client Component hook that returns the current pathname.

Example:

```tsx
const pathname = usePathname()
```

Useful for:

* Active navigation
* Conditional UI based on route
* Reading current path

---

# 80. Interview Question — What is `useSearchParams()`?

It reads query-string parameters.

Example:

```text
/products?search=phone&page=2
```

Then:

```tsx
searchParams.get("search")
```

returns:

```text
phone
```

and:

```tsx
searchParams.get("page")
```

returns:

```text
2
```

---

# 81. Interview Question — What are the important special files?

Know these:

```text
page.tsx
layout.tsx
loading.tsx
error.tsx
not-found.tsx
global-error.tsx
route.ts
```

You should be able to explain each in one sentence.

---

# 82. Interview Question — How Do You Handle a Missing Resource?

For example:

```text
/products/999
```

does not exist.

A route can use:

```tsx
notFound()
```

to trigger not-found behavior.

Conceptually:

```text
Fetch product
     ↓
Exists?
  /     \
Yes      No
 ↓       ↓
Render   notFound()
```

---

# 83. Interview Question — How Do You Handle Loading?

Use:

```text
loading.tsx
```

and/or Suspense-based patterns where appropriate.

Example:

```text
dashboard/
├── loading.tsx
└── page.tsx
```

The loading UI can appear while the route's content is being prepared.

---

# 84. Interview Question — How Do You Handle Errors?

Use:

```text
error.tsx
```

for route-level error boundaries.

Remember that an error boundary component is a Client Component.

---

# 85. Interview Question — How Would You Build a Dashboard?

Possible structure:

```text
app/
├── layout.tsx
│
└── dashboard/
    ├── layout.tsx
    ├── page.tsx
    ├── loading.tsx
    ├── error.tsx
    │
    ├── customers/
    │   └── page.tsx
    │
    ├── reports/
    │   └── page.tsx
    │
    └── settings/
        └── page.tsx
```

Responsibilities:

```text
Root layout
    ↓
Global application structure

Dashboard layout
    ↓
Dashboard navigation/sidebar

Dashboard page
    ↓
Dashboard home

Customers page
    ↓
Customers UI

Reports page
    ↓
Reports UI
```

---

# 86. Interview Question — What Should Be Server vs Client?

Do not decide based on:

> "This is a page, so it should be client."

Instead ask:

```text
Does it need browser interaction?
        ↓
Yes → Client

Does it need React state?
        ↓
Yes → Client

Does it need browser API?
        ↓
Yes → Client

Is it mainly server data/UI?
        ↓
Consider Server

Does it use server-only functionality?
        ↓
Server
```

Then minimize the Client Component boundary where practical.

---

# 87. Version Awareness — Next.js 16

When working with Next.js 16, pay attention to current terminology.

Important areas include:

```text
App Router
Server / Client Components
Cache Components
use cache
cacheLife
cacheTag
revalidateTag
updateTag
refresh
proxy.ts
Turbopack
React Compiler
```

If you encounter older tutorials mentioning:

```text
middleware.ts
```

check whether the tutorial is targeting an older Next.js version.

Do not blindly mix old and new examples.

---

# 88. Things You Do NOT Need to Memorize

You do not need to memorize every:

* Next.js configuration option
* Internal compiler detail
* CLI flag
* React internals
* Webpack/Turbopack implementation detail
* Rare routing edge case

For interviews, prioritize:

```text
Concept
   ↓
Why
   ↓
When
   ↓
How
   ↓
Trade-offs
   ↓
Practical example
```

---

# 89. What You SHOULD Be Able to Do Without Looking It Up

For a 2-year Next.js developer, aim to comfortably explain and implement:

```text
Create a Next.js application
        ↓
Understand app/
        ↓
Create pages
        ↓
Create layouts
        ↓
Create nested routes
        ↓
Create dynamic routes
        ↓
Navigate with Link
        ↓
Understand Server Components
        ↓
Create Client Components
        ↓
Understand server/client boundaries
        ↓
Fetch server data
        ↓
Understand rendering
        ↓
Understand caching
        ↓
Handle loading/errors/not-found
```

You do not need to remember every syntax detail perfectly.

You should know where the feature belongs and why you would use it.

---

# 90. Practical Checklist

Before considering Next.js fundamentals complete, I should be able to:

* [ ] Explain Next.js
* [ ] Explain React vs Next.js
* [ ] Explain App Router
* [ ] Explain Pages Router at a high level
* [ ] Explain file-system routing
* [ ] Explain route segments
* [ ] Create `page.tsx`
* [ ] Create `layout.tsx`
* [ ] Create nested routes
* [ ] Create nested layouts
* [ ] Create dynamic routes
* [ ] Explain catch-all routes
* [ ] Explain optional catch-all routes
* [ ] Explain route groups
* [ ] Explain private folders
* [ ] Explain special files
* [ ] Use `Link`
* [ ] Use `useRouter`
* [ ] Use `usePathname`
* [ ] Use `useSearchParams`
* [ ] Explain Server Components
* [ ] Explain Client Components
* [ ] Explain `"use client"`
* [ ] Explain server/client boundaries
* [ ] Explain basic rendering concepts
* [ ] Explain basic data fetching
* [ ] Explain caching at a high level
* [ ] Explain Server Functions at a high level
* [ ] Explain Route Handlers at a high level
* [ ] Explain metadata
* [ ] Explain environment variables
* [ ] Explain `public`
* [ ] Explain basic project structure
* [ ] Explain production build
* [ ] Explain common mistakes
* [ ] Explain current Next.js 16 terminology

---

# 91. Quick Revision Sheet

## Next.js

```text
React framework for full-stack applications
```

## App Router

```text
app/
```

## Page

```text
page.tsx
```

## Layout

```text
layout.tsx
```

## Dynamic route

```text
[id]
```

## Catch-all

```text
[...slug]
```

## Optional catch-all

```text
[[...slug]]
```

## Route group

```text
(group)
```

## Internal navigation

```text
<Link />
```

## Programmatic navigation

```text
useRouter()
```

## Current pathname

```text
usePathname()
```

## Query parameters

```text
useSearchParams()
```

## Server Component

```text
Default in App Router
```

## Client Component

```text
"use client"
```

## Loading UI

```text
loading.tsx
```

## Error UI

```text
error.tsx
```

## Not found

```text
not-found.tsx
```

## HTTP endpoint

```text
route.ts
```

## Static assets

```text
public/
```

## Configuration

```text
next.config.ts
```

## Production

```text
npm run build
npm run start
```

## Next.js 16 awareness

```text
Cache Components
use cache
cacheLife
cacheTag
proxy.ts
Turbopack
React Compiler
```

---

# 92. Final Mental Model

A modern Next.js App Router application can be understood as:

```text
                         Next.js
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
          Routing        Components      Server
             │              │              │
          app/          Server/Client    Data
          pages         boundaries       Database
          layouts       interactivity    APIs
          dynamic       state            Functions
             │              │              │
             └──────────────┼──────────────┘
                            ↓
                       Rendering
                            │
                     ┌──────┴──────┐
                     ↓             ↓
                  Static        Dynamic
                     │             │
                     └──────┬──────┘
                            ↓
                         Caching
                            ↓
                      User Response
```

The most important skill is not memorizing individual APIs.

The important skill is understanding how the pieces work together:

```text
Routing
   +
Server / Client Components
   +
Rendering
   +
Data Fetching
   +
Caching
   +
Navigation
   +
Loading / Errors
   +
Performance
   +
Security
```

Once these fundamentals are clear, the remaining concepts in this revision repository can go deeper into each area.

---

# 93. Interview Final Checklist

Before an interview, I should be able to answer these without opening documentation:

### Fundamentals

1. What is Next.js?
2. Why use Next.js?
3. React vs Next.js?
4. What is the App Router?
5. App Router vs Pages Router?

### Routing

6. How does file-system routing work?
7. What is `page.tsx`?
8. What is `layout.tsx`?
9. What are nested routes?
10. What are dynamic routes?
11. What are catch-all routes?
12. What are route groups?
13. What are private folders?

### Navigation

14. Why use `Link`?
15. `Link` vs `<a>`?
16. When would you use `useRouter()`?
17. What is `usePathname()`?
18. What is `useSearchParams()`?

### Components

19. What is a Server Component?
20. What is a Client Component?
21. Why is `"use client"` needed?
22. Why not make everything Client Components?
23. How do Server and Client Components interact?

### Rendering

24. What is static rendering?
25. What is dynamic rendering?
26. What is streaming?
27. How does caching affect rendering?

### Architecture

28. How would you structure a dashboard?
29. How would you structure a dynamic product page?
30. Where would you put reusable components?
31. How do you decide Server vs Client?

### Production

32. How do you handle loading?
33. How do you handle errors?
34. How do you handle not-found pages?
35. What are Route Handlers?
36. What are Server Functions?
37. How does metadata work?
38. How do environment variables work?
39. What should never be exposed to the browser?
40. How do you test a production build?

---

# 94. One-Sentence Interview Summary

If the interviewer asks:

> "Give me a quick overview of how you work with Next.js."

A strong concise answer is:

> "I primarily work with the App Router, using file-system routing with `page.tsx` and `layout.tsx`, keeping components on the server by default and introducing Client Components where browser-side interaction is required. I use `Link` for internal navigation, dynamic route segments for resource-based URLs, Server Components for appropriate server-side data access, and the framework's rendering, caching, loading, error, metadata, and server-side capabilities according to the application's requirements."

---

# 95. Remember

Do not learn Next.js as a collection of APIs.

Learn it as an architecture:

```text
                 ROUTING
                    │
                    ↓
             SERVER / CLIENT
                    │
                    ↓
               RENDERING
                    │
                    ↓
              DATA FETCHING
                    │
                    ↓
                 CACHING
                    │
                    ↓
               MUTATIONS
                    │
                    ↓
          LOADING / ERROR UI
                    │
                    ↓
             PERFORMANCE
                    │
                    ↓
             PRODUCTION APP
```

That mental model is more valuable in an interview than memorizing syntax.
