import * as esbuild from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  entryPoints: [join(root, "src/index.ts")],
  outfile: join(root, "dist/index.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  logLevel: "info",
});

console.log("Built @getyourboat/shared -> dist/index.js");
