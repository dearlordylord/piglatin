import * as Schema from "effect/Schema";
import { CaseStyle, LetterRole, WordPart, type WordPlan } from "./word-plan.ts";

export const MappedLetter = Schema.Struct({
  id: Schema.String, sourceIndex: Schema.NullOr(Schema.Number), outputIndex: Schema.Number,
  source: Schema.String, final: Schema.String, role: LetterRole,
  readEvent: Schema.Number, commitEvent: Schema.Number,
});
export const Fragment = Schema.Struct({
  kind: Schema.Literals(["word", "preserved"]), source: Schema.String,
  sourceStart: Schema.Number, outputStart: Schema.Number, output: Schema.String,
  commitEvent: Schema.Number, casing: CaseStyle, parts: Schema.Array(WordPart),
  letters: Schema.Array(MappedLetter),
});
export interface Fragment extends Schema.Schema.Type<typeof Fragment> {}
export const Transformation = Schema.Struct({
  sourceLength: Schema.Number, outputLength: Schema.Number, fragments: Schema.Array(Fragment),
});
export interface Transformation extends Schema.Schema.Type<typeof Transformation> {}

export type ReadCharacter = { source: string; sourceIndex: number; event: number };

export function wordFragment(plan: WordPlan, reads: readonly ReadCharacter[], outputStart: number, commitEvent: number): Fragment {
  const sourceStart = reads[0].sourceIndex;
  return {
    kind: plan.casing === "preserved" ? "preserved" : "word",
    source: reads.map(read => read.source).join(""), sourceStart, outputStart,
    output: plan.output, commitEvent, casing: plan.casing, parts: plan.parts,
    letters: plan.letters.map((letter, index) => {
      const read = letter.sourceIndex === null ? null : reads[letter.sourceIndex];
      return {
        ...letter, id: read ? `input-${read.sourceIndex}` : `generated-${outputStart + index}`,
        sourceIndex: read?.sourceIndex ?? null, outputIndex: outputStart + index,
        readEvent: read?.event ?? commitEvent, commitEvent,
      };
    }),
  };
}

export function preservedFragment(read: ReadCharacter, outputStart: number, commitEvent: number): Fragment {
  return {
    kind: "preserved", source: read.source, sourceStart: read.sourceIndex, outputStart,
    output: read.source, commitEvent, casing: "preserved", parts: [],
    letters: [{
      id: `input-${read.sourceIndex}`, sourceIndex: read.sourceIndex, outputIndex: outputStart,
      source: read.source, final: read.source, role: "preserved", readEvent: read.event, commitEvent,
    }],
  };
}
