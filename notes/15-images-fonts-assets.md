# 15 --- Images, Fonts & Assets

> Next.js App Router --- `next/image`, image optimization, responsive
> images, remote images, `next/font`, local fonts, static assets,
> `public/`, imports, caching, performance, accessibility, common
> mistakes & interview revision.

------------------------------------------------------------------------

## 1. Mental Model

``` text
                ASSETS IN NEXT.JS

                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
     Images           Fonts           Files
       │               │               │
       ▼               ▼               ▼
  next/image        next/font        public/
       │               │               │
       ▼               ▼               ▼
Optimization       Font loading      Static URLs
Responsive         Performance       Favicons
Accessibility      Layout shift      robots/sitemap
```

Think:

``` text
Image
 ↓
Optimize + resize + lazy load + accessibility

Font
 ↓
Optimize + preload when appropriate + reduce layout shift

Static asset
 ↓
Serve from the right place
```

------------------------------------------------------------------------

# 2. Why Images, Fonts & Assets Matter

Images and fonts can have a large effect on:

``` text
Performance
Core Web Vitals
Layout stability
Bandwidth
Accessibility
User experience
```

A page can be functionally correct but still slow because of:

``` text
Huge images
Too many images
Unoptimized fonts
Large client-side assets
Poor loading strategy
```

------------------------------------------------------------------------

# 3. `next/image`

Next.js provides the `Image` component:

``` tsx
import Image from "next/image"

export default function Profile() {
  return (
    <Image
      src="/profile.jpg"
      alt="Profile"
      width={500}
      height={500}
    />
  )
}
```

Mental model:

``` text
<Image />
   ↓
Next.js image optimization
   ↓
Appropriate image delivery
```

Instead of simply:

``` html
<img>
```

you can use:

``` tsx
<Image />
```

for Next.js-aware image optimization.

------------------------------------------------------------------------

# 4. Why Use `next/image`?

The Image component can help with:

``` text
Image optimization
Responsive images
Lazy loading
Image sizing
Modern formats
Layout stability
```

Think:

``` text
Raw image
   ↓
Browser downloads potentially large file

<Image />
   ↓
Next.js can optimize delivery
```

------------------------------------------------------------------------

# 5. Local Images

Suppose:

``` text
app/
├── page.tsx
└── images/
    └── hero.png
```

You can import the image:

``` tsx
import Image from "next/image"
import hero from "./images/hero.png"

export default function Home() {
  return (
    <Image
      src={hero}
      alt="Hero"
    />
  )
}
```

With a static import, Next.js can know image information such as:

``` text
width
height
blur placeholder information
```

when available.

------------------------------------------------------------------------

# 6. Image from `public/`

Suppose:

``` text
public/
└── logo.png
```

Then:

``` tsx
import Image from "next/image"

export default function Header() {
  return (
    <Image
      src="/logo.png"
      alt="Company logo"
      width={200}
      height={50}
    />
  )
}
```

Important:

``` text
public/logo.png
       ↓
/logo.png
```

The `public` directory maps to the root URL.

------------------------------------------------------------------------

# 7. `public/` Mental Model

``` text
public/
│
├── logo.png
├── favicon.ico
├── robots.txt
└── images/
    └── banner.jpg
```

URLs:

``` text
/logo.png
/favicon.ico
/robots.txt
/images/banner.jpg
```

Think:

``` text
public/
   ↓
Directly accessible static files
```

------------------------------------------------------------------------

# 8. Import vs `public/`

Two common approaches:

### Static import

``` tsx
import hero from "./hero.png"

<Image src={hero} alt="Hero" />
```

Good when:

``` text
Image belongs to component/module
You want build-time image information
```

### `public/`

``` tsx
<Image
  src="/hero.png"
  alt="Hero"
  width={1200}
  height={600}
/>
```

Good when:

``` text
You need a predictable URL
Asset is referenced directly
Asset is not naturally tied to a component import
```

------------------------------------------------------------------------

# 9. Width and Height

For remote or string image URLs, you commonly provide dimensions:

``` tsx
<Image
  src="/product.jpg"
  alt="Product"
  width={800}
  height={600}
/>
```

Why?

``` text
Browser knows expected dimensions
        ↓
Space can be reserved
        ↓
Less layout shift
```

Mental model:

``` text
Image dimensions
      ↓
Reserve layout space
      ↓
Reduce unexpected movement
```

