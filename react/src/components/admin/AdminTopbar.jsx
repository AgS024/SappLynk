// react/src/components/admin/AdminTopbar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import { useStateContext } from "../../Contexts/ContextProvider.jsx";
import axiosClient from "../../axios.js";

export default function AdminTopbar({ title }) {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, setUserToken } = useStateContext();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);

    axiosClient
      .post("/logout")
      .catch((err) => {
        console.error("Error haciendo logout:", err);
      })
      .finally(() => {
        setCurrentUser && setCurrentUser({});
        setUserToken && setUserToken(null);
        setLoggingOut(false);
        navigate("/login");
      });
  };

  const nombre = currentUser?.name || "Administrador";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-red-100 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">
          Panel de control de SwappLynk — Modo admin
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Información del admin */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {nombre}
            </p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>
          <div className="relative h-9 w-9">
            {/* mini pokéball avatar */}
            <div className="absolute inset-0 rounded-full bg-white border-2 border-black" />
            <div className="absolute inset-x-0 top-0 h-1/2 bg-red-600 rounded-t-full border-b-2 border-black" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-extrabold text-black">
                {inicial}
              </span>
            </div>
          </div>
        </div>

        {/* Botón salir */}
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
