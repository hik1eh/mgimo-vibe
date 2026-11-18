import type { Lesson } from "./study-types";
import { addDays, campusDay, monday, validDay } from "./study-dates.ts";

export type ScheduleState = {
  view: "day" | "week";
  date: string;
  group: string;
  teacher: string;
  room: string;
};
export const teacherKey = (lesson: Pick<Lesson, "teacher" | "teacher_id">) =>
  lesson.teacher_id
    ? String(lesson.teacher_id)
    : JSON.stringify(["teacher", lesson.teacher]);
export const roomKey = (
  lesson: Pick<Lesson, "building" | "room" | "room_id">,
) =>
  lesson.room_id
    ? String(lesson.room_id)
    : JSON.stringify(["room", lesson.building, lesson.room]);
const numericId = /^[1-9]\d{0,9}$/;

export function identityParts(
  value: string,
  kind: "teacher" | "room",
): string[] | null {
  try {
    const parts: unknown = JSON.parse(value);
    return Array.isArray(parts) &&
      parts.length === (kind === "teacher" ? 2 : 3) &&
      parts[0] === kind &&
      parts.every((p) => typeof p === "string" && p.length <= 250)
      ? parts
      : null;
  } catch {
    return null;
  }
}

export function readScheduleState(
  params: URLSearchParams,
  today: string,
): ScheduleState {
  const date = params.get("date");
  const group = params.get("group");
  const teacher = params.get("teacher") || "all";
  const room = params.get("room") || "all";
  return {
    view: params.get("view") === "week" ? "week" : "day",
    date:
      validDay(date) && date >= "1900-01-01" && date <= "9998-12-31"
        ? date
        : today,
    group:
      group === "all" || group === "mine" || (group && numericId.test(group))
        ? group
        : "mine",
    teacher:
      numericId.test(teacher) || identityParts(teacher, "teacher")
        ? teacher
        : "all",
    room: numericId.test(room) || identityParts(room, "room") ? room : "all",
  };
}

export function scheduleParams(state: ScheduleState) {
  return new URLSearchParams({
    view: state.view,
    date: state.date,
    group: state.group,
    teacher: state.teacher,
    room: state.room,
  });
}

// A bounded, server-authorized week supplies the short filter lists in both views.
export function scheduleRequest(state: ScheduleState) {
  const start = monday(state.date);
  return `/schedule?${new URLSearchParams({ start, end: addDays(start, 6) })}`;
}

export function filterLessons(
  rows: Lesson[],
  state: ScheduleState,
  ownGroup: string | null,
  ownGroupId?: number | null,
) {
  return rows
    .filter(
      (row) =>
        (state.view === "week" || campusDay(row.starts_at) === state.date) &&
        (state.group === "all" ||
          (state.group === "mine"
            ? ownGroupId != null
              ? row.group_id === ownGroupId
              : row.group === ownGroup
            : String(row.group_id) === state.group)) &&
        (state.teacher === "all" ||
          teacherKey(row) === state.teacher ||
          JSON.stringify(["teacher", row.teacher]) === state.teacher) &&
        (state.room === "all" ||
          roomKey(row) === state.room ||
          JSON.stringify(["room", row.building, row.room]) === state.room),
    )
    .sort(
      (a, b) =>
        Date.parse(a.starts_at) - Date.parse(b.starts_at) || a.id - b.id,
    );
}

export function lastScheduleQuery() {
  try {
    return sessionStorage.getItem("dekanat.schedule.query") || "";
  } catch {
    return "";
  }
}
export function lessonPath(id: number, query = lastScheduleQuery()) {
  return `/schedule/${id}${query ? `?${query}` : ""}`;
}
