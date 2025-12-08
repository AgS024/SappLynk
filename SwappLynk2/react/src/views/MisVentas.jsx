// react/src/views/MisVentas.jsx
import { useEffect, useState } from "react";
import PageComponent from "../components/PageComponent.jsx";
import axiosClient from "../axios.js";
import { useStateContext } from "../Contexts/ContextProvider.jsx";

export default function MisVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);

  const { setMisVentas } = useStateContext();

  // Estado para la valoración
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [rating, setRating] = useState(10); // 0–10
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorValoracion, setErrorValoracion] = useState(null);

  useEffect(() => {
    cargarVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarVentas = () => {
    setLoading(true);
    axiosClient
      .get("/ventas")
      .then((res) => {
        console.log("Compras recibidas:", res.data);
        setVentas(res.data || []);
        setMisVentas(res.data || []);
      })
      .catch((err) => {
        console.error("Error cargando compras:", err);
        setVentas([]);
      })
      .finally(() => setLoading(false));
  };

  // ==========================
  //   HELPERS PARA PINTAR
  // ==========================

  const getEnVenta = (venta) => {
    // Preferimos snake_case, pero dejamos compatibilidad con camelCase
    return venta.en_venta || venta.enVenta || {};
  };

  const getCardInfo = (venta) => {
    const enVenta = getEnVenta(venta);
    // TCGdex viene de VentaController@index -> en_venta.tcgdex
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
      posiblesImagenes[0] ||
      "https://via.placeholder.com/80x110?text=Sin+imagen";

    const nombreCarta = tcg.name || enVenta.id_carta || "Carta sin nombre";

    return { imageUrl, nombreCarta };
  };

  const getVendedor = (venta) => {
    const enVenta = getEnVenta(venta);
    return enVenta.usuario || null;
  };

  const getNombreVendedor = (venta) => {
    const vendedor = getVendedor(venta);
    if (!vendedor) return "Vendedor desconocido";

    if (vendedor.name) return vendedor.name;

    return `Usuario #${vendedor.id}`;
  };

  const yaValorada = (venta) => {
    return Array.isArray(venta.valoraciones) && venta.valoraciones.length > 0;
  };

  // Estado de la venta (1,2,3,4...)
  const getEstadoVenta = (venta) => {
    if (venta.id_estado) return Number(venta.id_estado);
    if (venta.estado?.id) return Number(venta.estado.id);
    return null; // sin estado -> compatibilidad (trataremos como que se puede valorar)
  };

  // Solo se puede valorar si estado es:
  // 2 = Recibido, 3 = Enviado
  // NO se puede valorar si 1 = Esperando recibir o 4 = Cancelada
  const sePuedeValorar = (venta) => {
    const estado = getEstadoVenta(venta);
    if (estado === null) return true; // por si hay ventas antiguas sin estado
    return estado === 2 || estado === 3;
  };

  // ==========================
  //   LÓGICA DEL MODAL
  // ==========================

  const abrirModalValoracion = (venta) => {
    if (yaValorada(venta)) {
      alert("Ya has valorado esta compra.");
      return;
    }

    if (!sePuedeValorar(venta)) {
      alert(
        "Solo puedes valorar cuando la compra está en estado recibido o enviado."
      );
      return;
    }

    setVentaSeleccionada(venta);
    setRating(10); // valor por defecto 10 (0–10)
    setComentario("");
    setErrorValoracion(null);
    setModalAbierto(true);
  };

  const cerrarModalValoracion = () => {
    setModalAbierto(false);
    setVentaSeleccionada(null);
  };

  const handleEnviarValoracion = () => {
    if (!ventaSeleccionada) return;

    // Doble check por si el estado ha cambiado mientras el modal estaba abierto
    if (!sePuedeValorar(ventaSeleccionada)) {
      setErrorValoracion(
        "El estado de la compra ha cambiado. Solo puedes valorar cuando está en recibido o enviado."
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

        // Actualizamos el estado local
        setVentas((prev) =>
          prev.map((v) =>
            v.id === ventaSeleccionada.id
              ? {
                  ...v,
                  valoraciones: [...(v.valoraciones || []), nuevaValoracion],
                }
              : v
          )
        );

        // Y también el contexto global
        setMisVentas((prev = []) =>
          (prev || []).map((v) =>
            v.id === ventaSeleccionada.id
              ? {
                  ...v,
                  valoraciones: [...(v.valoraciones || []), nuevaValoracion],
                }
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
          <p className="text-gray-500">Aún no has realizado compras</p>
        </div>
      ) : (
        <div className="relative">
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
                      {/* COLUMNA CARTA: SOLO IMAGEN */}
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

                      {/* COLUMNA VENDEDOR */}
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {vendedorNombre}
                      </td>

                      {/* COLUMNA PRECIO */}
                      <td className="px-4 py-2 font-bold text-sm">
                        €{Number(venta.precio_total).toFixed(2)}
                      </td>

                      {/* COLUMNA FECHA */}
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {venta.fecha_venta
                          ? new Date(
                              venta.fecha_venta
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      {/* COLUMNA ACCIONES */}
                      <td className="px-4 py-2">
                        {valorada ? (
                          <span className="text-xs text-gray-500">
                            Ya valorado
                          </span>
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

          {/* MODAL DE VALORACIÓN */}
          {modalAbierto && ventaSeleccionada && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Valorar al vendedor
                </h2>

                <p className="text-sm text-gray-600">
                  Estás valorando a{" "}
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
