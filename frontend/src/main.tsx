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
import { AdditionalMenu, TeacherDirectory } from "./teachers";
import { TeachingJournal, TeachingPage } from "./teaching";
import "./additional.css";

function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById("main")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function EmployeeProfile({ user }: { user: User }) {
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
          <p className="muted">{user.role === "teacher" ? "Преподаватель" : "Сотрудник деканата"}</p>
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
  const teacher = user.role === "teacher";
  const student = user.role === "student";
  const dashboard = staff ? "/requests" : teacher ? "/teaching" : "/today";
  const notices = useResource<Notice[]>(student ? "/notifications" : null, true);
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
        student && (pathname === "/today" || pathname === "/schedule")
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
        className={`cabinet-header ${student ? "student-header" : "staff-header"}`}
      >
        <Link
          className="brand"
          to={dashboard}
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
          className={staff ? "staff-nav" : teacher ? "teaching-nav" : "student-nav"}
          aria-label="Основная навигация"
        >
          {student && (
            <>
              <NavLink to="/today">Сегодня</NavLink>
              <NavLink to="/schedule">Расписание</NavLink>
              <NavLink to="/academic-results">Успеваемость</NavLink>
            </>
          )}
          {!teacher && <NavLink to="/requests">Заявки</NavLink>}
          {staff && (
            <>
              <NavLink to="/staff/announcements">Объявления</NavLink>
              <NavLink to="/staff/schedule">Расписание</NavLink>
              <NavLink to="/staff/academic-results">Успеваемость</NavLink>
              <NavLink to="/profile">Профиль</NavLink>
            </>
          )}
          {teacher && (
            <>
              <NavLink to="/teaching">Журнал</NavLink>
              <NavLink to="/profile">Профиль</NavLink>
            </>
          )}
        </nav>
        <div className="header-user">
          {student ? (
            <>
              <AdditionalMenu />
              <StudentAccount unread={unread} />
            </>
          ) : (
            <span>
              {user.full_name}
              <small>{teacher ? "Преподаватель" : "Сотрудник"}</small>
            </span>
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
          role={user.role}
          faculty={user.faculty}
          keyboard={input === "keyboard"}
        />
        <div className="cabinet-content">
          <ErrorBox error={error} />
          <Routes>
            {student && (
              <>
                <Route path="/today" element={<TodayPage key={user.id} user={user} />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route
                  path="/announcements/:id"
                  element={<AnnouncementPage />}
                />
                <Route
                  path="/schedule"
                  element={<SchedulePage user={user} />}
                />
                <Route path="/schedule/:id" element={<LessonPage viewer={user.id} />} />
                <Route
                  path="/schedule/:id/route"
                  element={<LessonRoutePage />}
                />
                <Route path="/academic-results" element={<ResultsPage />} />
                <Route path="/teachers" element={<TeacherDirectory />} />
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
            {teacher && (
              <>
                <Route path="/teaching" element={<TeachingPage user={user} />} />
                <Route path="/teaching/lessons/:id" element={<TeachingJournal />} />
              </>
            )}
            <Route
              path="/profile"
              element={
                student ? (
                  <StudentProfile user={user} onUpdate={onUserUpdate} />
                ) : (
                  <EmployeeProfile user={user} />
                )
              }
            />
            {!teacher && (
              <>
                <Route path="/requests" element={<RequestWorkspace user={user} />} />
                <Route path="/requests/:id" element={<RequestWorkspace user={user} />} />
                <Route path="/requests/new" element={
                  staff ? <Navigate to="/requests" replace /> : <NewRequest user={user} />
                } />
              </>
            )}
            {student && (
              <Route
                path="/notifications"
                element={<Notifications resource={notices} />}
              />
            )}
            <Route
              path="*"
              element={<Navigate to={dashboard} replace />}
            />
          </Routes>
        </div>
      </main>
      <footer className="cabinet-footer">
        <strong>Конкурсный прототип</strong>
        <span>
          Университет, учебные даты, профили и документы вымышлены.
          Справки демонстрационные и не имеют юридической силы.
        </span>
        <a href="/assets/third-party-notices.txt">Лицензии библиотек</a>
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
