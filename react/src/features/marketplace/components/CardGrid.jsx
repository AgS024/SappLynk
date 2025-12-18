// Link: para que cada carta sea “clicable” y navegue a su detalle sin recargar la página
import { Link } from "react-router-dom";

// Icono de estrella (se usa en el marketplace para marcar “En venta”)
import { StarIcon } from "@heroicons/react/24/solid";

/**
 * CardGrid
 *
 * Este componente pinta un grid de cartas en formato “tarjeta”.
 * Se reutiliza en dos contextos:
 * - Modo normal (marketplace = false): se usa para mostrar cartas “normales” (ej. búsqueda).
 * - Modo marketplace (marketplace = true): se usa para mostrar publicaciones en venta
 *   (incluye vendedor, valoración, grado y precio).
 *
 * Props:
 * - cartas: array con las cartas a mostrar
 * - marketplace: boolean para cambiar el contenido mostrado en cada tarjeta
 */
export default function CardGrid({ cartas, marketplace = false }) {
  // Si no hay cartas, se muestra un mensaje en lugar de un grid vacío
  if (!cartas || cartas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No se encontraron cartas</p>
      </div>
    );
  }

  return (
    // Grid responsive: 1 columna en móvil, y se amplía en pantallas más grandes
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {cartas.map((carta) => {
        /**
         * Normalización rápida:
         * muchas veces el backend devuelve { tcgdex: { ...infoCarta } }
         * y otras veces la carta ya viene directamente.
         */
        const tcg = carta.tcgdex || carta;

        /**
         * Imagen:
         * TCGdex puede traer imágenes en distintos campos (images.small, images.large, etc.)
         * así que se prueban varias rutas y al final se usa un placeholder.
         */
        const imageUrl =
          tcg.images?.small ||
          tcg.images?.large ||
          tcg.image?.normal ||
          carta.image?.normal ||
          tcg.image ||
          "https://via.placeholder.com/250x350?text=Sin+imagen";

        // Nombre e ID con fallback para evitar undefined
        const cartaName = tcg.name || carta.name || "Carta sin nombre";
        const cartaId = tcg.id || carta.id_carta || carta.id;

        /**
         * Nombre del set:
         * suele venir como tcg.set.name, pero a veces tcg.set.name es multilenguaje.
         * Si no se puede sacar, se deja “Set desconocido”.
         */
        let setName = "Set desconocido";
        const setObj = tcg.set || carta.set;

        if (setObj) {
          if (typeof setObj.name === "string") {
            setName = setObj.name;
          } else if (typeof setObj.name === "object") {
            setName = setObj.name.es || setObj.name.en || "Set desconocido";
          }
        }

        /**
         * Precio:
         * solo tiene sentido en marketplace, porque ahí carta representa una publicación.
         * En modo normal el precio no se muestra.
         */
        const precio = marketplace ? carta.precio : null;

        /**
         * Datos extra cuando marketplace=true:
         * - vendedorNombre: nombre del usuario que vende
         * - valoracionMedia5: valoración media del vendedor en escala /5
         * - gradoTexto: estado/condición de la carta (grado)
         */
        let vendedorNombre = null;
        let valoracionMedia5 = null;
        let gradoTexto = null;

        if (marketplace) {
          // En marketplace se espera que carta tenga una relación usuario (vendedor)
          const vendedor = carta.usuario || null;

          if (vendedor) {
            // Se intenta usar name o nickname, y si no, un fallback con id
            vendedorNombre =
              vendedor.name ||
              vendedor.nickname ||
              `Usuario #${vendedor.id || carta.id_usuario}`;

            /**
             * La valoración en BD está guardada como:
             * - suma_val: suma total de valoraciones (0–10)
             * - cantidad_val: número de valoraciones
             *
             * Para sacar la media:
             * media10 = suma_val / cantidad_val
             * media5  = media10 / 2
             */
            const sumaVal = Number(vendedor.suma_val ?? 0);
            const cantVal = Number(vendedor.cantidad_val ?? 0);

            if (cantVal > 0) {
              const media10 = sumaVal / cantVal;
              valoracionMedia5 = media10 / 2;
            }
          } else {
            // Si por algún motivo no viene la relación usuario, se muestra un fallback
            vendedorNombre = `Usuario #${carta.id_usuario}`;
          }

          // El grado también suele venir como relación: carta.grado
          const grado = carta.grado || null;
          gradoTexto =
            grado?.nombre || `Grado ${carta.id_grado ?? carta.id_grado ?? "?"}`;
        }

        /**
         * Clave y ruta del Link:
         * - En marketplace, el detalle es por el id de la publicación (/marketplace/{id})
         * - En modo normal, el detalle es por id de carta (/carta/{id})
         */
        const key = marketplace ? `enventa-${carta.id}` : `carta-${cartaId}`;
        const linkTo = marketplace ? `/marketplace/${carta.id}` : `/carta/${cartaId}`;

        return (
          // Cada tarjeta entera es un Link (clic -> navegación a detalle)
          <Link key={key} to={linkTo} className="group">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col relative">
              {/* Overlay suave en hover */}
              <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />

              {/* Imagen de la carta */}
              <div className="relative bg-gray-100 h-72 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={cartaName}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/250x350?text=Error";
                  }}
                />
              </div>

              {/* Texto y metadatos */}
              <div className="p-4 flex-1 flex flex-col justify-between relative z-10">
                <div>
                  <h3 className="font-bold text-sm truncate text-gray-900">{cartaName}</h3>
                  <p className="text-gray-600 text-xs mt-1">{setName}</p>
                </div>

                {/* Contenido variable según modo */}
                {!marketplace ? (
                  /**
                   * Modo normal:
                   * se muestran datos básicos de la carta si existen (rareza y HP),
                   * porque en búsquedas suele ser útil ver algo más aparte del nombre.
                   */
                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                    {tcg.rarity && (
                      <p>
                        <span className="font-semibold">Rareza:</span> {tcg.rarity}
                      </p>
                    )}
                    {tcg.hp && (
                      <p>
                        <span className="font-semibold">HP:</span> {tcg.hp}
                      </p>
                    )}
                  </div>
                ) : (
                  /**
                   * Modo marketplace:
                   * aquí interesa más lo “comercial”: vendedor, valoración y grado.
                   */
                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                    <p>
                      <span className="font-semibold">Vendedor:</span>{" "}
                      {vendedorNombre || "Desconocido"}
                    </p>
                    <p>
                      <span className="font-semibold">Valoración:</span>{" "}
                      {valoracionMedia5 !== null
                        ? `${valoracionMedia5.toFixed(2)} / 5`
                        : "Sin valoraciones"}
                    </p>
                    <p>
                      <span className="font-semibold">Grado:</span>{" "}
                      {gradoTexto || "Sin grado"}
                    </p>
                  </div>
                )}

                {/* Bloque inferior solo en marketplace: estado y precio */}
                {marketplace && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <span className="text-green-600 font-bold text-xs">En venta</span>
                      </div>

                      {precio !== null && (
                        <span className="text-sm font-bold text-red-600">
                          {Number(precio).toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
