import { TokenFragment, isDigitSequence, type TranslationInput, withParsedInput } from "./domain.ts";

export function translate(text: TranslationInput): string {
  return translateSource(text);
}
export const translateText = withParsedInput(translate);

function translateSource(text: string): string {
  return text.replace(/[^\s,!?"]+/g, (token) => {
    const word = TokenFragment.make(token);
    if (isDigitSequence(word)) return word;
    if (word === word.toUpperCase() && word !== word.toLowerCase()) {
      return translateSource(word.toLowerCase()).toUpperCase();
    }
    const first = word[0];
    if ("aeiou".includes(first.toLowerCase())) return word + "ay";

    const clusterEnd = consonantClusterEnd(word);
    const translated = word.slice(clusterEnd) + word.slice(0, clusterEnd).toLowerCase() + "ay";
    if (first === first.toUpperCase()) {
      return translated[0].toUpperCase() + translated.slice(1);
    }
    return translated;
  });
}

function consonantClusterEnd(word: TokenFragment): number {
  let clusterEnd = 1;
  while (clusterEnd < word.length && (
    !"aeiou".includes(word[clusterEnd].toLowerCase()) ||
    word.slice(clusterEnd - 1, clusterEnd + 1).toLowerCase() === "qu"
  )) {
    clusterEnd++;
  }
  return clusterEnd;
}
