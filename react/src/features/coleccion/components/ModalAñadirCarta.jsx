// useState: estados del modal (cantidad, grado, notas, loading...)
// useEffect: para inicializar la lista de grados una vez al montar el componente
import { useState, useEffect } from "react";

// Cliente axios configurado para hablar con el backend (Laravel)
import axiosClient from "../../../axios.js";

// Icono para el botón de cerrar (X)
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * ModalAñadirCarta
 *
 * Este componente es un modal (ventana emergente) que se usa para añadir una carta
 * a la colección del usuario. La idea es que cuando se selecciona una carta del buscador
 * o del grid, se abre este modal para indicar:
 *  - el grado (estado de la carta)
 *  - cuántas copias se quieren añadir
 *  - notas opcionales
 *
 * Props:
 * - carta: objeto de la carta seleccionada (puede venir en varios formatos según la pantalla)
 * - sets: lista de sets (sirve para intentar mostrar el nombre del set de forma bonita)
 * - onConfirm: callback que se lanza cuando la carta se añade correctamente
 * - onCancel: callback para cerrar el modal sin hacer nada
 */
export default function ModalAñadirCarta({ carta, sets = [], onConfirm, onCancel }) {
  // Cantidad de copias a añadir (mínimo 1)
  const [cantidad, setCantidad] = useState(1);

  // ID del grado seleccionado (por defecto 1)
  const [gradoId, setGradoId] = useState(1);

  // Notas opcionales (texto libre)
  const [notas, setNotas] = useState("");

  // Estado para deshabilitar botones mientras se guarda
  const [loading, setLoading] = useState(false);

  // Lista de grados que se muestra en el <select>
  const [grados, setGrados] = useState([]);

  /**
   * Inicialización de grados:
   * En lugar de pedirlos al backend, aquí se dejan fijos porque es un catálogo pequeño.
   * El useEffect con [] hace que esto solo se ejecute una vez (al abrir/montar el modal).
   */
  useEffect(() => {
    setGrados([
      { id: 1, nombre: "1 - Mala condición" },
      { id: 2, nombre: "2 - Buena condición" },
      { id: 3, nombre: "3 - Muy buena condición" },
      { id: 4, nombre: "4 - Muy buena a excelente" },
      { id: 5, nombre: "5 - Excelente condición" },
      { id: 6, nombre: "6 - Excelente a casi perfecta" },
      { id: 7, nombre: "7 - Casi perfecta" },
      { id: 8, nombre: "8 - Casi perfecta a perfecta" },
      { id: 9, nombre: "9 - Perfecta" },
      { id: 10, nombre: "10 - Perfecta de museo" },
    ]);
  }, []);

  /**
   * Normalización del objeto carta:
   * En el proyecto la carta puede venir desde distintas pantallas y con distinta forma,
   * así que se usa este fallback para tener un objeto “principal” donde buscar los campos.
   */
  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;

  // ID de carta: se intenta sacar en el orden más típico según el origen
  const cardId = carta?.id || tcg?.id || carta?.id_carta;

  // Nombre de la carta con fallback para no mostrar undefined
  const cardName = tcg?.name || carta?.name || "Carta sin nombre";

  /**
   * findSetByKey(raw)
   * Busca un set dentro del array "sets" comparando posibles claves:
   * - id
   * - localId
   * - code
   *
   * Esto es útil porque a veces el set en la carta viene como “código” y no como nombre.
   */
  const findSetByKey = (raw) => {
    if (!raw || !Array.isArray(sets)) return null;
    const key = String(raw).toLowerCase();

    const s = sets.find(
      (st) =>
        (st?.id && String(st.id).toLowerCase() === key) ||
        (st?.localId && String(st.localId).toLowerCase() === key) ||
        (st?.code && String(st.code).toLowerCase() === key)
    );

    if (!s || !s.name) return null;

    // Caso: name simple
    if (typeof s.name === "string") return s.name;

    // Caso: name multilenguaje
    if (typeof s.name === "object") {
      return s.name.es || s.name.en || Object.values(s.name)[0] || null;
    }

    return null;
  };

  /**
   * getSetName()
   * Intenta resolver el nombre del set para mostrarlo en el modal.
   *
   * El set puede venir:
   * - como objeto con name
   * - como string con un id/código
   * - o incluso deducible a partir del id de la carta (ej: "swsh1-123" -> "swsh1")
   *
   * Por eso hay varios pasos y varios fallbacks.
   */
  const getSetName = () => {
    const setObj =
      tcg?.set ||
      carta?.tcgdex?.set ||
      carta?.data?.set ||
      carta?.carta?.set ||
      carta?.set;

    // Caso: set como objeto
    if (setObj && typeof setObj === "object") {
      if (typeof setObj.name === "string") return setObj.name;

      if (setObj.name && typeof setObj.name === "object") {
        return (
          setObj.name.es ||
          setObj.name.en ||
          Object.values(setObj.name)[0] ||
          "Set desconocido"
        );
      }

      // Si no hay name, se intenta resolver por id/código usando el array sets
      const possibleId =
        setObj.id || setObj.code || setObj.localId || setObj.setId || setObj.set;

      const fromId = findSetByKey(possibleId);
      if (fromId) return fromId;
    }

    // Caso: set como string
    if (typeof setObj === "string") {
      const fromId = findSetByKey(setObj);
      return fromId || setObj;
    }

    // Último fallback: deducir el set desde el id de carta (antes del guion o ":" )
    const tcgId = tcg?.id || carta?.id;
    if (tcgId) {
      const idStr = String(tcgId);
      const setCode = idStr.includes("-") ? idStr.split("-")[0] : idStr.split(":")[0];
      const fromId = findSetByKey(setCode);
      if (fromId) return fromId;
    }

    return "Set desconocido";
  };

  // Nombre del set resuelto para mostrarlo en pantalla
  const setName = getSetName();

  /**
   * Fuentes posibles de imagen:
   * Según TCGdex / backend, puede venir en campos distintos.
   * Se monta un array en orden de prioridad y se escoge la primera válida.
   */
  const fuentesImagen = [
    carta?.image?.hires,
    carta?.image?.normal,
    tcg?.image?.hires,
    tcg?.image?.normal,
    tcg?.images?.large,
    tcg?.images?.small,
    tcg?.imageUrlHiRes,
    tcg?.imageUrl,
    typeof tcg?.image === "string" ? tcg.image : null,
  ].filter(Boolean);

  const imageUrl =
    fuentesImagen[0] || "https://via.placeholder.com/150x200?text=Sin+imagen";

  /**
   * handleConfirm()
   *
   * Se ejecuta al pulsar "Añadir".
   * - valida que exista cardId (sin ID no se puede guardar en BD)
   * - manda POST a /coleccion con id_carta, id_grado, cantidad y notas
   * - si va bien, llama a onConfirm para que el componente padre actualice la UI
   */
  const handleConfirm = async () => {
    if (!cardId) {
      alert("No se ha podido determinar el ID de la carta");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post("/coleccion", {
        id_carta: cardId,
        id_grado: gradoId,
        cantidad: cantidad,
        notas: notas,
      });

      // Notificación al padre para cerrar modal / refrescar datos
      onConfirm?.({ cantidad, gradoId, notas });
    } catch (err) {
      console.error("Error añadiendo carta:", err);
      alert("Error al añadir la carta");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Fondo oscuro que bloquea la pantalla (modal)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Caja principal del modal */}
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Cabecera: título + botón cerrar */}
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Añadir Carta</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-6 space-y-4">
          {/* Resumen de carta */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-bold text-gray-900">{cardName}</p>
            <p className="text-sm text-gray-600">{setName}</p>
          </div>

          {/* Imagen */}
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt={cardName}
              className="h-40 rounded-lg shadow"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/150x200?text=Sin+imagen";
              }}
            />
          </div>

          {/* Selector de grado */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Grado de Condición
            </label>
            <select
              value={gradoId}
              onChange={(e) => setGradoId(Number(e.target.value))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
            >
              {grados.map((grado) => (
                <option key={grado.id} value={grado.id}>
                  {grado.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cantidad
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                −
              </button>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1 border-2 border-gray-300 rounded text-center"
                min="1"
              />
              <button
                type="button"
                onClick={() => setCantidad((c) => c + 1)}
                className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                +
              </button>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Ligeros defectos en esquina..."
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none h-20 resize-none"
            />
          </div>
        </div>

        {/* Botones inferiores */}
        <div className="p-6 border-t-2 border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
          >
            {loading ? "Guardando..." : "✓ Añadir"}
          </button>
        </div>
      </div>
    </div>
  );
}
