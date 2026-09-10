// Independent batch oracle for translate.ts. ASCII corpus, not a Unicode specification.
// Append/Clear/Sample describe test-input construction, not implementation operations.
module translate_original {
  type View = { input: List[str], output: List[str] }
  var view: View

  pure val lowerLetters = List("a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z")
  pure val upperLetters = List("A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z")
  pure val digits = Set("0","1","2","3","4","5","6","7","8","9")
  pure val delimiters = Set(" ","TAB","LF",",","!","?","QUOTE")
  pure val alphabet = lowerLetters.indices().map(i => lowerLetters.nth(i))
    .union(upperLetters.indices().map(i => upperLetters.nth(i)))
    .union(digits).union(delimiters).union(Set(".","'","-",":",";","_"))
  pure def lower(c: str): str = {
    val locations = upperLetters.indices().filter(i => upperLetters.nth(i) == c)
    if (locations.size() == 0) c else lowerLetters.nth(locations.fold(0, (a, b) => a + b))
  }
  pure def upper(c: str): str = {
    val locations = lowerLetters.indices().filter(i => lowerLetters.nth(i) == c)
    if (locations.size() == 0) c else upperLetters.nth(locations.fold(0, (a, b) => a + b))
  }
  pure def vowel(c: str): bool = Set("a","e","i","o","u").contains(lower(c))

  // The split is the least eligible vowel index, or the end if there is none.
  // A u immediately following q is part of the movable prefix.
  pure def splitAt(word: List[str]): int = {
    val candidates = word.indices().filter(i => vowel(word.nth(i)) and
      (i == 0 or not(lower(word.nth(i)) == "u" and lower(word.nth(i - 1)) == "q")))
    candidates.fold(word.length(), (a, b) => if (a < b) a else b)
  }
  pure def token(word: List[str]): List[str] = {
    if (word.length() == 0 or word.indices().forall(i => digits.contains(word.nth(i)))) word
    else {
      val allCaps = word.indices().forall(i => upper(word.nth(i)) == word.nth(i)) and word.indices().exists(i => lower(word.nth(i)) != word.nth(i))
      val source = if (allCaps) word.foldl(List(), (acc, c) => acc.append(lower(c))) else word
      val pivot = splitAt(source)
      val shifted = slice(source, pivot, source.length())
        .concat(slice(source, 0, pivot).foldl(List(), (acc, c) => acc.append(lower(c)))).concat(List("a", "y"))
      val cased = if (pivot > 0 and upper(source.head()) == source.head())
        List(upper(shifted.head())).concat(shifted.tail()) else shifted
      if (allCaps) cased.foldl(List(), (acc, c) => acc.append(upper(c))) else cased
    }
  }
  pure def translate(input: List[str]): List[str] = {
    val parts = input.foldl({ finished: List(), pending: List() }, (acc, c) =>
      if (delimiters.contains(c))
        { finished: acc.finished.concat(token(acc.pending)).append(c), pending: List() }
      else { ...acc, pending: acc.pending.append(c) })
    parts.finished.concat(token(parts.pending))
  }
  pure val samples = Set(
    List(), List("a"), List("b"), List("Q","U","I","T"),
    List("s","q","u","a","r","e"), List("q","u"),
    List("q","u","q","u","a"), List("B","a","N","a","N","a"),
    List("A","p","p","l","e"), List("H","E","L","L","O"),
    List("1","2","3"), List("1","a"), List("1","b"), List("."),
    List("1",",","2","!","3"), List("a",".","b"),
    List("QUOTE","b","QUOTE","TAB","a","LF"),
    List("'","a"), List("x","y","z"), List("b","Y","a"))

  action init = view' = { input: List(), output: List() }
  action Append = {
    nondet character = alphabet.oneOf()
    val input = view.input.append(character)
    all { view.input.length() < 24, view' = { input: input, output: translate(input) } }
  }
  action Clear = view' = { input: List(), output: List() }
  action Sample = {
    nondet input = samples.oneOf()
    view' = { input: input, output: translate(input) }
  }
  action step = any { Append, Clear, Sample }
  val safety = all {
    view.input.length() <= 24,
    view.output.length() >= view.input.length(),
    view.input.select(c => delimiters.contains(c)) == view.output.select(c => delimiters.contains(c)),
  }
  val sawQu = view.input == List("s","q","u","a","r","e")
  val sawDigitsAndPunctuation = view.input == List("1",",","2","!","3")
  val sawMixedCase = view.input == List("B","a","N","a","N","a")
}
