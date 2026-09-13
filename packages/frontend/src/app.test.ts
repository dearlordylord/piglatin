import { test } from "node:test";
import assert from "node:assert/strict";
import { Schema } from "effect";
import { Model, modelForInput, update } from "./app.ts";
import { Message } from "./messages.ts";
import { transformationFrame } from "./transformation.ts";

test("Foldkit input updates compute locally and recover from rejection", () => {
  const initial = modelForInput("flower");
  const invalid = update(initial, Message.ChangedInput({ value: "1a" })).model;
  assert.ok(invalid);
  assert.equal(invalid.result.ok, false);
  assert.equal("transformation" in invalid.result, false);
  const recovered = update(invalid, Message.ChangedInput({ value: "queen" })).model;
  assert.ok(recovered);
  assert.ok(recovered.result.ok);
  assert.equal(recovered.result.output, "eenquay");
  assert.equal(recovered.position, 0);
  assert.ok(Schema.is(Model)(recovered));
});

test("scrubbing preserves shared trace and motion model; event navigation clamps", () => {
  const initial = modelForInput("flower");
  const scrubbed = update(initial, Message.Scrubbed({ position: 3.5 })).model;
  assert.ok(scrubbed);
  assert.equal(scrubbed.position, 3.5);
  assert.equal(scrubbed.result, initial.result);
  assert.ok(scrubbed.result.ok && initial.result.ok);
  assert.equal(scrubbed.result.transformation, initial.result.transformation);
  assert.equal(update(scrubbed, Message.Stepped({ direction: 1 })).model?.position, 4);
  assert.equal(update(scrubbed, Message.Scrubbed({ position: -10 })).model?.position, 0);
  assert.equal(update(scrubbed, Message.Scrubbed({ position: 999 })).model?.position, 7);
  assert.equal(update(scrubbed, Message.Scrubbed({ position: NaN })).model, scrubbed);
});

test("motion remains reversible and final glyphs match shared core output", () => {
  for (const source of ['flower', 'queen', 'apple', 'brrr', 'Hello! queen', '00123', 'hello\tworld\n', '"SQUARE!!"', '']) {
    const model = modelForInput(source);
    assert.ok(model.result.ok);
    const animation = model.result.transformation;
    const firstVisit = transformationFrame(animation, 3.5);
    const final = transformationFrame(animation, model.result.steps.length - 1);
    assert.deepEqual(transformationFrame(animation, 3.5), firstVisit);
    const output = final.map(pose => ({ x: pose.x, text: pose.letter.final })).sort((a, b) => a.x - b.x).map(glyph => glyph.text).join("");
    assert.equal(output, model.result.output);
    for (const pose of final) { assert.equal(pose.y, 295); assert.equal(pose.opacity, 1); }
  }
});

test("animation obeys supplied mappings, suffix length, and event timing", () => {
  // Deliberately unlike current Pig Latin: a different mapping, a three-letter
  // suffix, and spaced event numbers. The renderer must not reconstruct rules.
  const facts: import("@piglatin/core").Transformation = {
    sourceLength: 2, outputLength: 5,
    fragments: [{
      kind: "word", source: "ab", sourceStart: 0, outputStart: 0,
      output: "abxyz", casing: "lowercase", commitEvent: 10,
      parts: [{ role: "prefix", text: "ab" }, { role: "suffix", text: "xyz" }],
      letters: [
        { id: "a", sourceIndex: 0, outputIndex: 0, source: "a", final: "a", role: "prefix", readEvent: 3, commitEvent: 10 },
        { id: "b", sourceIndex: 1, outputIndex: 1, source: "b", final: "b", role: "stem", readEvent: 7, commitEvent: 10 },
        ...["x", "y", "z"].map((final, i) => ({ id: final, sourceIndex: null, outputIndex: 2 + i, source: final, final, role: "suffix" as const, readEvent: 10, commitEvent: 10 })),
      ],
    }],
  };
  assert.equal(transformationFrame(facts, 2)[0].y, 65);
  assert.equal(transformationFrame(facts, 3)[0].y, 135);
  assert.equal(transformationFrame(facts, 9)[0].y, 135);
  const final = transformationFrame(facts, 10);
  assert.equal(final.toSorted((a, b) => a.x - b.x).map(pose => pose.letter.final).join(""), "abxyz");
  assert.ok(final.every(pose => pose.opacity === 1 && pose.y === 295));
  const gaps = final.slice(1).map((pose, i) => pose.x - final[i].x);
  assert.ok(gaps.every(gap => gap > 0 && gap === gaps[0]));
});
