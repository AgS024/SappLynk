import { Link } from "react-router-dom";
import { StarIcon } from "@heroicons/react/24/solid";

export default function CardGrid({ cartas, marketplace = false }) {
  if (!cartas || cartas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No se encontraron cartas</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {cartas.map((carta) => {
        const tcg = carta.tcgdex || carta;

        const imageUrl =
          tcg.images?.small ||
          tcg.images?.large ||
          tcg.image?.normal ||
          carta.image?.normal ||
          tcg.image ||
          "https://via.placeholder.com/250x350?text=Sin+imagen";

        const cartaName = tcg.name || carta.name || "Carta sin nombre";
        const cartaId = tcg.id || carta.id_carta || carta.id;

        let setName = "Set desconocido";
        const setObj = tcg.set || carta.set;

        if (setObj) {
          if (typeof setObj.name === "string") {
            setName = setObj.name;
          } else if (typeof setObj.name === "object") {
            setName = setObj.name.es || setObj.name.en || "Set desconocido";
          }
        }

        const precio = marketplace ? carta.precio : null;

        let vendedorNombre = null;
        let valoracionMedia5 = null;
        let gradoTexto = null;

        if (marketplace) {
          const vendedor = carta.usuario || null;

          if (vendedor) {
            vendedorNombre =
              vendedor.name ||
              vendedor.nickname ||
              `Usuario #${vendedor.id || carta.id_usuario}`;

            const sumaVal = Number(vendedor.suma_val ?? 0);
            const cantVal = Number(vendedor.cantidad_val ?? 0);

            if (cantVal > 0) {
              const media10 = sumaVal / cantVal;
              valoracionMedia5 = media10 / 2;
            }
          } else {
            vendedorNombre = `Usuario #${carta.id_usuario}`;
          }

          const grado = carta.grado || null;
          gradoTexto =
            grado?.nombre || `Grado ${carta.id_grado ?? carta.id_grado ?? "?"}`;
        }

        const key = marketplace ? `enventa-${carta.id}` : `carta-${cartaId}`;
        const linkTo = marketplace ? `/marketplace/${carta.id}` : `/carta/${cartaId}`;

        return (
          <Link key={key} to={linkTo} className="group">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col relative">
              <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />

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

              <div className="p-4 flex-1 flex flex-col justify-between relative z-10">
                <div>
                  <h3 className="font-bold text-sm truncate text-gray-900">{cartaName}</h3>
                  <p className="text-gray-600 text-xs mt-1">{setName}</p>
                </div>

                {!marketplace ? (
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
