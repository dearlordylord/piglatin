"Pig latin" string manipulation oneshot experiment.

Naïve imperative implementation: [translate.ts](translate.ts), although short, proven to be (subjectively) difficult to derive specifications from.

Experiment1: derive CPS-style and a Reducer-style implementations with LLMs.

CPS looked fishy, I discarded it, but Reducer was interesting: I found it very easy to understand, although quite a bit more verbose.

Every business rule was explicitly stated in the code.
