# Which model should be the public specification?

The parent and a fresh independent reviewer agree: **use the verbal-derived batch
model as the foundation for one authoritative specification, but do not keep it
unchanged. None of the three fully specifies the current public contract.**

The review assesses requirements and model meaning. Implementation code, MBT pass
rates, CRAP scores, and architectural similarity were not criteria. The independent
reviewer received only the models, their Quint tests, the historical verbal
specification/examples, and the current written input contract. It had no previous
conversation, implementation source, MBT results, or earlier recommendations.
The parent necessarily knew the exploration history but conducted a separate source
review and model-only probes before comparing conclusions.

## Authority and meaning of “complete”

[INPUT-DOMAIN.md](../../INPUT-DOMAIN.md) defines today's accepted/rejected input
boundary. [The verbal specification](../../specs/translate-verbal.md) preserves
translation examples and distinguishes them from inferred general rules. It predates
that boundary. A model faithful to its historical source can therefore be incomplete
or stale relative to today's contract.

There are two related contracts: translating an already admitted input, and accepting
raw input with a success/error result. A valid-input-only specification may assume
admissibility; a full public specification also has to say what happens when parsing
fails. We do not need to reproduce Effect types, TypeScript brands, or reducer
internals to specify those observable requirements.

## Comparison

| Specification aspect | `translate-original.qnt` | `translate-composed.qnt` | `batch_from_verbal.qnt` |
| --- | --- | --- | --- |
| Exact 32 historical examples | All reproduced by review probes | All reproduced by complete-input review probes | All covered by its existing exact tests |
| Public complete-input transformation | Explicit batch function; transition actions construct test inputs | Available by folding a complete input, but the main machine specifies a character/end protocol | Explicit complete-call action |
| Vowels, clusters, `qu`, vowel-free words | General word transformation | General word transformation | General word transformation, with an overly restrictive admission guard for q words |
| Empty input, separators, numbers | Handled by batch function | Handled by complete-input fold | Handled by function and accepted-domain predicate |
| Current admitted/rejected grammar | Missing | Missing | Partly captured, but valid `square` is excluded |
| Observable rejection and useful errors | Missing; excluded inputs receive translations | Missing; excluded inputs receive translations | Missing; invalid calls are disabled rather than answered with rejection |
| Explicit independent output properties | Separator sequence; nonshrinking length | Separator sequence; additional buffer/flush invariants | Exact fragment/digit preservation, suffix, case style, letter multiplicities, and exact word growth |
| Extra meanings outside today's public contract | Mixed-case, mixed-digit, y, extra-punctuation and unusual-q outputs | Those broader word cases plus persistent buffering and end/continuation behavior | Conservative historical q whitelist; category/replay metadata |

The ranking for today's public specification is **verbal batch first, original
second, composed third**. This ranks fitness for the requested boundary, not
“how much behavior a file describes.” Describing an unwanted protocol or assigning
outputs to rejected inputs does not make a specification more complete.

## Decisive findings

### No model specifies the rejection contract

Original and composed return text for categories now explicitly rejected. For example,
original prescribes `1a` → `A1ay`; composed's complete-input interpretation prescribes
`1a` → `a1ay`. Under the current contract neither is the public result: the request
must be rejected. The older original tests even require outputs for `1a` and `.`.

