import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import { api, ApiError, refreshCsrf, type User, type Notice } from "./api";
import { Login } from "./auth";
import "./tokens.css";
import "./style.css";
import { ErrorBox, useResource } from "./ui";
import { SchedulePage, LessonPage, ResultsPage } from "./study";
import {
  TodayPage,
  AnnouncementsPage,
  AnnouncementPage,
  StudentAccount,
} from "./campus";
import {
  StaffSchedulePage,
  StaffLessonPage,
  StaffAnnouncementsPage,
  StaffAnnouncementPage,
} from "./staff";
import "./campus.css";
import "./polish.css";
import { SignOut } from "@phosphor-icons/react";
import { SectionBanner } from "./section-banner";
import "./cabinet-header.css";
import "./premium.css";
import "./student-redesign.css";
import "./final-mvp.css";
import { StudentProfile } from "./student-profile";
import { LessonRoutePage } from "./lesson-route";
import { RequestWorkspace, NewRequest } from "./requests";
import { Notifications } from "./notifications";
import { StaffResultsPage } from "./staff-results";

function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById("main")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function StaffProfile({ user }: { user: User }) {
  return (
    <>
      <section className="panel profile">
        <div className="avatar">
          {user.full_name
            .split(" ")
            .map((p) => p[0])
            .join("")}
        </div>
        <div>
          <h2>{user.full_name}</h2>
          <p className="muted">Сотрудник деканата</p>
          <dl>
            <dt>Факультет</dt>
            <dd>{user.faculty}</dd>
            <dt>Логин</dt>
            <dd>{user.login}</dd>
          </dl>
        </div>
      </section>
    </>
  );
}

