module translate_original_test {
  import translate_original.* from "./translate-original"
  run vowelTest = { assert(translate(List("a")) == List("a","a","y")) }
  run quTest = { assert(translate(List("s","q","u","a","r","e")) == List("a","r","e","s","q","u","a","y")) }
  run noVowelTest = { assert(translate(List("q","u")) == List("q","u","a","y")) }
  run uppercaseTest = { assert(translate(List("Q","U","I","T")) == List("I","T","Q","U","A","Y")) }
  run mixedCaseTest = { assert(translate(List("B","a","N","a","N","a")) == List("A","N","a","N","a","b","a","y")) }
  run digitsTest = { assert(translate(List("1",",","2","!","3")) == List("1",",","2","!","3")) }
  run digitLetterTest = { assert(translate(List("1","a")) == List("A","1","a","y")) }
  run periodTest = { assert(translate(List(".")) == List(".","a","y")) }
  run emptyTest = { assert(translate(List()) == List()) }
  run separatorsTest = { assert(translate(List("TAB","!","QUOTE","LF")) == List("TAB","!","QUOTE","LF")) }
}
