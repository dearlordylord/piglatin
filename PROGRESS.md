# Exploration history

Recorded on 2026-09-10. This is a high-level account of the exploration, not a
commit log: the main directory is not a Git repository. Early stages are
reconstructed from the conversation; recent model experiments have saved artifacts
and logs. An approach appearing here does not mean it remains a requirement.

## Names: implementations versus specification models

“Composed” names both a TypeScript implementation and the first Quint model built
to explore it. Those are distinct artifacts. The third Quint model is not that
composed model.

| Artifact | Meaning and origin |
| --- | --- |
| `translate-composed.ts` | The composed reducer implementation we built: character events, composable decisions, and observers. |
| Model 1: `translate-composed.qnt` | Built while exploring that implementation. Its character/end interface reflects the reducer experiment, although its whole-word reference algorithm was independent of the TypeScript rule dispatch. |
| Model 2: `translate-original.qnt` | Built by a separate agent from the original implementation, with the existing driver available as a tooling example. |
| Model 3: `batch_from_verbal.qnt` | Built by another agent from a verbal spec and examples extracted from public tests. Its author did not read either implementation or earlier Quint models. |
| Model 4: `translate-contract.qnt` | Consolidated public request/outcome specification, including rejection, structural input grammar, and exact translation properties. This is now authoritative. |

The recommendation to use model 3 as the foundation is about its public batch
boundary and requirement-level properties, not evidence that reducer architecture
produces better specifications. The experiments share the project's behavioral
history, so the third model is not independent of all earlier requirement choices;
it is independent of direct implementation/model inspection by its author.
Using a fold inside a Quint function does not make the specified public operation
a streaming reducer protocol.

## Chronology

1. **Started with a deliberately small function and red → green development.**
   The initial domain was single words plus the empty string. Vowel-initial words
   received `ay`; otherwise the first consonant moved to the end before `ay`.
   The project targeted Node and TypeScript, with a test suite from the start.
   We also corrected the TypeScript setup for the requested TS 7 toolchain.

2. **Expanded behavior incrementally through examples.**
   We added phrases, capitalization, punctuation, arbitrary spaces, repeated
   punctuation, tabs/newlines, consonant clusters, double quotes, all-uppercase
   text, `qu`, and digit-only numbers. The user corrected example typos along the
   way. Existing general behavior sometimes made a newly added example pass
   without a production-code change. We discussed which further requirements
   would make the initial structure harder to maintain.

3. **Compared different ways to express the same translation problem.**
   We wrote classical, continuation-passing, and reducer versions alongside the
   original. The reducer was required to express its own translation logic rather
   than delegate to another implementation. At this point the question was code
   comprehension and structure, not adding new language behavior.

4. **Explored compositional decisions in a fourth alternative.**
   The composed reducer separated ordered translation decisions from observations
   such as casing and digit classification. The aim was to make additions more
   local and explicit. There were five implementations at the peak: original,
   classical, CPS, standalone reducer, and composed reducer.

5. **Examined quality measurements and stronger type boundaries.**
   We applied CRAP measurements, discussed their interpretation, and treated them
   as evidence rather than a definition of good code. We strengthened exhaustive
   decisions and introduced shared Effect Schema brands. Applicable changes were
   expected to apply across implementations, not only to composed. Tests expanded
   to feature interactions and domain assumptions. The raw CRAP report remains;
   an automated Markdown comparison report was removed at the user's request.

6. **Introduced the first Quint model and model-based testing.**
   `translate-composed.qnt` modeled ordered character/end events. Its reference
   translation buffered whole words and found the rotation boundary independently
   of the composed implementation's rule dispatch. A quint-connect-ts driver
   compared observable outputs. The user explicitly required changing TypeScript
   when the model exposed a logic problem, rather than forcing the model to fit it.

7. **Used a counterexample to correct punctuation semantics.**
   Model-based testing found that punctuation could move across following input:
   a fragment such as `2?8` could become `28?`. Supported punctuation was made a
   word boundary in all implementations then present. The counterexample was saved
   and replayed as a regression. This was a behavioral correction, not merely a
   rearrangement of reducer code.

8. **Made initialization and continuation structurally distinct.**
   Discussion of combined prefix/stem handling exposed hidden prerequisites.
   Both reducers gained a single state union: idle states have no word facts,
   prefix/stem states carry nonempty branded buffers, and classification starts
   with an actual first character. Composed decisions carried their narrowed
   source state. The first Quint model also distinguished empty pending input
   from a nonempty pending word, without copying the TypeScript state layout.

9. **Ran a separate original-only modeling experiment.**
   A fresh agent received the original implementation, shared domain definitions,
   and the existing MBT driver as a tooling example. It did not read the composed
   implementation or existing Quint models. It produced `translate-original.qnt`
   and a batch-only adapter. This experiment was not completely blind: unused
   reducer types were visible in the shared domain file, and driver wiring was
   explicitly allowed. It tested a broader input domain, including behaviors
   inferred from the original rather than established requirements.

