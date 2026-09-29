# 04 — Data Fetching

> Next.js App Router — Server-side data fetching, `fetch`, databases/ORMs, Client Components, sequential vs parallel fetching, request waterfalls, preloading, `React.cache`, streaming, Suspense, Cache Components, `use cache`, caching/revalidation, security, pitfalls & interview revision.

---

## 1. Mental Model

```text
                    NEXT.JS DATA FETCHING

                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
           SERVER          CLIENT         CACHE
              │              │              │
        ┌─────┴─────┐     ┌──┴──┐      ┌───┴────┐
        ▼           ▼     ▼     ▼      ▼        ▼
      fetch       DB     use    SWR   use      React.cache
      /ORM              API          cache
        │                │             │
        └────────┬───────┴─────────────┘
                 ▼
              UI DATA
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
    Direct             Streaming
    render             + Suspense
```

### Golden Rule

```text
First ask:

Where should the data be fetched?

        ↓

Server Component?
    → Prefer for server-available data

Client Component?
    → Use when the requirement is genuinely client-side

Then ask:

Can requests run in parallel?
    → Avoid accidental waterfalls

Does data need caching?
    → Choose an explicit caching strategy

Is some data slow?
    → Consider Suspense + streaming
```

---

## 2. What Is Data Fetching?

Data fetching means getting the information your UI needs from a source such as:

```text
API
Database
ORM
File system
CMS
Third-party service
```

A typical flow:

```text
Data Source
    ↓
Data Access Layer
    ↓
Server / Client
    ↓
React Component
    ↓
UI
```

In the App Router, Server Components can perform asynchronous data fetching directly, which means many applications do not need a separate API layer between the Server Component and a database. citeturn442401view0

---

## 3. Server Components for Data Fetching

Server Components are the main place to fetch server-available data.

```tsx
export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          {product.name}
        </li>
      ))}
    </ul>
  )
}
```

### Mental model

```text
Server Component
      │
      ├── fetch API
      ├── query database
      ├── call ORM
      └── use server-only code
              ↓
            render
```

### Good for

- Database queries
- Server-side API calls
- CMS data
- Secrets
- Server-only libraries
- Shared public data
- Request-specific server data

---

## 4. Fetching With the `fetch` API

A Server Component can use the standard `fetch` API.

```tsx
export default async function Page() {
  const response = await fetch(
    "https://api.example.com/products"
  )

  const products = await response.json()

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          {product.name}
        </li>
      ))}
    </ul>
  )
}
```

### Important current behavior

In current Next.js App Router documentation, `fetch` requests are **not cached by default**. Identical `fetch` requests in a React component tree are memoized, but persistent caching is a separate concern. Use Cache Components/`use cache` when you explicitly want cached results, or use Suspense to stream fresh request-time data. citeturn442401view0

### Do not memorize an old rule like:

```text
fetch()
   ↓
always cached
```

That is not a safe mental model for current Next.js.

---

## 5. Fetching With an ORM or Database

Server Components can query a database directly.

```tsx
import { db } from "@/lib/db"

export default async function UsersPage() {
  const users = await db.user.findMany()

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {user.name}
        </li>
      ))}
    </ul>
  )
}
```

### Architecture

```text
Server Component
       ↓
Data Access Layer
       ↓
ORM / SQL
       ↓
Database
```

The database credentials and query logic remain server-side rather than being included in the client bundle. Authentication and authorization must still be enforced correctly. citeturn442401view0

---

## 6. Do You Need an API Layer?

Not always.

### Server Component → Database

```text
Server Component
       ↓
Database
```

This is a valid pattern when the data is only needed by your server-rendered application.

### Client → API → Database

```text
Client Component
       ↓
Route Handler / API
       ↓
Database
```

This is appropriate when browser code needs to communicate with your server through an HTTP interface.

### Third-party API

```text
Server Component
       ↓
Third-party API
```

You can call external services directly from the server when that fits the architecture.

### Principle

```text
Need an API boundary?
       │
       ├── Browser needs HTTP endpoint
       ├── External consumers use endpoint
       └── API abstraction is useful
```

