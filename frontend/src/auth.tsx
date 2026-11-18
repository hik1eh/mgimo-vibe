import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { Eye, EyeSlash, LockKey } from "@phosphor-icons/react";
import { signIn, type User } from "./api";
import { ErrorBox } from "./ui";
import { AUTH_MOTION } from "./auth-motion";
import { CampusObject } from "./campus-object";
import campusExterior from "./assets/campus-exterior.webp";
import campusLibrary from "./assets/campus-library.webp";
import campusAtrium from "./assets/campus-atrium.webp";
import campusStudyGroup from "./assets/campus-study-group.webp";
import campusComputerLab from "./assets/campus-computer-lab.webp";
import campusSeminar from "./assets/campus-seminar.webp";
import campusCafe from "./assets/campus-cafe.webp";
import authLight from "./assets/auth-light.webp";
import "./auth.css";

const campus = [
  {
    image: campusExterior,
    title: "Место для больших идей",
    detail: "Северный кампус",
    alt: "Светлый корпус вымышленного университета с колоннадой и берёзовой аллеей",
  },
  {
    image: campusStudyGroup,
    detail: "Совместная учёба",
    alt: "Трое вымышленных взрослых студентов обсуждают учебный проект в светлой библиотеке кампуса",
  },
  {
    image: campusLibrary,
    title: "Пространство для открытий",
    detail: "Университетская библиотека",
    alt: "Читальный зал вымышленного кампуса: каменные арки, книжные полки и синие кресла",
  },
  {
    image: campusComputerLab,
    detail: "Компьютерная лаборатория",
    alt: "Двое вымышленных взрослых студентов работают над проектом в компьютерной лаборатории университета",
  },
  {
    image: campusAtrium,
    title: "Всё начинается здесь",
    detail: "Главный атриум",
    alt: "Светлый атриум вымышленного университета с галереями и лестницами",
  },
  {
    image: campusSeminar,
    detail: "Учебный семинар",
    alt: "Вымышленные взрослые студенты обсуждают идеи на семинаре в светлой университетской аудитории",
  },
  {
    image: campusCafe,
    detail: "Университетское кафе",
    alt: "Четверо вымышленных взрослых студентов общаются за кофе в университетском атриуме",
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
  reduced,
}: {
  running: boolean;
  reduced: boolean;
}) {
  const [photoIndexes, setPhotoIndexes] = useState([0, 1, 2, 3]);
  const currentIndexes = useRef(photoIndexes);
  const nextPhoto = useRef(4);
  const preloaded = useRef<HTMLImageElement[]>([]);
  useEffect(() => {
    preloaded.current = campus.map((photo) => {
      const image = new Image();
      image.src = photo.image;
      void image.decode().catch(() => {});
      return image;
    });
    return () => {
      preloaded.current = [];
    };
  }, []);
  function advancePhoto(slot: number) {
    for (let offset = 0; offset < campus.length; offset++) {
      const candidate = (nextPhoto.current + offset) % campus.length;
      const image = preloaded.current[candidate];
      if (
        currentIndexes.current.includes(candidate) ||
        !image?.complete ||
        !image.naturalWidth
      )
        continue;
      const updated = currentIndexes.current.map((index, position) =>
        position === slot ? candidate : index,
      );
      currentIndexes.current = updated;
      nextPhoto.current = (candidate + 1) % campus.length;
      setPhotoIndexes(updated);
      return;
    }
  }
  return (
    <section className="auth-carousel" aria-label={campus[0].detail}>
      <div
        className="auth-photo-stage"
        data-reduced={reduced || undefined}
        data-running={running}
      >
        {photoIndexes.map((photoIndex, index) => {
          const photo = campus[photoIndex];
          return (
            <figure
              className="auth-photo-card"
              key={index}
              data-index={index}
              onAnimationIteration={(event) => {
                if (event.target === event.currentTarget) advancePhoto(index);
              }}
              style={
                {
                  "--card-phase": `${(-index * AUTH_MOTION.carouselLoopSeconds) / photoIndexes.length}s`,
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
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function CampusScene({ reduced }: { reduced: boolean }) {
  const scene = useRef<HTMLElement>(null);
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
  const running = !reduced && visible && inView;
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
      </div>
      <div className="auth-script" aria-hidden="true">
        <span>University</span>
        <span>North</span>
        <span>Campus</span>
      </div>
      <div className="auth-scene-content">
        <div className="auth-portrait">
          <div className="auth-portrait-model">
            <CampusObject kind="campus" animated={!reduced} />
          </div>
        </div>
        <CampusCarousel running={running} reduced={reduced} />
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
  const cardRef = useRef<HTMLDivElement>(null);
  const illuminated = activeField === "none" && error ? "login" : activeField;
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !desktop) return;
    const measure = () => {
      const input = card.querySelector<HTMLInputElement>(
        `[data-field="${illuminated === "none" ? "login" : illuminated}"] input`,
      );
      if (!input) return;
      const box = card.getBoundingClientRect();
      const field = input.getBoundingClientRect();
      const style = getComputedStyle(card);
      const inset = parseFloat(style.getPropertyValue("--auth-light-inset"));
      const length = parseFloat(style.getPropertyValue("--auth-beam-length"));
      const focus = parseFloat(style.getPropertyValue("--auth-beam-focus"));
      const targetY = field.top - box.top + field.height / 2;
      for (const [side, originX, fraction] of [
        ["left", inset, 0.22],
        ["right", box.width - inset, 0.78],
      ] as const) {
        const dx = field.left - box.left + field.width * fraction - originX;
        const dy = targetY - inset;
        card.style.setProperty(
          `--beam-${side}-angle`,
          `${(-Math.atan2(dx, dy) * 180) / Math.PI}deg`,
        );
        card.style.setProperty(
          `--beam-${side}-scale`,
          String(Math.hypot(dx, dy) / (length * focus)),
        );
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, [illuminated, desktop]);
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
        ref={cardRef}
        className="auth-login-content"
        data-active-field={activeField}
        data-illuminated={illuminated}
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
          {!desktop && !expired && (
            <div className="auth-mobile-object">
              <CampusObject kind="campus" />
            </div>
          )}
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
            {busy ? <span className="auth-spinner" aria-hidden="true" /> : null}
          </button>
        </form>
        <p className="auth-credentials-note">
          <LockKey size={15} /> Используйте доступ, выданный командой проекта.
        </p>
      </div>
      <footer className="auth-panel-bottom">
        <p>Конкурсный прототип. Все данные вымышлены.</p>
        <p>Демодоступы передаются отдельно.</p>
      </footer>
    </section>
  );
}
