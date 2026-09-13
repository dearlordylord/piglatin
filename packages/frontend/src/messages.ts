import { Schema } from "effect";
import { defineMessageUnion } from "foldkit/message";

export const Message = defineMessageUnion({
  ChangedInput: { value: Schema.String },
  Scrubbed: { position: Schema.Number },
  Stepped: { direction: Schema.Number },
  SelectedState: { kind: Schema.Literals(["leading", "prefix", "stem", "trailingPunctuation"]) },
  Restarted: {},
  JumpedToResult: {},
  ScrolledTrace: {},
});
export type Message = typeof Message.Type;
