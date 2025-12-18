/**
 * CartaWishlistItem
 *
 * Componente para pintar una carta dentro de la wishlist.
 * La wishlist en este proyecto guarda principalmente:
 * - id_carta (o id equivalente)
 * - precio_aviso (opcional): precio límite para avisar cuando aparezca una publicación barata
 *
 * Props:
 * - item: elemento de wishlist (normalmente viene del backend con item.tcgdex enriquecido)
 * - onDelete: callback para eliminar esta carta de la wishlist
 */
export default function CartaWishlistItem({ item, onDelete }) {
  /**
   * Normalización del objeto:
   * Según desde dónde venga el item, la info de TCGdex puede estar en:
   * - item.tcgdex
   * - item.data / item.carta
   * - o directamente en item
   *
   * Con esta línea se evita repetir checks en cada campo.
   */
  const tcg = item.tcgdex || item.data || item.carta || item;

  /**
   * Imagen:
   * Se prueban varias rutas típicas de TCGdex y, si no hay nada, se usa placeholder.
   * Esto es útil porque algunas cartas pueden no traer imagen o venir con otro formato.
   */
  const imageUrl =
    tcg.images?.small ||
    tcg.image?.normal ||
    item.image?.normal ||
    item.image ||
    tcg.image ||
    "https://via.placeholder.com/250x350?text=Sin+imagen";

  /**
   * Nombre de la carta:
   * Se intenta desde la info TCG primero y luego desde item como fallback.
   */
  const cartaName = tcg.name || item.name || "Carta sin nombre";

  /**
   * Nombre del set:
   * El set suele venir como tcg.set, y su name puede ser:
   * - string
   * - objeto multilenguaje (es/en/...)
   *
   * Si no se encuentra, se deja “Set desconocido”.
   */
  let setName = "Set desconocido";

  const setObj =
    tcg.set ||
    item.tcgdex?.set ||
    item.data?.set ||
    item.carta?.set ||
    item.set;

  if (setObj) {
    if (typeof setObj.name === "string") {
      setName = setObj.name;
    } else if (typeof setObj.name === "object") {
      setName = setObj.name.es || setObj.name.en || "Set desconocido";
    }
  }

  /**
   * precio_aviso:
   * Campo opcional de la wishlist. Si está definido, actúa como “umbral”.
   * Es decir, si aparece una carta en venta por un precio <= precio_aviso,
   * se puede enviar un aviso (en el backend ya hay lógica de emails con cola).
   */
  const precioAviso = item.precio_aviso;

  return (
    // Tarjeta contenedora con hover y sombra
    <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all relative">
      {/* Overlay suave al pasar el ratón */}
      <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>

      {/* Zona de imagen */}
      <div className="relative overflow-hidden bg-gray-100 h-64 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={cartaName}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          // Si falla la imagen, se reemplaza por placeholder
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/250x350?text=Sin+imagen";
          }}
        />
      </div>

      {/* Zona de información */}
      <div className="p-3 relative z-10">
        <h3 className="font-bold text-sm truncate text-gray-900">{cartaName}</h3>
        <p className="text-gray-600 text-xs mt-1">{setName}</p>

        {/* Bloque con el precio de aviso */}
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <p>
            <span className="font-semibold">🔔 Precio de aviso:</span>{" "}
            {precioAviso !== null && precioAviso !== undefined
              ? `${Number(precioAviso).toFixed(2)} €`
              : "Sin precio de aviso"}
          </p>
        </div>

        {/* Botón para eliminar el item de wishlist */}
        <button
          type="button"
          onClick={onDelete}
          className="mt-3 w-full text-xs font-semibold text-red-600 border border-red-200 rounded-lg py-1 hover:bg-red-50"
        >
          Eliminar de la wishlist
        </button>
      </div>
    </div>
  );
}
