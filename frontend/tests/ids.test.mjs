import test from "node:test";
import assert from "node:assert/strict";
import { submissionKey } from "../src/ids.ts";
test("idempotency UUID works when randomUUID is unavailable on HTTP", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  const source = globalThis.crypto;
  try {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: { getRandomValues: source.getRandomValues.bind(source) },
    });
    const one = submissionKey(),
      two = submissionKey();
    assert.match(
      one,
      /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/,
    );
    assert.notEqual(one, two);
  } finally {
    Object.defineProperty(globalThis, "crypto", descriptor);
  }
});
