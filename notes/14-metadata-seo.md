# 14 --- Metadata & SEO

> Next.js App Router --- Metadata API, static metadata, dynamic
> metadata, title templates, descriptions, Open Graph, Twitter cards,
> canonical URLs, robots, sitemap, JSON-LD, favicons, dynamic routes,
> SEO architecture, pitfalls & interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
                     NEXT.JS SEO

                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    Metadata          Crawling         Content
        │                │                │
        ▼                ▼                ▼
 title/description   robots.txt       headings
 Open Graph          sitemap          links
 canonical           indexing         content
 robots
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                  Search Engine
                         │
                         ▼
                     Ranking
```

### Golden Rule

``` text
What does this page represent?
        ↓
What should appear in search?
        ↓
What should appear when shared?
        ↓
Should search engines index it?
        ↓
What is the canonical URL?
        ↓
Can metadata be static or must it be dynamic?
```

------------------------------------------------------------------------

## 2. What Is Metadata?

Metadata is information about a webpage that is usually placed in the
HTML `<head>` rather than displayed as normal page content.

Examples:

``` text
title
description
Open Graph
robots
canonical
icons
keywords
```

Think:

``` text
Page
 ↓
Metadata
 ↓
<head>
 ↓
Search engines / social platforms / browser
```

Metadata helps search engines and other systems understand what a page
represents.

------------------------------------------------------------------------

## 3. Why SEO Matters

SEO means:

``` text
Search Engine Optimization
```

The goal is to make pages easier for search engines to:

``` text
Discover
   ↓
Crawl
   ↓
Understand
   ↓
Index
   ↓
Rank
```

But remember:

``` text
Metadata ≠ guaranteed ranking
```

Good metadata helps describe the page, but metadata alone does not
guarantee a higher ranking.

------------------------------------------------------------------------

## 4. Basic Metadata in Next.js

With the App Router, you can export a `metadata` object.

``` tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our latest products.",
}

export default function ProductsPage() {
  return (
    <main>
      <h1>Products</h1>
    </main>
  )
}
```

Mental model:

``` text
page.tsx
   ↓
metadata
   ↓
Next.js Metadata API
   ↓
<head>
   ↓
<title>
<meta>
<link>
```

------------------------------------------------------------------------

## 5. Static Metadata

Use static metadata when the metadata does not depend on the current
route or fetched data.

``` tsx
export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about our company.",
}
```

Good examples:

``` text
/about
/contact
/pricing
/terms
/privacy
```

### Key idea

``` text
Metadata known ahead of time
        ↓
Static metadata
```

------------------------------------------------------------------------

## 6. Dynamic Metadata

Sometimes metadata depends on data.

Example:

``` text
/products/iphone-17
/products/macbook-pro
/products/airpods
```

Each page needs a different:

``` text
title
description
image
```

For that, use:

``` text
generateMetadata()
```

Example:

``` tsx
import type { Metadata } from "next"

type Props = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params

  const product = await getProduct(slug)

  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  const product = await getProduct(slug)

  return (
    <main>
      <h1>{product.name}</h1>
    </main>
  )
}
```

Mental model:

``` text
URL
 ↓
slug
 ↓
fetch product
 ↓
generateMetadata()
 ↓
title / description / image
```

------------------------------------------------------------------------

## 7. `metadata` vs `generateMetadata`

  `metadata`               `generateMetadata`
  ------------------------ ----------------------
  Static                   Dynamic
  Known ahead of time      Depends on data
  Simple pages             Dynamic routes
  No async data required   Can use fetched data
  Export object            Export function

Think:

``` text
Is metadata fixed?
      │
     Yes
      ↓
metadata
```

Otherwise:

``` text
Depends on route/data?
      │
     Yes
      ↓
