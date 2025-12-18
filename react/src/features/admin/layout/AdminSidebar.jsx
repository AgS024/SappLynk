// NavLink: enlaces con estado activo (para el menú lateral)
// useNavigate: navegación programática (click en el header del sidebar)
import { NavLink, useNavigate } from "react-router-dom";

// Iconos de Heroicons para las opciones del panel
import {
  HomeIcon,
  UsersIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

export default function AdminSidebar() {
  // Hook para navegar sin usar enlaces directos
  const navigate = useNavigate();

  // Clases base comunes a todos los links del sidebar
  const linkBaseClasses =
    "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors";

  // Estilos cuando el link NO está activo
  const inactiveClasses =
    "text-gray-100 hover:bg-red-700/70 hover:text-white";

  // Estilos cuando el link está activo
  const activeClasses = "bg-white text-red-700 shadow-sm";

  return (
    // Sidebar fijo a la izquierda
    <aside className="flex flex-col w-64 bg-gradient-to-b from-red-700 to-red-900 text-white border-r border-red-900">
      {/* CABECERA DEL SIDEBAR: logo + título del panel */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b border-red-800 cursor-pointer"
        // Click en la cabecera -> vuelve al resumen del admin
        onClick={() => navigate("/admin")}
      >
        {/* Logo decorativo estilo Pokébola */}
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full bg-white border-2 border-black" />
          <div className="absolute inset-x-0 top-0 h-1/2 bg-red-600 rounded-t-full border-b-2 border-black" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-white border-2 border-black" />
          </div>
        </div>

        {/* Texto del panel */}
        <div>
          <p className="text-xs uppercase tracking-widest text-red-100">
            Panel
          </p>
          <p className="text-lg font-extrabold tracking-wide">
            SwappLynk Admin
          </p>
        </div>
      </div>

      {/* MENÚ DE NAVEGACIÓN DEL ADMIN */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {/* Resumen / Dashboard */}
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

        {/* Gestión de usuarios */}
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

        {/* Gestión global de compras y ventas */}
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

      {/* PIE DEL SIDEBAR */}
      <div className="px-4 py-4 border-t border-red-800 text-xs text-red-100">
        <p className="font-semibold">Modo administrador</p>
        <p className="opacity-80">
          Usa este panel con responsabilidad.
        </p>
      </div>
    </aside>
  );
}
