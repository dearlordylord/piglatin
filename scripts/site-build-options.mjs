import { copyFile, mkdir } from "node:fs/promises";

export const siteBuildOptions = {
  entryPoints: ["packages/frontend/src/entry.ts"],
  outfile: "dist/site/assets/app.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2023",
  minify: true,
  plugins: [{
    name: "static-pages",
    setup(build) {
      build.onStart(async () => {
        await mkdir("dist/site", { recursive: true });
        await Promise.all([
          copyFile("packages/frontend/index.html", "dist/site/index.html"),
          copyFile("packages/frontend/404.html", "dist/site/404.html"),
        ]);
      });
    },
  }],
};
