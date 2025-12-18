// Hooks de React usados aquí:
// - useState: para guardar estado local (página actual y caché de sets)
// - useMemo: para recalcular cosas “costosas” solo cuando cambian (índice de sets)
// - useEffect: para hacer llamadas a la API cuando faltan datos (nombre del set)
import { useEffect, useMemo, useState } from "react";

// Axios configurado para llamar al backend (Laravel) sin repetir baseURL/headers
import axiosClient from "../../../axios.js";

/**
 * buildSetIndex(sets)
 *
 * La API de TCGdex puede devolver los sets con distintos identificadores (id, localId, code),
 * y además a veces en distintas formas. Para no estar buscando “a mano” cada vez, aquí se
 * construye un índice (Map) que permite localizar un set en O(1).
 *
 * La idea es: para cada set, se guardan varias claves (id/localId/code) en minúsculas,
 * y así después se puede buscar el set aunque venga con un formato u otro.
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
 * getSetNameFromIndex(setIndex, rawKey)
 *
 * A partir del índice de sets y una clave (rawKey), intenta sacar el nombre del set.
 * Aquí se contemplan dos casos típicos:
 * - found.name es un string normal
 * - found.name es un objeto con idiomas (es/en/...)
 *
 * Si no se puede resolver, se devuelve null.
 */
function getSetNameFromIndex(setIndex, rawKey) {
  if (!rawKey || !setIndex?.size) return null;

  const key = String(rawKey).toLowerCase();
  const found = setIndex.get(key);
  if (!found) return null;

  // Caso simple: name es un string directo
  if (typeof found.name === "string" && found.name.trim()) return found.name;

  // Caso TCGdex: name puede venir como objeto multi-idioma
  if (found.name && typeof found.name === "object") {
    return (
      found.name.es ||
      found.name.en ||
      Object.values(found.name).find((x) => typeof x === "string" && x.trim()) ||
      null
    );
  }

  return null;
}

/**
 * extractSetNameFromCardObject(card, setIndex)
 *
 * En teoría, una carta puede traer el set dentro (card.set).
 * El problema es que ese campo no siempre llega igual:
 * - Puede ser un objeto (con name, id, etc.)
 * - Puede ser un string con el id del set
 *
 * Esta función intenta ser robusta:
 * 1) Si trae nombre directamente, lo devuelve
 * 2) Si no trae nombre, intenta resolverlo por id usando el índice
 * 3) Si al menos hay algún id, devuelve ese id como fallback
 */
function extractSetNameFromCardObject(card, setIndex) {
  const setObj = card?.set;

  // Caso: set como objeto
  if (setObj && typeof setObj === "object") {
    if (typeof setObj.name === "string" && setObj.name.trim()) return setObj.name;

    if (setObj.name && typeof setObj.name === "object") {
      const v =
        setObj.name.es ||
        setObj.name.en ||
        Object.values(setObj.name).find((x) => typeof x === "string" && x.trim());
      if (v) return v;
    }

    // Claves posibles para identificar set según estructura
    const possibleId =
      setObj.id || setObj.code || setObj.localId || setObj.setId || setObj.set;

    const fromIndex = getSetNameFromIndex(setIndex, possibleId);
    if (fromIndex) return fromIndex;

    // Fallback: devolver el identificador si existe
    if (possibleId) return String(possibleId);
  }

  // Caso: set como string (id del set)
  if (typeof setObj === "string" && setObj.trim()) {
    return getSetNameFromIndex(setIndex, setObj) || setObj;
  }

  return null;
}

/**
 * getCardId(carta)
 *
 * En el proyecto la carta puede venir en distintos formatos:
 * - Desde el backend: { id_carta: "...", tcgdex: {...} }
 * - Desde TCGdex directamente: { id: "...", ... }
 *
 * Para no depender del formato, se intenta sacar el id con varios fallbacks.
 */
function getCardId(carta) {
  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;
  return carta?.id_carta || carta?.id || tcg?.id || null;
}

/**
 * getCardImageUrl(carta)
 *
 * Similar al id: la imagen puede estar en distintos campos según la respuesta.
 * Se prueban varias rutas típicas (images.small, image.normal, etc.)
 * y si no hay nada, se usa un placeholder.
 */
function getCardImageUrl(carta) {
  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;

  return (
    tcg?.images?.small ||
    tcg?.image?.normal ||
    carta?.image?.normal ||
    carta?.image ||
    tcg?.image ||
    "https://via.placeholder.com/250x350?text=Sin+imagen"
  );
}

/**
 * getCardName(carta)
 *
 * Devuelve el nombre de la carta. Si no viene, se pone un texto por defecto
 * para evitar que el render rompa o que salgan undefined.
 */
function getCardName(carta) {
  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;
  return tcg?.name || carta?.name || "Carta sin nombre";
}

