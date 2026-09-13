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
  assert.equal(invalid.transformation, null);
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
  assert.equal(scrubbed.transformation, initial.transformation);
  assert.equal(update(scrubbed, Message.Stepped({ direction: 1 })).model?.position, 4);
  assert.equal(update(scrubbed, Message.Scrubbed({ position: -10 })).model?.position, 0);
  assert.equal(update(scrubbed, Message.Scrubbed({ position: 999 })).model?.position, 7);
  assert.equal(update(scrubbed, Message.Scrubbed({ position: NaN })).model, scrubbed);
});

test("motion remains reversible and final glyphs match shared core output", () => {
  for (const source of ['flower', 'queen', 'apple', 'brrr', 'Hello! queen', '00123', 'hello\tworld\n', '"SQUARE!!"', '']) {
    const model = modelForInput(source);
    assert.ok(model.result.ok);
    assert.ok(model.transformation);
    const animation = model.transformation;
    const firstVisit = transformationFrame(animation, 3.5);
    const final = transformationFrame(animation, model.result.steps.length - 1);
    assert.deepEqual(transformationFrame(animation, 3.5), firstVisit);
    const output = final.map((pose, i) => ({ x: pose.x, text: animation.glyphs[i].final })).sort((a, b) => a.x - b.x).map(glyph => glyph.text).join("");
    assert.equal(output, model.result.output);
    for (const pose of final) { assert.equal(pose.y, 295); assert.equal(pose.opacity, 1); }
  }
});
