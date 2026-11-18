import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { Dialog } from "@base-ui/react/dialog";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import type { Announcement } from "./campus-types";
import { campusDay, campusTime, dayLabel } from "./study-dates";
import { lessonPath } from "./schedule-model";
import { ErrorBox, useResource } from "./ui";
import type { LessonAttention } from "./lesson-attention";
import { captureNewsMove } from "./news-carousel-motion";

const source = {
  university: { label: "Вуз", Icon: BookOpen },
  faculty: { label: "Факультет", Icon: GraduationCap },
  group: { label: "Группа", Icon: UsersThree },
};
const wrap = (index: number, length: number) => (index + length) % length;

function useCardLayout() {
  const read = () =>
    innerWidth < 720 ? "mobile" : innerWidth < 1180 ? "three" : "five";
  const [layout, setLayout] = useState(read);
  useEffect(() => {
    const update = () => setLayout(read());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return layout;
}

export function announcementFact(item: Announcement) {
  if (item.lesson) {
    const lesson = item.lesson,
      old = lesson.changes.at(-1)?.before.room;
    return `${campusTime(lesson.starts_at)} · ${lesson.status === "cancelled" ? "Отменено" : old && old !== lesson.room ? `${old} → ${lesson.room}` : `ауд. ${lesson.room}`}`;
  }
  if (item.fact) return item.fact;
  const hours = item.text.match(
    /\b\d{1,2}:\d{2}\s*(?:[–—-]|до)\s*\d{1,2}:\d{2}\b/u,
  )?.[0];
  const date = item.text.match(
    /\b\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/u,
  )?.[0];
  return (
    (hours ? `${date ? `${date} · ` : ""}${hours}` : "") ||
    item.text.split(/\n/)[0] ||
    (item.published_at
      ? dayLabel(campusDay(item.published_at), true)
      : "Объявление деканата")
  );
}

function NewsDetails({
  item,
  close,
  rememberReturn,
}: {
  item: Announcement;
  close: () => void;
  rememberReturn: () => void;
}) {
  const { data, error, reload } = useResource<Announcement>(
    `/announcements/${item.id}`,
    true,
  );
  return (
    <>
      <Dialog.Title className="news-dialog-title">
        {data?.title || item.title}
      </Dialog.Title>
      <ErrorBox error={error} />
      {error && (
        <button className="secondary" onClick={reload}>
          Повторить
        </button>
      )}
      {!data && !error && <p role="status">Загружаем объявление…</p>}
      {data && (
        <>
          <p className="news-dialog-source">
            {source[data.audience].label} · {data.source}
            {data.published_at
              ? ` · ${dayLabel(campusDay(data.published_at), true)}`
              : ""}
          </p>
          <Dialog.Description className="news-dialog-text">
            {data.text}
          </Dialog.Description>
          {data.lesson && (
            <section
              className="news-lesson-context"
              aria-label="Связанное занятие"
            >
              <h3>{data.lesson.subject}</h3>
              <p>
                {dayLabel(campusDay(data.lesson.starts_at), true)} ·{" "}
                {campusTime(data.lesson.starts_at)}–
                {campusTime(data.lesson.ends_at)}
              </p>
              <p>
                {data.lesson.status === "cancelled"
                  ? "Занятие отменено"
                  : `${data.lesson.building} · аудитория ${data.lesson.room}`}
              </p>
              <Link
                className="primary"
                to={lessonPath(data.lesson.id)}
                onClick={() => {
                  rememberReturn();
                  close();
                }}
              >
                Открыть занятие <ArrowRight aria-hidden="true" />
              </Link>
            </section>
          )}
        </>
      )}
    </>
  );
}

export function NewsFeed({
  rows,
  group,
  attention,
}: {
  rows: Announcement[];
  group?: string | null;
  attention: LessonAttention;
}) {
  const { key } = useLocation();
  const historyKey = `dekanat.feed.${key}`;
  const [saved] = useState<{ active: number | null; focus?: number }>(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(historyKey) || "null");
      return {
        active: typeof stored?.active === "number" ? stored.active : null,
        focus: typeof stored?.focus === "number" ? stored.focus : undefined,
      };
    } catch {
      return { active: null };
    }
  });
  const restoreFocus = useRef(saved.focus);
  const news = useMemo(
    () =>
      rows
        .filter((r) => r.status === "published")
        .slice()
        .sort(
          (a, b) =>
            Number(b.pinned) - Number(a.pinned) ||
            Date.parse(b.published_at || "1970-01-01") -
              Date.parse(a.published_at || "1970-01-01") ||
            a.id - b.id,
        ),
    [rows],
  );
  const signature = news.map((item) => item.id).join(",");
  const [activeId, setActiveId] = useState<number | null>(saved.active);
  const index = Math.max(
    0,
    news.findIndex((item) => item.id === activeId),
  );
  const indexRef = useRef(index);
  indexRef.current = index;
  const viewport = useRef<HTMLDivElement>(null);
  const pendingMove = useRef<ReturnType<typeof captureNewsMove> | undefined>(undefined);
  const cancelMove = useRef<(() => void) | undefined>(undefined);
  const mobileTarget = useRef<number | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      sessionStorage.setItem(historyKey, JSON.stringify({ active: activeId }));
    } catch {
      /* Position is optional when storage is unavailable. */
    }
  }, [historyKey, activeId]);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("session-expired", close);
    return () => window.removeEventListener("session-expired", close);
  }, []);
  const layout = useCardLayout(),
    mobile = layout === "mobile";
  const count = Math.min(news.length, layout === "five" ? 5 : 3);
  const offsets =
    count === 5
      ? [-2, -1, 0, 1, 2]
      : count === 4
        ? [-2, -1, 0, 1]
        : count === 3
          ? [-1, 0, 1]
          : count === 2
            ? [0, 1]
            : count === 1
              ? [0]
              : [];
  const visible = mobile
    ? news.map((item, i) => ({ item, offset: i - index }))
    : offsets.map((offset) => ({
        item: news[wrap(index + offset, news.length)],
        offset,
      }));
  const weight = (offset: number) =>
    Math.abs(offset) === 2 ? 0.76 : offset === 0 ? 1.19 : 0.9;

  const revealMobile = (next: number, smooth: boolean) => {
    const el = viewport.current,
      tile = el?.querySelectorAll<HTMLElement>(".news-tile-shell")[next];
    if (!el || !tile) return;
    el.scrollTo({
      left:
        el.scrollLeft +
        tile.getBoundingClientRect().left -
        el.getBoundingClientRect().left -
        (el.clientWidth - tile.offsetWidth) / 2,
      behavior:
        smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "smooth"
          : "instant",
    });
  };
  useLayoutEffect(() => {
    mobileTarget.current = null;
    if (mobile && news.length) revealMobile(indexRef.current, false);
    const returnTo = restoreFocus.current;
    if (returnTo) {
      viewport.current
        ?.querySelector<HTMLButtonElement>(`[data-news-id="${returnTo}"]`)
        ?.focus();
      restoreFocus.current = undefined;
    }
  }, [mobile, signature]);
  useLayoutEffect(() => {
    if (pendingMove.current) {
      cancelMove.current = pendingMove.current.play();
      pendingMove.current = undefined;
    }
  }, [activeId]);
  useEffect(() => () => cancelMove.current?.(), [layout, signature]);
  function move(delta: number, animate: boolean) {
    if (news.length < 2) return;
    const next = wrap((mobileTarget.current ?? indexRef.current) + delta, news.length);
    const track = viewport.current;
    const gentle = animate && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!mobile && track && gentle)
      pendingMove.current = captureNewsMove(track, delta);
    cancelMove.current?.();
    if (mobile) {
      mobileTarget.current = gentle ? next : null;
      revealMobile(next, gentle);
    }
    indexRef.current = next;
    setActiveId(news[next].id);
  }
  function scrolled() {
    const el = viewport.current;
    if (!mobile || !el || !news.length) return;
    const center = el.getBoundingClientRect().left + el.clientWidth / 2;
    const distances = [
      ...el.querySelectorAll<HTMLElement>(".news-tile-shell"),
    ].map((tile) =>
      Math.abs(
        tile.getBoundingClientRect().left + tile.offsetWidth / 2 - center,
      ),
    );
    const nearest = distances.indexOf(Math.min(...distances));
    if (mobileTarget.current !== null && mobileTarget.current !== nearest) return;
    mobileTarget.current = null;
    if (news[nearest]) setActiveId(news[nearest].id);
  }
  return (
    <section className="dean-feed" aria-labelledby="dean-feed-heading">
      <div className="dean-feed-heading">
        <h2 id="dean-feed-heading">Лента деканата</h2>
        {group && <span className="feed-group">{group}</span>}
        {news.length > 1 && (
          <div className="news-controls">
            <span
              className="news-counter"
              role="status"
              aria-live="polite"
              aria-label="Позиция объявления"
            >
              {index + 1} / {news.length}
            </span>
            <button
              type="button"
              className="secondary square"
              aria-label="Предыдущее объявление"
              onClick={(event) => move(-1, event.detail > 0)}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="secondary square"
              aria-label="Следующее объявление"
              onClick={(event) => move(1, event.detail > 0)}
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {!news.length ? (
        <p className="feed-empty">Новых объявлений нет.</p>
      ) : (
        <div
          ref={viewport}
          className={`news-band ${mobile ? "news-mobile" : "news-grid"}`}
          data-count={count}
          style={
            !mobile
              ? {
                  gridTemplateColumns: offsets
                    .map((n) => `minmax(0, ${weight(n)}fr)`)
                    .join(" "),
                }
              : undefined
          }
          tabIndex={0}
          role="group"
          aria-label="Объявления, используйте стрелки или прокрутку"
          onScroll={scrolled}
          onPointerDown={() => {
            mobileTarget.current = null;
          }}
          onKeyDown={(event) => {
            if (
              event.target === event.currentTarget &&
              ["ArrowLeft", "ArrowRight"].includes(event.key)
            ) {
              event.preventDefault();
              move(event.key === "ArrowLeft" ? -1 : 1, false);
            }
          }}
        >
          {visible.map(({ item, offset }) => {
            const { label, Icon } = source[item.audience];
            const current = item.id === news[index]?.id;
            return (
              <div
                key={item.id}
                className="news-tile-shell"
                data-slide-id={item.id}
                data-position={offset}
                data-distance={Math.abs(offset)}
                style={
                  {
                    "--tile-offset": mobile
                      ? "0px"
                      : `${Math.abs(offset) === 2 ? 44 : offset === 0 ? 0 : 23}px`,
                  } as CSSProperties
                }
              >
                <button
                  type="button"
                  className="news-tile"
                  data-news-id={item.id}
                  data-active={current || undefined}
                  data-move-pending={attention.pending(item.lesson) || undefined}
                  aria-haspopup="dialog"
                  aria-current={current ? "true" : undefined}
                  onFocus={() => {
                    if (mobile) {
                      mobileTarget.current = null;
                      const i = news.findIndex((n) => n.id === item.id);
                      setActiveId(item.id);
                      revealMobile(i, false);
                    }
                  }}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") attention.acknowledge(item.lesson);
                  }}
                  onClick={(event) => {
                    attention.acknowledge(item.lesson);
                    trigger.current = event.currentTarget;
                    setSelected(item);
                    setOpen(true);
                  }}
                >
                  <span className="news-source">
                    <span className="news-source-icon">
                      <Icon size={21} aria-hidden="true" />
                    </span>
                    {label}
                    <ArrowUpRight
                      className="news-open-indicator"
                      size={15}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="news-title">{item.title}</span>
                  <span className="news-fact">{announcementFact(item)}</span>
                  <span className="news-peek">
                    {item.lesson
                      ? `${item.lesson.subject} · ${item.lesson.building}`
                      : item.text}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
      <Link className="all-news-link" to="/announcements">
        Все объявления <ArrowRight aria-hidden="true" />
      </Link>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="news-dialog-backdrop" />
          <Dialog.Viewport className="news-dialog-viewport">
            <Dialog.Popup
              className="news-dialog"
              finalFocus={() =>
                trigger.current?.isConnected
                  ? trigger.current
                  : viewport.current
              }
            >
              <Dialog.Close
                className="news-dialog-close"
                aria-label="Закрыть объявление"
              >
                <X size={21} aria-hidden="true" />
                <span>Закрыть</span>
              </Dialog.Close>
              {selected && (
                <NewsDetails
                  key={selected.id}
                  item={selected}
                  close={() => setOpen(false)}
                  rememberReturn={() => {
                    try {
                      sessionStorage.setItem(
                        historyKey,
                        JSON.stringify({
                          active: activeId,
                          focus: selected.id,
                        }),
                      );
                    } catch {
                      /* Focus falls back to the page. */
                    }
                  }}
                />
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
