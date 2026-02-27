# Member Benefits Slideshow

iPad-first fullscreen slideshow that pulls live member benefits from:
`https://www.studentersamfundet.dk/medlemsfordele`

## What it does
- Fetches live benefits through `/api/benefits`
- Shows benefits in branded pages of 4 cards (last page can show 1-3 cards)
- Auto-rotates pages (default 10 seconds)
- Supports tap and swipe navigation
- Falls back to cached data if upstream source fails
- Shows `Last updated` timestamp on screen

## Project structure
- `index.html` - slideshow shell
- `styles.css` - iPad-focused layout and styling
- `app.js` - slideshow behavior, auto-advance, refresh loop
- `api/benefits.js` - Vercel serverless API route
- `lib/benefits.js` - HTML parsing logic
- `lib/cache.js` - in-memory last-good payload cache
- `lib/slideshow.js` - pure slideshow timing/index helpers
- `tests/*.test.js` - Node built-in tests

## Configuration
Set these environment variables in Vercel (optional):
- `SLIDE_INTERVAL_SECONDS` (default `10`, minimum `3`)
- `REFRESH_INTERVAL_MINUTES` (default `20`, minimum `5`)

## Deploy on Vercel
1. Push this repository to GitHub.
2. Import it in Vercel as a new project.
3. Set optional env vars (`SLIDE_INTERVAL_SECONDS`, `REFRESH_INTERVAL_MINUTES`).
4. Deploy.
5. Open the deployment URL on iPad Safari.

## iPad kiosk setup
1. Open site in Safari.
2. Use **Share -> Add to Home Screen**.
3. Open from home screen to remove browser chrome.
4. Enable guided access / kiosk mode if needed.

## Local verification
Run tests:

```bash
pnpm test
```

Optional local static preview:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.
