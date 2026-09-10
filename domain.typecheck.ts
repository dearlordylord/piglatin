// These fixtures are checked by tsc, not executed by the test runner.
import { translate as original } from "./translate.ts";
import {
  Character, Prefix, Stem, Consonant, Vowel, WordCharacter,
  type Event, type PrefixState, type StemState, type TranslationState,
} from "./domain.ts";
import { initialState as initialComposed, reduce as composed, translate as composedTranslate, type Decision } from "./translate-composed.ts";

export function checkDomainBoundaries(raw: string): void {
  // @ts-expect-error Unvalidated strings cannot be character events.
  const event: Event = { type: "character", value: raw };
  // @ts-expect-error The composed reducer requires a branded character.
  composed(initialComposed(), { type: "character", value: raw });
  void event;

  const valid: Event = { type: "character", value: Character.make("q") };
  composed(initialComposed(), valid);
}

export function checkTransitionPrerequisites(prefix: PrefixState, stem: StemState): void {
  const idle = initialComposed();
  const h = Consonant.make("h");
  const e = Vowel.make("e");
  const letter = WordCharacter.make("x");

  // @ts-expect-error A prefix state cannot contain an already-started stem.
  const prefixWithStem: PrefixState = { ...prefix, stem: Stem.make("ee") };
  // @ts-expect-error A stem state cannot hold an empty, unvalidated stem.
  const emptyStem: StemState = { ...stem, stem: "" };
  // @ts-expect-error Prefix buffers must be validated nonempty prefixes.
  const emptyPrefix: PrefixState = { ...prefix, prefix: "" };
  const idleWithWord = { ...idle, prefix: Prefix.make("h") };
  // @ts-expect-error Idle states forbid word fields, even through a non-literal object.
  const invalidIdle: TranslationState = idleWithWord;
  // @ts-expect-error Starting a word requires an idle source state.
  const restart: Decision = { kind: "startWord", state: prefix, destination: "prefix", character: h };
  // @ts-expect-error Appending a prefix requires a prefix source state.
  const appendToIdle: Decision = { kind: "appendPrefix", state: idle, character: h };
  // @ts-expect-error Appending a stem requires an existing stem source state.
  const appendStemToPrefix: Decision = { kind: "appendStem", state: prefix, character: letter };
  // @ts-expect-error A vowel cannot start a consonant prefix.
  const vowelPrefix: Decision = { kind: "startWord", state: idle, destination: "prefix", character: e };
  // @ts-expect-error A normal prefix append cannot consume a vowel; qu has its own transition.
  const appendVowel: Decision = { kind: "appendPrefix", state: prefix, character: e };
  void [prefixWithStem, emptyStem, emptyPrefix, invalidIdle, restart, appendToIdle, appendStemToPrefix, vowelPrefix, appendVowel];

  const start: Decision = { kind: "startWord", state: idle, destination: "stem", character: e };
  const append: Decision = { kind: "appendStem", state: stem, character: letter };
  void [start, append];
}

export function checkParsedBoundary(raw: string): void {
  // @ts-expect-error Original translation requires parsed input.
  original(raw);
  // @ts-expect-error Composed translation requires parsed input.
  composedTranslate(raw);
}
