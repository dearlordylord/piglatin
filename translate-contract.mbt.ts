import { test } from "node:test";
import { translateText as original } from "./translate.ts";
import { translateText as composed } from "./translate-composed.ts";
import { checkContract } from "./contract-mbt.ts";

for (const [name, translate] of Object.entries({ original, composed })) {
  test(`${name}: consolidated contract examples`, () => checkContract(name, translate, "examples"));
  test(`${name}: consolidated generated requests`, () => checkContract(name, translate, "generated"));
}
