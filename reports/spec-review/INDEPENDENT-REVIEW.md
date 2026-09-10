# Independent comparison of the three specifications

## Recommendation and ranking

Consolidate the authoritative public specification around **batch_from_verbal.qnt**, after correcting its input domain and adding observable rejection. Retain selected tests and sampling ideas from the other models, rather than maintaining three coequal specifications. No existing model completely specifies the current public raw-input contract.

1. **batch_from_verbal.qnt:** highest fidelity to the public batch boundary and strongest independent behavioral properties. It captures all 32 historical examples and has explicit case/domain decisions. Its important defect is a stale q-word whitelist that excludes currently admitted words; it also lacks rejection results.
2. **translate-original.qnt:** a compact, useful batch translation function with broader q generalization, but no supported-input predicate or rejection and explicit expected translations for now-invalid inputs. Its Append/Clear/Sample actions are input construction, not public behavior.
3. **translate-composed.qnt:** its complete-input fold captures the historical outputs, but its actual transition system specifies an additional incremental protocol. End/Character interleaving can change the output for the same accumulated input. This is the least faithful public specification, despite having meaningful internal-state properties.

This ranking concerns specification meaning, domain completeness, and abstraction. It uses no implementation code, implementation similarity measurements, driver results, or implementation pass rates. Structural resemblance to an implementation would weaken independence, not improve this ranking. Comments calling a model “independent” are not evidence of its provenance. The verbal model explicitly names behavioral sources, and its whole-call abstraction makes its public requirements easier to inspect independently.

## Authority and scope

The current authority for admitted/rejected inputs is INPUT-DOMAIN.md, especially lines 6–11, 25–45, and 50–57. It supersedes historical statements that such inputs as separator-only strings, mixed-case words, or unusual q spellings were undefined. Historical translate-verbal.md and translate-examples.json remain evidence for exact translation outputs and explicitly qualified generalizations. Their finite examples do not establish arbitrary linguistic behavior.

The raw operation has observable success or failure, preserves accepted input during parsing, rejects the whole request for an invalid token, and reports an offending character/index or token plus a reason. A model of the branded translator alone can assume valid input. A complete specification of the raw public boundary must additionally describe rejection. None of these three does. No model represents non-string raw values or SchemaError observations. The type branding mechanism itself need not be reproduced: its accepted-domain and failure behavior do.

## Comparison by requirement

| Requirement | Original | Composed | Verbal batch |
| --- | --- | --- | --- |
| All 32 exact historical pairs | Reproduced by new pure-function corpus probes | Reproduced by new complete-input-fold corpus probes | Existing 32 exact tests reproduced |
| One complete request determines output | Yes, translate function; actions construct test inputs | Only under restricted complete-input fold; arbitrary End events alter meaning | Yes, atomic translate action |
| Supported separators and their order | Yes | Yes | Yes; also exact per-fragment identity |
| Empty/separator-only and arbitrary digit-only strings | Function handles them | Complete-input fold handles them | Predicate and function handle them |
| Ordinary vowels, consonant clusters, vowelless words | Yes on admitted case styles | Yes on admitted case styles | Yes |
| Current q generalization, e.g. square | Function translates it | Function translates it | **Action disabled** by whitelist |
| Reject unsupported case/y/q/mixed-token categories | No; outputs specified instead | No; outputs specified instead | Predicate excludes them, but no rejection observation |
| Reject non-string values with diagnostics | Absent | Absent | Absent |
| Strong independent translation properties | Length nonshrink and separator sequence | Separator sequence plus internal-state discipline | Fragment structure, exact suffix, letter multiplicity, case, digits, growth |

### 1. The verbal batch domain is narrower than today's supported domain

batch_from_verbal.qnt:16 lists only q, queen, queens, squeal, and squeals. Lines 37–47 use that list in the semantic supported predicate; lines 73–77 guard the public translate action with it. Thus **square is not merely absent from a generator: the specification disables its translation**, despite INPUT-DOMAIN.md:34–36 expressly admitting it. Other regular admissible qu forms are likewise excluded.

