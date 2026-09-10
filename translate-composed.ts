import {
  withParsedInput, type TranslationInput, Character, WordCharacter, Consonant, Vowel, Prefix, Stem,
  isConsonant, isVowel, isUCharacter, isQPrefix,
  type Event, type Classification, type TranslationState,
  type LeadingState, type IdleState, type PrefixState, type QPrefixState,
  type StemState, type ReadingState, type UCharacter,
} from "./domain.ts";
export type { Event } from "./domain.ts";
export type State = TranslationState;

// Each decision carries its own narrowed source state. There is no separate state
// argument at application time that could disagree with that prerequisite.
export type Decision =
  | { kind: "finish"; state: State; separator: string }
  | { kind: "leadingQuote"; state: LeadingState; character: Character }
  | { kind: "trailingPunctuation"; state: State; character: Character }
  | { kind: "startWord"; state: IdleState; destination: "prefix"; character: Consonant }
  | { kind: "startWord"; state: IdleState; destination: "stem"; character: Vowel }
  | { kind: "appendPrefix"; state: PrefixState; character: Consonant }
  | { kind: "completeQu"; state: QPrefixState; character: UCharacter }
  | { kind: "startStem"; state: PrefixState; character: Vowel }
  | { kind: "appendStem"; state: StemState; character: WordCharacter };
type Rule = (state: State, event: Event) => Decision | undefined;
type Decider = (state: State, event: Event) => Decision;
type Observer<Value> = (value: Value, character: WordCharacter) => Value;
type ObservedClassification = Pick<Classification, "allUppercase" | "onlyDigits">;

export function initialState(output = ""): LeadingState {
  return { kind: "leading", output };
}

function firstMatch(fallback: Decider, ...rules: Rule[]): Decider {
  return (state, event) => {
    for (const rule of rules) {
      const decision = rule(state, event);
      if (decision !== undefined) return decision;
    }
    return fallback(state, event);
  };
}

const whitespace: Rule = (state, event) => {
  if (event.type === "character" && /\s/.test(event.value)) {
    return { kind: "finish", state, separator: event.value };
  }
};
const leadingQuote: Rule = (state, event) => {
  if (event.type === "character" && event.value === '"' && state.kind === "leading") {
    return { kind: "leadingQuote", state, character: event.value };
  }
};
const trailingPunctuation: Rule = (state, event) => {
  if (event.type === "character" && ',!?"'.includes(event.value)) {
    return { kind: "trailingPunctuation", state, character: event.value };
  }
};
const quContinuation: Rule = (state, event) => {
  if (event.type !== "character" || state.kind !== "prefix") return;
  if (isQPrefix(state.prefix) && isUCharacter(event.value)) {
    return { kind: "completeQu", state: { ...state, prefix: state.prefix }, character: event.value };
  }
};

// General word transitions, after boundary and special-prefix rules.
const fallback: Decider = (state, event): Decision => {
  switch (event.type) {
    case "end":
      return { kind: "finish", state, separator: "" };
    case "character": {
      const character = WordCharacter.make(event.value);
      return decideWordCharacter(state, character);
    }
  }
};
function decideWordCharacter(state: State, character: WordCharacter): Decision {
  switch (state.kind) {
    case "leading":
    case "trailingPunctuation":
      return isVowel(character)
        ? { kind: "startWord", state, destination: "stem", character }
        : { kind: "startWord", state, destination: "prefix", character: Consonant.make(character) };
    case "prefix":
      return isConsonant(character)
        ? { kind: "appendPrefix", state, character }
        : { kind: "startStem", state, character: Vowel.make(character) };
    case "stem":
      return { kind: "appendStem", state, character };
  }
}
const decide = firstMatch(fallback, whitespace, leadingQuote, trailingPunctuation, quContinuation);

