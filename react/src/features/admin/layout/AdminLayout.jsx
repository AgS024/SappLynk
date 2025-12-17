import { Outlet, Navigate } from "react-router-dom";
import { useStateContext } from "../../../Contexts/ContextProvider.jsx";
import AdminSidebar from "./AdminSidebar.jsx";

export default function AdminLayout() {
  const { currentUser, userToken } = useStateContext();

  if (!userToken) {
    return <Navigate to="/login" />;
  }

  if (!currentUser || Object.keys(currentUser).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">Cargando sesión...</p>
      </div>
    );
  }

  if (!currentUser.admin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
