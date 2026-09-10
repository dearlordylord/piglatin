// Sampling policy only; these finite sets do not restrict the public input domain.
module translate_contract_generators {
  import translate_contract.* from "./translate-contract"
  pure val PREFIXES = Set(List(), List(98), List(116,114), List(115,112,108), List(116,104,114), List(113,117), List(115,113,117))
  pure val BODIES = Set(List(97,116), List(101,110), List(105,103), List(111,112), List(117,109), List(97,114,101))
  pure val ENDINGS = Set(List(), List(115), List(105,110,103))
  pure val STYLES = Set(Lowercase, TitleCase, Uppercase)
  pure val WORD_BASES = PREFIXES.map(p => BODIES.map(b => ENDINGS.map(e => p.concat(b).concat(e))).flatten()).flatten()
  pure val VALID_WORDS = WORD_BASES.union(Set(List(98,114,114), List(122,122,122)))
    .map(w => STYLES.map(style => applyStyle(w, style))).flatten().union(Set(List(97), List(113)))
  pure val DIGIT_CODES = Set(48,49,50,51,52,53,54,55,56,57)
  pure val NUMBERS = DIGIT_CODES.map(a => DIGIT_CODES.map(b => DIGIT_CODES.map(c => List(a,b,c))).flatten()).flatten()
  pure val GAPS = Set(List(32), List(9), List(10), List(44), List(33,33), List(63,33), List(34,34))
  pure val BOUNDARIES = Set(List(), List(48), List(48,48,48,48,48), List(32,9,10,44,33,63,34,34))
  pure val INVALID_TOKENS = Set(List(49,97), List(97,49), List(104,69,76,76,111), List(65), List(81), List(114,104,121,116,104,109), List(113,117), List(113,117,113,117,97,99,107), List(113,104,97,116), List(101,113,117,97,108))
  pure val BAD_CODES = Set(59,46,39,45,58,95,13,160,233,55357,56832)
  pure val RAW_CODES = Set(97,101,117,98,113,121,65,69,81,66,48,49,32,9,10,44,33,63,34,59,233)
}
