# 03 — Rendering

> Next.js App Router — Rendering, Static Rendering, Dynamic Rendering, Streaming, Suspense, Hydration, Server/Client rendering, caching connection, examples, pitfalls & interview revision.

---

## 1. Mental Model

```text
                    NEXT.JS RENDERING

                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Static          Dynamic       Streaming
       Rendering       Rendering      Rendering
          │              │              │
          ▼              ▼              ▼
       Ahead of        Request       Progressive
       request         time          UI
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                      Browser
                         │
                         ▼
                     Hydration
```

### Golden Rule

```text
First ask:

When should this UI/data be rendered?

        ↓

Can it be prepared ahead of time?
        ↓
     Static

Does it depend on request-time information?
        ↓
     Dynamic

Is some UI slower than the rest?
        ↓
 Streaming / Suspense
```

---

## 2. What Is Rendering?

Rendering means converting React components into UI that can be delivered to the user.

Think:

```text
React Components
       ↓
    Rendering
       ↓
     HTML/UI
       ↓
    Browser
```

In Next.js, rendering is not one single technique. The application can use different rendering approaches depending on the route, data requirements, caching, and component architecture.

### Important distinction

Do not confuse:

```text
Server / Client Components
        ↓
Component architecture
```

with:

```text
Static / Dynamic / Streaming
        ↓
Rendering strategy
```

They are related, but they describe different parts of the application.

---

## 3. Server Rendering

A simplified model:

```text
Request
   ↓
Server
   ↓
React rendering
   ↓
HTML/UI
   ↓
Browser
```

The server can render UI before the browser receives it.

This is useful when the server already has access to the data required to construct the UI.

### Mental model

```text
Server Component
      │
      ├── fetch data
      ├── query server resources
      └── render UI
             ↓
           Browser
```

Server rendering should not be interpreted as:

```text
Everything is always rendered fresh for every request.
```

Caching and rendering strategy affect the actual behavior.

---

## 4. Static Rendering

Static rendering means a route can be rendered ahead of the request and the result can be reused.

```tsx
export default function Page() {
  return (
    <main>
      <h1>About Us</h1>
      <p>Welcome to our company.</p>
    </main>
  )
}
```

### Mental model

```text
Build / pre-render
       ↓
     HTML/UI
       ↓
     Request
       ↓
      User
```

### Good for

- Marketing pages
- Documentation
- Blog content
- About pages
- Public content that does not need request-specific information

### Key idea

```text
Can this page be prepared before the user requests it?

        ↓

       Yes

        ↓

Static rendering may be appropriate
```

---

## 5. Dynamic Rendering

Dynamic rendering means the route needs request-time information or otherwise has dynamic requirements.

```tsx
export default async function Page() {
  const user = await getCurrentUser()

  return (
    <main>
      <h1>Hello {user.name}</h1>
    </main>
  )
}
```

### Mental model

```text
User Request
      ↓
Next.js
      ↓
Request-specific data
      ↓
Render
      ↓
Response
```

### Typical reasons

```text
Request-specific information
        ↓
authentication
personalization
cookies
headers
request-time data
```

### Important

Do not reduce dynamic rendering to:

```text
Dynamic = useEffect()
```

Dynamic rendering is primarily about when and why the server needs to produce UI based on dynamic requirements.

---

## 6. Static vs Dynamic

| Static Rendering | Dynamic Rendering |
|------------------|-------------------|
| Can be prepared ahead of the request | Depends on dynamic/request requirements |
| Good for shared content | Good for personalized content |
| Can be reused/cached | Often depends on request context |
| Pre-render oriented | Request-time oriented |
| Useful for stable content | Useful for changing or user-specific content |

### Mental model

```text
Static

Prepare early
     ↓
Reuse result


Dynamic

Request
   ↓
Determine data
   ↓
Render
```

---

## 7. Client-Side Rendering

Client-side rendering means the browser performs rendering work using JavaScript.

A simplified model:

```text
Server
  ↓
HTML + JavaScript
  ↓
Browser
  ↓
React
  ↓
UI
```