Otherwise, a Server Component can often access server-side data directly. Next.js documentation explicitly presents direct database access from Server Components as a valid alternative to creating an API layer. citeturn593943search0

---

## 7. Server vs Client Data Fetching

| Server-side fetching | Client-side fetching |
|----------------------|----------------------|
| Runs on server | Runs in browser |
| Can access server resources | Uses browser-accessible APIs |
| Keeps database credentials server-side | Cannot safely expose server secrets |
| Good for initial UI data | Good for highly interactive/client-only data |
| Works naturally with Server Components | Usually needs Client Component |

### Decision

```text
Can the server fetch the data?
        │
       Yes
        ↓
Prefer server-side fetching
```

Then ask:

```text
Does the browser need to own the request?
        │
       Yes
        ↓
Client-side fetching may be appropriate
```

---

## 8. Client Components

Client Components can fetch data, but this should be based on an actual client-side requirement.

A modern pattern is to use a data-fetching library such as SWR or React Query.

```tsx
"use client"

import useSWR from "swr"

const fetcher = (url: string) =>
  fetch(url).then((response) => response.json())

export default function Products() {
  const { data, error, isLoading } = useSWR(
    "/api/products",
    fetcher
  )

  if (isLoading) return <p>Loading...</p>

  if (error) {
    return <p>Failed to load products.</p>
  }

  return (
    <ul>
      {data.map((product) => (
        <li key={product.id}>
          {product.name}
        </li>
      ))}
    </ul>
  )
}
```

Next.js currently documents both React's `use` API and community libraries such as SWR and React Query as Client Component data-fetching approaches. citeturn725488view0

---

## 9. When Client-side Fetching Makes Sense

Client-side fetching can be useful when the data:

```text
Changes frequently
       ↓
Needs browser-driven refetching
       ↓
Depends heavily on user interaction
       ↓
Uses client-side cache/state
       ↓
Is intentionally fetched after the UI becomes interactive
```

Examples:

```text
Live dashboard data
Search suggestions
Polling
Infinite scroll
User-driven filters
Client-only interactions
```

### Do not use the rule:

```text
Every API call
    ↓
useEffect
```

Instead:

```text
What environment owns the requirement?
        ↓
Server
    → Server fetch

Browser
    → Client fetch/library
```

---

## 10. Request Waterfalls

A request waterfall happens when a request starts only after another request has completed.

```text
Request A
   │
   └──────→ Done
              │
              ▼
           Request B
              │
              └──────→ Done
                         │
                         ▼
                      Request C
```

Example:

```tsx
const user = await getUser()

const orders = await getOrders(user.id)

const recommendations =
  await getRecommendations(user.id)
```

If every request depends on the previous result, this can be intentional.

But if the requests are independent, the sequence is unnecessary.

---

## 11. Why Waterfalls Matter

Think:

```text
Request A
   ↓
wait
   ↓
Request B
   ↓
wait
   ↓
Request C
```

Total time can become roughly:

```text
A + B + C
```

instead of:

```text
max(A, B, C)
```

when the operations can safely run in parallel.

Next.js specifically calls out accidental waterfalls as a common data-fetching performance problem. citeturn593943search0

---

## 12. Sequential Data Fetching

Sequential fetching is correct when one request needs the result of another.

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const artist = await getArtist(username)

  const playlists =
    await getArtistPlaylists(artist.id)

  return (
    <main>
      <h1>{artist.name}</h1>

      <ul>
        {playlists.map((playlist) => (
          <li key={playlist.id}>
            {playlist.name}
          </li>
        ))}
      </ul>
    </main>
  )
}
```

### Mental model

```text
Need artist.id
      ↓
Fetch artist
      ↓
Get artist.id
      ↓
Fetch playlists
```

This is not a mistake.

The second request genuinely depends on the first result.

---

## 13. Parallel Data Fetching

If requests are independent, start them together.

```tsx
export default async function Page() {
  const productsPromise = getProducts()
  const categoriesPromise = getCategories()
  const featuredPromise = getFeaturedProducts()

  const [
    products,
    categories,
    featured,
  ] = await Promise.all([
    productsPromise,
    categoriesPromise,
    featuredPromise,
  ])

  return (
    <main>
      <Products products={products} />
      <Categories categories={categories} />
      <Featured products={featured} />
    </main>
  )
}
```

### Mental model

```text
        ┌── getProducts()
        │
