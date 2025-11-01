import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Month from "./pages/Month";
import Week from "./pages/Week";
import Day from "./pages/Day";
import Sidebar from "./components/Sidebar";
import { useState } from "react";
import logo from "./assets/icon.jpeg"; // ✅ Import logo

function AppLayout() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [collapsed, setCollapsed] = useState(false);

  const location = useLocation();      // ✅ Get current route
  const navigate = useNavigate();      // ✅ Navigate without page reload

  return (
    <>
      {/* ✅ Fixed Header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "55px",
          display: "flex",
          padding: "10px",
          gap: "10px",
          alignItems: "center",
          borderBottom: "1px solid #ddd",
          background: "#fff",
          zIndex: 1000
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "22px",
            padding: "4px 10px"
          }}
        >
          ☰
        </button>

        {/* ✅ Logo added */}
        <img 
          src={logo} 
          alt="App Logo" 
          style={{ height: "60px", width: "30px", objectFit: "contain" }}
        />

        <h2 style={{ marginRight: "auto" }}> Calendar</h2>

        {/* ✅ Working dropdown */}
        <select
          value={location.pathname}
          onChange={(e) => navigate(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        >
          <option value="/">Month</option>
          <option value="/week">Week</option>
          <option value="/day">Day</option>
        </select>
      </div>

      <Sidebar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        collapsed={collapsed}
      />

      {/* ✅ Main content */}
      <div
        style={{
          marginLeft: collapsed ? "70px" : "260px",
          marginTop: "55px",
          padding: "10px",
          transition: "margin-left 0.3s ease"
        }}
      >
        <Routes>
          <Route path="/" element={<Month />} />
          <Route path="/week" element={<Week />} />
          <Route path="/day" element={<Day />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
