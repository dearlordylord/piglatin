// Authoritative public behavior: SPEC.md. Historical examples: specs/translate-examples.json.
// No reducer protocol, implementation state, generator bounds, or error-message format.
module translate_contract {
  // UTF-16 code units are only an encoding of raw strings; admitted text is ASCII.
  type Text = List[int]
  type Request = TextInput(Text) | NonText
  type TokenReason = MixedLettersDigits | UnsupportedCase | UndefinedY | UnsupportedQ
  type Problem = NotAString | BadCharacter({ index: int, code: int }) | BadToken({ token: Text, reason: TokenReason })
  type Outcome = Translated(Text) | Rejected(Problem)
  type CaseStyle = Lowercase | TitleCase | Uppercase
  pure val SEPARATORS = Set(32, 9, 10, 44, 33, 63, 34) // space, tab, LF, comma, !, ?, quote
  pure def isLower(c: int): bool = 97 <= c and c <= 122
  pure def isUpper(c: int): bool = 65 <= c and c <= 90
  pure def isLetter(c: int): bool = isLower(c) or isUpper(c)
  pure def isDigit(c: int): bool = 48 <= c and c <= 57
  pure def down(c: int): int = if (isUpper(c)) c + 32 else c
  pure def up(c: int): int = if (isLower(c)) c - 32 else c
  pure def lowerText(text: Text): Text = text.foldl(List(), (out, c) => out.append(down(c)))
  pure def every(text: Text, p: (int) => bool): bool = text.indices().forall(i => p(text.nth(i)))
  pure def digits(text: Text): bool = text.length() > 0 and every(text, c => isDigit(c))
  pure def separator(text: Text): bool = text.length() == 1 and SEPARATORS.contains(text.head())
  pure def vowel(c: int): bool = Set(97, 101, 105, 111, 117).contains(c)

