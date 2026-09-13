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

test("core transformation accounts for every source/output character and its actual events", () => {
  for (const source of ['Hello! queen', 'apple', '"SQUARE!!"', 'brrr', '00123', '2?8', '\t"Hello",world!\n', '']) {
    const trace = visualize(source);
    assert.ok(trace.ok);
    const fragments = trace.transformation.fragments;
    assert.equal(fragments.map(fragment => fragment.source).join(""), source);
    assert.equal(fragments.map(fragment => fragment.output).join(""), trace.output);
    const letters = fragments.flatMap(fragment => fragment.letters);
    assert.deepEqual(letters.map(letter => letter.outputIndex), [...trace.output].map((_, i) => i));
    const originals = letters.filter(letter => letter.sourceIndex !== null);
    assert.deepEqual(originals.map(letter => letter.sourceIndex).sort((a, b) => Number(a) - Number(b)), [...source].map((_, i) => i));
    for (const letter of letters) {
      assert.equal(letter.final, trace.output[letter.outputIndex]);
      assert.ok(["finish", "trailingPunctuation", "leadingQuote"].includes(trace.steps[letter.commitEvent].rule));
      assert.equal(trace.steps[letter.commitEvent].state.output[letter.outputIndex], letter.final);
      if (letter.sourceIndex !== null) {
        assert.equal(letter.source, source[letter.sourceIndex]);
        assert.equal(trace.steps[letter.readEvent].character, letter.source);
        assert.equal(trace.steps[letter.readEvent].position, letter.sourceIndex + 1);
      } else assert.equal(letter.readEvent, letter.commitEvent);
    }
  }
});

test("core supplies preserved fragments, capitalization, and qu rotation", () => {
  const trace = visualize('"Square" 00123 Apple');
  assert.ok(trace.ok);
  assert.deepEqual(trace.transformation.fragments.map(fragment => [fragment.source, fragment.kind, fragment.casing]), [
    ['"', 'preserved', 'preserved'], ['Square', 'word', 'title case'], ['"', 'preserved', 'preserved'],
    [' ', 'preserved', 'preserved'], ['00123', 'preserved', 'preserved'], [' ', 'preserved', 'preserved'], ['Apple', 'word', 'title case'],
  ]);
  const square = trace.transformation.fragments[1];
  assert.deepEqual(square.letters.map(letter => letter.sourceIndex), [4, 5, 6, 1, 2, 3, null, null]);
  assert.equal(square.commitEvent, 8);
  assert.equal(square.output, "Aresquay");
  assert.deepEqual(square.parts.map(part => part.text), ['are', 'squ', 'ay']);
});
