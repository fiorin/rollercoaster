import React, { useState, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import UserSelector from "./components/UserSelector";
import { DataProvider } from "./contexts/DataContext";

const PeoplePage = lazy(() => import("./pages/PeoplePage"));
const WeightsPage = lazy(() => import("./pages/WeightsPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const GraphPage = lazy(() => import("./pages/GraphPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  const isWeightsPage = location.pathname === "/weights";
  const isGraphPage = location.pathname === "/graph";
  const isInsightsPage = location.pathname === "/insights";

  return (
    <DataProvider>
      <div className="app-container">
        {/* Header with hamburger and user selector */}
        <header className="app-header">
          <div className="header-left">
            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </div>
          <div className="header-title">Weight Tracker</div>
          <div className="header-right">
            <UserSelector onUserChange={setCurrentUser} />
          </div>
        </header>

        {/* Collapsible menu */}
        {menuOpen && (
          <nav className="mobile-menu">
            <button
              className="menu-item"
              onClick={() => {
                navigate("/calendar");
                setMenuOpen(false);
              }}
            >
              📅 Calendar
            </button>
            <button
              className="menu-item"
              onClick={() => {
                navigate("/people");
                setMenuOpen(false);
              }}
            >
              ➕ Add / Manage Users
            </button>
            <button
              className="menu-item"
              onClick={() => {
                navigate("/goals");
                setMenuOpen(false);
              }}
            >
              🏁 Goals
            </button>
            <button
              className="menu-item"
              onClick={() => {
                navigate("/insights");
                setMenuOpen(false);
              }}
            >
              💡 Insights
            </button>
            <button
              className="menu-item close-btn"
              onClick={() => setMenuOpen(false)}
            >
              ✕ Close
            </button>
          </nav>
        )}

        {/* Main content area */}
        <main className="app-main">
          <Suspense
            fallback={
              <div className="spinner-container">
                <div className="spinner" />
              </div>
            }
          >
            <Routes>
              <Route
                path="/"
                element={<HomePage currentUser={currentUser} />}
              />
              <Route
                path="/calendar"
                element={<CalendarPage currentUser={currentUser} />}
              />
              <Route
                path="/home"
                element={<HomePage currentUser={currentUser} />}
              />
              <Route path="/people" element={<PeoplePage />} />
              <Route
                path="/weights"
                element={<WeightsPage currentUser={currentUser} />}
              />
              <Route
                path="/goals"
                element={<GoalsPage currentUser={currentUser} />}
              />
              <Route
                path="/graph"
                element={<GraphPage currentUser={currentUser} />}
              />
              <Route
                path="/insights"
                element={<InsightsPage currentUser={currentUser} />}
              />
            </Routes>
          </Suspense>
        </main>

        {/* Bottom navigation */}
        <nav className="bottom-nav">
          <button
            className={`nav-item ${isHomePage ? "active" : ""}`}
            onClick={() => navigate("/home")}
            title="Home"
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>
          <button
            className={`nav-item ${isWeightsPage ? "active" : ""}`}
            onClick={() => navigate("/weights")}
            title="Weight entries"
          >
            <span className="nav-icon">⚖️</span>
            <span className="nav-label">Weights</span>
          </button>
          <button
            className={`nav-item ${isGraphPage ? "active" : ""}`}
            onClick={() => navigate("/graph")}
            title="Weight graph"
          >
            <span className="nav-icon">📈</span>
            <span className="nav-label">Graph</span>
          </button>
          <button
            className={`nav-item ${isInsightsPage ? "active" : ""}`}
            onClick={() => navigate("/insights")}
            title="Insights"
          >
            <span className="nav-icon">💡</span>
            <span className="nav-label">Insights</span>
          </button>
        </nav>
      </div>
    </DataProvider>
  );
}
