import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createInstrumenter } from "istanbul-lib-instrument";

const directory = resolve("coverage/instrumented");
rmSync(directory, { recursive: true, force: true });
mkdirSync(directory, { recursive: true });
const artifact = resolve("coverage/coverage-final.json");
rmSync(artifact, { force: true });
const config = JSON.parse(readFileSync("crap4ts.json", "utf8"));
for (const source of config.sources) {
  const instrumenter = createInstrumenter({
    esModules: true,
    parserPlugins: ["typescript"],
    compact: false,
  });
  writeFileSync(`${directory}/${source}`, instrumenter.instrumentSync(readFileSync(source, "utf8"), resolve(source)));
}
// Keep all suites in the same test process so they contribute to one counter artifact.
writeFileSync(`${directory}/domain.test.ts`, readFileSync("domain.test.ts"));
writeFileSync(`${directory}/reducer.test.ts`, readFileSync("reducer.test.ts"));
writeFileSync(`${directory}/translate.test.ts`, 'import "./domain.test.ts";\nimport "./reducer.test.ts";\n' + readFileSync("translate.test.ts", "utf8"));
writeFileSync(`${directory}/capture.mjs`, `
import { writeFileSync } from "node:fs";
process.on("exit", () => {
  if (globalThis.__coverage__) {
    writeFileSync(${JSON.stringify(artifact)}, JSON.stringify(globalThis.__coverage__, null, 2));
  }
});
`);
const result = spawnSync(process.execPath, ["--import", `${directory}/capture.mjs`, "--test", `${directory}/translate.test.ts`], { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
