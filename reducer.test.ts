import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Character, type Event, type TranslationState } from "./domain.ts";
import * as composed from "./translate-composed.ts";

function checkPhases<State extends TranslationState>(
  name: string,
  initial: () => State,
  reduce: (state: State, event: Event) => State,
) {
  describe(`${name} phases`, () => {
    test("idle state has no word fields or classification", () => {
      assert.deepEqual(initial(), { kind: "leading", output: "" });
    });
    test("records prefix, stem, punctuation, and reset phases", () => {
      let state = initial();
      assert.equal(state.kind, "leading");
      for (const [character, expected] of [
        ['"', { kind: "leading" }],
        ["t", { kind: "prefix" }],
        ["h", { kind: "prefix" }],
        ["r", { kind: "prefix" }],
        ["e", { kind: "stem" }],
        ["e", { kind: "stem" }],
        ["!", { kind: "trailingPunctuation" }],
        ["!", { kind: "trailingPunctuation" }],
        ['"', { kind: "trailingPunctuation" }],
        [" ", { kind: "leading" }],
      ] as const) {
        state = reduce(state, { type: "character", value: Character.make(character) });
        assert.equal(state.kind, expected.kind);
      }
      const finished = reduce(state, { type: "end" });
      assert.equal(finished.kind, "leading");
      assert.equal(finished.output, '"eethray!!" ');
    });

    test("starts a new word after punctuation", () => {
      let state = initial();
      for (const value of "q!") {
        state = reduce(state, { type: "character", value: Character.make(value) });
      }
      assert.equal(state.kind, "trailingPunctuation");
      state = reduce(state, { type: "character", value: Character.make("u") });
      assert.equal(state.kind, "stem");
      for (const value of "een") {
        state = reduce(state, { type: "character", value: Character.make(value) });
      }
      assert.equal(state.kind, "stem");
      assert.equal(reduce(state, { type: "end" }).output, "qay!ueenay");
    });
  });
}

checkPhases("composed", composed.initialState, composed.reduce);
