// react/src/views/admin/AdminDashboard.jsx

// Hooks de React:
// - useState: guardar estados locales (stats, loading, error)
// - useEffect: lanzar la petición al backend cuando se carga la vista
import { useEffect, useState } from "react";

// Barra superior reutilizable del panel de admin (título + info admin + logout)
import AdminTopbar from "../../features/admin/layout/AdminTopbar.jsx";

// Cliente Axios configurado para llamar a la API (incluye token si existe)
import axiosClient from "../../axios.js";

/**
 * AdminDashboard
 *
 * Vista principal del panel de administración.
 * Muestra un resumen general del sistema con métricas agregadas:
 * - total de usuarios
 * - total de ventas/compras
 * - total de valoraciones
 * - total de publicaciones activas (excluyendo cuentas canceladas)
 *
 * Los datos se obtienen del endpoint GET /admin/resumen (backend Laravel).
 */
export default function AdminDashboard() {
  /**
   * stats:
   * Estado que guarda las métricas del dashboard.
   * Se inicializa con 0 para que la UI tenga valores consistentes antes de cargar.
   */
  const [stats, setStats] = useState({
    total_usuarios: 0,
    total_ventas: 0,
    total_valoraciones: 0,
    total_en_venta_no_canceladas: 0,
  });

  // loading: indica si la petición al backend sigue en curso (para mostrar "…" en pantalla)
  const [loading, setLoading] = useState(false);

  // error: guarda un mensaje de error para mostrarlo si falla la carga del resumen
  const [error, setError] = useState(null);

  /**
   * useEffect:
   * Se ejecuta una vez al montar el componente (dependencias vacías []).
   * Lanza la petición al endpoint de resumen del panel admin.
   */
  useEffect(() => {
    // Se activa el estado de carga y se limpia cualquier error previo
    setLoading(true);
    setError(null);

    axiosClient
      // Endpoint protegido por middleware admin en backend
      .get("/admin/resumen")
      .then((res) => {
        // Si llega respuesta correcta, se guardan las métricas en el estado
        setStats(res.data || {});
      })
      .catch((err) => {
        // Si falla, se loguea el error y se guarda un mensaje legible para UI
        console.error("Error cargando resumen admin:", err);

        setError(
          err.response?.data?.message ||
            "No se ha podido cargar el resumen del sistema."
        );
      })
      .finally(() => setLoading(false)); // Al final, se desactiva loading siempre
  }, []);

  /**
   * safeNumber:
   * Función pequeña para evitar problemas si el backend manda strings o null.
   * Convierte a número de forma segura (por ejemplo: "5" -> 5, null -> 0).
   */
  const safeNumber = (value) =>
    typeof value === "number" ? value : Number(value || 0);

  return (
    <>
      {/* Topbar del panel admin con el título de la vista */}
      <AdminTopbar title="Resumen del sistema" />

      {/* Contenido principal centrado */}
      <main className="px-6 py-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Bloque de bienvenida + posibles errores */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Bienvenido al panel de administración
          </h2>
          <p className="text-sm text-gray-600">
            Desde aquí se revisan usuarios, compras y ventas realizadas en
            SwappLynk.
          </p>

          {/* Si hay error, se muestra en rojo debajo del texto */}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>

        {/* Resumen principal: tarjetas con métricas */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tarjeta 1: usuarios */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              Usuarios
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {/* Mientras carga se muestra "…" para no enseñar 0 “falso” */}
              {loading ? "…" : safeNumber(stats.total_usuarios)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total de usuarios registrados en la plataforma.
            </p>
          </div>

          {/* Tarjeta 2: ventas/compras */}
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

          {/* Tarjeta 3: valoraciones */}
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

          {/* Tarjeta 4: publicaciones activas de cuentas no canceladas */}
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
