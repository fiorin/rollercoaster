import React, { useState, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import UserSelector from "./components/UserSelector";
import { DataProvider } from "./contexts/DataContext";
import { ToastProvider } from "./components/ToastProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import DataErrorBanner from "./components/DataErrorBanner";

const PeoplePage = lazy(() => import("./pages/PeoplePage"));
const WeightsPage = lazy(() => import("./pages/WeightsPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const GraphPage = lazy(() => import("./pages/GraphPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const NAV_ITEMS = [
  {
    path: "/home",
    icon: "🏠",
    label: "Home",
    matches: (pathname) => pathname === "/" || pathname === "/home",
  },
  {
    path: "/weights",
    icon: "⚖️",
    label: "Weights",
    matches: (pathname) => pathname === "/weights",
  },
  {
    path: "/graph",
    icon: "📈",
    label: "Graph",
    matches: (pathname) => pathname === "/graph",
  },
  {
    path: "/insights",
    icon: "💡",
    label: "Insights",
    matches: (pathname) => pathname === "/insights",
  },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function goTo(path) {
    navigate(path);
    setMenuOpen(false);
  }

  return (
    <ToastProvider>
      <DataProvider>
        <div className="app-container">
          {/* Header with hamburger and user selector */}
          <header className="app-header">
            <div className="header-left">
              <button
                type="button"
                className="hamburger-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Abrir menu"
                aria-expanded={menuOpen}
              >
                ☰
              </button>
            </div>
            <div className="header-title">Weight Tracker</div>
            <div className="header-right">
              <UserSelector />
            </div>
          </header>

          {/* Collapsible menu */}
          {menuOpen && (
            <nav className="mobile-menu">
              <button
                type="button"
                className="menu-item"
                onClick={() => goTo("/calendar")}
              >
                📅 Calendar
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => goTo("/people")}
              >
                ➕ Add / Manage Users
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => goTo("/goals")}
              >
                🏁 Goals
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => goTo("/insights")}
              >
                💡 Insights
              </button>
              <button
                type="button"
                className="menu-item close-btn"
                onClick={() => setMenuOpen(false)}
              >
                ✕ Close
              </button>
            </nav>
          )}

          {/* Main content area */}
          <main className="app-main">
            <DataErrorBanner />
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="spinner-container">
                    <div className="spinner" />
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/people" element={<PeoplePage />} />
                  <Route path="/weights" element={<WeightsPage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="/graph" element={<GraphPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>

          {/* Bottom navigation */}
          <nav className="bottom-nav">
            {NAV_ITEMS.map((item) => {
              const active = item.matches(location.pathname);
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`nav-item ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => goTo(item.path)}
                  title={item.label}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </DataProvider>
    </ToastProvider>
  );
}
