# Comparing public translation behavior

Historical experiment: current default commands and authority are documented in
[MODEL.md](MODEL.md) and [SPEC.md](SPEC.md). The original experiment description
below is retained as history; its default-command references describe that stage.

The initial comparison tested all five `translate(text)` implementations
against the unchanged original-derived `translate-original.qnt`. Each received
the same seed and generation settings. The reusable adapter in
`translation-mbt.ts` accepts only a translation function; it never imports or
observes reducer state. Every observation calls the function with complete input.

This is currently a diagnostic comparison, not an agreed behavioral specification.
At seed 42, original, classical, and CPS each pass all 5,100 observations.
Both reducers fail at trace 0, step 26: input `;` produces `;AY`, whereas the
model expects `;ay`. The command deliberately exits nonzero for these mismatches.
The log and complete counterexample traces are preserved in `reports/shared-model/`.

Direct checks also show `1a` becoming `A1ay` in original/classical/CPS versus
`a1ay` in the reducers. Their capitalization rules disagree on characters without
case: original treats a digit-leading token as capitalized; reducers can classify
a token with no letters as all-uppercase. Neither policy was established as a
requirement. No implementation or oracle was changed to conceal these findings.

For the public batch contract, correctness means the returned string matches
the agreed translation rules. Character events, intermediate phases, and
continuing after an end event are not additional requirements of `translate`.
The separate composed model explores the exported reducer API; it should only
be a required conformance check if that streaming API is itself supported.

The next contract decision is whether mixed alphanumeric tokens and punctuation
beyond whitespace and `,!?"` belong to the supported domain. Until that is
decided, this comparison does not declare either implementation authoritative.

After removing three implementations and adding the parser, this command tests only
original/composed and fails on unsupported input before translation. Preserved logs
record the original five-way experiment. Use `npm run test:mbt` for the current
shared batch checks; see [MBT-verbal.md](MBT-verbal.md).
