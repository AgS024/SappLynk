// Componentes de React Router:
// - Navigate: para redirigir automáticamente según el estado de autenticación
// - Outlet: renderiza las rutas hijas (login, signup, etc.)
import { Outlet, Navigate } from "react-router-dom";

// Contexto global donde se guarda el usuario autenticado y el token
import { useStateContext } from "../../Contexts/ContextProvider";

export default function GuestLayout() {
  // Sacamos del contexto el token y el usuario actual
  const { userToken, currentUser } = useStateContext();

  // Si hay token, el usuario ya está logueado
  if (userToken) {
    // Si además es admin, lo redirigimos directamente al panel de administración
    if (currentUser?.admin) {
      return <Navigate to="/admin" />;
    }

    // Si es usuario normal, lo mandamos al marketplace
    return <Navigate to="/marketplace" />;
  }

  // Si NO hay token, permitimos acceso a las rutas públicas (login, registro, etc.)
  return (
    <div>
      {/* Contenedor centrado vertical y horizontalmente para formularios */}
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        {/* Logo o cabecera superior del layout */}
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        </div>

        {/* Aquí se renderiza la página hija (Login, Signup, etc.) */}
        <Outlet />
      </div>
    </div>
  );
}