10. **Integrated that experiment and compared model boundaries.**
    The work lived in a copied sandbox, not a Git worktree, and was integrated by
    copying its artifacts into the main project. The batch adapter was simpler
    than the reducer adapter. We distinguished testing `translate(text)` from
    additionally testing continued processing after an end/flush event.

11. **Cross-checked every implementation against the original-derived model.**
    Original, classical, and CPS each passed 5,100 observations. Both reducers
    disagreed on `;`: the original-derived model prescribed `;ay`, while the
    reducers returned `;AY`. Direct checks also found `1a` becoming `A1ay` versus
    `a1ay`. We preserved the discrepancies rather than treating the original as
    automatically correct. They exposed missing domain decisions and competing
    case-classification assumptions.

12. **Recentered the specification on the public batch contract.**
    The user challenged whether flush/continuation semantics were requirements at
    all. We agreed that returned text is the observable contract for
    `translate(text)`. Exported reducer helpers do not, by themselves, justify
    requiring a streaming protocol. A broader model is not necessarily a more
    faithful specification if it invents behavior outside that contract.

13. **Built the third model through two separate agents.**
    Agent A read only the ordinary public translation tests as text, without
    following imports, and extracted 32 literal examples plus a verbal distinction
    between demonstrated behavior, candidate generalizations, and undefined cases.
    Agent B received only those artifacts as behavioral inputs. It read no
    implementation, previous model, previous driver, or original test source.
    It produced `batch_from_verbal.qnt`, modeling complete calls with an independent
    word-level oracle, generated inputs, and preservation properties. The parent
    wrote the adapter after B chose its model interface.

14. **Made unsupported inputs explicit instead of assigning accidental behavior.**
    While the third experiment was finishing, the user chose a parse-before-
    translation boundary. A shared Effect Schema parser now returns either an
    error or branded `TranslationInput`; translation accepts the brand.
    `translateText(raw)` composes parsing with translation and never calls the
    translator on a parse failure. The conservative admitted/excluded domain is
    written in `INPUT-DOMAIN.md`. This new rejection policy was deliberately not
    fed back into the blind third-model experiment.

15. **Reduced the production comparison to two implementations.**
    At the user's request, classical, CPS, and the standalone reducer were removed.
    Original and composed remain. Tests, compile-time fixtures, coverage sources,
    and current model-test commands were updated accordingly. Historical results
    involving five implementations remain historical evidence, not current scope.

16. **Validated the independent batch model and the parsed boundary separately.**
    The third-model process had loaded the pre-parser five-implementation snapshot:
    all five passed the 32-example scenario and 5,100 generated observations each.
    After integration, original and composed also passed those checks through the
    parser. The model has 38 deterministic tests and sampled safety/witness checks.
    Parser rejection tests went red → green; a deliberate translation mutation
    also failed and then passed after restoration. The blind model itself still
    does not specify rejection responses and has a narrower admitted q-word family
    than the later input contract. Passing it does not close those specification gaps.

17. **Audited all three as specifications, independently and in parallel.**
    The user requested a comparison based on fidelity and completeness of requirements,
    not similarity to implementations or implementation test pass rates. The parent
    and a fresh reviewer independently reviewed the model files against the written
    contract; the reviewer received no implementation source or previous recommendations. Both
    recommended the third model as a foundation, while finding that none covers
    observable rejection and that the third excludes valid q spellings such as
    `square`. They recommended one public specification with selected tests/properties
    retained, rather than merging all three state machines. The recommendation is recorded
    in `reports/spec-review/REVIEW.md`; recommending consolidation is not itself a
    model merge or a new product requirement.

18. **Consolidated one authoritative public model.**
    After clarifying that model numbers meant creation order rather than table-row
    order, the user approved the fourth model. `SPEC.md` now states the consolidated
    contract and `translate-contract.qnt` expresses it independently of implementation
    architecture. It retains the third model's complete-call boundary, generalizes
    q admission structurally, and specifies both successful translation and truthful
    rejection diagnostics. Multiple applicable errors do not acquire an invented
    priority. Exact prefix/stem order is checked in addition to case, suffix,
    separator, and numeric preservation. Generator bounds and replay metadata live
    in separate support files, not in the domain model. The original 32 examples
    are extended to 67 requests including rejections. The default commands now use
    this fourth model against both public APIs. Models 1–3 remain historical;
    neither translator needed a production logic change for the consolidation.
    Validation passed: 77 direct specification tests, the 67-request scenario
    against each implementation, 5,100 generated comparisons per implementation
    (including rejected requests), 72 ordinary tests, and a mutation red → green
    check with byte-for-byte restoration. Sampled safety checks reached every
    request category. These results are evidence, not exhaustive verification.

## What Quint helped us discover

The chronology above includes three different kinds of finding: a translation bug,
unsettled requirements, and shortcomings in the specifications/checks themselves.
Not every finding came from a generated failing trace. Model comparison, directed
probes, and review also mattered; their contributions are distinguished below.

### A behavioral bug exposed by model-based testing

