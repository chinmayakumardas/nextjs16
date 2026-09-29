# Practice Task: Weather Station

## Problem Statement

Build a **Weather Station** application that displays weather information for different cities.

The main objective is to practice **server-side data fetching, async Server Components, request handling, dynamic routes, loading states, error handling, caching, and revalidation**.

Do not focus on complex Client-side interactions. The primary focus is **fetching and rendering remote data correctly**.

---

## What To Do

### Task 1 — City Weather

Create a weather page that displays weather information for a city.

For example:

```text
/weather/london
/weather/tokyo
/weather/mumbai
```

**Do:**

* Create a dynamic route.
* Read the city from the route.
* Fetch weather information for that city.
* Display:

  * City name
  * Temperature
  * Weather condition
  * Humidity
  * Wind speed

**Expected Result:**

Each city has its own weather page using dynamically fetched data.

---

### Task 2 — Fetch Data on the Server

Create a server-side function for fetching weather information.

**Do:**

* Keep the API request on the Server.
* Use `async`/`await`.
* Keep the API URL and API configuration on the Server.
* Return only the data required by the UI.

**Expected Result:**

Weather data is fetched from the Server and rendered by the application.

---

### Task 3 — Multiple Cities

Create a page that displays weather for multiple predefined cities.

Use cities such as:

```text
London
Tokyo
Mumbai
New York
Sydney
```

**Do:**

* Create an array of cities.
* Fetch the required weather information.
* Render the results.
* Reuse a `WeatherCard` component.

**Expected Result:**

The page displays weather information for multiple cities.

---

### Task 4 — Loading State

Add loading handling for the weather pages.

**Do:**

* Create a route-level loading UI.
* Display a weather skeleton or loading message.
* Make sure the user gets immediate feedback while data is loading.

**Expected Result:**

The application displays a loading state while waiting for weather data.

---

### Task 5 — Error Handling

Handle API failures.

**Do:**

Handle situations such as:

```text
API unavailable
Invalid city
Network failure
Unexpected response
```

* Create an appropriate error UI.
* Display a useful message.
* Add a retry mechanism where appropriate.

**Expected Result:**

The application handles failed requests gracefully.

---

### Task 6 — Not Found

Handle an unknown city.

For example:

```text
/weather/unknown-city
```

**Do:**

* Detect when the requested city does not exist.
* Display a proper not-found page.
* Do not render an empty weather page.

**Expected Result:**

Invalid city routes display a clear not-found state.

---

### Task 7 — Data Revalidation

Configure the weather request so that the displayed data is periodically updated.

**Do:**

* Use an appropriate revalidation strategy.
* Decide how frequently weather data should be refreshed.
* Avoid unnecessarily requesting fresh data for every request.

**Expected Result:**

Weather information can be refreshed automatically according to the configured revalidation period.

---

### Task 8 — Request Optimization

Review the data-fetching implementation.

**Do:**

* Avoid fetching the same data unnecessarily.
* Keep fetching logic reusable.
* Separate data-fetching functions from UI components where appropriate.
* Only request the data required by each page.

**Expected Result:**

The application has a clean and reusable data-fetching structure.

---

### Task 9 — Server-Only API Configuration

Assume the weather service requires a private API key.

**Do:**

* Keep the API key on the Server.
* Do not expose the key to Client Components.
* Do not place the secret directly in browser-side code.
* Use environment variables for the private configuration.

**Expected Result:**

The API credential remains server-only.

---

### Task 10 — Final Data-Fetching Review

Review the complete application.

Identify:

* Where data is fetched.
* Which functions perform API requests.
* Which routes use dynamic parameters.
* Where loading states are handled.
* Where errors are handled.
* Where not-found states are handled.
* What data is cached.
* What data is revalidated.
* Which values must remain server-only.

Your final architecture should resemble:

```text
Weather Application
        │
        ├── Server
        │    └── Fetch Weather
        │
        ├── Server
        │    └── Weather Page
        │
        ├── Server
        │    └── Weather Card
        │
        ├── Loading
        │    └── Weather Skeleton
        │
        ├── Error
        │    └── API Error UI
        │
        └── Not Found
             └── Unknown City
```

**Expected Result:**

The application demonstrates a clear understanding of **server-side data fetching, dynamic routes, loading, errors, caching, revalidation, and server-only configuration**.

---

## Final Checklist

* [ ] Weather data is fetched on the Server.
* [ ] Dynamic city routes work.
* [ ] Multiple cities can be displayed.
* [ ] `WeatherCard` is reusable.
* [ ] API requests use `async`/`await`.
* [ ] Loading UI is implemented.
* [ ] API errors are handled.
* [ ] Unknown cities show a not-found state.
* [ ] Data revalidation is configured.
* [ ] Unnecessary requests are avoided.
* [ ] Fetching logic is reusable.
* [ ] Private API configuration remains server-only.
* [ ] Environment variables are used for secrets.
* [ ] The application has a clear data-fetching architecture.
