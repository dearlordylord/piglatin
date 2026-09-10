import assert from "node:assert/strict";
import { test } from "node:test";
import * as Schema from "effect/Schema";
import * as Result from "effect/Result";
import { Character, TokenFragment, DigitSequence, Event, Prefix, Stem, parseTranslationInput, withParsedInput } from "./domain.ts";

test("a character is exactly one Unicode code point", () => {
  for (const value of ["a", "!", " ", "\t", "\n", "😀"]) {
    assert.equal(Character.make(value), value);
  }
  for (const value of ["", "hello", "!!", "\r\n"]) {
    assert.throws(() => Character.make(value));
  }
});

test("token fragments allow empty recursion results but exclude whitespace", () => {
  for (const value of ["", "hello", '"QUEEN?!"', "123"]) {
    assert.equal(TokenFragment.make(value), value);
  }
  for (const value of ["hello world", "\t", "hello\n"]) {
    assert.throws(() => TokenFragment.make(value));
  }
});

test("digit sequences are nonempty and contain only digits", () => {
  assert.equal(DigitSequence.make("00123"), "00123");
  for (const value of ["", "123ay", "12.3", "-1"]) {
    assert.throws(() => DigitSequence.make(value));
  }
});

test("character event construction validates the character payload", () => {
  assert.deepEqual(Schema.decodeUnknownSync(Event)({ type: "character", value: "q" }), { type: "character", value: "q" });
  assert.deepEqual(Schema.decodeUnknownSync(Event)({ type: "end" }), { type: "end" });
  for (const value of ["", "hello", "!!"]) {
    assert.throws(() => Schema.decodeUnknownSync(Event)({ type: "character", value }));
  }
});


test("a prefix is nonempty, contains no separators, and admits u only after q", () => {
  for (const value of ["h", "thr", "squ", "QU", "123"]) assert.equal(Prefix.make(value), value);
  for (const value of ["", "he", "u", "hu", "q!u", "t h"]) assert.throws(() => Prefix.make(value));
});

test("a stem is nonempty, begins with a vowel, and contains no separators", () => {
  for (const value of ["e", "ello", "UEEN", "a1"]) assert.equal(Stem.make(value), value);
  for (const value of ["", "hello", "1", "a!b", "a b"]) assert.throws(() => Stem.make(value));
});

test("public input parsing rejects mixed letters and digits", () => {
  const result = parseTranslationInput("1a");
  assert.ok(Result.isFailure(result));
  assert.match(result.failure.message, /letters and digits/i);
});

test("public input parsing rejects unsupported characters", () => {
  for (const input of [";", ".", "it's", "hello-world", "é", "😀", "hello\rworld", "hello\u00a0world"]) {
    const result = parseTranslationInput(input);
    assert.ok(Result.isFailure(result), input);
    assert.match(result.failure.message, /unsupported character/i);
  }
});

test("public input parsing rejects ambiguous case styles", () => {
  for (const input of ["hELLo", "HeLLo", "A", "Q"]) {
    const result = parseTranslationInput(input);
    assert.ok(Result.isFailure(result), input);
    assert.match(result.failure.message, /case/i);
  }
});

test("public input parsing rejects undefined y and unusual q forms", () => {
  for (const input of ["y", "rhythm", "boy", "qhat", "ququack", "faq", "equal", "qu"]) {
    const result = parseTranslationInput(input);
    assert.ok(Result.isFailure(result), input);
    assert.match(result.failure.message, /spelling/i);
  }
});

test("the parsing boundary returns errors without calling translation", () => {
  let calls = 0;
  const translateText = withParsedInput((input) => { calls++; return `accepted: ${input}`; });
  for (const input of ["1a", ";", "A", "rhythm", "qhat", "é", null, 42]) {
    assert.ok(Result.isFailure(translateText(input)));
  }
  assert.equal(calls, 0);
  assert.equal(Result.getOrThrow(translateText("Hello 00123!")), "accepted: Hello 00123!");
  assert.equal(calls, 1);
});
