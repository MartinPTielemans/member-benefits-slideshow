# Member Benefits Slideshow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and deploy an iPad-friendly slideshow web app on Vercel that auto-rotates live membership benefits from `https://www.studentersamfundet.dk/medlemsfordele`.

**Architecture:** A dependency-free static frontend (`index.html` + `app.js` + `styles.css`) served by Vercel, plus a serverless API route (`/api/benefits`) that fetches and parses source HTML into normalized JSON. API caches the last successful payload in memory and serves stale data on upstream failures.

**Tech Stack:** HTML, CSS, Vanilla JS, Vercel Serverless Functions (Node.js), Node built-in test runner.

---

### Task 1: Scaffold static app and test harness

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`
- Create: `vercel.json`
- Create: `tests/smoke.test.js`

**Step 1: Write the failing test**
Add a smoke test expecting key files to exist and exportable utility placeholders.

**Step 2: Run test to verify it fails**
Run: `pnpm test`
Expected: FAIL because files do not yet exist.

**Step 3: Write minimal implementation**
Add static files and minimal app shell.

**Step 4: Run test to verify it passes**
Run: `pnpm test`
Expected: PASS.

**Step 5: Commit**
`git add . && git commit -m "chore: scaffold static vercel slideshow app"`

### Task 2: Parser for membership benefits (TDD)

**Files:**
- Create: `lib/benefits.js`
- Create: `tests/fixtures/medlemsfordele.sample.html`
- Create: `tests/parse-benefits.test.js`

**Step 1: Write failing tests**
Add tests for:
- extracting expected benefit entries from fixture,
- mapping `title`, `description`, `link`, `image`,
- skipping weak/invalid sections.

**Step 2: Run tests to verify they fail**
Run: `pnpm test tests/parse-benefits.test.js`
Expected: FAIL because parser is missing.

**Step 3: Write minimal implementation**
Implement parser based on heading-section extraction heuristics with URL normalization.

**Step 4: Run tests to verify they pass**
Run: `pnpm test tests/parse-benefits.test.js`
Expected: PASS.

**Step 5: Commit**
`git add lib tests && git commit -m "feat: add benefits html parser"`

### Task 3: API route with cache + stale fallback (TDD)

**Files:**
- Create: `api/benefits.js`
- Create: `lib/cache.js`
- Create: `tests/api-benefits.test.js`

**Step 1: Write failing tests**
Add tests for:
- successful normalized payload,
- stale fallback when upstream fails after prior success,
- error when upstream fails and no cache exists.

**Step 2: Run tests to verify they fail**
Run: `pnpm test tests/api-benefits.test.js`
Expected: FAIL due missing API logic.

**Step 3: Write minimal implementation**
Implement fetch, parse, cache, and API response contract.

**Step 4: Run tests to verify they pass**
Run: `pnpm test tests/api-benefits.test.js`
Expected: PASS.

**Step 5: Commit**
`git add api lib tests && git commit -m "feat: add live benefits api with stale fallback"`

### Task 4: iPad slideshow behavior (TDD)

**Files:**
- Modify: `app.js`
- Modify: `index.html`
- Modify: `styles.css`
- Create: `lib/slideshow.js`
- Create: `tests/slideshow.test.js`

**Step 1: Write failing tests**
Add tests for pure slideshow index logic:
- next/prev wrapping,
- pause/resume windows after manual interaction,
- interval calculation helpers.

**Step 2: Run tests to verify they fail**
Run: `pnpm test tests/slideshow.test.js`
Expected: FAIL because logic module missing.

**Step 3: Write minimal implementation**
Implement slideshow logic module and wire UI interactions + auto-rotation.

**Step 4: Run tests to verify they pass**
Run: `pnpm test tests/slideshow.test.js`
Expected: PASS.

**Step 5: Commit**
`git add app.js index.html styles.css lib tests && git commit -m "feat: implement ipad slideshow ui behavior"`

### Task 5: Documentation and full verification

**Files:**
- Create: `README.md`

**Step 1: Add deployment and operations docs**
Document Vercel deployment, env variables, and iPad kiosk usage.

**Step 2: Run full verification**
Run:
- `pnpm test`

Expected: all tests pass.

**Step 3: Optional local preview**
Run: `python3 -m http.server 4173`
Expected: site served locally for visual check.

**Step 4: Commit**
`git add README.md && git commit -m "docs: add deployment and kiosk guide"`
