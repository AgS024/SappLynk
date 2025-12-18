// Hook para ejecutar efectos cuando cambie una prop/estado (aquí se usa solo para debug)
import { useEffect } from "react";

/**
 * CartaListItem
 *
 * Item visual que representa UNA carta dentro de la colección (listado/grid).
 * Se pinta la imagen, nombre, set, grado, cantidad y (si existe) notas.
 *
 * Props:
 * - carta: objeto con la información de la carta (modelo de colección + datos de TCGdex si vienen)
 * - onPublish: callback que se lanza al hacer click (normalmente para publicar la carta en venta)
 */
export default function CartaListItem({ carta, onPublish }) {
  // Efecto usado para depurar el contenido de "carta" cuando cambia
  useEffect(() => {
    // console.log("Carta en colección:", carta);
  }, [carta]);

  /**
   * Normalización del objeto "carta":
   * Según desde dónde venga la información, puede estar en:
   * - carta.tcgdex (ya enriquecida con API)
   * - carta.data / carta.carta (otros formatos)
   * - o directamente en carta
   *
   * Con esto se evita repetir el mismo “fallback” en cada propiedad.
   */
  const tcg = carta.tcgdex || carta.data || carta.carta || carta;

  /**
   * URL de imagen:
   * TCGdex puede devolver la imagen en distintas rutas (images.small, image.normal, etc.),
   * así que se prueban varias opciones antes de caer en un placeholder.
   */
  const imageUrl =
    tcg.images?.small ||
    tcg.image?.normal ||
    carta.image?.normal ||
    carta.image ||
    tcg.image ||
    "https://via.placeholder.com/250x350?text=Sin+imagen";

  /**
   * Nombre de la carta:
   * Se intenta obtener desde TCGdex primero y, si no, desde el propio objeto.
   */
  const cartaName = tcg.name || carta.name || "Carta sin nombre";

  /**
   * Nombre del set:
   * El set puede venir como objeto (set.name) y, en algunos casos,
   * set.name puede ser string o un objeto con idiomas.
   */
  let setName = "Set desconocido";

  const setObj =
    tcg.set ||
    carta.tcgdex?.set ||
    carta.data?.set ||
    carta.carta?.set ||
    carta.set;

  if (setObj) {
    // Caso: nombre directo como string
    if (typeof setObj.name === "string") {
      setName = setObj.name;
    }
    // Caso: nombre como objeto multilenguaje (es/en/...)
    else if (typeof setObj.name === "object") {
      setName = setObj.name.es || setObj.name.en || "Set desconocido";
    }
  }

  /**
   * Datos del modelo de colección (backend):
   * - gradoNombre: se saca de la relación "grado" si viene cargada
   * - cantidad: número de copias de esa carta en colección
   */
  const gradoNombre = carta.grado?.nombre || `Grado ${carta.id_grado}`;
  const cantidad = carta.cantidad || 1;

  return (
    /**
     * Contenedor clicable:
     * al hacer click se llama a onPublish (por ejemplo, abrir modal de publicar)
     */
    <div
      onClick={onPublish}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer relative"
    >
      {/* Overlay suave en hover para dar feedback visual */}
      <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>

      {/* Bloque de imagen */}
      <div className="relative overflow-hidden bg-gray-100 h-64 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={cartaName}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          // Si falla la carga de imagen, se sustituye por un placeholder
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/250x350?text=Sin+imagen";
          }}
        />
      </div>

      {/* Bloque de texto */}
      <div className="p-3 relative z-10">
        <h3 className="font-bold text-sm truncate text-gray-900">{cartaName}</h3>
        <p className="text-gray-600 text-xs mt-1">{setName}</p>

        {/* Info extra: grado y cantidad */}
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <p className="font-semibold">📊 {gradoNombre}</p>
          <p>
            <span className="font-semibold">📦 Cantidad:</span> {cantidad}
          </p>
        </div>

        {/* Notas opcionales guardadas en la colección */}
        {carta.notas && (
          <p className="text-gray-500 text-xs mt-2 italic border-t pt-2">
            💬 {carta.notas}
          </p>
        )}
      </div>
    </div>
  );
}
