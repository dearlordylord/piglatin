# "Pig latin" string manipulation oneshot experiment.

Example-based tests: [translate.test.ts](translate.test.ts) (read to get initial intuition of what the task logic is about)
Naïve imperative implementation: [translate.ts](translate.ts), although short, proven to be (subjectively) difficult to derive specifications from.

## Experiment1: derive CPS-style and a Reducer-style implementations with LLMs.

CPS looked fishy, I discarded it, but Reducer ([translate-composed.ts](translate-composed.ts)) was interesting: I found it very easy to understand, although quite a bit more verbose.

Every business rule was explicitly stated in the code of reducer version and it is perceivably easy to get through and to potentially add features.

That said, it's also possible to derive specifications from the example-based tests.

## Experiment2: add formal proofs with Quint

1) derived qnt + mbt by llm from reducer code
2) derived qnt + mbt by llm from naive code
3) derived verbal specs => derived qnt + mbt by llm from verbal specs

Comparing those, I found that, although they all tested a large bunch of logic about that later),

- (1) one (reducer) introduced too much reducer-ish implementation details and was a bit poisoned with testing implementation, not spec
- (2) naïve one forgot some specifications
- (3) verbal one behaved closest to the intent

So [translate-contract.qnt](translate-contract.qnt) was derived from findings (1) (2) (3)

Importantly, what all the above shown was 

- initial spec insufficiency - qnt properly identified unhandled corner cases
- implementation bug - although just one - of already defined part of the spec

A negative side is that qnt spec remains, although more precise, still less readable than reducer .ts implementation

## Experiment3:

The realisation that a reducer/state machine event visualisation isn't the last step in the process of getting to the user! 

LLM one-shot a nice visualisation that animates the word transformation using the events. 

![Scrubbing the event bar animates the letters of “square” into Pig Latin.](docs/word-transformation.gif)

## Conclusions, recommendations

- qnt spec helps with precision, but not necessarily with spec readability
- reducer version helped with business logic and requirements readability, being very explicit in its intent
- it is clear that the reducer version is much less performant, and maybe shall be used as an oracle in property-based testing
- qnt spec came better out of verbal specs, when LLMs dont look at the code; it's not clear if it's general behaviour or just happened locally
- reducer version seemed to help with visualisation
