module parent_composed_audit {
  import translate_composed.* from "../../translate-composed"
  pure val blank = { committed: List(), pending: Empty, input: List() }
  run endChangesMeaningTest = {
    val first = appendCharacter(blank, "a")
    val withEnd = appendCharacter(finish(first), "b")
    val withoutEnd = appendCharacter(first, "b")
    assert(withEnd.input == withoutEnd.input and render(withEnd) == List("a", "a", "y", "b", "a", "y") and render(withoutEnd) == List("a", "b", "a", "y"))
  }
}
