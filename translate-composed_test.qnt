module translate_composed_test {
  import translate_composed.* from "./translate-composed"

  pure def result(input: List[str]): List[str] = render(input.foldl(
    { committed: List(), pending: Empty, input: List() },
    (s, c) => appendCharacter(s, c)
  ))

  run startAndAppendTest = all {
    addToPending(Empty, "t") == Reading({ first: "t", rest: List() }),
    addToPending(Reading({ first: "t", rest: List() }), "h") == Reading({ first: "t", rest: List("h") }),
    finish({ committed: List(), pending: Reading({ first: "a", rest: List() }), input: List("a") }).pending == Empty,
  }

  run vowelTest = all { result(List("e", "x", "t", "r", "a")) == List("e", "x", "t", "r", "a", "a", "y") }
  run clusterTest = all { result(List("t", "h", "r", "e", "e")) == List("e", "e", "t", "h", "r", "a", "y") }
  run quTest = all { result(List("Q", "U", "E", "E", "N")) == List("E", "E", "N", "Q", "U", "A", "Y") }
  run digitsTest = all { result(List("QUOTE", "0", "1", "2", "!", "QUOTE")) == List("QUOTE", "0", "1", "2", "!", "QUOTE") }
  run whitespaceTest = all { result(List("TAB", "a", "LF")) == List("TAB", "a", "a", "y", "LF") }
  run punctuationBoundaryTest = all { result(List("a", "!", "b")) == List("a", "a", "y", "!", "b", "a", "y") }
}
