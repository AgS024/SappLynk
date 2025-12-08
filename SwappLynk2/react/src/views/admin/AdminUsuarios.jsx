// react/src/views/admin/AdminUsuarios.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../axios.js";
import AdminTopbar from "../../components/admin/AdminTopbar.jsx";

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

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
          err.response?.data?.message ||
            "No se han podido cargar los usuarios."
        );
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <AdminTopbar title="Gestión de usuarios" />

      <main className="px-6 py-6 max-w-6xl mx-auto w-full">
        {loading ? (
          <p className="text-gray-500">Cargando usuarios...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : usuarios.length === 0 ? (
          <p className="text-gray-500">
            No hay usuarios para mostrar (o todavía no has configurado la API
            admin).
          </p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Usuarios registrados
              </h2>
              <button
                type="button"
                onClick={cargarUsuarios}
                className="text-sm text-red-600 hover:text-red-800 font-semibold"
              >
                Recargar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
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
                <tbody>
                  {usuarios.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2 text-slate-700">{u.id}</td>
                      <td className="px-4 py-2 text-slate-800 font-medium">
                        {u.name}
                      </td>
                      <td className="px-4 py-2 text-slate-700">{u.email}</td>
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
        )}
      </main>
    </>
  );
}
