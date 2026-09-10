module independent_batch_audit {
 import batch_from_verbal.* from "../../batch_from_verbal"
 run admittedSquareDisabledTest = assert(not(supported(List(115,113,117,97,114,101))))
 run lowercaseQAdmittedTest = assert(supported(List(113)))
 run uppercaseQExcludedTest = assert(not(supported(List(81))))
 run separatorOnlyAdmittedTest = assert(supported(List(9,34,32,10)))
 run arbitraryLongNumbersAdmittedTest = assert(supported(List(48,48,48,48,48,48,48,48)))
 run mixedTokenExcludedTest = assert(not(supported(List(49,97))))
 run wrongRotationSatisfiesPreservationTest = assert(wordPreserved(List(104,101,108,108,111), List(104,101,108,108,111,97,121)))
 run unsupportedWholeRequestDisabledTest = assert(not(supported(List(104,101,108,108,111,32,49,97))))
}
