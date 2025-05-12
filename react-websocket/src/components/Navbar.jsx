import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-gray-900 text-white px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
      <span className="flex items-center gap-2 text-lg font-bold mb-2 sm:mb-0">
        <img src="/camera-drone.png" alt="drone" className="w-6 h-6" />
        FlightToBeALight
      </span>

        <div className="flex gap-4">
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
        </div>
      </div>
    </nav>
  );
}