generateMetadata()
```

------------------------------------------------------------------------

## 8. Title

The title is one of the most important pieces of metadata.

``` tsx
export const metadata: Metadata = {
  title: "Products",
}
```

Conceptually:

``` html
<title>Products</title>
```

The title is used by:

``` text
Browser tab
Search results
Page identity
Search engine understanding
```

------------------------------------------------------------------------

## 9. Title Template

Suppose your application is:

``` text
MyStore
```

You don't want to repeatedly write:

``` text
Products | MyStore
Users | MyStore
Settings | MyStore
Orders | MyStore
```

You can define a title template.

``` tsx
export const metadata: Metadata = {
  title: {
    template: "%s | MyStore",
    default: "MyStore",
  },
}
```

Then:

``` tsx
export const metadata: Metadata = {
  title: "Products",
}
```

becomes conceptually:

``` text
Products | MyStore
```

Mental model:

``` text
Root Layout
      ↓
title.template
      ↓
Child Page
      ↓
page title
      ↓
Products | MyStore
```

------------------------------------------------------------------------

## 10. Description

Example:

``` tsx
export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore our latest products and find the right solution for you.",
}
```

Think:

``` text
Title
 ↓
What is this page?

Description
 ↓
What is this page about?
```

The description helps describe the page and can affect how a search
result is presented.

------------------------------------------------------------------------

## 11. Open Graph

Open Graph metadata controls how links can appear when shared on
platforms that consume OG metadata.

Typical fields:

``` text
og:title
og:description
og:image
og:url
```

Next.js:

``` tsx
export const metadata: Metadata = {
  title: "Products",
  description: "Browse our products",

  openGraph: {
    title: "Products",
    description: "Browse our products",
    images: ["/products-og.png"],
  },
}
```

Mental model:

``` text
User shares URL
       ↓
Social platform reads metadata
       ↓
Title
Description
Image
       ↓
Rich preview
```

------------------------------------------------------------------------

## 12. Twitter / Social Metadata

You may also define social metadata.

``` tsx
export const metadata: Metadata = {
  title: "Products",

  openGraph: {
    title: "Products",
    description: "Explore our products",
    images: ["/og-image.png"],
  },

  twitter: {
    card: "summary_large_image",
    title: "Products",
    description: "Explore our products",
    images: ["/og-image.png"],
  },
}
```

Think:

``` text
SEO metadata
      +
Social metadata
      ↓
Better representation when shared
```

------------------------------------------------------------------------

## 13. `metadataBase`

When using relative URLs for metadata, configure a base URL.

``` tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),

  title: {
    default: "Example",
    template: "%s | Example",
  },
}
```

Then relative metadata URLs can be resolved against:

``` text
https://example.com
```

Mental model:

``` text
metadataBase
      ↓
Base URL
      ↓
Resolve relative metadata URLs
```

Useful for:

``` text
canonical URLs
Open Graph images
alternate URLs
other absolute metadata URLs
```

------------------------------------------------------------------------

## 14. Canonical URL

A canonical URL tells search engines which URL you consider the
preferred version of a page.

Example:

``` tsx
export const metadata: Metadata = {
  alternates: {
    canonical: "/products",
  },
}
```

With:

``` tsx
metadataBase: new URL("https://example.com")
```

the canonical URL resolves conceptually to:

``` text
https://example.com/products
```

Mental model:

``` text
Multiple URLs
      ↓
Same / similar content
      ↓
Preferred URL
      ↓
Canonical
```

Example:

``` text
/products
/products?sort=price
/products?ref=homepage
```

You may want the main product URL to be canonical.

Important:

``` text
Canonical = recommendation
```

It is not an absolute command that guarantees a search engine will
choose that URL.

------------------------------------------------------------------------

## 15. Robots

Robots metadata controls indexing/crawling instructions at the page
level.

Example:

``` tsx
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}
```

Conceptually:

``` text
index: false
      ↓
Do not index this page

follow: false
      ↓
Do not follow links from this page
```

Useful for pages such as:

``` text
private pages
internal search results
temporary pages
certain filtered pages
```

------------------------------------------------------------------------

## 16. `robots.txt`

`robots.txt` is different from page-level robots metadata.

Mental model:

``` text
robots.txt
     ↓
Crawler-level rules
     ↓
