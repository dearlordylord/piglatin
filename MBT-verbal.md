# Third model: ordinary tests → verbal specification → Quint

Historical experiment: current default commands and authority are documented in
[MODEL.md](MODEL.md) and [SPEC.md](SPEC.md). The original experiment description
below is retained as history; its default-command references describe that stage.

Agent A read only a copy of the original public `translate.test.ts`, without
following imports or executing it. It extracted 32 exact input/output pairs and
separated asserted facts, candidate generalizations, and undefined cases.
Agent B received only those artifacts as behavioral evidence. It read no
implementation, existing Quint model, existing MBT driver, or original test source.
It independently chose atomic complete translation calls and ASCII-code-list text.

Artifacts:

- `specs/translate-verbal.md`: frozen verbal specification from agent A.
- `specs/translate-examples.json`: exact 32-example corpus.
- `batch_from_verbal.qnt`: independent batch oracle and bounded fresh generators.
- `batch_from_verbal_test.qnt`: 38 model tests, including every corpus example.
- `specs/verbal-model-notes.md`: agent B's original provenance and limits.
- `verbal-mbt.ts`: integration adapter written by the parent after the model design.
- `translate-verbal.mbt.ts`: checks original and composed through the shared parser.

Before implementation removal and the new parser boundary, all five implementations
passed the 32-example scenario (33 observations including initialization) and
5,100 generated observations each at seed 42. Logs are preserved in
`reports/verbal-model/`. This was 25,500 generated observations, not a proof.
The runtime calls in that baseline used the pre-parser API loaded by that test process.

The current default `npm run test:mbt` runs only original and composed. For each,
it replays the exact corpus separately from 100 generated traces of 50 complete calls.
Every generated input must parse successfully; rejection is a test failure, never
a silently skipped comparison. No internal reducer state is inspected.
`npm run spec:check` runs all 38 third-model tests; `npm run spec:simulate`
checks its safety properties and action/feature witnesses.

This is a better candidate for the shared **batch** contract because its behavioral
provenance is independent of implementation choices. Passing it does not establish
superiority by pass count: its domain is deliberately narrower than the original-derived
model, which exposed disagreements on inputs these tests never specified.
The literal examples are stronger evidence than the generated extrapolations.

The subsequent input-rejection policy is documented separately in `INPUT-DOMAIN.md`.
The frozen blind model predates that policy and does not model errors. Its generated
scope is a subset of the accepted parser domain (notably a smaller q-word family).
Parser rejection rules are tested through the public boundary in the ordinary tests.

The older original-derived and composed models remain as historical experiments.
Their broad alphabets are not the new supported domain. `test:mbt:original` and
`test:mbt:shared` now encounter parser failures on excluded inputs; they are diagnostic,
not default conformance gates. `test:mbt:composed` exercises only the internal reducer,
without making batch comparisons on inputs the new boundary rejects.

Run `python3 scripts/check-original-mutation.py` alone to demonstrate a deliberately
wrong vowel suffix failing the third model's corpus replay, restoring the source,
and rerunning green. It temporarily modifies `translate.ts`; do not edit that file
or run other tests concurrently. New mutation logs are in `reports/verbal-model/`.

The detected mutation trace is preserved in
`reports/verbal-model/mutation-trace.itf.json`; red and restored-green replay use
separate trace directories so old traces from a different model cannot be mixed in.
