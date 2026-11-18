import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  X,
} from "@phosphor-icons/react";
import type { AcademicPayload } from "./study-types";
import { campusDay, campusTime, dayLabel } from "./study-dates";

const pages = ["Прогресс", "Результаты", "Контрольные даты"];

export function SemesterStories({ data }: { data: AcademicPayload }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("session-expired", close);
    return () => window.removeEventListener("session-expired", close);
  }, []);
  if (!data.results.length) return null;

  const published = data.results.filter((row) => row.status === "published");
  const upcoming = data.results.filter(
    (row) =>
      row.status === "upcoming" && campusDay(row.control_at) >= data.as_of,
  );
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setStep(0);
          setAnimate(false);
        }
        setOpen(next);
      }}
    >
      <section
        className="semester-invite"
        aria-labelledby="semester-invite-title"
      >
        <BookOpen size={24} aria-hidden="true" />
        <h2 id="semester-invite-title">Итоги семестра</h2>
        <p>
          {data.semester} семестр · {data.summary.closed} из{" "}
          {data.summary.total} закрыто
        </p>
        <Dialog.Trigger className="primary">
          Смотреть итоги <ArrowRight size={18} aria-hidden="true" />
        </Dialog.Trigger>
      </section>
      <Dialog.Portal>
        <Dialog.Backdrop className="news-dialog-backdrop" />
        <Dialog.Viewport className="news-dialog-viewport semester-viewport">
          <Dialog.Popup
            className="semester-dialog"
            onKeyDown={(event) => {
              if (event.altKey || event.ctrlKey || event.metaKey) return;
              if (event.key === "ArrowRight" || event.key === "ArrowLeft")
                setAnimate(false);
              if (event.key === "ArrowRight")
                setStep((index) => Math.min(index + 1, pages.length - 1));
              if (event.key === "ArrowLeft")
                setStep((index) => Math.max(index - 1, 0));
            }}
          >
            <header className="story-chrome">
              <span>{data.semester} семестр</span>
              <Dialog.Close className="story-close" aria-label="Закрыть итоги">
                <X size={21} aria-hidden="true" />
              </Dialog.Close>
            </header>
            <div className="story-progress" aria-hidden="true">
              {pages.map((page, index) => (
                <span key={page} data-active={index <= step || undefined} />
              ))}
            </div>
            <p className="story-count" role="status">
              Шаг {step + 1} из {pages.length} · {pages[step]}
            </p>
            <div
              className="story-body"
              key={step}
              data-enter={animate || undefined}
            >
              <Dialog.Title>
                {
                  ["Итоги семестра", "Опубликованные результаты", "Что дальше"][
                    step
                  ]
                }
              </Dialog.Title>
              {step === 0 && (
                <>
                  <p className="story-stat">
                    <strong>{data.summary.closed}</strong>{" "}
                    <span>из {data.summary.total}</span>
                  </p>
                  <p className="story-subtitle">Дисциплины закрыты</p>
                  <p>
                    На {dayLabel(data.as_of, true)}
                    {data.summary.awaiting
                      ? ` · ожидается: ${data.summary.awaiting}`
                      : ""}
                  </p>
                </>
              )}
              {step === 1 &&
                (published.length ? (
                  <ul className="story-results">
                    {published.map((row) => (
                      <li key={row.id}>
                        <span>{row.subject}</span>
                        <strong>{row.label}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Опубликованных результатов за этот семестр пока нет.</p>
                ))}
              {step === 2 &&
                (upcoming.length ? (
                  <ul className="story-results">
                    {upcoming.map((row) => (
                      <li key={row.id}>
                        <span>
                          {row.subject}
                          <small>
                            {row.kind === "credit" ? "Зачёт" : "Экзамен"}
                          </small>
                        </span>
                        <strong>
                          {dayLabel(campusDay(row.control_at), true)} ·{" "}
                          {campusTime(row.control_at)}
                        </strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    {data.session_period
                      ? `Последняя контрольная дата — ${dayLabel(data.session_period.end)}.`
                      : "В этом семестре нет предстоящих контрольных дат."}
                  </p>
                ))}
            </div>
            <footer className="story-controls">
              <button
                type="button"
                className="story-back"
                disabled={step === 0}
                onClick={(event) => {
                  setAnimate(event.detail > 0);
                  setStep(step - 1);
                }}
              >
                <ArrowLeft size={18} aria-hidden="true" /> Назад
              </button>
              {step < pages.length - 1 ? (
                <button
                  type="button"
                  className="story-next"
                  onClick={(event) => {
                    setAnimate(event.detail > 0);
                    setStep(step + 1);
                  }}
                >
                  Далее <ArrowRight size={18} aria-hidden="true" />
                </button>
              ) : (
                <Dialog.Close className="story-next">
                  К оценкам <CheckCircle size={18} aria-hidden="true" />
                </Dialog.Close>
              )}
            </footer>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
