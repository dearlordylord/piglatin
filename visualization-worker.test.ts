import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "./visualization-worker.ts";

const assets = { ASSETS: { fetch: async () => new Response("asset") } };
const api = (text: unknown) => new Request("https://example.com/api", {
  method: "POST", body: JSON.stringify({ text }),
});

test("Pages API returns the translation and actual reducer trace", async () => {
  const response = await worker.fetch(api("square"), assets);
  const result = await response.json() as { output: string; steps: { rule: string; state: { output: string } }[] };
  assert.equal(response.status, 200);
  assert.equal(result.output, "aresquay");
  assert.ok(result.steps.some((step: { rule: string }) => step.rule === "completeQu"));
  assert.equal(result.steps.at(-1)?.state.output, result.output);
});

test("Pages API rejects unsupported input without a trace", async () => {
  const result = await (await worker.fetch(api("1a"), assets)).json() as { ok: boolean; error: string; steps?: unknown };
  assert.equal(result.ok, false);
  assert.match(result.error, /Mixed letters and digits/);
  assert.equal(result.steps, undefined);
});

test("Pages serves assets and handles malformed API requests", async () => {
  assert.equal(await (await worker.fetch(new Request("https://example.com/"), assets)).text(), "asset");
  const malformed = new Request("https://example.com/api", { method: "POST", body: "{" });
  assert.equal((await worker.fetch(malformed, assets)).status, 400);
  assert.equal((await worker.fetch(new Request("https://example.com/api"), assets)).status, 405);
});