Client-side rendering is different from simply having a Client Component.

### Do not think

```text
"use client"
    =
Everything renders only in the browser
```

Instead, remember:

```text
"use client"
    ↓
Client Component boundary
```

A Client Component can participate in the initial rendering process while also providing the client-side JavaScript needed for interactive behavior.

---

## 8. Hydration

Hydration connects the initially rendered UI with client-side React behavior.

### Simplified mental model

```text
Server
  ↓
Initial UI
  ↓
Browser
  ↓
Client JavaScript
  ↓
Hydration
  ↓
Interactive behavior
```

Hydration is the process where React attaches client-side behavior to rendered UI.

### Interview wording

Do not say:

> Client Components only render in the browser.

Better:

> Client Components provide the client-side JavaScript needed for interactive behavior and participate in the initial rendering process.

---

## 9. Static Rendering + Hydration

A page can have mostly static/server-rendered content while containing interactive Client Components.

```text
Product Page
     │
     ├── Product Details
     │       Server
     │
     ├── Product Image
     │       Server
     │
     ├── Reviews
     │       Server
     │
     └── Quantity Selector
             Client
```

The important idea is:

```text
Server-rendered UI
       +
Small interactive Client Component
```

This avoids turning the entire page into client-side code just because one section needs interaction.

---

## 10. Streaming

Streaming allows parts of the UI to reach the browser as they become available.

```text
Request
   ↓
Server
   ↓
┌────────────────┐
│ Header ready   │ ─────→ Browser
└────────────────┘

┌────────────────┐
│ Product ready  │ ─────→ Browser
└────────────────┘

┌────────────────┐
│ Reviews ready  │ ─────→ Browser
└────────────────┘
```

### Without streaming

```text
Header
Product
Reviews
   ↓
Wait for everything
   ↓
Browser receives UI
```

### With streaming

```text
Header
   ↓
Browser

Product
   ↓
Browser

Reviews
   ↓
Browser
```

### Main idea

```text
Slow section
    ↓
Don't necessarily block
the entire UI
```

---

## 11. Suspense

React Suspense provides a loading boundary around UI that may not be ready immediately.

```tsx
import { Suspense } from "react"

export default function Page() {
  return (
    <main>
      <h1>Product</h1>

      <Suspense fallback={<p>Loading reviews...</p>}>
        <Reviews />
      </Suspense>
    </main>
  )
}
```

### Mental model

```text
Page
 │
 ├── Header
 │      Ready
 │
 └── Reviews
        │
        ├── Loading
        │
        └── Ready
```

The user can see the available part of the page while slower content is being prepared.

---

## 12. Streaming + Suspense

These concepts often work together.

```text
Request
   ↓
Page starts rendering
   ↓
┌───────────────────┐
│ Fast content      │
└───────────────────┘
        ↓
     Browser

┌───────────────────┐
│ Slow content      │
│ <Suspense>        │
└───────────────────┘
        ↓
     Later
```

### Think

```text
Suspense
   ↓
Defines the boundary

Streaming
   ↓
Allows ready UI to be delivered progressively
```

---

## 13. Loading UI

A loading UI provides immediate feedback while content is not ready.

```text
User Request
     ↓
Loading UI
     ↓
Content becomes ready
     ↓
Actual UI
```

In the App Router, route-level loading states can be represented with `loading.tsx`.

```tsx
export default function Loading() {
  return <p>Loading...</p>
}
```

### Mental model

```text
Page
 │
 ├── loading.tsx
 │       ↓
 │    Loading UI
 │
 └── page.tsx
         ↓
      Actual UI
```

---

## 14. Error Boundaries and Rendering

Rendering can also involve error handling.

A route can provide an error UI for failures during rendering or related route operations.

```tsx
"use client"

export default function Error({
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

### Mental model

```text
Render
  ↓
Success
  → UI

Failure
  → Error UI
```

The error boundary itself needs client capabilities for actions such as `reset()`.

---

## 15. Rendering + Server Components

Rendering and Server Components should be understood separately.

```text
Server / Client Components
          ↓
