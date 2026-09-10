# Public batch translation: behavior inferred from ordinary tests

## Scope and provenance

This document specifies observations about a public operation `translate(text)` that receives a complete string and returns a complete string. It does not specify internal processing, implementation stages, streaming, or intermediate states.

The sole project evidence is the copied file `/workspace/typescript/piglatin-spec-from-tests/translate.test.ts`, read as text. Its imports were not followed. No implementation, other project directory, history, existing documentation, Quint file, or model-based test was consulted. The test file was not executed. It declares the same assertions for five implementation labels, but this document makes no claim that any implementation passes them.

There are **32 distinct asserted input-output pairs**: 20 direct literal assertions and 12 interaction examples. The five implementation labels repeat this evidence; they do not add distinct examples. `examples.json` contains the same 32 pairs as an array of objects with `description`, `input`, and `expected` fields. JSON string escapes decode into actual tab and newline characters in the string values.

Confidence is high that the examples below faithfully capture the test assertions. General rules inferred from finitely many examples have limited confidence outside those examples. Test descriptions supply evidence of intent, but cannot settle all boundary cases.

## Directly asserted facts

The Given/When/Then examples below are the authoritative facts, including capitalization, punctuation, and whitespace. The following statements summarize only demonstrated behavior:

- The empty string returns the empty string.
- Lowercase examples beginning with each of `a`, `e`, `i`, `o`, and `u` keep their letters in order and receive `ay`.
- `hello` and `world` move their first consonant to the end before `ay`. `three` moves the initial `thr` together.
- `queen` and `squeal` move `qu` and `squ`, respectively. Related inflected and capitalized examples are also present.
- Translation applies to multiple words in one input, including words adjacent across a comma or double quotes without spaces.
- The observed commas, exclamation marks, question marks, and double quotes retain their literal content and order between translated text. Repeated punctuation and surrounding quotes survive. Their numeric offsets can change because translated words become longer.
- The tested spaces, tabs, and newlines survive exactly, including repeated and leading/trailing occurrences.
- The demonstrated title-case words yield title-case output with a lowercase suffix. Demonstrated all-uppercase words yield all-uppercase output, including `AY`.
- The demonstrated numeric strings `123`, `00123`, and the punctuation-separated input `1,2` are unchanged.
- In `q!ueen`, punctuation separates the fragments: `q` becomes `qay`, `ueen` becomes `ueenay`, and `!` remains between them. Prefix movement does not cross that separator.
- The vowel-free examples `BRR` and `Brr` retain their letter order and gain case-appropriate suffixes. The lowercase vowel-free example `q` gains `ay`.

## Justified generalizations for a candidate model

These rules explain every observed pair and match the intent expressed by test descriptions. They are inferred rules, not additional exhaustive assertions. They can guide a candidate batch model if their assumptions remain explicit.

1. Treat the observed whitespace and punctuation characters (space, tab, newline, comma, exclamation mark, question mark, and double quote) as preserved separators. Transform words independently on either side. Preserve separator sequences exactly and in order.
2. For an ordinary lowercase alphabetic word, use `a`, `e`, `i`, `o`, and `u` as the observed vowel set. If the word begins with a vowel, append `ay`. Otherwise, move its initial consonant prefix after the rest of the word and append `ay`. Within the initial prefix, keep `qu` together, even though `u` is otherwise a vowel. This explains both `queen` and `squeal`.
3. For a word without any of those vowels, retain its letters in order and append the suffix. This is supported by `q`, `BRR`, and `Brr`; other such words remain extrapolations.
4. Apply the corresponding letter transformation to demonstrated title-case and all-uppercase words, preserving the overall case style: initial capital followed by lowercase for title case, and uppercase throughout for all-uppercase input. Lowercase output uses `ay`; uppercase output uses `AY`.
5. Preserve digit-only fragments, including leading zeros, when they occur in the demonstrated separator contexts.

Confidence is moderate for extending these rules to new lowercase ASCII words and compositions of the observed separators: the tests deliberately exercise interactions, but do not quantify over arbitrary words or sequences. Confidence is lower for unrepresented capitalization patterns, letter classes, or delimiter classes. Do not silently turn those gaps into requirements.

## UNDEFINED or ambiguous behavior

The tests do not determine:

- Inputs other than strings, errors, coercion, resource limits, or a maximum string length.
- Mixed capitalization such as `hELLo`, one-letter uppercase words, or a precedence rule when a word could count as both title case and all-uppercase.
- Whether `y` can be a vowel, the treatment of accented or non-Latin letters, combining marks, emoji, or other Unicode categories.
- Punctuation other than the observed comma, exclamation mark, question mark, and double quote; for example apostrophes, hyphens, periods, colons, parentheses, and underscores.
- Whitespace other than space, tab, and newline, including carriage return and nonbreaking space.
- Segmentation of adjacent letters and digits, signed or decimal numbers, or other numeric notation.
- Detailed `q`/`u` behavior beyond the observed initial `qu` and `squ` prefixes, including `q` followed by another consonant, repeated `qu`, or unusual casing.
- Separator-only inputs, arbitrarily long separator sequences, or unrestricted composition of transformed fragments. Preservation is a plausible extension, not a directly asserted universal fact.
- Any linguistic rules beyond the observed spelling transformations, such as dictionary exceptions, pronunciation, or treatment of words already ending in `ay`.