function composeObservers(...observers: Observer<ObservedClassification>[]): Observer<ObservedClassification> {
  return (classification, character) => observers.reduce((current, observe) => observe(current, character), classification);
}
function observeField<Key extends keyof ObservedClassification>(
  key: Key,
  observe: Observer<ObservedClassification[Key]>,
): Observer<ObservedClassification> {
  return (classification, character) => ({ ...classification, [key]: observe(classification[key], character) });
}
const trackUppercase: Observer<boolean> = (allUppercase, character) =>
  allUppercase && character === character.toUpperCase();
const trackDigits: Observer<boolean> = (onlyDigits, character) => onlyDigits && /\d/.test(character);
const observeCharacter = composeObservers(
  observeField("allUppercase", trackUppercase),
  observeField("onlyDigits", trackDigits),
);
function classifyFirst(character: WordCharacter): Classification {
  return {
    capitalized: character !== character.toLowerCase(),
    allUppercase: trackUppercase(true, character),
    onlyDigits: trackDigits(true, character),
  };
}
function classifyNext(state: ReadingState, character: WordCharacter): Classification {
  return { ...state.classification, ...observeCharacter(state.classification, character) };
}

function appendPrefix(state: PrefixState, character: Consonant): PrefixState {
  return { ...state, prefix: Prefix.make(state.prefix + character), classification: classifyNext(state, character) };
}
function completeQu(state: QPrefixState, character: UCharacter): PrefixState {
  return { ...state, prefix: Prefix.make(state.prefix + character), classification: classifyNext(state, character) };
}
function startStem(state: PrefixState, character: Vowel): StemState {
  return {
    kind: "stem", output: state.output, prefix: state.prefix,
    stem: Stem.make(character), classification: classifyNext(state, character),
  };
}
function appendStem(state: StemState, character: WordCharacter): StemState {
  return { ...state, stem: Stem.make(state.stem + character), classification: classifyNext(state, character) };
}
function finishWord(state: State): string {
  if (state.kind === "leading" || state.kind === "trailingPunctuation") return "";
  const stem = state.kind === "stem" ? state.stem : "";
  if (state.classification.onlyDigits) return state.prefix + stem;
  const translated = stem + state.prefix.toLowerCase() + "ay";
  if (state.classification.allUppercase) return translated.toUpperCase();
  if (state.classification.capitalized) return translated[0].toUpperCase() + translated.slice(1);
  return translated;
}

function applyDecision(decision: Decision): State {
  switch (decision.kind) {
    case "finish":
      return initialState(decision.state.output + finishWord(decision.state) + decision.separator);
    case "leadingQuote":
      return { ...decision.state, output: decision.state.output + decision.character };
    case "trailingPunctuation":
      return { kind: "trailingPunctuation", output: decision.state.output + finishWord(decision.state) + decision.character };
    default:
      return applyWordDecision(decision);
  }
}

type WordDecision = Exclude<Decision, { kind: "finish" | "leadingQuote" | "trailingPunctuation" }>;
function applyWordDecision(decision: WordDecision): ReadingState {
  switch (decision.kind) {
    case "startWord": {
      const classification = classifyFirst(decision.character);
      if (decision.destination === "prefix") {
        return { kind: "prefix", output: decision.state.output, prefix: Prefix.make(decision.character), classification };
      }
      return { kind: "stem", output: decision.state.output, prefix: "", stem: Stem.make(decision.character), classification };
    }
    case "appendPrefix":
      return appendPrefix(decision.state, decision.character);
    case "completeQu":
      return completeQu(decision.state, decision.character);
    case "startStem":
      return startStem(decision.state, decision.character);
    case "appendStem":
      return appendStem(decision.state, decision.character);
  }
}

export function reduce(state: State, event: Event): State {
  return applyDecision(decide(state, event));
}

export function translate(text: TranslationInput): string {
  let state: State = initialState();
  for (const value of text) state = reduce(state, { type: "character", value: Character.make(value) });
  return reduce(state, { type: "end" }).output;
}

export const translateText = withParsedInput(translate);
