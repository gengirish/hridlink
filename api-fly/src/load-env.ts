import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

/** Strip BOM / CRLF pasted from Windows editors or Vercel env UI. */
function sanitizeEnvValue(val: string | undefined): string | undefined {
  if (val == null) return undefined;
  const cleaned = val.replace(/^\uFEFF/, "").replace(/\u200b/g, "").replace(/\r/g, "").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function loadEnvFile(filePath: string, override: boolean) {
  const result = config({ path: filePath, override });
  if (!result.parsed) return;
  for (const key of Object.keys(result.parsed)) {
    const cleaned = sanitizeEnvValue(result.parsed[key]);
    if (cleaned !== undefined) process.env[key] = cleaned;
    else delete process.env[key];
  }
}

/** Repo root (works from `src/` in dev and `dist/` after `tsc`). */
const here = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(here, "../..");
loadEnvFile(path.join(monorepoRoot, ".env"), false);
loadEnvFile(path.join(monorepoRoot, ".env.local"), true);
