# Member Benefits iPad Slideshow Design

## Context
Studentersamfundet wants an iPad-friendly slideshow showing the current membership benefits from:
`https://www.studentersamfundet.dk/medlemsfordele`

Current workflow uses manual screenshots and photo album switching, which is hard to maintain and quickly becomes stale.

## Goals
- Always show live/up-to-date membership benefits.
- Auto-rotate slides for unattended kiosk display.
- Keep text readable and touch interactions simple on iPad.
- Deploy easily to Vercel.

## Non-Goals
- Editing benefits in this app.
- Building a CMS.
- Replacing the source website.

## Chosen Approach
Build a small Next.js app hosted on Vercel.

- Frontend route `/` renders full-screen slideshow optimized for iPad.
- Backend API route `/api/benefits` fetches the source page server-side and parses benefits into normalized JSON.
- API uses short cache window to reduce source load and improve reliability.

This was chosen over iframe and browser-only scraping because it gives reliable live sync and complete control over kiosk UX.

## Architecture
1. iPad opens `/`.
2. Frontend fetches `/api/benefits`.
3. API fetches `https://www.studentersamfundet.dk/medlemsfordele`.
4. API parses benefit blocks (title, description, link, optional image).
5. API returns normalized payload + last-updated metadata.
6. Frontend starts auto-rotation and periodically refreshes data.

## UI/UX
- Full-screen responsive layout (iPad-first, landscape-optimized).
- Large typography and high contrast for distance readability.
- Auto-slide interval default: 10 seconds.
- Touch support:
  - swipe left/right for next/previous,
  - tap zones for prev/next.
- Auto-advance pauses briefly after interaction, then resumes.
- Small status row showing last update timestamp.

## Data Model
Each benefit item:
- `id: string`
- `title: string`
- `description: string`
- `link: string | null`
- `image: string | null`

API response shape:
- `items: BenefitItem[]`
- `updatedAt: string` (ISO)
- `sourceUrl: string`
- `stale: boolean`

## Failure Handling
- Upstream fetch fails: return most recent cached successful payload when available.
- Parse yields 0 items: treat as parse failure and keep serving last good payload.
- No cache and fetch fails: return 502 with clear error payload.
- Frontend keeps previous rendered slides during refresh failure.

## Configuration
Environment variables:
- `SLIDE_INTERVAL_SECONDS` (default `10`)
- `REFRESH_INTERVAL_MINUTES` (default `20`)

Optional later:
- Basic auth or secret token guard for public kiosk URL.

## Testing Strategy
- Parser unit tests with HTML fixtures:
  - extracts expected count,
  - handles missing fields,
  - catches structural changes.
- API tests:
  - normalized shape,
  - stale fallback behavior on upstream failure.
- UI tests/smoke:
  - auto-advance works,
  - manual next/prev works,
  - timer resumes after interaction.
- Manual iPad verification for readability and 30+ minute unattended stability.

## Deployment
- Deploy to Vercel from this repo.
- Set environment variables if overriding defaults.
- Open deployed URL on iPad in Safari.
- Add to Home Screen and run in guided/kiosk setup.
