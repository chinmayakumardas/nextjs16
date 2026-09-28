# 02 — Server & Client Components

> Next.js App Router — Server Components, Client Components, boundaries, composition, examples, pitfalls & interview revision.

---

## 1. Mental Model

```text
                    NEXT.JS APP ROUTER
                           │
                           ▼
                 SERVER COMPONENTS
                      (default)
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           Data          DB/API        Secrets
             │
             ▼
       CLIENT BOUNDARY
       "use client"
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
     State Events Browser APIs
       │
       ▼
   Interactive UI
```

### Golden Rule

```text
Server by default
      ↓
Client only when interaction/browser capability is required
```

---

## 2. Server Components

In the App Router, components are **Server Components by default**.

```tsx
export default function Page() {
  return <h1>Hello Next.js</h1>
}
```

No `"use server"` is required.

### Good for

* Server-side data fetching
* Database access through server-side code
* Server-only libraries
* Secrets
* Static/non-interactive UI
* Keeping client JavaScript focused

### Example

```tsx
import { getProducts } from "@/lib/products"

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
      ├── fetch data
      ├── query DB
      ├── use server-only code
      └── render UI
```

---

## 3. Client Components

A Client Component is created with:

```tsx
"use client"
```

### Example

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

### Use Client Components when you need

* `useState`
* `useEffect`
* Event handlers
* Browser APIs
* Client-side hooks
* Interactive UI
* Client-only libraries

### Examples

```text
onClick
onChange
window
document
localStorage
useState()
useEffect()
useRouter()
usePathname()
useSearchParams()
```

---

## 4. Server vs Client

| Server Component            | Client Component             |
| --------------------------- | ---------------------------- |
| Default                     | Requires `"use client"`      |
| Server-side code            | Client-side capabilities     |
| Can access server resources | Cannot expose server secrets |
| Good for data fetching      | Good for interaction         |
| No `useState`               | `useState` available         |
| No `useEffect`              | `useEffect` available        |
| No browser APIs             | Browser APIs available       |
| No event handlers           | Event handlers available     |

---

## 5. What Does `"use client"` Mean?

```tsx
"use client"
```

It creates a **Client Component boundary**.

It does **not** mean:

```text
Entire application = Client
```

It means:

```text
This module
   ↓
Client Component boundary
```

### Example

```tsx
"use client"

export default function Button() {
  return <button>Buy</button>
}
```

---

## 6. Don't Use `"use client"` Everywhere

### Avoid

```tsx
"use client"

export default function ProductPage() {
  return (
    <>
      <h1>Product</h1>
      <p>Description...</p>
    </>
  )
}
```

if the page has no client-side requirement.

### Prefer

```text
ProductPage
   Server
     │
     ├── ProductInfo
     │     Server
     │
     └── AddToCart
           Client
```

### Principle

Keep the Client boundary focused.

```text
Interactive requirement
        ↓
Extract small Client Component
```

---

## 7. Server → Client Composition

A Server Component can render a Client Component.

### Server

```tsx
import Counter from "./Counter"

export default function Page() {
  return (
    <main>
      <h1>Dashboard</h1>
      <Counter />
    </main>
  )
}
```

### Client

```tsx
"use client"

import { useState } from "react"

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount((c) => c + 1)}>
      {count}
    </button>
  )
}
```

### Structure

```text
Page
(Server)
  │
  ├── Heading
  │    Server
  │
  └── Counter
       Client
```

This is one of the most common patterns.

---

## 8. Keep Client Boundary Small

### Example

```text
Dashboard
(Server)
   │
   ├── Header
   │    Server
   │
   ├── Stats
   │    Server
   │
   ├── Orders
   │    Server
   │
   └── DateFilter
        Client
```

Don't make the entire Dashboard Client just because `DateFilter` is interactive.

### Principle

```text
Interactive requirement
        ↓
Extract small Client Component
```

---

## 9. Passing Props

Server Components can pass appropriate data to Client Components.

### Server

```tsx
import ProductActions from "./ProductActions"

export default async function Page() {
  const product = await getProduct()

  return (
    <ProductActions
      id={product.id}
      price={product.price}
    />
  )
}
```

### Client

```tsx
"use client"

export default function ProductActions({
  id,
  price,
}: {
  id: string
  price: number
}) {
  return (
    <button>
      Buy {id} - ${price}
    </button>
  )
}
```

### Important

Data crossing the Server/Client boundary must follow React's supported serialization rules.

Think:

```text
Server data
    ↓
serializable props
    ↓
Client Component
```

---

## 10. `children` Composition

A useful pattern:

```text
<ClientWrapper>
  <ServerContent />
</ClientWrapper>
```

### Client Component

```tsx
"use client"

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <div>{children}</div>
}
```

### Server Component

```tsx
import ClientWrapper from "./ClientWrapper"
import ServerContent from "./ServerContent"

export default function Page() {
  return (
    <ClientWrapper>
      <ServerContent />
    </ClientWrapper>
  )
}
```

