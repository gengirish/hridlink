# End-to-end tests (Playwright)

Specs live in this folder. From the repo root:

```bash
npm run test:e2e
```

By default `playwright.config.ts` starts **`npm run dev:stack`** (Next.js + Fly API) so `/api/*` rewrites match production. If nothing is listening on `PLAYWRIGHT_BASE_URL` (default `http://127.0.0.1:3000`), tests fail with `ERR_CONNECTION_REFUSED`.

To use an already-running server:

```powershell
$env:PLAYWRIGHT_SKIP_WEB_SERVER="1"
npm run test:e2e
```

Most specs use **route mocks** for `/api/patients` and `/api/ecg` so they stay deterministic without a seeded DB.

**Selector gotcha:** `getByLabel("Age")` can also match **Village** (`"Vill**age**"`). Prefer `getByRole("spinbutton", { name: "Age" })` or `getByLabel("Age", { exact: true })`.
