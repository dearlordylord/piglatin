import { test } from "node:test";
import { translate as original } from "./translate.ts";
import { translate as composed } from "./translate-composed.ts";
import { checkVerbalTranslation } from "./verbal-mbt.ts";

for (const [name, translate] of Object.entries({ original, composed })) {
  test(`${name}: verbal specification examples`, () => checkVerbalTranslation(name, translate, "examples"));
  test(`${name}: generated cases from inferred verbal rules`, () => checkVerbalTranslation(name, translate, "generated"));
}
