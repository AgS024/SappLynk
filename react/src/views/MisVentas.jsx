// react/src/views/MisVentas.jsx

// Hooks de React:
// - useState: guardar estado local (ventas, loading, modal, rating, comentario, etc.)
// - useEffect: cargar las compras al entrar en la pantalla
import { useEffect, useState } from "react";

// Componente de layout común (título + contenedor)
import PageComponent from "../shared/components/PageComponent.jsx";

// Cliente Axios configurado para hablar con el backend
import axiosClient from "../axios.js";

// Contexto global:
// - setMisVentas: guardar también las compras en contexto (por si otras vistas las usan)
import { useStateContext } from "../Contexts/ContextProvider.jsx";

export default function MisVentas() {
  // Listado de compras realizadas por el usuario (GET /ventas)
  const [ventas, setVentas] = useState([]);

  // Estado de carga general de la tabla
  const [loading, setLoading] = useState(false);

  // Setter del contexto para sincronizar el listado global de compras
  const { setMisVentas } = useStateContext();

  // ==========================
  //   ESTADO DEL MODAL (VALORACIÓN)
  // ==========================

  // Controla si el modal se muestra o no
  const [modalAbierto, setModalAbierto] = useState(false);

  // Venta que se está valorando en el modal
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  // Puntuación elegida en el modal (0–10)
  const [rating, setRating] = useState(10);

  // Comentario opcional de la valoración
  const [comentario, setComentario] = useState("");

  // Estado de “enviando” para deshabilitar inputs/botones mientras se guarda
  const [enviando, setEnviando] = useState(false);

  // Mensaje de error específico del flujo de valoración
  const [errorValoracion, setErrorValoracion] = useState(null);

  // Carga inicial de compras al montar la vista
  useEffect(() => {
    cargarVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * cargarVentas
   *
   * Pide al backend el histórico de compras del usuario autenticado.
   * Se guarda en el estado local para renderizarlo y también en contexto para reutilización.
   */
  const cargarVentas = () => {
    setLoading(true);

    axiosClient
      .get("/ventas")
      .then((res) => {
        console.log("Compras recibidas:", res.data);

        const data = Array.isArray(res.data) ? res.data : [];
        setVentas(data);

        // Copia al contexto para mantener consistencia con otras pantallas
        setMisVentas(data);
      })
      .catch((err) => {
        console.error("Error cargando compras:", err);
        setVentas([]);
      })
      .finally(() => setLoading(false));
  };

  // ==========================
  //   HELPERS PARA LEER DATOS
  // ==========================

  /**
   * getEnVenta
   *
   * Dentro de una venta suele venir el objeto en_venta, que contiene:
   * - id_carta, precio, usuario (vendedor), y tcgdex (datos de la carta)
   *
   * Se mantiene compatibilidad con camelCase por si aparece en alguna respuesta antigua.
   */
  const getEnVenta = (venta) => {
    return venta.en_venta || venta.enVenta || {};
  };

  /**
   * getCardInfo
   *
   * Extrae lo necesario para mostrar la carta en la tabla:
   * - imagen pequeña (o placeholder)
   * - nombre (o id de carta)
   *
   * Los datos de la carta vienen anidados como en_venta.tcgdex.
   */
  const getCardInfo = (venta) => {
    const enVenta = getEnVenta(venta);
    const tcg = enVenta.tcgdex || {};

    const posiblesImagenes = [
      tcg.images?.small,
      tcg.images?.large,
      tcg.image?.normal,
      tcg.image?.hires,
      tcg.image,
      enVenta.image,
    ].filter(Boolean);

    const imageUrl =
      posiblesImagenes[0] || "https://via.placeholder.com/80x110?text=Sin+imagen";

    const nombreCarta = tcg.name || enVenta.id_carta || "Carta sin nombre";

    return { imageUrl, nombreCarta };
  };

  /**
   * getVendedor
   *
   * Devuelve el usuario vendedor asociado a la publicación de en_venta.
   */
  const getVendedor = (venta) => {
    const enVenta = getEnVenta(venta);
    return enVenta.usuario || null;
  };

  /**
   * getNombreVendedor
   *
   * Formatea un nombre legible del vendedor.
   */
  const getNombreVendedor = (venta) => {
    const vendedor = getVendedor(venta);
    if (!vendedor) return "Vendedor desconocido";
    if (vendedor.name) return vendedor.name;
    return `Usuario #${vendedor.id}`;
  };

  /**
   * yaValorada
   *
   * Indica si la compra ya tiene valoraciones asociadas.
   * La vista lo usa para deshabilitar el botón “Valorar”.
   */
  const yaValorada = (venta) => {
    return Array.isArray(venta.valoraciones) && venta.valoraciones.length > 0;
  };

  /**
   * getEstadoVenta
   *
   * Devuelve el id numérico del estado de la venta:
   * - venta.id_estado (snake_case)
   * - venta.estado.id (si viene anidado)
   * Si no existe, devuelve null por compatibilidad con ventas antiguas.
   */
  const getEstadoVenta = (venta) => {
    if (venta.id_estado) return Number(venta.id_estado);
    if (venta.estado?.id) return Number(venta.estado.id);
    return null;
  };

  /**
   * sePuedeValorar
   *
   * Reglas de negocio para permitir valoración:
   * - Permitido si estado es 2 (Recibido) o 3 (Enviado).
   * - No permitido si 1 (Esperando recibir) o 4 (Cancelada).
   * - Si el estado es null, se permite por compatibilidad.
   */
  const sePuedeValorar = (venta) => {
    const estado = getEstadoVenta(venta);
    if (estado === null) return true;
    return estado === 2 || estado === 3;
  };

  // ==========================
  //   LÓGICA DEL MODAL
  // ==========================

  /**
   * abrirModalValoracion
   *
   * Abre el modal para valorar una compra concreta.
   * Antes se valida:
   * - que no esté ya valorada
   * - que el estado permita valorar
   */
  const abrirModalValoracion = (venta) => {
    if (yaValorada(venta)) {
      alert("Ya has valorado esta compra.");
      return;
    }

    if (!sePuedeValorar(venta)) {
      alert("Solo se puede valorar cuando la compra está en recibido o enviado.");
      return;
    }

    setVentaSeleccionada(venta);
    setRating(10);
    setComentario("");
    setErrorValoracion(null);
    setModalAbierto(true);
  };

  /**
   * cerrarModalValoracion
   *
   * Cierra el modal y limpia la venta seleccionada.
   */
  const cerrarModalValoracion = () => {
    setModalAbierto(false);
    setVentaSeleccionada(null);
  };

  /**
   * handleEnviarValoracion
   *
   * Envía la valoración al backend:
   * POST /valoraciones con:
   * - id_valorado: id del vendedor
   * - id_venta: id de la compra
   * - valor: puntuación 0–10
   * - descripcion: comentario opcional
   *
   * Si sale bien, se añade la nueva valoración al estado local y al contexto.
   */
  const handleEnviarValoracion = () => {
    if (!ventaSeleccionada) return;

    // Revalidación por si el estado cambió durante el modal
    if (!sePuedeValorar(ventaSeleccionada)) {
      setErrorValoracion(
        "El estado de la compra ha cambiado. Solo se puede valorar cuando está en recibido o enviado."
      );
      return;
    }

    const vendedor = getVendedor(ventaSeleccionada);
    if (!vendedor?.id) {
      setErrorValoracion("No se ha podido determinar el vendedor.");
      return;
    }

    setEnviando(true);
    setErrorValoracion(null);

    axiosClient
      .post("/valoraciones", {
        id_valorado: vendedor.id,
        id_venta: ventaSeleccionada.id,
        valor: Number(rating),
        descripcion: comentario || null,
      })
      .then((res) => {
        const nuevaValoracion = res.data;

        // Actualiza el listado local para que aparezca “Ya valorado” sin recargar
        setVentas((prev) =>
          prev.map((v) =>
            v.id === ventaSeleccionada.id
              ? { ...v, valoraciones: [...(v.valoraciones || []), nuevaValoracion] }
              : v
          )
        );

        // Actualiza el contexto global con la misma idea
        setMisVentas((prev = []) =>
          (prev || []).map((v) =>
            v.id === ventaSeleccionada.id
              ? { ...v, valoraciones: [...(v.valoraciones || []), nuevaValoracion] }
              : v
          )
        );

        cerrarModalValoracion();
      })
      .catch((err) => {
        console.error("Error guardando valoración:", err);
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "No se ha podido guardar la valoración.";
        setErrorValoracion(msg);
      })
      .finally(() => setEnviando(false));
  };

  // ==========================
  //   RENDER
  // ==========================

  return (
    <PageComponent title="Mis Compras">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando compras...</p>
        </div>
      ) : ventas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Aún no hay compras realizadas</p>
        </div>
      ) : (
        <div className="relative">
          {/* Tabla responsive: lista de compras */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Carta</th>
                  <th className="px-4 py-2 text-left">Vendedor</th>
                  <th className="px-4 py-2 text-left">Precio</th>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => {
                  const { imageUrl } = getCardInfo(venta);
                  const vendedorNombre = getNombreVendedor(venta);
                  const valorada = yaValorada(venta);
                  const puedeValorar = sePuedeValorar(venta);

                  return (
                    <tr
                      key={venta.id}
                      className="border-b hover:bg-gray-50 align-middle"
                    >
                      {/* Columna carta: solo imagen pequeña */}
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          <img
                            src={imageUrl}
                            alt="Carta comprada"
                            className="w-12 h-16 object-cover rounded-md border"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/80x110?text=Sin+imagen";
                            }}
                          />
                        </div>
                      </td>

                      {/* Columna vendedor */}
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {vendedorNombre}
                      </td>

                      {/* Columna precio total */}
                      <td className="px-4 py-2 font-bold text-sm">
                        €{Number(venta.precio_total).toFixed(2)}
                      </td>

                      {/* Columna fecha */}
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {venta.fecha_venta
                          ? new Date(venta.fecha_venta).toLocaleDateString()
                          : "-"}
                      </td>

                      {/* Acciones: valorar solo si cumple reglas */}
                      <td className="px-4 py-2">
                        {valorada ? (
                          <span className="text-xs text-gray-500">Ya valorado</span>
                        ) : !puedeValorar ? (
                          <span className="text-xs text-gray-400">
                            Valoración no disponible
                          </span>
                        ) : (
                          <button
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                            onClick={() => abrirModalValoracion(venta)}
                          >
                            Valorar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Modal de valoración */}
          {modalAbierto && ventaSeleccionada && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Valorar al vendedor
                </h2>

                <p className="text-sm text-gray-600">
                  Valoración para{" "}
                  <span className="font-semibold">
                    {getNombreVendedor(ventaSeleccionada)}
                  </span>{" "}
                  por la compra de{" "}
                  <span className="font-semibold">
                    {getCardInfo(ventaSeleccionada).nombreCarta}
                  </span>
                  .
                </p>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Puntuación (0–10)
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={enviando}
                  >
                    <option value={10}>10 - Excelente</option>
                    <option value={9}>9 - Muy bien</option>
                    <option value={8}>8 - Muy bien</option>
                    <option value={7}>7 - Bien</option>
                    <option value={6}>6 - Correcto</option>
                    <option value={5}>5 - Normal</option>
                    <option value={4}>4 - Regular</option>
                    <option value={3}>3 - Malo</option>
                    <option value={2}>2 - Muy malo</option>
                    <option value={1}>1 - Terrible</option>
                    <option value={0}>0 - Nefasto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Comentario (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ej: Muy buen trato, carta en perfecto estado."
                    disabled={enviando}
                  />
                </div>

                {errorValoracion && (
                  <p className="text-sm text-red-600">{errorValoracion}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={cerrarModalValoracion}
                    disabled={enviando}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEnviarValoracion}
                    disabled={enviando}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-semibold disabled:opacity-60"
                  >
                    {enviando ? "Guardando..." : "Guardar valoración"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </PageComponent>
  );
}
