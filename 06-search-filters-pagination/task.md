# Practice Task: Movie Explorer

## Problem Statement

Build a **Movie Explorer** application where users can search and browse a collection of movies.

The application should allow users to:

* Search movies
* Filter by genre
* Filter by rating
* Sort results
* Navigate between pages
* Preserve search and filter values while changing pages
* Share a result page using its URL

The main objective is to practice **search parameters, URL state, filtering, sorting, pagination, query strings, navigation, and server-side rendering based on URL parameters**.

Use a local dataset or mock API for the movies.

---

## What To Do

### Task 1 — Movie List

Create a `/movies` page.

Each movie should contain:

```text
id
title
genre
year
rating
```

**Do:**

* Display the movies in a reusable `MovieCard`.
* Display multiple movies on the page.
* Add a link to each movie's details page.

**Expected Result:**

The movie page displays a list of movies that users can browse.

---

### Task 2 — Search Movies

Add a search input to the movies page.

**Do:**

* Allow users to search by movie title.
* Store the search value in the URL query string.
* Use a parameter such as:

```text
/movies?query=batman
```

* Read the search parameter and display matching movies.

**Expected Result:**

Searching for a movie updates the URL and displays matching results.

---

### Task 3 — Genre Filter

Add a genre filter.

Use genres such as:

```text
All
Action
Comedy
Drama
Sci-Fi
```

**Do:**

* Store the selected genre in the URL.
* Use a parameter such as:

```text
/movies?genre=action
```

* Display only movies belonging to the selected genre.

**Expected Result:**

Selecting a genre updates the URL and filters the movie list.

---

### Task 4 — Combine Search and Filters

Make search and genre filtering work together.

For example:

```text
/movies?query=star&genre=sci-fi
```

**Do:**

* Read both query parameters.
* Apply the search first or together with the filter.
* Display only movies matching both conditions.
* Preserve the existing search value when changing the genre.

**Expected Result:**

Users can search and filter at the same time without losing their current selections.

---

### Task 5 — Rating Filter

Add a minimum-rating filter.

For example:

```text
/movies?rating=8
```

**Do:**

* Allow users to select a minimum rating.
* Display movies whose rating is greater than or equal to the selected value.
* Preserve the existing search and genre parameters.

**Expected Result:**

Users can combine search, genre, and rating filters.

---

### Task 6 — Sorting

Add a sort option.

Use options such as:

```text
Newest
Oldest
Rating: High → Low
Rating: Low → High
```

**Do:**

* Store the selected sort option in the URL.
* Sort the filtered results.
* Preserve all existing search and filter parameters.

For example:

```text
/movies?query=star&genre=sci-fi&rating=7&sort=rating-desc
```

**Expected Result:**

The user can search, filter, and sort without losing other URL parameters.

---

### Task 7 — Pagination

Display only a limited number of movies per page.

For example:

```text
Page 1
Page 2
Page 3
Next
Previous
```

**Do:**

* Add a `page` query parameter.
* Display a fixed number of movies per page.
* Calculate the correct results for the current page.

For example:

```text
/movies?page=2
```

**Expected Result:**

Users can move between pages of movie results.

---

### Task 8 — Preserve Parameters During Pagination

Make pagination work with all existing filters.

For example:

```text
/movies?query=star&genre=sci-fi&rating=7&sort=rating-desc&page=2
```

**Do:**

* Preserve `query`.
* Preserve `genre`.
* Preserve `rating`.
* Preserve `sort`.
* Change only the `page` parameter when navigating between pages.

**Expected Result:**

Changing pages does not reset the user's search, filters, or sorting.

---

### Task 9 — Empty Results

Handle situations where no movies match the current search and filters.

For example:

```text
/movies?query=xyz&genre=drama
```

**Do:**

Display a useful message such as:

```text
No movies found.
```

Add a way to return to the full movie list.

**Expected Result:**

The application displays a clear empty state instead of an empty screen.

---

### Task 10 — Reset Filters

Add a **Clear Filters** option.

**Do:**

* Remove the search parameter.
* Remove genre.
* Remove rating.
* Remove sorting.
* Return pagination to page 1.
* Navigate back to the default movie list.

**Expected Result:**

Users can reset the entire search state with one action.

---

### Task 11 — Movie Details

Create a dynamic movie details route.

For example:

```text
/movies/12
/movies/25
```

**Do:**

* Use the movie ID from the URL.
* Display the selected movie's details.
* Add a link back to the movie results.

**Expected Result:**

Each movie can be opened through its own dynamic route.

---

### Task 12 — Final Search & Pagination Review

Review the complete application.

Identify:

* Which values are stored in the URL.
* Which values are used for searching.
* Which values are used for filtering.
* How sorting is applied.
* How pagination is calculated.
* How query parameters are preserved.
* What happens when no results exist.
* How the URL represents the current application state.

Your final structure should resemble:

```text
Movie Explorer
      │
      └── /movies
            │
            ├── Search
            │
            ├── Genre Filter
            │
            ├── Rating Filter
            │
            ├── Sorting
            │
            ├── Movie Results
            │
            └── Pagination
```

Example URL:

```text
/movies?query=star&genre=sci-fi&rating=7&sort=rating-desc&page=2
```

**Expected Result:**

The URL completely represents the current search, filter, sorting, and pagination state.

---

## Final Checklist

* [ ] Movie list is displayed.
* [ ] Movie cards are reusable.
* [ ] Search works.
* [ ] Search value is stored in the URL.
* [ ] Genre filtering works.
* [ ] Rating filtering works.
* [ ] Sorting works.
* [ ] Search and filters work together.
* [ ] Pagination works.
* [ ] Pagination preserves all existing parameters.
* [ ] Empty results are handled.
* [ ] Clear Filters works.
* [ ] Pagination resets when filters are cleared.
* [ ] Movie details use a dynamic route.
* [ ] Query parameters correctly represent the current page state.
* [ ] Users can copy/share a URL and reproduce the same search results.