/**
 * CardGridSelectable
 *
 * Este componente muestra un grid (tipo galería) con cartas.
 * Lo importante:
 * - Está paginado (20 por página) para que no se rendericen 200 cartas de golpe.
 * - Cada carta es clicable y llama a onSelectCarta(carta).
 * - Intenta mostrar también el nombre del set, y si no lo tiene, lo completa
 *   pidiendo el detalle de la carta al backend.
 */
export default function CardGridSelectable({ cartas, onSelectCarta, sets }) {
  // Página actual de la paginación
  const [paginaActual, setPaginaActual] = useState(1);

  // Índice de sets memoizado: solo se recalcula si cambia "sets"
  const setIndex = useMemo(() => buildSetIndex(sets), [sets]);

  // Caché en memoria para no repetir peticiones de setName por cada render
  // Formato: { [cardId]: "Nombre del set" }
  const [setCache, setSetCache] = useState({});

  // Configuración de paginación
  const cartasPorPagina = 20;
  const totalPaginas = Math.ceil((cartas?.length || 0) / cartasPorPagina);

  // Recorte del array para mostrar solo la página actual
  const inicio = (paginaActual - 1) * cartasPorPagina;
  const cartasVisibles = (cartas || []).slice(inicio, inicio + cartasPorPagina);

  /**
   * resolveSetName(carta)
   *
   * Orden de prioridad:
   * 1) Si ya está en setCache -> se devuelve directamente
   * 2) Si la carta ya trae info de set -> se extrae de ahí
   * 3) Si no hay forma -> "Set desconocido" (y luego se intenta completar con useEffect)
   */
  const resolveSetName = (carta) => {
    const id = getCardId(carta);
    if (id && setCache[id]) return setCache[id];

    const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;
    const fromCard = extractSetNameFromCardObject(tcg, setIndex);
    if (fromCard) return fromCard;

    return "Set desconocido";
  };

  /**
   * useEffect para completar sets desconocidos:
   *
   * Hay casos donde el listado de cartas viene “recortado” y no incluye bien el set.
   * En esos casos, se detectan cartas visibles cuyo set es desconocido y se pide el
   * detalle de cada carta a /cartas/{id}. Del detalle completo se extrae el setName
   * y se guarda en setCache.
   *
   * El flag "cancelled" evita actualizar estado si se cambia de página rápido
   * o si el componente se desmonta antes de terminar las peticiones.
   */
  useEffect(() => {
    const unknowns = cartasVisibles
      .map((c) => ({ carta: c, id: getCardId(c) }))
      .filter(({ id }) => id && !setCache[id])
      .filter(({ carta }) => resolveSetName(carta) === "Set desconocido")
      .map(({ id }) => id);

    if (unknowns.length === 0) return;

    let cancelled = false;

    const fetchDetails = async () => {
      const results = {};

      await Promise.all(
        unknowns.map(async (id) => {
          try {
            const res = await axiosClient.get(`/cartas/${encodeURIComponent(id)}`);
            const full = res?.data || null;

            const setName = extractSetNameFromCardObject(full, setIndex);
            if (setName) results[id] = setName;
          } catch {
            // Si una petición falla, no se bloquea el resto
          }
        })
      );

      if (!cancelled && Object.keys(results).length > 0) {
        setSetCache((prev) => ({ ...prev, ...results }));
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual, cartasVisibles.length, setIndex]);

  // Caso sin resultados
  if (!cartas || cartas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No se encontraron cartas</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid responsive: se adapta al tamaño de pantalla */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {cartasVisibles.map((carta) => {
          const imageUrl = getCardImageUrl(carta);
          const cartaName = getCardName(carta);
          const setName = resolveSetName(carta);

          // Key estable si hay id; si no, fallback para evitar warnings
          const key =
            getCardId(carta) || `${cartaName}-${Math.random().toString(36).slice(2)}`;

          return (
            // Carta clicable: al pulsar se dispara onSelectCarta
            <div
              key={key}
              onClick={() => onSelectCarta && onSelectCarta(carta)}
              className="cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 h-full flex flex-col group"
            >
              {/* Contenedor de imagen */}
              <div className="relative overflow-hidden bg-gray-100 h-100">
                <img
                  src={imageUrl}
                  alt={cartaName}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  // Si la imagen falla, se reemplaza por placeholder
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/250x350?text=Sin+imagen";
                  }}
                />
              </div>

              {/* Texto con nombre y set */}
              <div className="p-4 flex-1 flex flex-col justify-between bg-white transition-colors duration-200 group-hover:bg-red-100">
                <div>
                  <h3 className="font-bold text-sm truncate text-gray-900">
                    {cartaName}
                  </h3>
                  <p className="text-gray-600 text-xs mt-1">{setName}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación solo si hace falta */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center mt-6 gap-4">
          <button
            onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
            disabled={paginaActual === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
          >
            ⬅️ Anterior
          </button>

          <span className="text-sm text-gray-700">
            Página {paginaActual} de {totalPaginas}
          </span>

          <button
            onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
            disabled={paginaActual === totalPaginas}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
          >
            Siguiente ➡️
          </button>
        </div>
      )}
    </>
  );
}
