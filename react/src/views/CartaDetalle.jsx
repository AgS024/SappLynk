// Hooks de React:
// - useState: gestionar estado local (carta, copias, loading, errores y modal)
// - useEffect: ejecutar cargas al montar el componente y cuando cambia el id de la ruta
import { useEffect, useState } from "react";

// React Router:
// - useParams: leer el parámetro :id de la URL (id de carta tipo "swsh1-1")
// - useNavigate: navegar de forma programática (en este componente se deja preparado para usarlo)
import { useParams, useNavigate } from "react-router-dom";

// Componente de layout: cabecera con título + contenedor central de la página
import PageComponent from "../shared/components/PageComponent.jsx";

// Cliente Axios configurado para hablar con el backend (baseURL + token)
import axiosClient from "../axios.js";

// Modal reutilizable para publicar una carta en venta (cantidad, precio, notas)
import ModalPublicarVenta from "../features/coleccion/components/ModalPublicarVenta.jsx";

export default function CartaDetalle() {
  /**
   * id:
   * - Identificador de la carta según TCGdex (ej: "swsh1-1")
   * - Se usa para pedir:
   *   GET /cartas/{id}               -> detalles de la carta (API proxy backend)
   *   GET /coleccion/carta/{id}     -> copias que existen en la colección del usuario
   */
  const { id } = useParams();

  // Navegación programática (queda por si se decide redirigir tras publicar, etc.)
  const navigate = useNavigate();

  /**
   * carta:
   * - Objeto con info de la carta (desde /cartas/{id})
   * - Dependiendo de cómo venga del backend, puede incluir:
   *   carta.tcgdex / carta.data / carta.carta ... (por eso se normaliza más abajo)
   */
  const [carta, setCarta] = useState(null);

  // Estados de carga / error específicos para la petición de la carta
  const [loadingCarta, setLoadingCarta] = useState(true);
  const [errorCarta, setErrorCarta] = useState(null);

  /**
   * misCopias:
   * - Array de entradas de colección para ESA carta, normalmente separadas por grado (id_grado)
   * - Cada entrada suele traer: id_carta, id_grado, cantidad, notas, y a veces relación grado
   */
  const [misCopias, setMisCopias] = useState([]);

  // Estado de carga para la petición de copias en colección
  const [loadingCopias, setLoadingCopias] = useState(true);

  /**
   * Estados del modal de publicación:
   * - mostrarModalVenta: abre/cierra el modal
   * - copiaSeleccionada: entrada concreta (grado/cantidad/notas) sobre la que se va a publicar
   */
  const [mostrarModalVenta, setMostrarModalVenta] = useState(false);
  const [copiaSeleccionada, setCopiaSeleccionada] = useState(null);

  /**
   * useEffect principal:
   * - Cada vez que cambia el id de la ruta se vuelve a cargar:
   *   1) la información de la carta
   *   2) las copias del usuario en su colección para esa carta
   *
   * Nota:
   * - Son dos llamadas independientes para separar estados de carga/errores y evitar mezclar datos.
   */
  useEffect(() => {
    cargarCarta();
    cargarMisCopias();
  }, [id]);

  /**
   * cargarCarta
   *
   * GET /cartas/{id}
   * - Pide al backend la información de la carta (normalmente proxy/servicio a TCGdex)
   * - Controla loadingCarta y errorCarta para mostrar feedback en la UI
   */
  const cargarCarta = () => {
    setLoadingCarta(true);
    setErrorCarta(null);

    axiosClient
      .get(`/cartas/${id}`)
      .then((res) => {
        setCarta(res.data);
      })
      .catch((err) => {
        console.error("Error cargando carta:", err);
        setErrorCarta("No se ha podido cargar la información de la carta.");
      })
      .finally(() => setLoadingCarta(false));
  };

  /**
   * cargarMisCopias
   *
   * GET /coleccion/carta/{id}
   * - Pide al backend las entradas de colección del usuario para esa carta
   * - Se espera un array (una fila por grado / condición, normalmente)
   *
   * Importante:
   * - Si el backend devuelve un objeto en vez de array, se fuerza a [] para evitar crashes.
   */
  const cargarMisCopias = () => {
    setLoadingCopias(true);

    axiosClient
      .get(`/coleccion/carta/${id}`)
      .then((res) => {
        setMisCopias(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Error cargando copias en colección:", err);
        setMisCopias([]);
      })
      .finally(() => setLoadingCopias(false));
  };

  /**
   * abrirModalVenta
   * - Guarda qué copia se ha seleccionado (por ejemplo, grado 7 con cantidad 3)
   * - Abre el modal para introducir cantidad/precio/notas de la publicación
   */
  const abrirModalVenta = (copia) => {
    setCopiaSeleccionada(copia);
    setMostrarModalVenta(true);
  };

  /**
   * cerrarModalVenta
   * - Cierra el modal y limpia la copia seleccionada para no dejar estado sucio
   */
  const cerrarModalVenta = () => {
    setMostrarModalVenta(false);
    setCopiaSeleccionada(null);
  };

  /**
   * handleConfirmarVenta
   *
   * Se ejecuta cuando el modal devuelve los datos de publicación:
   * - cantidad
   * - precio
   * - notas
   *
   * POST /enventa
   * - Crea una publicación (en_venta) asociada a:
   *   - id_carta
   *   - id_grado (para mantener la condición)
   *   - cantidad (puede ser >1 si se permite vender varias copias en una publicación)
   *
   * Después:
   * - se recargan las copias con cargarMisCopias() para reflejar el estado actual
   *   (aunque este componente no resta cantidad localmente, eso depende de cómo lo gestione el backend)
   */
  const handleConfirmarVenta = (datosVenta) => {
    if (!copiaSeleccionada) return;

    const payload = {
      id_carta: copiaSeleccionada.id_carta || id,
      id_grado: copiaSeleccionada.id_grado,
      cantidad: datosVenta.cantidad,
      precio: datosVenta.precio,
      notas: datosVenta.notas || "",
    };

    axiosClient
      .post("/enventa", payload)
      .then(() => {
        cargarMisCopias();
        cerrarModalVenta();

        // Posible mejora: redirigir a la pantalla de publicaciones del usuario
        // navigate("/mis-cartas-en-venta");
      })
      .catch((err) => {
        console.error("Error al publicar la carta en venta:", err);
        alert("No se ha podido publicar la carta en venta.");
      });
  };

  /**
   * getImageUrl
   *
   * Devuelve la mejor imagen posible de la carta:
   * - Prioriza imágenes grandes/hires si existen
   * - Si falla, cae a small/normal
   * - Si no hay nada, placeholder
   *
   * Se usa tanto para el render principal como para fallback visual consistente.
   */
  const getImageUrl = () => {
    if (!carta) return "https://via.placeholder.com/300x420?text=Sin+imagen";

    const tcg = carta.tcgdex || carta.data || carta.carta || carta;

    return (
      tcg.images?.large ||
      tcg.image?.hires ||
      tcg.images?.small ||
      tcg.image?.normal ||
      carta.image ||
      tcg.image ||
      "https://via.placeholder.com/300x420?text=Sin+imagen"
    );
  };

  /**
   * getSetName
   *
   * Intenta resolver el nombre del set desde el objeto de la carta:
   * - Si viene tcg.set con name (string u objeto multilenguaje), se usa eso.
   * - Si no existe, se hace un fallback simple desde el id:
   *   "swsh1-1" -> "swsh1"
   *
   * Esto evita que la UI se quede vacía si el backend no trae el set completo.
   */
  const getSetName = () => {
    if (!carta) return "Set desconocido";
    const tcg = carta.tcgdex || carta.data || carta.carta || carta;

    const setObj =
      tcg.set ||
      carta.tcgdex?.set ||
      carta.data?.set ||
      carta.carta?.set ||
      carta.set;

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

    const tcgId = tcg.id || carta.id;
    if (tcgId) {
      const [setCode] = String(tcgId).split("-");
      return setCode || "Set desconocido";
    }

    return "Set desconocido";
  };

  /**
   * renderInfoCarta
   *
   * Renderiza el bloque superior con imagen y atributos principales.
   * Maneja 3 estados:
   * - loadingCarta: mensaje de carga
   * - errorCarta: mensaje de error
   * - carta: render real con datos
   *
   * Se extraen campos comunes de TCGdex:
   * - name, rarity, hp, types, number
   */
  const renderInfoCarta = () => {
    if (loadingCarta) {
      return <p className="text-gray-500">Cargando carta...</p>;
    }

    if (errorCarta) {
      return <p className="text-red-600">{errorCarta}</p>;
    }

    if (!carta) {
      return <p className="text-gray-500">No se encontró la carta.</p>;
    }

    const tcg = carta.tcgdex || carta.data || carta.carta || carta;

    const name = tcg.name || "Carta sin nombre";
    const rarity = tcg.rarity || "Desconocida";
    const hp = tcg.hp || "—";
    const types = Array.isArray(tcg.types)
      ? tcg.types.join(", ")
      : tcg.types || "—";

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Imagen principal de la carta */}
        <div className="flex justify-center">
          <img
            src={getImageUrl()}
            alt={name}
            className="w-full max-w-sm rounded-xl shadow-lg bg-white"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/300x420?text=Sin+imagen";
            }}
          />
        </div>

        {/* Panel de información: nombre, set y datos básicos */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
          <p className="text-sm text-gray-600">{getSetName()}</p>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Rareza</p>
              <p className="text-gray-800">{rarity}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">HP</p>
              <p className="text-gray-800">{hp}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Tipos</p>
              <p className="text-gray-800">{types}</p>
            </div>
            {tcg.number && (
              <div>
                <p className="font-semibold text-gray-700">Número en set</p>
                <p className="text-gray-800">{tcg.number}</p>
              </div>
            )}
          </div>

          {/* Posible ampliación: ataques, debilidades, descripción, etc. */}
        </div>
      </div>
    );
  };

  /**
   * renderMisCopias
   *
   * Renderiza el bloque "Tus copias en colección":
   * - loadingCopias: mensaje de carga
   * - sin copias: mensaje informativo
   * - con copias: lista de tarjetas (una por entrada de colección)
   *
   * Cada copia muestra:
   * - grado/condición
   * - cantidad disponible
   * - notas (si existen)
   * - botón para abrir el modal de publicación en venta
   */
  const renderMisCopias = () => {
    if (loadingCopias) {
      return <p className="text-gray-500">Cargando tus copias...</p>;
    }

    if (!misCopias || misCopias.length === 0) {
      return (
        <p className="text-gray-500">
          No tienes esta carta en tu colección (o aún no se ha añadido).
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {misCopias.map((copia) => {
          const gradoNombre =
            copia.grado?.nombre || `Grado ${copia.id_grado || "?"}`;
          const cantidad = copia.cantidad || 1;
          const notas = copia.notas;

          // Key robusta:
          // - si hay id interno, se usa
          // - si no, se compone por (id_carta + id_grado) y un sufijo aleatorio
          // Nota: el random evita colisiones, pero hace que React no pueda reutilizar filas
          // si se re-renderiza (mejorable si existe una key estable).
          const key =
            copia.id ||
            `${copia.id_carta}-${copia.id_grado}-${Math.random()
              .toString(36)
              .slice(2)}`;

          return (
            <div
              key={key}
              className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white"
            >
              {/* Datos de la copia en colección */}
              <div>
                <p className="font-semibold text-gray-900">
                  {gradoNombre} — x{cantidad}
                </p>
                {notas && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Notas:</span> {notas}
                  </p>
                )}
              </div>

              {/* Acción: publicar esta copia/grado en venta */}
              <div className="flex gap-2">
                <button
                  onClick={() => abrirModalVenta(copia)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                >
                  💸 Poner en venta
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Render principal:
   * - PageComponent envuelve la vista con layout común
   * - Se pinta:
   *   1) información de la carta
   *   2) listado de copias del usuario (si existen)
   * - Si el modal está activo, se monta ModalPublicarVenta con callbacks
   */
  return (
    <PageComponent title="Detalle de carta">
      <div className="space-y-10">
        {/* Bloque superior: datos de la carta */}
        {renderInfoCarta()}

        {/* Bloque inferior: copias que existen en la colección del usuario */}
        <section className="mt-10">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Tus copias en colección
          </h3>
          {renderMisCopias()}
        </section>
      </div>

      {/* Modal de publicación en venta */}
      {mostrarModalVenta && copiaSeleccionada && (
        <ModalPublicarVenta
          copia={copiaSeleccionada}
          carta={carta}
          onConfirm={handleConfirmarVenta}
          onCancel={cerrarModalVenta}
        />
      )}
    </PageComponent>
  );
}