function Cabinet({
  user,
  onLogout,
  onUserUpdate,
}: {
  user: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}) {
  const { pathname } = useLocation();
  const [error, setError] = useState("");
  const [input, setInput] = useState("pointer");
  const staff = user.role === "staff";
  const notices = useResource<Notice[]>(staff ? null : "/notifications", true);
  const unread = notices.data?.filter((item) => !item.read).length ?? 0;
  async function logout() {
    try {
      await api("/auth/logout", "POST");
      onLogout();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div
      className="cabinet-app"
      data-role={user.role}
      data-student-screen={
        !staff && (pathname === "/today" || pathname === "/schedule")
          ? pathname.slice(1)
          : undefined
      }
      data-input={input}
      onKeyDownCapture={() => setInput("keyboard")}
      onPointerDownCapture={() => setInput("pointer")}
    >
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <header
        className={`cabinet-header ${staff ? "staff-header" : "student-header"}`}
      >
        <Link
          className="brand"
          to={staff ? "/requests" : "/today"}
          aria-label="Цифровой деканат. Университет Северного кампуса"
        >
          <span className="brand-mark">СК</span>
          <span className="brand-title">
            Цифровой
            <br />
            <strong>деканат</strong>
          </span>
          <span className="brand-university">
            Университет
            <br />
            Северного кампуса
          </span>
        </Link>
        <nav
          className={staff ? "staff-nav" : "student-nav"}
          aria-label="Основная навигация"
        >
          {!staff && (
            <>
              <NavLink to="/today">Сегодня</NavLink>
              <NavLink to="/schedule">Расписание</NavLink>
              <NavLink to="/academic-results">Оценки</NavLink>
            </>
          )}
          <NavLink to="/requests">Заявки</NavLink>
          {staff && (
            <>
              <NavLink to="/staff/announcements">Объявления</NavLink>
              <NavLink to="/staff/schedule">Расписание</NavLink>
              <NavLink to="/staff/academic-results">Оценки</NavLink>
              <NavLink to="/profile">Профиль</NavLink>
            </>
          )}
        </nav>
        <div className="header-user">
          {staff ? (
            <span>
              {user.full_name}
              <small>Сотрудник</small>
            </span>
          ) : (
            <StudentAccount unread={unread} />
          )}
          <button
            className="logout"
            onClick={logout}
            aria-label="Выйти"
            title="Выйти"
          >
            <SignOut size={22} aria-hidden="true" />
          </button>
        </div>
      </header>
      <main id="main" className="cabinet-main" tabIndex={-1}>
        <RouteFocus />
        <SectionBanner
          staff={staff}
          faculty={user.faculty}
          keyboard={input === "keyboard"}
        />
        <div className="cabinet-content">
          <ErrorBox error={error} />
          <Routes>
            {!staff && (
              <>
                <Route path="/today" element={<TodayPage user={user} />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route
                  path="/announcements/:id"
                  element={<AnnouncementPage />}
                />
                <Route
                  path="/schedule"
                  element={<SchedulePage user={user} />}
                />
                <Route path="/schedule/:id" element={<LessonPage />} />
                <Route
                  path="/schedule/:id/route"
                  element={<LessonRoutePage />}
                />
                <Route path="/academic-results" element={<ResultsPage />} />
              </>
            )}
            {staff && (
              <>
                <Route path="/staff/schedule" element={<StaffSchedulePage />} />
                <Route
                  path="/staff/academic-results"
                  element={<StaffResultsPage />}
                />
                <Route
                  path="/staff/schedule/:id"
                  element={<StaffLessonPage user={user} />}
                />
                <Route
                  path="/staff/announcements"
                  element={<StaffAnnouncementsPage />}
                />
                <Route
                  path="/staff/announcements/new"
                  element={
                    <StaffAnnouncementPage
                      key="new-announcement"
                      create
                      user={user}
                    />
                  }
                />
                <Route
                  path="/staff/announcements/:id"
                  element={<StaffAnnouncementPage user={user} />}
                />
              </>
            )}
            <Route
              path="/profile"
              element={
                staff ? (
                  <StaffProfile user={user} />
                ) : (
                  <StudentProfile user={user} onUpdate={onUserUpdate} />
                )
              }
            />
            <Route
              path="/requests"
              element={<RequestWorkspace user={user} />}
            />
            <Route
              path="/requests/new"
              element={
                staff ? (
                  <Navigate to="/requests" replace />
                ) : (
                  <NewRequest user={user} />
                )
              }
            />
            <Route
              path="/requests/:id"
              element={<RequestWorkspace user={user} />}
            />
            {!staff && (
              <Route
                path="/notifications"
                element={<Notifications resource={notices} />}
              />
            )}
            <Route
              path="*"
              element={<Navigate to={staff ? "/requests" : "/today"} replace />}
            />
          </Routes>
        </div>
      </main>
      <div className="prototype-bar">
        Конкурсный прототип{" "}
        <span>· Университет, профили и документы вымышлены</span>
      </div>
      <footer className={staff ? "" : "student-footer"}>
        <span>Университет Северного кампуса</span>
        <span>Цифровой деканат</span>
      </footer>
    </div>
  );
}
function App() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [expired, setExpired] = useState(false);
  async function boot() {
    setError("");
    setLoading(true);
    try {
      await refreshCsrf();
      setUser(await api<User>("/me"));
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401))
        setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void boot();
    const expire = () => setExpired(true);
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  if (loading)
    return (
      <div className="boot" role="status">
        Открываем цифровой деканат…
      </div>
    );
  if (error)
    return (
      <div className="boot">
        <ErrorBox error={error} />
        <button className="primary" onClick={boot}>
          Повторить
        </button>
      </div>
    );
  const loggedIn = (u: User) => {
    setUser(u);
    setExpired(false);
    window.dispatchEvent(new Event("session-restored"));
  };
  return user ? (
    <>
      <div inert={expired}>
        <Cabinet
          key={user.id}
          user={user}
          onUserUpdate={setUser}
          onLogout={() => {
            setUser(null);
            setExpired(false);
            sessionStorage.clear();
          }}
        />
      </div>
      {expired && <Login expired onLogin={loggedIn} />}
    </>
  ) : (
    <Login onLogin={loggedIn} />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
