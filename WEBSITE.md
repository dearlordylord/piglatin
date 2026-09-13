# Pig Latin website

**Canonical website: [piglatin.curatorman.com](https://piglatin.curatorman.com/).**

The site combines an input-to-output letter transformation, the actual reducer
trace, an observed state diagram, and a state inspector. Dragging the event bar
in either direction controls continuous motion; event buttons select exact
reducer decisions. Motion supplements the events. Its clarity is judged by a
person scrubbing the bar, not by screenshots or numerical checks alone.

## Run locally

With the project's Node environment and dependencies installed:

```sh
npm run visualize
```

The server binds to `0.0.0.0:4324`. From outside Docker, use the container's
reachable IP address and port 4324; `hostname -I` lists its addresses. Set `PORT`
to use another port. The server serves the interface and handles `POST /api`.

## Build and deploy

```sh
npm run build:site
npm run preview:site
```

The build writes static assets and a bundled Cloudflare Worker to `dist/site`.
The preview command rebuilds and starts the local Cloudflare Pages runtime.
`visualization-worker.ts` handles `/api`; all other requests use static assets.
Both the Worker and local Node server call `visualization-model.ts` to validate
input and produce the translation and reducer trace.

Cloudflare Pages project `piglatin` is connected to GitHub repository
`dearlordylord/piglatin`, production branch `master`. Pushing to `master` triggers
a deployment. Check the commit's **Cloudflare Pages** GitHub check, then verify
the interface and API at **https://piglatin.curatorman.com/**.

`https://piglatin-5f1.pages.dev` is the provider's fallback address, not the
canonical website. An authenticated direct deployment is also available through
`npm run deploy:site`; ordinary releases use the Git connection.

## Animation architecture

The browser uses JavaScript and SVG with no animation library. The pipeline is:

```text
input → validated reducer trace → stable letter model
                                      ↓
fractional event position → shared layout → letter poses → SVG attributes
             ↓
     last completed event → trace, diagram, and state inspector
```

`compileTransformation(source, trace)` in `transformation-view.js` runs when a
new trace arrives. It assigns stable identities to input letters and generated
suffix letters. The reducer's final prefix state determines the split; the actual
translated output supplies each letter's final character and capitalization.

`transformationFrame(model, time)` is a pure function. An event position such as
`3.5` means halfway between decisions 3 and 4. Smoothstep interpolation moves
letters from the input row into prefix/stem lanes, then into the result at the
word boundary. Added suffix letters fade and move into place at commitment;
case restoration crossfades between the original and final glyphs.

Each frame computes shared layout first. Suffix insertion increases word width,
shifts subsequent word positions, and recenters the assembly. Every letter's
position derives from those same current coordinates, so destinations remain
consistent while layout changes. Long inputs scroll horizontally.

`createTransformationView` owns the DOM adapter. It creates SVG glyph nodes once
per trace and updates their positions and opacity during scrubbing. It wires the
range input and event ticks to a seek callback in `visualization.js`. That callback
uses `floor(time)` for the inspector and updates the fractional animation pose
without rebuilding the trace for every movement within one event interval.
Existing event buttons also synchronize the animation to integer positions.

There are no animation timers, CSS transitions, or independently running letter
animations. Returning to the same position produces the same frame. DOM updates
remain imperative at the rendering boundary; the motion and layout calculations
are functional. This is not a reactive-library dependency.

Fractional poses are explanatory choreography, not intermediate reducer states.
The complete trace supplies destinations in advance. The inspector always shows
an actual completed decision.

## Verification

Run `npm run typecheck`, `npm test`, and `npm run build:site`. For interface changes,
check the deployed site in a browser: scrub both directions, select event rows,
use keyboard controls, try rejected input followed by accepted input, and inspect
long phrases on narrow screens. Final letter order should match the API output.
Human evaluation while dragging remains necessary for judging motion clarity.
