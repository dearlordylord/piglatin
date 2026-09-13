import { rm } from "node:fs/promises";
import { build } from "esbuild";
import { siteBuildOptions } from "./site-build-options.mjs";

await rm("dist/site", { recursive: true, force: true });
await build(siteBuildOptions);
console.log("Built static website in dist/site (no backend)");
