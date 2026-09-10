import { test } from "node:test";
import { translate as original } from "./translate.ts";
import { translate as composed } from "./translate-composed.ts";
import { checkTranslation } from "./translation-mbt.ts";

for (const [name, translate] of Object.entries({ original, composed })) {
  test(`${name} batch output agrees with the original-derived model`, () => checkTranslation(name, translate));
}
