import { visualize } from "./visualization-model.ts";

type Environment = { ASSETS: { fetch(request: Request): Promise<Response> } };

export default {
  async fetch(request: Request, env: Environment): Promise<Response> {
    if (new URL(request.url).pathname !== "/api") return env.ASSETS.fetch(request);
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
    }
    try {
      const { text } = await request.json() as { text: unknown };
      return Response.json(visualize(text));
    } catch {
      return Response.json({ ok: false, error: "Unable to process request" }, { status: 400 });
    }
  },
};
