import * as Schema from "effect/Schema";
import * as Result from "effect/Result";
import { Character, TranslationState, parseTranslationInput, type TranslationInput, type Event } from "./domain.ts";
import { initialState, reduce, decide, type State, type Decision } from "./translate.ts";
import { planWord } from "./word-plan.ts";
import { Transformation, wordFragment, preservedFragment, type Fragment, type ReadCharacter } from "./transformation.ts";

export const Step = Schema.Struct({
  state: TranslationState,
  rule: Schema.Literals(["initial", "startWord", "appendPrefix", "completeQu", "startStem", "appendStem", "finish", "leadingQuote", "trailingPunctuation"]),
  character: Schema.String,
  position: Schema.Number,
});
export interface Step extends Schema.Schema.Type<typeof Step> {}
export const Trace = Schema.Struct({
  ok: Schema.Literal(true), output: Schema.String, steps: Schema.NonEmptyArray(Step), transformation: Transformation,
});
export interface Trace extends Schema.Schema.Type<typeof Trace> {}
export const TraceResult = Schema.Union([Trace, Schema.Struct({ ok: Schema.Literal(false), error: Schema.String })]);
export type TraceResult = typeof TraceResult.Type;

function isBoundary(decision: Decision): boolean {
  return decision.kind === "finish" || decision.kind === "trailingPunctuation" || decision.kind === "leadingQuote";
}

function walkthrough(text: TranslationInput): Trace {
  let state: State = initialState();
  const steps: [Step, ...Step[]] = [{ state, rule: "initial", character: "", position: 0 }];
  const fragments: Fragment[] = [];
  let reads: ReadCharacter[] = [];
  let position = 0;
  function visit(event: Event): void {
    const before = state, decision = decide(before, event), eventIndex = steps.length;
    const read = event.type === "character" ? { source: event.value, sourceIndex: position++, event: eventIndex } : null;
    state = reduce(before, event);
    steps.push({ state, rule: decision.kind, character: read?.source ?? "END", position });
    if (!isBoundary(decision)) {
      if (read) reads.push(read);
      return;
    }
    let outputStart = before.output.length;
    if (before.kind === "prefix" || before.kind === "stem") {
      const fragment = wordFragment(planWord(before), reads, outputStart, eventIndex);
      fragments.push(fragment);
      outputStart += fragment.output.length;
      reads = [];
    }
    if (read) fragments.push(preservedFragment(read, outputStart, eventIndex));
  }
  for (const value of text) visit({ type: "character", value: Character.make(value) });
  visit({ type: "end" });
  return { ok: true, output: state.output, steps, transformation: { sourceLength: text.length, outputLength: state.output.length, fragments } };
}

export function visualize(text: unknown): TraceResult {
  const parsed = parseTranslationInput(text);
  return Result.isFailure(parsed)
    ? { ok: false as const, error: parsed.failure.message }
    : walkthrough(parsed.success);
}
