// react/src/views/admin/AdminVentas.jsx
import { useEffect, useState } from "react";
import axiosClient from "../../axios.js";
import AdminTopbar from "../../features/admin/layout/AdminTopbar.jsx";
import { Link } from "react-router-dom";

// Estados fijos definidos en la tabla `estados`
const ESTADOS = [
  { id: 1, label: "Esperando recibir" },
  { id: 2, label: "Recibido" },
  { id: 3, label: "Enviado" },
  { id: 4, label: "Cancelada" },
];

// Devuelve el id numérico de estado a partir de la venta
const getEstadoValue = (venta) => {
  if (venta.id_estado) return Number(venta.id_estado);
  if (venta.estado?.id) return Number(venta.estado.id);
  return 0;
};

// En función del estado actual, qué estados se pueden seleccionar
const getAllowedEstados = (estadoActualId) => {
  if (!estadoActualId || estadoActualId === 0) return [1, 4]; // arranque: solo 1 o 4
  if (estadoActualId === 1) return [1, 2, 4];
  if (estadoActualId === 2) return [2, 3, 4];
  if (estadoActualId === 3) return [3, 4];
  if (estadoActualId === 4) return [4];
  return [estadoActualId];
};

export default function AdminVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null); // id de venta que se está guardando

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = () => {
    setLoading(true);
    setError(null);

    axiosClient
      .get("/admin/ventas")
      .then((res) => {
        setVentas(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Error cargando ventas (admin):", err);
        setError(
          err.response?.data?.message ||
            "No se han podido cargar las ventas."
        );
      })
      .finally(() => setLoading(false));
  };

  const actualizarEstado = (ventaId, nuevoEstadoId) => {
    if (!nuevoEstadoId) return;

    const numericEstado = Number(nuevoEstadoId);

    const ventaActual = ventas.find((v) => v.id === ventaId);
    if (!ventaActual) return;

    const estadoActual = getEstadoValue(ventaActual);

    // Si ya está cancelada -> no dejamos cambiar en el front (el back también lo valida)
    if (estadoActual === 4 && numericEstado !== 4) {
      alert("No se puede modificar el estado de una venta cancelada.");
      return;
    }

    // Si no cambia realmente el estado, no llamamos a la API
    if (estadoActual === numericEstado) {
      return;
    }

    setSavingId(ventaId);

    axiosClient
      .put(`/admin/ventas/${ventaId}/estado`, {
        id_estado: numericEstado,
      })
      .then((res) => {
        const updated = res.data;
        // Actualizamos solo la venta modificada en el estado local
        setVentas((prev) =>
          prev.map((v) => (v.id === ventaId ? { ...v, ...updated } : v))
        );
      })
      .catch((err) => {
        console.error("Error actualizando estado de venta:", err);
        alert(
          err.response?.data?.message ||
            "No se ha podido actualizar el estado de la venta."
        );
      })
      .finally(() => setSavingId(null));
  };

  return (
    <>
      <AdminTopbar title="Compras / Ventas" />

      <main className="px-6 py-6 max-w-6xl mx-auto w-full">
        {loading ? (
          <p className="text-gray-500">Cargando ventas...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : ventas.length === 0 ? (
          <p className="text-gray-500">
            No hay ventas para mostrar (o aún no has creado la API de admin para
            ventas).
          </p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Histórico de compras / ventas
              </h2>
              <button
                type="button"
                onClick={cargarVentas}
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
                      Fecha
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 uppercase tracking-wide">
                      Comprador
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 uppercase tracking-wide">
                      Vendedor
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 uppercase tracking-wide">
                      Importe
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((v) => {
                    const comprador = v.comprador;
                    const vendedor = v.en_venta?.usuario; // viene desde en_venta.id_usuario
                    const estadoValue = getEstadoValue(v);
                    const isCancelada = estadoValue === 4;
                    const allowedEstadosIds = getAllowedEstados(estadoValue);

                    return (
                      <tr
                        key={v.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-2 text-slate-700">{v.id}</td>
                        <td className="px-4 py-2 text-slate-700">
                          {v.fecha_venta
                            ? new Date(
                                v.fecha_venta
                              ).toLocaleDateString("es-ES")
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          {comprador ? (
                            <Link
                              to={`/admin/usuarios/${comprador.id}`}
                              className="text-red-600 hover:underline"
                            >
                              {comprador.name}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          {vendedor ? (
                            <Link
                              to={`/admin/usuarios/${vendedor.id}`}
                              className="text-red-600 hover:underline"
                            >
                              {vendedor.name}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          <select
                            className={
                              "px-2 py-1 border rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 " +
                              (isCancelada
                                ? "border-red-300 text-red-700 bg-red-50 cursor-not-allowed"
                                : "border-slate-300")
                            }
                            value={estadoValue || ""}
                            onChange={(e) =>
                              actualizarEstado(v.id, e.target.value)
                            }
                            disabled={savingId === v.id || isCancelada}
                          >
                            <option value="">
                              {estadoValue ? "Seleccionar" : "Sin estado"}
                            </option>
                            {ESTADOS.filter((est) =>
                              allowedEstadosIds.includes(est.id)
                            ).map((est) => (
                              <option key={est.id} value={est.id}>
                                {est.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 font-semibold text-slate-900">
                          {Number(v.precio_total || v.precio || 0).toFixed(2)} €
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
