import { Menu } from "@base-ui/react/menu";
import { CaretDown, DotsThree, EnvelopeSimple, Users } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { ErrorBox, useResource } from "./ui";

type TeacherContact = {
  id: number;
  full_name: string;
  subjects: string[];
  work_email: string | null;
};

export function AdditionalMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger
        className="additional-trigger"
        aria-label="Дополнительно"
        title="Дополнительно"
      >
        <DotsThree size={22} weight="bold" aria-hidden="true" />
        <span className="additional-text">Дополнительно</span>
        <span className="additional-short" aria-hidden="true">Ещё</span>
        <CaretDown size={12} className="additional-caret" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="additional-positioner" align="end" sideOffset={8}>
          <Menu.Popup className="additional-menu" aria-label="Дополнительно">
            <Menu.LinkItem render={<Link to="/teachers" />} closeOnClick>
              <Users size={19} aria-hidden="true" /> Преподаватели
            </Menu.LinkItem>
            <Menu.LinkItem render={<Link to="/requests/new?kind=dean_message" />} closeOnClick>
              <EnvelopeSimple size={19} aria-hidden="true" /> Написать в деканат
            </Menu.LinkItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function TeacherDirectory() {
  const { data, error, reload } = useResource<TeacherContact[]>("/teachers");
  return (
    <section aria-labelledby="teacher-directory-title">
      <div className="section-heading directory-heading">
        <div>
          <h2 id="teacher-directory-title">Преподаватели моей группы</h2>
          <p className="muted">Дисциплины и рабочие адреса по расписанию группы.</p>
        </div>
      </div>
      <ErrorBox error={error} />
      {error && <button className="secondary" onClick={reload}>Повторить</button>}
      {!data && !error && <p role="status">Загружаем преподавателей…</p>}
      {data?.length === 0 && <p className="panel">В расписании группы пока нет преподавателей.</p>}
      {data && data.length > 0 && (
        <ul className="faculty-directory">
          {data.map((teacher) => (
            <li className="panel teacher-contact" key={teacher.id}>
              <h3>{teacher.full_name}</h3>
              <p>{teacher.subjects.join(" · ")}</p>
              <p className="teacher-email">
                <EnvelopeSimple size={19} aria-hidden="true" />
                <span>{teacher.work_email ?? "Рабочая почта не указана"}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
