# Practice Task: Product Dashboard

## Problem Statement

Build a **Product Dashboard** with:

* 3 products
* Product name, price, and description
* Favorite button
* Product search
* Light/Dark theme toggle
* Product preview with close button
* Server-side product information
* Private server-only information

The main objective is to practice **Server Components, Client Components, props, state, effects, browser APIs, event handlers, and Client boundaries**.

---

## What To Do

### Task 1 — Basic Dashboard

Create the dashboard with 3 products.

**Do:**

* Product title
* Product list
* Product name
* Price
* Description

**Expected Result:**
Products are displayed without any interactivity.

---

### Task 2 — Product Card

Create a reusable `ProductCard` component.

**Do:**

* Pass product information as props.
* Keep the component Server-side unless client functionality is required.

**Expected Result:**
Each product appears as its own reusable card.

---

### Task 3 — Favorite

Add a Favorite button.

**Do:**

* Clicking changes `♡ Favorite` → `♥ Favorited`.
* Use `useState`.
* Keep only the required component as Client.

**Expected Result:**
Each product can be favorited independently.

---

### Task 4 — Search

Add a search input.

**Do:**

* Use state for the search value.
* Handle user input.
* Show matching products.

**Expected Result:**
Typing a product name filters the displayed products.

---

### Task 5 — Theme

Add a Light/Dark toggle.

**Do:**

* Use `useState`.
* Use `useEffect`.
* Store the preference using `localStorage`.

**Expected Result:**
The selected theme remains after refreshing the page.

---

### Task 6 — Product Preview

Add an **Open Preview** button.

**Do:**

* Open a product preview.
* Show name, price, and description.
* Add a Close button.
* Keep interactive behavior limited to the required Client component.

**Expected Result:**
The preview opens and closes correctly.

---

### Task 7 — Server Content

Add server-only information such as:

```text
Inventory: 42
Supplier: ABC
```

**Do:**

* Keep private/server-only information on the Server.
* Do not expose secrets to Client Components.

**Expected Result:**
Server-only data remains controlled by the Server.

---

### Task 8 — Final Architecture

Review every component.

**Do:**

* Identify Server Components.
* Identify Client Components.
* Add `"use client"` only where necessary.
* Pass required data through props.
* Use `children` where appropriate.
* Keep Client boundaries as small as possible.

**Expected Result:**

```text
Product Dashboard
      │
      ├── Server
      │
      ├── Server
      │
      ├── Client → Favorite
      │
      ├── Client → Search
      │
      ├── Client → Theme
      │
      └── Client → Preview
```

The final application should work correctly while keeping **as much of the application Server-side as possible**.
