import { useEffect } from "react";
import {
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import TButton from "./core/TButton.jsx";

export default function CartaListItem({ carta, onPublish, onDelete }) {
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative overflow-hidden bg-gray-100 h-64 flex items-center justify-center">
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

      <div className="p-3">
        <h3 className="font-bold text-sm truncate text-gray-900">
          {cartaName}
        </h3>
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

        <div className="flex gap-2 mt-3">
          {/* 🔵 Este botón ahora sirve para ir a la página de detalle de la carta en colección */}
          <TButton
            circle
            link
            color="indigo"
            onClick={onPublish}
            title="Ver / gestionar esta carta"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          </TButton>

          {/* 🔴 Eliminar directamente desde la colección */}
          <TButton
            circle
            link
            color="red"
            onClick={onDelete}
            title="Eliminar de colección"
          >
            <TrashIcon className="h-5 w-5" />
          </TButton>
        </div>
      </div>
    </div>
  );
}
