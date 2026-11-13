import test from "node:test";
import assert from "node:assert/strict";
import {
  campusDay,
  campusTime,
  monday,
  addDays,
  validDay,
} from "../src/study-dates.ts";

test("campus date uses Moscow midnight independently of device timezone", () => {
  assert.equal(campusDay("2026-11-12T21:15:00Z"), "2026-11-13");
  assert.equal(campusTime("2026-11-12T21:15:00Z"), "00:15");
  assert.equal(campusDay("2026-11-13T20:59:00Z"), "2026-11-13");
  assert.equal(campusDay("2026-11-13T21:00:00Z"), "2026-11-14");
});
test("week starts Monday including a Sunday crossing a year boundary", () => {
  assert.equal(monday("2026-11-13"), "2026-11-09");
  assert.equal(monday("2027-01-03"), "2026-12-28");
  assert.equal(monday("2026-11-09"), "2026-11-09");
});
test("date navigation handles leap years and validates direct URLs", () => {
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(validDay("2026-02-29"), false);
  assert.equal(validDay("2028-02-29"), true);
  assert.equal(validDay("2026-13-01"), false);
  assert.equal(validDay(null), false);
});
