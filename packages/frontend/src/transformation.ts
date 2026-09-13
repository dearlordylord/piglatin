import { Schema } from "effect";
import type { Trace } from "@piglatin/core";

const Token = Schema.Struct({ start: Schema.Number, length: Schema.Number, word: Schema.Boolean, commit: Schema.Number });
const Glyph = Schema.Struct({
  id: Schema.String, tokenIndex: Schema.Number, index: Schema.Number,
  source: Schema.String, final: Schema.String, destination: Schema.Number,
  role: Schema.Literals(["prefix", "stem", "preserved", "suffix"]), read: Schema.Number,
});
export const TransformationModel = Schema.Struct({
  tokens: Schema.Array(Token), glyphs: Schema.Array(Glyph), sourceLength: Schema.Number, width: Schema.Number,
});
export interface TransformationModel extends Schema.Schema.Type<typeof TransformationModel> {}

// The user's drag is time. Frames are pure functions of trace and event position;
// perceptual clarity must be evaluated by watching motion while scrubbing.
const pitch = 34;
const suffix = 'ay';
export const visible = (c: string) => ({ ' ': '␠', '\t': '⇥', '\n': '↵' }[c] ?? c);
const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function compileTransformation(source: string, trace: Trace): TransformationModel {
  const tokens: Array<typeof Token.Type> = [], glyphs: Array<typeof Glyph.Type> = [];
  let outputOffset = 0;
  // Accepted input contains ASCII words, digit runs, and preserved separators.
  for (const match of source.matchAll(/[a-zA-Z0-9]+|[^a-zA-Z0-9]/g)) {
    const raw = match[0], start = match.index, end = start + raw.length;
    const word = /^[a-zA-Z]+$/.test(raw);
    const cut = word ? (trace.steps[end].state.prefix ?? '').length : 0;
    const tokenIndex = tokens.length;
    tokens.push({ start, length: raw.length, word, commit: end + 1 });
    for (let i = 0; i < raw.length; i++) {
      const destination = word ? (i < cut ? raw.length - cut + i : i - cut) : i;
      glyphs.push({
        id: `input-${start + i}`, tokenIndex, index: i, source: raw[i],
        final: trace.output[outputOffset + destination], destination,
        role: word ? (i < cut ? 'prefix' : 'stem') : 'preserved', read: start + i + 1,
      });
    }
    if (word) for (let i = 0; i < suffix.length; i++) {
      glyphs.push({
        id: `suffix-${start}-${i}`, tokenIndex, index: i, source: suffix[i],
        final: trace.output[outputOffset + raw.length + i], destination: raw.length + i,
        role: 'suffix', read: end + 1,
      });
    }
    outputOffset += raw.length + (word ? suffix.length : 0);
  }
  return { tokens, glyphs, sourceLength: source.length, width: Math.max(360, trace.output.length * pitch + 100) };
}

export function transformationFrame(model: TransformationModel, time: number) {
  // Recompute shared layout before trajectories: suffix growth changes every
  // downstream destination, including destinations of letters still in flight.
  let added = 0;
  const offsets = model.tokens.map(token => {
    const offset = token.start + added;
    added += token.word ? suffix.length * ease(time - (token.commit - 1)) : 0;
    return offset;
  });
  const left = (model.width - (model.sourceLength + added) * pitch) / 2 + pitch / 2;
  const sourceLeft = (model.width - model.sourceLength * pitch) / 2 + pitch / 2;
  return model.glyphs.map(glyph => {
    const token = model.tokens[glyph.tokenIndex];
    const commit = ease(time - ((token.word ? token.commit : glyph.read) - 1));
    const sourceX = sourceLeft + (token.start + glyph.index) * pitch;
    const targetX = left + (offsets[glyph.tokenIndex] + glyph.destination) * pitch;
    if (glyph.role === 'suffix') {
      return { x: targetX, y: mix(340, 295, commit), opacity: commit, caseProgress: commit, sourceX };
    }
    const read = ease(time - (glyph.read - 1));
    const laneX = left + (offsets[glyph.tokenIndex] + (glyph.role === 'prefix' ? glyph.index : glyph.destination)) * pitch;
    const laneY = glyph.role === 'prefix' ? 135 : glyph.role === 'stem' ? 215 : 295;
    return {
      x: mix(mix(sourceX, laneX, read), targetX, commit),
      y: mix(mix(65, laneY, read), 295, commit),
      opacity: 1, caseProgress: commit, sourceX,
    };
  });
}
