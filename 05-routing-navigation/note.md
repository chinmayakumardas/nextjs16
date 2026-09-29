# Practice Task: Travel Guide

## Problem Statement

Build a **Travel Guide** application for exploring different destinations.

The application should contain multiple pages and nested routes so that users can move between destinations, attractions, and travel information.

The main objective is to practice **routing, navigation, nested routes, dynamic routes, route parameters, `Link`, active navigation, programmatic navigation, redirects, and not-found pages**.

Do not focus on data fetching. Use local/static data for the destinations.

---

## What To Do

### Task 1 — Home Page

Create the main Travel Guide page.

**Do:**

* Add a page title.
* Add a short introduction.
* Display links to different sections of the application.

For example:

```text id="1p8x5q"
Travel Guide

Explore Destinations
Plan Your Trip
About
```

**Expected Result:**

The application has a clear home page with navigation to other routes.

---

### Task 2 — Main Navigation

Create a reusable navigation component.

Add links for:

```text id="jq4x8v"
Home
Destinations
Trip Planner
About
```

**Do:**

* Use Next.js `Link`.
* Do not use normal `<a>` tags for internal navigation.
* Make the navigation available across the application.

**Expected Result:**

Users can move between the main pages without manually entering URLs.

---

### Task 3 — Destinations Route

Create a destinations page.

Use static destination data such as:

```text id="h7eq9m"
Paris
Tokyo
Dubai
Bali
```

**Do:**

* Create a `/destinations` route.
* Display all destinations.
* Create a reusable destination card.
* Add a link from each card to its destination page.

**Expected Result:**

The destinations page displays all available destinations with working navigation links.

---

### Task 4 — Dynamic Destination Route

Create a dynamic route for individual destinations.

For example:

```text id="m5l6pf"
/destinations/paris
/destinations/tokyo
/destinations/dubai
/destinations/bali
```

**Do:**

* Use a dynamic route segment.
* Read the destination parameter.
* Display the selected destination.
* Add a Back to Destinations link.

**Expected Result:**

Each destination has its own URL and page.

---

### Task 5 — Nested Routes

Add travel information inside each destination.

Create routes such as:

```text id="d6k0r1"
/destinations/paris/places
/destinations/paris/food
/destinations/paris/tips
```

**Do:**

* Create nested routes.
* Add navigation between the nested pages.
* Keep the destination name visible while navigating between its sections.

**Expected Result:**

Users can navigate between different sections of the same destination.

---

### Task 6 — Active Navigation

Highlight the currently selected section.

For example:

```text id="w2fj8q"
Places
Food
Tips
```

The active section should be visually different from the other links.

**Do:**

* Create an appropriate navigation component.
* Detect the current route.
* Apply an active state to the current navigation item.

**Expected Result:**

Users can clearly identify which route they are currently viewing.

---

### Task 7 — Trip Planner

Create a `/planner` page.

Add links or buttons for:

```text id="x5gk2r"
Choose Destination
View Places
View Travel Tips
```

**Do:**

* Navigate users to the appropriate routes.
* Use `Link` for normal navigation.
* Use programmatic navigation where an action requires navigation after an event.

**Expected Result:**

The planner provides navigation to the relevant parts of the application.

---

### Task 8 — Programmatic Navigation

Add a **Start Exploring** button to the home page.

**Do:**

* Make the button navigate to `/destinations`.
* Use programmatic navigation where appropriate.
* Do not use a normal `<a>` element for this interaction.

**Expected Result:**

Clicking **Start Exploring** takes the user to the destinations page.

---

### Task 9 — Not Found

Handle invalid destinations.

For example:

```text id="1a9v7d"
/destinations/mars
/destinations/unknown
```

**Do:**

* Detect destinations that do not exist.
* Display a custom not-found page.
* Add a link back to the destinations page.

**Expected Result:**

Invalid destination URLs display a useful not-found experience.

---

### Task 10 — Redirect

Create an old route that should point users to the new destination route.

For example:

```text id="e7x3q2"
/places/paris
```

should redirect to:

```text id="4r1m9c"
/destinations/paris
```

**Do:**

* Implement the redirect.
* Make sure the old URL no longer displays duplicate content.

**Expected Result:**

Visiting the old route automatically takes the user to the new route.

---

### Task 11 — Shared Layout

Create a shared layout for the Travel Guide.

**Do:**

* Keep the main navigation in the layout.
* Add a common header.
* Add a common footer.
* Allow different pages to render inside the layout.

Your structure should be similar to:

```text id="x0d2pc"
Travel Guide
│
├── Home
│
├── Destinations
│   │
│   ├── Paris
│   │   ├── Places
│   │   ├── Food
│   │   └── Tips
│   │
│   ├── Tokyo
│   │   ├── Places
│   │   ├── Food
│   │   └── Tips
│   │
│   └── Dubai
│
├── Trip Planner
│
└── About
```

**Expected Result:**

The application has a consistent layout while different routes render their own content.

---

### Task 12 — Final Routing Review

Review the complete application.

**Do:**

Identify:

* Static routes
* Dynamic routes
* Nested routes
* Route parameters
* Internal navigation
* Active navigation
* Programmatic navigation
* Redirects
* Not-found handling
* Shared layouts

**Expected Result:**

The final application demonstrates a clear understanding of how routes are created, nested, linked, and navigated.

---

## Final Checklist

* [ ] Home route works.
* [ ] Main navigation works.
* [ ] Internal navigation uses `Link`.
* [ ] Destinations route works.
* [ ] Dynamic destination routes work.
* [ ] Route parameters are used correctly.
* [ ] Nested destination routes work.
* [ ] Active navigation is implemented.
* [ ] Trip Planner route works.
* [ ] Programmatic navigation works.
* [ ] Invalid destinations show a not-found page.
* [ ] Redirect is implemented.
* [ ] Shared layout is implemented.
* [ ] Header and footer remain consistent across routes.
* [ ] Navigation works without manually entering URLs.
* [ ] The route structure is clean and predictable.
