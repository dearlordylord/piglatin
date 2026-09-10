// Independent reference model: collect a word, then translate it at a boundary.
// Punctuation/quotes/whitespace are boundaries and stay in their original order.
// Scope: ASCII letters and digits, comma, !, ?, double quotes, space/tab/newline.
// No concurrency or failures: each character or end event is atomic and ordered.
module translate_composed {
  pure val lowerLetters = List("a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z")
  pure val upperLetters = List("A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z")
  pure val digits = Set("0", "1", "2", "3", "4", "5", "6", "7", "8", "9")
  pure val separators = Set(",", "!", "?", "QUOTE", " ", "TAB", "LF")
  pure val alphabet = lowerLetters.indices().map(i => lowerLetters.nth(i)).union(upperLetters.indices().map(i => upperLetters.nth(i))).union(digits).union(separators)
  pure val lowercase = Map("A" -> "a", "B" -> "b", "C" -> "c", "D" -> "d", "E" -> "e", "F" -> "f", "G" -> "g", "H" -> "h", "I" -> "i", "J" -> "j", "K" -> "k", "L" -> "l", "M" -> "m", "N" -> "n", "O" -> "o", "P" -> "p", "Q" -> "q", "R" -> "r", "S" -> "s", "T" -> "t", "U" -> "u", "V" -> "v", "W" -> "w", "X" -> "x", "Y" -> "y", "Z" -> "z")
  pure val uppercase = Map("a" -> "A", "b" -> "B", "c" -> "C", "d" -> "D", "e" -> "E", "f" -> "F", "g" -> "G", "h" -> "H", "i" -> "I", "j" -> "J", "k" -> "K", "l" -> "L", "m" -> "M", "n" -> "N", "o" -> "O", "p" -> "P", "q" -> "Q", "r" -> "R", "s" -> "S", "t" -> "T", "u" -> "U", "v" -> "V", "w" -> "W", "x" -> "X", "y" -> "Y", "z" -> "Z")

  pure def lower(c: str): str = if (lowercase.keys().contains(c)) lowercase.get(c) else c
  pure def upper(c: str): str = if (uppercase.keys().contains(c)) uppercase.get(c) else c
  pure def vowel(c: str): bool = Set("a", "e", "i", "o", "u").contains(lower(c))
  pure def firstVowel(word: List[str]): int = word.indices().fold(word.length(), (best, i) => {
    val partOfQu = i > 0 and lower(word.nth(i)) == "u" and lower(word.nth(i - 1)) == "q"
    if (vowel(word.nth(i)) and not(partOfQu) and i < best) i else best
  })
  pure def translateWord(word: List[str]): List[str] = {
    val cut = firstVowel(word)
    val moved = word.slice(cut, word.length()).concat(word.slice(0, cut).foldl(List(), (xs, c) => xs.append(lower(c)))).concat(List("a", "y"))
    val allCaps = word.foldl(true, (ok, c) => ok and upper(c) == c)
    if (word.length() == 0 or word.foldl(true, (ok, c) => ok and digits.contains(c))) word
    else if (allCaps) moved.foldl(List(), (xs, c) => xs.append(upper(c)))
    else if (upperLetters.indices().map(i => upperLetters.nth(i)).contains(word.head())) List(upper(moved.head())).concat(moved.tail())
    else moved
  }

  // Reading always contains at least one character by construction.
  type NonEmptyWord = { first: str, rest: List[str] }
  type Pending = Empty | Reading(NonEmptyWord)
  type State = { committed: List[str], pending: Pending, input: List[str] }
  type View = { output: List[str] }
  var state: State
  var view: View
  var lastEvent: str

  pure def pendingText(p: Pending): List[str] = match p {
    | Empty => List()
    | Reading(word) => List(word.first).concat(word.rest)
  }
  pure def startWord(c: str): NonEmptyWord = { first: c, rest: List() }
  pure def appendWord(word: NonEmptyWord, c: str): NonEmptyWord = { ...word, rest: word.rest.append(c) }
  pure def addToPending(p: Pending, c: str): Pending = match p {
    | Empty => Reading(startWord(c))
    | Reading(word) => Reading(appendWord(word, c))
  }
  pure def render(s: State): List[str] = s.committed.concat(translateWord(pendingText(s.pending)))
  pure def appendCharacter(s: State, c: str): State =
    if (separators.contains(c)) {
      committed: render(s).append(c), pending: Empty, input: s.input.append(c),
    } else { ...s, pending: addToPending(s.pending, c), input: s.input.append(c) }
  pure def finish(s: State): State = { ...s, committed: render(s), pending: Empty }

  action init = all {
    state' = { committed: List(), pending: Empty, input: List() },
    view' = { output: List() },
    lastEvent' = "init",
  }
  action Character = {
    nondet character = alphabet.oneOf()
    val updated = appendCharacter(state, character)
    all { state' = updated, view' = { output: render(updated) }, lastEvent' = "character" }
  }
  action End = {
    val updated = finish(state)
    all { state' = updated, view' = { output: render(updated) }, lastEvent' = "end" }
  }
  action step = any { Character, End }

  val separatorsPreserved = view.output.select(c => separators.contains(c)) == state.input.select(c => separators.contains(c))
  val pendingHasNoSeparators = pendingText(state.pending).foldl(true, (ok, c) => ok and not(separators.contains(c)))
  val endFlushes = lastEvent == "end" implies state.pending == Empty
  val readingIsNonEmpty = match state.pending {
    | Empty => true
    | Reading(word) => alphabet.contains(word.first) and not(separators.contains(word.first))
  }
  val safety = separatorsPreserved and pendingHasNoSeparators and endFlushes and readingIsNonEmpty
  val sawCharacter = lastEvent == "character"
  val sawEnd = lastEvent == "end"
  val sawPunctuation = state.input.foldl(false, (seen, c) => seen or Set(",", "!", "?", "QUOTE").contains(c))
  val sawQu = pendingText(state.pending).indices().exists(i => i > 0 and lower(pendingText(state.pending).nth(i - 1)) == "q" and lower(pendingText(state.pending).nth(i)) == "u")
}
