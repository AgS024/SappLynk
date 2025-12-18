// Hook de estado local
import { useState } from "react";

// React Router:
// - useNavigate: navegación programática tras logout
import { useNavigate } from "react-router-dom";

// Icono para el botón de cerrar sesión
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";

// Contexto global: usuario y gestión del token
import { useStateContext } from "../../../Contexts/ContextProvider.jsx";

// Cliente Axios configurado para la API
import axiosClient from "../../../axios.js";

export default function AdminTopbar({ title }) {
  // Hook para navegar tras cerrar sesión
  const navigate = useNavigate();

  // Sacamos del contexto el usuario actual y los setters globales
  const { currentUser, setCurrentUser, setUserToken } = useStateContext();

  // Estado local para evitar múltiples clicks en logout
  const [loggingOut, setLoggingOut] = useState(false);

  /**
   * Maneja el cierre de sesión del administrador.
   * - Llama a la API para invalidar el token
   * - Limpia el estado global
   * - Redirige al login
   */
  const handleLogout = () => {
    // Evitamos ejecutar el logout más de una vez
    if (loggingOut) return;

    setLoggingOut(true);

    axiosClient
      .post("/logout")
      .catch((err) => {
        // Si falla el backend, igualmente limpiamos el estado en frontend
        console.error("Error haciendo logout:", err);
      })
      .finally(() => {
        // Limpiamos el usuario y el token del contexto global
        setCurrentUser && setCurrentUser({});
        setUserToken && setUserToken(null);

        // Restauramos estado local y redirigimos al login
        setLoggingOut(false);
        navigate("/login");
      });
  };

  // Nombre a mostrar (fallback por seguridad)
  const nombre = currentUser?.name || "Administrador";

  // Inicial para el avatar (primera letra del nombre)
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    // Barra superior del panel admin
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-red-100 shadow-sm">
      {/* BLOQUE IZQUIERDO: título y subtítulo */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">
          Panel de control de SwappLynk — Modo admin
        </p>
      </div>

      {/* BLOQUE DERECHO: info del admin + botón de logout */}
      <div className="flex items-center gap-4">
        {/* Información del administrador */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{nombre}</p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>

          {/* Avatar estilo Pokébola con inicial */}
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-full bg-white border-2 border-black" />
            <div className="absolute inset-x-0 top-0 h-1/2 bg-red-600 rounded-t-full border-b-2 border-black" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-extrabold text-black">
                {inicial}
              </span>
            </div>
          </div>
        </div>

        {/* Botón de cerrar sesión */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          {loggingOut ? "Saliendo..." : "Salir"}
        </button>
      </div>
    </header>
  );
}