Start ──┼── getCategories()
        │
        └── getFeatured()
                 │
                 ▼
           Promise.all
                 │
                 ▼
              Render
```

This is one of the most important data-fetching patterns to know for interviews. citeturn332078view2

---

## 14. `Promise.all`

```tsx
const [users, posts, comments] =
  await Promise.all([
    getUsers(),
    getPosts(),
    getComments(),
  ])
```

### Advantage

Requests can progress at the same time.

### Important failure behavior

If one promise rejects:

```text
Promise.all
   ↓
One fails
   ↓
Entire Promise.all rejects
```

When you want every result regardless of individual failures, consider:

```tsx
await Promise.allSettled([
  getUsers(),
  getPosts(),
  getComments(),
])
```

Next.js documents this distinction directly in its data-fetching guide. citeturn332078view2

---

## 15. Parallel Fetching With Component Composition

Another useful pattern is letting independent components start their own work.

```text
Page
 │
 ├── Revenue
 │     └── fetch revenue
 │
 ├── Customers
 │     └── fetch customers
 │
 └── Orders
       └── fetch orders
```

Because route segments and components can begin work independently, this can avoid centralizing every request in one parent.

### Mental model

```text
Parent
 │
 ├── Child A → request A
 │
 ├── Child B → request B
 │
 └── Child C → request C
```

The current Next.js documentation notes that layouts and pages render in parallel, allowing segments to start fetching as soon as possible. citeturn332078view1

---

## 16. Preloading Data

Sometimes a component renders only after another blocking operation, which means its request starts too late.

Preloading starts the request earlier.

```tsx
async function getItem(id: string) {
  const response = await fetch(
    `https://api.example.com/items/${id}`
  )

  return response.json()
}

export function preload(id: string) {
  void getItem(id)
}

export default async function Item({
  id,
}: {
  id: string
}) {
  const item = await getItem(id)

  return <div>{item.name}</div>
}
```

Then:

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  preload(id)

  const available =
    await checkIsAvailable(id)

  return available ? (
    <Item id={id} />
  ) : null
}
```

### Mental model

```text
Without preload

Availability check
      ↓
Item request
      ↓
Slow


With preload

Item request ───────────────┐
                            │
Availability check ─────────┤
                            ▼
                         Render
```

Next.js recommends preloading when you can start a request before other blocking work, provided matching calls deduplicate correctly. citeturn725488view1

---

## 17. Reusing Data With `React.cache`

For database or ORM functions that do not use `fetch`, `React.cache` can memoize repeated calls within the same request.

```tsx
import { cache } from "react"

export const getUser = cache(
  async (id: string) => {
    return db.user.findUnique({
      where: { id },
    })
  }
)
```

Now:

```tsx
const userA = await getUser("123")
const userB = await getUser("123")
```

can share the same memoized result within the current request.

### Important

```text
React.cache
    ↓
Request-scoped memoization
```

It is not the same as a persistent cross-request cache.

The current Next.js docs explicitly distinguish `React.cache` as request-scoped memoization. citeturn725488view1

---

## 18. `React.cache` vs `use cache`

Do not confuse these.

### `React.cache`

```text
React.cache(...)
     ↓
Memoize repeated calls
within current request
```

### `use cache`

```text
"use cache"
     ↓
Next.js Cache Components
     ↓
Persist cacheable output according to cache rules/lifetime
```

### Mental model

```text
React.cache
→ request-level reuse

use cache
→ Next.js caching model
```

Current Next.js 16 documentation uses `use cache` as part of Cache Components for caching function/component output. citeturn725488view2turn725488view3

---

## 19. Cache Components

Next.js 16 introduced Cache Components as the newer caching model.

Enable it in `next.config.ts`:

```tsx
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

The current docs describe Cache Components as the model used with `use cache`, and note that the older caching model is documented separately. citeturn332078view3

---

## 20. `use cache`

`use cache` can be applied to a function, component, or route-level scope.

```tsx
import { cacheLife } from "next/cache"

