import { useState, useMemo } from 'react';
import ModalAñadirCarta from './ModalAñadirCarta.jsx';

export default function CardGridSelectable({ cartas, onSelectCarta, sets }) {
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);

  const setIndex = useMemo(() => {
    const map = new Map();
    if (Array.isArray(sets)) {
      for (const s of sets) {
        if (s?.id) map.set(String(s.id).toLowerCase(), s);
        if (s?.localId) map.set(String(s.localId).toLowerCase(), s);
        if (s?.code) map.set(String(s.code).toLowerCase(), s);
      }
    }
    return map;
  }, [sets]);

  const cartasPorPagina = 20;
  const totalPaginas = Math.ceil((cartas?.length || 0) / cartasPorPagina);

  const abrirModal = (carta) => {
    setCartaSeleccionada(carta);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setCartaSeleccionada(null);
  };

  const handleAñadir = (datosAñadida) => {
    if (onSelectCarta && cartaSeleccionada) {
      onSelectCarta(cartaSeleccionada, datosAñadida);
    }
    cerrarModal();
  };

  if (!cartas || cartas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No se encontraron cartas</p>
      </div>
    );
  }

  const inicio = (paginaActual - 1) * cartasPorPagina;
  const cartasVisibles = cartas.slice(inicio, inicio + cartasPorPagina);

  const resolveSetName = (carta) => {
    const tcg = carta.tcgdex || carta.data || carta.carta || carta;

    const findSetFromKey = (raw) => {
      if (!raw || !setIndex.size) return null;
      const key = String(raw).toLowerCase();
      const found = setIndex.get(key);
      if (!found || !found.name) return null;
      if (typeof found.name === 'string') return found.name;
      if (typeof found.name === 'object') {
        return (
          found.name.es ||
          found.name.en ||
          Object.values(found.name)[0] ||
          null
        );
      }
      return null;
    };

    const setObj =
      tcg?.set ||
      carta?.tcgdex?.set ||
      carta?.data?.set ||
      carta?.carta?.set ||
      carta?.set;

    if (setObj && typeof setObj === 'object') {
      if (typeof setObj.name === 'string') return setObj.name;
      if (setObj.name && typeof setObj.name === 'object') {
        return (
          setObj.name.es ||
          setObj.name.en ||
          Object.values(setObj.name)[0] ||
          'Set desconocido'
        );
      }
      const possibleId =
        setObj.id ||
        setObj.code ||
        setObj.localId ||
        setObj.setId ||
        setObj.set;
      const fromId = findSetFromKey(possibleId);
      if (fromId) return fromId;
    }

    if (typeof tcg?.set === 'string') {
      const fromIndex = findSetFromKey(tcg.set);
      if (fromIndex) return fromIndex;
      return tcg.set;
    }

    if (typeof carta?.set === 'string') {
      const fromIndex = findSetFromKey(carta.set);
      if (fromIndex) return fromIndex;
      return carta.set;
    }

    const tcgId = tcg.id || carta.id;
    if (tcgId) {
      const [setCode] = String(tcgId).split('-');
      const fromId = findSetFromKey(setCode);
      if (fromId) return fromId;
    }

    const candidateImageUrl =
      carta.image ||
      tcg.image ||
      tcg.imageUrl ||
      tcg.imageUrlHiRes ||
      (tcg.images && (tcg.images.large || tcg.images.small));

    if (candidateImageUrl && setIndex.size) {
      try {
        const url = new URL(candidateImageUrl);
        const segments = url.pathname.split('/').filter(Boolean);
        for (const seg of segments) {
          const fromSeg = findSetFromKey(seg);
          if (fromSeg) return fromSeg;
        }
      } catch (e) {}
    }

    return 'Set desconocido';
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {cartasVisibles.map((carta) => {
          const tcg = carta.tcgdex || carta.data || carta.carta || carta;

          // 🔹 Usamos siempre versión pequeña/normal para ir rápido
          const imageUrl =
            tcg.images?.small ||
            tcg.image?.normal ||
            carta.image?.normal ||
            carta.image ||
            tcg.image ||
            'https://via.placeholder.com/250x350?text=Sin+imagen';

          const cartaName = tcg.name || 'Carta sin nombre';
          const setName = resolveSetName(carta);
          const rarity = tcg.rarity;
          const hp = tcg.hp;
          const types = Array.isArray(tcg.types)
            ? tcg.types
            : tcg.types
            ? [tcg.types]
            : null;

          const key =
            carta.id ||
            tcg.id ||
            carta.id_carta ||
            `${cartaName}-${setName}-${Math.random().toString(36).slice(2)}`;

          return (
            <div
              key={key}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col"
            >
              <div className="relative overflow-hidden bg-gray-100 h-100">
                <img
                  src={imageUrl}
                  alt={cartaName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://via.placeholder.com/250x350?text=Sin+imagen';
                  }}
                />
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm truncate text-gray-900">
                    {cartaName}
                  </h3>
                  <p className="text-gray-600 text-xs mt-1">{setName}</p>
                </div>

                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  {rarity && (
                    <p>
                      <span className="font-semibold">Rareza:</span> {rarity}
                    </p>
                  )}
                  {hp && (
                    <p>
                      <span className="font-semibold">HP:</span> {hp}
                    </p>
                  )}
                  {types && types.length > 0 && (
                    <p>
                      <span className="font-semibold">Tipos:</span>{' '}
                      {types.join(', ')}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => abrirModal(carta)}
                  className="mt-4 w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                >
                  ➕ Añadir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPaginas > 1 && (
        <div className="flex justify-center items-center mt-6 gap-4">
          <button
            onClick={() =>
              setPaginaActual((p) => Math.max(p - 1, 1))
            }
            disabled={paginaActual === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
          >
            ⬅️ Anterior
          </button>
          <span className="text-sm text-gray-700">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={() =>
              setPaginaActual((p) => Math.min(p + 1, totalPaginas))
            }
            disabled={paginaActual === totalPaginas}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
          >
            Siguiente ➡️
          </button>
        </div>
      )}

      {mostrarModal && cartaSeleccionada && (
        <ModalAñadirCarta
          carta={cartaSeleccionada}
          sets={sets}
          onConfirm={handleAñadir}
          onCancel={cerrarModal}
        />
      )}
    </>
  );
}
