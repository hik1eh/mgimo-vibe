import type { JournalCounts, StudyEngagement } from "./study-types";

export function EngagementMetrics({ data }: { data: JournalCounts }) {
  const lessons = data.present + data.absent;
  const checkpoints = data.completed + data.pending;
  return (
    <dl className="engagement-metrics">
      <div>
        <dt>Посещено занятий</dt>
        <dd>{lessons ? `${data.present} из ${lessons}` : "Нет отметок"}</dd>
      </div>
      <div>
        <dt>Контрольные точки</dt>
        <dd>{checkpoints ? `Выполнено ${data.completed} из ${checkpoints}` : "Нет отметок"}</dd>
      </div>
    </dl>
  );
}

export function EngagementPanel({ data }: { data: StudyEngagement }) {
  return (
    <section className="panel engagement-panel" aria-labelledby="engagement-title">
      <h2 id="engagement-title">Посещаемость и контрольные точки</h2>
      {data.subjects.length > 0 ? (
        <>
          <p className="muted">В сводке учитываются отметки преподавателей за выбранный семестр.</p>
          <EngagementMetrics data={data} />
          <ul className="engagement-subjects">
            {data.subjects.map((subject) => (
              <li key={subject.subject}>
                <h3>{subject.subject}</h3>
                <EngagementMetrics data={subject} />
              </li>
            ))}
          </ul>
        </>
      ) : <p className="muted">За выбранный семестр отметок пока нет.</p>}
    </section>
  );
}
