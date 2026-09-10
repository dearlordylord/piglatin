# Historical independent original-implementation experiment

Historical experiment: current default commands and authority are documented in
[MODEL.md](MODEL.md) and [SPEC.md](SPEC.md). The original experiment description
below is retained as history; its default-command references describe that stage.

These results describe the pre-parser implementation snapshot. Current APIs and
default commands are in [INPUT-DOMAIN.md](INPUT-DOMAIN.md) and
[MBT-verbal.md](MBT-verbal.md). The old oracle includes inputs now explicitly
rejected by the parser; its MBT command is retained as a diagnostic, not a default gate.
The maintained mutation script now uses the third model and writes to `reports/verbal-model/`.

The original `translate.ts` agrees with this independently constructed Quint oracle on 300 generated traces (15,300 output comparisons) across seeds 42, 2026, and 98765. Each trace has 50 actions plus the initial observation. These are sampled conformance checks, not exhaustive proof or measured implementation coverage.

## Isolation and source influence

All work occurred in `/workspace/typescript/piglatin-original-experiment`, a copied sandbox, not a git worktree. No pre-existing `.qnt`, other implementation source, prior coverage, or prior trace was read. The model and driver were written afresh here. The original `translate.ts` and its shared `domain.ts` were read; the latter includes unused reducer state types that were visible but did not guide the model. Only original imports `TokenFragment` and `isDigitSequence` were relevant.

The explicitly permitted `translate-composed.mbt.ts` was read as connector tooling documentation. It influenced the `defineDriver`/`run`/`stateCheck` wiring, symbolic quote/tab/newline encoding, state-path projection, and per-step comparison counting. Its reducer operation names, state decomposition, and algorithm were not reused. Installed connector README documentation supplied the requirement to put named actions in `any { ... }` for TypeScript action metadata. External Quint skill documentation supplied language/workflow guidance. The skills' normal design sign-off gate was superseded by the explicit request to construct this experiment independently through tested completion.

## Model design

`translate-original.qnt` corresponds to original `translate.ts` only. There is one observable record: `{input, output}`, represented as character lists because Quint lacks general string operations. Each observation describes an atomic, complete batch call.

The pure oracle splits the input at delimiters and translates each token. Its consonant boundary is declarative: the least vowel position whose `u` is not immediately preceded by `q`, defaulting to the end. This avoids reproducing the implementation's advancing cluster loop. Case classification, prefix normalization, and whole-uppercase conversion are defined over lists. Digit-only tokens remain unchanged.

Actions describe a test-input editor, not hidden implementation transitions:

- `Append`: append one generated character, up to 24 input symbols.
- `Clear`: replace input with the empty list.
- `Sample`: replace input with one of 20 curated inputs targeting edge cases.

All 26 ASCII letters in both cases, all digits, seven delimiter symbols, and six additional punctuation symbols can be generated. Curated cases include repeated `qu`, vowel-less words, mixed capitalization, digit-letter combinations, and delimiter runs. Safety checks preserve delimiter sequence, ensure output never shrinks, and bound input. Reachability witnesses demonstrate that representative `qu`, mixed-case, and digits-with-punctuation inputs actually occur. Ten separate deterministic model tests check explicit expected results.

No external behavioral specification was supplied. The oracle therefore captures behavior inferred from the original, including surprising policies: a period is part of a token (`.` becomes `.ay`), a digit-leading mixed token can capitalize its shifted stem (`1a` becomes `A1ay`), and `y` is not a vowel. These are assumptions to review, not independently established product requirements. ASCII case handling does not cover JavaScript Unicode case expansion, surrogate pairs, all whitespace characters, or arbitrarily long inputs.

## Adapter and API implications

`translate-original.mbt.ts` imports only original `translate` as the system under test. It stores an input string, translates symbolic characters, and calls `translate(input)` in `getState`. It contains no translation oracle. The model supplies expected output; comparison checks exact input and output strings after every action and initialization. The input comparison checks adapter encoding; output equality is the conformance assertion.

A batch-only API makes this adapter smaller: it needs no reducer state, pending prefix, flush-copy logic, or comparison between batch and incremental implementations. Re-observing a growing prefix means rerunning the complete translation, so a trace can cost quadratically in its input length. Model input construction is stateful; the implementation under test remains a pure function.

There is intentionally no `End` action: every original API call already finalizes its argument. The experiment cannot observe a partially consumed word, detect an incorrect internal state that later repairs itself, check streaming chunk boundaries, or establish repeated-End semantics. Calling `translate` on a prefix is not evidence about a real streaming implementation. Model witnesses and 15,300 comparisons also do not measure original branch/line coverage; no implementation coverage instrumentation was used. Only behavioral differences visible in returned strings can be detected.

## Reproduction and results

Run these commands from the main project directory:

```sh
node_modules/.bin/quint typecheck translate-original.qnt
node_modules/.bin/quint test translate-original_test.qnt --main translate_original_test --max-samples 1
node_modules/.bin/quint run translate-original.qnt --main translate_original --invariant safety --witnesses sawQu sawDigitsAndPunctuation sawMixedCase --max-samples 200 --max-steps 50 --seed 42 --backend typescript --verbosity 1
npm run typecheck
QUINT_SEED=42 TRACE_DIR=.mbt-traces/original-42 node --test translate-original.mbt.ts
QUINT_SEED=2026 TRACE_DIR=.mbt-traces/original-2026 node --test translate-original.mbt.ts
QUINT_SEED=98765 TRACE_DIR=.mbt-traces/original-98765 node --test translate-original.mbt.ts
python3 scripts/check-original-mutation.py
```

Typecheck and driver TypeScript checks pass. All ten deterministic tests pass. The 200 × 50-step simulation finds no safety violation; witnesses occur in 106/200 traces (`qu`), 117/200 (digits with punctuation), and 109/200 (mixed case). Each MBT seed passes 100 traces and exactly 5,100 observations. Experiment logs are in `reports/original-experiment/`; generated ITF traces are in `.mbt-traces/`.

The deliberate mutation originally changed only the isolated original's vowel suffix from `ay` to `xx`. MBT fails at seed 42, trace 0, step 6, action `Sample`: input `"b"\ta\n` expects `"bay"\taay\n` but returns `"bay"\taxx\n`. The full failure trace remains at `.mbt-traces/mutation/trace_0.itf.json`, with mismatch details in `reports/original-experiment/mutation-red.log`. This is a deliberately introduced fault, not a finding against the restored original. `scripts/check-original-mutation.py` restores original bytes in `finally`, records matching before/after SHA256 hashes, then reruns MBT to green. Neither original source nor `domain.ts` has a permanent change.

No real discrepancy was found within this domain. The experiment demonstrates an independent algorithmic oracle and fault-sensitive connector wiring; shared inference from the original still limits independence of the intended semantics.

The integrated mutation script temporarily edits the main `translate.ts`; run it
alone, without concurrent edits or tests. It restores the source in `finally`.
The original captured mutation trace is preserved at
`reports/original-experiment/mutation-trace.itf.json`.
