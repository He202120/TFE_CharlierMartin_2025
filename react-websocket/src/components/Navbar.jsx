import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/user", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(data.authenticated);
      })
      .catch(() => setAuthenticated(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/login";
  };

  return (
    <nav className="bg-gray-900 text-white px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 justify-between">
        <span className="flex items-center gap-2 text-lg font-bold mb-2 sm:mb-0">
          <img src="/camera-drone.png" alt="drone" className="w-6 h-6" />
          FlightToBeALight
        </span>

        <div className="flex gap-4 items-center">
          <Link
            to="/"
            className={`hover:underline ${
              location.pathname === "/" ? "text-blue-400" : ""
            }`}
          >
            Accueil
          </Link>
          <Link
            to="/effects"
            className={`hover:underline ${
              location.pathname === "/effects" ? "text-blue-400" : ""
            }`}
          >
            Effets
          </Link>
          <Link
            to="/pilots"
            className={`hover:underline ${
              location.pathname === "/pilots" ? "text-blue-400" : ""
            }`}
          >
            Gestion Pilotes
          </Link>
          <Link
            to="/course"
            className={`hover:underline ${
              location.pathname === "/course" ? "text-blue-400" : ""
            }`}
          >
            Course
          </Link>

          {authenticated && (
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:underline ml-4"
            >
              Se déconnecter
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