Component architecture
```

```text
Static / Dynamic / Streaming
          ↓
Rendering strategy
```

For example:

```text
ProductPage
    ↓
Server Component
    ↓
Dynamic data
    ↓
Suspense
    ↓
Stream slow reviews
```

One page can therefore combine multiple concepts.

---

## 16. Rendering + Client Components

A Client Component is useful when the UI needs client-side capabilities.

```tsx
"use client"

import { useState } from "react"

export default function QuantitySelector() {
  const [quantity, setQuantity] = useState(1)

  return (
    <div>
      <button onClick={() => setQuantity((q) => q - 1)}>
        -
      </button>

      <span>{quantity}</span>

      <button onClick={() => setQuantity((q) => q + 1)}>
        +
      </button>
    </div>
  )
}
```

### Rendering architecture

```text
ProductPage
    Server
       │
       ├── ProductInfo
       │      Server
       │
       └── QuantitySelector
              Client
```

The interactive part is isolated instead of converting the entire page to a Client Component.

---

## 17. Rendering + Data Fetching

When designing a page, ask:

```text
Where is the data available?
        ↓
When does the data change?
        ↓
Is it user-specific?
        ↓
Can it be reused/cached?
        ↓
Does the UI need to wait for it?
```

Then decide the appropriate rendering approach.

### Server-first mental model

```text
Can the data be fetched on the server?
        │
       Yes
        ↓
Fetch on server
        ↓
Render UI
```

Do not automatically write:

```tsx
"use client"

useEffect(() => {
  fetch(...)
}, [])
```

for every data-fetching requirement.

Client-side fetching is valid when the requirement is genuinely client-side.

---

## 18. Rendering + Caching

Rendering and caching are closely connected.

Think:

```text
Data
 ↓
Caching
 ↓
Rendering
 ↓
Response
```

Do not simplify the system to:

```text
Static = cached forever
Dynamic = never cached
```

The actual behavior depends on the Next.js version, data-fetching strategy, route configuration, and caching behavior being used.

### Interview principle

> Rendering strategy and caching strategy should be reasoned about together.

---

## 19. Real-World Example — E-Commerce Product Page

### Requirement

Build:

- Product details
- Product image
- Reviews
- Quantity selector
- Add to cart
- User-specific cart information

### Architecture

```text
ProductPage
    Server
      │
      ├── ProductDetails
      │       Server
      │
      ├── ProductImage
      │       Server
      │
      ├── Reviews
      │       Suspense
      │
      └── CartControls
              Client
                 │
                 ├── QuantitySelector
                 │
                 └── AddToCart
```

### Rendering reasoning

```text
Product data
    ↓
Server

Product image
    ↓
Server

Reviews
    ↓
Can load independently
    ↓
Suspense + Streaming

Quantity interaction
    ↓
Client

Add to cart
    ↓
Client
```

This is the type of mixed architecture you should be able to explain in an interview.

---

## 20. Another Example — Dashboard

### Requirement

```text
Dashboard
 ├── Header
 ├── Statistics
 ├── Orders
 ├── Activity
 └── Filters
```

Possible architecture:

```text
Dashboard
   Server
     │
     ├── Header
     │    Server
     │
     ├── Statistics
     │    Server
     │
     ├── Orders
     │    Server
     │
     ├── Activity
     │    Suspense
     │
     └── Filters
          Client
```

### Reasoning

```text
Non-interactive UI
        ↓
Server

Slow independent section
        ↓
Suspense / Streaming

Interactive filter
        ↓
Client
```

---

## 21. Rendering Decision Tree

Ask:

```text
Can this UI/data be prepared ahead of the request?
        │
       Yes
        ↓
     Static
```

If not:

```text
Does it depend on request/user-specific information?
        │
       Yes
        ↓
     Dynamic
```

Then:

```text
Is some part of the UI slower than the rest?
        │
       Yes
        ↓
Suspense + Streaming
```

Then:

```text
Does a component need:

