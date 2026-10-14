import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = new URL("../", import.meta.url);
const require = createRequire(new URL("packages/db/package.json", root));
const tests = readdirSync(new URL("apps/web/tests/", root)).filter((name) => name.endsWith(".test.ts"));
const result = spawnSync(process.execPath, ["--import", pathToFileURL(require.resolve("tsx")).href, "--test", ...tests.map((name) => fileURLToPath(new URL("apps/web/tests/" + name, root)))], { stdio: "inherit", env: { ...process.env, TSX_TSCONFIG_PATH: fileURLToPath(new URL("apps/web/tsconfig.json", root)) } });
process.exit(result.status ?? 1);
