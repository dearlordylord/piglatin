# Historical composed reducer model

Historical experiment: current default commands and authority are documented in
[MODEL.md](MODEL.md) and [SPEC.md](SPEC.md). The original experiment description
below is retained as history; its default-command references describe that stage.

The current public batch contract and default commands are documented in
[MBT-verbal.md](MBT-verbal.md) and [INPUT-DOMAIN.md](INPUT-DOMAIN.md).
This model is retained for optional internal reducer exploration using the
`:composed` commands; it is not the public input contract.

`translate-composed.qnt` is an independent reference model for
`translate-composed.ts`. It buffers a whole word and selects the first vowel by
index, rather than reproducing the implementation's phases, rules, or observers.
Each action is one ordered character event or an end/flush event.
Pending input is explicitly `Empty` or `Reading({ first, rest })`, so beginning a
word and appending to an existing word are separate operations. The safety
invariant checks that a reading state begins with a word character.

`translate-composed.mbt.ts` uses `@firfi/quint-connect` (the quint-connect-ts
project) to generate and replay traces through the real exported reducer. After
every step, it flushes a copy of the implementation state and compares the entire
observable output with the model. It does not assert equality of private buffering layouts.
Every trace gets fresh implementation state. Repeated end events are supported.

## Commands

```sh
npm ci
npm run spec:check:composed
npm run spec:simulate:composed
npm run test:mbt:composed
npm test
npm run typecheck
```

- `spec:check`: model typechecking and seven deterministic Quint examples.
- `spec:simulate`: 200 sampled traces, up to 50 steps each, seed 42; checks separator
  preservation, pending-token boundaries, and flushing. Reports reachability of
  character/end events, punctuation, and `qu`.
- `test:mbt`: the saved regression plus 100 generated traces, 50 steps each, seed 42.
  Requires all 5,100 state comparisons (including initialization) to run.
- To explore another reproducible seed: `QUINT_SEED=123 npm run test:mbt`.

Raw generated traces are retained in `.mbt-traces/composed/` and ignored by Git.
On mismatch, quint-connect reports the trace/step and expected/actual output.

## Model boundary

The finite alphabet contains all ASCII uppercase/lowercase letters and digits,
comma, exclamation mark, question mark, double quote, space, tab, and newline.
Quint represents text as lists; `QUOTE`, `TAB`, and `LF` stand for the corresponding
single characters. The driver validates decoded characters with the shared brand.
Unicode casing, punctuation outside this alphabet, asynchronous streams, resource
usage, and stack limits are not modeled. These are sampled checks, not an
exhaustive proof. Phase/state invariants remain covered by the reducer unit tests.

The connector's Effect-4 build is pinned to `2.0.2-effect4.2`. Effect is pinned to
its compatible `4.0.0-rc.112` dependency: mixing rc.112 and rc.113 across the
connector's ITF schema decoder produced runtime decoding failures. The tests use
the Simple API with Effect's Standard Schema adapter and the local Quint 0.32.0 CLI.

## Finding and correction

The first successful trace replay found punctuation moving past subsequent text:
`2?8` became `28?`. The complete original trace prefix and expected/actual output
are saved in `reports/composed-mbt-counterexample.json` and replayed as a regression.

The model treats supported punctuation as a word boundary and preserves its position.
The TypeScript implementations were corrected accordingly, rather than changing the
model to reproduce the bug. For example:

- `hello,world` becomes `ellohay,orldway`.
- `1,2` remains `1,2`.
- `q!ueen` becomes `qay!ueenay`; the consonant prefix cannot cross `!`.

Both reducers now flush at punctuation. Their former `after` phase field, which
remembered where to resume a word across punctuation, was removed. The same
boundary correction applies to the original, classical, and CPS implementations.

The retained composed reducer uses a single discriminated state union: idle states
have no word fields, prefix states contain a nonempty branded prefix, and stem
states contain a nonempty branded stem. Classification begins with the first
character. Composed decisions carry their narrowed source state and distinguish
starting a word, appending a prefix, completing `qu`, starting a stem, and
appending a stem. Compile-time negative fixtures check these prerequisites.
The Quint model keeps its independent whole-word representation rather than
copying these implementation transitions.