useState?
useEffect?
event handlers?
browser APIs?

        ↓

      Client
```

Otherwise:

```text
Keep it Server by default
```

---

## 22. Common Mistakes

### Mistake 1 — Thinking Next.js has only SSR

❌

```text
Everything = SSR
```

Next.js supports multiple rendering approaches.

---

### Mistake 2 — Thinking `"use client"` means CSR

❌

```text
"use client"
      ↓
Only browser rendering
```

Better:

```text
"use client"
      ↓
Client Component boundary
      ↓
Client-side capabilities
```

---

### Mistake 3 — Using `useEffect` for every API request

❌

```tsx
"use client"

useEffect(() => {
  fetch(...)
}, [])
```

Ask first whether the data can be fetched on the server.

---

### Mistake 4 — Making the entire page Client

❌

```text
Page = Client

because

Button = Client
```

Prefer:

```text
Page = Server

Button = Client
```

---

### Mistake 5 — Blocking the whole page for one slow section

❌

```text
Header
Product
Reviews
   ↓
Wait for Reviews
   ↓
Show everything
```

Consider:

```text
Header
Product
   ↓
Show immediately

Reviews
   ↓
Suspense
   ↓
Stream later
```

---

### Mistake 6 — Thinking static means "no JavaScript"

Static rendering describes when/how UI can be pre-rendered or reused. It does not mean the resulting application cannot contain interactive Client Components.

---

### Mistake 7 — Thinking dynamic means "useEffect"

Dynamic rendering and client-side data fetching are different concepts.

```text
Dynamic rendering
      ↓
Server/request rendering requirement
```

while:

```text
useEffect + fetch
      ↓
Client-side data fetching
```

---

### Mistake 8 — Thinking Server Components cannot be interactive anywhere

A Server Component itself cannot use client-only capabilities such as `useState` or `onClick`, but it can render or compose Client Components.

---

## 23. Interview Questions

### Q1. What is rendering in Next.js?

Rendering is the process of turning React components into UI that can be delivered to the user.

---

### Q2. What is static rendering?

Static rendering means the result can be prepared ahead of the request and reused.

---

### Q3. What is dynamic rendering?

Dynamic rendering is used when the UI depends on dynamic or request-specific requirements.

---

### Q4. What is hydration?

Hydration is the process where React attaches client-side behavior to rendered UI.

---

### Q5. What is streaming?

Streaming allows parts of a UI to be delivered progressively as they become ready.

---

### Q6. What is Suspense?

Suspense provides a boundary and fallback for UI that is not ready yet.

---

### Q7. What is the difference between Server Components and rendering strategy?

Server/Client Components describe component architecture and client capabilities.

Static/Dynamic/Streaming describe how and when UI is produced and delivered.

---

### Q8. Does `"use client"` mean the component only renders in the browser?

No.

It defines a Client Component boundary and enables client-side capabilities such as state, effects, event handlers, and browser APIs.

---

### Q9. Why use streaming?

Streaming can allow ready parts of the UI to reach the browser without waiting for slower sections.

---

### Q10. Why use Suspense?

Suspense lets you define a loading boundary around UI that may take longer to become ready.

---

### Q11. Should every API request use `useEffect`?

No.

First consider whether the data can be fetched on the server. Client-side fetching is appropriate when the requirement is genuinely client-side.

---

### Q12. Can a Server Component render a Client Component?

Yes.

```text
Server Component
       ↓
Client Component
```

This is a normal App Router composition pattern.

---

## 24. Interview Failure Points

Avoid these answers:

```text
❌ "Next.js always uses SSR."

❌ "use client means the component only renders in the browser."

❌ "Static rendering means there is no JavaScript."

❌ "Dynamic rendering means useEffect."

❌ "Streaming means sending JavaScript chunks."

❌ "Hydration means generating HTML."

❌ "Every API request should use useEffect."

❌ "If one button is interactive, the whole page must be Client."

❌ "Server Components cannot render Client Components."

❌ "Static pages can never contain interactive UI."
```

### Better mental model

```text
Component architecture
        ↓
