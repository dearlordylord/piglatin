import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

// Use the locally built binary on hosts incompatible with the npm prebuilt binary.
const binary = process.env.CRAP4TS_BIN ?? (existsSync(".tools/crap4ts") ? ".tools/crap4ts" : "crap4ts");
const result = spawnSync(binary, ["--config", "crap4ts.json"], { encoding: "utf8" });
process.stderr.write(result.stderr ?? "");
if (result.error) throw result.error;
if (result.status !== 0 && result.status !== 2) process.exit(result.status ?? 1);
JSON.parse(result.stdout); // Never save an incomplete or invalid report.
mkdirSync("reports", { recursive: true });
writeFileSync("reports/crap4ts.json", result.stdout);
console.log("Saved reports/crap4ts.json");
process.exit(result.status);
