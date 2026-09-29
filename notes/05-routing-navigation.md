# 05 — Routing & Navigation

## What is Routing?

Routing decides **which UI should be displayed for a particular URL**.

For example:

```text
/
/about
/contact
/blog
/blog/hello-world
```

Each URL can represent a different page.

In Next.js App Router, routes are created using folders and files inside the `app` directory.

---

## 1. Basic Routes

A folder with a `page.tsx` file creates a route.

```text
app/
├── page.tsx
├── about/
│   └── page.tsx
└── contact/
    └── page.tsx
```

This creates:

```text
/
/about
/contact
```

### Example

```tsx
// app/about/page.tsx

export default function AboutPage() {
  return <h1>About Us</h1>
}
```

Opening:

```text
/about
```

renders the `AboutPage`.

---

## 2. The Home Route

The root `page.tsx` represents `/`.

```tsx
// app/page.tsx

export default function HomePage() {
  return <h1>Welcome to My Website</h1>
}
```

Route:

```text
/
```

---

## 3. Navigation with Link

For internal navigation, use Next.js `Link`.

```tsx
import Link from "next/link"

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/contact">Contact</Link>
    </nav>
  )
}
```

### Why use `Link`?

Instead of:

```html
<a href="/about">About</a>
```

use:

```tsx
<Link href="/about">About</Link>
```

`Link` provides client-side navigation and works with Next.js routing features.

---

## 4. Dynamic Routes

Sometimes the URL contains a value that changes.

For example:

```text
/blog/hello-world
/blog/nextjs-routing
/blog/server-components
```

Creating separate folders for every blog post would not be practical.

Use a dynamic route.

```text
app/
└── blog/
    └── [slug]/
        └── page.tsx
```

The `[slug]` segment is dynamic.

---

## 5. Reading Dynamic Parameters

A dynamic route receives its parameters.

```tsx
type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function BlogPage({ params }: Props) {
  const { slug } = await params

  return <h1>Post: {slug}</h1>
}
```

For:

```text
/blog/nextjs-routing
```

the value is:

```text
slug = "nextjs-routing"
```

---

## 6. Multiple Dynamic Parameters

Routes can contain multiple dynamic segments.

```text
app/
└── store/
    └── [category]/
        └── [item]/
            └── page.tsx
```

This can represent:

```text
/store/books/clean-code
/store/movies/inception
/store/games/minecraft
```

The parameters might be:

```tsx
params.category
params.item
```

---

## 7. Nested Routes

Routes can be nested using folders.

```text
app/
└── account/
    ├── page.tsx
    ├── profile/
    │   └── page.tsx
    └── settings/
        └── page.tsx
```

Routes:

```text
/account
/account/profile
/account/settings
```

Nested routing is useful when pages belong to the same section.

---

## 8. Layouts

A layout allows multiple routes to share UI.

```text
app/
└── dashboard/
    ├── layout.tsx
    ├── page.tsx
    ├── profile/
    │   └── page.tsx
    └── settings/
        └── page.tsx
```

Example:

```tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <header>Dashboard</header>

      <main>{children}</main>
    </div>
  )
}
```

The header can remain visible while navigating between:

```text
/dashboard
/dashboard/profile
/dashboard/settings
```

---

## 9. `children` in Layouts

The `children` prop represents the page or nested layout being rendered.

```tsx
<main>
  {children}
</main>
```

For example:

```text
Dashboard Layout
       │
       └── children
             │
             ├── Dashboard Page
             ├── Profile Page
             └── Settings Page
```

---

## 10. Navigation from Buttons

Sometimes navigation happens after an action.

For this, use programmatic navigation.

```tsx
"use client"

import { useRouter } from "next/navigation"

export default function StartButton() {
  const router = useRouter()

  function handleClick() {
    router.push("/dashboard")
  }

  return (
    <button onClick={handleClick}>
      Start
    </button>
  )
}
```

Use `Link` when the user is simply navigating to another page.

Use `router.push()` when navigation happens as part of an interaction or action.

---

## 11. `router.push()`

Moves the user to another route.

```tsx
router.push("/profile")
```

Example:

```tsx
function handleLogin() {
  // login logic

  router.push("/dashboard")
}
```

---

## 12. `router.replace()`

`replace()` navigates without adding a new entry to the browser history.

```tsx
router.replace("/dashboard")
```

This can be useful after flows where the user should not return to the previous URL using the Back button.

---

## 13. Going Back

Use:

```tsx
router.back()
```

Example:

```tsx
<button onClick={() => router.back()}>
  Go Back
</button>
```

---

## 14. Not Found Pages

Sometimes a route exists but the requested resource does not.

For example:

```text
/blog/does-not-exist
```

You can create:

```text
app/
└── not-found.tsx
```

```tsx
export default function NotFound() {
  return (
    <div>
      <h1>Page Not Found</h1>
      <p>The page you requested does not exist.</p>
    </div>
  )
}
```

For resource-specific not-found handling, you can use `notFound()`.

```tsx
import { notFound } from "next/navigation"

if (!post) {
  notFound()
}
```

---

## 15. Redirects

Sometimes an old URL should send the user to a new URL.

```tsx
import { redirect } from "next/navigation"

export default function OldPage() {
  redirect("/new-page")
}
```

Example:

```text
/old-profile
      ↓
/profile
```

Redirects are useful when routes change or when access conditions require navigation elsewhere.

---

## 16. Route Groups

Route groups allow you to organize routes without adding the folder name to the URL.

Use parentheses:

```text
app/
├── (marketing)/
│   ├── page.tsx
│   └── pricing/
│       └── page.tsx
│
└── (dashboard)/
    └── dashboard/
        └── page.tsx
```

The `(marketing)` and `(dashboard)` folders do not appear in the URL.

For example:

```text
(marketing)/pricing
```

becomes:

```text
/pricing
```

---

## 17. Parallel Route Concepts

Large applications sometimes need multiple UI sections rendered alongside each other.

Next.js supports parallel routes using named slots.

Conceptually:

```text
dashboard
├── @analytics
├── @activity
└── page.tsx
```

This is useful for complex dashboards where different sections have independent rendering behavior.

Do not use parallel routes unless the application actually benefits from this structure.

---

## 18. Routing Best Practices

### Use `Link` for normal navigation

```tsx
<Link href="/about">About</Link>
```

### Use `router.push()` for action-based navigation

```tsx
router.push("/checkout")
```

### Keep route structure predictable

```text
/blog
/blog/[slug]
```

is easier to understand than deeply complicated route structures.

### Use dynamic routes when the URL represents a resource

```text
/users/[id]
/posts/[slug]
/courses/[courseId]
```

### Use layouts for shared UI

```text
dashboard/
├── layout.tsx
├── page.tsx
└── settings/
```

---

## Routing Mental Model

Think of routing as:

```text
URL
 │
 ▼
Route
 │
 ├── Static Segment
 ├── Dynamic Segment
 ├── Nested Segment
 │
 ▼
Layout
 │
 ▼
Page
 │
 ▼
Rendered UI
```

The important idea is:

> **The URL determines which route and UI should be rendered.**