------------------------------------------------------------------------

# 10. `fill`

Sometimes the image should fill its parent.

``` tsx
<div className="relative h-64">
  <Image
    src="/hero.jpg"
    alt="Hero"
    fill
    className="object-cover"
  />
</div>
```

Important:

``` text
fill
 ↓
Image fills positioned parent
```

The parent normally needs an appropriate positioning/layout context.

For example:

``` css
.parent {
  position: relative;
}
```

------------------------------------------------------------------------

# 11. `object-fit`

Common image behavior:

``` tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  fill
  className="object-cover"
/>
```

`object-cover` means conceptually:

``` text
Fill container
+
Maintain aspect ratio
+
Crop overflow
```

Useful for:

``` text
Hero banners
Card thumbnails
Profile covers
Product grids
```

------------------------------------------------------------------------

# 12. Responsive Images

Images should adapt to screen size.

Example:

``` tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1600}
  height={900}
  sizes="100vw"
/>
```

The `sizes` attribute helps the browser understand how much space the
image will occupy at different viewport sizes.

Example:

``` tsx
sizes="(max-width: 768px) 100vw, 50vw"
```

Mental model:

``` text
Mobile
 ↓
Image may use smaller resource

Desktop
 ↓
Image may use larger resource
```

------------------------------------------------------------------------

# 13. `sizes`

Suppose an image is:

``` text
100% width on mobile
50% width on desktop
```

Use:

``` tsx
sizes="(max-width: 768px) 100vw, 50vw"
```

Think:

``` text
sizes
 ↓
Tell browser expected rendered width
 ↓
Choose appropriate image resource
```

This can reduce unnecessary bandwidth.

------------------------------------------------------------------------

# 14. Priority / Eager Loading

Not every image should load immediately.

A key performance principle:

``` text
Above-the-fold important image
        ↓
Load early

Below-the-fold image
        ↓
Can load later
```

For the main important image, use the current Next.js API intended for
high-priority loading according to your Next.js version.

Conceptually:

``` text
LCP image
 ↓
Give it appropriate loading priority
```

Do not make every image high priority.

------------------------------------------------------------------------

# 15. Lazy Loading

Images that are not immediately visible can generally be lazy-loaded.

Mental model:

``` text
Page starts
   ↓
Load important content
   ↓
User scrolls
   ↓
Load nearby images
```

This helps avoid downloading the entire image catalog immediately.

`next/image` is designed to provide lazy-loading behavior for images
when appropriate.

------------------------------------------------------------------------

# 16. LCP and Images

LCP means:

``` text
Largest Contentful Paint
```

A common LCP element is:

``` text
Hero image
```

If the hero image is the LCP element:

``` text
Huge image
+
slow delivery
+
late loading
        ↓
Poor LCP
```

Improve it with:

``` text
Correct dimensions
Responsive sizing
Appropriate priority/loading
Compressed source
Correct format
CDN/optimized delivery
```

------------------------------------------------------------------------

# 17. Image Format

Common formats:

``` text
JPEG
PNG
WebP
AVIF
SVG
```

General idea:

``` text
Photographs
 ↓
JPEG / WebP / AVIF

Transparency
 ↓
PNG / WebP / AVIF

Vector graphics
 ↓
SVG
```

The best choice depends on the asset and browser/support requirements.

Next.js image optimization can deliver modern formats when
configured/supported.

------------------------------------------------------------------------

# 18. SVG Images

SVG is useful for:

``` text
Logos
Icons
Simple illustrations
Vector graphics
```

Example:

``` tsx
<Image
  src="/logo.svg"
  alt="Company logo"
  width={200}
  height={50}
/>
```

For small UI icons, you may also use an icon component library rather
than image files.

------------------------------------------------------------------------

# 19. Image Accessibility

Always provide meaningful `alt` text when an image conveys information.

``` tsx
<Image
  src="/product.jpg"
  alt="Black running shoes"
  width={800}
  height={800}
/>
```

Bad:

``` tsx
alt="image"
```

Better:

``` tsx
alt="Black running shoes"
```

Decorative image:

``` tsx
alt=""
```

Mental model:

``` text
Image
 ↓
What information does it provide?
 ↓
Write useful alt text
```

------------------------------------------------------------------------

# 20. Alt Text Is Not SEO Keyword Stuffing

