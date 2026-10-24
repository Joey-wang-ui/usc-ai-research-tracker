import { useState, useEffect } from "react";
import {
  HashRouter,
  NavLink,
  Route,
  Routes,
  useLocation,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Telescope,
  Columns3,
  Users,
  CalendarDays,
  Settings2,
  ArrowUpRight,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
  Database,
  Command,
  ExternalLink,
} from "lucide-react";
import { StoreProvider, useStore } from "./lib/store";
import Dashboard from "./pages/Dashboard";
import Opportunities from "./pages/Opportunities";
import Pipeline from "./pages/Pipeline";
import Detail from "./pages/Detail";
import CRM from "./pages/CRM";
import Timeline from "./pages/Timeline";
import Settings from "./pages/Settings";
const nav = [
  ["/", "总览", "Overview", LayoutDashboard],
  ["/opportunities", "研究机会", "Opportunities", Telescope],
  ["/pipeline", "申请看板", "Pipeline", Columns3],
  ["/crm", "研究人脉", "Research CRM", Users],
  ["/timeline", "计划与任务", "Timeline & Tasks", CalendarDays],
] as const;
function Shell() {
  const { state, run } = useStore(),
    [open, setOpen] = useState(false),
    location = useLocation(),
    navigate = useNavigate();
  const active = nav.find((n) =>
    n[0] === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(n[0]),
  );
  useEffect(() => {
    function shortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        navigate("/opportunities?search=");
        setTimeout(
          () =>
            document
              .querySelector<HTMLInputElement>(
                'input[aria-label="搜索机会、导师、关键词…"]',
              )
              ?.focus(),
          100,
        );
      }
    }
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [navigate]);
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        跳转到主内容
      </a>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="关闭导航"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <div className="brand-icon">
            <GraduationCap size={24} />
          </div>
          <div>
            <strong>
              USC <span>AI Research Tracker</span>
            </strong>
            <small>PERSONAL WORKSPACE</small>
          </div>
        </Link>
        <button
          className="mobile-close icon-button"
          aria-label="关闭导航"
          onClick={() => setOpen(false)}
        >
          <X size={18} />
        </button>
        <div className="workspace-label">
          WORKSPACE <span>个人</span>
        </div>
        <nav>
          {nav.map(([path, label, en, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>
                {label}
                <small>{en}</small>
              </span>
              {path === "/opportunities" && (
                <b>{state.opportunities.filter((o) => !o.archived).length}</b>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="semester-card">
          <span className="semester-kicker">
            <i /> YOUR NEXT CHAPTER
          </span>
          <h3>
            Spring 2027 <ArrowUpRight size={16} />
          </h3>
          <p>MS in Analytics · USC</p>
          <div className="semester-line" />
          <span>从一次探索，走向下一次可能。</span>
          <Link to="/timeline">
            规划我的研究旅程 <ChevronRight size={14} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <NavLink to="/settings" onClick={() => setOpen(false)}>
            <Settings2 size={17} />
            设置与数据
          </NavLink>
          <div className="local-status">
            <span className="green-dot" /> 数据保存在此设备{" "}
            <Database size={13} />
          </div>
          <div className="profile">
            <div className="avatar">Y</div>
            <div>
              <strong>我的研究工作区</strong>
              <span>Personal research journey</span>
            </div>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="打开导航"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{active?.[2] || "Settings & Data"}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="global-search"
              onClick={() => {
                navigate("/opportunities?search=");
                setTimeout(
                  () =>
                    document
                      .querySelector<HTMLInputElement>(
                        'input[aria-label="搜索机会、导师、关键词…"]',
                      )
                      ?.focus(),
                  100,
                );
              }}
            >
              <Search size={15} />
              <span>搜索研究机会</span>
              <kbd>
                <Command size={10} /> K
              </kbd>
            </button>
            <span className="top-divider" />
            <button
              className="icon-button"
              aria-label={
                state.theme === "dark" ? "切换浅色主题" : "切换深色主题"
              }
              onClick={() =>
                void run(
                  {
                    type: "theme",
                    value: state.theme === "dark" ? "light" : "dark",
                  },
                  "主题已保存",
                )
              }
            >
              {state.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a
              className="usc-link"
              href="https://www.usc.edu/"
              target="_blank"
              rel="noopener noreferrer"
            >
              USC <ExternalLink size={12} />
            </a>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/opportunities/:id" element={<Detail />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="*"
              element={
                <div className="empty">
                  <h1>找不到此页面</h1>
                  <Link to="/">返回总览</Link>
                </div>
              }
            />
          </Routes>
          <footer className="app-footer">
            <span>
              USC AI Research Tracker <i /> Research Opportunities & Application
              Management
            </span>
            <span>个人管理工具 · 非 USC 官方网站</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </StoreProvider>
  );
}
