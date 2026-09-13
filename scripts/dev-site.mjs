import { rm } from "node:fs/promises";
import { context } from "esbuild";
import { siteBuildOptions } from "./site-build-options.mjs";

await rm("dist/site", { recursive: true, force: true });
const builder = await context({ ...siteBuildOptions, minify: false, sourcemap: true });
await builder.watch();
const { port } = await builder.serve({ servedir: "dist/site", host: "0.0.0.0", port: Number(process.env.PORT ?? 4324) });
console.log(`Static frontend: http://0.0.0.0:${port}`);
