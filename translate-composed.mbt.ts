import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import * as Schema from "effect/Schema";
import { defineDriver, run, stateCheck } from "@firfi/quint-connect";
import { Character, Event } from "./domain.ts";
import { initialState, reduce, type State } from "./translate-composed.ts";

function decodeSymbol(symbol: string): Character {
  const value = symbol === "QUOTE" ? '"' : symbol === "TAB" ? "\t" : symbol === "LF" ? "\n" : symbol;
  return Character.make(value);
}

const View = Schema.Struct({ output: Schema.Array(Schema.String) });
const decodeView = Schema.decodeUnknownSync(View);

export const composedDriver = defineDriver(
  { init: {}, Character: { character: Schema.toStandardSchemaV1(Schema.String) }, End: {} },
  () => {
    let state: State = initialState();
    return {
      init: () => { state = initialState(); },
      Character: ({ character }) => {
        const value = decodeSymbol(character);
        state = reduce(state, { type: "character", value });
      },
      End: () => {
        state = reduce(state, { type: "end" });
      },
      getState: () => {
        // Observe a prefix by flushing a COPY, not by changing the running reducer.
        const output = reduce(state, { type: "end" }).output;
        return { output };
      },
      config: () => ({ statePath: ["view"] }),
    };
  },
);

export const compareView = stateCheck(
  (raw) => ({ output: decodeView(raw).output.map(decodeSymbol).join("") }),
  (expected, actual) => isDeepStrictEqual(actual, expected),
);

test("saved model counterexample preserves punctuation between numbers", () => {
  const regression = Schema.decodeUnknownSync(Schema.Struct({
    events: Schema.Array(Event), expected: Schema.String,
  }))(JSON.parse(readFileSync(resolve("reports/composed-mbt-counterexample.json"), "utf8")));
  const state = regression.events.reduce(reduce, initialState());
  assert.equal(reduce(state, { type: "end" }).output, regression.expected);
});

test("composed reducer agrees with independently generated Quint traces", async () => {
  let comparisons = 0;
  const result = await run({
    spec: resolve("translate-composed.qnt"),
    main: "translate_composed",
    quintBin: resolve("node_modules/.bin/quint"),
    backend: "typescript",
    seed: process.env.QUINT_SEED ?? "42",
    nTraces: 100,
    maxSamples: 100,
    maxSteps: 50,
    invariants: ["safety"],
    traceDir: resolve(".mbt-traces/composed"),
    driver: composedDriver,
    stateCheck: {
      ...compareView,
      compareState: (expected, actual) => {
        comparisons++;
        return compareView.compareState(expected, actual);
      },
    },
  });
  assert.equal(result.tracesReplayed, 100);
  assert.equal(comparisons, 100 * 51, "every trace must check its initial state and all 50 steps");
  console.log(`Replayed ${result.tracesReplayed} traces, ${comparisons} comparisons, seed ${result.seed}`);
});