Which paths bots can request/crawl
```

Example:

``` text
User-agent: *
Disallow: /admin/
Disallow: /account/
Allow: /
```

Next.js supports special robots files such as:

``` text
app/robots.ts
```

Important distinction:

``` text
robots.txt
     ≠
<meta name="robots">
```

------------------------------------------------------------------------

## 17. Robots vs Noindex

Very common interview question.

### robots.txt

``` text
Controls crawling/requesting
```

### noindex

``` text
Controls whether a page should be indexed
```

Think:

``` text
robots.txt
     ↓
Can crawler access/request this?

noindex
     ↓
Should this page appear in search results?
```

------------------------------------------------------------------------

## 18. Sitemap

A sitemap gives search engines a list of URLs that belong to your site.

Mental model:

``` text
Website
 │
 ├── /
 ├── /products
 ├── /products/iphone
 ├── /blog
 └── /blog/nextjs
        ↓
     sitemap.xml
        ↓
 Search engine
```

Sitemaps can help crawlers discover URLs, especially on large, new, or
poorly interconnected sites.

------------------------------------------------------------------------

## 19. Dynamic Sitemap

For dynamic applications, sitemap entries can be generated from data.

Conceptually:

``` tsx
export default async function sitemap() {
  const products = await getProducts()

  return [
    {
      url: "https://example.com",
      lastModified: new Date(),
    },

    ...products.map((product) => ({
      url: `https://example.com/products/${product.slug}`,
      lastModified: product.updatedAt,
    })),
  ]
}
```

Mental model:

``` text
Database
   ↓
Products
   ↓
Generate sitemap
   ↓
Search engine discovery
```

------------------------------------------------------------------------

## 20. JSON-LD / Structured Data

Structured data provides additional machine-readable information about
the page.

A common format is:

``` text
JSON-LD
```

Example:

``` tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  image: product.image,
}
```

Then:

``` tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd),
  }}
/>
```

Mental model:

``` text
Normal HTML
     ↓
Human-readable content

JSON-LD
     ↓
Machine-readable structured information
     ↓
Search engines
```

------------------------------------------------------------------------

## 21. Product Structured Data

For an e-commerce application:

``` text
Product
 ├── name
 ├── image
 ├── description
 ├── price
 ├── availability
 ├── brand
 └── rating
```

Example:

``` tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  image: [product.image],
  description: product.description,
  offers: {
    "@type": "Offer",
    price: product.price,
    priceCurrency: "USD",
  },
}
```

Important:

``` text
Structured data
≠
Guaranteed rich result
```

------------------------------------------------------------------------

## 22. Dynamic Route + Metadata

This is a very important real-world pattern.

Suppose:

``` text
app/
└── blog/
    └── [slug]/
        └── page.tsx
```

URL:

``` text
/blog/nextjs-rendering
```

You fetch:

``` text
slug
 ↓
database
 ↓
blog post
```

Then:

``` text
blog.title
      ↓
generateMetadata()
      ↓
<title>
description
Open Graph
canonical
```

Architecture:

``` text
                 /blog/[slug]

                      │
             ┌────────┴────────┐
             ▼                 ▼
       generateMetadata      Page
             │                 │
             ▼                 ▼
       Blog data            Blog data
             │                 │
             ▼                 ▼
      SEO metadata         UI content
```

------------------------------------------------------------------------

## 23. Metadata + Data Fetching

Suppose:

``` tsx
export async function generateMetadata() {
  const product = await getProduct()

  return {
    title: product.name,
  }
}
```

and the page also fetches:

``` tsx
const product = await getProduct()
```

You should think about:

``` text
Metadata needs data
       +
Page needs same data
```

Then consider how your data-fetching/caching strategy avoids unnecessary
work.

Mental model:

``` text
Route
 │
 ├── Metadata
 │      ↓
 │    Data
 │
 └── UI
        ↓
      Data
```

------------------------------------------------------------------------

## 24. Metadata + Rendering

Metadata participates in the overall rendering architecture.

Think:

``` text
Route
 │
 ├── UI
 │
 └── Metadata
        │
        ├── Static
        │
        └── Dynamic