export async function getProducts() {
  "use cache"

  cacheLife("hours")

  return db.product.findMany()
}
```

### UI-level example

```tsx
import { cacheLife } from "next/cache"

export default async function Page() {
  "use cache"

  cacheLife("hours")

  const products =
    await db.product.findMany()

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          {product.name}
        </li>
      ))}
    </ul>
  )
}
```

The current docs recommend pairing `use cache` with a `cacheLife` profile. citeturn725488view2

---

## 21. Data-Level vs UI-Level Caching

### Data-level caching

```text
getProducts()
      ↓
"use cache"
      ↓
Cached data
```

Useful when the same data is consumed by several components.

### UI-level caching

```text
ProductsPage
      ↓
"use cache"
      ↓
Cached component/page output
```

Useful when you want to cache a larger rendered result.

### Mental model

```text
Data-level
    ↓
Cache the data

UI-level
    ↓
Cache the rendered output
```

Next.js supports both levels through Cache Components. citeturn725488view2

---

## 22. Fresh Data + Streaming

Not every piece of data should be cached.

For data that needs to be fresh on every request:

```text
Do not automatically add "use cache"
        ↓
Fetch at request time
        ↓
Wrap slow content in Suspense
        ↓
Stream it
```

Example:

```tsx
import { Suspense } from "react"

async function LatestPosts() {
  const response = await fetch(
    "https://api.example.com/posts"
  )

  const posts = await response.json()

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          {post.title}
        </li>
      ))}
    </ul>
  )
}

export default function Page() {
  return (
    <main>
      <h1>Latest Posts</h1>

      <Suspense fallback={<p>Loading posts...</p>}>
        <LatestPosts />
      </Suspense>
    </main>
  )
}
```

The current Cache Components documentation recommends this pattern for fresh async data that should remain uncached while still avoiding a fully blocked page. citeturn332078view4

---

## 23. Streaming Data to Client Components

A promise can be created on the server and passed to a Client Component.

```tsx
import { Suspense } from "react"
import Posts from "./Posts"

export default function Page() {
  const posts = getPosts()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Posts posts={posts} />
    </Suspense>
  )
}
```

Client Component:

```tsx
"use client"

import { use } from "react"

export default function Posts({
  posts,
}: {
  posts: Promise<Post[]>
}) {
  const data = use(posts)

  return (
    <ul>
      {data.map((post) => (
        <li key={post.id}>
          {post.title}
        </li>
      ))}
    </ul>
  )
}
```

This lets the server start the data request while the Client Component consumes the promise with React's `use` API. citeturn725488view0

---

## 24. `loading.tsx`

For route-level loading UI:

```text
app/
└── products/
    ├── page.tsx
    └── loading.tsx
```

`loading.tsx`:

```tsx
export default function Loading() {
  return (
    <div>
      Loading products...
    </div>
  )
}
```

### Mental model

```text
Navigation
    ↓
loading.tsx
    ↓
Page rendering
    ↓
Actual content
```

Next.js automatically uses `loading.tsx` as a Suspense boundary around the route segment. citeturn332078view0

---

## 25. `Suspense` vs `loading.tsx`

### `loading.tsx`

```text
Route-level
      ↓
Broad loading state
```

### `<Suspense>`

```text
Component-level
      ↓
Fine-grained loading state
```

Example:

```tsx
<Suspense fallback={<OrdersSkeleton />}>
  <Orders />
</Suspense>
```

### Principle

```text
Whole route loading?
    → loading.tsx

One slow section?
    → Suspense
```

The current Next.js fetching documentation recommends placing Suspense closer to the uncached/runtime data when finer-grained streaming is useful. citeturn332078view0

---

## 26. Runtime APIs and Data Fetching

Some values are only known when the user makes a request.

Examples:

```text
cookies()
headers()
searchParams
dynamic route params
```

Think:

```text
Request
   ↓
Runtime value
   ↓
Data query
   ↓
UI
```

These are different from stable public data that can be prepared ahead of time.

With Cache Components, runtime values need special care around cache boundaries; the current docs recommend reading cookies/headers outside a cached scope and passing the required value as an argument. citeturn725488view3

---

## 27. Authentication and Data Fetching

User-specific data should be fetched with the user's identity and authorization in mind.

```text
Request
  ↓
