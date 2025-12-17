// react/src/components/admin/AdminSidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const linkBaseClasses =
    "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors";
  const inactiveClasses =
    "text-gray-100 hover:bg-red-700/70 hover:text-white";
  const activeClasses = "bg-white text-red-700 shadow-sm";

  return (
    <aside className="flex flex-col w-64 bg-gradient-to-b from-red-700 to-red-900 text-white border-r border-red-900">
      {/* Logo / encabezado */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b border-red-800 cursor-pointer"
        onClick={() => navigate("/admin")}
      >
        <div className="relative h-10 w-10">
          {/* Pokéball */}
          <div className="absolute inset-0 rounded-full bg-white border-2 border-black" />
          <div className="absolute inset-x-0 top-0 h-1/2 bg-red-600 rounded-t-full border-b-2 border-black" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-white border-2 border-black" />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-red-100">
            Panel
          </p>
          <p className="text-lg font-extrabold tracking-wide">
            SwappLynk Admin
          </p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `${linkBaseClasses} ${
              isActive ? activeClasses : inactiveClasses
            }`
          }
        >
          <HomeIcon className="h-5 w-5" />
          <span>Resumen</span>
        </NavLink>

        <NavLink
          to="/admin/usuarios"
          className={({ isActive }) =>
            `${linkBaseClasses} ${
              isActive ? activeClasses : inactiveClasses
            }`
          }
        >
          <UsersIcon className="h-5 w-5" />
          <span>Usuarios</span>
        </NavLink>

        <NavLink
          to="/admin/ventas"
          className={({ isActive }) =>
            `${linkBaseClasses} ${
              isActive ? activeClasses : inactiveClasses
            }`
          }
        >
          <ShoppingBagIcon className="h-5 w-5" />
          <span>Compras / Ventas</span>
        </NavLink>
      </nav>

      {/* Pie de sidebar */}
      <div className="px-4 py-4 border-t border-red-800 text-xs text-red-100">
        <p className="font-semibold">Modo administrador</p>
        <p className="opacity-80">Usa este panel con responsabilidad.</p>
      </div>
    </aside>
  );
}
