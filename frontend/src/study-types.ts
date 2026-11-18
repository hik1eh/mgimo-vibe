export type StudyContext = {
  today: string;
  demo_day: string;
  timezone: string;
  demo_dates: boolean;
};
export type LessonSnapshot = {
  starts_at: string;
  ends_at: string;
  building: string;
  room: string;
  status: string;
};
export type Lesson = LessonSnapshot & {
  id: number;
  group_id: number;
  group: string;
  subject: string;
  teacher: string;
  teacher_id?: number;
  room_id?: number;
  floor?: number | null;
  has_route?: boolean;
  kind: string;
  status: "scheduled" | "moved" | "cancelled";
  version: number;
  changes: {
    id: number;
    before: LessonSnapshot;
    after: LessonSnapshot;
    reason: string;
    created_at: string;
  }[];
};
export type AcademicResult = {
  id: number;
  subject: string;
  semester: number;
  kind: "credit" | "exam";
  status: "upcoming" | "awaiting" | "published";
  control_at: string;
  grade: number | null;
  credit_passed: boolean | null;
  passed: boolean;
  label: string;
};
export type JournalCounts = {
  present: number;
  absent: number;
  completed: number;
  pending: number;
};
export type StudyEngagement = JournalCounts & {
  subjects: (JournalCounts & { subject: string })[];
};
export type AcademicPayload = {
  semesters: number[];
  semester: number | null;
  as_of: string;
  session_period: { start: string; end: string } | null;
  results: AcademicResult[];
  engagement?: StudyEngagement;
  summary: {
    closed: number;
    total: number;
    awaiting: number;
    next_credit: AcademicResult | null;
    next_control?: AcademicResult | null;
  };
};
