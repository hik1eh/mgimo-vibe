import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useNavigationType,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  DownloadSimple,
  FileText,
} from "@phosphor-icons/react";
import {
  api,
  ApiError,
  date,
  statusLabels,
  type RequestRecord,
  type Status,
  type User,
} from "./api";
import type { Group } from "./campus-types";
import { submissionKey } from "./ids";
import { ErrorBox, useMediaQuery, useResource } from "./ui";

function Badge({ status }: { status: Status }) {
  return <span className={`badge ${status}`}>{statusLabels[status]}</span>;
}

const studentFilters = [
  ["", "Все"],
  ["active", "В работе"],
  ["ready", "Готовые"],
] as const;

export function RequestWorkspace({ user }: { user: User }) {
  const wide = useMediaQuery("(min-width: 1040px)");
  const { id } = useParams();
  const location = useLocation();
  const navigation = useNavigationType();
  const [params, setParams] = useSearchParams();
  const staff = user.role === "staff";
  const listVisible = wide || !id;
  const resource = useResource<RequestRecord[]>(
    listVisible ? (staff ? `/staff/requests?${params}` : "/requests") : null,
    true,
  );
  const groups = useResource<Group[]>(
    staff && listVisible ? "/staff/groups" : null,
  );
  const status = params.get("status") || "";
  const rows = resource.data?.filter(
    (row) =>
      staff ||
      !status ||
      (status === "ready" ? row.status === "ready" : row.status !== "ready"),
  );
  const selected = id || (wide && rows?.[0] ? String(rows[0].id) : "");
  const restored = useRef("");
  const scrollKey = `requests-scroll-${user.id}`;

  useEffect(() => {
    if (id || wide || !rows || restored.current === location.key) return;
    restored.current = location.key;
    if (navigation !== "POP" && !location.state?.restoreRequestScroll) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(scrollKey) || "null");
      if (saved?.search === location.search) {
        requestAnimationFrame(() =>
          window.scrollTo({ top: saved.top, behavior: "instant" }),
        );
      }
    } catch {
      /* The list remains usable without storage. */
    }
  }, [
    id,
    wide,
    rows,
    location.key,
    location.search,
    location.state,
    navigation,
    scrollKey,
  ]);

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  if (!listVisible && id)
    return <RequestDetail key={id} user={user} recordId={id} />;

  return (
    <div className="request-workspace">
      <section
        className="panel request-queue"
        aria-labelledby="request-queue-heading"
      >
        <div className="section-heading">
          <h2 id="request-queue-heading">
            {staff ? "Заявки факультета" : "Мои заявки"}
          </h2>
          {staff && (
            <button className="text-button" onClick={resource.reload}>
              Обновить
            </button>
          )}
        </div>
        {staff ? (
          <div className="request-filters">
            <label>
              Статус
              <select
                value={status}
                onChange={(event) => filter("status", event.target.value)}
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
              Группа
              <select
                value={params.get("group_id") || ""}
                onChange={(event) => filter("group_id", event.target.value)}
              >
                <option value="">Все свои группы</option>
                {groups.data?.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Номер заявки
              <input
                type="search"
                value={params.get("q") || ""}
                onChange={(event) => filter("q", event.target.value)}
                placeholder="Например, СО-000001"
                maxLength={50}
              />
            </label>
          </div>
        ) : (
          <>
            <div
              className="segmented request-tabs"
              role="group"
              aria-label="Статус заявок"
            >
              {studentFilters.map(([key, label]) => (
                <button
                  key={label}
                  type="button"
                  className={status === key ? "selected" : ""}
                  aria-pressed={status === key}
                  onClick={() => filter("status", key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <Link className="primary request-create" to="/requests/new">
              Заказать справку <span aria-hidden="true">＋</span>
            </Link>
          </>
        )}
        <ErrorBox error={resource.error || groups.error} />
        {resource.error && (
          <button className="secondary" onClick={resource.reload}>
            Повторить
          </button>
        )}
        {!resource.data && !resource.error && (
          <p role="status">Загружаем заявки…</p>
        )}
        {rows?.length === 0 && (
          <p className="muted">
            {status || params.get("q") || params.get("group_id")
              ? "По этому фильтру заявок нет."
              : "Заявок пока нет."}
          </p>
        )}
        <div className="request-picker">
          {rows?.map((row) => (
            <Link
              key={row.id}
              to={`/requests/${row.id}${location.search}`}
              className="request-picker-row"
              aria-current={String(row.id) === selected ? "true" : undefined}
              onClick={() => {
                try {
                  sessionStorage.setItem(
                    scrollKey,
                    JSON.stringify({
                      search: location.search,
                      top: window.scrollY,
                    }),
                  );
                } catch {
                  /* Storage is optional. */
                }
              }}
            >
              <span className="request-file-icon">
                <FileText size={21} aria-hidden="true" />
              </span>
              <span className="request-picker-label">
                <strong>{staff ? row.student.full_name : row.type}</strong>
                <span>
                  {row.number}
                  {staff ? ` · ${row.student.group}` : ""}
                </span>
                <small>
                  Подана {date(row.created_at)}
                  <br />
                  Срок {date(row.due_at)}
                </small>
                <Badge status={row.status} />
              </span>
              <ArrowUpRight
                size={16}
                className="request-picker-arrow"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>
      {wide && selected && (
        <RequestDetail
          key={selected}
          recordId={selected}
          user={user}
          embedded
          subheading={!id}
          onChanged={resource.reload}
        />
      )}
    </div>
  );
}

export function NewRequest({ user }: { user: User }) {
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
    [purposeError, setPurposeError] = useState(""),
    [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const navigate = useNavigate();
  useEffect(() => {
    sessionStorage.setItem(storage, JSON.stringify(draft));
  }, [draft, storage]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setPurposeError("");
    try {
      const req = await api<RequestRecord>("/requests", "POST", {
        purpose: draft.purpose,
        idempotency_key: draft.key,
      });
      sessionStorage.removeItem(storage);
      navigate(`/requests/${req.id}`, { state: { created: true } });
    } catch (e) {
      if (e instanceof ApiError && e.fields.purpose)
        setPurposeError(e.fields.purpose);
      else setError((e as Error).message);
    } finally {
      inFlight.current = false;
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
            <p className="service-type">
              <span>Тип заявки</span>
              <strong>Справка об обучении</strong>
            </p>
            <label>
              Место предъявления
              <textarea
                aria-label="Место предъявления"
                required
                minLength={3}
                maxLength={500}
                placeholder="Например, по месту требования"
                aria-invalid={Boolean(purposeError)}
                aria-describedby={purposeError ? "purpose-error" : undefined}
                value={draft.purpose}
                onChange={(e) =>
                  setDraft({ ...draft, purpose: e.target.value })
                }
              />
              <small>
                От 3 до 500 символов.
              </small>
            </label>
            {purposeError && (
              <p className="field-error" id="purpose-error" role="alert">
                {purposeError}
              </p>
            )}
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
        </aside>
      </div>
    </>
  );
}

function RequestDetail({
  user,
  recordId: id,
  embedded = false,
  subheading = false,
  onChanged,
}: {
  user: User;
  recordId: string;
  embedded?: boolean;
  subheading?: boolean;
  onChanged?: () => void;
}) {
  const location = useLocation();
  const Heading = subheading ? "h2" : "h1";
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
    if (!req || busy) return;
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
      onChanged?.();
    } catch (e) {
      setActionError((e as Error).message);
      reload();
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    if (busy || !req?.document_url) return;
    setBusy(true);
    setActionError("");
    try {
      const response = await fetch(req.document_url, {
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
      setMessage("Справка скачана.");
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="request-detail" data-embedded={embedded || undefined}>
      {!subheading && (
        <Link
          className="back"
          to={`/requests${location.search}`}
          state={{ restoreRequestScroll: true }}
        >
          ← {staff ? "К очереди" : "К моим заявкам"}
        </Link>
      )}
      {!req && <Heading>Заявка</Heading>}
      <ErrorBox error={error} />
      {error && (
        <button className="secondary" onClick={reload}>
          Повторить
        </button>
      )}
      {!req && !error && <p role="status">Загружаем карточку…</p>}
      {req && (
        <>
          <div className="page-title title-row">
            <div>
              <span className="eyebrow">ЗАЯВКА {req.number}</span>
              <Heading>{req.type}</Heading>
              <p>Подана {date(req.created_at)}</p>
            </div>
            <Badge status={req.status} />
          </div>
          {location.state?.created && (
            <p className="success" role="status">
              Заявка {req.number} принята.
            </p>
          )}
          <RequestProgress status={req.status} />
          <div className="request-detail-grid">
            <aside>
              <section
                className={`panel action-panel ${!staff && req.status === "ready" ? "ready-document" : ""}`}
              >
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
                {!staff && req.status === "ready" && req.document_url && (
                  <>
                    <span className="document-sheet" aria-hidden="true">
                      <FileText />
                    </span>
                    <button
                      className="primary"
                      onClick={download}
                      disabled={busy}
                    >
                      <DownloadSimple size={20} aria-hidden="true" />
                      {busy ? "Загружаем…" : "Скачать PDF"}
                    </button>
                  </>
                )}
                {!staff && req.status === "ready" && !req.document_url && (
                  <p>PDF ещё формируется. Карточка обновится автоматически.</p>
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
                    Студенту отправлено уведомление. Справка доступна в его кабинете.
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
          </div>
        </>
      )}
    </article>
  );
}

function RequestProgress({ status }: { status: Status }) {
  const current = status === "ready" ? 2 : status === "accepted" ? 0 : 1;
  return (
    <ol className="request-progress" aria-label="Этапы заявки">
      {[
        "Принята",
        status === "needs_info" ? "Нужно уточнение" : "В работе",
        "Готова",
      ].map((label, index) => (
        <li
          key={index}
          data-complete={index <= current || undefined}
          aria-current={index === current ? "step" : undefined}
        >
          <span>
            {index < current || status === "ready" ? (
              <Check size={15} aria-hidden="true" />
            ) : (
              <i aria-hidden="true" />
            )}
          </span>
          <strong>{label}</strong>
        </li>
      ))}
    </ol>
  );
}
