# Independent model from the verbal specification

The original agent filenames below correspond to [translate-verbal.md](translate-verbal.md)
and [translate-examples.json](translate-examples.json) in this directory.

The sole behavioral inputs were `VERBAL-SPEC.md` and its companion `examples.json`. No implementation, ordinary test source, previous model, previous driver, or other project directory was read. Installed Quint language/tooling documentation was consulted. This model was completed before any adapter results were used; implementation results must not be used to tune it.

## Abstraction and oracle

One state transition observes one complete public `translate(text)` call. `observation` holds its complete input and output plus a coverage category. There is no internal parser state, streaming interface, concurrency, message exchange, clock, failure recovery, or persistent translator state. `replayAction` is only trace instrumentation. These choices follow the document's public batch scope.

Text uses lists of ASCII integer codes because Quint lacks the string operations needed here, and its quoted-string grammar cannot directly express the observed quote escape. This representation is lossless for every supplied example. It is not a Unicode claim.

The pure oracle `translateText` partitions an input at the seven observed separator characters, preserves each separator, leaves digit runs alone, and transforms complete alphabetic runs. `pivot` finds the earliest a/e/i/o/u vowel that is not the u attached to q; it then rotates the preceding letters and adds ay. If no usable vowel exists, the identity rotation retains letter order. `style` applies lowercase, title case, or uppercase presentation, including the suffix. The oracle computes expected outputs from spelling rules; it does not look up example outputs or call an implementation.

| Verbal requirement | Model element |
| --- | --- |
| Complete string in/out; empty string | Atomic `translate`; `Empty` action |
| Preserve observed punctuation and whitespace | `fragments`, `SEPARATORS`, `separatorsPreserved` |
| Lowercase vowels, consonant prefix, qu | `pivot`, `translateWord` |
| Vowel-free words retain letters | End-of-word pivot and identity rotation |
| Three demonstrated capitalization styles | `style`, `supportedWord`, `wordPreserved` |
| Digit-only fragments survive | `isDigits`, `digitsPreserved`, `fragmentsPreserved` |
| All 32 exact assertions | `example01Test` through `example32Test`, `fullCorpusTest` |

## Binding evidence and exploration

The 32 literal input/output pairs are the binding evidence. Their test constants are mechanically encoded from `examples.json`; all expectations run through the same independent oracle. `fullCorpusTest` translates all 32 sequentially for external batch-function replay.

Fresh generation tests the document's explicitly proposed candidate generalizations, not additional binding requirements. A generated disagreement outside the 32 pairs is an exploratory model disagreement or unresolved ambiguity, not automatically an implementation defect.

`Word` combines six prefixes (`empty`, b, tr, spl, ch, br), six vowel-led bodies (at, en, ig, op, um, era), three endings (`empty`, s, ing), and three case styles. It also includes bounded vowel-free spellings and the demonstrated q-family. This creates new spellings such as Braten and CHIGING rather than replaying only the example list. `Number` chooses any three-digit sequence, including leading zeroes. `Phrase` independently chooses two words, one three-digit run, two nonempty gaps, and optional leading/trailing padding. Gaps/padding use only observed separator characters. Empty calls have their own action. There is no separator-only generator branch.

The candidate oracle's `supported` predicate deliberately excludes y, unknown letters/characters, mixed case, single uppercase letters, letter-digit adjacency, and q-containing spellings other than q/queen/queens/squeal/squeals in admitted case styles. Restricting q to this family avoids deciding the document's unusual q ambiguities. Ordinary ASCII spelling transformations, fresh vowel-free words, new digit-only inputs, and new separator compositions remain explicit extrapolations. The pure helper accepts arbitrary lengths and some separator-only compositions within these character classes; the bounded generator does not explore arbitrary lengths or separator-only inputs. Neither fact makes those behaviors a conformance requirement.

The guard disables out-of-scope model calls. It does **not** specify that the real API rejects them, throws, returns an error, coerces input, or has a resource limit. Undefined categories in the verbal document remain undefined. No later parsing/rejection policy was incorporated into this blind model.

## Properties and limits

`safety` combines exact separator-order preservation, exact digit-order preservation, two-character growth per transformed word, and fragment-level preservation. The latter checks that every separator/digit fragment is unchanged, each word preserves its letter multiplicities before the added suffix, and output casing/suffix matches the admitted input style. These are independent structural checks, not an equality assertion that merely reruns the oracle. Exact prefix rotation is additionally anchored by the 32 known examples and four separately written fresh expectations.

Witnesses exist for each generated action and for qu, vowel-free, uppercase, and title-case paths. All require an actual translation category, so initialization cannot satisfy them. Safety simulation is sampled evidence, not exhaustive verification. No claim is made about linguistic correctness, Unicode, undefined capitalization, unobserved delimiters, performance, errors, or unrestricted domains. The model's independence does not make finite test-derived rules uniquely determined.

## Adapter interface

- Main file/module: `batch_from_verbal.qnt` / `batch_from_verbal`.
- Test file/module: `batch_from_verbal_test.qnt` / `batch_from_verbal_test`.
- Named full corpus scenario: `fullCorpusTest`.
- Init/step: `init`, `step`. Invariant: `safety`.
- Driver configuration: `nondetPath: ["replayAction"]`, `statePath: ["observation"]`.
- Replay `Init`: input empty; initialize the driver's observation.
- Replay `Translate`: `value.input` is the complete ASCII list. Convert bigint entries with `String.fromCharCode(Number(code))`, concatenate, and call the public function once.
- Compare `observation.output` decoded the same way against the actual complete output. Input can also be compared. `category` is coverage metadata and should not be treated as implementation state.
- Explicit replay metadata works in named-test mode as well as generated run mode. Every action assigns both model variables.

## Reproduction

Run in `/workspace/typescript/piglatin-model-from-spec` with the installed Quint 0.32.0:

```sh
node_modules/.bin/quint typecheck batch_from_verbal.qnt
node_modules/.bin/quint typecheck batch_from_verbal_test.qnt
node_modules/.bin/quint test batch_from_verbal_test.qnt --backend typescript --max-samples 1 --match '.*Test'
node_modules/.bin/quint run batch_from_verbal.qnt --backend typescript --max-samples 100 --max-steps 8 --seed 20260910 --invariant safety --witnesses reachedEmpty reachedWord reachedNumber reachedPhrase reachedQu reachedVowelless reachedUpper reachedTitle --verbosity 1
```

The deterministic suite passes 38 tests: 32 exact cases, one complete corpus scenario, four new manually expected cases, and a check that generated word/number domains satisfy the model guard. Simulation results are recorded in `simulation.log`.
