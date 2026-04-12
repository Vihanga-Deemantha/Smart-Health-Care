import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeVerificationLinks,
  mapVerificationDocumentsToLegacyList,
  extractVerificationDocumentPublicIds
} from "./doctorVerification.js";

test("normalizeVerificationLinks trims and filters array values", () => {
  assert.deepEqual(
    normalizeVerificationLinks([" https://example.com/a ", "", null, "https://example.com/b"]),
    ["https://example.com/a", "https://example.com/b"]
  );
});

test("normalizeVerificationLinks parses JSON strings and ignores blanks", () => {
  assert.deepEqual(
    normalizeVerificationLinks('[" https://registry.example/doc ",""]'),
    ["https://registry.example/doc"]
  );
});

test("normalizeVerificationLinks keeps a plain string as a single link", () => {
  assert.deepEqual(
    normalizeVerificationLinks("https://registry.example/license"),
    ["https://registry.example/license"]
  );
});

test("mapVerificationDocumentsToLegacyList combines filenames and links", () => {
  assert.deepEqual(
    mapVerificationDocumentsToLegacyList(
      [
        { filename: "license.pdf" },
        { filename: " certificate.png " },
        { filename: "" }
      ],
      ["https://registry.example/doc"]
    ),
    ["license.pdf", "certificate.png", "https://registry.example/doc"]
  );
});

test("extractVerificationDocumentPublicIds returns only valid public ids", () => {
  assert.deepEqual(
    extractVerificationDocumentPublicIds([
      { publicId: "smart-health/doc-1" },
      { publicId: " " },
      {},
      { publicId: "smart-health/doc-2" }
    ]),
    ["smart-health/doc-1", "smart-health/doc-2"]
  );
});