Don't do:

``` tsx
alt="best shoes shoes running shoes cheap shoes"
```

Instead:

``` tsx
alt="Black running shoes"
```

The purpose is primarily:

``` text
Accessibility
Context
```

not keyword stuffing.

------------------------------------------------------------------------

# 21. Remote Images

Suppose the image comes from:

``` text
https://cdn.example.com/product.jpg
```

You can use:

``` tsx
<Image
  src="https://cdn.example.com/product.jpg"
  alt="Product"
  width={800}
  height={800}
/>
```

But Next.js needs to know which remote image sources are
allowed/configured.

------------------------------------------------------------------------

# 22. Remote Image Configuration

In `next.config.ts`, configure permitted remote image sources according
to the current Next.js configuration API.

Conceptually:

``` ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.example.com",
      },
    ],
  },
}

export default nextConfig
```

Mental model:

``` text
Remote URL
    ↓
Is this source allowed?
    ↓
next.config
    ↓
Image optimization
```

------------------------------------------------------------------------

# 23. Why Remote Image Restrictions Exist

Without restrictions, an application could potentially be asked to
process images from arbitrary external sources.

Configuration gives you:

``` text
Allowed domains/patterns
        ↓
Controlled image sources
```

This is both an operational and security consideration.

------------------------------------------------------------------------

# 24. Image CDN

In production, images are often delivered through:

``` text
CDN
```

Mental model:

``` text
Origin
 ↓
CDN
 ↓
Nearest/appropriate edge
 ↓
User
```

Benefits can include:

``` text
Lower latency
Caching
Scalable delivery
Reduced origin load
```

Next.js image optimization can work with deployment/platform
infrastructure depending on where the app is hosted.

------------------------------------------------------------------------

# 25. Image Sizing Strategy

Avoid sending a huge image to a small card.

Bad:

``` text
1200 × 1200 source
 ↓
100 × 100 card
```

Better:

``` text
Rendered size
 ↓
Responsive image selection
 ↓
Appropriate resource
```

Think:

``` text
Image optimization
=
Right image
+
Right dimensions
+
Right format
+
Right time
```

------------------------------------------------------------------------

# 26. Image Quality

Do not always use maximum quality.

Think:

``` text
Higher quality
 ↓
Larger file
 ↓
More bandwidth

Lower quality
 ↓
Smaller file
 ↓
Potential visual degradation
```

Choose an acceptable balance.

For product grids:

``` text
Moderate quality
```

may be enough.

For large hero photography:

``` text
Higher quality
```

may be appropriate.

------------------------------------------------------------------------

# 27. `next/font`

Next.js provides:

``` text
next/font
```

for optimized font loading.

Example:

``` tsx
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

Mental model:

``` text
Font
 ↓
next/font
 ↓
Optimized loading
 ↓
Application
```

------------------------------------------------------------------------

# 28. Why Use `next/font`?

Benefits include:

``` text
Font optimization
Better loading behavior
Avoid unnecessary external font requests
CSS integration
Potentially reduced layout shift
```

Instead of manually adding:

``` html
<link href="font-provider..." />
```

you can integrate fonts through:

``` text
next/font
```

------------------------------------------------------------------------

# 29. Google Fonts

Example:

``` tsx
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
})
```

Then:

``` tsx
<html className={inter.className}>
```

The font is integrated into the application through Next.js's font
system.

------------------------------------------------------------------------

# 30. Font Weights

You can configure the weights you actually need.

Conceptually:

``` tsx
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})
```

Don't automatically load every available weight.

Think:

``` text
Need 3 weights
 ↓
Load 3 weights

Not:
Load 12 weights
```

Fewer font resources generally means less unnecessary work.

------------------------------------------------------------------------

# 31. Local Fonts

You can use local fonts with:

``` tsx
import localFont from "next/font/local"
```

Example:

``` tsx
const myFont = localFont({
  src: "./fonts/MyFont.woff2",
})
```

Then:

``` tsx
<body className={myFont.className}>
```

Mental model:

``` text
Local .woff2
      ↓
next/font/local
      ↓
