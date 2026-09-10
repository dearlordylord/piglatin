import assert from "node:assert/strict";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import * as Schema from "effect/Schema";
import * as Result from "effect/Result";
import { defineDriver, run, stateCheck } from "@firfi/quint-connect";

const Text = Schema.Array(Schema.BigInt);
const Reason = Schema.Struct({ tag: Schema.Literals(["MixedLettersDigits", "UnsupportedCase", "UndefinedY", "UnsupportedQ"]) });
const Problem = Schema.Union([
  Schema.Struct({ tag: Schema.Literal("NotAString") }),
  Schema.Struct({ tag: Schema.Literal("BadCharacter"), value: Schema.Struct({ index: Schema.BigInt, code: Schema.BigInt }) }),
  Schema.Struct({ tag: Schema.Literal("BadToken"), value: Schema.Struct({ token: Text, reason: Reason }) }),
]);
const Outcome = Schema.Union([
  Schema.Struct({ tag: Schema.Literal("Translated"), value: Text }),
  Schema.Struct({ tag: Schema.Literal("Rejected"), value: Problem }),
]);
const Observation = Schema.Struct({
  request: Schema.Union([
    Schema.Struct({ tag: Schema.Literal("TextInput"), value: Text }),
    Schema.Struct({ tag: Schema.Literal("NonText") }),
  ]),
  permitted: Schema.ReadonlySet(Outcome),
});
const decodeObservation = Schema.decodeUnknownSync(Observation);
const decodeOutcome = Schema.decodeUnknownSync(Outcome);
const encodeText = (text: string): bigint[] => text.split("").map(c => BigInt(c.charCodeAt(0)));
const decodeText = (units: readonly bigint[]): string => units.map(code => {
  assert.ok(code >= 0n && code <= 65535n, "trace text must contain UTF-16 code units");
  return String.fromCharCode(Number(code));
}).join("");

// Decode the current API's textual diagnostic into the model's semantic vocabulary.
// Wording/priority live in this adapter, not in the specification.
function diagnostic(message: string): typeof Problem.Type {
  if (message === "Expected string") return { tag: "NotAString" };
  const character = /^Unsupported character ("(?:[^"\\]|\\.)*") at index (\d+)$/.exec(message);
  if (character) {
    const text = Schema.decodeUnknownSync(Schema.String)(JSON.parse(character[1]));
    assert.equal(text.length, 1);
    return { tag: "BadCharacter", value: { index: BigInt(character[2]), code: BigInt(text.charCodeAt(0)) } };
  }
  const patterns = [
    [/^Mixed letters and digits are unsupported: (.*)$/, "MixedLettersDigits"],
    [/^Unsupported case style: (.*)$/, "UnsupportedCase"],
    [/^Unsupported y spelling: (.*)$/, "UndefinedY"],
    [/^Unsupported q spelling: (.*)$/, "UnsupportedQ"],
  ] as const;
  for (const [pattern, tag] of patterns) {
    const match = pattern.exec(message);
    if (match) return { tag: "BadToken", value: { token: encodeText(match[1]), reason: { tag } } };
  }
  throw new Error(`Unrecognized public diagnostic: ${message}`);
}

type Translate = (input: unknown) => Result.Result<string, { readonly message: string }>;
const nonTextExamples: readonly unknown[] = [null, 42, true, {}, [], ["hello"], undefined];
const createDriver = (translate: Translate) => defineDriver(
  { Text: { text: Schema.toStandardSchemaV1(Text) }, NonText: { representative: Schema.toStandardSchemaV1(Schema.BigInt) } },
  () => {
    let input: unknown;
    let outcome: typeof Outcome.Type;
    const call = (raw: unknown) => {
      input = raw;
      const result = translate(raw);
      outcome = decodeOutcome(Result.isSuccess(result)
        ? { tag: "Translated", value: encodeText(result.success) }
        : { tag: "Rejected", value: diagnostic(result.failure.message) });
    };
    return {
      Text: ({ text }) => call(decodeText(text)),
      NonText: ({ representative }) => {
        assert.ok(representative >= 0n && representative < BigInt(nonTextExamples.length));
        call(nonTextExamples[Number(representative)]);
      },
      // The bridge represents the actual single outcome as a singleton set.
      getState: (): typeof Observation.Type => ({
        request: typeof input === "string" ? { tag: "TextInput", value: encodeText(input) } : { tag: "NonText" },
        permitted: new Set([outcome]),
      }),
      config: () => ({ nondetPath: ["replayAction"], statePath: ["observation"] }),
    };
  },
);

export async function checkContract(name: string, translate: Translate, mode: "examples" | "generated"): Promise<void> {
  let comparisons = 0;
  let accepted = 0;
  let rejected = 0;
  const result = await run({
    spec: resolve(mode === "examples" ? "translate-contract_scenarios.qnt" : "translate-contract_harness.qnt"),
    main: mode === "examples" ? "translate_contract_scenarios" : "translate_contract_harness",
    quintBin: resolve("node_modules/.bin/quint"), backend: "typescript",
    seed: process.env.QUINT_SEED ?? "42",
    traceDir: resolve(process.env.TRACE_DIR ?? `.mbt-traces/contract-${name}-${mode}`),
    driver: createDriver(translate),
    stateCheck: stateCheck(decodeObservation, (expected, actual) => {
      comparisons++;
      assert.equal(actual.permitted.size, 1);
      const outcome = [...actual.permitted][0];
      if (outcome.tag === "Translated") accepted++; else rejected++;
      return isDeepStrictEqual(expected.request, actual.request) &&
        [...expected.permitted].some(permitted => isDeepStrictEqual(permitted, outcome));
    }),
    ...(mode === "examples"
      ? { generation: { mode: "test" as const, test: "fullContractTest" }, maxSamples: 1 }
      : { nTraces: 100, maxSamples: 100, maxSteps: 50, invariants: ["safety"] }),
  });
  assert.equal(result.tracesReplayed, mode === "examples" ? 1 : 100);
  assert.equal(comparisons, mode === "examples" ? 68 : 5100);
  assert.ok(accepted > 0 && rejected > 0, "both successful and rejected requests must be checked");
  console.log(`${name}, ${mode}: ${comparisons} comparisons (${accepted} accepted, ${rejected} rejected), seed ${result.seed}`);
}