The pure rotation function at lines 49–67 is already general enough for square. Replace the whitelist in the domain predicate with the current structural q rule: lowercase q alone, or exactly one qu in the initial consonant prefix immediately followed by an ordinary vowel, with no additional q. Keep the whitelist only if useful as a sampling/example set.

A false guard is not a failure result. For invalid “hello 1a”, supported is false and translate cannot fire; there is no resulting rejected request or diagnostic. This correctly excludes successful translation but incompletely describes the public raw-input behavior. A rejection action/result must expose failure and whole-request atomicity, rather than pretending that the request never occurred.

### 2. Original and composed over-specify rejected inputs

Original's alphabet includes y, all individual uppercase letters, and unsupported punctuation (translate-original.qnt:7–13). Its samples deliberately include qu, ququa, BaNaNa, 1a, period, and y-containing inputs (51–59). The companion tests assert “1a” → “A1ay” and period → “.ay”, among other out-of-domain transformations. These are explicit non-requirement semantics, not missing generator coverage.

Composed also freely admits all letters and digits consecutively, including mixed case and letter-digit tokens (translate-composed.qnt:6–10, 62–65). Neither model checks valid whole words. They both yield an output for 1a, which the current contract requires to fail. Lower/upper behavior outside supported styles and broad treatment of q/y must not become requirements by accident.

It remains legitimate to use their pure functions under a separately stated valid-input precondition. That does not make either a complete raw-input specification; as presently written, their action systems lack that precondition.

### 3. Composed's stateful protocol is additional semantics, not fuller public coverage

translate-composed.qnt:31–55 introduces a pending word, committed output, and accumulated input. Character and End can interleave arbitrarily (62–71). End commits the pending translation but does not reset input or prevent more characters.

A deterministic probe substantiated:

- Character a, End, Character b produces input ab and output aaybay.
- The same model's complete-input fold on ab produces abay.

Both are consequences of its declared protocol. The first is not a correct output for the public batch request ab. The model needs an explicit boundary interpretation if retained as an exploration: End either terminates a session, separates distinct requests with separately recorded inputs, or belongs to a separately authorized streaming contract. INPUT-DOMAIN.md:56–57 explicitly says the event/state helpers do not establish such a contract.

The pending-no-separators, end-flushes, and Reading-nonempty properties (74–80) are useful properties of that exploration. They are not missing public requirements that must be merged into the batch model.

### 4. Independent properties are strongest in batch, but none is a complete functional contract

Original safety (73–77) allows many wrong outputs: nonshrinking length and separator preservation say little about translation. Its 24-character bound is about its construction state, not a justified public resource limit.

Composed safety (73–80) mostly constrains buffering; it does not require the view to equal the batch translation of accumulated input. Its End interleaving example shows why that distinction matters.

Batch safety (123–153) checks considerably more. Retain exact separator/digit fragments, fragment count/order, suffix spelling/case, two-character growth per word, letter multiplicity, and case style. However, wordPreserved accepts hello → helloay: correct multiplicities and suffix do not require moving the consonant prefix. That new probe passed. The functional oracle at 49–67 still fixes the actual rotation; the auxiliary safety predicates are valuable independent checks, not a replacement for that functional specification.

Add a declarative property that fixes the least eligible vowel/prefix partition and preserves the order of the suffix and moved prefix. Avoid only comparing an output to the same helper that generated it; that adds little independent checking.

## Unique useful material and what to keep

