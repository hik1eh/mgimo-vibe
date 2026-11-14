import { StrictMode, useEffect, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  api,
  ApiError,
  refreshCsrf,
  statusLabels,
  date,
  type User,
  type RequestRecord,
  type Status,
  type Notice,
} from "./api";
import { Login } from "./auth";
import "./tokens.css";
import "./style.css";
import { ErrorBox, useResource } from "./ui";
import { SchedulePage, LessonPage, ResultsPage } from "./study";
import {
  TodayPage,
  AnnouncementsPage,
  AnnouncementPage,
  StudentAccount,
  NotificationExtras,
} from "./campus";
import {
  StaffSchedulePage,
  StaffLessonPage,
  StaffAnnouncementsPage,
  StaffAnnouncementPage,
} from "./staff";
import "./campus.css";
import "./polish.css";
import { submissionKey } from "./ids";

function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById("main")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function Badge({ status }: { status: Status }) {
  return <span className={`badge ${status}`}>{statusLabels[status]}</span>;
}

function Profile({ user }: { user: User }) {
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">ЛИЧНЫЙ КАБИНЕТ</span>
        <h1>Ваш профиль</h1>
        <p>Сведения из демонстрационного учебного контура.</p>
      </div>
      <section className="panel profile">
        <div className="avatar">
          {user.full_name
            .split(" ")
            .map((p) => p[0])
            .join("")}
        </div>
        <div>
          <h2>{user.full_name}</h2>
          <p className="muted">
            {user.role === "student" ? "Студент" : "Сотрудник деканата"}
          </p>
          <dl>
            <dt>Факультет</dt>
            <dd>{user.faculty}</dd>
            {user.role === "student" && (
              <>
                <dt>Направление</dt>
                <dd>{user.direction}</dd>
                <dt>Курс</dt>
                <dd>{user.course}</dd>
                <dt>Группа</dt>
                <dd>{user.group}</dd>
              </>
            )}
            <dt>Логин</dt>
            <dd>{user.login}</dd>
          </dl>
        </div>
      </section>
    </>
  );
}

