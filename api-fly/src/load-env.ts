import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

/** Repo root (works from `src/` in dev and `dist/` after `tsc`). */
const here = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(here, "../..");
config({ path: path.join(monorepoRoot, ".env") });
config({ path: path.join(monorepoRoot, ".env.local"), override: true });