Authenticated user
  ↓
Authorization check
  ↓
Database query
  ↓
User-specific UI
```

Do not rely only on hiding UI.

### Bad mental model

```text
Hide button
   ↓
User cannot access data
```

### Better

```text
Server
  ↓
Authenticate
  ↓
Authorize
  ↓
Fetch permitted data
```

Server-side access to a database does not automatically make an operation secure. Next.js explicitly recommends still performing proper authentication and authorization for server-side data access. citeturn442401view0

---

## 28. Secrets

Never expose secrets through Client Components.

### Bad

```tsx
"use client"

const API_KEY = "private-secret"
```

### Better

```text
Client
   ↓
Server
   ↓
Private API
```

Or:

```text
Server Component
   ↓
Private API
```

### Principle

```text
Private credential
      ↓
Server only
```

---

## 29. Data Fetching and Rendering

Data fetching and rendering are connected.

```text
Data source
    ↓
Fetching strategy
    ↓
Caching strategy
    ↓
Rendering strategy
    ↓
UI
```

For example:

```text
Public product catalog
    ↓
Cached data
    ↓
Pre-rendered / reused UI
```

while:

```text
Current user's cart
    ↓
Request-specific data
    ↓
Fresh server request
    ↓
Interactive UI
```

And:

```text
Slow reviews
    ↓
Fresh fetch
    ↓
Suspense
    ↓
Streaming
```

---

## 30. Data Fetching and Caching

A useful mental model:

```text
                DATA
                  │
          ┌───────┴────────┐
          ▼                ▼
       Fresh             Cached
          │                │
          │                └── "use cache"
          │
          └── Suspense
              + Streaming
```

### Ask

```text
How fresh must this data be?
        ↓
Can the result be reused?
        ↓
How should it be invalidated?
```

This is more useful than memorizing one universal caching rule.

---

## 31. Revalidation

When cached data becomes stale, you need a strategy for refreshing it.

Conceptually:

```text
Cached Data
    ↓
Still valid?
    │
   Yes
    ↓
Reuse

   No
    ↓
Recompute / refetch
```

Current Next.js provides caching and revalidation APIs such as:

```text
cacheLife
revalidateTag
revalidatePath
updateTag
```

The exact API you choose depends on the cache model and the mutation pattern.

For example, Server Actions can mutate data and then revalidate affected paths/tags so fresh data is rendered. citeturn593943search1

Detailed mutation patterns belong in your later Server Actions/data-mutation notes.

---

## 32. Sequential vs Parallel — Interview Table

| Pattern | Meaning | Use when |
|---------|---------|----------|
| Sequential | Request B starts after A | B depends on A |
| Parallel | Independent requests start together | Requests are independent |
| Preload | Start before component needs result | Avoid late request start |
| Streaming | Deliver sections as ready | Some data is slow |
| `React.cache` | Reuse result within request | Repeated DB/ORM access |
| `use cache` | Cache function/component output | Reusable cached data/UI |

---

## 33. Real-World Example — E-Commerce Product Page

### Requirement

Build:

- Product information
- Product image
- Inventory
- Reviews
- User cart
- Recommendations

### Architecture

```text
ProductPage
    Server
      │
      ├── ProductInfo
      │       Server
      │
      ├── ProductImage
      │       Server
      │
      ├── Inventory
      │       Server
      │
      ├── Reviews
      │       Suspense
      │
      ├── CartControls
      │       Client
      │
      └── Recommendations
              Suspense
```

### Data strategy

```text
Product
   ↓
Server fetch

Inventory
   ↓
Request-aware server fetch

Reviews
   ↓
Fresh fetch
   ↓
Suspense / Streaming

Cart
   ↓
Authenticated user data

Recommendations
   ↓
Independent request
   ↓
Parallel / Suspense
```

### Interview explanation

> "I would fetch product and server-available data in Server Components, keep the user's cart request server-side and authenticated, start independent requests in parallel where possible, and isolate slower sections behind Suspense so they can stream without blocking the entire product page."

---

## 34. Real-World Example — Dashboard

```text
Dashboard
    │
    ├── Summary Cards
    │       Server
    │
    ├── Revenue
    │       Server
    │
    ├── Orders
    │       Server
    │
    ├── Activity
    │       Suspense
    │
    └── Filters
            Client