Application font
```

------------------------------------------------------------------------

# 32. Why WOFF2?

A common web font format is:

``` text
WOFF2
```

It provides compressed font data suitable for web delivery.

Typical project:

``` text
app/
├── fonts/
│   └── MyFont.woff2
└── layout.tsx
```

Then:

``` tsx
const myFont = localFont({
  src: "./fonts/MyFont.woff2",
})
```

------------------------------------------------------------------------

# 33. Font Display

Fonts can affect how text appears while the font is loading.

Mental model:

``` text
Browser
 ↓
Text needs to render
 ↓
Custom font may not be ready
 ↓
Fallback/custom font behavior
```

The goal is to avoid:

``` text
Invisible text
+
late font swap
+
layout movement
```

`next/font` helps manage font loading and related CSS.

------------------------------------------------------------------------

# 34. Font Subsets

Example:

``` tsx
const inter = Inter({
  subsets: ["latin"],
})
```

A subset means you don't necessarily need every character set.

Think:

``` text
Full font
 ↓
More data

Needed subset
 ↓
Less data
```

Only configure the subsets you actually need.

------------------------------------------------------------------------

# 35. Font Variables

You can create a CSS variable:

``` tsx
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})
```

Then:

``` tsx
<html className={inter.variable}>
```

CSS:

``` css
body {
  font-family: var(--font-inter);
}
```

Useful when working with:

``` text
Tailwind
CSS variables
Multiple fonts
Design systems
```

------------------------------------------------------------------------

# 36. Multiple Fonts

Suppose:

``` text
Heading font
+
Body font
```

Conceptually:

``` tsx
const heading = localFont({
  src: "./fonts/Heading.woff2",
  variable: "--font-heading",
})

const body = localFont({
  src: "./fonts/Body.woff2",
  variable: "--font-body",
})
```

Then:

``` tsx
<html className={`${heading.variable} ${body.variable}`}>
```

CSS:

``` css
h1 {
  font-family: var(--font-heading);
}

body {
  font-family: var(--font-body);
}
```

------------------------------------------------------------------------

# 37. Fonts and CLS

CLS means:

``` text
Cumulative Layout Shift
```

Bad font loading can contribute to visible layout changes.

Example:

``` text
Fallback font
     ↓
Text width = 500px

Custom font loads
     ↓
Text width = 560px

Layout changes
     ↓
Visible shift
```

Good font strategy:

``` text
next/font
+
appropriate font configuration
+
reasonable fallback behavior
```

------------------------------------------------------------------------

# 38. Assets Other Than Images

Your application may contain:

``` text
Images
Fonts
SVGs
PDFs
Videos
Audio
Favicons
robots.txt
sitemap.xml
manifest
```

Think about where each belongs.

``` text
public/
 ↓
Direct static URL

Imported module asset
 ↓
Bundled/imported asset
```

------------------------------------------------------------------------

# 39. `public/` vs Source Assets

Use `public/` for assets that need direct URL access:

``` text
/favicon.ico
/robots.txt
/static-file.pdf
```

Use imports when the asset is part of the module/component structure:

``` tsx
import logo from "./logo.png"
```

There isn't one universal rule.

Choose based on:

``` text
Does it need a predictable public URL?
Does it belong to this module?
Does Next.js need build-time asset information?
```

------------------------------------------------------------------------

# 40. Background Images

You may use CSS background images:

``` css
.hero {
  background-image: url("/hero.jpg");
}
```

This can be appropriate for:

``` text
Decorative backgrounds
Texture
Visual decoration
```

But if an image is meaningful content:

``` text
Prefer semantic <Image> / image element
```

because it can provide:

``` text
alt text
image semantics
image optimization
```

------------------------------------------------------------------------

# 41. Decorative vs Content Images

### Content image

``` text
Product photo
Team photo
Article image
Diagram
```

Should generally have meaningful alternative text where appropriate.

### Decorative image

``` text
Background texture
Visual separator
Decoration
```

Can often be represented as:

``` text
CSS background
```

or:

``` text
alt=""
```

depending on implementation.

------------------------------------------------------------------------

# 42. Image Component Example --- Product Card

``` tsx
import Image from "next/image"

type ProductCardProps = {
  name: string
  image: string
}

export function ProductCard({
  name,
  image,
}: ProductCardProps) {
  return (
    <article>
      <Image
        src={image}
        alt={name}
        width={400}
        height={400}
        sizes="(max-width: 768px) 50vw, 25vw"
      />

      <h2>{name}</h2>
    </article>
  )
}
```

Think:

``` text
Product
 ↓
Correct alt
 ↓
