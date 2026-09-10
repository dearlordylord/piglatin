module batch_from_verbal_test {
  import batch_from_verbal.* from "./batch_from_verbal"
  // 1: returns an empty string for an empty word
  run example01Test = init.then(translate(List(), "exact")).expect(observation.output == List())
  // 2: adds ay to words starting with a vowel
  run example02Test = init.then(translate(List(97, 112, 112, 108, 101), "exact")).expect(observation.output == List(97, 112, 112, 108, 101, 97, 121))
  // 3: adds ay to words starting with a vowel
  run example03Test = init.then(translate(List(101, 120, 116, 114, 97), "exact")).expect(observation.output == List(101, 120, 116, 114, 97, 97, 121))
  // 4: adds ay to words starting with a vowel
  run example04Test = init.then(translate(List(105, 103, 108, 111, 111), "exact")).expect(observation.output == List(105, 103, 108, 111, 111, 97, 121))
  // 5: adds ay to words starting with a vowel
  run example05Test = init.then(translate(List(111, 114, 97, 110, 103, 101), "exact")).expect(observation.output == List(111, 114, 97, 110, 103, 101, 97, 121))
  // 6: adds ay to words starting with a vowel
  run example06Test = init.then(translate(List(117, 110, 100, 101, 114), "exact")).expect(observation.output == List(117, 110, 100, 101, 114, 97, 121))
  // 7: moves the first consonant to the end and adds ay
  run example07Test = init.then(translate(List(104, 101, 108, 108, 111), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121))
  // 8: translates each word in a phrase
  run example08Test = init.then(translate(List(104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 32, 111, 114, 108, 100, 119, 97, 121))
  // 9: preserves capitalization when translating a phrase
  run example09Test = init.then(translate(List(72, 101, 108, 108, 111, 32, 69, 120, 99, 105, 116, 105, 110, 103, 32, 119, 111, 114, 108, 100), "exact")).expect(observation.output == List(69, 108, 108, 111, 104, 97, 121, 32, 69, 120, 99, 105, 116, 105, 110, 103, 97, 121, 32, 111, 114, 108, 100, 119, 97, 121))
  // 10: keeps a comma after the translated word
  run example10Test = init.then(translate(List(104, 101, 108, 108, 111, 44, 32, 101, 120, 99, 105, 116, 105, 110, 103, 32, 119, 111, 114, 108, 100), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 44, 32, 101, 120, 99, 105, 116, 105, 110, 103, 97, 121, 32, 111, 114, 108, 100, 119, 97, 121))
  // 11: preserves exclamation marks, commas, and capitalization
  run example11Test = init.then(translate(List(104, 101, 108, 108, 111, 33, 32, 101, 120, 99, 105, 116, 105, 110, 103, 44, 32, 87, 111, 114, 108, 100), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 33, 32, 101, 120, 99, 105, 116, 105, 110, 103, 97, 121, 44, 32, 79, 114, 108, 100, 119, 97, 121))
  // 12: preserves leading, trailing, and repeated spaces
  run example12Test = init.then(translate(List(32, 32, 104, 101, 108, 108, 111, 33, 32, 32, 32, 101, 120, 99, 105, 116, 105, 110, 103, 44, 32, 32, 32, 32, 32, 87, 111, 114, 108, 100, 32, 32, 32, 32), "exact")).expect(observation.output == List(32, 32, 101, 108, 108, 111, 104, 97, 121, 33, 32, 32, 32, 101, 120, 99, 105, 116, 105, 110, 103, 97, 121, 44, 32, 32, 32, 32, 32, 79, 114, 108, 100, 119, 97, 121, 32, 32, 32, 32))
  // 13: keeps a question mark after the translated word
  run example13Test = init.then(translate(List(104, 101, 108, 108, 111, 63), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 63))
  // 14: keeps repeated exclamation marks after the translated word
  run example14Test = init.then(translate(List(104, 101, 108, 108, 111, 33, 33), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 33, 33))
  // 15: preserves tabs and newlines between words
  run example15Test = init.then(translate(List(9, 104, 101, 108, 108, 111, 33, 9, 9, 101, 120, 99, 105, 116, 105, 110, 103, 44, 10, 10, 87, 111, 114, 108, 100, 10), "exact")).expect(observation.output == List(9, 101, 108, 108, 111, 104, 97, 121, 33, 9, 9, 101, 120, 99, 105, 116, 105, 110, 103, 97, 121, 44, 10, 10, 79, 114, 108, 100, 119, 97, 121, 10))
  // 16: moves the initial consonant cluster to the end
  run example16Test = init.then(translate(List(116, 104, 114, 101, 101), "exact")).expect(observation.output == List(101, 101, 116, 104, 114, 97, 121))
  // 17: preserves surrounding double quotes
  run example17Test = init.then(translate(List(34, 104, 101, 108, 108, 111, 63, 34), "exact")).expect(observation.output == List(34, 101, 108, 108, 111, 104, 97, 121, 63, 34))
  // 18: keeps all-uppercase words uppercase, including the suffix
  run example18Test = init.then(translate(List(34, 72, 69, 76, 76, 79, 33, 32, 69, 88, 84, 82, 65, 32, 84, 72, 82, 69, 69, 34), "exact")).expect(observation.output == List(34, 69, 76, 76, 79, 72, 65, 89, 33, 32, 69, 88, 84, 82, 65, 65, 89, 32, 69, 69, 84, 72, 82, 65, 89, 34))
  // 19: moves qu together as part of the initial consonant cluster
  run example19Test = init.then(translate(List(113, 117, 101, 101, 110, 32, 115, 113, 117, 101, 97, 108), "exact")).expect(observation.output == List(101, 101, 110, 113, 117, 97, 121, 32, 101, 97, 108, 115, 113, 117, 97, 121))
  // 20: leaves numbers unchanged
  run example20Test = init.then(translate(List(104, 101, 108, 108, 111, 32, 49, 50, 51), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 32, 49, 50, 51))
  // 21: punctuation separates adjacent words
  run example21Test = init.then(translate(List(104, 101, 108, 108, 111, 44, 119, 111, 114, 108, 100), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 44, 111, 114, 108, 100, 119, 97, 121))
  // 22: punctuation keeps its position between digits
  run example22Test = init.then(translate(List(49, 44, 50), "exact")).expect(observation.output == List(49, 44, 50))
  // 23: a prefix does not cross punctuation
  run example23Test = init.then(translate(List(113, 33, 117, 101, 101, 110), "exact")).expect(observation.output == List(113, 97, 121, 33, 117, 101, 101, 110, 97, 121))
  // 24: quotes separate adjacent words
  run example24Test = init.then(translate(List(34, 104, 101, 108, 108, 111, 34, 34, 87, 111, 114, 108, 100, 34), "exact")).expect(observation.output == List(34, 101, 108, 108, 111, 104, 97, 121, 34, 34, 79, 114, 108, 100, 119, 97, 121, 34))
  // 25: uppercase qu with quotes and repeated punctuation
  run example25Test = init.then(translate(List(34, 81, 85, 69, 69, 78, 63, 33, 34), "exact")).expect(observation.output == List(34, 69, 69, 78, 81, 85, 65, 89, 63, 33, 34))
  // 26: title-case qu with punctuation
  run example26Test = init.then(translate(List(81, 117, 101, 101, 110, 33, 33), "exact")).expect(observation.output == List(69, 101, 110, 113, 117, 97, 121, 33, 33))
  // 27: title-case cluster inside quotes
  run example27Test = init.then(translate(List(34, 84, 104, 114, 101, 101, 63, 34), "exact")).expect(observation.output == List(34, 69, 101, 116, 104, 114, 97, 121, 63, 34))
  // 28: uppercase vowel with quotes and punctuation
  run example28Test = init.then(translate(List(34, 69, 88, 84, 82, 65, 33, 33, 34), "exact")).expect(observation.output == List(34, 69, 88, 84, 82, 65, 65, 89, 33, 33, 34))
  // 29: quoted numbers with punctuation and leading zeros
  run example29Test = init.then(translate(List(34, 48, 48, 49, 50, 51, 63, 33, 34), "exact")).expect(observation.output == List(34, 48, 48, 49, 50, 51, 63, 33, 34))
  // 30: quotes around a phrase with mixed separators
  run example30Test = init.then(translate(List(32, 32, 34, 72, 101, 108, 108, 111, 9, 81, 85, 69, 69, 78, 33, 33, 10, 101, 120, 99, 105, 116, 105, 110, 103, 44, 32, 119, 111, 114, 108, 100, 63, 34, 32, 32), "exact")).expect(observation.output == List(32, 32, 34, 69, 108, 108, 111, 104, 97, 121, 9, 69, 69, 78, 81, 85, 65, 89, 33, 33, 10, 101, 120, 99, 105, 116, 105, 110, 103, 97, 121, 44, 32, 111, 114, 108, 100, 119, 97, 121, 63, 34, 32, 32))
  // 31: clusters and numbers across tabs and newlines
  run example31Test = init.then(translate(List(9, 34, 84, 104, 114, 101, 101, 32, 81, 85, 69, 69, 78, 83, 33, 33, 34, 9, 49, 50, 51, 44, 10, 34, 69, 120, 99, 105, 116, 105, 110, 103, 32, 115, 113, 117, 101, 97, 108, 115, 63, 34, 10), "exact")).expect(observation.output == List(9, 34, 69, 101, 116, 104, 114, 97, 121, 32, 69, 69, 78, 83, 81, 85, 65, 89, 33, 33, 34, 9, 49, 50, 51, 44, 10, 34, 69, 120, 99, 105, 116, 105, 110, 103, 97, 121, 32, 101, 97, 108, 115, 115, 113, 117, 97, 121, 63, 34, 10))
  // 32: uppercase and title-case words without an aeiou vowel
  run example32Test = init.then(translate(List(34, 66, 82, 82, 33, 33, 34, 32, 66, 114, 114, 63), "exact")).expect(observation.output == List(34, 66, 82, 82, 65, 89, 33, 33, 34, 32, 66, 114, 114, 97, 121, 63))
  run fullCorpusTest = init
    .then(translate(List(), "exact")).expect(observation.output == List())
    .then(translate(List(97, 112, 112, 108, 101), "exact")).expect(observation.output == List(97, 112, 112, 108, 101, 97, 121))
    .then(translate(List(101, 120, 116, 114, 97), "exact")).expect(observation.output == List(101, 120, 116, 114, 97, 97, 121))
    .then(translate(List(105, 103, 108, 111, 111), "exact")).expect(observation.output == List(105, 103, 108, 111, 111, 97, 121))
    .then(translate(List(111, 114, 97, 110, 103, 101), "exact")).expect(observation.output == List(111, 114, 97, 110, 103, 101, 97, 121))
    .then(translate(List(117, 110, 100, 101, 114), "exact")).expect(observation.output == List(117, 110, 100, 101, 114, 97, 121))
    .then(translate(List(104, 101, 108, 108, 111), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121))
    .then(translate(List(104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 32, 111, 114, 108, 100, 119, 97, 121))
    .then(translate(List(72, 101, 108, 108, 111, 32, 69, 120, 99, 105, 116, 105, 110, 103, 32, 119, 111, 114, 108, 100), "exact")).expect(observation.output == List(69, 108, 108, 111, 104, 97, 121, 32, 69, 120, 99, 105, 116, 105, 110, 103, 97, 121, 32, 111, 114, 108, 100, 119, 97, 121))
    .then(translate(List(104, 101, 108, 108, 111, 44, 32, 101, 120, 99, 105, 116, 105, 110, 103, 32, 119, 111, 114, 108, 100), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 44, 32, 101, 120, 99, 105, 116, 105, 110, 103, 97, 121, 32, 111, 114, 108, 100, 119, 97, 121))
    .then(translate(List(104, 101, 108, 108, 111, 33, 32, 101, 120, 99, 105, 116, 105, 110, 103, 44, 32, 87, 111, 114, 108, 100), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 33, 32, 101, 120, 99, 105, 116, 105, 110, 103, 97, 121, 44, 32, 79, 114, 108, 100, 119, 97, 121))
    .then(translate(List(32, 32, 104, 101, 108, 108, 111, 33, 32, 32, 32, 101, 120, 99, 105, 116, 105, 110, 103, 44, 32, 32, 32, 32, 32, 87, 111, 114, 108, 100, 32, 32, 32, 32), "exact")).expect(observation.output == List(32, 32, 101, 108, 108, 111, 104, 97, 121, 33, 32, 32, 32, 101, 120, 99, 105, 116, 105, 110, 103, 97, 121, 44, 32, 32, 32, 32, 32, 79, 114, 108, 100, 119, 97, 121, 32, 32, 32, 32))
    .then(translate(List(104, 101, 108, 108, 111, 63), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 63))
    .then(translate(List(104, 101, 108, 108, 111, 33, 33), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 33, 33))
    .then(translate(List(9, 104, 101, 108, 108, 111, 33, 9, 9, 101, 120, 99, 105, 116, 105, 110, 103, 44, 10, 10, 87, 111, 114, 108, 100, 10), "exact")).expect(observation.output == List(9, 101, 108, 108, 111, 104, 97, 121, 33, 9, 9, 101, 120, 99, 105, 116, 105, 110, 103, 97, 121, 44, 10, 10, 79, 114, 108, 100, 119, 97, 121, 10))
    .then(translate(List(116, 104, 114, 101, 101), "exact")).expect(observation.output == List(101, 101, 116, 104, 114, 97, 121))
    .then(translate(List(34, 104, 101, 108, 108, 111, 63, 34), "exact")).expect(observation.output == List(34, 101, 108, 108, 111, 104, 97, 121, 63, 34))
    .then(translate(List(34, 72, 69, 76, 76, 79, 33, 32, 69, 88, 84, 82, 65, 32, 84, 72, 82, 69, 69, 34), "exact")).expect(observation.output == List(34, 69, 76, 76, 79, 72, 65, 89, 33, 32, 69, 88, 84, 82, 65, 65, 89, 32, 69, 69, 84, 72, 82, 65, 89, 34))
    .then(translate(List(113, 117, 101, 101, 110, 32, 115, 113, 117, 101, 97, 108), "exact")).expect(observation.output == List(101, 101, 110, 113, 117, 97, 121, 32, 101, 97, 108, 115, 113, 117, 97, 121))
    .then(translate(List(104, 101, 108, 108, 111, 32, 49, 50, 51), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 32, 49, 50, 51))
    .then(translate(List(104, 101, 108, 108, 111, 44, 119, 111, 114, 108, 100), "exact")).expect(observation.output == List(101, 108, 108, 111, 104, 97, 121, 44, 111, 114, 108, 100, 119, 97, 121))
    .then(translate(List(49, 44, 50), "exact")).expect(observation.output == List(49, 44, 50))
    .then(translate(List(113, 33, 117, 101, 101, 110), "exact")).expect(observation.output == List(113, 97, 121, 33, 117, 101, 101, 110, 97, 121))
    .then(translate(List(34, 104, 101, 108, 108, 111, 34, 34, 87, 111, 114, 108, 100, 34), "exact")).expect(observation.output == List(34, 101, 108, 108, 111, 104, 97, 121, 34, 34, 79, 114, 108, 100, 119, 97, 121, 34))
    .then(translate(List(34, 81, 85, 69, 69, 78, 63, 33, 34), "exact")).expect(observation.output == List(34, 69, 69, 78, 81, 85, 65, 89, 63, 33, 34))
    .then(translate(List(81, 117, 101, 101, 110, 33, 33), "exact")).expect(observation.output == List(69, 101, 110, 113, 117, 97, 121, 33, 33))
    .then(translate(List(34, 84, 104, 114, 101, 101, 63, 34), "exact")).expect(observation.output == List(34, 69, 101, 116, 104, 114, 97, 121, 63, 34))
    .then(translate(List(34, 69, 88, 84, 82, 65, 33, 33, 34), "exact")).expect(observation.output == List(34, 69, 88, 84, 82, 65, 65, 89, 33, 33, 34))
    .then(translate(List(34, 48, 48, 49, 50, 51, 63, 33, 34), "exact")).expect(observation.output == List(34, 48, 48, 49, 50, 51, 63, 33, 34))
    .then(translate(List(32, 32, 34, 72, 101, 108, 108, 111, 9, 81, 85, 69, 69, 78, 33, 33, 10, 101, 120, 99, 105, 116, 105, 110, 103, 44, 32, 119, 111, 114, 108, 100, 63, 34, 32, 32), "exact")).expect(observation.output == List(32, 32, 34, 69, 108, 108, 111, 104, 97, 121, 9, 69, 69, 78, 81, 85, 65, 89, 33, 33, 10, 101, 120, 99, 105, 116, 105, 110, 103, 97, 121, 44, 32, 111, 114, 108, 100, 119, 97, 121, 63, 34, 32, 32))
    .then(translate(List(9, 34, 84, 104, 114, 101, 101, 32, 81, 85, 69, 69, 78, 83, 33, 33, 34, 9, 49, 50, 51, 44, 10, 34, 69, 120, 99, 105, 116, 105, 110, 103, 32, 115, 113, 117, 101, 97, 108, 115, 63, 34, 10), "exact")).expect(observation.output == List(9, 34, 69, 101, 116, 104, 114, 97, 121, 32, 69, 69, 78, 83, 81, 85, 65, 89, 33, 33, 34, 9, 49, 50, 51, 44, 10, 34, 69, 120, 99, 105, 116, 105, 110, 103, 97, 121, 32, 101, 97, 108, 115, 115, 113, 117, 97, 121, 63, 34, 10))
    .then(translate(List(34, 66, 82, 82, 33, 33, 34, 32, 66, 114, 114, 63), "exact")).expect(observation.output == List(34, 66, 82, 82, 65, 89, 33, 33, 34, 32, 66, 114, 114, 97, 121, 63))
  run newClusterTest = init.then(translate(List(66, 114, 97, 116, 101, 110), "exploratory")).expect(observation.output == List(65, 116, 101, 110, 98, 114, 97, 121))
  run newVowelTest = init.then(translate(List(117, 109, 105, 110, 103, 115), "exploratory")).expect(observation.output == List(117, 109, 105, 110, 103, 115, 97, 121))
  run newVowellessTest = init.then(translate(List(78, 84, 72), "exploratory")).expect(observation.output == List(78, 84, 72, 65, 89))
  run newCompositionTest = init.then(translate(List(34, 83, 112, 108, 111, 112, 115, 63, 33, 48, 48, 55, 9, 67, 72, 73, 71, 73, 78, 71, 34), "exploratory")).expect(observation.output == List(34, 79, 112, 115, 115, 112, 108, 97, 121, 63, 33, 48, 48, 55, 9, 73, 71, 73, 78, 71, 67, 72, 65, 89, 34))
  run generatorScopeTest = init.expect(GENERATED_WORDS.forall(w => supported(w)) and NUMBERS.forall(n => supported(n)))
}
