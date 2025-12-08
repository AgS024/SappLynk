// react/src/views/admin/AdminDashboard.jsx
import AdminTopbar from "../../components/admin/AdminTopbar.jsx";

export default function AdminDashboard() {
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
        </section>

        {/* Cajitas de ejemplo para futuro resumen */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              Usuarios
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-500 mt-1">
              Total de usuarios registrados (rellenar cuando haya API admin).
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
              Ventas
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-500 mt-1">
              Número de ventas registradas.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Valoraciones
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-500 mt-1">
              Pendiente de enlazar con estadísticas globales.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