Known dimensions
 ↓
Responsive sizing
 ↓
Optimized delivery
```

------------------------------------------------------------------------

# 43. Image Component Example --- Hero

``` tsx
<div className="relative min-h-[500px]">
  <Image
    src="/hero.jpg"
    alt="People collaborating in an office"
    fill
    priority
    sizes="100vw"
    className="object-cover"
  />
</div>
```

Architecture:

``` text
Hero container
 ↓
positioned parent
 ↓
Image fill
 ↓
object-cover
 ↓
responsive resource
 ↓
important image loads early
```

Use the current Next.js recommended API for high-priority images for the
version of Next.js you are using.

------------------------------------------------------------------------

# 44. Image Component Example --- Avatar

``` tsx
<Image
  src={user.avatar}
  alt={`${user.name}'s profile picture`}
  width={48}
  height={48}
  className="rounded-full"
/>
```

Small image:

``` text
48 × 48
```

Don't send a massive image unnecessarily when your image pipeline can
provide an appropriate resource.

------------------------------------------------------------------------

# 45. Fonts + Layout Example

``` tsx
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

CSS:

``` css
body {
  font-family: var(--font-inter);
}
```

Mental model:

``` text
Root layout
 ↓
Font configuration
 ↓
CSS variable
 ↓
Whole application
```

------------------------------------------------------------------------

# 46. Assets and Performance

Performance thinking:

``` text
                         ASSETS
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
           Images         Fonts          Files
             │              │              │
             ▼              ▼              ▼
         Size/format      weights        size
         dimensions       subsets        caching
         loading          loading        delivery
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                       Page Speed
```

Always ask:

``` text
How large is it?
When is it needed?
Who needs it?
Can it be compressed?
Can it be cached?
```

------------------------------------------------------------------------

# 47. Core Web Vitals Connection

Images and fonts can affect:

``` text
LCP
CLS
```

Potential image problem:

``` text
Large hero image
 ↓
slow download
 ↓
poor LCP
```

Potential layout problem:

``` text
No dimensions
 ↓
layout changes when image arrives
 ↓
CLS
```

Potential font problem:

``` text
Font loads late
 ↓
text layout changes
 ↓
CLS
```

So asset architecture is performance architecture.

------------------------------------------------------------------------

# 48. Caching and Assets

Static assets are often highly cacheable.

Mental model:

``` text
Asset
 ↓
Browser cache / CDN
 ↓
Future request
 ↓
Reuse cached resource
```

Use stable asset URLs and appropriate caching strategies through your
deployment/platform.

Don't unnecessarily change:

``` text
/logo-v1.png
/logo-v2.png
/logo-v3.png
```

without understanding your cache strategy.

------------------------------------------------------------------------

# 49. Asset Naming

Prefer meaningful names:

``` text
hero-dashboard.webp
product-black-shoes.webp
company-logo.svg
```

over:

``` text
IMG_92837.jpg
final-final-2.png
abc123.png
```

Good names help developers maintain the project.

------------------------------------------------------------------------

# 50. Common Mistakes

## Mistake 1 --- Using `<img>` everywhere

``` tsx
<img src="/hero.jpg" />
```

This isn't always wrong, but for normal application images, consider
whether `next/image` provides useful optimization.

------------------------------------------------------------------------

## Mistake 2 --- Huge images

``` text
5 MB image
 ↓
100 × 100 card
```

Bad for bandwidth.

------------------------------------------------------------------------

## Mistake 3 --- Missing dimensions

Without known dimensions, image layout can be harder to stabilize.

Prefer:

``` tsx
width
height
```

or an appropriate layout strategy such as:

``` tsx
fill
```

with a correctly sized parent.

------------------------------------------------------------------------

## Mistake 4 --- Everything is `priority`

Don't make every image load at the highest priority.

Think:

``` text
Only important above-the-fold/LCP images
 ↓
High priority
```

------------------------------------------------------------------------

## Mistake 5 --- Loading every font weight

Don't load:

``` text
300
400
500
600
700
800
900
```

if the app only uses:

``` text
400
600
700
```

------------------------------------------------------------------------

## Mistake 6 --- Loading unnecessary subsets

If the application only needs Latin characters, don't automatically load
every available language subset.

------------------------------------------------------------------------

## Mistake 7 --- Bad alt text

``` text
alt="image"
```

