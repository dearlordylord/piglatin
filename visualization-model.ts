import * as Result from "effect/Result";
import { Character, parseTranslationInput, type TranslationInput } from "./domain.ts";
import { translate, initialState, reduce, decide, type State } from "./translate-composed.ts";

type Step = { state: State; rule: string; character: string; position: number };

function walkthrough(text: TranslationInput) {
  let state: State = initialState();
  const steps: Step[] = [{ state, rule: "initial", character: "", position: 0 }];
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
  return { ok: true, output: translate(text), steps };
}

export function visualize(text: unknown) {
  const parsed = parseTranslationInput(text);
  return Result.isFailure(parsed)
    ? { ok: false, error: parsed.failure.message }
    : walkthrough(parsed.success);
}
