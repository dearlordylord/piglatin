# Fourth model: consolidated public contract

**Authority:** [SPEC.md](SPEC.md). This fourth model replaces the previous three
as the public specification without changing their historical artifacts.

- `translate-contract.qnt`: request/outcome types, structural admission grammar,
  permitted diagnostics, translation rules, and relational output properties.
- `translate-contract_generators.qnt`: finite sampling choices only.
- `translate-contract_harness.qnt`: stateless complete calls wrapped for simulation
  and replay; no public reducer protocol.
- `translate-contract_test.qnt`: direct specification tests.
- `translate-contract_scenarios.qnt`: one sequential replay of 67 concrete requests.
- `contract-mbt.ts` / `translate-contract.mbt.ts`: compare both public raw-input APIs
  with the same contract, checking success and rejection rather than skipping inputs.

These files support one model; the generator and replay wrapper are not additional
sources of domain requirements.

## What was consolidated

The whole-call abstraction and word-level transformation are retained from the
verbal-derived model, with structural q admission replacing its example whitelist.
Input exclusions now produce explicit rejection outcomes. Exact prefix/stem order,
whole-word case, suffix, digit and separator preservation are checked by a
relational property that does not call the output-producing translation helper.
The old `hello` → `helloay` preservation loophole is rejected by that property.

The older models' useful admitted examples and counterexample inputs are represented
as accepted or rejected requests under the current contract. Buffer states,
character/end protocols, arbitrary input-length bounds, old mixed-case conventions,
and translation of unsupported punctuation were not adopted.

## Diagnostics without invented priority

`outcomes(request)` returns the set of permitted individual outcomes. On success
that is one `Translated(text)`. On failure it contains one `Rejected(problem)` for
each applicable diagnostic. The API returns a single outcome, not the whole set.
This specifies useful errors without selecting which of several problems must win.
There is no disabled-request shortcut: every raw request has an outcome.

The bridge decodes current textual API errors into these semantic diagnostics.
That mapping knows the current message representation; the model does not require
its wording or Effect's error type. Unrecognized or false diagnostics fail the check.
The input parser is not used as the model's admission oracle.

## Abstractions and limits

Raw strings are encoded as lists of UTF-16 code units so the bridge can represent
unsupported Unicode and character locations as well as accepted ASCII. Translation
is specified only for the admitted ASCII domain. `NonText` abstracts every non-string
value; replay samples null, a number, a boolean, objects/arrays, and undefined.

The generators combine fresh prefixes, vowel-led bodies, endings, and case styles;
compose words/numbers/separators; and generate unsupported tokens, characters, and
short arbitrary strings. Their finite vocabularies and lengths constrain sampling,
not the grammar or function. Long numeric input is included in the exact corpus.
Simulation checks permitted results against independent order/preservation relations
and reports witnesses for every request category. These are sampled checks, not an
exhaustive proof of the model, parser, or translators.

## Commands

```sh
npm run typecheck
npm test
npm run spec:check
npm run spec:simulate
npm run test:mbt
```

Default commands run the fourth model. Explicit `:original`, `:composed`, and
`:verbal` commands retain the historical experiments and their documented limits.
The old original-derived model includes inputs now rejected by the public parser,
so its legacy implementation-comparison commands remain diagnostics, not gates.

Raw fourth-model traces are in `.mbt-traces/contract-*`; recorded results and red/green
evidence are in `reports/contract-model/`. To demonstrate fault sensitivity, run
`python3 scripts/check-original-mutation.py` alone: it temporarily mutates the vowel
suffix, verifies failure against the fourth model, restores the source, and reruns.

## Recorded validation

77 direct specification tests and the full 67-request scenario pass. Both original
and composed pass that scenario (68 observations including initialization) plus
5,100 generated comparisons each at seed 42. Each generated run includes 2,366
successful observations and 2,734 rejected observations. The 72 ordinary tests and
TypeScript checks pass. A deliberate vowel-suffix mutation fails the fourth-model
scenario, then passes after source restoration. The full failing trace is saved as
`reports/contract-model/mutation-trace.itf.json`.

The safety simulation used 100 traces with up to 15 steps and reached every request
category, including successful and rejected requests. No safety violation was found
in those samples; this is not a proof over all inputs.
