// React Router:
// - Navigate: redirecciones según autenticación/rol
// - Outlet: renderiza las rutas hijas dentro del layout (vistas admin)
import { Outlet, Navigate } from "react-router-dom";

// Contexto global: aquí están el usuario actual y el token
import { useStateContext } from "../../../Contexts/ContextProvider.jsx";

// Sidebar específico del panel de administración
import AdminSidebar from "./AdminSidebar.jsx";

export default function AdminLayout() {
  // Recuperamos info de sesión desde el contexto
  const { currentUser, userToken } = useStateContext();

  // 1) Si no hay token, no hay sesión -> mandamos a login
  if (!userToken) {
    return <Navigate to="/login" />;
  }

  // 2) Si hay token pero el usuario aún no se ha cargado (por refresh),
  // mostramos un loading para no redirigir “a ciegas”
  if (!currentUser || Object.keys(currentUser).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">Cargando sesión...</p>
      </div>
    );
  }

  // 3) Si el usuario no es admin, le bloqueamos el panel admin
  // (lo mandamos a su dashboard normal)
  if (!currentUser.admin) {
    return <Navigate to="/dashboard" />;
  }

  // 4) Si todo OK: layout admin con sidebar + contenido (Outlet)
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Menú lateral de administración */}
      <AdminSidebar />

      {/* Contenido principal: aquí se van pintando las pantallas admin */}
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
