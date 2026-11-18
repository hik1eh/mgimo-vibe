import type { Lesson } from "./study-types";
export type Announcement = {
  id: number;
  title: string;
  fact?: string | null;
  text: string;
  source: string;
  audience: "university" | "faculty" | "group";
  faculty_id: number | null;
  group_id: number | null;
  lesson_id: number | null;
  status: "draft" | "published" | "withdrawn";
  pinned: boolean;
  published_at: string | null;
  expires_at: string | null;
  version: number;
  lesson: Lesson | null;
};
export type Group = { id: number; name: string };
export type Prefill = {
  audience: "group";
  group_id: number;
  lesson_id: number;
  title: string;
  text: string;
};
export const audienceLabel = {
  university: "Весь вуз",
  faculty: "Ваш факультет",
  group: "Ваша группа",
};
export const publicationLabel = {
  draft: "Черновик",
  published: "Опубликовано",
  withdrawn: "Снято с публикации",
};
