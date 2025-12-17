import { useEffect, useState } from "react";
import PageComponent from "../shared/components/PageComponent.jsx";
import axiosClient from "../axios.js";
import CardGrid from "../features/marketplace/components/CardGrid.jsx";
import SearchBarAvanzado from "../shared/components/SearchBarAvanzado.jsx";
import { useStateContext } from "../Contexts/ContextProvider.jsx";

export default function Marketplace() {
  const [cartasEnVentaLocal, setCartasEnVentaLocal] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filtros, setFiltros] = useState({
    name: "",
    types: "",
    set: "",
  });

  const [sets, setSets] = useState([]);
  const { currentUser, setCartasEnVenta } = useStateContext();

  useEffect(() => {
    cargarSets();
    cargarCartasEnVenta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarSets = () => {
    axiosClient
      .get("/cartas/sets")
      .then((res) => {
        setSets(res.data || []);
      })
      .catch(() => {
        setSets([]);
      });
  };

  const cargarCartasEnVenta = (nuevosFiltros = filtros) => {
    setLoading(true);

    axiosClient
      .get("/enventa")
      .then((res) => {
        let cartas = res.data || [];

        const miId = currentUser?.id;
        if (miId) {
          cartas = cartas.filter((pub) => pub.id_usuario !== miId);
        }

        const { name, types, set } = nuevosFiltros || {};

        if (name && String(name).trim() !== "") {
          const q = String(name).toLowerCase().trim();
          cartas = cartas.filter((pub) => {
            const tcg = pub.tcgdex || {};
            const nombre = String(tcg.name || "").toLowerCase();
            const idCarta = String(pub.id_carta || tcg.id || "").toLowerCase();
            return nombre.includes(q) || idCarta.includes(q);
          });
        }

        if (types && String(types).trim() !== "") {
          const selectedType = String(types).toLowerCase().trim();

          cartas = cartas.filter((pub) => {
            const tcg = pub.tcgdex || {};
            const cardTypes = Array.isArray(tcg.types)
              ? tcg.types
              : tcg.types
              ? [tcg.types]
              : [];

            return cardTypes.some(
              (t) => String(t).toLowerCase().trim() === selectedType
            );
          });
        }

        if (set && String(set).trim() !== "") {
          const selectedSetId = String(set).toLowerCase();

          cartas = cartas.filter((pub) => {
            const tcg = pub.tcgdex || {};
            const setObj = tcg.set || {};

            const candidates = [setObj.id, setObj.localId, setObj.code].filter(
              Boolean
            );

            if (candidates.length === 0) {
              const cardId = String(tcg.id || pub.id_carta || "").toLowerCase();
              const [prefix] = cardId.split("-");
              if (prefix) {
                candidates.push(prefix);
              }
            }

            return candidates.some(
              (c) => String(c).toLowerCase() === selectedSetId
            );
          });
        }

        setCartasEnVentaLocal(cartas);
        if (setCartasEnVenta) setCartasEnVenta(cartas);
      })
      .catch(() => {
        setCartasEnVentaLocal([]);
        if (setCartasEnVenta) setCartasEnVenta([]);
      })
      .finally(() => setLoading(false));
  };

  const handleSearch = (nuevosFiltros) => {
    setFiltros(nuevosFiltros || { name: "", types: "", set: "" });
    cargarCartasEnVenta(nuevosFiltros || {});
  };

  const hayCartas = cartasEnVentaLocal.length > 0;

  return (
    <PageComponent title="🛍️ Marketplace de Cartas Pokémon">
      <div className="space-y-6">
        <SearchBarAvanzado onSearch={handleSearch} sets={sets} />

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">⏳ Cargando cartas en venta...</p>
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