  // Lexical partition of one complete input, retaining every literal separator.
  pure def fragments(text: Text): List[Text] = {
    val scan = text.foldl({ parts: List(), token: List() }, (acc, c) =>
      if (SEPARATORS.contains(c)) {
        val parts = if (acc.token.length() == 0) acc.parts else acc.parts.append(acc.token)
        { parts: parts.append(List(c)), token: List() }
      } else { parts: acc.parts, token: acc.token.append(c) })
    if (scan.token.length() == 0) scan.parts else scan.parts.append(scan.token)
  }
  // On admitted words these styles are disjoint (single uppercase letters are excluded).
  pure def caseStyle(word: Text): CaseStyle =
    if (every(word, c => isUpper(c))) Uppercase
    else if (isUpper(word.head())) TitleCase else Lowercase
  pure def applyStyle(text: Text, style: CaseStyle): Text = match style {
    | Lowercase => text
    | Uppercase => text.foldl(List(), (out, c) => out.append(up(c)))
    | TitleCase => text.replaceAt(0, up(text.head()))
  }
  pure def eligibleVowel(word: Text, i: int): bool =
    if (i == 0) vowel(word.nth(i))
    else vowel(word.nth(i)) and not(word.nth(i) == 117 and word.nth(i - 1) == 113)
  pure def prefixSize(word: Text): int = word.indices().filter(i => eligibleVowel(word, i))
    .fold(word.length(), (a, b) => if (a < b) a else b)
  pure def translateWord(word: Text): Text = {
    val low = lowerText(word)
    val cut = prefixSize(low)
    applyStyle(low.slice(cut, low.length()).concat(low.slice(0, cut)).concat(List(97, 121)), caseStyle(word))
  }
  // Precondition: the whole input is admitted. No partial output is exposed on failure.
  pure def translateAccepted(text: Text): Text = fragments(text).foldl(List(), (out, f) =>
    out.concat(if (separator(f) or digits(f)) f else translateWord(f)))
  pure def admittedCase(word: Text): bool = every(word, c => isLower(c)) or
    (word.length() >= 2 and (every(word, c => isUpper(c)) or
      (isUpper(word.head()) and every(word.tail(), c => isLower(c)))))
  pure def admittedQ(low: Text): bool = {
    val positions = low.indices().filter(i => low.nth(i) == 113)
    if (positions.size() == 0 or low == List(113)) true
    else if (positions.size() != 1) false
    else {
      val q = positions.fold(0, (a, b) => a + b)
      if (q + 2 >= low.length()) false
      else every(low.slice(0, q), c => not(vowel(c))) and
        low.nth(q + 1) == 117 and vowel(low.nth(q + 2))
    }
  }
  pure def tokenProblems(token: Text): Set[Problem] = {
    val hasLetter = token.indices().exists(i => isLetter(token.nth(i)))
    val hasDigit = token.indices().exists(i => isDigit(token.nth(i)))
    if (hasLetter and hasDigit)
      Set(BadToken({ token: token, reason: MixedLettersDigits }))
    else if (token.length() == 0 or not(every(token, c => isLetter(c)))) Set()
    else {
      val low = lowerText(token)
      val casing = if (admittedCase(token)) Set() else Set(BadToken({ token: token, reason: UnsupportedCase }))
      val y = if (low.indices().exists(i => low.nth(i) == 121)) Set(BadToken({ token: token, reason: UndefinedY })) else Set()
      val q = if (admittedQ(low)) Set() else Set(BadToken({ token: token, reason: UnsupportedQ }))
      casing.union(y).union(q)
    }
  }
  // Return every applicable diagnostic: priority and exact wording are not requirements.
  pure def problems(text: Text): Set[Problem] = {
    val badCharacters = text.indices().filter(i => {
      val c = text.nth(i)
      not(isLetter(c) or isDigit(c) or SEPARATORS.contains(c))
    }).map(i => BadCharacter({ index: i, code: text.nth(i) }))
    fragments(text).foldl(badCharacters, (issues, token) => issues.union(tokenProblems(token)))
  }
  pure def outcomes(request: Request): Set[Outcome] = match request {
    | NonText => Set(Rejected(NotAString))
    | TextInput(text) => {
        val issues = problems(text)
        if (issues.size() == 0) Set(Translated(translateAccepted(text)))
        else issues.map(issue => Rejected(issue))
      }
  }
  // Relational output contract. It does not call prefixSize or translateWord.
  pure def movable(word: Text, i: int): bool =
    not(vowel(word.nth(i))) or (if (i == 0) false else word.nth(i) == 117 and word.nth(i - 1) == 113)
  pure def legalSplit(word: Text, cut: int): bool =
    word.indices().filter(i => i < cut).forall(i => movable(word, i)) and
      (if (cut == word.length()) true else not(movable(word, cut)))
  pure def wordConforms(before: Text, after: Text): bool = {
    if (before.length() == 0 or after.length() != before.length() + 2) false
    else {
      val low = lowerText(before)
      val correctOrder = range(0, low.length() + 1).indices().exists(cut =>
        legalSplit(low, cut) and lowerText(after) ==
          low.slice(cut, low.length()).concat(low.slice(0, cut)).concat(List(97, 121)))
      val correctCase = match caseStyle(before) {
        | Lowercase => every(after, c => isLower(c))
        | Uppercase => every(after, c => isUpper(c))
        | TitleCase => isUpper(after.head()) and every(after.tail(), c => isLower(c))
      }
      correctOrder and correctCase
    }
  }
  pure def translationConforms(before: Text, after: Text): bool = {
    val inputs = fragments(before)
    val outputs = fragments(after)
    inputs.length() == outputs.length() and inputs.indices().forall(i => {
      val token = inputs.nth(i)
      if (separator(token) or digits(token)) token == outputs.nth(i)
      else wordConforms(token, outputs.nth(i))
    })
  }
  pure def outcomeConforms(request: Request, outcome: Outcome): bool = match request {
    | NonText => outcome == Rejected(NotAString)
    | TextInput(text) => match outcome {
        | Translated(output) => problems(text).size() == 0 and translationConforms(text, output)
        | Rejected(problem) => problems(text).contains(problem)
      }
  }
}
