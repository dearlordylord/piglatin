// Test generation/replay only. Bounds and instrumentation are not product requirements.
module translate_contract_harness {
  import translate_contract.* from "./translate-contract"
  import translate_contract_generators.* from "./translate-contract_generators"
  type Sample = Initial | Example | WordSample | PhraseSample | InvalidSample | CharacterSample | RawSample | NonTextSample | BoundarySample
  var sample: Sample
  var observation: { request: Request, permitted: Set[Outcome] }
  var replayAction: { tag: str, value: { text: Text, representative: int } }
  action init = all {
    sample' = Initial,
    observation' = { request: TextInput(List()), permitted: outcomes(TextInput(List())) },
    replayAction' = { tag: "Text", value: { text: List(), representative: 0 } },
  }
  action nonText(representative: int): bool = all {
    sample' = NonTextSample,
    observation' = { request: NonText, permitted: outcomes(NonText) },
    replayAction' = { tag: "NonText", value: { text: List(), representative: representative } },
  }
  action submitText(text: Text, kind: Sample): bool = all {
    sample' = kind,
    observation' = { request: TextInput(text), permitted: outcomes(TextInput(text)) },
    replayAction' = { tag: "Text", value: { text: text, representative: 0 } },
  }
  action textRequest(text: Text): bool = submitText(text, Example)
  action NonString = { nondet representative = Set(0,1,2,3,4,5,6).oneOf() nonText(representative) }
  action Word = { nondet text = VALID_WORDS.oneOf() submitText(text, WordSample) }
  action Boundary = { nondet text = BOUNDARIES.oneOf() submitText(text, BoundarySample) }
  action Phrase = {
    nondet left = VALID_WORDS.oneOf()
    nondet right = VALID_WORDS.oneOf()
    nondet number = NUMBERS.oneOf()
    nondet gap1 = GAPS.oneOf()
    nondet gap2 = GAPS.oneOf()
    submitText(left.concat(gap1).concat(number).concat(gap2).concat(right), PhraseSample)
  }
  action InvalidToken = {
    nondet word = VALID_WORDS.oneOf()
    nondet invalid = INVALID_TOKENS.oneOf()
    submitText(word.concat(List(32)).concat(invalid).concat(List(32)).concat(word), InvalidSample)
  }
  action InvalidCharacter = {
    nondet word = VALID_WORDS.oneOf()
    nondet code = BAD_CODES.oneOf()
    submitText(word.append(code), CharacterSample)
  }
  action Arbitrary = {
    nondet a = RAW_CODES.oneOf()
    nondet b = RAW_CODES.oneOf()
    nondet c = RAW_CODES.oneOf()
    nondet d = RAW_CODES.oneOf()
    submitText(List(a,b,c,d), RawSample)
  }
  action step = any { NonString, Word, Boundary, Phrase, InvalidToken, InvalidCharacter, Arbitrary }
  val sawWord = sample == WordSample
  val sawBoundary = sample == BoundarySample
  val sawPhrase = sample == PhraseSample
  val sawInvalidToken = sample == InvalidSample
  val sawInvalidCharacter = sample == CharacterSample
  val sawArbitrary = sample == RawSample
  val sawAccepted = sample != Initial and observation.permitted.exists(r => match r { | Translated(_) => true | Rejected(_) => false })
  val sawRejected = sample != Initial and observation.permitted.exists(r => match r { | Rejected(_) => true | Translated(_) => false })
  val safety = observation.permitted.size() > 0 and
    observation.permitted.forall(outcome => outcomeConforms(observation.request, outcome))
  val reachedNonText = observation.request == NonText
}