function RequestList({ user }: { user: User }) {
  const staff = user.role === "staff";
  const [filter, setFilter] = useState(""),
    [search, setSearch] = useState("");
  const { data, error, reload } = useResource<RequestRecord[]>(
    staff
      ? `/staff/requests?status=${filter}&q=${encodeURIComponent(search)}`
      : "/requests",
    true,
  );
  return (
    <>
      <div className="page-title title-row">
        <div>
          <span className="eyebrow">
            {staff ? "КАБИНЕТ СОТРУДНИКА" : "СЕРВИСЫ ДЕКАНАТА"}
          </span>
          <h1>{staff ? "Очередь заявок" : "Заявки и справки"}</h1>
          <p>
            {staff
              ? user.faculty
              : "От отправки до готового документа — всё здесь."}
          </p>
        </div>
        {!staff && (
          <Link className="primary" to="/requests/new">
            Заказать справку <span aria-hidden>＋</span>
          </Link>
        )}
      </div>
      {!staff && (
        <div className="service-strip">
          <div className="service-icon" aria-hidden>
            ↗
          </div>
          <div>
            <strong>Справка об обучении</strong>
            <p>Электронная выдача · До 2 рабочих дней</p>
          </div>
          <span className="strip-label">Демонстрационный сервис</span>
        </div>
      )}
      <section className="panel">
        <div className="section-heading">
          <h2>
            {staff ? "Заявки вашего факультета" : "Мои заявки"}{" "}
            <span className="count">{data?.length ?? "—"}</span>
          </h2>
          <button className="text-button" onClick={reload}>
            Обновить
          </button>
        </div>
        {staff && (
          <div className="filters">
            <label>
              Статус
              <select
                aria-label="Статус"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">Все статусы</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Номер заявки
              <input
                type="search"
                placeholder="Например, СО-000001"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
        )}
        <ErrorBox error={error} />
        {!data && !error && <p role="status">Загружаем заявки…</p>}
        {data?.length === 0 && (
          <div className="empty">
            <span aria-hidden>▤</span>
            <h3>{staff ? "Заявок пока нет" : "Здесь появятся ваши заявки"}</h3>
            <p>
              {staff
                ? "Попробуйте другой фильтр или дождитесь новой заявки."
                : "Закажите справку об обучении. Статус и история сохранятся в кабинете."}
            </p>
          </div>
        )}
        {staff && !!data?.length && (
          <table className="staff-queue-table">
            <caption className="sr-only">
              Очередь заявок вашего факультета
            </caption>
            <thead>
              <tr>
                <th scope="col">Номер</th>
                <th scope="col">Студент и группа</th>
                <th scope="col">Тип</th>
                <th scope="col">Подана</th>
                <th scope="col">Срок</th>
                <th scope="col">Статус</th>
              </tr>
            </thead>
            <tbody>
              {data.map((req) => (
                <tr key={req.id}>
                  <th scope="row">
                    <Link to={`/requests/${req.id}`}>{req.number}</Link>
                  </th>
                  <td>
                    {req.student.full_name}
                    <small className="block">{req.student.group}</small>
                  </td>
                  <td>{req.type}</td>
                  <td>{date(req.created_at)}</td>
                  <td>{date(req.due_at)}</td>
                  <td>
                    <Badge status={req.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className={`request-list ${staff ? "staff-queue-cards" : ""}`}>
          {data?.map((req) => (
            <Link
              key={req.id}
              className="request-row"
              to={`/requests/${req.id}`}
            >
              <div>
                <span className="request-number">{req.number}</span>
                <h3>{staff ? req.student.full_name : req.type}</h3>
                <p>
                  {staff ? `${req.student.group} · ${req.type}` : req.purpose}
                </p>
                <small>
                  Подана {date(req.created_at)} · срок {date(req.due_at)}
                </small>
              </div>
              <div className="row-end">
                <Badge status={req.status} />
                <span className="arrow" aria-hidden>
                  ↗
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function NewRequest({ user }: { user: User }) {
  const storage = `request-draft-${user.id}`;
  const [draft, setDraft] = useState<{ purpose: string; key: string }>(() => {
    try {
      const saved = sessionStorage.getItem(storage);
      if (saved) return JSON.parse(saved);
    } catch {
      /* Fresh draft */
    }
    return { purpose: "", key: submissionKey() };
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    sessionStorage.setItem(storage, JSON.stringify(draft));
  }, [draft, storage]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const req = await api<RequestRecord>("/requests", "POST", {
        purpose: draft.purpose,
        idempotency_key: draft.key,
      });
      sessionStorage.removeItem(storage);
      navigate(`/requests/${req.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back" to="/requests">
        ← К моим заявкам
      </Link>
      <div className="page-title">
        <span className="eyebrow">НОВАЯ ЗАЯВКА</span>
        <h1>Справка об обучении</h1>
        <p>Проверьте сведения и укажите, куда нужна справка.</p>
      </div>
      <div className="two-columns">
        <section className="panel">
          <h2>Данные для справки</h2>
          <dl>
            <dt>Студент</dt>
            <dd>{user.full_name}</dd>
            <dt>Группа</dt>
            <dd>{user.group}</dd>
            <dt>Факультет</dt>
            <dd>{user.faculty}</dd>
          </dl>
          <form onSubmit={submit}>
            <label>
              Место предъявления
              <textarea
                aria-label="Место предъявления"
                required
                minLength={3}
                maxLength={500}
                placeholder="Например, по месту требования"
                value={draft.purpose}
                onChange={(e) =>
                  setDraft({ ...draft, purpose: e.target.value })
                }
              />
              <small>
                От 3 до 500 символов. Используйте только вымышленные сведения.
              </small>
            </label>
            <ErrorBox error={error} />
            <button className="primary" disabled={busy}>
              {busy ? "Отправляем…" : "Отправить заявку"}
            </button>
          </form>
        </section>
        <aside className="panel info-panel">
          <span className="eyebrow">КАК ЭТО РАБОТАЕТ</span>
          <h2>До 2 рабочих дней</h2>
          <p>
            Сотрудник проверит заявку и при необходимости задаст вопрос прямо в
            карточке.
          </p>
          <hr />
          <h3>Электронный PDF</h3>
          <p>
            Когда справка будет готова, появится уведомление и кнопка
            скачивания.
          </p>
          <p className="fine">
            Документ с пометкой «Демонстрационный образец» не имеет юридической
            силы.
          </p>
        </aside>
      </div>
    </>
  );
}

function RequestDetail({ user }: { user: User }) {
  const { id } = useParams();
  const staff = user.role === "staff";
  const {
    data: req,
    error,
    reload,
  } = useResource<RequestRecord>(
    `${staff ? "/staff" : ""}/requests/${id}`,
    true,
  );
  const [text, setText] = useState(
      () => sessionStorage.getItem(`reply-${user.id}-${id}`) || "",
    ),
    [actionError, setActionError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    sessionStorage.setItem(`reply-${user.id}-${id}`, text);
  }, [text, id, user.id]);
  async function act(action: string) {
    if (!req) return;
    setBusy(true);
    setActionError("");
    setMessage("");
    try {
      await api(
        staff ? `/staff/requests/${id}/transitions` : `/requests/${id}/reply`,
        "POST",
        { action, text, version: req.version },
      );
      setText("");
      setMessage("Изменения сохранены.");
      reload();
    } catch (e) {
      setActionError((e as Error).message);
      reload();
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    setActionError("");
    try {
      const response = await fetch(`/api/v1/requests/${id}/document`, {
        credentials: "same-origin",
      });
      if (!response.ok) {
        if (response.status === 401)
          window.dispatchEvent(new Event("session-expired"));
        throw new Error(
          "Документ недоступен. Обновите карточку или войдите снова.",
        );
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${id}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Демонстрационная справка скачана.");
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back" to="/requests">
        ← {staff ? "К очереди" : "К моим заявкам"}
      </Link>
      <ErrorBox error={error} />
      {!req && !error && <p role="status">Загружаем карточку…</p>}
      {req && (
        <>
          <div className="page-title title-row">
            <div>
              <span className="eyebrow">ЗАЯВКА {req.number}</span>
              <h1>{req.type}</h1>
              <p>Подана {date(req.created_at)}</p>
            </div>
            <Badge status={req.status} />
          </div>
          <div className="two-columns">
            <div>
              <section className="panel">
                <div className="section-heading">
                  <h2>Детали заявки</h2>
                  <button className="text-button" onClick={reload}>
                    Обновить
                  </button>
                </div>
                <dl>
                  <dt>Студент</dt>
                  <dd>{req.student.full_name}</dd>
                  <dt>Факультет · группа</dt>
                  <dd>
                    {req.student.faculty} · {req.student.group}
                  </dd>
                  <dt>Место предъявления</dt>
                  <dd>{req.purpose}</dd>
                  <dt>Способ получения</dt>
                  <dd>{req.delivery}</dd>
                  <dt>Ориентир готовности</dt>
                  <dd>
                    {date(req.due_at)}
                    <small className="block">
                      До 2 рабочих дней; при уточнении срок может измениться.
                    </small>
                  </dd>
                </dl>
              </section>
              <section className="panel history">
                <h2>История и переписка</h2>
                <ol>
                  {req.events?.map((event) => (
                    <li key={event.id}>
                      <div className="timeline-dot" />
                      <small>
                        {date(event.created_at)} · {event.actor}
                      </small>
                      <p>{event.text}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
            <aside>
              <section className="panel action-panel">
                <span className="eyebrow">СЛЕДУЮЩИЙ ШАГ</span>
                <h2>
                  {req.status === "ready"
                    ? "Документ готов"
                    : req.status === "needs_info"
                      ? staff
                        ? "Ждём ответ студента"
                        : "Ответьте на вопрос"
                      : req.status === "accepted"
                        ? staff
                          ? "Начните обработку"
                          : "Заявка принята"
                        : staff
                          ? "Продолжите обработку"
                          : "Справка в работе"}
                </h2>
                <ErrorBox error={actionError} />
                {message && (
                  <p className="success" role="status">
                    {message}
                  </p>
                )}
                {!staff && req.status === "ready" && (
                  <>
                    <p>Справка доступна в формате PDF.</p>
                    <button
                      className="primary"
                      onClick={download}
                      disabled={busy}
                    >
                      {busy ? "Загружаем…" : "Скачать справку ↓"}
                    </button>
                    <p className="fine">
                      Демонстрационный образец. Не имеет юридической силы.
                    </p>
                  </>
                )}
                {!staff && ["accepted", "in_progress"].includes(req.status) && (
                  <p>
                    Сотрудник деканата готовит справку. Если понадобятся
                    сведения, вопрос появится здесь.
                  </p>
                )}
                {staff && req.status === "accepted" && (
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => act("start")}
                  >
                    Взять в работу
                  </button>
                )}
                {staff && req.status === "needs_info" && (
                  <p>После ответа заявка автоматически вернётся в работу.</p>
                )}
                {staff && req.status === "ready" && (
                  <p>
                    Студенту отправлено уведомление. Демонстрационная справка
                    доступна в его кабинете.
                  </p>
                )}
                {((staff && req.status === "in_progress") ||
                  (!staff && req.status === "needs_info")) && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void act(staff ? "clarify" : "reply");
                    }}
                  >
                    <label>
                      {staff ? "Вопрос студенту" : "Ваш ответ"}
                      <textarea
                        aria-label={staff ? "Вопрос студенту" : "Ваш ответ"}
                        required
                        maxLength={2000}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={
                          staff
                            ? "Какие сведения нужно уточнить?"
                            : "Уточните сведения для сотрудника"
                        }
                      />
                    </label>
                    <button
                      className="secondary"
                      disabled={busy || !text.trim()}
                    >
                      {busy
                        ? "Сохраняем…"
                        : staff
                          ? "Запросить уточнение"
                          : "Отправить ответ"}
                    </button>
                  </form>
                )}
                {staff && req.status === "in_progress" && (
                  <button
                    className="primary complete"
                    disabled={busy}
                    onClick={() => act("complete")}
                  >
                    Отметить готовой
                  </button>
                )}
              </section>
            </aside>
          </div>
        </>
      )}
    </>
  );
}

function Notifications() {
  const { data, error, reload } = useResource<Notice[]>("/notifications", true);
  const [actionError, setActionError] = useState("");
  const navigate = useNavigate();
  async function open(notice: Notice) {
    setActionError("");
    try {
      await api(`/notifications/${notice.id}`, "PATCH");
      navigate(`/requests/${notice.request_id}`);
    } catch (e) {
      setActionError((e as Error).message);
    }
  }
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">ВАЖНОЕ В КАБИНЕТЕ</span>
        <h1>Уведомления</h1>
        <p>Личные события, учебные напоминания и сообщения вашего кампуса.</p>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Личные уведомления</h2>
          <button className="text-button" onClick={reload}>
            Обновить
          </button>
        </div>
        <ErrorBox error={error || actionError} />
        {!data && !error && <p>Загружаем…</p>}
        {data?.length === 0 && (
          <div className="empty">
            <h3>Новых событий пока нет</h3>
            <p>Здесь появятся изменения статуса и вопросы сотрудника.</p>
          </div>
        )}
        {data?.map((n) => (
          <button
            key={n.id}
            className={`notice ${n.read ? "read" : ""}`}
            onClick={() => open(n)}
          >
            <span>
              <strong>{n.title}</strong>
              <small>
                {date(n.created_at)} · {n.read ? "Прочитано" : "Новое"}
              </small>
            </span>
            <span aria-hidden>↗</span>
          </button>
        ))}
      </section>
      <NotificationExtras />
    </>
  );
}

function Cabinet({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [error, setError] = useState("");
  const staff = user.role === "staff";
  async function logout() {
    try {
      await api("/auth/logout", "POST");
      onLogout();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <div className="prototype-bar">
        Конкурсный прототип{" "}
        <span>· Университет, профили и документы вымышлены</span>
      </div>
      <header className={staff ? "staff-header" : "student-header"}>
        <Link className="brand" to={staff ? "/requests" : "/today"}>
          <span className="brand-mark">СК</span>
          <span>
            Цифровой
            <br />
            <strong>деканат</strong>
          </span>
        </Link>
        <nav
          className={staff ? "staff-nav" : "student-nav"}
          aria-label="Основная навигация"
        >
          {!staff && (
            <>
              <NavLink to="/today">Сегодня</NavLink>
              <NavLink to="/schedule">Расписание</NavLink>
              <NavLink to="/academic-results">Оценки</NavLink>
            </>
          )}
          <NavLink to="/requests">
            {staff ? "Очередь заявок" : "Заявки"}
          </NavLink>
          {staff && (
            <>
              <NavLink to="/staff/announcements">Объявления</NavLink>
              <NavLink to="/staff/schedule">Расписание</NavLink>
              <NavLink to="/profile">Профиль</NavLink>
            </>
          )}
        </nav>
        <div className="header-user">
          {staff ? (
            <span>
              {user.full_name}
              <small>Сотрудник</small>
            </span>
          ) : (
            <StudentAccount />
          )}
          <button className="logout" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <RouteFocus />
        <ErrorBox error={error} />
        <Routes>
          {!staff && (
            <>
              <Route path="/today" element={<TodayPage user={user} />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/announcements/:id" element={<AnnouncementPage />} />
              <Route path="/schedule" element={<SchedulePage user={user} />} />
              <Route path="/schedule/:id" element={<LessonPage />} />
              <Route path="/academic-results" element={<ResultsPage />} />
            </>
          )}
          {staff && (
            <>
              <Route path="/staff/schedule" element={<StaffSchedulePage />} />
              <Route
                path="/staff/schedule/:id"
                element={<StaffLessonPage user={user} />}
              />
              <Route
                path="/staff/announcements"
                element={<StaffAnnouncementsPage />}
              />
              <Route
                path="/staff/announcements/new"
                element={
                  <StaffAnnouncementPage
                    key="new-announcement"
                    create
                    user={user}
                  />
                }
              />
              <Route
                path="/staff/announcements/:id"
                element={<StaffAnnouncementPage user={user} />}
              />
            </>
          )}
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/requests" element={<RequestList user={user} />} />
          <Route
            path="/requests/new"
            element={
              staff ? (
                <Navigate to="/requests" replace />
              ) : (
                <NewRequest user={user} />
              )
            }
          />
          <Route path="/requests/:id" element={<DetailRoute user={user} />} />
          {!staff && (
            <Route path="/notifications" element={<Notifications />} />
          )}
          <Route
            path="*"
            element={<Navigate to={staff ? "/requests" : "/today"} replace />}
          />
        </Routes>
      </main>
      <footer className={staff ? "" : "student-footer"}>
        <span>Университет Северного кампуса</span>
        <span>Демонстрационный сервис · Итерация 04</span>
      </footer>
    </>
  );
}
function DetailRoute({ user }: { user: User }) {
  const { id } = useParams();
  return <RequestDetail key={id} user={user} />;
}

function App() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [expired, setExpired] = useState(false);
  async function boot() {
    setError("");
    setLoading(true);
    try {
      await refreshCsrf();
      setUser(await api<User>("/me"));
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401))
        setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void boot();
    const expire = () => setExpired(true);
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  if (loading)
    return (
      <div className="boot" role="status">
        Открываем цифровой деканат…
      </div>
    );
  if (error)
    return (
      <div className="boot">
        <ErrorBox error={error} />
        <button className="primary" onClick={boot}>
          Повторить
        </button>
      </div>
    );
  const loggedIn = (u: User) => {
    setUser(u);
    setExpired(false);
    window.dispatchEvent(new Event("session-restored"));
  };
  return user ? (
    <>
      <div inert={expired}>
        <Cabinet
          key={user.id}
          user={user}
          onLogout={() => {
            setUser(null);
            setExpired(false);
            sessionStorage.clear();
          }}
        />
      </div>
      {expired && <Login expired onLogin={loggedIn} />}
    </>
  ) : (
    <Login onLogin={loggedIn} />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