The first composed-model run produced a concrete counterexample: expected
`PAY7iosay2?8`, actual `PAY7iosay28?`. The relevant fragment was `2?8`: punctuation
moved across subsequent content instead of remaining a boundary. This led to a
production correction in all implementations then present, including the original,
and a regression replay. See the [saved trace](reports/composed-mbt-counterexample.json)
and chronology step 7. This is our concrete example of generated Quint testing
exposing a behavioral bug, rather than merely suggesting a refactoring.

### Missing requirements exposed by disagreements

Cross-testing against the original-derived model produced `;AY` from both reducers
where the model prescribed `;ay`. Follow-up **direct checks**, rather than that
generated counterexample, found `1a` → `A1ay` in original/classical/CPS versus
`a1ay` in the reducers. The implementations made different assumptions about
capitalization when characters have no case. Neither expected result had been
established by the requirements. See the [comparison record](MBT-shared.md) and
[run log](reports/shared-model/run.log).

These discrepancies prompted explicit questions about mixed letters/digits,
additional punctuation, mixed or ambiguous case, `y` and unusual `qu` spellings,
and ASCII versus Unicode. They did **not** prove that the original oracle was
correct or that every disputed reducer output was a bug. The user resolved the
uncertainty by excluding unsupported cases and requiring a parsing error before
translation. That decision became [INPUT-DOMAIN.md](INPUT-DOMAIN.md), the shared
branded input boundary, and eventually the fourth model's rejection outcomes.

### Specification gaps exposed by model review and directed Quint probes

| Finding | What the evidence established | Consequence for the fourth model |
| --- | --- | --- |
| No old model described observable rejection. | The first two translated unsupported inputs; the third disabled invalid calls. Disabling a call does not specify an error response. This was found in specification review. | Specify successful and rejected whole requests, including applicable diagnostics. |
| The third model excluded valid `square`. | A directed probe showed its q-word whitelist blocked admission even though its translation helper produced `aresquay`. This was a model/domain defect, not a translator bug. | Express the agreed structural q rule; keep sample word lists out of semantic admission. |
| The composed model specified an extra protocol. | A directed probe yielded `abay` for `ab` without an intermediate end, but `aaybay` with an end after `a`. Both obeyed that model. | Specify one complete call; do not import flush/continuation requirements into the public contract. |
| Preservation properties did not independently check rotation. | The synthetic pair `hello` → `helloay` satisfied the third model's properties. Its actual oracle still correctly produced `ellohay`; this was not a reachable translation failure. | Add an independent relation checking the exact prefix/stem order as well as preservation. |

The [parent review](reports/spec-review/REVIEW.md),
[independent review](reports/spec-review/INDEPENDENT-REVIEW.md), and their linked
Quint probes preserve this evidence. These findings explain why passing the older
models was insufficient, and why consolidation changed the specification without
requiring another production translator fix.

The prefix/stem initialization improvements in step 8 came from user questions and
code review; we also reflected them in Quint, but do not claim generated testing
discovered them. Likewise, the deliberate suffix mutations were test-sensitivity
checks, not newly discovered production bugs. The third and fourth experiments
found no additional translator bug within their tested admitted domains. Passing
sampled checks does not establish that the specification or implementation is complete.

## Current reference points

- `SPEC.md`: authoritative consolidated behavioral specification.
- `translate-contract.qnt`: fourth executable model of that specification.
- `MODEL.md`: fourth-model structure, abstraction, commands, and limits.

- `INPUT-DOMAIN.md`: current accepted-input and rejection contract.
- `specs/translate-verbal.md`: frozen evidence inferred from the earlier public tests.
- `specs/translate-examples.json`: those 32 exact examples.
- `MBT-verbal.md`: third-model provenance, scope, commands, and limits.
- `MBT-original.md`, `MBT.md`, `MBT-shared.md`: historical experiments and their caveats.
- `reports/spec-review/REVIEW.md`: comparison of specification fidelity and completeness.

The current public implementations are `translate.ts` and `translate-composed.ts`.
There are four historical model generations. The fourth model is the authoritative
public specification and default check; models 1–3 are retained as experiments.

After repository initialization, we reduced the remaining CRAP hotspots through
behavior-preserving helper extraction: consonant-cluster scanning in original,
word versus boundary decisions in composed, and token versus spelling checks in
the shared parser. The existing gate went red → green without raising its threshold
of 8. Maximum function scores changed from 9 → 6 (original), 10 → 7 (composed),
and 11 → 5 (shared domain). This reduces complexity per function; it does not
claim fewer overall decisions or establish specification fidelity.

We then explored interactive visualizations in separate Git worktrees: an
implementation walkthrough, an exploration timeline, and a contract explorer.
The user discarded the timeline and combined contract and implementation views.
Further experiments added an observed state diagram and a decision trace, then
compared three arrangements. The user selected A — Split. We retained that view
in the main project with live input refresh, synchronized keyboard navigation,
consistent diagram scope, and automatic scrolling inside the trace table.
`npm run visualize` serves it locally; deployment and a custom domain remain future
work. The visualization explains the TypeScript behavior and written contract;
it is not an additional executable Quint oracle.