```

For a static page:

``` text
Static page
     ↓
Static metadata
```

For a product page:

``` text
Dynamic product
     ↓
generateMetadata()
     ↓
Dynamic SEO information
```

Don't confuse:

``` text
Dynamic metadata
```

with:

``` text
Client-side useEffect
```

------------------------------------------------------------------------

## 25. Metadata Files

Common Next.js metadata files include:

``` text
favicon.ico
icon.jpg
icon.png
apple-icon.jpg

opengraph-image.jpg
twitter-image.jpg

robots.txt
sitemap.xml
```

Example structure:

``` text
app/
 │
 ├── layout.tsx
 ├── page.tsx
 │
 ├── favicon.ico
 ├── opengraph-image.jpg
 ├── robots.ts
 └── sitemap.ts
```

------------------------------------------------------------------------

## 26. Favicon

A favicon is the small icon associated with the website/browser tab.

Example:

``` text
app/favicon.ico
```

Mental model:

``` text
favicon
   ↓
Browser tab / bookmark / browser UI
```

It is not a major SEO ranking technique, but it is part of professional
site metadata and branding.

------------------------------------------------------------------------

## 27. Metadata Architecture

A good application can have:

``` text
Root Layout
 │
 ├── Global title
 ├── Global description
 ├── metadataBase
 ├── default OG
 │
 └── Pages
      │
      ├── Home
      ├── Products
      ├── Product/[slug]
      ├── Blog
      └── Blog/[slug]
```

Example:

``` text
Root
 ↓
Default metadata

Product page
 ↓
Product-specific title
 ↓
Product-specific description
 ↓
Product OG image

Blog page
 ↓
Blog-specific title
 ↓
Blog-specific description
 ↓
Blog OG image
```

------------------------------------------------------------------------

## 28. SEO Architecture for E-Commerce

Imagine:

``` text
E-commerce
│
├── /
├── /products
├── /products/[slug]
├── /categories/[slug]
├── /cart
├── /account
└── /search
```

Possible strategy:

``` text
/
 ↓
index

/products
 ↓
index

/products/[slug]
 ↓
index

/categories/[slug]
 ↓
index

/cart
 ↓
noindex

/account
 ↓
noindex

/internal-search
 ↓
usually noindex
```

The exact SEO policy depends on the business requirements.

Important engineering principle:

``` text
Not every URL should necessarily be a search landing page.
```

------------------------------------------------------------------------

## 29. SEO Architecture for Blog

``` text
/blog
   ↓
index

/blog/[slug]
   ↓
index

/blog/category/[slug]
   ↓
index if useful

/blog/search
   ↓
usually noindex
```

For a blog post:

``` text
title
description
canonical
OG image
published information
structured data where appropriate
```

------------------------------------------------------------------------

## 30. SEO + Headings

Metadata alone is not SEO.

Page structure matters.

``` text
<h1>
   Main page topic
</h1>

<h2>
   Section
</h2>

<h3>
   Subsection
</h3>
```

Think:

``` text
Metadata
     +
Actual page content
     +
Headings
     +
Internal links
     +
Technical SEO
```

------------------------------------------------------------------------

## 31. SEO + Internal Links

Search engines discover pages through links.

Example:

``` tsx
import Link from "next/link"

<Link href="/products">
  View products
</Link>
```

Think:

``` text
Home
 ↓
Products
 ↓
Product
 ↓
Related Products
```

Good internal linking helps:

``` text
Discovery
Navigation
Site structure
Context
```

------------------------------------------------------------------------

## 32. SEO + URL Structure

Prefer meaningful URLs:

``` text
/products/iphone-17
/blog/nextjs-rendering
```

over:

``` text
/page?id=18372
/content/a8f93
```

Mental model:

``` text
Readable URL
      ↓
User understands it
      +
Search engine understands context
```

Keep URLs:

``` text
clear
stable
meaningful
```

------------------------------------------------------------------------

## 33. SEO Decision Tree

``` text
Does this page need to appear in search?
        │
       No
        ↓
     noindex