### Why?

It allows server-rendered UI to be composed around interactive Client Components without unnecessarily converting everything to client-side code.

---

## 11. `useState`

Requires a Client Component.

```tsx
"use client"

import { useState } from "react"

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount((c) => c + 1)}>
      {count}
    </button>
  )
}
```

```text
useState
   ↓
Client
```

---

## 12. `useEffect`

Requires a Client Component.

```tsx
"use client"

import { useEffect } from "react"

export default function Example() {
  useEffect(() => {
    console.log("Browser effect")
  }, [])

  return <div>Hello</div>
}
```

```text
useEffect
   ↓
Client
```

---

## 13. Browser APIs

Browser APIs require Client Components.

```tsx
"use client"

export default function ThemeButton() {
  function changeTheme() {
    document.body.classList.toggle("dark")
  }

  return (
    <button onClick={changeTheme}>
      Toggle
    </button>
  )
}
```

### Examples

```text
window
document
localStorage
navigator
```

---

## 14. Event Handlers

Event handlers require client-side behavior.

```tsx
"use client"

export default function Button() {
  function handleClick() {
    alert("Hello")
  }

  return (
    <button onClick={handleClick}>
      Click
    </button>
  )
}
```

```text
onClick
onChange
onSubmit
   ↓
Client
```

---

## 15. Server Component + Interactive UI

Typical real-world page:

```text
Product Page
    │
    ├── Product Details
    │      Server
    │
    ├── Product Image
    │      Server
    │
    ├── Reviews
    │      Server
    │
    ├── Quantity Selector
    │      Client
    │
    └── Add to Cart
           Client
```

This is the architecture to think about in interviews.

---

## 16. Data Fetching

### Server Component

```tsx
export default async function Page() {
  const data = await fetch("https://api.example.com/products")

  return <div>...</div>
}
```

Do not automatically write:

```tsx
"use client"

useEffect(() => {
  fetch(...)
}, [])
```

for every data-fetching requirement.

First ask:

```text
Can this data be fetched on the server?
        │
       Yes
        ↓
Server Component
```

Client-side fetching is still valid when the requirement is genuinely client-side.

Detailed data-fetching patterns belong in:

```text
04-data-fetching/
```

---

## 17. Database Access

Keep database access server-side.

### Good

```text
Server Component
      ↓
Server data layer
      ↓
Database
```

### Bad

```text
Client Component
      ↓
Database credentials
      ↓
Browser
```

### Example

```tsx
import { db } from "@/lib/db"

export default async function Page() {
  const users = await db.user.findMany()

  return <div>{users.length} users</div>
}
```

The database implementation remains server-side.

---

## 18. Secrets

Never expose private secrets in Client Components.

### Bad

```tsx
"use client"

const secret = "my-private-api-key"
```

### Better

```text
Client
  ↓
Server
  ↓
Private API
```

Server-only code can use private environment variables and credentials.

---

## 19. `"use client"` vs `"use server"`

Do not confuse them.

### `"use client"`

```tsx
"use client"
```

Used to define a Client Component/module boundary.

Used for:

```text
state
events
effects
browser APIs
```

### `"use server"`

```tsx
"use server"
```

Used for Server Functions / Server Actions.

```text
server-side mutation/function
```

It is **not** required to make an ordinary Server Component a Server Component.

### Remember

```text
Server Component
      ↓
default

Client Component
      ↓
"use client"

Server Function
      ↓
"use server"
```

Detailed Server Functions belong in:

```text
08-server-actions-functions/
```

---

## 20. Hydration — Interview Level

Simplified mental model:

```text
Server
  ↓
Initial UI
  ↓
Browser
  ↓
Client JavaScript
  ↓
Interactive behavior
```

Hydration is the process where React attaches client-side behavior to the rendered UI.

Don't say:

> "Client Components only render in the browser."

Better:

> Client Components provide the client-side JavaScript needed for interactive behavior and participate in the initial rendering process.

---

## 21. Performance Connection

A large Client Component boundary can mean more client-side JavaScript.

```text
Large Client boundary
        ↓
More client JS
        ↓
More browser work
```

Prefer:

```text
Server Components
       +
small Client Components
```

But don't claim:

> "Server Components are always faster."

Actual performance depends on:

* Data fetching
* Caching
* Network
* Bundle size
* Database
* Rendering
* Component architecture

---

## 22. Common Mistakes

### Mistake 1 — Adding `"use client"` to every component

❌ Everything Client

Instead:

```text
✅ Server by default
   Client where needed
```

---

### Mistake 2 — Using `useEffect` for every API request

❌ Automatically fetch everything in `useEffect`

Consider server-side fetching first.

---

### Mistake 3 — Putting database code in Client Components

❌ Client → DB

Use:

```text
✅ Client → Server → DB
```

---

### Mistake 4 — Exposing secrets

❌

```text
secret → browser
```

Keep secrets server-side.

---

### Mistake 5 — Making the whole page Client because one button is interactive

❌

