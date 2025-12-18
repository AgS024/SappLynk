// react/src/views/admin/AdminVentas.jsx

// Hooks de React:
// - useState: guardar estado local (ventas, loading, error, venta que se está guardando)
// - useEffect: cargar datos al montar la vista
import { useEffect, useState } from "react";

// Cliente Axios configurado para comunicarse con la API del backend
import axiosClient from "../../axios.js";

// Topbar reutilizable del panel admin (título + botón de salir, etc.)
import AdminTopbar from "../../features/admin/layout/AdminTopbar.jsx";

// Link de React Router: navegación interna al detalle del usuario sin recargar la página
import { Link } from "react-router-dom";

/**
 * ESTADOS
 *
 * Lista fija que representa los estados posibles de una venta.
 * Se corresponde con los registros de la tabla `estados` en la base de datos.
 *
 * La vista usa esta lista para:
 * - pintar las etiquetas del <select>
 * - controlar qué transiciones se permiten mostrar desde la UI
 */
const ESTADOS = [
  { id: 1, label: "Esperando recibir" },
  { id: 2, label: "Recibido" },
  { id: 3, label: "Enviado" },
  { id: 4, label: "Cancelada" },
];

/**
 * getEstadoValue
 *
 * Normaliza el estado actual de una venta y devuelve siempre un número.
 * Puede venir de dos formas distintas según cómo haya devuelto el backend:
 * - venta.id_estado (campo directo)
 * - venta.estado.id (relación cargada con eager loading)
 *
 * Si no existe estado todavía, devuelve 0.
 */
const getEstadoValue = (venta) => {
  if (venta.id_estado) return Number(venta.id_estado);
  if (venta.estado?.id) return Number(venta.estado.id);
  return 0;
};

/**
 * getAllowedEstados
 *
 * Define las transiciones permitidas que se muestran en el selector.
 * La idea del sistema es que el cambio de estado sea progresivo:
 *   1 -> 2 -> 3
 * y que siempre sea posible pasar a 4 (Cancelada).
 *
 * Esta función solo limita la UI; el backend vuelve a validar la transición
 * (o sea, aunque se "fuerce" desde el cliente, el servidor lo puede rechazar).
 */
const getAllowedEstados = (estadoActualId) => {
  // Caso inicial: venta sin estado asignado todavía (0)
  if (!estadoActualId || estadoActualId === 0) return [1, 4];

  // Si está en 1, se permite seguir a 2 o cancelar
  if (estadoActualId === 1) return [1, 2, 4];

  // Si está en 2, se permite seguir a 3 o cancelar
  if (estadoActualId === 2) return [2, 3, 4];

  // Si está en 3, solo se permite permanecer en 3 o cancelar
  if (estadoActualId === 3) return [3, 4];

  // Si está en 4, ya no hay transición: se queda en 4
  if (estadoActualId === 4) return [4];

  // Fallback por si llega algún valor raro
  return [estadoActualId];
};

/**
 * AdminVentas
 *
 * Vista de administración que muestra el histórico global de compras/ventas.
 * Consume el endpoint:
 *   GET  /admin/ventas
 *
 * Además permite cambiar el estado de una venta desde la tabla.
 * Para el cambio de estado consume:
 *   PUT  /admin/ventas/:id/estado   { id_estado: number }
 *
 * La UI enlaza a:
 * - detalle de comprador: /admin/usuarios/:id
 * - detalle de vendedor: /admin/usuarios/:id
 */
