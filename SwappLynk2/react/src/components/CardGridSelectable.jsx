import { useEffect, useMemo, useState } from "react";
import axiosClient from "../axios.js";

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

function getSetNameFromIndex(setIndex, rawKey) {
  if (!rawKey || !setIndex?.size) return null;

  const key = String(rawKey).toLowerCase();
  const found = setIndex.get(key);
  if (!found) return null;

  if (typeof found.name === "string" && found.name.trim()) return found.name;

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

function extractSetNameFromCardObject(card, setIndex) {
  const setObj = card?.set;

  if (setObj && typeof setObj === "object") {
    if (typeof setObj.name === "string" && setObj.name.trim()) return setObj.name;

    if (setObj.name && typeof setObj.name === "object") {
      const v =
        setObj.name.es ||
        setObj.name.en ||
        Object.values(setObj.name).find((x) => typeof x === "string" && x.trim());
      if (v) return v;
    }

    const possibleId =
      setObj.id || setObj.code || setObj.localId || setObj.setId || setObj.set;
    const fromIndex = getSetNameFromIndex(setIndex, possibleId);
    if (fromIndex) return fromIndex;

    if (possibleId) return String(possibleId);
  }

  if (typeof setObj === "string" && setObj.trim()) {
    return getSetNameFromIndex(setIndex, setObj) || setObj;
  }

  return null;
}

function getCardId(carta) {
  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;
  return carta?.id_carta || carta?.id || tcg?.id || null;
}

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

function getCardName(carta) {
  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;
  return tcg?.name || carta?.name || "Carta sin nombre";
}

export default function CardGridSelectable({ cartas, onSelectCarta, sets }) {
  const [paginaActual, setPaginaActual] = useState(1);

  const setIndex = useMemo(() => buildSetIndex(sets), [sets]);

  const [setCache, setSetCache] = useState({});

  const cartasPorPagina = 20;
  const totalPaginas = Math.ceil((cartas?.length || 0) / cartasPorPagina);

  const inicio = (paginaActual - 1) * cartasPorPagina;
  const cartasVisibles = (cartas || []).slice(inicio, inicio + cartasPorPagina);

  const resolveSetName = (carta) => {
    const id = getCardId(carta);
    if (id && setCache[id]) return setCache[id];

    const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;
    const fromCard = extractSetNameFromCardObject(tcg, setIndex);
    if (fromCard) return fromCard;

    return "Set desconocido";
  };

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
            // si falla, simplemente no añadimos nada al caché
          }
        })
      );

      if (cancelled) return;

      const keys = Object.keys(results);
      if (keys.length > 0) {
        setSetCache((prev) => ({ ...prev, ...results }));
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual, cartasVisibles.length, setIndex]);

  if (!cartas || cartas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No se encontraron cartas</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {cartasVisibles.map((carta) => {
          const imageUrl = getCardImageUrl(carta);
          const cartaName = getCardName(carta);
          const setName = resolveSetName(carta);

          const key =
            getCardId(carta) ||
            `${cartaName}-${Math.random().toString(36).slice(2)}`;

          return (
            <div
              key={key}
              onClick={() => onSelectCarta && onSelectCarta(carta)}
              className="cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 h-full flex flex-col group"
            >
              <div className="relative overflow-hidden bg-gray-100 h-100">
                <img
                  src={imageUrl}
                  alt={cartaName}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/250x350?text=Sin+imagen";
                  }}
                />
              </div>

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
