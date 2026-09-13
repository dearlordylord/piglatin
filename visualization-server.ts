import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { visualize } from "./visualization-model.ts";

const assets = new Map([
  ["/", ["visualization.html", "text/html; charset=utf-8"]],
  ["/visualization.css", ["visualization.css", "text/css; charset=utf-8"]],
  ["/visualization.js", ["visualization.js", "text/javascript; charset=utf-8"]],
  ["/transformation-view.js", ["transformation-view.js", "text/javascript; charset=utf-8"]],
]);
const port = Number(process.env.PORT ?? 4324);

createServer(async (request, response) => {
  try {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    if (path === "/api" && request.method === "POST") {
      let body = "";
      for await (const chunk of request) body += chunk;
      const { text } = JSON.parse(body);
      const result = visualize(text);
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
