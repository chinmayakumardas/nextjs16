# 06 — Search, Filters & Pagination

## What are Search Parameters?

Search parameters are values stored after `?` in a URL.

Example:

```text
/articles?query=nextjs
```

Here:

```text
query=nextjs
```

is a search parameter.

Multiple parameters can be combined:

```text
/articles?query=nextjs&category=react&page=2
```

Search parameters are useful for representing UI state in the URL.

---

## 1. Why Put Search State in the URL?

Consider a search page:

```text
/articles
```

The user searches:

```text
nextjs
```

Instead of keeping the value only in React state, the URL can become:

```text
/articles?query=nextjs
```

This provides several benefits:

* The URL can be shared.
* Refreshing preserves the search.
* Browser Back/Forward works naturally.
* The current search state is visible in the URL.

---

## 2. Reading Search Parameters

In a Server Component, `searchParams` can be used to read URL query parameters.

```tsx
type Props = {
  searchParams: Promise<{
    query?: string
  }>
}

export default async function ArticlesPage({ searchParams }: Props) {
  const { query } = await searchParams

  return <h1>Search: {query}</h1>
}
```

For:

```text
/articles?query=react
```

the value is:

```text
query = "react"
```

---

## 3. Multiple Search Parameters

A page can read multiple values.

```text
/articles?query=react&category=frontend&page=2
```

Example:

```tsx
const { query, category, page } = await searchParams
```

The application can use these values to determine what should be displayed.

---

## 4. Search

Imagine an article website.

The user types:

```text
server components
```

The URL becomes:

```text
/articles?query=server+components
```

The application can then use the query to find matching articles.

Conceptually:

```text
User Input
    │
    ▼
URL Search Parameter
    │
    ▼
Read query
    │
    ▼
Filter / Fetch Results
    │
    ▼
Render Results
```

---

## 5. Search Input

A search input can be a Client Component because it needs browser interaction.

```tsx
"use client"

import { useSearchParams, useRouter } from "next/navigation"

export default function SearchBox() {
  const searchParams = useSearchParams()
  const router = useRouter()

  function handleSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set("query", value)
    } else {
      params.delete("query")
    }

    router.push(`/articles?${params.toString()}`)
  }

  return (
    <input
      placeholder="Search articles..."
      onChange={(event) => handleSearch(event.target.value)}
    />
  )
}
```

The important concept is that the **URL becomes the source of truth for the search state**.

---

## 6. Filters

Filters narrow down the displayed results.

For an article website, filters could include:

```text
Category
Author
Date
Difficulty
```

Example:

```text
/articles?category=javascript
```

Multiple filters:

```text
/articles?category=javascript&difficulty=beginner
```

---

## 7. Combining Search and Filters

Search and filters can work together.

Example:

```text
/articles?query=server&category=nextjs
```

The application should display articles that match the required conditions.

Conceptually:

```text
All Articles
     │
     ▼
Search
     │
     ▼
Category Filter
     │
     ▼
Other Filters
     │
     ▼
Results
```

---

## 8. Preserving Existing Parameters

One common mistake is accidentally removing existing parameters.

Suppose the current URL is:

```text
/articles?query=server&category=nextjs
```

The user changes the page.

You should produce:

```text
/articles?query=server&category=nextjs&page=2
```

Not:

```text
/articles?page=2
```

The existing search and filters should remain.

---

## 9. `URLSearchParams`

`URLSearchParams` makes query-string manipulation easier.

```tsx
const params = new URLSearchParams()

params.set("query", "react")
params.set("category", "frontend")
params.set("page", "2")
```

Result:

```text
query=react&category=frontend&page=2
```

---

## 10. Updating a Parameter

Use:

```tsx
params.set("page", "2")
```

If the parameter already exists, its value is replaced.

---

## 11. Removing a Parameter

Use:

```tsx
params.delete("category")
```

This is useful when a filter is cleared.

---

## 12. Sorting

Sorting can also be represented in the URL.

Example:

```text
/articles?sort=newest
```

Or:

```text
/articles?sort=oldest
```

Multiple parameters can still be combined:

```text
/articles?query=react&category=frontend&sort=newest
```

The URL now describes the complete result state.

---

## 13. Pagination

Pagination divides a large result set into smaller pages.

For example:

```text
Page 1 → Articles 1–10
Page 2 → Articles 11–20
Page 3 → Articles 21–30
```

