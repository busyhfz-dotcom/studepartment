import { build } from "esbuild";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = process.argv[2];
if (!output) throw new Error("Pass an output path ending in index.mjs.");

await build({
  absWorkingDir: root,
  entryPoints: [resolve(root, "apps/web/src/server/opportunities/sources/neon-function.ts")],
  tsconfig: resolve(root, "apps/web/tsconfig.json"),
  outfile: output,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node24",
  minify: true,
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
});