export default function AdminVentas() {
  // Lista de ventas que devuelve el backend (incluye comprador, en_venta.usuario, estado, etc.)
  const [ventas, setVentas] = useState([]);

  // loading: indica si la tabla se está cargando
  const [loading, setLoading] = useState(false);

  // error: mensaje para mostrar si falla la carga del listado
  const [error, setError] = useState(null);

  // savingId: id de la venta a la que se le está actualizando el estado (para deshabilitar su select)
  const [savingId, setSavingId] = useState(null);

  /**
   * Carga inicial del listado al entrar a la página.
   */
  useEffect(() => {
    cargarVentas();
  }, []);

  /**
   * cargarVentas
   *
   * Pide al backend el histórico completo.
   * Actualiza estados típicos de pantalla: loading, error y ventas.
   */
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
          err.response?.data?.message || "No se han podido cargar las ventas."
        );
      })
      .finally(() => setLoading(false));
  };

  /**
   * actualizarEstado
   *
   * Lanza el cambio de estado de una venta concreta.
   *
   * Validaciones de UI:
   * - Si la venta ya está cancelada (4), no se permite cambiar a otro estado.
   * - Si el estado no cambia realmente, no se hace llamada al backend.
   *
   * El backend hace validación fuerte:
   * - transiciones progresivas (1->2->3) o a 4
   * - bloqueo si ya está en 4
   * - lógica extra de movimiento de cartas en colecciones cuando llega a 3
   */
  const actualizarEstado = (ventaId, nuevoEstadoId) => {
    if (!nuevoEstadoId) return;

    const numericEstado = Number(nuevoEstadoId);

    // Se busca la venta actual para comparar estado anterior
    const ventaActual = ventas.find((v) => v.id === ventaId);
    if (!ventaActual) return;

    const estadoActual = getEstadoValue(ventaActual);

    // Si está cancelada, la UI bloquea el cambio (y el backend también lo rechazaría)
    if (estadoActual === 4 && numericEstado !== 4) {
      alert("No se puede modificar el estado de una venta cancelada.");
      return;
    }

    // Si el estado no cambia, no tiene sentido hacer PUT
    if (estadoActual === numericEstado) {
      return;
    }

    // Marca esta venta como "guardando" para deshabilitar su selector
    setSavingId(ventaId);

    axiosClient
      .put(`/admin/ventas/${ventaId}/estado`, {
        id_estado: numericEstado,
      })
      .then((res) => {
        const updated = res.data;

        // Actualización local: solo se sustituye la venta modificada
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
      {/* Encabezado reutilizable del panel */}
      <AdminTopbar title="Compras / Ventas" />

      <main className="px-6 py-6 max-w-6xl mx-auto w-full">
        {/* Estado de carga */}
        {loading ? (
          <p className="text-gray-500">Cargando ventas...</p>
        ) : (
          /* Estado de error */
          error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            /* Sin resultados */
            ventas.length === 0 ? (
              <p className="text-gray-500">
                No hay ventas para mostrar (o aún no has creado la API de admin
                para ventas).
              </p>
            ) : (
              /* Tabla con resultados */
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Cabecera de la tarjeta */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Histórico de compras / ventas
                  </h2>

                  {/* Recarga manual: vuelve a llamar al backend */}
                  <button
                    type="button"
                    onClick={cargarVentas}
                    className="text-sm text-red-600 hover:text-red-800 font-semibold"
                  >
                    Recargar
                  </button>
                </div>

                {/* Tabla con scroll horizontal para pantallas pequeñas */}
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
                        // comprador: relación cargada en el backend (Venta::comprador)
                        const comprador = v.comprador;

                        // vendedor: se obtiene desde la publicación original (Venta -> EnVenta -> Usuario)
                        const vendedor = v.en_venta?.usuario;

                        // estadoValue: estado actual normalizado a número
                        const estadoValue = getEstadoValue(v);

                        // bandera para UI: si cancelada, el selector se bloquea
                        const isCancelada = estadoValue === 4;

                        // allowedEstadosIds: lista de estados visibles según el estado actual
                        const allowedEstadosIds = getAllowedEstados(estadoValue);

                        return (
                          <tr
                            key={v.id}
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >
                            {/* Identificador de la venta */}
                            <td className="px-4 py-2 text-slate-700">{v.id}</td>

                            {/* Fecha de la venta (formateada en ES) */}
                            <td className="px-4 py-2 text-slate-700">
                              {v.fecha_venta
                                ? new Date(v.fecha_venta).toLocaleDateString(
                                    "es-ES"
                                  )
                                : "-"}
                            </td>

                            {/* Comprador con enlace al detalle del usuario */}
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

                            {/* Vendedor con enlace al detalle del usuario */}
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

                            {/* Selector de estado:
                                - muestra solo transiciones permitidas
                                - se deshabilita si está guardando o si ya está cancelada */}
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
                                {/* Opción neutra: sirve cuando no hay estado inicial */}
                                <option value="">
                                  {estadoValue ? "Seleccionar" : "Sin estado"}
                                </option>

                                {/* Opciones filtradas según allowedEstadosIds */}
                                {ESTADOS.filter((est) =>
                                  allowedEstadosIds.includes(est.id)
                                ).map((est) => (
                                  <option key={est.id} value={est.id}>
                                    {est.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Importe total: se prioriza precio_total, fallback a precio */}
                            <td className="px-4 py-2 font-semibold text-slate-900">
                              {Number(v.precio_total || v.precio || 0).toFixed(
                                2
                              )}{" "}
                              €
                            </td>
                          </tr>
                        );
                      })}
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
