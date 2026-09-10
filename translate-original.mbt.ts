import { test } from "node:test";
import { translate } from "./translate.ts";
import { checkTranslation } from "./translation-mbt.ts";

test("original batch translate agrees with independent Quint oracle", () => checkTranslation("original", translate));
