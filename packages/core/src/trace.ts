import * as Schema from "effect/Schema";
import * as Result from "effect/Result";
import { Character, TranslationState, parseTranslationInput, type TranslationInput } from "./domain.ts";
import { translate, initialState, reduce, decide, type State } from "./translate.ts";

export const Step = Schema.Struct({
  state: TranslationState,
  rule: Schema.Literals(["initial", "startWord", "appendPrefix", "completeQu", "startStem", "appendStem", "finish", "leadingQuote", "trailingPunctuation"]),
  character: Schema.String,
  position: Schema.Number,
});
export interface Step extends Schema.Schema.Type<typeof Step> {}
export const Trace = Schema.Struct({ ok: Schema.Literal(true), output: Schema.String, steps: Schema.NonEmptyArray(Step) });
export interface Trace extends Schema.Schema.Type<typeof Trace> {}
export const TraceResult = Schema.Union([Trace, Schema.Struct({ ok: Schema.Literal(false), error: Schema.String })]);
export type TraceResult = typeof TraceResult.Type;

function walkthrough(text: TranslationInput): Trace {
  let state: State = initialState();
  const steps: [Step, ...Step[]] = [{ state, rule: "initial", character: "", position: 0 }];
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
  return { ok: true as const, output: translate(text), steps };
}

export function visualize(text: unknown): TraceResult {
  const parsed = parseTranslationInput(text);
  return Result.isFailure(parsed)
    ? { ok: false as const, error: parsed.failure.message }
    : walkthrough(parsed.success);
}
