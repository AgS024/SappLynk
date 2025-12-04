// react/src/views/MisCartasEnVenta.jsx
import { useEffect, useState } from "react";
import PageComponent from "../components/PageComponent.jsx";
import axiosClient from "../axios.js";
import { useStateContext } from "../Contexts/ContextProvider.jsx";

export default function MisCartasEnVenta() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preciosEdit, setPreciosEdit] = useState({});
  const { setCartasEnVenta } = useStateContext();

  useEffect(() => {
    cargarMisPublicaciones();
  }, []);

  const cargarMisPublicaciones = () => {
    setLoading(true);
    axiosClient
      .get("/enventa/mias")
      .then((res) => {
        setPublicaciones(res.data);
        if (setCartasEnVenta) {
          setCartasEnVenta(res.data);
        }
      })
      .catch((err) => {
        console.error("Error cargando mis cartas en venta:", err);
        setPublicaciones([]);
      })
      .finally(() => setLoading(false));
  };

  const handlePrecioChange = (id, valor) => {
    setPreciosEdit((prev) => ({
      ...prev,
      [id]: valor,
    }));
  };

  const handleGuardarPrecio = (pub) => {
    const nuevoPrecioStr = preciosEdit[pub.id] ?? pub.precio;
    const nuevoPrecio = Number(nuevoPrecioStr);

    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
      alert("Introduce un precio válido mayor que 0.");
      return;
    }

    axiosClient
      .put(`/enventa/${pub.id}`, { precio: nuevoPrecio })
      .then((res) => {
        const actualizada = res.data.en_venta ?? res.data;

        setPublicaciones((prev) =>
          prev.map((p) => (p.id === pub.id ? { ...p, ...actualizada } : p))
        );

        setPreciosEdit((prev) => ({
          ...prev,
          [pub.id]: actualizada.precio,
        }));
      })
      .catch((err) => {
        console.error("Error actualizando precio:", err);
        alert("No se ha podido actualizar el precio.");
      });
  };

  const handleRetirar = (pub) => {
    if (
      !window.confirm(
        "¿Seguro que quieres retirar esta carta de la venta? Se devolverá a tu colección."
      )
    ) {
      return;
    }

    axiosClient
      .delete(`/enventa/${pub.id}`)
      .then(() => {
        // Se devuelve a la colección en el backend
        setPublicaciones((prev) => prev.filter((p) => p.id !== pub.id));
      })
      .catch((err) => {
        console.error("Error retirando carta de la venta:", err);
        alert("No se ha podido retirar la carta de la venta.");
      });
  };

  // 🔧 IMPORTANTE: misma lógica que usas en otros sitios (incluyendo tcg.image “a pelo”)
  const getImageUrl = (pub) => {
    const tcg = pub.tcgdex || pub.carta || {};
    return (
      tcg.images?.small ||
      tcg.image?.normal ||
      pub.image ||
      tcg.image || // <- a veces viene así (string)
      "https://via.placeholder.com/250x350?text=Sin+imagen"
    );
  };

  const getNombreCarta = (pub) => {
    const tcg = pub.tcgdex || pub.carta || {};
    return tcg.name || "Carta sin nombre";
  };

  const getSetName = (pub) => {
    const tcg = pub.tcgdex || pub.carta || {};
    const setObj = tcg.set;

    if (setObj) {
      if (typeof setObj.name === "string") return setObj.name;
      if (typeof setObj.name === "object") {
        return (
          setObj.name.es ||
          setObj.name.en ||
          Object.values(setObj.name)[0] ||
          "Set desconocido"
        );
      }
    }

    return "Set desconocido";
  };

  return (
    <PageComponent title="Mis cartas en venta">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            ⏳ Cargando tus cartas en venta...
          </p>
        </div>
      ) : publicaciones.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            📭 Ahora mismo no tienes cartas en venta.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicaciones.map((pub) => {
            const precioActual =
              preciosEdit[pub.id] !== undefined
                ? preciosEdit[pub.id]
                : pub.precio;

            return (
              <div
                key={pub.id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
              >
                <div className="bg-gray-100 h-64 flex items-center justify-center">
                  <img
                    src={getImageUrl(pub)}
                    alt={getNombreCarta(pub)}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/250x350?text=Sin+imagen";
                    }}
                  />
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm truncate text-gray-900">
                      {getNombreCarta(pub)}
                    </h3>
                    <p className="text-gray-600 text-xs mt-1">
                      {getSetName(pub)}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Grado:{" "}
                      <span className="font-semibold">
                        {pub.grado?.nombre || `ID grado ${pub.id_grado}`}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Precio (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={precioActual}
                        onChange={(e) =>
                          handlePrecioChange(pub.id, e.target.value)
                        }
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none text-sm"
                      />
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleGuardarPrecio(pub)}
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold"
                      >
                        Guardar precio
                      </button>
                      <button
                        onClick={() => handleRetirar(pub)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
                      >
                        Retirar
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      Al retirar la carta, se devolverá 1 copia a tu colección.
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageComponent>
  );
}
