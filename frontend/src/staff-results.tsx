import { useSearchParams } from "react-router-dom";
import type { Group } from "./campus-types";
import { ErrorBox, useResource } from "./ui";

type Subject = {
  group_id: number;
  group: string;
  subject: string;
  kind: "credit" | "exam";
  semester: number;
  published: number;
  awaiting: number;
  total: number;
};
type FacultyResults = { groups: Group[]; subjects: Subject[] };

export function StaffResultsPage() {
  const [params, setParams] = useSearchParams();
  const group = params.get("group_id") || "";
  const groups = useResource<Group[]>("/staff/groups");
  const { data, error, reload } = useResource<FacultyResults>(
    group
      ? `/staff/academic-results?group_id=${encodeURIComponent(group)}`
      : "/staff/academic-results",
  );
  return (
    <section className="panel faculty-results">
      <div className="section-heading">
        <h2>Сводка дисциплин</h2>
        <button className="text-button" onClick={reload}>
          Обновить
        </button>
      </div>
      <p className="muted">
        Состояние публикаций по группам вашего факультета.
      </p>
      <label className="faculty-group">
        Группа
        <select
          value={group}
          onChange={(event) =>
            setParams(
              event.target.value ? { group_id: event.target.value } : {},
            )
          }
        >
          <option value="">Все свои группы</option>
          {groups.data?.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </label>
      <ErrorBox error={error || groups.error} />
      {!data && !error && <p role="status">Загружаем сводку…</p>}
      {data?.subjects.length === 0 && (
        <p>В этой группе ещё нет контрольных записей.</p>
      )}
      {!!data?.subjects.length && (
        <>
          <table className="results-table">
            <caption className="sr-only">
              Сводка успеваемости факультета
            </caption>
            <thead>
              <tr>
                <th scope="col">Дисциплина</th>
                <th scope="col">Группа</th>
                <th scope="col">Семестр</th>
                <th scope="col">Контроль</th>
                <th scope="col">Опубликовано</th>
                <th scope="col">Ожидается</th>
              </tr>
            </thead>
            <tbody>
              {data.subjects.map((row) => (
                <tr
                  key={`${row.group_id}-${row.semester}-${row.kind}-${row.subject}`}
                >
                  <th scope="row">{row.subject}</th>
                  <td>{row.group}</td>
                  <td>{row.semester}</td>
                  <td>{row.kind === "credit" ? "Зачёт" : "Экзамен"}</td>
                  <td>
                    {row.published} из {row.total}
                  </td>
                  <td>{row.awaiting}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="result-cards">
            {data.subjects.map((row) => (
              <article
                key={`${row.group_id}-${row.semester}-${row.kind}-${row.subject}`}
              >
                <h3>{row.subject}</h3>
                <p>
                  {row.group} · {row.semester} семестр ·{" "}
                  {row.kind === "credit" ? "Зачёт" : "Экзамен"}
                </p>
                <p>
                  Опубликовано {row.published} из {row.total} · ожидается{" "}
                  {row.awaiting}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
