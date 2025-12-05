import { useFamily } from "../../contexts/FamilyContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Moon, Sun, ChevronDown, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export function Header() {
  const { currentFamily, families, setCurrentFamily } = useFamily();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar bg-base-100 border-b border-base-300 px-4 min-h-14">
      <div className="flex-1">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1 px-2">
            <span className="text-lg">{currentFamily?.emoji || "🏠"}</span>
            <span className="font-semibold truncate max-w-32">
              {currentFamily?.name || "Kovan"}
            </span>
            {families.length > 1 && <ChevronDown className="w-4 h-4" />}
          </div>
          {families.length > 1 && (
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg border border-base-300"
            >
              {families.map((family) => (
                <li key={family._id}>
                  <button
                    onClick={() => setCurrentFamily(family)}
                    className={currentFamily?._id === family._id ? "active" : ""}
                  >
                    <span>{family.emoji || "🏠"}</span>
                    {family.name}
                  </button>
                </li>
              ))}
              <li className="mt-2 pt-2 border-t border-base-300">
                <Link to="/families/new">
                  <span>➕</span> Crear familia
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="flex-none gap-1">
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-circle btn-sm"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle btn-sm avatar placeholder"
          >
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-50 w-48 p-2 shadow-lg border border-base-300"
          >
            <li className="menu-title px-4 py-2">
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-xs opacity-60">{user?.email}</span>
            </li>
            <li>
              <Link to="/settings">
                <Settings className="w-4 h-4" />
                Configuración
              </Link>
            </li>
            <li>
              <button onClick={logout} className="text-error">
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
