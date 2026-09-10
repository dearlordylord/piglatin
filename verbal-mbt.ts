import assert from "node:assert/strict";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import * as Schema from "effect/Schema";
import { TranslationInput } from "./domain.ts";
import { defineDriver, run, stateCheck } from "@firfi/quint-connect";

const Text = Schema.Array(Schema.BigInt);
const decodeText = (characters: readonly bigint[]): string => characters.map((code) => {
  assert.ok(code >= 0n && code <= 127n, "the verbal model uses ASCII character codes");
  return String.fromCharCode(Number(code));
}).join("");
const Observation = Schema.Struct({ input: Text, output: Text });
const decodeObservation = Schema.decodeUnknownSync(Observation);

// One action is one complete public call. No reducer operations or private state.
const createDriver = (translate: (text: TranslationInput) => string) => defineDriver(
  { Init: {}, Translate: { input: Schema.toStandardSchemaV1(Text) } },
  () => {
    let observation = { input: "", output: "" };
    const call = (input: string) => { observation = { input, output: translate(TranslationInput.make(input)) }; };
    return {
      Init: () => call(""),
      Translate: ({ input }) => call(decodeText(input)),
      getState: () => observation,
      config: () => ({ nondetPath: ["replayAction"], statePath: ["observation"] }),
    };
  },
);

export async function checkVerbalTranslation(
  name: string,
  translate: (text: TranslationInput) => string,
  mode: "examples" | "generated",
): Promise<void> {
  let comparisons = 0;
  const compare = stateCheck(
    (raw) => {
      const value = decodeObservation(raw);
      return { input: decodeText(value.input), output: decodeText(value.output) };
    },
    (expected, actual) => {
      comparisons++;
      return isDeepStrictEqual(expected, actual);
    },
  );
  const result = await run({
    spec: resolve(mode === "examples" ? "batch_from_verbal_test.qnt" : "batch_from_verbal.qnt"),
    main: mode === "examples" ? "batch_from_verbal_test" : "batch_from_verbal",
    quintBin: resolve("node_modules/.bin/quint"), backend: "typescript",
    seed: process.env.QUINT_SEED ?? "42",
    traceDir: resolve(process.env.TRACE_DIR ?? `.mbt-traces/verbal-${name}-${mode}`),
    driver: createDriver(translate), stateCheck: compare,
    ...(mode === "examples"
      ? { generation: { mode: "test" as const, test: "fullCorpusTest" }, maxSamples: 1 }
      : { nTraces: 100, maxSamples: 100, maxSteps: 50, invariants: ["safety"] }),
  });
  assert.equal(result.tracesReplayed, mode === "examples" ? 1 : 100);
  assert.equal(comparisons, mode === "examples" ? 33 : 5100);
  console.log(`${name}, ${mode}: ${comparisons} observations, seed ${result.seed}`);
}
