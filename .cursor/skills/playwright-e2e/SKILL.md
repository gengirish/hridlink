---
name: playwright-e2e
description: >-
  Playwright E2E for HridLink — tests under tests/e2e, dev:stack webServer,
  PLAYWRIGHT_BASE_URL / PLAYWRIGHT_SKIP_WEB_SERVER. Use when adding specs,
  debugging CI, or testing auth and Fly-backed flows locally.
---

# Playwright E2E — HridLink

## Commands (from repo root)

```bash
npm run test:e2e              # headless
npm run test:e2e:ui           # interactive UI
npm run test:e2e:headed       # visible browser
npm run test:e2e:install      # Chromium install helper
```

## Layout

- Specs: `tests/e2e/*.spec.ts` (not `e2e/`).
- Config: `playwright.config.ts`
  - `testDir: "./tests/e2e"`
  - `baseURL` from `PLAYWRIGHT_BASE_URL` default `http://127.0.0.1:3000`
  - `webServer` runs `npm run dev:stack` unless `PLAYWRIGHT_SKIP_WEB_SERVER` is set (starts Next + Fly API so rewrites work).
  - `webServer` timeout `180_000` ms; passes `API_UPSTREAM_URL` default `http://127.0.0.1:8080` when starting the stack.

## Writing tests

1. Prefer **role** and **label** selectors: `getByRole`, `getByLabel`, then text; use `data-testid` only when necessary.
2. Flows that need the API must run with **`dev:stack`** (or skip web server and start processes manually with matching env).
3. Auth-sensitive routes depend on Neon session cookies — reuse patterns from `tests/e2e/auth-pages.spec.ts` / `protected-routes.spec.ts`.

## CI vs local

- CI: `forbidOnly: true`, retries `2`, reporters `github` + `list`, video `retain-on-failure`.
- Local: increase `expect` timeout sparingly; avoid hard-coded sleeps — use `expect(...).toBeVisible()` with timeouts or `waitForResponse` when asserting API calls.