Do not assume a conventional Pig Latin rule for any undefined case merely because this operation resembles Pig Latin.

## Scope of generated tests and required decisions

A conformance suite can require all 32 exact examples without additional assumptions. It can also group or report those examples by the demonstrated features without inventing new expected outputs.

Broader generation can explore lowercase ASCII words, ordinary title-case/all-uppercase forms, digit-only fragments, and compositions with observed separators using the candidate rules above. Such results test agreement with the **inferred candidate model**. A failure outside the exact examples is evidence of an ambiguity or a model disagreement, not by itself proof of an implementation defect against this evidence.

Before treating generated cases as additional binding requirements, the user must decide whether the candidate generalizations are intended as universal rules and choose a policy for any undefined case included in the generator. Until then, exclude undefined categories from claimed conformance coverage or report them explicitly as exploratory. No implementation access is needed to preserve this distinction.

## Complete Given/When/Then examples

For every row, **Given** the input string, **When** `translate` is called once with that complete string, **Then** its returned string must equal the expected string exactly. Both string columns use JSON notation: surrounding quotation marks delimit the representation, `\t` represents one actual tab, `\n` represents one actual newline, and `\"` represents an actual double quote. Spaces inside the delimiters are significant. These representations preserve every original string value; they do not require literal backslashes in the input or output.

| # | Asserted example | Given input (JSON string) | Then expected (JSON string) |
| --- | --- | --- | --- |
| 1 | returns an empty string for an empty word | `""` | `""` |
| 2 | adds ay to words starting with a vowel | `"apple"` | `"appleay"` |
| 3 | adds ay to words starting with a vowel | `"extra"` | `"extraay"` |
| 4 | adds ay to words starting with a vowel | `"igloo"` | `"iglooay"` |
| 5 | adds ay to words starting with a vowel | `"orange"` | `"orangeay"` |
| 6 | adds ay to words starting with a vowel | `"under"` | `"underay"` |
| 7 | moves the first consonant to the end and adds ay | `"hello"` | `"ellohay"` |
| 8 | translates each word in a phrase | `"hello world"` | `"ellohay orldway"` |
| 9 | preserves capitalization when translating a phrase | `"Hello Exciting world"` | `"Ellohay Excitingay orldway"` |
| 10 | keeps a comma after the translated word | `"hello, exciting world"` | `"ellohay, excitingay orldway"` |
| 11 | preserves exclamation marks, commas, and capitalization | `"hello! exciting, World"` | `"ellohay! excitingay, Orldway"` |
| 12 | preserves leading, trailing, and repeated spaces | `"  hello!   exciting,     World    "` | `"  ellohay!   excitingay,     Orldway    "` |
| 13 | keeps a question mark after the translated word | `"hello?"` | `"ellohay?"` |
| 14 | keeps repeated exclamation marks after the translated word | `"hello!!"` | `"ellohay!!"` |
| 15 | preserves tabs and newlines between words | `"\thello!\t\texciting,\n\nWorld\n"` | `"\tellohay!\t\texcitingay,\n\nOrldway\n"` |
| 16 | moves the initial consonant cluster to the end | `"three"` | `"eethray"` |
| 17 | preserves surrounding double quotes | `"\"hello?\""` | `"\"ellohay?\""` |
| 18 | keeps all-uppercase words uppercase, including the suffix | `"\"HELLO! EXTRA THREE\""` | `"\"ELLOHAY! EXTRAAY EETHRAY\""` |
| 19 | moves qu together as part of the initial consonant cluster | `"queen squeal"` | `"eenquay ealsquay"` |
| 20 | leaves numbers unchanged | `"hello 123"` | `"ellohay 123"` |
| 21 | punctuation separates adjacent words | `"hello,world"` | `"ellohay,orldway"` |
| 22 | punctuation keeps its position between digits | `"1,2"` | `"1,2"` |
| 23 | a prefix does not cross punctuation | `"q!ueen"` | `"qay!ueenay"` |
| 24 | quotes separate adjacent words | `"\"hello\"\"World\""` | `"\"ellohay\"\"Orldway\""` |
| 25 | uppercase qu with quotes and repeated punctuation | `"\"QUEEN?!\""` | `"\"EENQUAY?!\""` |
| 26 | title-case qu with punctuation | `"Queen!!"` | `"Eenquay!!"` |
| 27 | title-case cluster inside quotes | `"\"Three?\""` | `"\"Eethray?\""` |
| 28 | uppercase vowel with quotes and punctuation | `"\"EXTRA!!\""` | `"\"EXTRAAY!!\""` |
| 29 | quoted numbers with punctuation and leading zeros | `"\"00123?!\""` | `"\"00123?!\""` |
| 30 | quotes around a phrase with mixed separators | `"  \"Hello\tQUEEN!!\nexciting, world?\"  "` | `"  \"Ellohay\tEENQUAY!!\nexcitingay, orldway?\"  "` |
| 31 | clusters and numbers across tabs and newlines | `"\t\"Three QUEENS!!\"\t123,\n\"Exciting squeals?\"\n"` | `"\t\"Eethray EENSQUAY!!\"\t123,\n\"Excitingay ealssquay?\"\n"` |
| 32 | uppercase and title-case words without an aeiou vowel | `"\"BRR!!\" Brr?"` | `"\"BRRAY!!\" Brray?"` |
