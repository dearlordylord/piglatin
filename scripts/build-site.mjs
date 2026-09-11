import { mkdir, copyFile, rm, writeFile } from "node:fs/promises";
import { build } from "esbuild";

await rm("dist/site", { recursive: true, force: true });
await mkdir("dist/site", { recursive: true });
await Promise.all([
  copyFile("visualization.html", "dist/site/index.html"),
  copyFile("visualization.css", "dist/site/visualization.css"),
  copyFile("visualization.js", "dist/site/visualization.js"),
]);
await build({
  entryPoints: ["visualization-worker.ts"],
  outfile: "dist/site/_worker.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2023",
  minify: true,
});
await writeFile("dist/site/_routes.json", JSON.stringify({
  version: 1, include: ["/api"], exclude: [],
}));
console.log("Built Cloudflare Pages site in dist/site");
