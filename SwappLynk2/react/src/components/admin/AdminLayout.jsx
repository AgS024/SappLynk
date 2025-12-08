// react/src/components/admin/AdminLayout.jsx
import { Outlet, Navigate } from "react-router-dom";
import { useStateContext } from "../../Contexts/ContextProvider.jsx";
import AdminSidebar from "./AdminSidebar.jsx";

export default function AdminLayout() {
  const { currentUser, userToken } = useStateContext();

  // Si no está logueado -> a login
  if (!userToken) {
    return <Navigate to="/login" />;
  }

  // Mientras no tengamos usuario cargado, mostramos un loader sencillo
  if (!currentUser || Object.keys(currentUser).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">Cargando sesión...</p>
      </div>
    );
  }

  // Si no es admin -> lo mandamos al dashboard normal
  if (!currentUser.admin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        {/* Aquí se pintan las vistas de admin (Dashboard, Usuarios, Ventas, etc.) */}
        <Outlet />
      </div>
    </div>
  );
}