The current page can be stored in the URL:

```text
/articles?page=2
```

---

## 14. Pagination with Filters

Pagination becomes more useful when combined with search and filters.

Example:

```text
/articles?query=react&category=frontend&page=3
```

This means:

```text
query    → react
category → frontend
page     → 3
```

The application can reproduce the same result state from the URL.

---

## 15. Previous and Next

A simple pagination structure might be:

```text
← Previous    Page 3    Next →
```

The Previous button might navigate to:

```text
/articles?page=2
```

The Next button:

```text
/articles?page=4
```

When filters exist, preserve them:

```text
/articles?query=react&category=frontend&page=4
```

---

## 16. Disable Invalid Pagination

The application should prevent invalid navigation.

For example:

```text
Page 1
```

should not have an active Previous button.

Similarly, on the final page:

```text
Page 5
```

the Next button should be disabled or removed.

---

## 17. Pagination Calculation

Suppose:

```text
Total items = 47
Items per page = 10
```

The number of pages is:

```text
Math.ceil(47 / 10)
```

Result:

```text
5 pages
```

For page 3:

```text
start = (3 - 1) * 10
```

```text
start = 20
```

So page 3 contains items beginning at index 20.

---

## 18. Search + Filter + Sort + Pagination

A complete URL might look like:

```text
/articles?query=server&category=nextjs&sort=newest&page=2
```

The application can interpret it as:

```text
query
  ↓
Search articles

category
  ↓
Filter articles

sort
  ↓
Sort results

page
  ↓
Select current page
```

The overall flow becomes:

```text
URL
 │
 ├── query
 ├── category
 ├── sort
 └── page
       │
       ▼
Search
       │
       ▼
Filter
       │
       ▼
Sort
       │
       ▼
Paginate
       │
       ▼
Render Results
```

---

## 19. Empty Results

Search and filters may produce no results.

Example:

```text
/articles?query=xyz
```

Instead of showing an empty page, render an empty state:

```text
No articles found.

Try changing your search or filters.
```

This is an example of conditional rendering based on the result.

---

## 20. Reset Filters

A reset button should remove the search and filter parameters.

For example:

```text
/articles?query=react&category=frontend&page=3
```

becomes:

```text
/articles
```

The result returns to the default state.

---

## 21. Search Parameters vs React State

Not every piece of state needs to be stored in the URL.

### Good candidates for URL state

```text
search
filter
sort
page
```

These describe the current result set and are useful to preserve/share.

### Good candidates for local state

```text
modalOpen
dropdownOpen
menuOpen
temporaryInput
```

These are usually UI-only states.

A useful rule is:

> **If the value should survive refresh and be shareable through the URL, consider using a search parameter.**

---

## 22. Server Rendering with Search Parameters

Search parameters can determine what a Server Component renders.

```tsx
export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string
  }>
}) {
  const { query } = await searchParams

  const articles = await getArticles(query)

  return (
    <div>
      {articles.map((article) => (
        <article key={article.id}>
          {article.title}
        </article>
      ))}
    </div>
  )
}
```

The URL controls the requested result:

```text
/articles
```

or:

```text
/articles?query=react
```

---

## 23. Important URL Design

Prefer meaningful parameter names.

Good:

```text
/articles?query=react&category=frontend&page=2
```

Avoid unclear names such as:

```text
/articles?a=x&b=y&c=2
```

A URL should communicate what state it represents.

---

## 24. Common Mistakes

### Losing existing parameters

Bad:

```tsx
router.push(`/articles?page=${page}`)
```

when search/filter parameters already exist.

Better:

```tsx
const params = new URLSearchParams(searchParams)
params.set("page", String(page))

router.push(`/articles?${params.toString()}`)
```

### Resetting pagination incorrectly

If a user changes a filter, page 5 may no longer be valid.

When changing filters, consider resetting:

```text
page=1
```

### Keeping everything in React state

If search, filters, and pagination are only stored in state, refreshing the page may lose the current result state.

---

## Search, Filter & Pagination Mental Model

Think of the URL as describing the current result set:

```text
URL
 │
 ├── Search
 ├── Filters
 ├── Sorting
 └── Page
       │
       ▼
   Result Query
       │
       ▼
    Results
       │
       ▼
   Pagination
```

The important idea is:

> **Search, filters, sorting, and pagination should work together as one URL-driven result state.**