```

### Data fetching

```text
Revenue ───────┐
Orders ────────┼──→ Parallel
Customers ─────┘

Activity
    ↓
Slow
    ↓
Suspense

Filters
    ↓
Client interaction
```

This architecture avoids turning the entire dashboard into a Client Component just because filters are interactive.

---

## 35. Common Mistakes

### Mistake 1 — Fetching everything in `useEffect`

❌

```tsx
"use client"

useEffect(() => {
  fetch("/api/products")
}, [])
```

Ask first whether a Server Component can fetch the data.

---

### Mistake 2 — Creating an API route unnecessarily

❌

```text
Server Component
   ↓
Internal API
   ↓
Database
```

when:

```text
Server Component
   ↓
Database
```

would already satisfy the requirement.

---

### Mistake 3 — Exposing database credentials

❌

```text
Client
  ↓
Database credentials
```

Use:

```text
Client
  ↓
Server
  ↓
Database
```

---

### Mistake 4 — Creating accidental waterfalls

❌

```tsx
const a = await getA()
const b = await getB()
const c = await getC()
```

when A, B, and C are independent.

Prefer:

```tsx
const [a, b, c] =
  await Promise.all([
    getA(),
    getB(),
    getC(),
  ])
```

---

### Mistake 5 — Parallelizing dependent requests

Do not blindly use `Promise.all` when:

```text
B needs A
```

Example:

```text
Get user
   ↓
Need user.id
   ↓
Get orders
```

This is correctly sequential.

---

### Mistake 6 — Treating `React.cache` as a global persistent cache

```text
React.cache
    ≠
Cross-request persistent cache
```

It is request-scoped memoization. citeturn725488view1

---

### Mistake 7 — Treating `"use cache"` as the same thing as `React.cache`

They solve different problems.

```text
React.cache
→ request-scoped reuse

"use cache"
→ Next.js Cache Components caching
```

---

### Mistake 8 — Caching user-specific data carelessly

Do not create a cache boundary that can accidentally mix data across users.

Think:

```text
User identity
      ↓
Cache key / cache boundary
      ↓
Correct data isolation
```

For runtime values such as cookies and headers, the current `use cache` guidance recommends reading them outside the cached scope and passing needed values in. citeturn725488view3

---

### Mistake 9 — Blocking the entire page for one slow request

Consider:

```text
Slow data
   ↓
Suspense
   ↓
Streaming
```

instead of forcing every part of the page to wait.

---

### Mistake 10 — Assuming `fetch()` is always cached

Current Next.js docs state that `fetch` requests are not cached by default. Treat caching as an explicit architectural decision rather than relying on outdated tutorials. citeturn442401view0

---

## 36. Interview Questions

### Q1. Where should you fetch data in Next.js?

For server-available data, prefer Server Components or another server-side data layer. Use Client Components when the requirement genuinely belongs in the browser. citeturn442401view0turn725488view0

---

### Q2. Can Server Components query the database directly?

Yes. Server Components run on the server, so database and ORM access can remain server-side. Authentication and authorization are still required. citeturn442401view0

---

### Q3. What is a request waterfall?

A waterfall occurs when one request waits for another request to finish before it can start.

```text
A
↓
B
↓
C
```

---

### Q4. How do you avoid waterfalls?

Use parallel requests when the data is independent:

```tsx
await Promise.all([
  getA(),
  getB(),
  getC(),
])
```

or preload a request before other blocking work. citeturn332078view2turn725488view1

---

### Q5. When is sequential fetching correct?

When a later request depends on the result of an earlier request.

```text
User
 ↓
user.id
 ↓
Orders
```

---

### Q6. What is `React.cache`?

It memoizes function calls within the current request, which is useful for repeated database/ORM access. citeturn725488view1

---

### Q7. What is `use cache`?

In the current Cache Components model, `use cache` marks async functions, components, or route-level code as cacheable. citeturn725488view3

---

### Q8. Is `fetch()` cached by default?

In current Next.js App Router documentation, fetch requests are not cached by default. Explicitly choose the caching approach your route needs. citeturn442401view0

---

### Q9. How can slow data be streamed?

Wrap the slow async component in:

```tsx
<Suspense fallback={<Loading />}>
  <SlowComponent />
