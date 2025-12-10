// react/src/components/ModalWishlistCarta.jsx
import { useState } from "react";
import axiosClient from "../axios.js";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function ModalWishlistCarta({ carta, onConfirm, onCancel }) {
  const [precioAviso, setPrecioAviso] = useState("");
  const [loading, setLoading] = useState(false);

  const tcg = carta.tcgdex || carta.data || carta.carta || carta;

  const cardId = carta.id_carta || carta.id || tcg.id;
  const cardName = tcg.name || carta.name || "Carta sin nombre";

  // Nombre del set (misma lógica que en ModalAñadirCarta pero simplificada)
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

  const fuentesImagen = [
    carta.image?.hires,
    carta.image?.normal,
    tcg.image?.hires,
    tcg.image?.normal,
    tcg.images?.large,
    tcg.images?.small,
    tcg.imageUrlHiRes,
    tcg.imageUrl,
    typeof tcg.image === "string" ? tcg.image : null,
  ].filter(Boolean);

  const imageUrl =
    fuentesImagen[0] ||
    "https://via.placeholder.com/150x200?text=Sin+imagen";

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

      onConfirm({ precio_aviso: valor });
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
          <h2 className="text-2xl font-bold text-gray-900">
            Añadir a Wishlist
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
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
            <p className="mt-1 text-xs text-gray-500">
              Te avisaremos cuando haya cartas en venta por debajo de este
              precio (lógica de aviso la puedes añadir más adelante).
            </p>
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
