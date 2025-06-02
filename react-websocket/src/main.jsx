import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import EffectsPage from "./pages/EffectsPage";
import Navbar from "./components/Navbar";
import PilotConfigPanel from "./pages/PilotConfigPanel";
import CoursePage from "./pages/CoursePage";
import Login from "./pages/Login"
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/effects" element={<EffectsPage />} />
        <Route path="/pilots" element={<PilotConfigPanel />} />
        <Route path="/course" element={<CoursePage />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
