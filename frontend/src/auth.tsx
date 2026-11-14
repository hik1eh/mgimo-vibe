import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeSlash,
  LockKey,
  Pause,
  Play,
} from "@phosphor-icons/react";
import { signIn, type User } from "./api";
import { ErrorBox } from "./ui";
import { AUTH_MOTION } from "./auth-motion";
import campusExterior from "./assets/campus-exterior.webp";
import campusLibrary from "./assets/campus-library.webp";
import campusAtrium from "./assets/campus-atrium.webp";
import authLight from "./assets/auth-light.webp";
import "./auth.css";

const TypeFace = lazy(() => import("./type-face"));
const campus = [
  {
    image: campusExterior,
    title: "Место для больших идей",
    detail: "Северный кампус",
    alt: "Светлый корпус вымышленного университета с колоннадой и берёзовой аллеей",
  },
  {
    image: campusLibrary,
    title: "Пространство для открытий",
    detail: "Университетская библиотека",
    alt: "Читальный зал вымышленного кампуса: каменные арки, книжные полки и синие кресла",
  },
  {
    image: campusAtrium,
    title: "Всё начинается здесь",
    detail: "Главный атриум",
    alt: "Светлый атриум вымышленного университета с галереями и лестницами",
  },
];

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function CampusCarousel({
  running,
  onHold,
  onSelect,
  reset,
  reduced,
}: {
  running: boolean;
  onHold: (value: boolean) => void;
  onSelect: () => void;
  reset: number;
  reduced: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => setSelected(null), [reset]);
  const choose = (index: number) => {
    setSelected((index + campus.length) % campus.length);
    onSelect();
  };
  const current = selected ?? 1;
  return (
    <section
      className="auth-carousel"
      aria-label="Фотографии Северного кампуса"
      aria-roledescription="карусель"
      onMouseEnter={() => onHold(true)}
      onMouseLeave={() => onHold(false)}
      onFocus={() => onHold(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onHold(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          choose(current + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
    >
      <div
        className="auth-photo-stage"
        data-manual={selected !== null || reduced ? "true" : undefined}
        data-running={running ? "true" : "false"}
      >
        {campus.map((photo, index) => {
          const offset =
            ((index - current + campus.length + 1) % campus.length) - 1;
          return (
            <figure
              className="auth-photo-card"
              key={photo.image}
              data-offset={offset}
              aria-label={`${index + 1} из ${campus.length}: ${photo.detail}`}
              style={
                {
                  "--card-phase": `${(-index * AUTH_MOTION.carouselLoopSeconds) / campus.length}s`,
                } as CSSProperties
              }
            >
              <img
                src={photo.image}
                alt={photo.alt}
                width="1536"
                height="1024"
                decoding="async"
              />
              <figcaption>
                <span>{photo.detail}</span>
                <strong>{photo.title}</strong>
                <span className="auth-photo-number">0{index + 1}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
      <div className="auth-carousel-controls">
        <button
          type="button"
          className="auth-icon-button"
          aria-label="Предыдущее фото"
          onClick={() => choose(current - 1)}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="auth-photo-index" aria-label="Выбор фотографии">
          {campus.map((photo, index) => (
            <button
              type="button"
              key={photo.image}
              aria-label={`Показать фото: ${photo.detail}`}
              aria-pressed={selected === index}
              onClick={() => choose(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="auth-icon-button"
          aria-label="Следующее фото"
          onClick={() => choose(current + 1)}
        >
          <ArrowRight size={18} />
        </button>
      </div>
      <p className="auth-image-note">Образы вымышленного кампуса</p>
    </section>
  );
}

function CampusScene({ reduced }: { reduced: boolean }) {
  const scene = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false),
    [hold, setHold] = useState(false),
    [reset, setReset] = useState(0);
  const [visible, setVisible] = useState(
    document.visibilityState === "visible",
  );
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    if (scene.current) observer.observe(scene.current);
    return () => observer.disconnect();
  }, []);
  const running = !paused && !hold && !reduced && visible && inView;
  return (
    <section
      ref={scene}
      className="auth-scene"
      aria-label="Университет Северного кампуса"
      data-running={running}
      style={
        {
          "--auth-carousel-cycle": `${AUTH_MOTION.carouselLoopSeconds}s`,
        } as CSSProperties
      }
    >
      <div className="auth-scene-top">
        <a className="auth-brand" href="#auth-form">
          <span className="auth-brand-mark">СК</span>
          <span>
            Университет
            <br />
            Северного кампуса
          </span>
        </a>
        <span className="auth-scene-label">ТВОЯ ТОЧКА РОСТА</span>
      </div>
      <div className="auth-scene-content">
        <div className="auth-portrait">
          <div className="auth-portrait-label">
            <span /> ЗНАНИЯ ОБРЕТАЮТ ФОРМУ
          </div>
          <div
            className="auth-portrait-model"
            role="img"
            aria-label="Вращающаяся трёхмерная голова из строк University North Campus"
          >
            <Suspense
              fallback={
                <div className="auth-type-fallback">
                  University
                  <br />
                  North
                  <br />
                  <em>Campus.</em>
                </div>
              }
            >
              <TypeFace running={running} reduced={reduced} />
            </Suspense>
          </div>
          <p className="auth-portrait-caption">
            University
            <br />
            <em>North Campus.</em>
          </p>
        </div>
        <CampusCarousel
          running={running}
          reduced={reduced}
          onHold={setHold}
          onSelect={() => setPaused(true)}
          reset={reset}
        />
      </div>
      <div className="auth-scene-bottom">
        <p>
          Ближе к знаниям.
          <br />
          <span>Ближе друг к другу.</span>
        </p>
        <button
          type="button"
          className="auth-motion-toggle"
          disabled={reduced}
          aria-label={
            paused
              ? "Продолжить анимацию сцены"
              : "Приостановить анимацию сцены"
          }
          aria-pressed={paused || reduced}
          onClick={() => {
            if (paused) setReset((value) => value + 1);
            setPaused(!paused);
          }}
        >
          {paused || reduced ? (
            <Play size={16} weight="fill" />
          ) : (
            <Pause size={16} weight="fill" />
          )}
          <span>
            {reduced ? "Без движения" : paused ? "Продолжить" : "Пауза"}
          </span>
        </button>
      </div>
    </section>
  );
}

export function Login({
  onLogin,
  expired = false,
}: {
  onLogin: (user: User) => void;
  expired?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [login, setLogin] = useState(""),
    [password, setPassword] = useState("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState<"login" | "password" | "none">(
    "none",
  );
  const desktop = useMedia("(min-width: 1000px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  useEffect(() => {
    if (expired)
      container.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [expired]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const user = await signIn(login, password);
      setPassword("");
      onLogin(user);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      ref={container}
      className={expired ? "session-overlay auth-overlay" : "auth-page"}
      role={expired ? "dialog" : "main"}
      aria-modal={expired ? true : undefined}
      aria-labelledby="login-title"
      onKeyDown={(event) => {
        if (!expired || event.key !== "Tab") return;
        const fields = Array.from(
          container.current?.querySelectorAll<HTMLElement>(
            "input,button:not(:disabled),a[href]",
          ) || [],
        );
        const first = fields[0],
          last = fields.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className="auth-shell">
        {!expired && desktop && <CampusScene reduced={reduced} />}
        <AuthPanel
          state={{
            login,
            password,
            error,
            busy,
            showPassword,
            activeField,
            expired,
            desktop,
          }}
          setLogin={setLogin}
          setPassword={setPassword}
          setShowPassword={setShowPassword}
          setActiveField={setActiveField}
          submit={submit}
        />
      </div>
    </div>
  );
}

export type AuthPanelState = {
  login: string;
  password: string;
  error: string;
  busy: boolean;
  showPassword: boolean;
  activeField: "login" | "password" | "none";
  expired: boolean;
  desktop: boolean;
};

// Controlled presentation: the same panel is used for initial and expired-session login.
export function AuthPanel({
  state,
  setLogin,
  setPassword,
  setShowPassword,
  setActiveField,
  submit,
}: {
  state: AuthPanelState;
  setLogin: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  setActiveField: (value: AuthPanelState["activeField"]) => void;
  submit: (event: FormEvent) => void;
}) {
  const {
    login,
    password,
    error,
    busy,
    showPassword,
    activeField,
    expired,
    desktop,
  } = state;
  const heading = expired ? "Войдите снова" : "С возвращением.";
  return (
    <section
      className="auth-panel"
      id="auth-form"
      data-expired={expired || undefined}
    >
      <div className="auth-panel-top">
        <span className="auth-product-name">Цифровой деканат</span>
        <span className="auth-access-label">
          <LockKey size={13} /> Единый вход
        </span>
      </div>
      <div
        className="auth-login-content"
        data-active-field={activeField}
        data-error={Boolean(error)}
        style={
          desktop
            ? ({ "--auth-light-image": `url(${authLight})` } as CSSProperties)
            : undefined
        }
      >
        <div className="auth-lights" aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="auth-mobile-brand">
          <span className="auth-brand-mark">СК</span>
          <span>
            Университет
            <br />
            Северного кампуса
          </span>
        </div>
        <span className="auth-kicker">ЛИЧНЫЙ КАБИНЕТ</span>
        <h1 id="login-title">{heading}</h1>
        <p className="auth-description">
          {expired
            ? "Сессия завершена. Войдите, чтобы продолжить с того же места."
            : "Расписание, результаты и связь с деканатом — в одном месте."}
        </p>
        <form
          onSubmit={submit}
          aria-busy={busy}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setActiveField("none");
          }}
        >
          <label className="auth-field" data-field="login">
            <span>Логин</span>
            <input
              required
              autoComplete="username"
              aria-describedby={error ? "auth-error" : undefined}
              name="username"
              autoCapitalize="none"
              spellCheck={false}
              value={login}
              placeholder="Ваш логин"
              maxLength={80}
              onFocus={() => setActiveField("login")}
              onChange={(event) => setLogin(event.target.value)}
            />
          </label>
          <div className="auth-field" data-field="password">
            <label htmlFor="auth-password">Пароль</label>
            <span className="auth-password-wrap">
              <input
                id="auth-password"
                required
                autoComplete="current-password"
                name="password"
                type={showPassword ? "text" : "password"}
                aria-describedby={error ? "auth-error" : undefined}
                value={password}
                placeholder="Введите пароль"
                maxLength={200}
                onFocus={() => setActiveField("password")}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={showPassword}
                onFocus={() => setActiveField("password")}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </span>
          </div>
          {error && (
            <div id="auth-error">
              <ErrorBox error={error} />
            </div>
          )}
          <button type="submit" className="primary auth-submit" disabled={busy}>
            <span>{busy ? "Входим…" : "Войти в кабинет"}</span>
            {busy ? (
              <span className="auth-spinner" aria-hidden="true" />
            ) : (
              <ArrowRight size={20} aria-hidden="true" />
            )}
          </button>
        </form>
        <p className="auth-credentials-note">
          <LockKey size={15} /> Используйте доступ, выданный командой проекта.
        </p>
      </div>
      <div className="auth-panel-bottom">
        <span>Конкурсный прототип</span>
        <p>
          Все данные вымышлены.
          <br />
          Демодоступы передаются отдельно.
        </p>
      </div>
    </section>
  );
}