or:

``` text
alt="best shoes cheap shoes running shoes"
```

Prefer concise, meaningful descriptions.

------------------------------------------------------------------------

## Mistake 8 --- Remote image not configured

You may get an error if a remote image source isn't allowed by the image
configuration.

------------------------------------------------------------------------

## Mistake 9 --- Using CSS background for meaningful content

If users need to understand the image:

``` text
Don't hide meaningful information in decoration.
```

Use semantic image content when appropriate.

------------------------------------------------------------------------

## Mistake 10 --- Putting everything in `public/`

`public/` is useful, but don't treat it as the only asset system.

Choose between:

``` text
imported asset
```

and:

``` text
public/
```

based on the use case.

------------------------------------------------------------------------

# 51. Interview Questions

### Q1. Why use `next/image`?

It provides Next.js-aware image handling such as optimization,
responsive delivery, lazy loading behavior, sizing support, and
integration with the framework's image pipeline.

### Q2. Why are width and height important?

They help the browser reserve space for the image and can reduce layout
shifts.

### Q3. What is `fill`?

`fill` makes the image fill its positioned parent rather than requiring
explicit width and height in the same way.

### Q4. What is `sizes`?

It describes the expected rendered width of a responsive image at
different viewport sizes so the browser can choose an appropriate
resource.

### Q5. Why not make every image high priority?

Because downloading everything immediately wastes bandwidth and can hurt
performance.

### Q6. What is `next/font`?

Next.js's font system for integrating and optimizing Google or local
fonts.

### Q7. How do you load a local font?

``` tsx
import localFont from "next/font/local"

const myFont = localFont({
  src: "./fonts/MyFont.woff2",
})
```

### Q8. Why use `next/font`?

It integrates font loading with Next.js and can improve loading behavior
and reduce common font-related performance problems.

### Q9. What is `public/`?

A directory for static files that are served directly from the site's
root URL.

### Q10. How does `public/logo.png` map to a URL?

``` text
public/logo.png
      ↓
/logo.png
```

### Q11. What is the difference between a static import and `public/`?

A static import is part of the module/import graph and can provide
build-time asset information. `public/` exposes the file through a
predictable URL.

### Q12. What is LCP?

Largest Contentful Paint --- a Core Web Vital measuring how quickly the
largest main content element becomes visible.

### Q13. How can images hurt LCP?

A large or late-loading hero image can delay the largest visible
content.

### Q14. How can fonts hurt CLS?

Font substitution can change text dimensions after initial rendering,
causing layout movement.

### Q15. What is `alt` text for?

Primarily accessibility and conveying the meaning of an image to users
who cannot see it.

### Q16. What are remote image patterns?

Configuration rules that specify which external image sources are
permitted for Next.js image handling.

------------------------------------------------------------------------

# 52. Interview Failure Points

Avoid:

``` text
❌ "next/image just changes <img> syntax."

❌ "width and height are only for visual sizing."

❌ "priority should be added to every image."

❌ "public is where all files must go."

❌ "alt text is mainly for Google keywords."

❌ "next/font is just a CSS shortcut."

❌ "More font weights are always better."

❌ "A 5 MB image is fine because the browser compresses it."

❌ "Background images and content images are identical for accessibility."

❌ "Every image should load immediately."
```

Better mental model:

``` text
Images
 ↓
Optimize size + format + dimensions + loading

Fonts
 ↓
Optimize weights + subsets + loading

Assets
 ↓
Choose correct delivery mechanism

Accessibility
 ↓
Meaningful alt text

Performance
 ↓
Protect LCP + CLS + bandwidth
```

------------------------------------------------------------------------

# 53. Real-World E-Commerce Asset Architecture

``` text
                     E-COMMERCE
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
     Product            Fonts            Static
      Images                              Assets
        │                │                │
        ▼                ▼                ▼
   next/image         next/font         public/
        │                │                │
        ▼                ▼                ▼
 Responsive           Subsets           Logos
 sizing               Weights            Icons
 CDN                  Local fonts        PDFs
 Lazy loading         Variables         Favicons
```

For a product card:

``` text
Product image
 ↓
next/image
 ↓
correct dimensions
 ↓
sizes
 ↓
meaningful alt
 ↓
lazy loading when appropriate
```

For product detail:

``` text
Main product image
 ↓
large but optimized
 ↓
important image loading strategy
```

