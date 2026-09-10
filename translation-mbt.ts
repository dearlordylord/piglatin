import assert from "node:assert/strict";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import * as Schema from "effect/Schema";
import { TranslationInput } from "./domain.ts";
import { defineDriver, run, stateCheck } from "@firfi/quint-connect";

// The allowed existing driver supplied the connector API pattern (not the oracle).
const decodeSymbol = (symbol: string): string =>
  ({ QUOTE: '"', TAB: "\t", LF: "\n" })[symbol] ?? symbol;
const decodeText = (symbols: readonly string[]): string => symbols.map(decodeSymbol).join("");
const View = Schema.Struct({ input: Schema.Array(Schema.String), output: Schema.Array(Schema.String) });
const decodeView = Schema.decodeUnknownSync(View);
export const createBatchDriver = (translate: (text: TranslationInput) => string) => defineDriver(
  {
    init: {},
    Append: { character: Schema.toStandardSchemaV1(Schema.String) },
    Clear: {},
    Sample: { input: Schema.toStandardSchemaV1(Schema.Array(Schema.String)) },
  },
  () => {
    let input = "";
    return {
      init: () => { input = ""; },
      Append: ({ character }) => { input += decodeSymbol(character); },
      Clear: () => { input = ""; },
      Sample: ({ input: symbols }) => { input = decodeText(symbols); },
      getState: () => ({ input, output: translate(TranslationInput.make(input)) }),
      config: () => ({ statePath: ["view"] }),
    };
  },
);
const compareView = stateCheck(
  (raw) => {
    const view = decodeView(raw);
    return { input: decodeText(view.input), output: decodeText(view.output) };
  },
  (expected, actual) => isDeepStrictEqual(actual, expected),
);

export async function checkTranslation(name: string, translate: (text: TranslationInput) => string): Promise<void> {
  let comparisons = 0;
  const result = await run({
    spec: resolve("translate-original.qnt"), main: "translate_original",
    quintBin: resolve("node_modules/.bin/quint"), backend: "typescript",
    seed: process.env.QUINT_SEED ?? "42", nTraces: 100, maxSamples: 100, maxSteps: 50,
    invariants: ["safety"], traceDir: resolve(process.env.TRACE_DIR ?? `.mbt-traces/shared-${name}`),
    driver: createBatchDriver(translate),
    stateCheck: {
      ...compareView,
      compareState: (expected, actual) => {
        comparisons++;
        return compareView.compareState(expected, actual);
      },
    },
  });
  assert.equal(result.tracesReplayed, 100);
  assert.equal(comparisons, 5100);
  console.log(`${name}: replayed ${result.tracesReplayed} traces, ${comparisons} observations, seed ${result.seed}`);
}
