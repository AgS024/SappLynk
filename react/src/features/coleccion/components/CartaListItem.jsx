import { useEffect } from "react";

export default function CartaListItem({ carta, onPublish }) {
  useEffect(() => {
    // console.log("Carta en colección:", carta);
  }, [carta]);

  const tcg = carta.tcgdex || carta.data || carta.carta || carta;

  const imageUrl =
    tcg.images?.small ||
    tcg.image?.normal ||
    carta.image?.normal ||
    carta.image ||
    tcg.image ||
    "https://via.placeholder.com/250x350?text=Sin+imagen";

  const cartaName = tcg.name || carta.name || "Carta sin nombre";

  let setName = "Set desconocido";
  const setObj =
    tcg.set ||
    carta.tcgdex?.set ||
    carta.data?.set ||
    carta.carta?.set ||
    carta.set;

  if (setObj) {
    if (typeof setObj.name === "string") {
      setName = setObj.name;
    } else if (typeof setObj.name === "object") {
      setName = setObj.name.es || setObj.name.en || "Set desconocido";
    }
  }

  const gradoNombre = carta.grado?.nombre || `Grado ${carta.id_grado}`;
  const cantidad = carta.cantidad || 1;

  return (
    <div
      onClick={onPublish}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer relative"
    >
      <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>

      <div className="relative overflow-hidden bg-gray-100 h-64 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={cartaName}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/250x350?text=Sin+imagen";
          }}
        />
      </div>

      <div className="p-3 relative z-10">
        <h3 className="font-bold text-sm truncate text-gray-900">{cartaName}</h3>
        <p className="text-gray-600 text-xs mt-1">{setName}</p>

        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <p className="font-semibold">📊 {gradoNombre}</p>
          <p>
            <span className="font-semibold">📦 Cantidad:</span> {cantidad}
          </p>
        </div>

        {carta.notas && (
          <p className="text-gray-500 text-xs mt-2 italic border-t pt-2">
            💬 {carta.notas}
          </p>
        )}
      </div>
    </div>
  );
}
