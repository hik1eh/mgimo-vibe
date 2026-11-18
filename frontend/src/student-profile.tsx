import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CaretDown,
  EnvelopeSimple,
  Phone,
  PencilSimple,
} from "@phosphor-icons/react";
import { api, ApiError, type User } from "./api";
import { ErrorBox } from "./ui";

function ContactForm({
  user,
  onSave,
  onCancel,
}: {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState(user.contact_email || "");
  const [phone, setPhone] = useState(user.contact_phone || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const emailInput = useRef<HTMLInputElement>(null);
  useEffect(() => emailInput.current?.focus(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFields({});
    setError("");
    try {
      const updated = await api<User>("/me/contacts", "PATCH", {
        contact_email: email.trim() || null,
        contact_phone: phone.trim() || null,
      });
      onSave(updated);
    } catch (failure) {
      if (failure instanceof ApiError && Object.keys(failure.fields).length) {
        setFields(failure.fields);
        const invalid = failure.fields.contact_email
          ? "contact-email"
          : "contact-phone";
        document.getElementById(invalid)?.focus();
      } else {
        setError((failure as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <h3>Редактировать контакты</h3>
      <label htmlFor="contact-email">Электронная почта</label>
      <input
        ref={emailInput}
        id="contact-email"
        type="email"
        autoComplete="email"
        maxLength={254}
        value={email}
        aria-invalid={Boolean(fields.contact_email)}
        aria-describedby={fields.contact_email ? "email-error" : undefined}
        onChange={(event) => setEmail(event.target.value)}
      />
      {fields.contact_email && (
        <p className="field-error" id="email-error" role="alert">
          {fields.contact_email}
        </p>
      )}
      <label htmlFor="contact-phone">Телефон</label>
      <input
        id="contact-phone"
        type="tel"
        autoComplete="tel"
        maxLength={32}
        value={phone}
        aria-invalid={Boolean(fields.contact_phone)}
        aria-describedby={fields.contact_phone ? "phone-error" : undefined}
        onChange={(event) => setPhone(event.target.value)}
      />
      {fields.contact_phone && (
        <p className="field-error" id="phone-error" role="alert">
          {fields.contact_phone}
        </p>
      )}
      <ErrorBox error={error} />
      <div className="inline-actions">
        <button type="submit" className="primary" disabled={busy}>
          {busy ? "Сохраняем…" : "Сохранить"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

export function StudentProfile({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: (user: User) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [animate, setAnimate] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (wasEditing.current && !editing)
      editButton.current?.focus({ preventScroll: true });
    wasEditing.current = editing;
  }, [editing]);
  const initials = user.full_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  const fields = [
    ["ФИО", user.full_name],
    ["ВУЗ", user.university],
    ["Курс", user.course],
    ["Группа", user.group],
    ["Возраст", user.age],
    ["Логин", user.login],
    ["Факультет", user.faculty],
    ["Направление", user.direction],
    ["Форма обучения", user.study_mode],
    ["№ студенческого", user.student_card_number],
  ] as const;

  return (
    <div
      className="student-badge-layout"
      data-expanded={expanded || undefined}
      data-motion={animate || undefined}
    >
      <section className="badge-column" aria-label="Студенческий пропуск">
        <div className="badge-lanyard" aria-hidden="true">
          <i />
          <b />
        </div>
        <div className="id-card">
          <div className="id-card-brand">
            <span>СК</span>
            <small>
              Университет
              <br />
              Северного кампуса
            </small>
          </div>
          <div className="id-card-main">
            <div className="id-card-avatar" aria-hidden="true">
              {initials}
            </div>
            <h2>{user.full_name}</h2>
            <p>{user.course} курс</p>
            <strong className="id-card-group">{user.group}</strong>
          </div>
        </div>
        <button
          type="button"
          className="primary badge-disclosure"
          aria-expanded={expanded}
          aria-controls="student-data"
          onClick={(event) => {
            setAnimate(event.detail > 0);
            setExpanded(!expanded);
          }}
        >
          Данные студента <CaretDown aria-hidden="true" size={18} />
        </button>
      </section>
      <section
        className="panel badge-details"
        id="student-data"
        hidden={!expanded}
        data-enter={animate || undefined}
      >
        <div className="profile-study-fields">
          <dl>
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value ?? "Не указано"}</dd>
              </div>
            ))}
          </dl>
        </div>
        {editing ? (
          <ContactForm
            user={user}
            onCancel={() => setEditing(false)}
            onSave={(updated) => {
              onUpdate(updated);
              setEditing(false);
              setSaved(true);
            }}
          />
        ) : (
          <section className="profile-contact-summary">
            <h3>Контакты</h3>
            <dl>
              <dt>
                <EnvelopeSimple aria-hidden="true" /> Электронная почта
              </dt>
              <dd>{user.contact_email || "Не указана"}</dd>
              <dt>
                <Phone aria-hidden="true" /> Телефон
              </dt>
              <dd>{user.contact_phone || "Не указан"}</dd>
            </dl>
            {saved && (
              <p className="success" role="status">
                Контакты сохранены.
              </p>
            )}
            <button
              ref={editButton}
              className="secondary"
              onClick={() => {
                setSaved(false);
                setEditing(true);
              }}
            >
              <PencilSimple size={18} aria-hidden="true" /> Редактировать
              контакты
            </button>
          </section>
        )}
      </section>
    </div>
  );
}
