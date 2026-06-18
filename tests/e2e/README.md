# Playwright E2E

Runs against the Next.js dev server (started automatically unless `PLAYWRIGHT_SKIP_WEB_SERVER` is set).

```bash
npm run test:e2e:install   # first time: Chromium browser
npm run test:e2e           # headless
npm run test:e2e:ui        # debug UI
```

Most tests **mock `/api/*`** with `page.route()` so you do not need Neon, Supabase, or Fly running.

Point at an already-running server:

```bash
set PLAYWRIGHT_SKIP_WEB_SERVER=1
set PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
npm run test:e2e
```

Authenticated dashboard flows (post-login) are not covered here; add a `global-setup` + `storageState` when you have stable test credentials.
