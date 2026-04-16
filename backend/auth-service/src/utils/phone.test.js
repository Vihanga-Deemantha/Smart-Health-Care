import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSriLankanPhone } from "./phone.js";

test("normalizeSriLankanPhone keeps local Sri Lankan numbers in 0XXXXXXXXX format", () => {
  assert.equal(normalizeSriLankanPhone("0771234567"), "0771234567");
  assert.equal(normalizeSriLankanPhone("071-234-5678"), "0712345678");
});

test("normalizeSriLankanPhone converts +94 and 94 numbers to local format", () => {
  assert.equal(normalizeSriLankanPhone("+94771234567"), "0771234567");
  assert.equal(normalizeSriLankanPhone("94712345678"), "0712345678");
});

test("normalizeSriLankanPhone rejects unsupported formats", () => {
  assert.equal(normalizeSriLankanPhone("12345"), null);
  assert.equal(normalizeSriLankanPhone(""), null);
});