</Suspense>
```

Then the surrounding UI can be delivered while the slow part resolves. citeturn332078view0turn332078view4

---

### Q10. What is preloading?

Preloading starts a data request before the component actually needs to await the result, reducing avoidable request delays. citeturn725488view1

---

### Q11. Do you always need an API route for database access?

No. A Server Component can query the database directly. An API/Route Handler is useful when an HTTP boundary is actually required. citeturn593943search0

---

### Q12. What should you do with secrets?

Keep private credentials and server-only access on the server.

---

### Q13. How do you fetch client-side data?

You can use React's `use` API or libraries such as SWR and React Query in Client Components. citeturn725488view0

---

### Q14. What is the difference between caching and memoization?

```text
Memoization
→ Reuse within a defined execution/request scope

Caching
→ Store reusable results according to a cache policy/lifetime
```

`React.cache` is request-scoped memoization, while `use cache` participates in Next.js Cache Components. citeturn725488view1turn725488view3

---

## 37. Interview Failure Points

Avoid these answers:

```text
❌ "Every fetch must use useEffect."

❌ "Every database call needs an API route."

❌ "fetch() is always cached."

❌ "React.cache is a global database cache."

❌ "use cache and React.cache are the same."

❌ "All requests should be Promise.all."

❌ "Server Components cannot access databases."

❌ "Client Components should contain all data fetching."

❌ "Streaming means every request is cached."

❌ "If data is slow, just block the whole page."

❌ "Hiding a private button is enough for authorization."
```

### Better mental model

```text
Server-available data
        ↓
Server Component / server data layer

Independent requests
        ↓
Parallel

Dependent requests
        ↓
Sequential

Repeated DB/ORM call in one request
        ↓
React.cache

Reusable cached output
        ↓
"use cache"

Slow fresh data
        ↓
Suspense + Streaming

Browser-owned requirement
        ↓
Client fetching
```

---

## 38. Performance Connection

The main performance question is often not:

```text
"How do I fetch data?"
```

but:

```text
"When does the request start?"
"When does it finish?"
"Can another request start earlier?"
"Can the result be reused?"
"Does the user need to wait for it?"
```

### Performance model

```text
Late request
     ↓
Waterfall
     ↓
Longer wait
```

Improve it with:

```text
Parallel fetch
     ↓
Shorter critical path
```

```text
Preload
     ↓
Earlier request start
```

```text
Cache
     ↓
Reuse result
```

```text
Suspense + Streaming
     ↓
Don't block unrelated UI
```

This is why data-fetching architecture and rendering architecture should be considered together.

---

## 39. Data Fetching Architecture

```text
                         PAGE
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
          SERVER                    CLIENT
             │                         │
     ┌───────┼────────┐          ┌─────┴─────┐
     ▼       ▼        ▼          ▼           ▼
   fetch     DB      ORM       use()       SWR/
                                       React Query
     │       │        │
     └───────┴────────┘
              │
              ▼
            DATA
              │
        ┌─────┴─────┐
        ▼           ▼
      Fresh       Cached
        │           │
        ▼           ▼
    Suspense     use cache
    Streaming    cacheLife
```

### Decision sequence

```text
1. Where should the data be fetched?
2. Is it server-owned or browser-owned?
3. Are requests dependent?
4. Can they run in parallel?
5. Should the result be reused?
6. Does the user need to wait?
7. Can slow parts stream independently?
```

---

## 40. Full E-Commerce Data Flow

```text
                         Product Page
                              │
             ┌────────────────┼─────────────────┐
             ▼                ▼                 ▼
        Product Data       Inventory         Reviews
             │                │                 │
             ▼                ▼                 ▼
          Server            Server           Server
             │                │                 │
             └────────┬───────┴─────────────────┘
                      ▼
                  Fetching
                      │
             ┌────────┴────────┐
             ▼                 ▼
        Independent         Slow data
             │                 │
             ▼                 ▼
         Parallel           Suspense
             │                 │
             └────────┬────────┘
                      ▼
                  Render
                      │
             ┌────────┴────────┐
             ▼                 ▼
          Server UI          Client UI
                                │
                         Quantity / Cart