Server / Client

Rendering strategy
        ↓
Static / Dynamic / Streaming

Slow UI
        ↓
Suspense / Streaming

Client interaction
        ↓
Hydration + Client Component
```

---

## 25. Performance Connection

Rendering decisions affect the amount of work performed by the server, browser, and network.

Think:

```text
Large Client boundary
        ↓
More client JavaScript
        ↓
More browser work
```

Prefer:

```text
Server Components
       +
Small Client Components
```

For slow independent content:

```text
Suspense
   +
Streaming
```

can improve the perceived loading experience.

### Do not claim

> "Server Components are always faster."

Actual performance depends on:

- Data fetching
- Caching
- Network
- Bundle size
- Database
- Rendering work
- Component architecture
- Browser work

---

## 26. Rendering Architecture

A useful high-level model:

```text
                         PAGE
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
          Server UI              Client UI
              │                       │
              │                       ├── State
              │                       ├── Events
              │                       └── Browser APIs
              │
              ├── Data
              ├── DB/server resources
              └── Secrets
                          │
                          ▼
                 Rendering Strategy
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
       Static          Dynamic        Streaming
```

This mental model is useful for interviews because it separates the major decisions.

---

## 27. 30-Second Revision

### Rendering

```text
→ Rendering produces UI from React components
→ Static can be prepared ahead of request
→ Dynamic depends on dynamic/request requirements
→ Streaming delivers ready UI progressively
```

### Hydration

```text
→ Browser receives initial UI
→ Client JavaScript loads
→ React attaches interactive behavior
```

### Suspense

```text
→ Defines a loading boundary
→ Useful for slower UI
→ Can work with streaming
```

### Architecture

```text
→ Server by default
→ Client when interaction is required
→ Keep Client boundaries small
→ Fetch server-available data on the server when appropriate
→ Stream slow independent UI when useful
```

---

## 28. Final Interview Answer

> "In Next.js, rendering is the process of turning React components into UI that can be delivered to the user. Depending on the requirements, content can be statically rendered, dynamically rendered, or streamed progressively. I think about rendering separately from the Server/Client Component boundary: Server and Client Components describe component capabilities and where client-side behavior is needed, while static, dynamic, and streaming describe how and when UI is produced and delivered. For interactive areas I use Client Components, and for slow independent sections I can use Suspense and streaming so the user does not necessarily have to wait for the entire page."

---

## 29. Revision Checklist

- [ ] Understand what rendering means
- [ ] Understand server rendering
- [ ] Understand static rendering
- [ ] Understand dynamic rendering
- [ ] Understand client-side rendering
- [ ] Understand hydration
- [ ] Understand streaming
- [ ] Understand Suspense
- [ ] Understand loading UI
- [ ] Understand error boundaries at a high level
- [ ] Understand rendering vs Server/Client Components
- [ ] Understand rendering + data fetching
- [ ] Understand rendering + caching
- [ ] Keep Client boundaries small
- [ ] Know common rendering mistakes
- [ ] Know common interview traps
- [ ] Explain rendering in an interview
- [ ] Design a mixed Server/Client rendering architecture

---

## 30. One-Line Rule

> **Render ahead when you can, render dynamically when you need to, and stream slow UI when it helps the user.**

---

# Quick Interview Cheat Sheet

```text
STATIC
↓
Can prepare ahead of request

DYNAMIC
↓
Depends on dynamic/request requirements

STREAMING
↓
Send ready UI progressively

SUSPENSE
↓
Loading boundary

HYDRATION
↓
Attach client-side React behavior

SERVER COMPONENT
↓
Default
↓
Server-side capabilities

CLIENT COMPONENT
↓
"use client"
↓
State / Events / Browser APIs

BEST GENERAL ARCHITECTURE
↓
Server by default
+
Small Client boundaries
+
Suspense/Streaming for slow independent UI
```

> **One mental model:**
>
> **Server/Client tells you where the component's capabilities live. Static/Dynamic/Streaming tells you when and how the UI is produced and delivered.**
