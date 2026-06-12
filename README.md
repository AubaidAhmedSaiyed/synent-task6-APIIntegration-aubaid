# Web Development Projects — Full Documentation

video: https://youtu.be/UVXcdIX3hes




## Task 6 — API Integration Project (GitScope)

### Objective
Fetch and display live data from a public API. Implement dynamic data rendering, a loading state, and proper error handling.

### Product Concept
**GitScope** is a GitHub profile and repository explorer. Type any GitHub username and see their profile card plus all public repositories, sortable by stars, update date, name, or forks. No API key required.

### File Structure
```
github-explorer/
├── index.html      — Markup
├── styles.css      — All styling
└── app.js          — All fetch logic, rendering, and interactions
```

### API Used
**GitHub REST API v3** — Public endpoints, no authentication needed.

| Endpoint | Purpose |
|---|---|
| `GET /users/{username}` | Fetch user profile data |
| `GET /users/{username}/repos?per_page=100&sort=updated` | Fetch up to 100 repositories |

Rate limit: 60 requests per hour per IP address (unauthenticated).

### Features

#### Search
- Input accepts a GitHub username
- Triggers on button click or `Enter` keypress
- The input uses `font-family: monospace` and a custom `caret-color` to reinforce the terminal aesthetic
- A prefix label `github.com /` sits inside the search bar as a visual hint (not part of the actual query)

#### Parallel Fetching
Both API calls are made simultaneously using `Promise.all([fetchUser(), fetchRepos()])`. This means the total wait time equals the slower of the two requests rather than their sum.

```javascript
const [user, repos] = await Promise.all([fetchUser(username), fetchRepos(username)]);
```

#### Loading State
- A sweep-bar animation (`@keyframes sweep`) moves a gradient highlight across a fixed-width track bar
- A "Fetching data..." label sits beside it in monospace text
- The loading element is shown before the fetch starts and hidden when it resolves or rejects

#### Error Handling
Three specific error states are caught and shown in a styled red error box:

| HTTP Status | Message Shown |
|---|---|
| `404` | `User "{username}" not found.` |
| `403` | `Rate limit exceeded. Try again in a minute.` |
| Any other non-OK | `GitHub API error: {status}` |
| Network failure | Whatever `Error.message` the browser throws |

#### Profile Card
Displays: avatar (with a spinning ring decoration), full name, `@login`, bio, location, blog link, Twitter handle, and four stat chips (public repos, followers, following, public gists). Large numbers are formatted by `fmtNum()` — values over 1,000 are shown as `1.2k`.

#### Repository Grid
- Auto-fills columns using `repeat(auto-fill, minmax(300px, 1fr))`
- Each card shows: repo name (linked to GitHub), a "fork" badge if applicable, description (clamped to 2 lines), language dot (colour-coded from a 30+ language map), star count, fork count, and a relative timestamp
- The language colour map (`LANG_COLORS`) covers JavaScript, TypeScript, Python, Go, Rust, Swift, Kotlin, and 25+ others. Unknown languages get a neutral grey
- `timeAgo()` converts ISO date strings to human-readable relative time: `just now`, `5m ago`, `2d ago`, `3mo ago`, `1y ago`

#### Sort Control
A `<select>` dropdown lets users re-sort the already-fetched repository array without making another API call. Sorting is done in-memory by a `sortRepos()` function that handles four modes: stars (descending), updated date (descending), name (A–Z alphabetical), forks (descending).

### Design System

| Token | Value |
|---|---|
| Background | `#080b10` |
| Surface | `#0d1117` (GitHub-inspired) |
| Cyan accent | `#63d2ff` |
| Green accent | `#3ddc84` |
| Error red | `#ff6b6b` |
| Display font | Space Mono |
| UI font | Outfit |

### Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| `> 600px` | Profile card side-by-side, multi-column repo grid |
| `≤ 600px` | Profile card stacks vertically, single-column repo grid, header tag hidden |