```

---

## 41. 30-Second Revision

### Server Fetching

```text
→ Default choice for server-available data
→ Server Components can use fetch
→ Server Components can query DB/ORM
→ Keep secrets server-side
```

### Request Control

```text
→ Sequential when dependent
→ Parallel when independent
→ Preload to start earlier
→ React.cache for request-scoped reuse
```

### Caching

```text
→ fetch is not automatically persistent-cached
→ use cache for Cache Components
→ cacheLife controls cache lifetime/profile
→ Think about cache boundaries and user data
```

### Slow Data

```text
→ Suspense
→ Streaming
→ loading.tsx
→ Keep slow UI from blocking unrelated UI
```

### Client Fetching

```text
→ Use when the browser owns the requirement
→ React use()
→ SWR
→ React Query
```

---

## 42. Final Interview Answer

> "In the Next.js App Router, I prefer fetching server-available data in Server Components because they can access APIs, databases, and other server-side resources without exposing those credentials to the browser. I first check whether requests are dependent or independent: dependent requests are sequential, while independent requests should usually be started in parallel to avoid waterfalls. I can preload data when a request would otherwise start too late, and I can use React.cache to reuse database or ORM results within a request. For reusable cached data in the current Cache Components model, I can use `use cache` with an appropriate cache lifetime. When data needs to stay fresh and is slow, I can wrap the async UI in Suspense and stream it instead of blocking the whole page. Client-side fetching is reserved for requirements that genuinely belong in the browser."

---

## 43. Revision Checklist

- [ ] Understand what data fetching means
- [ ] Know why Server Components are useful for fetching
- [ ] Know how to use `fetch` on the server
- [ ] Know how to query a database/ORM from the server
- [ ] Understand when an API layer is actually needed
- [ ] Understand Server vs Client fetching
- [ ] Understand request waterfalls
- [ ] Know sequential fetching
- [ ] Know parallel fetching
- [ ] Know `Promise.all`
- [ ] Know `Promise.allSettled`
- [ ] Understand preloading
- [ ] Understand `React.cache`
- [ ] Understand `React.cache` request scope
- [ ] Understand Cache Components
- [ ] Understand `use cache`
- [ ] Understand `cacheLife`
- [ ] Understand fresh uncached data
- [ ] Understand Suspense + streaming
- [ ] Understand `loading.tsx`
- [ ] Understand Client Component fetching
- [ ] Know SWR / React Query at a high level
- [ ] Keep secrets server-side
- [ ] Perform authorization on the server
- [ ] Understand caching + rendering connection
- [ ] Know common interview traps
- [ ] Explain data fetching in an interview
- [ ] Design an e-commerce data-fetching architecture

---

## 44. One-Line Rule

> **Fetch on the server when the data belongs to the server, parallelize independent work, cache intentionally, and stream slow fresh data instead of making the whole page wait.**

---

# Quick Interview Cheat Sheet

```text
SERVER DATA
↓
Server Component

DATABASE
↓
Server only

API LAYER
↓
Use when an HTTP boundary is actually needed

INDEPENDENT REQUESTS
↓
Promise.all

DEPENDENT REQUESTS
↓
Sequential

REQUEST TOO LATE
↓
Preload

REPEATED DB/ORM CALL
↓
React.cache

REUSABLE CACHED OUTPUT
↓
"use cache"

SLOW FRESH DATA
↓
Suspense + Streaming

ROUTE-LEVEL LOADING
↓
loading.tsx

CLIENT-OWNED DATA
↓
Client Component
↓
use() / SWR / React Query

SECURITY
↓
Authenticate
↓
Authorize
↓
Fetch permitted data

CORE MENTAL MODEL
↓
Where?
When?
How many requests?
Can they run in parallel?
Can the result be reused?
Does the user need to wait?
```

> **One mental model:**
>
> **Fetch server-owned data on the server, avoid accidental waterfalls, cache only when the data can safely be reused, and stream slow fresh data instead of blocking unrelated UI.**
