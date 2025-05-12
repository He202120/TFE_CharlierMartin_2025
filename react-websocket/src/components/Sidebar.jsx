import { Link, useLocation } from "react-router-dom";
import { Home, Sliders, Zap, Settings } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Accueil", icon: <Home size={20} /> },
    { path: "/dashboard", label: "RSSI", icon: <Sliders size={20} /> },
    { path: "/effects", label: "Effets", icon: <Zap size={20} /> },
    { path: "/settings", label: "Paramètres", icon: <Settings size={20} /> },
  ];

  return (
    <aside className="h-screen w-64 bg-gray-900 text-white flex flex-col py-6 px-4 shadow-lg fixed">
      <div className="mb-8 text-xl font-bold flex items-center gap-2">
        <img src="/camera-drone.png" alt="logo" className="w-6 h-6" />
        FlightToBeALight
      </div>

      <nav className="flex flex-col gap-4">
        {navItems.map(({ path, label, icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 transition ${
              location.pathname === path ? "bg-blue-600" : ""
            }`}
          >
            {icon}
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
