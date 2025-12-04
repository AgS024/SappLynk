// react/src/views/Marketplace.jsx
import { useEffect, useState } from "react";
import PageComponent from "../components/PageComponent.jsx";
import axiosClient from "../axios.js";
import CardGrid from "../components/CardGrid.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { useStateContext } from "../Contexts/ContextProvider.jsx";

export default function Marketplace() {
  const [cartasEnVentaLocal, setCartasEnVentaLocal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ q: "", type: "" });

  // 👤 Usuario actual + estado global de cartas en venta
  const { currentUser, cartasEnVenta, setCartasEnVenta } = useStateContext();

  useEffect(() => {
    cargarCartasEnVenta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarCartasEnVenta = (nuevosFiltros = filtros) => {
    setLoading(true);

    axiosClient
      .get("/enventa")
      .then((res) => {
        console.log("Cartas en venta desde BD:", res.data);
        let cartas = res.data || [];

        const miId = currentUser?.id;

        // ❌ Filtrar MIS publicaciones (no quiero ver mis cartas en venta)
        if (miId) {
          cartas = cartas.filter((pub) => pub.id_usuario !== miId);
        }

        // 🔍 Filtrar por nombre si hay búsqueda
        if (nuevosFiltros.q) {
          const q = nuevosFiltros.q.toLowerCase();
          cartas = cartas.filter((pub) =>
            pub.tcgdex?.name?.toLowerCase().includes(q)
          );
        }

        // 🔥 Filtrar por tipo si está seleccionado
        if (nuevosFiltros.type) {
          cartas = cartas.filter((pub) =>
            pub.tcgdex?.types?.includes(nuevosFiltros.type)
          );
        }

        setCartasEnVentaLocal(cartas);
        setCartasEnVenta(cartas);
      })
      .catch((err) => {
        console.error("Error cargando cartas en venta:", err);
        setCartasEnVentaLocal([]);
        setCartasEnVenta([]);
      })
      .finally(() => setLoading(false));
  };

  const handleSearch = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    cargarCartasEnVenta(nuevosFiltros);
  };

  const hayCartas = cartasEnVentaLocal.length > 0;

  return (
    <PageComponent title="🛍️ Marketplace de Cartas Pokémon">
      <div className="space-y-6">
        <SearchBar onSearch={handleSearch} />

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              ⏳ Cargando cartas en venta...
            </p>
          </div>
        ) : !hayCartas ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              📭 No hay cartas disponibles en venta (o ya filtraste todas).
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-600">
              Se encontraron{" "}
              <span className="font-bold text-red-600">
                {cartasEnVentaLocal.length}
              </span>{" "}
              cartas en venta
            </p>
            <CardGrid cartas={cartasEnVentaLocal} marketplace={true} />
          </>
        )}
      </div>
    </PageComponent>
  );
}
