import * as Schema from "effect/Schema";
import * as Result from "effect/Result";

export const Character = Schema.String.check(Schema.isPattern(/^.$/su)).pipe(Schema.brand("Character"));
export type Character = typeof Character.Type;

// Recursive punctuation removal can leave an empty fragment.
export const TokenFragment = Schema.String.check(Schema.isPattern(/^\S*$/u)).pipe(Schema.brand("TokenFragment"));
export type TokenFragment = typeof TokenFragment.Type;

export const DigitSequence = TokenFragment.check(Schema.isPattern(/^\d+$/)).pipe(Schema.brand("DigitSequence"));
export type DigitSequence = typeof DigitSequence.Type;
export const isDigitSequence = Schema.is(DigitSequence);

export const Event = Schema.Union([
  Schema.Struct({ type: Schema.Literal("character"), value: Character }),
  Schema.Struct({ type: Schema.Literal("end") }),
]);
export type Event = typeof Event.Type;

// Character categories used to select valid word transitions.
export const WordCharacter = Character.check(Schema.isPattern(/^[^\s,!?"]$/u)).pipe(Schema.brand("WordCharacter"));
export type WordCharacter = typeof WordCharacter.Type;
export const Vowel = WordCharacter.check(Schema.isPattern(/^[aeiou]$/i)).pipe(Schema.brand("Vowel"));
export type Vowel = typeof Vowel.Type;
export const Consonant = WordCharacter.check(Schema.isPattern(/^[^aeiou]$/i)).pipe(Schema.brand("Consonant"));
export type Consonant = typeof Consonant.Type;
export const UCharacter = Vowel.check(Schema.isPattern(/^u$/i)).pipe(Schema.brand("UCharacter"));
export type UCharacter = typeof UCharacter.Type;
export const isVowel = Schema.is(Vowel);
export const isConsonant = Schema.is(Consonant);
export const isUCharacter = Schema.is(UCharacter);

export const Prefix = Schema.String.check(Schema.isPattern(/^(?:qu|[^aeiou\s,!?"])+$/iu)).pipe(Schema.brand("Prefix"));
export type Prefix = typeof Prefix.Type;
export const QPrefix = Prefix.check(Schema.isPattern(/q$/i)).pipe(Schema.brand("QPrefix"));
export type QPrefix = typeof QPrefix.Type;
export const isQPrefix = Schema.is(QPrefix);
export const Stem = Schema.String.check(Schema.isPattern(/^[aeiou][^\s,!?"]*$/iu)).pipe(Schema.brand("Stem"));
export type Stem = typeof Stem.Type;

export type Classification = Readonly<{
  capitalized: boolean;
  allUppercase: boolean;
  onlyDigits: boolean;
}>;

type NoWord = Readonly<{ prefix?: never; stem?: never; classification?: never }>;
export type LeadingState = Readonly<{ kind: "leading"; output: string }> & NoWord;
export type PunctuationState = Readonly<{ kind: "trailingPunctuation"; output: string }> & NoWord;
export type IdleState = LeadingState | PunctuationState;
export type PrefixState = Readonly<{
  kind: "prefix";
  output: string;
  prefix: Prefix;
  stem?: never;
  classification: Classification;
}>;
export type QPrefixState = PrefixState & Readonly<{ prefix: QPrefix }>;
export type StemState = Readonly<{
  kind: "stem";
  output: string;
  prefix: Prefix | "";
  stem: Stem;
  classification: Classification;
}>;
export type ReadingState = PrefixState | StemState;
export type TranslationState = IdleState | ReadingState;

// Shared runtime schema for consumers that keep reducer traces in their model.
const ClassificationSchema = Schema.Struct({
  capitalized: Schema.Boolean, allUppercase: Schema.Boolean, onlyDigits: Schema.Boolean,
});
export const TranslationState: Schema.Schema<TranslationState> = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("leading"), output: Schema.String }),
  Schema.Struct({ kind: Schema.Literal("trailingPunctuation"), output: Schema.String }),
  Schema.Struct({ kind: Schema.Literal("prefix"), output: Schema.String, prefix: Prefix, classification: ClassificationSchema }),
  Schema.Struct({ kind: Schema.Literal("stem"), output: Schema.String, prefix: Schema.Union([Prefix, Schema.Literal("")]), stem: Stem, classification: ClassificationSchema }),
]);

// Parsed public input; unsupported forms are rejected before translation.
function unsupportedInput(text: string): string | undefined {
  const unsupported = text.match(/[^A-Za-z0-9 \t\n,!?"]/);
  if (unsupported) return `Unsupported character ${JSON.stringify(unsupported[0])} at index ${unsupported.index}`;
  for (const token of text.split(/[ \t\n,!?"]+/).filter(Boolean)) {
    const problem = unsupportedToken(token);
    if (problem !== undefined) return problem;
  }
}
function unsupportedToken(token: string): string | undefined {
  if (/^\d+$/.test(token)) return;
  if (/[a-z]/i.test(token) && /\d/.test(token)) return `Mixed letters and digits are unsupported: ${token}`;
  if (!/^(?:[a-z]+|[A-Z][a-z]+|[A-Z]{2,})$/.test(token)) return `Unsupported case style: ${token}`;
  return unsupportedSpelling(token);
}
function unsupportedSpelling(token: string): string | undefined {
  const word = token.toLowerCase();
  if (word.includes("y")) return `Unsupported y spelling: ${token}`;
  if (word.includes("q") && word !== "q" && !/^[^aeiouqy]*qu[aeiou][^qy]*$/.test(word)) {
    return `Unsupported q spelling: ${token}`;
  }
}
export const TranslationInput = Schema.String.check(Schema.makeFilter(unsupportedInput)).pipe(Schema.brand("TranslationInput"));
export type TranslationInput = typeof TranslationInput.Type;
export const parseTranslationInput = Schema.decodeUnknownResult(TranslationInput);

export function withParsedInput(translate: (input: TranslationInput) => string) {
  return (input: unknown) => Result.map(parseTranslationInput(input), translate);
}
