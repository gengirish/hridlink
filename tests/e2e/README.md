# Playwright E2E

Runs **`npm run dev:stack`** (Next + `api-fly` on :8080) unless `PLAYWRIGHT_SKIP_WEB_SERVER` is set. `API_UPSTREAM_URL` defaults to `http://127.0.0.1:8080` for the webServer env so rewrites match local Fly.

```bash
npm run test:e2e:install   # first time: Chromium browser
npm run test:e2e           # headless
npm run test:e2e:ui        # debug UI
```

Most tests **mock `/api/*`** with `page.route()` so you do not need Neon, Supabase, or Fly running.

When `PLAYWRIGHT_SKIP_WEB_SERVER=1`, start **`npm run dev:stack`** yourself (or Next + `api-fly` separately) and set **`API_UPSTREAM_URL=http://127.0.0.1:8080`** so rewrites resolve; then:

```bash
set PLAYWRIGHT_SKIP_WEB_SERVER=1
set PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
npm run test:e2e
```

Authenticated dashboard flows (post-login) are not covered here; add a `global-setup` + `storageState` when you have stable test credentials.
