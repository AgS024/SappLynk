// react/src/views/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import AdminTopbar from "../../features/admin/layout/AdminTopbar.jsx";
import axiosClient from "../../axios.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_usuarios: 0,
    total_ventas: 0,
    total_valoraciones: 0,
    total_en_venta_no_canceladas: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    axiosClient
      .get("/admin/resumen")
      .then((res) => {
        setStats(res.data || {});
      })
      .catch((err) => {
        console.error("Error cargando resumen admin:", err);
        setError(
          err.response?.data?.message ||
            "No se ha podido cargar el resumen del sistema."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const safeNumber = (value) =>
    typeof value === "number" ? value : Number(value || 0);

  return (
    <>
      <AdminTopbar title="Resumen del sistema" />

      <main className="px-6 py-6 max-w-6xl mx-auto w-full space-y-6">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Bienvenido al panel de administración
          </h2>
          <p className="text-sm text-gray-600">
            Desde aquí podrás revisar usuarios, compras y ventas realizadas en
            SwappLynk.
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </section>

        {/* Resumen principal */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Usuarios */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              Usuarios
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {loading ? "…" : safeNumber(stats.total_usuarios)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total de usuarios registrados en la plataforma.
            </p>
          </div>

          {/* Ventas / Compras */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
              Ventas
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {loading ? "…" : safeNumber(stats.total_ventas)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Número total de compras/ventas registradas.
            </p>
          </div>

          {/* Valoraciones */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Valoraciones
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {loading ? "…" : safeNumber(stats.total_valoraciones)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Valoraciones realizadas entre usuarios.
            </p>
          </div>

          {/* Cartas en venta (cuentas activas) */}
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-4">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
              Cartas en venta
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {loading ? "…" : safeNumber(stats.total_en_venta_no_canceladas)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Publicaciones activas de usuarios con cuenta no cancelada.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
