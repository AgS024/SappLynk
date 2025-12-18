// useState: estados locales del modal (precioAviso y loading)
// useMemo: memoización para crear el índice de sets solo cuando cambie "sets"
import { useMemo, useState } from "react";

// Cliente Axios ya configurado (baseURL, token, etc.) para hablar con Laravel
import axiosClient from "../../../axios.js";

// Icono de “cerrar” el modal
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * buildSetIndex(sets)
 *
 * Función auxiliar que construye un índice (Map) para buscar sets rápido.
 * En vez de hacer sets.find(...) todo el rato (O(n)), se crea un Map (O(1)).
 *
 * Se guardan varias claves por cada set porque TCGdex a veces identifica sets con:
 * - id
 * - localId
 * - code
 */
function buildSetIndex(sets) {
  const map = new Map();
  if (!Array.isArray(sets)) return map;

  for (const s of sets) {
    if (s?.id) map.set(String(s.id).toLowerCase(), s);
    if (s?.localId) map.set(String(s.localId).toLowerCase(), s);
    if (s?.code) map.set(String(s.code).toLowerCase(), s);
  }
  return map;
}

/**
 * resolveSetName(carta, setIndex)
 *
 * Intenta resolver el nombre del set de una carta usando varias estrategias,
 * porque los datos pueden venir incompletos o con formatos distintos:
 *  1) Si la carta ya trae set.name, se usa directamente.
 *  2) Si set.name es multilenguaje, se prioriza es/en.
 *  3) Si solo hay id/código, se busca en el índice (setIndex).
 *  4) Si no hay set claro, se intenta “deducir” el set del id de la carta
 *     (por ejemplo: "swsh1-123" -> set "swsh1").
 *  5) Si nada funciona, se devuelve “Set desconocido”.
 */
function resolveSetName(carta, setIndex) {
  // Normalización: la carta puede venir como carta.tcgdex o en otro wrapper
  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;

  /**
   * nameFromIndexKey(raw)
   * Busca un set dentro del Map usando la clave raw (id/localId/code).
   * Si encuentra el set, intenta devolver el nombre (string o multilenguaje).
   */
  const nameFromIndexKey = (raw) => {
    if (!raw || !setIndex?.size) return null;
    const key = String(raw).toLowerCase();
    const found = setIndex.get(key);
    if (!found) return null;

    // Nombre directo
    if (typeof found.name === "string" && found.name.trim()) return found.name;

    // Nombre multilenguaje
    if (found.name && typeof found.name === "object") {
      return (
        found.name.es ||
        found.name.en ||
        Object.values(found.name).find((x) => typeof x === "string" && x.trim()) ||
        null
      );
    }
    return null;
  };

  // setObj puede venir en varias rutas según el origen de la carta
  const setObj =
    tcg?.set ||
    carta?.tcgdex?.set ||
    carta?.data?.set ||
    carta?.carta?.set ||
    carta?.set;

  // Caso 1: set como objeto con información dentro
  if (setObj && typeof setObj === "object") {
    // set.name como string
    if (typeof setObj.name === "string" && setObj.name.trim()) return setObj.name;

    // set.name como objeto multilenguaje
    if (setObj.name && typeof setObj.name === "object") {
      const v =
        setObj.name.es ||
        setObj.name.en ||
        Object.values(setObj.name).find((x) => typeof x === "string" && x.trim());
      if (v) return v;
    }

    // Si no hay nombre, se intenta resolver por id/código usando el índice
    const possibleId =
      setObj.id || setObj.code || setObj.localId || setObj.setId || setObj.set;

    const fromIndex = nameFromIndexKey(possibleId);
    if (fromIndex) return fromIndex;
  }

  // Caso 2: set como string (ej: "swsh1")
  if (typeof setObj === "string") {
    const fromIndex = nameFromIndexKey(setObj);
    return fromIndex || setObj;
  }

  /**
   * Caso 3: deducir set desde el id de la carta
   * Esto es un “plan B” cuando no viene set en el objeto.
   */
  const rawId = tcg?.id || carta?.id || carta?.id_carta;
  if (rawId) {
    const idStr = String(rawId).toLowerCase();

    // Parte antes de "-"
    const byDash = idStr.split("-")[0];
    const fromDash = nameFromIndexKey(byDash);
    if (fromDash) return fromDash;

    // Parte antes de ":"
    const byColon = idStr.split(":")[0];
    const fromColon = nameFromIndexKey(byColon);
    if (fromColon) return fromColon;

    // Prefijo alfanumérico inicial por regex
    const m = idStr.match(/^([a-z0-9]+)/);
    if (m?.[1]) {
      const fromRegex = nameFromIndexKey(m[1]);
      if (fromRegex) return fromRegex;
    }
  }

  return "Set desconocido";
}

/**
 * ModalWishlistCarta
 *
 * Modal que permite añadir una carta a la wishlist con un precio de aviso.
 * El precio de aviso se usa como “umbral”: si aparece una publicación con precio <= umbral,
 * el backend puede mandar un correo o notificación (según la lógica implementada).
 *
 * Props:
 * - carta: carta seleccionada
 * - sets: listado de sets (para mostrar el nombre del set correctamente)
 * - onConfirm: callback tras guardar en la API
 * - onCancel: cerrar modal
 */
export default function ModalWishlistCarta({ carta, sets = [], onConfirm, onCancel }) {
  // Input del precio de aviso (se guarda como string para que el input sea más flexible)
  const [precioAviso, setPrecioAviso] = useState("");

  // Estado para bloquear botones mientras se guarda en backend
  const [loading, setLoading] = useState(false);

  /**
   * Índice memoizado:
   * buildSetIndex solo se recalcula cuando cambie "sets".
   */
  const setIndex = useMemo(() => buildSetIndex(sets), [sets]);

  // Normalización del objeto carta
  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;

  // Datos principales que se muestran en el modal
  const cardId = carta?.id_carta || carta?.id || tcg?.id;
  const cardName = tcg?.name || carta?.name || "Carta sin nombre";
  const setName = resolveSetName(carta, setIndex);

  /**
   * Selección de imagen:
   * Se prueban varias fuentes posibles porque el modelo/TCGdex puede variar.
   * Se usa la primera que exista.
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
   * Validaciones:
   * - cardId debe existir (sin id no se puede guardar)
   * - precioAviso debe ser un número > 0
   *
   * Si todo está correcto, se hace POST /wishlist y luego se notifica al padre con onConfirm.
   */
  const handleConfirm = async () => {
    if (!cardId) {
      alert("No se ha podido determinar el ID de la carta");
      return;
    }

    const valor = parseFloat(precioAviso);
    if (isNaN(valor) || valor <= 0) {
      alert("Introduce un precio de aviso mayor que 0");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post("/wishlist", {
        id_carta: cardId,
        precio_aviso: valor,
      });

      // Notificación al componente padre (para cerrar modal / refrescar wishlist)
      onConfirm?.({ precio_aviso: valor });
    } catch (err) {
      console.error("Error añadiendo a wishlist:", err);
      alert("Error al añadir la carta a la wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Fondo oscuro para efecto modal
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Caja principal del modal */}
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Cabecera */}
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Añadir a Wishlist</h2>

          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
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

          {/* Input: precio de aviso */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Precio de aviso (€)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={precioAviso}
              onChange={(e) => setPrecioAviso(e.target.value)}
              placeholder="Ej: 5.00"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer: botones */}
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
            {loading ? "Guardando..." : "✓ Añadir a wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
