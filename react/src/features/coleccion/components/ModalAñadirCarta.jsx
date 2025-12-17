import { useState, useEffect } from "react";
import axiosClient from "../../../axios.js";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function ModalAñadirCarta({ carta, sets = [], onConfirm, onCancel }) {
  const [cantidad, setCantidad] = useState(1);
  const [gradoId, setGradoId] = useState(1);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [grados, setGrados] = useState([]);

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

  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta;

  const cardId = carta?.id || tcg?.id || carta?.id_carta;
  const cardName = tcg?.name || carta?.name || "Carta sin nombre";

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

    if (typeof s.name === "string") return s.name;
    if (typeof s.name === "object") {
      return s.name.es || s.name.en || Object.values(s.name)[0] || null;
    }
    return null;
  };

  const getSetName = () => {
    const setObj =
      tcg?.set ||
      carta?.tcgdex?.set ||
      carta?.data?.set ||
      carta?.carta?.set ||
      carta?.set;

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
      const possibleId =
        setObj.id || setObj.code || setObj.localId || setObj.setId || setObj.set;
      const fromId = findSetByKey(possibleId);
      if (fromId) return fromId;
    }

    if (typeof setObj === "string") {
      const fromId = findSetByKey(setObj);
      return fromId || setObj;
    }

    const tcgId = tcg?.id || carta?.id;
    if (tcgId) {
      const idStr = String(tcgId);
      const setCode = idStr.includes("-") ? idStr.split("-")[0] : idStr.split(":")[0];
      const fromId = findSetByKey(setCode);
      if (fromId) return fromId;
    }

    return "Set desconocido";
  };

  const setName = getSetName();

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

    setLoading(true);
    try {
      await axiosClient.post("/coleccion", {
        id_carta: cardId,
        id_grado: gradoId,
        cantidad: cantidad,
        notas: notas,
      });

      onConfirm?.({ cantidad, gradoId, notas });
    } catch (err) {
      console.error("Error añadiendo carta:", err);
      alert("Error al añadir la carta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Añadir Carta</h2>
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
                e.currentTarget.src = "https://via.placeholder.com/150x200?text=Sin+imagen";
              }}
            />
          </div>

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
