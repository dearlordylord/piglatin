import * as Schema from "effect/Schema";
import type { ReadingState } from "./domain.ts";

export const WORD_SUFFIX = "ay";
export const LetterRole = Schema.Literals(["prefix", "stem", "preserved", "suffix"]);
export const CaseStyle = Schema.Literals(["lowercase", "title case", "uppercase", "preserved"]);
export const WordPart = Schema.Struct({ role: LetterRole, text: Schema.String });
export const WordLetter = Schema.Struct({
  sourceIndex: Schema.NullOr(Schema.Number), source: Schema.String,
  final: Schema.String, role: LetterRole,
});
export const WordPlan = Schema.Struct({
  output: Schema.String, casing: CaseStyle,
  parts: Schema.Array(WordPart), letters: Schema.Array(WordLetter),
});
export interface WordPlan extends Schema.Schema.Type<typeof WordPlan> {}

type PendingLetter = typeof WordLetter.Type;
function letters(text: string, offset: number | null, role: PendingLetter["role"]): PendingLetter[] {
  return [...text].map((source, index) => ({
    sourceIndex: offset === null ? null : offset + index,
    source, final: role === "prefix" ? source.toLowerCase() : source, role,
  }));
}

// The reducer and its explanatory trace consume this same assembly plan.
export function planWord(state: ReadingState): WordPlan {
  const stem = state.stem ?? "";
  if (state.classification.onlyDigits) {
    const output = state.prefix + stem;
    return { output, casing: "preserved", parts: [], letters: letters(output, 0, "preserved") };
  }
  const ordered = [
    ...letters(stem, state.prefix.length, "stem"),
    ...letters(state.prefix, 0, "prefix"),
    ...letters(WORD_SUFFIX, null, "suffix"),
  ];
  const base = ordered.map(letter => letter.final).join("");
  const casing = state.classification.allUppercase ? "uppercase" : state.classification.capitalized ? "title case" : "lowercase";
  const output = casing === "uppercase" ? base.toUpperCase() : casing === "title case" ? base[0].toUpperCase() + base.slice(1) : base;
  return {
    output, casing,
    parts: [{ role: "stem", text: stem }, { role: "prefix", text: state.prefix.toLowerCase() }, { role: "suffix", text: WORD_SUFFIX }],
    letters: ordered.map((letter, index) => ({ ...letter, final: output[index] })),
  };
}
