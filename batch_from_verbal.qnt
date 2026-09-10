module batch_from_verbal {
  // Sole behavioral sources: specs/translate-verbal.md and specs/translate-examples.json.
  // Original experiment filenames: VERBAL-SPEC.md and examples.json.
  // A complete public call is atomic. ASCII code lists avoid unsupported Quint string operations and quote escapes.
  type Text = List[int]
  type Observation = { input: Text, output: Text, category: str }
  var observation: Observation
  // Replay instrumentation, not domain state.
  var replayAction: { tag: str, value: { input: Text } }
  pure val LOWER = Set(97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122)
  pure val UPPER = Set(65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90)
  pure val lowerMap = Map(65 -> 97, 66 -> 98, 67 -> 99, 68 -> 100, 69 -> 101, 70 -> 102, 71 -> 103, 72 -> 104, 73 -> 105, 74 -> 106, 75 -> 107, 76 -> 108, 77 -> 109, 78 -> 110, 79 -> 111, 80 -> 112, 81 -> 113, 82 -> 114, 83 -> 115, 84 -> 116, 85 -> 117, 86 -> 118, 87 -> 119, 88 -> 120, 89 -> 121, 90 -> 122)
  pure val upperMap = Map(97 -> 65, 98 -> 66, 99 -> 67, 100 -> 68, 101 -> 69, 102 -> 70, 103 -> 71, 104 -> 72, 105 -> 73, 106 -> 74, 107 -> 75, 108 -> 76, 109 -> 77, 110 -> 78, 111 -> 79, 112 -> 80, 113 -> 81, 114 -> 82, 115 -> 83, 116 -> 84, 117 -> 85, 118 -> 86, 119 -> 87, 120 -> 88, 121 -> 89, 122 -> 90)
  pure val SEPARATORS = Set(32, 9, 10, 44, 33, 63, 34)
  pure val DIGITS = Set(48, 49, 50, 51, 52, 53, 54, 55, 56, 57)
  pure val Q_WORDS = Set(List(113), List(113, 117, 101, 101, 110), List(113, 117, 101, 101, 110, 115), List(115, 113, 117, 101, 97, 108), List(115, 113, 117, 101, 97, 108, 115))

  pure val VOWELS = Set(97, 101, 105, 111, 117)
  pure def down(c: int): int = if (UPPER.contains(c)) lowerMap.get(c) else c
  pure def up(c: int): int = if (LOWER.contains(c)) upperMap.get(c) else c
  pure def lowerText(t: Text): Text = t.foldl(List(), (acc, c) => acc.append(down(c)))
  pure def every(t: Text, p: (int) => bool): bool = t.foldl(true, (ok, c) => ok and p(c))
  pure def has(t: Text, c: int): bool = t.select(x => x == c).length() > 0
  pure def isDigits(t: Text): bool = t.length() > 0 and every(t, c => DIGITS.contains(c))
  pure def isSeparator(t: Text): bool = t.length() == 1 and SEPARATORS.contains(t.head())

  // Split into complete lexical runs and literal one-character separators.
  pure def fragments(t: Text): List[Text] = {
    val scan = t.foldl({ parts: List(), word: List() }, (acc, c) =>
      if (SEPARATORS.contains(c)) {
        val flushed = if (acc.word.length() == 0) acc.parts else acc.parts.append(acc.word)
        { parts: flushed.append(List(c)), word: List() }
      } else { parts: acc.parts, word: acc.word.append(c) })
    if (scan.word.length() == 0) scan.parts else scan.parts.append(scan.word)
  }

  pure def supportedWord(t: Text): bool = {
    val low = lowerText(t)
    val letters = t.length() > 0 and every(t, c => LOWER.contains(c) or UPPER.contains(c))
    val casing = every(t, c => LOWER.contains(c)) or
      (t.length() >= 2 and (every(t, c => UPPER.contains(c)) or
        (UPPER.contains(t.head()) and every(t.tail(), c => LOWER.contains(c)))))
    letters and casing and not(has(low, 121)) and
      (not(has(low, 113)) or Q_WORDS.contains(low))
  }
  pure def supported(t: Text): bool =
    fragments(t).foldl(true, (ok, f) => ok and (isSeparator(f) or isDigits(f) or supportedWord(f)))

  // Find the first vowel outside the attached qu prefix; absent vowels mean an identity rotation.
  pure def pivot(low: Text): int = range(0, low.length()).foldl(low.length(), (best, i) => {
    val attachedU = if (i == 0) false else low.nth(i) == 117 and low.nth(i - 1) == 113
    if (i < best and VOWELS.contains(low.nth(i)) and not(attachedU)) i else best
  })
  pure def style(t: Text, caseKind: str): Text =
    if (caseKind == "upper") t.foldl(List(), (acc, c) => acc.append(up(c)))
    else if (caseKind == "title" and t.length() > 0) t.replaceAt(0, up(t.head()))
    else t
  pure def translateWord(t: Text): Text = {
    val low = lowerText(t)
    val cut = pivot(low)
    val rotated = low.slice(cut, low.length()).concat(low.slice(0, cut)).concat(List(97, 121))
    val caseKind = if (every(t, c => UPPER.contains(c))) "upper"
      else if (UPPER.contains(t.head())) "title" else "lower"
    style(rotated, caseKind)
  }
  pure def translateText(t: Text): Text = fragments(t).foldl(List(), (acc, f) =>
    acc.concat(if (isSeparator(f) or isDigits(f)) f else translateWord(f)))

  action init = all {
    observation' = { input: List(), output: List(), category: "init" },
    replayAction' = { tag: "Init", value: { input: List() } },
  }
  action translate(input: Text, category: str): bool = all {
    supported(input),
    observation' = { input: input, output: translateText(input), category: category },
    replayAction' = { tag: "Translate", value: { input: input } },
  }
  action Empty = translate(List(), "empty")

  // Exploratory domain: independently composed spellings, not an example lookup table.
  pure val PREFIXES = Set(List(), List(98), List(116, 114), List(115, 112, 108), List(99, 104), List(98, 114))
  pure val BODIES = Set(List(97, 116), List(101, 110), List(105, 103), List(111, 112), List(117, 109), List(101, 114, 97))
  pure val ENDINGS = Set(List(), List(115), List(105, 110, 103))
  pure val STYLES = Set("lower", "title", "upper")
  pure val BASE_WORDS = PREFIXES.map(p => BODIES.map(b => ENDINGS.map(e =>
    p.concat(b).concat(e))).flatten()).flatten().union(Set(List(98, 114, 114), List(110, 116, 104), List(122, 122, 122), List(113, 117, 101, 101, 110), List(113, 117, 101, 101, 110, 115), List(115, 113, 117, 101, 97, 108), List(115, 113, 117, 101, 97, 108, 115)))
  pure val GENERATED_WORDS = BASE_WORDS.map(w => STYLES.map(k => style(w, k))).flatten().union(Set(List(113)))
  pure val NUMBERS = DIGITS.map(a => DIGITS.map(b => DIGITS.map(c => List(a, b, c))).flatten()).flatten()
  pure val GAPS = Set(List(32), List(9), List(10), List(44), List(33, 33), List(63, 33), List(34, 34), List(33, 10), List(32, 9))
  pure val PADDING = Set(List(), List(32), List(32, 32), List(9), List(10), List(34))

  action Word = {
    nondet input = GENERATED_WORDS.oneOf()
    translate(input, "word")
  }
  action Number = {
    nondet input = NUMBERS.oneOf()
    translate(input, "number")
  }
  action Phrase = {
    nondet leftWord = GENERATED_WORDS.oneOf()
    nondet rightWord = GENERATED_WORDS.oneOf()
    nondet number = NUMBERS.oneOf()
    nondet gap1 = GAPS.oneOf()
    nondet gap2 = GAPS.oneOf()
    nondet leading = PADDING.oneOf()
    nondet trailing = PADDING.oneOf()
    translate(leading.concat(leftWord).concat(gap1).concat(number).concat(gap2).concat(rightWord).concat(trailing), "phrase")
  }
  action step = any { Empty, Word, Number, Phrase }
  val reachedWord = observation.category == "word"
  val reachedNumber = observation.category == "number"
  val reachedPhrase = observation.category == "phrase"
  val reachedQu = observation.category != "init" and fragments(observation.input).foldl(false,
    (found, f) => found or (f.length() > 1 and Q_WORDS.contains(lowerText(f))))
  val reachedVowelless = observation.category != "init" and fragments(observation.input).foldl(false,
    (found, f) => found or (supportedWord(f) and every(lowerText(f), c => not(VOWELS.contains(c)))))
  val reachedUpper = observation.category != "init" and fragments(observation.input).foldl(false,
    (found, f) => found or (supportedWord(f) and every(f, c => UPPER.contains(c))))
  val reachedTitle = observation.category != "init" and fragments(observation.input).foldl(false,
    (found, f) => found or (f.length() >= 2 and UPPER.contains(f.head()) and every(f.tail(), c => LOWER.contains(c))))
  val reachedEmpty = observation.category == "empty"
  val separatorsPreserved = observation.input.select(c => SEPARATORS.contains(c)) ==
    observation.output.select(c => SEPARATORS.contains(c))
  val digitsPreserved = observation.input.select(c => DIGITS.contains(c)) ==
    observation.output.select(c => DIGITS.contains(c))
  val suffixGrowth = observation.output.length() == observation.input.length() +
    2 * fragments(observation.input).select(f => not(isSeparator(f)) and not(isDigits(f))).length()
  // Independent preservation checks: one output fragment per input fragment, exact suffix,
  // same letter multiplicities before that suffix, and original whole-word case style.
  pure def wordPreserved(before: Text, after: Text): bool = {
    val n = after.length()
    val core = if (n >= 2) after.slice(0, n - 2) else List()
    val suffix = if (n >= 2) after.slice(n - 2, n) else List()
    val upper = every(before, c => UPPER.contains(c))
    val title = if (before.length() == 0) false else UPPER.contains(before.head()) and not(upper)
    n == before.length() + 2 and
      suffix == (if (upper) List(65, 89) else List(97, 121)) and
      LOWER.forall(c => lowerText(before).select(x => x == c).length() == lowerText(core).select(x => x == c).length()) and
      (if (upper) every(after, c => UPPER.contains(c))
       else if (title) UPPER.contains(after.head()) and every(after.tail(), c => LOWER.contains(c))
       else every(after, c => LOWER.contains(c)))
  }
  val fragmentsPreserved = {
    val before = fragments(observation.input)
    val after = fragments(observation.output)
    before.length() == after.length() and before.indices().forall(i => {
      val f = before.nth(i)
      if (isDigits(f) or isSeparator(f)) f == after.nth(i)
      else wordPreserved(f, after.nth(i))
    })
  }
  val safety = separatorsPreserved and digitsPreserved and suffixGrowth and fragmentsPreserved
}