The third model has a `supported` predicate, but its action is simply disabled when
that predicate is false ([lines 73–77](../../batch_from_verbal.qnt#L73)). A disabled
call is not an observable error response. None represents a rejected request, a
reason/location, non-string input, or the whole-request failure outcome when one
invalid token appears among valid words.

### The third model excludes valid q spellings semantically

Its `Q_WORDS` set contains q, queen, queens, squeal, and squeals. That set is used
inside `supportedWord`, not just the generator ([lines 16 and 37–47](../../batch_from_verbal.qnt#L16)).
Consequently `square` is disabled despite being expressly admitted by the current
written contract. Its pure translation helper already produces `aresquay` for that
word; changing or duplicating the translation algorithm is unnecessary. The domain
predicate must instead express the agreed structural q rule.

### Composed describes a different operation unless constrained

`Character` and `End` may interleave arbitrarily. A probe produced the same accumulated
input `ab` through two paths: without an intermediate end the output is `abay`;
with an end after `a` it is `aaybay`. Both follow the model's declared rules.
This is not a contradiction within that protocol. It demonstrates that the protocol
is not a specification of one pure batch call determined by `ab`.

Its nonempty-pending-word, no-separator-in-pending-word, and end-flush properties are
meaningful for that separate exploration. They are not additional requirements
missing from the batch specification and should not be merged into it.

### The third model's properties are useful but not the entire functional spec

A synthetic observation `hello` → `helloay` satisfies all of its preservation
properties: same letters, case, fragment shape, length increase, and suffix.
But it violates the required rotation. This synthetic state is **not** an output
reachable through the unchanged translation action; the model's functional oracle
still specifies `ellohay` correctly.

This distinction matters: a specification is its complete semantics, not only its
`safety` predicate. Keep the exact functional rotation definition as well as the
independent properties. For stronger checking of the model itself, add a relational
property constraining the unique initial-prefix/stem split and their preserved
order. Do not replace the oracle with a bag-of-letters invariant or add a tautological
comparison against the same helper that produced the output.

## What each uniquely contributes

**Verbal batch contributes the strongest foundation:** a whole-request observation,
a defined successful-input domain, explicit whole-word case styles, independent
fragment-level output properties, and the complete historical example corpus.
Its q admission restriction and absent failure result need correction.

**Original contributes useful examples and a sampling strategy, not a missing
required translation algorithm:** its `square` case exercises the broader admitted
q rule; separator-only and short-number tests help expose gaps in a test corpus;
Append/Clear/Sample can explore diverse candidate raw requests. Its least-eligible-
vowel formulation can inform an independent relational rotation check. Its invalid
samples should become rejection examples, not retained expected translations.
The q transformation is already present in all three models' pure logic.

**Composed contributes an optional protocol specification:** nonempty pending words,
separator boundaries in pending input, and explicit end/continuation semantics.
Keep that only if studying such a protocol remains an independent goal. For the
current batch product, its relevant separator preservation is already expressed
more fully in the third model. There is no uniquely required batch behavior that
justifies merging its state machine into the public model.

## Do not confuse generators with specifications

The original model's 24-character construction bound is an exploration constraint,
not a product length limit; its pure translation function handles longer inputs.
The third model's fixed word pieces, three-digit generated numbers, and two-word
phrase template also constrain generated samples, not the full domain its functions
can describe. Separator-only strings and longer numeric strings are accepted by
its predicate even though those generator branches do not enumerate them.

The third model's q whitelist is different: it appears in the action guard and
therefore changes what the specification admits. This is a real specification gap.
More random characters or more generated traces would not correct it.

## Recommendation: one public spec, selectively consolidate useful material

1. Keep the third model's atomic batch boundary and independent word transformation.
2. Define the accepted-input grammar from the current written contract, replacing
   the q whitelist with the structural rule. Keep example word lists only in tests
   or generators. Do not add unsupported categories merely because an old oracle
   happened to transform them.
3. Specify a public outcome such as `Translated(text) | Rejected(reason, location)`.
   Accepted input produces the specified translation; unsupported input produces
   rejection for the whole request. Model representative non-string and non-ASCII
   inputs abstractly without copying runtime error classes or implementation details.
   Exact error prose need not be fixed unless it becomes part of the contract.
4. Retain the third model's preservation properties and literal corpus. Add admitted
   q forms, separator-only strings, short/long numbers, the explicit rejection
   categories, and a valid phrase containing one invalid token. Reuse old counterexample
   inputs as rejection cases. Specify input preservation and leading zeros; do not
   require outputs to be valid inputs or require idempotence.
5. Separate input generation and replay/coverage metadata from the authoritative
   behavioral definitions. Reuse broader construction ideas only as sampling tools.
6. Archive the two older public oracles after the consolidated spec covers these
   requirements. Keep composed's protocol model only as a clearly separate research
   artifact if desired, not as a second source of public requirements.

This is a recommendation, not a completed consolidation. No production code or
existing model was changed during this review.

## Evidence and independent agreement

The independent report is preserved in [INDEPENDENT-REVIEW.md](INDEPENDENT-REVIEW.md).
It reached the same ranking and recommendation without being given the parent's
findings. There was no material disagreement. It additionally records the per-model
structural checklist and witness results.

The reviewer reproduced all 32 historical pairs through each model and ran bounded
safety simulations of all three. It added 33 original-model, 34 composed-model, and
8 third-model audit probes; it also ran the third model's existing 38 tests.
No violation of the existing safety predicates was observed in 100 traces of at
most 12 steps per model. That is sampled evidence, not a proof of fidelity.

The parent independently ran nine focused model-only probes: three original, one
composed, and five third-model probes. They confirm the q guard restriction,
existing helper behavior, excluded-input transformations, end/batch distinction,
separator-only admission, and limits of the preservation properties. Their sources
and logs are in this directory; for example:

```sh
node_modules/.bin/quint test reports/spec-review/parent-verbal-audit.qnt --main parent_verbal_audit --backend typescript --max-samples 1
```

The independent probe files were relocated here with their import paths adjusted
from the isolated review directory to the same main model sources. The source
models and translation implementations were not edited.