```

If yes:

``` text
Does metadata depend on page data?
        │
       No
        ↓
static metadata
```

If yes:

``` text
generateMetadata()
```

Then:

``` text
Can the page have multiple URL variants?
        │
       Yes
        ↓
consider canonical
```

Then:

``` text
Does the site need URL discovery?
        │
       Yes
        ↓
sitemap
```

Then:

``` text
Do crawlers need path-level crawl rules?
        │
       Yes
        ↓
robots.txt
```

Then:

``` text
Does the content have a useful schema?
        │
       Yes
        ↓
JSON-LD / structured data
```

------------------------------------------------------------------------

## 34. Common Mistakes

### Mistake 1 --- Putting everything in `useEffect`

❌

``` tsx
"use client"

useEffect(() => {
  document.title = product.name
}, [])
```

Prefer Next.js metadata APIs for basic page metadata.

------------------------------------------------------------------------

### Mistake 2 --- Using the same title everywhere

❌

``` text
MyStore
MyStore
MyStore
MyStore
```

Better:

``` text
Home | MyStore
Products | MyStore
iPhone 17 | MyStore
About | MyStore
```

Use title templates where appropriate.

------------------------------------------------------------------------

### Mistake 3 --- Confusing robots.txt with noindex

❌

``` text
robots.txt = don't show in Google
```

Remember:

``` text
robots.txt
 ↓
Crawler access/request rules

noindex
 ↓
Indexing directive
```

------------------------------------------------------------------------

### Mistake 4 --- Thinking canonical guarantees ranking

❌

``` text
canonical = Google must use this URL
```

Better:

``` text
canonical
 ↓
Preferred URL recommendation
```

------------------------------------------------------------------------

### Mistake 5 --- Thinking Open Graph improves Google ranking

❌

``` text
og:image
 ↓
higher Google ranking
```

Better:

``` text
Open Graph
 ↓
Better social/share preview
```

------------------------------------------------------------------------

### Mistake 6 --- Adding JSON-LD without matching page content

Don't generate fake structured data.

``` text
Page says:
$50

JSON-LD says:
$20
```

Bad.

Think:

``` text
Visible content
      +
Structured data
      ↓
Should represent the same reality
```

------------------------------------------------------------------------

### Mistake 7 --- Indexing Everything

Don't automatically expose every utility URL to search engines.

Examples:

``` text
/search?q=abc
/cart
/account
/settings
/filter?price=...
```

Decide intentionally:

``` text
Which URLs are search landing pages?
Which URLs are utility/private pages?
```

------------------------------------------------------------------------

### Mistake 8 --- Forgetting Dynamic Metadata

For:

``` text
/products/[slug]
```

don't use the same generic title for every product.

Use:

``` text
generateMetadata()
```

------------------------------------------------------------------------

## 35. Real-World Example --- Product Page

Requirement:

``` text
Product
├── Name
├── Description
├── Price
├── Image
├── Reviews
└── SEO
```

Architecture:

``` text
/products/[slug]
       │
       ├── Product Data
       │
       ├── Page UI
       │
       ├── generateMetadata()
       │      ├── title
       │      ├── description
       │      ├── canonical
       │      └── OG image
       │
       └── JSON-LD
              ↓
           Product schema
```

This combines:

``` text
Dynamic routing
+
Data fetching
+
Metadata
+
SEO
+
Structured data
```

------------------------------------------------------------------------

## 36. Real-World Example --- Blog

``` text
/blog/[slug]
```

Data:

``` text
post.title
post.description
post.image
post.slug
post.updatedAt
```

Metadata:

``` tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug)

  return {
    title: post.title,
    description: post.description,

    openGraph: {
      title: post.title,
      description: post.description,
      images: [post.image],
    },

    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  }
}
```

Mental model:

``` text
Blog database
      ↓
Dynamic route
      ↓
generateMetadata
      ↓
SEO metadata
      +
Page content
```

------------------------------------------------------------------------

## 37. Real-World Example --- Private Dashboard

Suppose:

``` text
/dashboard
```

is private.

You usually don't want it to be a public search landing page.

Conceptually:

``` text
Dashboard
   ↓
