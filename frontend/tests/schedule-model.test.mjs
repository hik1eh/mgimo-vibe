import test from "node:test";
import assert from "node:assert/strict";
import {
  filterLessons,
  identityParts,
  readScheduleState,
  roomKey,
  scheduleParams,
  scheduleRequest,
  teacherKey,
} from "../src/schedule-model.ts";

const lesson = (id, override = {}) => ({
  id,
  group_id: 1,
  group: "ОН-201",
  subject: "Социология",
  teacher: "Елена Лазурная",
  building: "Северный корпус",
  room: "412",
  starts_at: "2026-11-18T09:00:00+03:00",
  ends_at: "2026-11-18T10:30:00+03:00",
  status: "moved",
  changes: [{ before: { room: "305" } }],
  ...override,
});
const state = () =>
  readScheduleState(
    new URLSearchParams({ date: "2026-11-18", view: "week" }),
    "2026-11-18",
  );

test("stable IDs distinguish teachers with identical names and rooms with the same number", () => {
  const left = lesson(1, { teacher_id: 15, room_id: 90 });
  const right = lesson(2, {
    teacher_id: 16,
    room_id: 91,
    building: "Южный корпус",
  });
  const filters = readScheduleState(
    scheduleParams({ ...state(), teacher: "16", room: "91" }),
    "2026-11-18",
  );
  assert.deepEqual(
    filterLessons([left, right], filters, "ОН-201", 1).map((row) => row.id),
    [2],
  );
  assert.equal(teacherKey(right), "16");
  assert.equal(roomKey(left), "90");
});

test("missing own-group default differs from explicit all and survives URL round-trip", () => {
  assert.equal(state().group, "mine");
  const all = {
    ...state(),
    group: "all",
    teacher: teacherKey(lesson(1)),
    room: roomKey(lesson(1)),
  };
  assert.deepEqual(readScheduleState(scheduleParams(all), "2026-11-18"), all);
});
test("bad URL dates and identities fall back without throwing", () => {
  const parsed = readScheduleState(
    new URLSearchParams({
      date: "2026-02-30",
      view: "unknown",
      group: "-5",
      teacher: "null",
      room: '["room",{}]',
    }),
    "2026-11-18",
  );
  assert.deepEqual(parsed, {
    date: "2026-11-18",
    view: "day",
    group: "mine",
    teacher: "all",
    room: "all",
  });
  assert.equal(identityParts("not JSON", "teacher"), null);
});
test("room identity includes building, and filtering uses current room after move", () => {
  const a = lesson(1),
    b = lesson(2, { building: "Южный корпус" });
  assert.notEqual(roomKey(a), roomKey(b));
  assert.deepEqual(
    filterLessons([a, b], { ...state(), room: roomKey(a) }, "ОН-201").map(
      (x) => x.id,
    ),
    [1],
  );
  assert.equal(
    filterLessons(
      [a],
      { ...state(), room: roomKey({ ...a, room: "305" }) },
      "ОН-201",
    ).length,
    0,
  );
});
test("group, teacher and room combine with AND; authorized overlaps remain separate", () => {
  const a = lesson(1),
    b = lesson(2, { group_id: 2, group: "ОН-202" }),
    c = lesson(3, { teacher: "Марк Ветров" });
  const all = { ...state(), group: "all" };
  assert.equal(filterLessons([a, b, c], all, "ОН-201").length, 3);
  assert.deepEqual(
    filterLessons(
      [a, b, c],
      { ...all, group: "1", teacher: teacherKey(a), room: roomKey(a) },
      "ОН-201",
    ).map((x) => x.id),
    [1],
  );
});
test("day filtering uses campus timezone and sorting is chronological then ID", () => {
  const a = lesson(9, { starts_at: "2026-11-18T07:00:00Z" }),
    b = lesson(2, { starts_at: "2026-11-18T10:00:00+03:00" }),
    c = lesson(3, { starts_at: "2026-11-18T21:30:00Z" });
  assert.deepEqual(
    filterLessons([a, b, c], { ...state(), view: "day" }, "ОН-201").map(
      (x) => x.id,
    ),
    [2, 9],
  );
});
test("cancelled lesson retains searchable place without being removed", () => {
  const a = lesson(1, { status: "cancelled" });
  assert.equal(
    filterLessons([a], { ...state(), room: roomKey(a) }, "ОН-201")[0].status,
    "cancelled",
  );
});
test("requests stay within one authorized week across month/year boundaries", () => {
  const requested = scheduleRequest({ ...state(), date: "2027-01-03" });
  assert.equal(requested, "/schedule?start=2026-12-28&end=2027-01-03");
  assert.equal(
    scheduleRequest({ ...state(), view: "day", date: "2027-01-03" }),
    requested,
  );
});
