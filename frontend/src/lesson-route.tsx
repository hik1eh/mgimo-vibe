import { lazy, Suspense, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  Elevator,
  Path,
} from "@phosphor-icons/react";
import { ErrorBox, useResource } from "./ui";
import { lessonPath } from "./schedule-model";
import type { Lesson } from "./study-types";
import type { FloorLayout, FloorSegment } from "./indoor-route-types";
import type { IndoorStatus } from "./indoor-route-canvas";
import { CampusPreview } from "./campus-preview";
import "./indoor-route.css";

const IndoorRouteCanvas = lazy(() => import("./indoor-route-canvas"));
const viewpoints = [-0.58, -0.23, 0.23, 0.58];

type RouteData = { lesson: Lesson; segments: FloorSegment[]; floors?: FloorLayout[] };

export function RouteLink({
  lesson,
  search = "",
}: {
  lesson: Lesson;
  search?: string;
}) {
  if (!lesson.has_route || lesson.status === "cancelled") return null;
  return (
    <Link className="secondary route-link" to={`/schedule/${lesson.id}/route${search}`}>
      <Path size={19} aria-hidden="true" /> Показать маршрут
    </Link>
  );
}

function FloorModel({ floor, segment, room }: {
  floor: FloorLayout;
  segment: FloorSegment | undefined;
  room: string;
}) {
  const [view, setView] = useState(1);
  const [status, setStatus] = useState<IndoorStatus>("loading");
  return (
    <>
      <div
        className="indoor-stage"
        data-render={status}
        data-route-segment={segment?.floor}
      >
        <div
          className="indoor-visual"
          role={status === "ready" ? "img" : undefined}
          aria-label={status === "ready"
            ? `3D-модель, ${floor.floor}-й этаж. ${segment ? `${segment.start} → ${segment.end}.` : "Лифт и помещения этажа."}`
            : undefined}
        >
          {status !== "unavailable" && (
            <Suspense fallback={null}>
              <IndoorRouteCanvas
                floor={floor}
                segment={segment}
                room={room}
                angle={viewpoints[view]}
                onStatus={setStatus}
              />
            </Suspense>
          )}
        </div>
        {status !== "ready" && (
          <p className="indoor-placeholder" role="status">
            {status === "loading"
              ? "Загружаем 3D-модель…"
              : "3D-модель недоступна в этом браузере. Следуйте подсказке для выбранного этажа."}
          </p>
        )}
      </div>
      <div className="indoor-toolbar">
        {segment ? (
          <div className="indoor-legend">
            <span><i className="indoor-start" />{segment.start}</span>
            <ArrowRight size={16} aria-hidden="true" />
            <span><i className="indoor-end" />{segment.end}</span>
          </div>
        ) : (
          <p className="indoor-outside">Маршрут пешком проходит на других этажах.</p>
        )}
        {status === "ready" && (
          <div className="indoor-views" role="group" aria-label="Ракурс 3D-модели">
            <button
              className="secondary square"
              type="button"
              disabled={view === 0}
              aria-label="Повернуть модель влево"
              onClick={() => setView((index) => Math.max(0, index - 1))}
            >
              <ArrowCounterClockwise size={20} aria-hidden="true" />
            </button>
            <button
              className="secondary square"
              type="button"
              disabled={view === viewpoints.length - 1}
              aria-label="Повернуть модель вправо"
              onClick={() => setView((index) => Math.min(viewpoints.length - 1, index + 1))}
            >
              <ArrowClockwise size={20} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function BuildingRoute({ data }: { data: RouteData }) {
  const [selected, setFloor] = useState<number>();
  const { lesson, segments } = data;
  const start = segments[0];
  const destination = segments.at(-1);
  if (!start || !destination) {
    return (
      <section className="panel indoor-unmapped">
        <h2>{lesson.status === "cancelled" ? "Занятие отменено" : "Маршрут пока недоступен"}</h2>
        <p>
          {lesson.building} · {lesson.floor ? `${lesson.floor}-й этаж · ` : ""}
          аудитория {lesson.room}
        </p>
      </section>
    );
  }
  const floors = data.floors?.length ? data.floors : segments;
  const current = floors.find((floor) => floor.floor === selected) ?? start;
  const segment = segments.find((item) => item.floor === current.floor);
  const isStart = current.floor === start.floor;
  const inTransit = current.floor < destination.floor;

  return (
    <div className="route-layout">
      <section className="panel indoor-model-panel" aria-label="Внутренняя 3D-модель корпуса">
        <div className="section-heading indoor-heading">
          <h2>Внутри корпуса</h2>
          <div className="segmented indoor-floors" role="group" aria-label="Выбор этажа">
            {floors.map(({ floor }) => (
              <button
                key={floor}
                type="button"
                className={floor === current.floor ? "selected" : ""}
                aria-pressed={floor === current.floor}
                onClick={() => setFloor(floor)}
              >
                {floor}-й этаж
              </button>
            ))}
          </div>
        </div>
        <FloorModel floor={current} segment={segment} room={lesson.room} />
      </section>
      <section className="panel route-steps" aria-labelledby="route-steps-title">
        <h2 id="route-steps-title">Как пройти</h2>
        <div className="indoor-instruction" aria-live="polite">
          <span className="eyebrow">{current.floor}-й этаж</span>
          <h3>
            {isStart ? "От входа до лифта"
              : segment ? `От лифта до двери ${lesson.room}`
                : inTransit ? "Продолжайте на лифте" : "Выше аудитории"}
          </h3>
          <p>
            {segment?.instruction ?? (inTransit
              ? `На этом этаже выходить не нужно. Поднимитесь на ${destination.floor}-й этаж.`
              : `Аудитория находится на ${destination.floor}-м этаже. Выберите его, чтобы увидеть путь от лифта.`)}
          </p>
        </div>
        <ol>
          <li>
            <button
              type="button"
              aria-current={isStart ? "step" : undefined}
              onClick={() => setFloor(start.floor)}
            >
              <Path size={22} aria-hidden="true" />
              <span><strong>До лифта</strong><small>{start.floor}-й этаж · главный вход</small></span>
            </button>
          </li>
          <li>
            <button
              type="button"
              aria-current={current.floor === destination.floor ? "step" : undefined}
              onClick={() => setFloor(destination.floor)}
            >
              <Elevator size={22} aria-hidden="true" />
              <span>
                <strong>Подняться на {destination.floor}-й этаж</strong>
                <small>Маршрут от лифта до двери {lesson.room}</small>
              </span>
            </button>
          </li>
        </ol>
      </section>
    </div>
  );
}

export function LessonRoutePage() {
  const { id } = useParams();
  const { search } = useLocation();
  const { data, error, reload } = useResource<RouteData>(`/schedule/${id}/route`, true);
  return (
    <>
      <Link className="back" to={lessonPath(Number(id), search.slice(1))}>
        <ArrowLeft size={16} aria-hidden="true" /> К занятию
      </Link>
      <div className="page-title title-row">
        <div>
          <h1>Маршрут до аудитории</h1>
          {data && (
            <p>
              {data.lesson.building} ·{" "}
              {data.lesson.floor ? `${data.lesson.floor}-й этаж · ` : ""}аудитория{" "}
              {data.lesson.room}
            </p>
          )}
        </div>
        {data?.lesson.building === "Северный корпус" && (
          <CampusPreview className="secondary campus-route-preview" />
        )}
      </div>
      <ErrorBox error={error} />
      {error && <button className="secondary" onClick={reload}>Повторить</button>}
      {!error && !data && <p role="status">Загружаем маршрут…</p>}
      {data && <BuildingRoute key={data.lesson.room_id} data={data} />}
    </>
  );
}
