import { test } from "node:test";
import assert from "node:assert/strict";
import { Schema } from "effect";
import { TraceResult, visualize } from "./index.ts";

test("shared core produces the actual reducer trace and final output directly", () => {
  for (const source of ['square', 'Hello! queen', '"SQUARE!!"', '00123', 'hello\tworld\n', 'brrr', '']) {
    const result = visualize(source);
    assert.equal(result.ok, true);
    assert.ok(Schema.is(TraceResult)(result));
    assert.equal(result.steps[0].rule, "initial");
    assert.equal(result.steps.at(-1)?.state.output, result.output);
    assert.equal(result.steps.length, source.length + 2);
  }
  const square = visualize("square");
  assert.ok(square.ok);
  assert.equal(square.output, "aresquay");
  assert.ok(square.steps.some(step => step.rule === "completeQu"));
});

test("shared core rejects unsupported input without translation or trace", () => {
  for (const input of ['1a', 'rhythm', '\u{1f600}', null, undefined, 23]) {
    const result = visualize(input);
    assert.equal(result.ok, false);
    assert.ok(Schema.is(TraceResult)(result));
    assert.equal("steps" in result, false);
  }
});
