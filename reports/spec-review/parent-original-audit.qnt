module parent_original_audit {
  import translate_original.* from "../../translate-original"
  run squareTest = assert(translate(List("s", "q", "u", "a", "r", "e")) == List("a", "r", "e", "s", "q", "u", "a", "y"))
  run excludedDigitLetterTranslatedTest = assert(translate(List("1", "a")) == List("A", "1", "a", "y"))
  run excludedPunctuationTranslatedTest = assert(translate(List(";")) == List(";", "a", "y"))
}