```text
Page = Client
        because Button = Client
```

Prefer:

```text
Page = Server
Button = Client
```

---

### Mistake 6 — Thinking `"use server"` means Server Component

❌

```text
"use server" = Server Component
```

Server Components are already the default.

---

### Mistake 7 — Thinking Server Components cannot render Client Components

They can.

```text
Server
  ↓
Client
```

is a normal composition pattern.

---

## 23. Interview Questions

### Q1. What are Server Components?

Server Components are the default components in the App Router. They execute on the server and are useful for server-side data access, server-only dependencies, and non-interactive UI.

### Q2. What are Client Components?

Client Components are modules marked with `"use client"` that support client-side features such as state, effects, event handlers, browser APIs, and interactive UI.

### Q3. When do you use `"use client"`?

When the component needs client-side capabilities such as state, effects, event handlers, browser APIs, or a client-only library.

### Q4. Why not make everything Client?

Not every component needs browser-side JavaScript. Keeping non-interactive components server-side can reduce unnecessary client-side JavaScript and keeps server-side work on the server.

### Q5. Can Server Components render Client Components?

Yes.

```text
Server Component
      ↓
Client Component
```

This is a normal App Router pattern.

### Q6. Can Server Components use `useState`?

No.

`useState` requires a Client Component.

### Q7. Can Server Components use `onClick`?

No.

Event handlers require client-side behavior.

### Q8. Can Client Components access secrets?

No.

Private secrets and server-only resources should remain server-side.

### Q9. Can Client Components receive props from Server Components?

Yes, provided the values can cross the Server/Client boundary using supported serialization.

### Q10. Why keep Client Components small?

To avoid unnecessarily moving large parts of the UI into the client-side JavaScript boundary.

---

## 24. Interview Failure Points

Avoid these answers:

```text
❌ "Everything in Next.js is Server Component."

❌ "use server makes a component a Server Component."

❌ "Client Components only render in the browser."

❌ "Every API call should use useEffect."

❌ "If one button needs useState, the whole page must be Client."

❌ "Server Components cannot contain Client Components."

❌ "Client Components can safely access database credentials."

❌ "Server Components are always faster."
```

### Better mental model

```text
Default
   ↓
Server

Need browser interaction?
   ↓
Client

Need only one interactive area?
   ↓
Keep parent Server
+
extract small Client Component
```

---

## 25. Real-World Example

### Requirement

Build:

**E-commerce Product Page**

* Product details
* Product image
* Reviews
* Quantity selector
* Add to cart

### Architecture

```text
ProductPage
   Server
     │
     ├── ProductDetails
     │      Server
     │
     ├── ProductImage
     │      Server
     │
     ├── Reviews
     │      Server
     │
     └── CartControls
            Client
              │
              ├── QuantitySelector
              └── AddToCart
```

### Reasoning

```text
Product data
    → Server

Reviews
    → Server

Quantity interaction
    → Client

Button click
    → Client
```

This is the kind of architecture you should be able to explain in an interview.

---

## 26. Quick Decision Tree

Does component need...

```text
useState?
   → Client

useEffect?
   → Client

onClick/onChange?
   → Client

window/document/localStorage?
   → Client

client-only library?
   → Client

None of the above?
   → Keep Server by default
```

Then ask:

```text
Can only a small child be Client?
        ↓
       Yes
        ↓
Keep parent Server
```

---

## 27. 30-Second Revision

### Server Components

```text
→ Default
→ Server-side data
→ DB/server resources
→ Secrets
→ Non-interactive UI
```

### Client Components

```text
→ "use client"
→ State
→ Effects
→ Events
→ Browser APIs
→ Interactive UI
```

### Architecture

```text
→ Server first
→ Small Client boundaries
→ Server can render Client
→ Don't expose secrets
→ Don't make entire page Client unnecessarily
```

---

## 28. Final Interview Answer

> "In the Next.js App Router, Server Components are the default. I keep components server-side unless they require client capabilities such as state, effects, event handlers, browser APIs, or client-only libraries. I use `"use client"` to create the client boundary and try to keep that boundary as small as practical. Server Components can render Client Components, so I can keep data fetching and non-interactive UI on the server while isolating interactive parts on the client. Sensitive operations such as database access and secrets remain server-side."

---

## 29. Revision Checklist

* [ ] Server Components are default
* [ ] Understand `"use client"`
* [ ] Know when Client Components are required
* [ ] Know `useState` → Client
* [ ] Know `useEffect` → Client
* [ ] Know events → Client
* [ ] Know browser APIs → Client
* [ ] Understand Server → Client composition
* [ ] Understand props across the boundary
* [ ] Understand `children` composition
* [ ] Keep secrets server-side
* [ ] Keep DB access server-side
* [ ] Understand hydration at interview level
* [ ] Know `"use server"` is different
* [ ] Know common interview traps
* [ ] Be able to design a mixed Server/Client page

---

## 30. One-Line Rule

> **Server by default. Client when the UI actually needs the browser.**
