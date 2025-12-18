// Hook de React para manejar estados locales del modal (inputs y loading)
import { useState } from "react";

// Icono para el botón de cerrar el modal
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * ModalPublicarVenta
 *
 * Modal que se abre cuando se quiere publicar una carta en venta desde la colección.
 * Aquí se rellenan los datos mínimos de la publicación:
 *  - cantidad a vender (con límite según las copias disponibles)
 *  - precio por unidad
 *  - notas opcionales
 *
 * Props:
 * - copia: entrada concreta de la colección (incluye cantidad, grado, etc.)
 * - carta: datos de la carta (puede venir enriquecida con tcgdex o en otro formato)
 * - onConfirm: función que recibe los datos finales y crea la publicación en el componente padre
 * - onCancel: cierra el modal sin publicar
 */
const ModalPublicarVenta = ({ copia, carta, onConfirm, onCancel }) => {
  // Cantidad que se quiere publicar (por defecto 1)
  const [cantidad, setCantidad] = useState(1);

  // Precio por unidad (string para permitir escribir "2." o "2.5" sin romper)
  const [precio, setPrecio] = useState("");

  // Notas opcionales asociadas a la publicación
  const [notas, setNotas] = useState("");

  // Estado para deshabilitar botones mientras se procesa la confirmación
  const [loading, setLoading] = useState(false);

  /**
   * Normalización del objeto carta:
   * En algunas pantallas la carta viene como carta.tcgdex, otras como carta.data, etc.
   * Se unifica para acceder siempre a name y demás campos sin repetir checks.
   */
  const tcg = carta?.tcgdex || carta?.data || carta?.carta || carta || {};

  // Nombre de la carta con fallback para evitar undefined
  const nombreCarta = tcg.name || "Carta sin nombre";

  // Cantidad máxima publicable: corresponde a las copias disponibles en la colección
  const maxCantidad = copia?.cantidad || 1;

  /**
   * handleConfirm()
   *
   * Validación básica antes de confirmar:
   * - precio debe ser numérico y > 0
   * - cantidad debe ser numérica y > 0
   * - cantidad no puede superar las copias reales en colección
   *
   * Si todo está bien, se llama a onConfirm con los datos normalizados.
   * La creación real de la publicación (API /enventa) se gestiona fuera, en el componente padre.
   */
  const handleConfirm = () => {
    // Validación del precio
    if (!precio || Number(precio) <= 0) {
      alert("Introduce un precio válido");
      return;
    }

    // Validación de cantidad
    if (!cantidad || Number(cantidad) <= 0) {
      alert("Introduce una cantidad válida");
      return;
    }

    // Límite por copias disponibles
    if (cantidad > maxCantidad) {
      alert(`Solo tienes ${maxCantidad} copias disponibles`);
      return;
    }

    // Estado visual de “procesando”
    setLoading(true);

    // Se mandan los datos ya en números para evitar problemas aguas abajo
    onConfirm({
      cantidad: Number(cantidad),
      precio: Number(precio),
      notas,
    });

    // En este modal no hay await (la petición suele estar en el padre),
    // así que se vuelve a false inmediatamente
    setLoading(false);
  };

  return (
    // Fondo oscuro que bloquea interacción con el resto de la página
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      {/* Caja principal del modal */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header: título y botón de cerrar */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Publicar carta en venta
          </h2>

          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onCancel}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido: datos de la carta + formulario */}
        <div className="p-4 space-y-4">
          {/* Resumen de la carta seleccionada */}
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

          {/* Input de cantidad */}
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

          {/* Input de precio por unidad */}
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

          {/* Textarea de notas opcionales */}
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

        {/* Footer: botones de acción */}
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
