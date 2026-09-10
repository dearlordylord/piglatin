module parent_verbal_audit {
  import batch_from_verbal.* from "../../batch_from_verbal"
  run squareExcludedTest = assert(not(supported(List(115, 113, 117, 97, 114, 101))))
  run squareHelperKnowsOutputTest = assert(translateText(List(115, 113, 117, 97, 114, 101)) == List(97, 114, 101, 115, 113, 117, 97, 121))
  run unsupportedExamplesDisabledTest = assert(not(supported(List(49, 97))) and not(supported(List(59))) and not(supported(List(65))))
  run separatorsOnlySupportedTest = assert(supported(List(9, 33, 33, 10, 34)) and translateText(List(9, 33, 33, 10, 34)) == List(9, 33, 33, 10, 34))
  run preservationDoesNotConstrainRotationTest = init.then(all {
    observation' = { input: List(104, 101, 108, 108, 111), output: List(104, 101, 108, 108, 111, 97, 121), category: "audit" },
    replayAction' = replayAction,
  }).expect(safety)
}
