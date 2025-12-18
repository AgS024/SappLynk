// react/src/views/MisCartasEnVenta.jsx

// Hooks de React:
// - useState: guardar estado local (publicaciones, loading, precios editados, confirmación)
// - useEffect: cargar datos al entrar en la vista
import { useEffect, useState } from "react";

// Componente de layout (título + contenedor)
import PageComponent from "../shared/components/PageComponent.jsx";

// Cliente Axios para llamadas al backend
import axiosClient from "../axios.js";

// Contexto global:
// - setCartasEnVenta: guardar el listado en el contexto por si se usa en otras pantallas
import { useStateContext } from "../Contexts/ContextProvider.jsx";

export default function MisCartasEnVenta() {
  // Listado de publicaciones propias activas (GET /enventa/mias)
  const [publicaciones, setPublicaciones] = useState([]);

  // Indicador de carga mientras se consulta el backend
  const [loading, setLoading] = useState(false);

  // Estado auxiliar para edición de precios:
  // se guarda un “diccionario” { [idPublicacion]: nuevoPrecioEnString/Number }
  // para permitir escribir en el input sin pisar el valor original hasta guardar.
  const [preciosEdit, setPreciosEdit] = useState({});

  // Setter del contexto global para sincronizar el listado de cartas en venta
  const { setCartasEnVenta } = useStateContext();

  // Id de la publicación que está en modo “confirmación de retirada”.
  // Solo una publicación puede estar confirmándose a la vez.
  const [pubIdConfirm, setPubIdConfirm] = useState(null);

  // Carga inicial al montar la pantalla
  useEffect(() => {
    cargarMisPublicaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * cargarMisPublicaciones
   *
   * Pide al backend las publicaciones del usuario autenticado.
   * Se guardan en estado local para renderizar, y también en contexto si interesa reutilizarlas.
   */
  const cargarMisPublicaciones = () => {
    setLoading(true);

    axiosClient
      .get("/enventa/mias")
      .then((res) => {
        console.log("Mis cartas en venta:", res.data);

        const data = Array.isArray(res.data) ? res.data : [];
        setPublicaciones(data);

        if (setCartasEnVenta) {
          setCartasEnVenta(data);
        }
      })
      .catch((err) => {
        console.error("Error cargando mis cartas en venta:", err);
        setPublicaciones([]);
      })
      .finally(() => setLoading(false));
  };

  /**
   * handlePrecioChange
   *
   * Actualiza el precio “temporal” de una publicación concreta.
   * No se guarda en backend hasta pulsar “Guardar precio”.
   */
  const handlePrecioChange = (id, valor) => {
    setPreciosEdit((prev) => ({
      ...prev,
      [id]: valor,
    }));
  };

  /**
   * handleGuardarPrecio
   *
   * Valida el precio introducido y lo envía al backend.
   * Si la API responde con la publicación actualizada, se reemplaza esa publicación en el listado local.
   */
  const handleGuardarPrecio = (pub) => {
    console.log("Click en GUARDAR PRECIO para:", pub);

    const nuevoPrecioStr = preciosEdit[pub.id] ?? pub.precio;
    const nuevoPrecio = Number(nuevoPrecioStr);

    // Validación mínima para evitar valores inválidos
    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
      alert("Introduce un precio válido mayor que 0.");
      return;
    }

    axiosClient
      .put(`/enventa/${pub.id}`, { precio: nuevoPrecio })
      .then((res) => {
        console.log("Respuesta actualización precio:", res.data);

        // Según cómo responda el backend, puede venir { en_venta: ... } o el objeto directo
        const actualizada = res.data.en_venta ?? res.data;

        // Actualización inmutable del array: solo se cambia la publicación editada
        setPublicaciones((prev) =>
          prev.map((p) => (p.id === pub.id ? { ...p, ...actualizada } : p))
        );

        // Se sincroniza el input con el valor guardado
        setPreciosEdit((prev) => ({
          ...prev,
          [pub.id]: actualizada.precio,
        }));
      })
      .catch((err) => {
        console.error("Error actualizando precio:", err);
        alert("No se ha podido actualizar el precio.");
      });
  };

  /**
   * handleRetirarClick
   *
   * Primer click en “Retirar”:
   * activa el modo confirmación para esa publicación (no se llama todavía a la API).
   */
  const handleRetirarClick = (pub) => {
    console.log("Primer click en RETIRAR para:", pub);
    setPubIdConfirm(pub.id);
  };

  /**
   * handleConfirmarRetirada
   *
   * Segundo paso:
   * realiza el DELETE en backend y, si va bien, elimina la publicación del listado local.
   * La lógica de “devolver 1 copia a colección” se asume en el backend.
   */
  const handleConfirmarRetirada = (pub) => {
    console.log("Confirmando retirada para:", pub);

    axiosClient
      .delete(`/enventa/${pub.id}`)
      .then((res) => {
        console.log("Carta retirada correctamente:", res.data);

        // Se quita del listado local para reflejar cambios al instante
        setPublicaciones((prev) => prev.filter((p) => p.id !== pub.id));

        // Se cierra el modo confirmación
        setPubIdConfirm(null);
      })
      .catch((err) => {
        console.error("Error retirando carta de la venta:", err);
        alert("No se ha podido retirar la carta de la venta.");
        setPubIdConfirm(null);
      });
  };

  /**
   * handleCancelarRetirada
   *
   * Sale del modo confirmación sin hacer cambios.
   */
  const handleCancelarRetirada = () => {
    console.log("Cancelando retirada");
    setPubIdConfirm(null);
  };

  // Helpers para obtener datos TCG (imagen / nombre / set) de forma tolerante
  const getImageUrl = (pub) => {
    const tcg = pub.tcgdex || pub.carta || {};
    return (
      tcg.images?.small ||
      tcg.image?.normal ||
      pub.image ||
      tcg.image ||
      "https://via.placeholder.com/250x350?text=Sin+imagen"
    );
  };

  const getNombreCarta = (pub) => {
    const tcg = pub.tcgdex || pub.carta || {};
    return tcg.name || "Carta sin nombre";
  };

  const getSetName = (pub) => {
    const tcg = pub.tcgdex || pub.carta || {};
    const setObj = tcg.set;

    if (setObj) {
      if (typeof setObj.name === "string") return setObj.name;
      if (typeof setObj.name === "object") {
        return (
          setObj.name.es ||
          setObj.name.en ||
          Object.values(setObj.name)[0] ||
          "Set desconocido"
        );
      }
    }

    return "Set desconocido";
  };

  return (
    <PageComponent title="Mis cartas en venta">
      {/* Estado de carga */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">⏳ Cargando tus cartas en venta...</p>
        </div>
      ) : publicaciones.length === 0 ? (
        // Estado vacío
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            📭 Ahora mismo no hay cartas publicadas en venta.
          </p>
        </div>
      ) : (
        // Grid de publicaciones propias
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicaciones.map((pub) => {
            // Precio mostrado en input:
            // si existe precio editado para esa publicación, se usa ese; si no, el del backend
            const precioActual =
              preciosEdit[pub.id] !== undefined ? preciosEdit[pub.id] : pub.precio;

            // Solo la publicación cuyo id coincide entra en modo confirmación
            const enConfirmacion = pubIdConfirm === pub.id;

            return (
              <div
                key={pub.id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
              >
                {/* Imagen */}
                <div className="bg-gray-100 h-64 flex items-center justify-center">
                  <img
                    src={getImageUrl(pub)}
                    alt={getNombreCarta(pub)}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/250x350?text=Sin+imagen";
                    }}
                  />
                </div>

                {/* Info + acciones */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm truncate text-gray-900">
                      {getNombreCarta(pub)}
                    </h3>
                    <p className="text-gray-600 text-xs mt-1">{getSetName(pub)}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      Grado:{" "}
                      <span className="font-semibold">
                        {pub.grado?.nombre || `ID grado ${pub.id_grado}`}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    {/* Edición de precio */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Precio (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={precioActual}
                        onChange={(e) => handlePrecioChange(pub.id, e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none text-sm"
                      />
                    </div>

                    {/* Confirmación de retirada sin modal externo: se cambia el bloque de botones */}
                    {enConfirmacion ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <p className="text-xs text-gray-700">
                          ¿Seguro que quieres retirar esta carta de la venta? Al retirarla,
                          se devuelve 1 copia a la colección.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleConfirmarRetirada(pub)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
                          >
                            Confirmar retirada
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelarRetirada}
                            className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-semibold"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleGuardarPrecio(pub)}
                          className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold"
                        >
                          Guardar precio
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRetirarClick(pub)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
                        >
                          Retirar
                        </button>
                      </div>
                    )}

                    {/* Texto de ayuda cuando no está en confirmación */}
                    {!enConfirmacion && (
                      <p className="text-xs text-gray-500 mt-1">
                        Al retirar la carta, se devuelve 1 copia a la colección.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageComponent>
  );
}
