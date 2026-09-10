# Supported translation input

The authoritative behavior is [SPEC.md](SPEC.md). This document describes the
TypeScript parser/API mapping of that contract.

There are two implementations: `translate.ts` and `translate-composed.ts`.
They share the input contract in `domain.ts`.

`parseTranslationInput(raw)` returns Effect `Result<TranslationInput, SchemaError>`.
A success contains an Effect Schema-branded string, not the original unconstrained
string type. `translate` accepts that brand. `translateText(raw)` composes parsing
with translation and returns `Result<string, SchemaError>`; on failure it never
calls the translator. Parsing preserves the input exactly, without trimming,
case normalization, or partial translation.

```ts
import * as Result from "effect/Result";
import { parseTranslationInput } from "./domain.ts";
import { translate, translateText } from "./translate.ts";

const parsed = parseTranslationInput('"Hello!" 00123');
if (Result.isSuccess(parsed)) {
  console.log(translate(parsed.success)); // "Ellohay!" 00123
}
const result = translateText("1a"); // Failure: mixed letters and digits
```

## Admitted input

- Empty input and sequences of supported tokens/separators, including separator-only input.
- Separators: ASCII space, tab, newline, comma, `!`, `?`, and double quote.
- Digit-only tokens, with leading zeros preserved.
- ASCII alphabetic tokens in lowercase, title case (at least two letters), or
  all-uppercase (at least two letters).
- Ordinary initial consonant clusters and vowel-free words, subject to the
  exclusions below. Vowels are `a e i o u`.
- Lowercase `q` by itself (required by `q!ueen`), or one `qu` in the initial
  consonant prefix followed immediately by an ordinary vowel. Examples include
  `queen`, `squeal`, and `square`, also in admitted case styles.

## Explicitly unsupported

Reject non-string values, non-ASCII characters, other whitespace, other punctuation,
mixed letters/digits in one token, mixed letter case, and single uppercase letters.
Reject any input word containing `y` while its vowel policy is unspecified.
Reject other q spellings, including repeated `qu`, bare `qu`, `q` after the first
vowel, and `q` followed by a consonant. Examples: `1a`, `;`, `.`, `it's`,
`hello-world`, `hELLo`, `A`, `rhythm`, `ququack`, `equal`, and `é`.

These are conservative domain exclusions, not linguistic claims. A single uppercase
letter is excluded because uppercase-versus-title-case suffix behavior was ambiguous.
Likewise, rejecting all words containing `y` avoids choosing its role implicitly.
An unsupported token rejects the whole request. The parser reports the offending
character/index or token and a reason through `SchemaError`.

Output is a plain string and need not belong to the input domain: the translated
suffix itself contains `y`. Do not parse output again or assume translation is idempotent.

The composed reducer's exported event/state helpers remain implementation exploration
APIs. They do not establish a supported streaming contract or replace this batch boundary.
