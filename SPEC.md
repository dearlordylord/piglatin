# Translation contract

This is the current public behavior, consolidated from the agreed input domain and
translation rules. It is independent of any implementation architecture.
`translate-contract.qnt` is its executable fourth model. The three earlier models
are historical experiments, not competing authorities.

## Requests and outcomes

A complete raw request produces either translated text or a rejection. Previous
requests do not affect its result. There are no public character events, pending
words, flush operations, or continuation semantics.

Non-string input is rejected. A string is admitted only when every character and
every token belongs to the domain below. One unsupported token or character rejects
the entire request; no partially translated text is returned.

Rejection identifies an applicable problem: non-string input, an unsupported
character with its location, or an offending token with a reason. When several
problems apply, any truthful applicable diagnostic is permitted. Error priority,
exact wording, and runtime error classes are not specified.

## Admitted input

Empty strings and separator-only strings are admitted. Separators are ASCII space,
tab, newline, comma, exclamation mark, question mark, and double quote. Each is
preserved literally. Adjacent non-separator characters form a token.

A token is either an ASCII digit sequence (including leading zeros) or an ASCII
alphabetic word in one of these disjoint styles:

- all lowercase, including single lowercase letters;
- title case: one uppercase letter followed by one or more lowercase letters;
- all uppercase, with at least two letters.

Words containing `y` are unsupported until its role is specified. A word containing
`q` is admitted only as lowercase `q` alone, or with exactly one `qu` inside the
initial consonant prefix, followed immediately by a vowel. No vowel precedes that
`q`. Thus `queen`, `square`, and `squint` are admitted in supported case styles;
`qu`, repeated `qu`, `qhat`, and `equal` are not. Vowels are `a e i o u`.

Other punctuation, other whitespace, non-ASCII characters, mixed letters/digits,
mixed case, and single uppercase letters are rejected. There is no prescribed
maximum input length; finite test-generation limits are not domain restrictions.

## Translation of admitted input

Separators and digit sequences retain their exact content and order. Translate each
alphabetic token independently, preserving the sequence of tokens and separators.

For the lowercase spelling of a word, split at its first vowel other than the `u`
attached to an initial `q`. If the word begins with a vowel, the prefix is empty.
If there is no eligible vowel, the prefix is the whole word. Return the remaining
letters, then the prefix, then `ay`, preserving letter order in both portions.
Restore the input's whole-word case style, including `AY` for all-uppercase words.

Examples: `extra` → `extraay`, `hello` → `ellohay`, `Three` → `Eethray`,
`SQUARE` → `ARESQUAY`, `BRR` → `BRRAY`, `00123` → `00123`.
`q!ueen` → `qay!ueenay`: punctuation is a boundary, not a character to move past.

The output need not itself be an admitted input: the suffix contains `y`.
Translation is not required to be idempotent. Parsing never trims or normalizes
accepted input before translation.

## Evidence and executable model

The 32 historical examples remain in `specs/translate-examples.json`.
`specs/translate-contract-cases.json` extends that corpus to 67 complete requests,
including admitted q forms, empty/separator-only strings, longer numbers, and
rejections. The frozen test-derived narrative is `specs/translate-verbal.md`;
where it marks something undefined, the explicit decisions above now govern.

`INPUT-DOMAIN.md` documents how the TypeScript parser and branded API expose this
contract. Effect, brands, and diagnostic text formatting are adapter concerns and
are not copied into the model's domain semantics.
