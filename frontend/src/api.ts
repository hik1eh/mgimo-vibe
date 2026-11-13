export type User = {
  id: number;
  login: string;
  role: "student" | "staff";
  full_name: string;
  faculty: string;
  group: string | null;
  course: number | null;
  direction: string | null;
};
export type Status = "accepted" | "in_progress" | "needs_info" | "ready";
export type RequestRecord = {
  id: number;
  number: string;
  status: Status;
  version: number;
  type: string;
  purpose: string;
  created_at: string;
  due_at: string;
  delivery: string;
  student: User;
  document_url?: string;
  events?: {
    id: number;
    kind: string;
    text: string;
    created_at: string;
    actor: string;
    role: string;
  }[];
};
export type Notice = {
  id: number;
  title: string;
  request_id: number;
  read: boolean;
  created_at: string;
};
let csrf = "";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(method !== "GET" ? { "X-CSRF-Token": csrf } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  } catch {
    throw new Error(
      "Не удалось связаться с сервером. Текст сохранён — повторите действие.",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && path !== "/auth/login" && path !== "/me")
      window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(
      response.status,
      typeof body.detail === "string"
        ? body.detail
        : "Проверьте заполнение полей и повторите действие.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export async function refreshCsrf() {
  csrf = (await api<{ csrf_token: string }>("/auth/csrf")).csrf_token;
}
export async function signIn(login: string, password: string) {
  await refreshCsrf();
  const result = await api<{ user: User; csrf_token: string }>(
    "/auth/login",
    "POST",
    { login, password },
  );
  csrf = result.csrf_token;
  return result.user;
}
export const statusLabels: Record<Status, string> = {
  accepted: "Принята",
  in_progress: "В работе",
  needs_info: "Нужно уточнение",
  ready: "Готова",
};
export const date = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