------------------------------------------------------------------------

# 54. Real-World Blog Asset Architecture

``` text
/blog/[slug]
      │
      ├── Cover image
      │      ↓
      │   next/image
      │
      ├── Author avatar
      │      ↓
      │   optimized small image
      │
      ├── Article body images
      │      ↓
      │   responsive images
      │
      └── Fonts
             ↓
          next/font
```

Goal:

``` text
Fast initial page
+
Readable typography
+
Accessible images
+
Responsive media
```

------------------------------------------------------------------------

# 55. Asset Decision Tree

``` text
Do I have an image?
       │
       ▼
Is it meaningful content?
       │
   ┌───┴───┐
   ▼       ▼
  Yes      No
   │        │
   ▼        ▼
<Image>   CSS/background
   │
   ▼
Local or remote?
   │
 ┌─┴──────┐
 ▼        ▼
Local    Remote
 │        │
 ▼        ▼
Import   Configure
         source
```

For fonts:

``` text
Need custom font?
       │
      Yes
       ↓
Google font?
   │       │
  Yes      No
   ↓        ↓
next/font  next/font/local
```

------------------------------------------------------------------------

# 56. Production Checklist

``` text
- [ ] Use next/image where appropriate
- [ ] Give images meaningful alt text
- [ ] Use dimensions or fill correctly
- [ ] Use sizes for responsive layouts
- [ ] Optimize LCP image
- [ ] Avoid unnecessary high-priority images
- [ ] Avoid huge source images
- [ ] Configure remote image sources
- [ ] Use appropriate image formats
- [ ] Use next/font for application fonts
- [ ] Load only needed font weights
- [ ] Load only needed subsets
- [ ] Consider local fonts with next/font/local
- [ ] Use public/ for appropriate direct static files
- [ ] Keep meaningful content out of decorative backgrounds
- [ ] Check LCP and CLS
- [ ] Test mobile bandwidth
- [ ] Test accessibility
```

------------------------------------------------------------------------

# 57. 30-Second Revision

``` text
next/image
↓
Optimized images

width + height
↓
Reserve layout space

fill
↓
Fill positioned parent

sizes
↓
Responsive image sizing information

priority / high-priority loading
↓
Use for important images, not everything

next/font
↓
Optimized font integration

next/font/local
↓
Local font files

public/
↓
Static files at root URLs

alt
↓
Accessibility

LCP
↓
Large/late images can hurt it

CLS
↓
Unstable image/font layout can hurt it
```

------------------------------------------------------------------------

# 58. Final Interview Answer

> "For images in Next.js, I generally use `next/image` because it gives
> me framework-aware image optimization, responsive delivery, loading
> behavior and sizing support. I make sure images have meaningful alt
> text, known dimensions or an appropriate `fill` layout, and I use
> `sizes` for responsive layouts. I pay special attention to the LCP
> image and avoid making every image high priority. For fonts, I use
> `next/font` for Google fonts or `next/font/local` for local fonts,
> loading only the weights and subsets the application needs. For static
> assets, I use `public/` when a predictable public URL is useful, while
> module imports are useful for assets tied to components. Overall, I
> treat image, font and asset choices as part of performance and
> accessibility architecture, especially around LCP, CLS, bandwidth and
> responsive behavior."

------------------------------------------------------------------------

# 59. One-Line Rule

> **Send the right asset, in the right format and size, at the right
> time --- while keeping images accessible and fonts lightweight.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
next/image
→ Image optimization

width / height
→ Reserve image space

fill
→ Fill positioned parent

sizes
→ Responsive image resource selection

alt
→ Accessibility

next/font
→ Font optimization/integration

next/font/local
→ Local fonts

public/
→ Direct static URLs

remotePatterns
→ Allowed remote image sources

LCP
→ Protect important/large image loading

CLS
→ Prevent image/font layout shifts

Image strategy
→ Right size + format + loading

Font strategy
→ Right family + subset + weight
```

### BEST GENERAL ARCHITECTURE

``` text
                    ASSET SYSTEM
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
        Images          Fonts          Files
          │              │              │
     next/image       next/font       public/
          │              │              │
          ▼              ▼              ▼
   size / format     weight/subset    direct URL
   sizes             local/google     static files
   loading           variable         favicon
   alt               CSS              robots
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  Performance +
                  Accessibility
```
