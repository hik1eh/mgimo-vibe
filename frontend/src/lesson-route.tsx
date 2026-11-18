import { useId, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Elevator,
  MapPin,
  Path,
} from "@phosphor-icons/react";
import { ErrorBox, useResource } from "./ui";
import { lessonPath } from "./schedule-model";
import type { Lesson } from "./study-types";

type Point = [number, number];
type Space = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  kind: "room" | "atrium" | "lift" | "stairs";
};
type Segment = {
  floor: number;
  plan: { width: number; height: number; spaces: Space[] };
  points: Point[];
  start: string;
  end: string;
  instruction: string;
};
type RouteData = { lesson: Lesson; segments: Segment[] };

export function RouteLink({
  lesson,
  search = "",
}: {
  lesson: Lesson;
  search?: string;
}) {
  if (!lesson.has_route || lesson.status === "cancelled") return null;
  return (
    <Link
      className="secondary route-link"
      to={`/schedule/${lesson.id}/route${search}`}
    >
      <Path size={19} aria-hidden="true" /> Показать маршрут
    </Link>
  );
}

function FloorPlan({ segment, room }: { segment: Segment; room: string }) {
  const id = useId();
  const { plan, points } = segment;
  const [sx, sy] = points[0];
  const [ex, ey] = points.at(-1)!;
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <svg
      className="campus-plan"
      viewBox={`0 0 ${plan.width} ${plan.height}`}
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
    >
      <title id={`${id}-title`}>{segment.floor}-й этаж</title>
      <desc id={`${id}-desc`}>{segment.instruction}</desc>
      <rect
        x="40"
        y="44"
        width="600"
        height="282"
        rx="10"
        className="plan-base"
      />
      {plan.spaces.map((space) => (
        <g key={space.label}>
          <rect
            className="plan-room"
            data-kind={space.kind}
            data-destination={space.label === room || undefined}
            x={space.x}
            y={space.y}
            width={space.width}
            height={space.height}
          />
          <text
            className="plan-room-label"
            data-compact={space.kind === "stairs" || undefined}
            x={space.x + space.width / 2}
            y={space.y + space.height / 2 + 5}
            textAnchor="middle"
          >
            {space.label}
          </text>
        </g>
      ))}
      <text x="92" y="229" className="plan-corridor-label">
        Коридор
      </text>
      <polyline points={line} className="plan-path-halo" />
      <polyline
        points={line}
        className="plan-path"
        data-route-segment={segment.floor}
      />
      <circle cx={sx} cy={sy} r="12" className="plan-start" />
      <rect
        x={ex - 10}
        y={ey - 10}
        width="20"
        height="20"
        rx="5"
        className="plan-end"
      />
      {segment.floor === 1 && (
        <text
          className="plan-point-label"
          x={sx}
          y={sy + 24}
          textAnchor="middle"
        >
          Вход
        </text>
      )}
    </svg>
  );
}

function RoutePlan({ data }: { data: RouteData }) {
  const [selectedFloor, setFloor] = useState(1);
  const { lesson, segments } = data;
  const segment =
    segments.find((item) => item.floor === selectedFloor) || segments[0];
  if (!segment)
    return (
      <section className="panel">
        <h2>
          {lesson.status === "cancelled"
            ? "Занятие отменено"
            : "Схема пока недоступна"}
        </h2>
        <p>
          {lesson.building} · {lesson.floor ? `${lesson.floor}-й этаж · ` : ""}
          аудитория {lesson.room}
        </p>
      </section>
    );
  const destination = segments.at(-1)!;
  return (
    <div className="route-layout">
      <section className="panel route-plan-panel" aria-label="План здания">
        <div className="section-heading">
          <h2>План этажа</h2>
          <div className="segmented" role="group" aria-label="Этаж маршрута">
            {segments.map(({ floor }) => (
              <button
                key={floor}
                type="button"
                aria-pressed={floor === segment.floor}
                className={floor === segment.floor ? "selected" : ""}
                onClick={() => setFloor(floor)}
              >
                {floor}-й этаж
              </button>
            ))}
          </div>
        </div>
        <FloorPlan segment={segment} room={lesson.room} />
        <div className="plan-legend" aria-live="polite">
          <span>
            <i className="legend-start" />
            {segment.start}
          </span>
          <ArrowRight size={16} aria-hidden="true" />
          <span>
            <i className="legend-end" />
            {segment.end}
          </span>
        </div>
      </section>
      <section
        className="panel route-steps"
        aria-labelledby="route-steps-title"
      >
        <h2 id="route-steps-title">Как пройти</h2>
        <ol>
          <li>
            <button
              type="button"
              aria-current={
                segment.floor === segments[0].floor ? "step" : undefined
              }
              onClick={() => setFloor(segments[0].floor)}
            >
              <Path size={22} aria-hidden="true" />
              <span>
                <strong>До лифта</strong>
                <small>{segments[0].instruction}</small>
              </span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => setFloor(destination.floor)}>
              <Elevator size={22} aria-hidden="true" />
              <span>
                <strong>Подняться на {destination.floor}-й этаж</strong>
                <small>На лифте из главного холла.</small>
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              aria-current={
                segment.floor === destination.floor ? "step" : undefined
              }
              onClick={() => setFloor(destination.floor)}
            >
              <MapPin size={22} aria-hidden="true" />
              <span>
                <strong>До аудитории {lesson.room}</strong>
                <small>{destination.instruction}</small>
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
  const { data, error, reload } = useResource<RouteData>(
    `/schedule/${id}/route`,
    true,
  );
  return (
    <>
      <Link className="back" to={lessonPath(Number(id), search.slice(1))}>
        <ArrowLeft size={16} aria-hidden="true" /> К занятию
      </Link>
      <div className="page-title">
        <h1>Маршрут до аудитории</h1>
        {data && (
          <p>
            {data.lesson.building} ·{" "}
            {data.lesson.floor ? `${data.lesson.floor}-й этаж · ` : ""}аудитория{" "}
            {data.lesson.room}
          </p>
        )}
      </div>
      <ErrorBox error={error} />
      {error && (
        <button className="secondary" onClick={reload}>
          Повторить
        </button>
      )}
      {!error && !data && <p role="status">Загружаем план…</p>}
      {data && <RoutePlan key={data.lesson.room_id} data={data} />}
    </>
  );
}
