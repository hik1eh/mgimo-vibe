import { useState } from "react";
import type { Lesson } from "./study-types";

const moveKey = (lesson?: Lesson | null) =>
  lesson?.status === "moved"
    ? `${lesson.id}:${lesson.version}:${lesson.changes.at(-1)?.created_at ?? ""}`
    : undefined;
const storageKey = (user: number) => `dekanat.seen-moves.${user}`;

function readMoves(user: number): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(user)) ?? "[]");
    return Array.isArray(value) ? value.filter((key): key is string => typeof key === "string") : [];
  } catch {
    return [];
  }
}

export function rememberMove(user: number, lesson?: Lesson | null) {
  const key = moveKey(lesson);
  if (!key) return;
  try {
    const seen = readMoves(user);
    if (!seen.includes(key)) {
      localStorage.setItem(storageKey(user), JSON.stringify([...seen.slice(-99), key]));
    }
  } catch {
    /* The current view can still clear the highlight. */
  }
}

export function useLessonAttention(user: number) {
  const [seen, setSeen] = useState(() => new Set(readMoves(user)));
  return {
    pending(lesson?: Lesson | null) {
      const key = moveKey(lesson);
      return Boolean(key && !seen.has(key));
    },
    acknowledge(lesson?: Lesson | null) {
      const key = moveKey(lesson);
      if (key && !seen.has(key)) {
        rememberMove(user, lesson);
        setSeen((previous) => new Set(previous).add(key));
      }
    },
  };
}

export type LessonAttention = ReturnType<typeof useLessonAttention>;
