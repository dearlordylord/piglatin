import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Result from "effect/Result";
import { TranslationInput } from "./domain.ts";
import { translate as original, translateText as originalText } from "./translate.ts";
import { translate as composed, translateText as composedText } from "./translate-composed.ts";

const implementations = { original, composed };

for (const [name, implementation] of Object.entries(implementations)) {
  const translate = (text: string) => implementation(TranslationInput.make(text));
  describe(name, () => {
    test("returns an empty string for an empty word", () => {
      assert.equal(translate(""), "");
    });

    test("adds ay to words starting with a vowel", () => {
      assert.equal(translate("apple"), "appleay");
      assert.equal(translate("extra"), "extraay");
      assert.equal(translate("igloo"), "iglooay");
      assert.equal(translate("orange"), "orangeay");
      assert.equal(translate("under"), "underay");
    });

    test("moves the first consonant to the end and adds ay", () => {
      assert.equal(translate("hello"), "ellohay");
    });

    test("translates each word in a phrase", () => {
      assert.equal(translate("hello world"), "ellohay orldway");
    });

    test("preserves capitalization when translating a phrase", () => {
      assert.equal(translate("Hello Exciting world"), "Ellohay Excitingay orldway");
    });

    test("keeps a comma after the translated word", () => {
      assert.equal(translate("hello, exciting world"), "ellohay, excitingay orldway");
    });

    test("preserves exclamation marks, commas, and capitalization", () => {
      assert.equal(translate("hello! exciting, World"), "ellohay! excitingay, Orldway");
    });

    test("preserves leading, trailing, and repeated spaces", () => {
      assert.equal(
        translate("  hello!   exciting,     World    "),
        "  ellohay!   excitingay,     Orldway    ",
      );
    });

    test("keeps a question mark after the translated word", () => {
      assert.equal(translate("hello?"), "ellohay?");
    });

    test("keeps repeated exclamation marks after the translated word", () => {
      assert.equal(translate("hello!!"), "ellohay!!");
    });

    test("preserves tabs and newlines between words", () => {
      assert.equal(
        translate("\thello!\t\texciting,\n\nWorld\n"),
        "\tellohay!\t\texcitingay,\n\nOrldway\n",
      );
    });

    test("moves the initial consonant cluster to the end", () => {
      assert.equal(translate("three"), "eethray");
    });

    test("preserves surrounding double quotes", () => {
      assert.equal(translate('"hello?"'), '"ellohay?"');
    });

    test("keeps all-uppercase words uppercase, including the suffix", () => {
      assert.equal(translate('"HELLO! EXTRA THREE"'), '"ELLOHAY! EXTRAAY EETHRAY"');
    });

    test("moves qu together as part of the initial consonant cluster", () => {
      assert.equal(translate("queen squeal"), "eenquay ealsquay");
    });

    test("leaves numbers unchanged", () => {
      assert.equal(translate("hello 123"), "ellohay 123");
    });

    const interactions = [
      ["punctuation separates adjacent words", "hello,world", "ellohay,orldway"],
      ["punctuation keeps its position between digits", "1,2", "1,2"],
      ["a prefix does not cross punctuation", "q!ueen", "qay!ueenay"],
      ["quotes separate adjacent words", '"hello""World"', '"ellohay""Orldway"'],
      ["uppercase qu with quotes and repeated punctuation", '"QUEEN?!"', '"EENQUAY?!"'],
      ["title-case qu with punctuation", "Queen!!", "Eenquay!!"],
      ["title-case cluster inside quotes", '"Three?"', '"Eethray?"'],
      ["uppercase vowel with quotes and punctuation", '"EXTRA!!"', '"EXTRAAY!!"'],
      ["quoted numbers with punctuation and leading zeros", '"00123?!"', '"00123?!"'],
      ["quotes around a phrase with mixed separators", '  "Hello\tQUEEN!!\nexciting, world?"  ', '  "Ellohay\tEENQUAY!!\nexcitingay, orldway?"  '],
      ["clusters and numbers across tabs and newlines", '\t"Three QUEENS!!"\t123,\n"Exciting squeals?"\n', '\t"Eethray EENSQUAY!!"\t123,\n"Excitingay ealssquay?"\n'],
      ["uppercase and title-case words without an aeiou vowel", '"BRR!!" Brr?', '"BRRAY!!" Brray?'],
    ];
    for (const [description, input, expected] of interactions) {
      test(description, () => {
        assert.equal(translate(input), expected);
      });
    }
  });
}

for (const [name, translateText] of Object.entries({ original: originalText, composed: composedText })) {
  test(`${name}: raw input is parsed before translation`, () => {
    assert.equal(Result.getOrThrow(translateText('"Hello!" 00123')), '"Ellohay!" 00123');
    for (const raw of ['1a', ';', '.', 'hELLo', 'A', 'rhythm', 'qhat', 'é']) {
      assert.ok(Result.isFailure(translateText(raw)), raw);
    }
  });
}
