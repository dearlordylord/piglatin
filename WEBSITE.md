# Pig Latin website

**Canonical website: [piglatin.curatorman.com](https://piglatin.curatorman.com/).**

The site is a static TypeScript/Foldkit application. Translation, validation, and
trace generation run in the browser through a shared core library. There is no
translation API, backend, or Cloudflare Worker. After the page assets load,
changing input and scrubbing work without network access.

The transformation supplements the actual reducer trace, state diagram, and
inspector. Motion clarity is judged by a person dragging the event bar in both
directions; screenshots and numerical checks cannot establish that clarity.

## Workspace structure

This repository uses npm workspaces (`packages/*`) with one lockfile.

- `packages/core` (`@piglatin/core`): input domain, translation reducer, and trace
  generation. No browser, Foldkit, or server dependencies; usable from Node and
  the frontend. Public exports include `translate`, `translateText`, `reduce`,
  `decide`, and `visualize`, with trace schemas and types.
- `packages/frontend` (`@piglatin/frontend`): Foldkit model/messages/update/view,
  TypeScript animation calculations, HTML entry point, and CSS. It imports
  `@piglatin/core` directly.
- Root: original implementation, formal models, and historical test harnesses.
  `domain.ts` and `translate-composed.ts` remain compatibility re-exports; the
  implementation lives in the core package, not in duplicated copies.

Foldkit is pinned to `0.158.2`, matching the existing Effect `4.0.0-rc.112`
version. Upgrade them together according to Foldkit's exact peer dependency.

## Run locally

With the project's Node environment:

```sh
npm ci
npm run visualize
```

The development server builds/watches the TypeScript and CSS and serves static
files on `0.0.0.0:4324`. From outside Docker, use its reachable IP address and
port 4324; `hostname -I` lists container addresses. Set `PORT` to use another port.
Refresh the browser after edits. Restart after editing the static HTML templates.
This local asset server performs no translation or request handling for the app.

## Build and deploy

```sh
npm run build:site
npm run preview:site
```

The build bundles the frontend and shared core into `dist/site/assets`, with
`index.html` and `404.html` at the root. There is no `_worker.js` or `_routes.json`.
The preview command rebuilds and serves the files through the local Pages runtime.

Cloudflare Pages project `piglatin` is connected to GitHub repository
`dearlordylord/piglatin`, production branch `master`. Pushing to `master` triggers
the existing deployment. Check the commit's **Cloudflare Pages** GitHub check,
then verify the interface at **https://piglatin.curatorman.com/**.

`https://piglatin-5f1.pages.dev` is the provider's fallback address. An authenticated
direct deployment is also available through `npm run deploy:site`; ordinary
releases use the Git connection. Cloudflare only serves static assets.

## Animation and application architecture

```text
input message → shared core → validated trace + stable letter model
                                   ↓
scrub message → fractional position → shared layout → keyed SVG view
                       ↓
               floor(position) → event trace, diagram, inspector
```

`app.ts` defines the Schema-backed Foldkit model and pure update function.
`ChangedInput` calls the core's `visualize` synchronously. The resulting trace
already contains the semantic transformation. Invalid input produces a rejection and no animation. `Scrubbed`
changes only the position, preserving the trace and its transformation by reference.
Event and diagram selections use the same seek operation.

The core's `word-plan.ts` owns suffix insertion, rotation, preservation, and
capitalization. The reducer and explanatory trace consume the same assembly plan.
`trace.ts` records actual read and commit events while traversing reducer decisions;
it does not ask the frontend to recover boundaries from text. The trace supplies
fragments, original/final characters, source/output indices, roles, case style,
assembly parts, and event references. Both the explanation and animation consume
these facts. The introductory example outputs also come from the core.

The frontend's `transformation.ts` implements the pure
`transformationFrame(facts, time)` function. It computes geometry from the supplied
source/output indices and measured fragment lengths. It contains no tokenizer,
suffix constant, rotation rule, or capitalization classifier. Smoothstep
interpolation moves letters into lanes and then into the result at the supplied
commit event. Preserved characters travel directly as they are read; this is
visual choreography, and their actual commit events remain in the core trace.

Each frame computes shared layout before letter poses. Suffix growth shifts
subsequent words and recenters the assembly. Every letter uses those same current
coordinates, keeping its destination consistent as word lengths change. Returning
to the same event position produces the same positions and opacity values.

`view.ts` renders declarative Foldkit HTML/SVG. Keyed glyphs retain their DOM
identity during scrubbing. Lazy trace, diagram, and inspector subtrees update
only when the completed event changes. Long inputs scroll horizontally.

`entry.ts` starts the runtime and a scoped keyboard subscription. Foldkit owns DOM
patching and render scheduling. The application has no animation clocks, timers,
CSS transitions, or independently running letter animations. The only explicit
UI command waits for a render commit and keeps the selected trace row visible
inside its own scroll container; it does not control motion.

Fractional poses are explanatory choreography, not intermediate reducer states.
The complete trace supplies destinations in advance, and the inspector shows the
last completed decision.

## Verification

Run `npm run typecheck`, `npm test`, `npm run coverage`,
`npm run test:mbt:contract`, and `npm run build:site` for structural changes.
Core tests exercise direct calls rather than HTTP. Frontend tests cover message
updates, rejection recovery, reversible frames, and final glyph ordering.

In the browser, disable networking after loading the page and try new input,
scrubbing, event/diagram selection, and keyboard controls. Check long phrases on
narrow screens. Input changes and all interactions should issue zero requests.
