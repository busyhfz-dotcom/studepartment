import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const web = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), "provenant-gemini-test-"));
try {
  const output = join(temporary, "gemini.test.cjs");
  // Only context retrieval and counter persistence are stubbed. The actual request,
  // consent, provider, grounding and fallback orchestration run without real accounts or API calls.
  const fixture = resolve(web, "tests/fixtures/assistant-runtime.ts");
  await build({ entryPoints: [resolve(web, "tests/gemini-assistant.test.ts")], outfile: output,
    bundle: true, platform: "node", format: "cjs", tsconfig: resolve(web, "tsconfig.json"),
    alias: { "@/server/assistant/context": fixture, "@/server/security/rate-limit": fixture },
  });
  const result = spawnSync(process.execPath, ["--test", output], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(temporary, { recursive: true, force: true });
}