Authentication
   ↓
Private content
   ↓
noindex
```

Possible metadata:

``` tsx
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}
```

------------------------------------------------------------------------

## 38. Interview Questions

### Q1. What is metadata in Next.js?

Metadata is information about a page such as its title, description,
social preview information, robots directives, and other head-related
information.

### Q2. How do you add static metadata?

``` tsx
export const metadata: Metadata = {
  title: "Products",
  description: "Browse products",
}
```

### Q3. How do you add dynamic metadata?

Use:

``` text
generateMetadata()
```

when metadata depends on route parameters or fetched data.

### Q4. What is the difference between `metadata` and `generateMetadata`?

``` text
metadata
 ↓
static metadata

generateMetadata()
 ↓
dynamic metadata
```

### Q5. What is Open Graph?

Open Graph is metadata used to describe how a URL can be represented
when shared on social platforms and other systems that consume OG
metadata.

### Q6. What is a canonical URL?

A canonical URL identifies the preferred URL for a page when multiple
URLs can represent similar content.

### Q7. Does canonical guarantee that Google will use that URL?

No. It is a recommendation, not an absolute command.

### Q8. What is `robots.txt`?

It provides crawler instructions about which paths/files crawlers can
request.

### Q9. What is `noindex`?

It tells search engines not to index a page.

### Q10. What is the difference between robots.txt and noindex?

``` text
robots.txt
 ↓
Crawler access/request rules

noindex
 ↓
Indexing directive
```

### Q11. What is a sitemap?

A sitemap provides search engines with URLs belonging to your site and
can help them discover those URLs efficiently.

### Q12. What is JSON-LD?

JSON-LD is a JSON-based format commonly used to provide structured data
about page content to search engines.

### Q13. Why use JSON-LD?

To provide machine-readable structured information such as:

``` text
Product
Article
Organization
Breadcrumb
```

### Q14. What is `metadataBase`?

It provides the base URL used to resolve relative metadata URLs.

### Q15. Can metadata be defined in layouts?

Yes. Metadata in layouts can be inherited by child routes, while child
metadata can provide route-specific values.

### Q16. Should every page be indexed?

No. Private, utility, internal-search, or otherwise unsuitable pages may
need different indexing policies.

### Q17. Does Open Graph directly improve SEO ranking?

No. Its main purpose is richer sharing/social presentation.

### Q18. Why is dynamic metadata important?

Because pages such as:

``` text
/products/[slug]
/blog/[slug]
```

have metadata that depends on the actual content being displayed.

------------------------------------------------------------------------

## 39. Interview Failure Points

Avoid these answers:

``` text
❌ "Metadata is only for Google."

❌ "useEffect is the best way to set SEO metadata."

❌ "robots.txt prevents a page from being indexed."

❌ "canonical forces Google to choose the URL."

❌ "Open Graph improves Google ranking."

❌ "Every page should be indexed."

❌ "Every dynamic route can use the same title."

❌ "JSON-LD is visible page content."

❌ "Sitemap contains the entire website content."

❌ "Adding metadata guarantees good SEO."
```

### Better mental model

``` text
Metadata
 ↓
Describe page

robots
 ↓
Crawler/indexing instructions

canonical
 ↓
Preferred URL

sitemap
 ↓
URL discovery

Open Graph
 ↓
Sharing preview

JSON-LD
 ↓
Structured information

Content + headings + links
 ↓
Actual page context
```

------------------------------------------------------------------------

## 40. Performance Connection

SEO is not only about metadata.

Think:

``` text
SEO
 │
 ├── Metadata
 ├── Crawlability
 ├── Indexability
 ├── Content
 ├── Links
 ├── Rendering
 ├── Performance
 └── Accessibility
