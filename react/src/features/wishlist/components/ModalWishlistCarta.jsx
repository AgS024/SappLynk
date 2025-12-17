import { useMemo, useState } from "react";
import axiosClient from "../../../axios.js";
import { XMarkIcon } from "@heroicons/react/24/outline";

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

function resolveSetName(carta, setIndex) {
  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;

  const nameFromIndexKey = (raw) => {
    if (!raw || !setIndex?.size) return null;
    const key = String(raw).toLowerCase();
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
  };

  const setObj =
    tcg?.set ||
    carta?.tcgdex?.set ||
    carta?.data?.set ||
    carta?.carta?.set ||
    carta?.set;

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
    const fromIndex = nameFromIndexKey(possibleId);
    if (fromIndex) return fromIndex;
  }

  if (typeof setObj === "string") {
    const fromIndex = nameFromIndexKey(setObj);
    return fromIndex || setObj;
  }

  const rawId = tcg?.id || carta?.id || carta?.id_carta;
  if (rawId) {
    const idStr = String(rawId).toLowerCase();

    const byDash = idStr.split("-")[0];
    const fromDash = nameFromIndexKey(byDash);
    if (fromDash) return fromDash;

    const byColon = idStr.split(":")[0];
    const fromColon = nameFromIndexKey(byColon);
    if (fromColon) return fromColon;

    const m = idStr.match(/^([a-z0-9]+)/);
    if (m?.[1]) {
      const fromRegex = nameFromIndexKey(m[1]);
      if (fromRegex) return fromRegex;
    }
  }

  return "Set desconocido";
}

export default function ModalWishlistCarta({ carta, sets = [], onConfirm, onCancel }) {
  const [precioAviso, setPrecioAviso] = useState("");
  const [loading, setLoading] = useState(false);

  const setIndex = useMemo(() => buildSetIndex(sets), [sets]);

  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;

  const cardId = carta?.id_carta || carta?.id || tcg?.id;
  const cardName = tcg?.name || carta?.name || "Carta sin nombre";
  const setName = resolveSetName(carta, setIndex);

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

  const imageUrl = fuentesImagen[0] || "https://via.placeholder.com/150x200?text=Sin+imagen";

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

      onConfirm?.({ precio_aviso: valor });
    } catch (err) {
      console.error("Error añadiendo a wishlist:", err);
      alert("Error al añadir la carta a la wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Añadir a Wishlist</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-bold text-gray-900">{cardName}</p>
            <p className="text-sm text-gray-600">{setName}</p>
          </div>

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
