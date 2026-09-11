import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import * as Result from "effect/Result";
import { Character, parseTranslationInput, type TranslationInput } from "./domain.ts";
import { translate, initialState, reduce, decide, type State } from "./translate-composed.ts";

type Step = { state: State; rule: string; character: string; position: number };

function walkthrough(text: TranslationInput) {
  let state: State = initialState();
  const steps: Step[] = [{ state, rule: "initial", character: "", position: 0 }];
  let position = 0;
  for (const value of text) {
    const event = { type: "character" as const, value: Character.make(value) };
    const decision = decide(state, event);
    state = reduce(state, event);
    steps.push({ state, rule: decision.kind, character: value, position: ++position });
  }
  const event = { type: "end" as const };
  const decision = decide(state, event);
  state = reduce(state, event);
  steps.push({ state, rule: decision.kind, character: "END", position });
  return { ok: true, output: translate(text), steps };
}

const assets = new Map([
  ["/", ["visualization.html", "text/html; charset=utf-8"]],
  ["/visualization.css", ["visualization.css", "text/css; charset=utf-8"]],
  ["/visualization.js", ["visualization.js", "text/javascript; charset=utf-8"]],
]);
const port = Number(process.env.PORT ?? 4324);

createServer(async (request, response) => {
  try {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    if (path === "/api" && request.method === "POST") {
      let body = "";
      for await (const chunk of request) body += chunk;
      const { text } = JSON.parse(body);
      const parsed = parseTranslationInput(text);
      const result = Result.isFailure(parsed)
        ? { ok: false, error: parsed.failure.message }
        : walkthrough(parsed.success);
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(result));
      return;
    }
    const asset = assets.get(path);
    if (asset && request.method === "GET") {
      const [file, contentType] = asset;
      response.setHeader("Content-Type", contentType);
      response.end(await readFile(new URL(file, import.meta.url)));
      return;
    }
    response.writeHead(404);
    response.end("Not found");
  } catch {
    response.writeHead(400);
    response.end("Unable to process request");
  }
}).listen(port, "0.0.0.0", () => console.log(`Visualization: http://0.0.0.0:${port}`));
