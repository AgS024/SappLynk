export default function CartaWishlistItem({ item, onDelete }) {
  const tcg = item.tcgdex || item.data || item.carta || item;

  const imageUrl =
    tcg.images?.small ||
    tcg.image?.normal ||
    item.image?.normal ||
    item.image ||
    tcg.image ||
    "https://via.placeholder.com/250x350?text=Sin+imagen";

  const cartaName = tcg.name || item.name || "Carta sin nombre";

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

  const precioAviso = item.precio_aviso;

  return (
    <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all relative">
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
          <p>
            <span className="font-semibold">🔔 Precio de aviso:</span>{" "}
            {precioAviso !== null && precioAviso !== undefined
              ? `${Number(precioAviso).toFixed(2)} €`
              : "Sin precio de aviso"}
          </p>
        </div>

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
