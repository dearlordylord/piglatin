import type { Transformation } from "@piglatin/core";

// The user's drag is time. Core supplies identities, roles, destinations, and
// events; this module chooses only geometry, easing, and visual choreography.
const pitch = 34;
export const canvasWidth = (facts: Transformation) => Math.max(360, facts.outputLength * pitch + 100);
export const visible = (c: string) => ({ ' ': '␠', '\t': '⇥', '\n': '↵' }[c] ?? c);
const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function transformationFrame(facts: Transformation, time: number) {
  let added = 0;
  const offsets = facts.fragments.map(fragment => {
    const offset = fragment.sourceStart + added;
    added += (fragment.output.length - fragment.source.length) * ease(time - (fragment.commitEvent - 1));
    return offset;
  });
  const width = canvasWidth(facts);
  const left = (width - (facts.sourceLength + added) * pitch) / 2 + pitch / 2;
  const sourceLeft = (width - facts.sourceLength * pitch) / 2 + pitch / 2;
  return facts.fragments.flatMap((fragment, fragmentIndex) => fragment.letters.map(letter => {
    // Preserved characters travel directly to the output as they are read;
    // transforming letters wait in their lanes for the core's commit event.
    const arrival = letter.role === "preserved" ? letter.readEvent : letter.commitEvent;
    const commit = ease(time - (arrival - 1));
    const sourceX = sourceLeft + (letter.sourceIndex ?? fragment.sourceStart) * pitch;
    const localDestination = letter.outputIndex - fragment.outputStart;
    const targetX = left + (offsets[fragmentIndex] + localDestination) * pitch;
    if (letter.sourceIndex === null) {
      return { letter, x: targetX, y: mix(340, 295, commit), opacity: commit, caseProgress: commit, sourceX };
    }
    const read = ease(time - (letter.readEvent - 1));
    const laneIndex = letter.role === "prefix" ? letter.sourceIndex - fragment.sourceStart : localDestination;
    const laneX = left + (offsets[fragmentIndex] + laneIndex) * pitch;
    const laneY = letter.role === "prefix" ? 135 : letter.role === "stem" ? 215 : 295;
    return {
      letter, x: mix(mix(sourceX, laneX, read), targetX, commit),
      y: mix(mix(65, laneY, read), 295, commit),
      opacity: 1, caseProgress: commit, sourceX,
    };
  }));
}
