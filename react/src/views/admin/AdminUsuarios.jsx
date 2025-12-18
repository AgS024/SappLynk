// react/src/views/admin/AdminUsuarios.jsx

// Hooks de React:
// - useState: guardar estado local (lista de usuarios, loading, error)
// - useEffect: ejecutar una carga inicial al montar el componente
import { useEffect, useState } from "react";

// Link de React Router: navegación interna hacia el detalle del usuario sin recargar la página
import { Link } from "react-router-dom";

// Cliente Axios configurado para llamar al backend (con baseURL + token si existe)
import axiosClient from "../../axios.js";

// Barra superior reutilizable del panel admin (título + logout / info de sesión)
import AdminTopbar from "../../features/admin/layout/AdminTopbar.jsx";

/**
 * AdminUsuarios
 *
 * Vista del panel de administración para listar todos los usuarios.
 * La pantalla consume el endpoint:
 *   GET /admin/users
 *
 * La idea es mostrar una tabla con información básica y un acceso rápido al detalle:
 *   /admin/usuarios/:id
 *
 * En esta vista se manejan tres estados típicos:
 * - loading: mientras llega la respuesta del backend
 * - error: si falla la petición (por permisos, token inválido, fallo de servidor, etc.)
 * - datos: cuando llega una lista válida de usuarios
 */
export default function AdminUsuarios() {
  // usuarios: array con los usuarios que devuelve el backend
  const [usuarios, setUsuarios] = useState([]);

  // loading: indica si se está cargando la tabla
  const [loading, setLoading] = useState(false);

  // error: mensaje para mostrar si algo sale mal al pedir los usuarios
  const [error, setError] = useState(null);

  /**
   * useEffect:
   * Al montar el componente, se lanza la primera carga del listado.
   * Así la tabla se rellena automáticamente al entrar en la página.
   */
  useEffect(() => {
    cargarUsuarios();
  }, []);

  /**
   * cargarUsuarios:
   * Función central de la vista.
   * Pide al backend el listado de usuarios de administración y actualiza el estado.
   *
   * Flujo:
   * 1) Activa loading y limpia error
   * 2) GET /admin/users
   * 3) Si la respuesta es un array, se guarda. Si no, se guarda un array vacío.
   * 4) Si falla, se guarda un mensaje de error razonable para mostrar en pantalla.
   * 5) Se desactiva loading al final (haya ido bien o mal).
   */
  const cargarUsuarios = () => {
    setLoading(true);
    setError(null);

    axiosClient
      .get("/admin/users")
      .then((res) => {
        setUsuarios(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Error cargando usuarios (admin):", err);
        setError(
          err.response?.data?.message || "No se han podido cargar los usuarios."
        );
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      {/* Topbar del panel admin: se reutiliza para mantener el mismo layout visual */}
      <AdminTopbar title="Gestión de usuarios" />

      {/* Contenedor principal con ancho máximo para mantener la UI centrada */}
      <main className="px-6 py-6 max-w-6xl mx-auto w-full">
        {/* Estado 1: cargando */}
        {loading ? (
          <p className="text-gray-500">Cargando usuarios...</p>
        ) : (
          /* Estado 2: error al cargar */
          error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            /* Estado 3: no hay usuarios (o la API devuelve vacío) */
            usuarios.length === 0 ? (
              <p className="text-gray-500">
                No hay usuarios para mostrar (o todavía no has configurado la
                API admin).
              </p>
            ) : (
              /* Estado 4: tabla con usuarios */
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Cabecera de la tarjeta: título + botón de recarga */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Usuarios registrados
                  </h2>

                  {/* Recargar reutiliza cargarUsuarios para repetir la petición al backend */}
                  <button
                    type="button"
                    onClick={cargarUsuarios}
                    className="text-sm text-red-600 hover:text-red-800 font-semibold"
                  >
                    Recargar
                  </button>
                </div>

                {/* Tabla con scroll horizontal para pantallas pequeñas */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    {/* Encabezados: columnas básicas para administración */}
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 uppercase tracking-wide">
                          ID
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 uppercase tracking-wide">
                          Nombre
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 uppercase tracking-wide">
                          Email
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 uppercase tracking-wide">
                          Rol
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 uppercase tracking-wide">
                          Estado
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 uppercase tracking-wide">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    {/* Cuerpo de la tabla: una fila por usuario */}
                    <tbody>
                      {usuarios.map((u) => (
                        <tr
                          key={u.id}
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >
                          {/* ID numérico del usuario */}
                          <td className="px-4 py-2 text-slate-700">{u.id}</td>

                          {/* Nombre visible del usuario */}
                          <td className="px-4 py-2 text-slate-800 font-medium">
                            {u.name}
                          </td>

                          {/* Email del usuario */}
                          <td className="px-4 py-2 text-slate-700">{u.email}</td>

                          {/* Rol: badge según u.admin */}
                          <td className="px-4 py-2">
                            {u.admin ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-300">
                                Usuario
                              </span>
                            )}
                          </td>

                          {/* Estado de la cuenta: badge según u.cancelada */}
                          <td className="px-4 py-2">
                            {u.cancelada ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-300">
                                Cuenta cancelada
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                                Activa
                              </span>
                            )}
                          </td>

                          {/* Acción principal: ir al detalle del usuario */}
                          <td className="px-4 py-2">
                            <Link
                              to={`/admin/usuarios/${u.id}`}
                              className="text-xs font-semibold text-red-600 hover:text-red-800"
                            >
                              Ver detalle →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )
        )}
      </main>
    </>
  );
}
