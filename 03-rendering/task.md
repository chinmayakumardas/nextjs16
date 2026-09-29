# Practice Task: Event Registration Page

## Problem Statement

Build an **Event Registration Page** for a technology conference.

The page should display different sections depending on the current registration state.

The main objective is to practice **Server Components, Client Components, props, state, conditional rendering, list rendering, event handlers, and Client boundaries**.

---

## What To Do

### Task 1 — Event Information

Create the main event page.

**Do:**

* Display the event name.
* Display the event date.
* Display the venue.
* Display a short description.
* Create reusable components for the event sections.

**Expected Result:**

The event information is rendered as a normal Server Component.

---

### Task 2 — Speaker List

Add a list of conference speakers.

Each speaker should contain:

```text
name
role
company
```

**Do:**

* Store the speakers in an array.
* Render the list using `.map()`.
* Create a reusable `SpeakerCard` component.
* Pass speaker information using props.

**Expected Result:**

All speakers are rendered from the data array using reusable components.

---

### Task 3 — Conditional Registration

Display different content depending on whether registration is open.

For example:

```text
Registration Open
```

or

```text
Registration Closed
```

**Do:**

* Use conditional rendering.
* Display the appropriate registration message.
* Show a registration button only when registration is open.

**Expected Result:**

The UI changes based on the registration status.

---

### Task 4 — Registration Form

Create a registration form.

**Do:**

* Add name and email fields.
* Add a Register button.
* Handle the form interaction on the Client.
* Keep the rest of the event page Server-side.

**Expected Result:**

The form is interactive without converting the entire page into a Client Component.

---

### Task 5 — Registration State

After the user submits the form, change the UI.

Before submission:

```text
Register Now
```

After submission:

```text
Registration Successful
```

**Do:**

* Use `useState`.
* Handle the submit event.
* Conditionally render the success message.

**Expected Result:**

The page displays different content before and after registration.

---

### Task 6 — Speaker Details

Add a **View Details** interaction to each speaker.

**Do:**

* Create a Client Component only for the interactive section.
* Clicking a speaker displays additional information.
* Add a Close button.
* Use state to control which speaker is selected.

**Expected Result:**

Speaker details can be opened and closed without making the entire page a Client Component.

---

### Task 7 — Children and Layout

Create a reusable event section component.

For example:

```text
<EventSection>
    Speaker content
</EventSection>
```

**Do:**

* Use the `children` prop.
* Create a consistent layout for multiple sections.
* Reuse the component for:

  * Speakers
  * Schedule
  * Registration

**Expected Result:**

Multiple sections share the same reusable layout.

---

### Task 8 — Final Rendering Review

Review the application and identify:

* Server Components
* Client Components
* Props
* State
* Conditional rendering
* List rendering
* Event handlers
* `children`
* Client boundaries

Your final architecture should resemble:

```text
Event Page
    │
    ├── Server → Event Information
    │
    ├── Server → Speaker List
    │
    ├── Server → Schedule
    │
    ├── Client → Registration Form
    │
    └── Client → Speaker Details
```

**Expected Result:**

The application keeps static content Server-side and uses Client Components only where interaction is required.

---

## Final Checklist

* [ ] Event information is rendered correctly.
* [ ] Speaker list uses `.map()`.
* [ ] `SpeakerCard` receives data through props.
* [ ] Registration status uses conditional rendering.
* [ ] Registration form is interactive.
* [ ] `useState` is used for registration state.
* [ ] Speaker details open and close correctly.
* [ ] `children` is used in a reusable layout component.
* [ ] Server and Client Components are clearly separated.
* [ ] `"use client"` is used only where necessary.