```

A technically perfect title and description don't fix:

``` text
Bad content
Broken links
Slow pages
Poor URLs
Blocked crawlers
Incorrect canonical
Bad page structure
```

So:

``` text
SEO = Technical SEO + Good Content Structure + Good UX
```

------------------------------------------------------------------------

## 41. SEO Architecture --- 2 Year Developer Level

For a real production project:

``` text
                         WEBSITE
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
       Metadata           Crawl            Content
          │                 │                 │
     title/desc          robots            H1/H2
     Open Graph          sitemap           links
     canonical           status            content
     robots              redirects
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                      Search Engines
                            │
                            ▼
                     Discover / Index
```

And:

``` text
Dynamic route
      ↓
Fetch content
      ↓
generateMetadata()
      ↓
Page-specific SEO
```

------------------------------------------------------------------------

## 42. 30-Second Revision

### Metadata

``` text
→ Describes the page
→ title
→ description
→ Open Graph
→ robots
→ canonical
```

### Dynamic Metadata

``` text
→ generateMetadata()
→ Useful for dynamic routes
→ Can depend on fetched data
```

### Crawling

``` text
→ robots.txt
→ sitemap
```

### Indexing

``` text
→ robots metadata
→ noindex
→ canonical
```

### Social Sharing

``` text
→ Open Graph
→ Twitter metadata
```

### Structured Data

``` text
→ JSON-LD
→ Schema.org
→ Machine-readable page information
```

------------------------------------------------------------------------

## 43. Final Interview Answer

> "In Next.js App Router, I use the Metadata API to define page metadata
> such as title, description, Open Graph information, robots directives,
> and canonical URLs. For static pages I can export a metadata object,
> while for dynamic routes such as products or blog posts I use
> `generateMetadata()` so the metadata can be generated from the actual
> route data. I also think about technical SEO separately: robots.txt
> controls crawler access, sitemaps help search engines discover URLs,
> canonical URLs communicate the preferred URL, and JSON-LD can provide
> structured information. I don't treat metadata as the entire SEO
> strategy --- page content, headings, internal links, crawlability,
> rendering and performance also matter."

------------------------------------------------------------------------

## 44. Revision Checklist

``` text
- [ ] Understand what metadata is
- [ ] Understand Metadata API
- [ ] Know static metadata
- [ ] Know generateMetadata()
- [ ] Understand metadata inheritance
- [ ] Understand title templates
- [ ] Understand metadataBase
- [ ] Know description
- [ ] Know Open Graph
- [ ] Know Twitter metadata
- [ ] Know canonical URLs
- [ ] Know robots metadata
- [ ] Know robots.txt
- [ ] Understand robots.txt vs noindex
- [ ] Understand sitemap
- [ ] Know dynamic sitemap
- [ ] Understand JSON-LD
- [ ] Understand structured data
- [ ] Know dynamic-route SEO
- [ ] Know metadata + data fetching
- [ ] Know common SEO mistakes
- [ ] Explain SEO architecture in an interview
- [ ] Design SEO for an e-commerce/blog application
```

------------------------------------------------------------------------

## 45. One-Line Rule

> **Describe the page correctly, make the right URLs discoverable,
> control what should be indexed, and generate metadata from the actual
> content.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
METADATA
↓
Describe the page

TITLE
↓
Page identity

DESCRIPTION
↓
Page summary

OPEN GRAPH
↓
Social/share preview

CANONICAL
↓
Preferred URL

ROBOTS
↓
Index/follow instructions

ROBOTS.TXT
↓
Crawler access rules

SITEMAP
↓
URL discovery

JSON-LD
↓
Structured data

generateMetadata()
↓
Dynamic SEO metadata

metadataBase
↓
Base URL for metadata URLs
```

### BEST GENERAL ARCHITECTURE

``` text
Root Layout
    ↓
Global metadata
    +
title template
    +
metadataBase
    ↓
Page
    ↓
Static metadata
OR
generateMetadata()
    ↓
Page-specific SEO

+

robots.txt
+
sitemap
+
canonical
+
Open Graph
+
JSON-LD where appropriate
```

> **One mental model:**
>
> **Metadata tells systems what the page is. Robots and canonical help
> control crawling/indexing signals. Sitemap helps discovery. Open Graph
> controls sharing presentation. JSON-LD provides structured
> information.**