- **Verbal batch:** retain atomic request/observation, supported-input distinction (corrected), whole-word style normalization, fragment-level preservation predicates, feature witnesses, and all 32 exact tests. This is the principal consolidation target.
- **Original:** retain its declarative least-eligible-vowel characterization (24–29) as a possible independent rotation property, its square example as a valid generalization test, separator-only and short-number examples, and its incremental input-construction idea for sampling. Do not retain expected outputs for rejected categories; convert those inputs into rejection tests.
- **Composed:** retain its NonEmptyWord/Pending type and boundary/flush properties only in a separately labeled internal exploration if that exploration remains useful. Do not promote Character/End state into the public contract. Its useful pure complete-input examples can become tests against the canonical batch spec.

Original and composed do not contribute a uniquely required accepted-input translation rule absent from the verbal batch function. Original contributes an admitted q example excluded by batch's guard; that requires a domain fix, not another canonical translator.

## Semantics versus sampling

- Original's Append limit of 24 and finite samples constrain its state-machine exploration (61–72). The pure translate function has no such length bound. The limit must not become a public input-length requirement.
- Composed's unbounded Character sequence is broad generation, but it spends probability on now-invalid tokens and permits nonpublic End interleavings. Breadth alone is not semantic completeness.
- Batch's finite PREFIXES/BODIES/ENDINGS, three-digit NUMBERS, gaps/padding, and two-word phrase template (80–110) are sampling choices. supported and translateText accept arbitrarily long ordinary supported words, numbers, and separator sequences. Do not call those finite generator shapes domain exclusions.
- Batch's Q_WORDS is different: it participates in supported, and is therefore an actual domain restriction.
- Categories, replayAction, and lastEvent chiefly enable replay/coverage. They are not public data requirements. The narrow character encodings (ASCII integers or symbolic TAB/LF/QUOTE strings) are reasonable abstractions for admitted strings, but cannot themselves describe all rejected raw values.

## Bounded validation and review checklist

Ran model-only tests with Quint's TypeScript evaluator and --max-samples=1:

- independent_original_audit.qnt: 33 passed (all 32 historical pairs, plus unsupported token still translated).
- independent_composed_audit.qnt: 34 passed (all 32 historical pairs, unsupported translation, and End/batch mismatch).
- independent_batch_audit.qnt: 8 passed (square exclusion, q/Q, separator-only, long number, invalid whole request, and insufficient rotation predicate).
- batch_from_verbal_test.qnt: 38 passed, including the exact examples and exploratory/scope tests.

Ran each main model with safety, seed 42, 100 samples, and at most 12 steps using quint run --backend=typescript. No counterexample to the models' own safety predicates was observed. This is bounded sampling, not a proof of specification correctness or completeness.

Witness counts: original qu/digits-plus-punctuation/mixed-case 18/18/17 of 100; composed Character/End/punctuation/qu 100/100/28/0; batch Word/Number/Phrase/qu/vowelless/uppercase/title/empty 97/99/94/32/21/94/98/97. Composed's zero qu witness is a sampling gap, not evidence of unreachable qu; the deterministic QUEEN corpus case exercises its qu logic.

Checklist assessment: initialization and assignments cover declared variables in all models; step exists and includes named major actions; functional transformations live mainly in pure definitions; records group primary state. Batch has witnesses for each generated call category, composed for both actions, while original witnesses identify content rather than each construction action. Raw strings used for case/categories/event tags are maintainability warnings, not translation defects. String/list manipulation is appropriate here because characters and their order are the domain itself. Original and composed have weaker public behavioral invariants than batch. No model was modified, and no exhaustive verification or implementation execution was performed.

## Concrete consolidation target

One public model should define raw request → accepted translation or rejected diagnostic, structural validation matching INPUT-DOMAIN.md, and the existing independent batch spelling transformation. Cover the exact historical examples, newly admitted q forms, empty/separator-only input, long valid tokens, all explicit rejected categories, and one invalid token among otherwise valid text. Preserve input and separators exactly; preserve digits with leading zeros; do not require output to re-enter the input domain or be idempotent. Keep exploration bounds and coverage strategies in separate generators/tests. Archive the duplicate public oracles after this consolidation; retain the composed state model only as an explicitly separate exploration if there is a continuing need for it.
