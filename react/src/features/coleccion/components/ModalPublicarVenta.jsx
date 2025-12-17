import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const ModalPublicarVenta = ({ copia, carta, onConfirm, onCancel }) => {
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);

  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta || {};
  const nombreCarta = tcg.name || "Carta sin nombre";

  const maxCantidad = copia?.cantidad || 1;

  const handleConfirm = () => {
    if (!precio || Number(precio) <= 0) {
      alert("Introduce un precio válido");
      return;
    }
    if (!cantidad || Number(cantidad) <= 0) {
      alert("Introduce una cantidad válida");
      return;
    }
    if (cantidad > maxCantidad) {
      alert(`Solo tienes ${maxCantidad} copias disponibles`);
      return;
    }

    setLoading(true);
    onConfirm({
      cantidad: Number(cantidad),
      precio: Number(precio),
      notas,
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Publicar carta en venta
          </h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onCancel}>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="font-semibold text-gray-900">{nombreCarta}</p>
            <p className="text-sm text-gray-600">
              Grado: {copia?.grado?.nombre || `Grado ${copia?.id_grado || "?"}`}
            </p>
            <p className="text-sm text-gray-600">
              Tienes: <span className="font-semibold">{maxCantidad}</span> copias
              en colección
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Cantidad a vender
            </label>
            <input
              type="number"
              min="1"
              max={maxCantidad}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Precio por unidad (€)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
              placeholder="Ej: 2.50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Notas de la venta (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none h-20 resize-none"
              placeholder="Ej: Carta casi perfecta, ligera marca en esquina..."
            />
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
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
            {loading ? "Publicando..." : "Publicar en venta"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPublicarVenta;
