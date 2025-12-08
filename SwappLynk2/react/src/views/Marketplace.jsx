// react/src/views/Marketplace.jsx
import { useEffect, useState } from "react";
import PageComponent from "../components/PageComponent.jsx";
import axiosClient from "../axios.js";
import CardGrid from "../components/CardGrid.jsx";
// 🔁 Usamos el MISMO buscador avanzado que en ExplorarCartas
import SearchBarAvanzado from "../components/SearchBarAvanzado.jsx";
import { useStateContext } from "../Contexts/ContextProvider.jsx";

// 🔁 Mapeo igual que en CartaController::mapFrontendTypeToApiType (PHP)
function mapFrontendTypeToApiType(type) {
  const map = {
    fire: "Fire",
    water: "Water",
    grass: "Grass",
    electric: "Lightning",
    psychic: "Psychic",
    fighting: "Fighting",
    rock: "Fighting",
    ground: "Fighting",
    flying: "Colorless",
    bug: "Grass",
    poison: "Psychic",
    dark: "Darkness",
    ghost: "Psychic",
    steel: "Metal",
    dragon: "Dragon",
    fairy: "Fairy",
    normal: "Colorless",
  };

  const key = String(type || "").toLowerCase();
  return map[key] ?? type;
}

export default function Marketplace() {
  const [cartasEnVentaLocal, setCartasEnVentaLocal] = useState([]);
  const [loading, setLoading] = useState(false);

  // filtros con la MISMA forma que en ExplorarCartas
  const [filtros, setFiltros] = useState({
    name: "",
    types: "",
    set: "",
  });

  // Sets para el combo del buscador avanzado
  const [sets, setSets] = useState([]);

  // 👤 Usuario actual + estado global de cartas en venta
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
        console.log("Sets cargados (Marketplace):", res.data);
        setSets(res.data || []);
      })
      .catch((err) => {
        console.error("Error cargando sets en Marketplace:", err);
        setSets([]);
      });
  };

  const cargarCartasEnVenta = (nuevosFiltros = filtros) => {
    setLoading(true);

    axiosClient
      .get("/enventa")
      .then((res) => {
        console.log("Cartas en venta desde BD:", res.data);
        let cartas = res.data || [];

        const miId = currentUser?.id;

        // ⚠️ El backend ya excluye al usuario autenticado,
        // pero por si acaso volvemos a filtrar aquí:
        if (miId) {
          cartas = cartas.filter((pub) => pub.id_usuario !== miId);
        }

        // ===========================
        //   FILTROS AVANZADOS
        // ===========================
        const { name, types, set } = nuevosFiltros || {};

        // 🔍 Filtro por nombre / texto
        if (name && String(name).trim() !== "") {
          const q = String(name).toLowerCase().trim();
          cartas = cartas.filter((pub) => {
            const tcg = pub.tcgdex || {};
            const nombre = String(tcg.name || "").toLowerCase();
            const idCarta = String(pub.id_carta || tcg.id || "").toLowerCase();

            // Si algún día tienes dexId en tcg, también podrías mirarlo aquí
            return nombre.includes(q) || idCarta.includes(q);
          });
        }

        // 🔥 Filtro por tipo
        if (types && String(types).trim() !== "") {
          const apiType = mapFrontendTypeToApiType(types);
          cartas = cartas.filter((pub) => {
            const tcg = pub.tcgdex || {};
            const cardTypes = Array.isArray(tcg.types)
              ? tcg.types
              : tcg.types
              ? [tcg.types]
              : [];

            // Comparamos de forma case-insensitive
            return cardTypes.some(
              (t) =>
                String(t).toLowerCase() === String(apiType).toLowerCase()
            );
          });
        }

        // 🧩 Filtro por set
        if (set && String(set).trim() !== "") {
          const selectedSetId = String(set).toLowerCase();

          cartas = cartas.filter((pub) => {
            const tcg = pub.tcgdex || {};
            const setObj = tcg.set || {};

            // Intentamos con varias posibles claves (id, localId, code)
            const candidates = [
              setObj.id,
              setObj.localId,
              setObj.code,
            ].filter(Boolean);

            if (candidates.length === 0) {
              // Extra: a veces el set se puede deducir del id de la carta (p.ej., "swsh1-23")
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
        setCartasEnVenta && setCartasEnVenta(cartas);
      })
      .catch((err) => {
        console.error("Error cargando cartas en venta:", err);
        setCartasEnVentaLocal([]);
        setCartasEnVenta && setCartasEnVenta([]);
      })
      .finally(() => setLoading(false));
  };

  const handleSearch = (nuevosFiltros) => {
    // nuevosFiltros llega en forma { name, types, set } desde SearchBarAvanzado
    setFiltros(nuevosFiltros || { name: "", types: "", set: "" });
    cargarCartasEnVenta(nuevosFiltros || {});
  };

  const hayCartas = cartasEnVentaLocal.length > 0;

  return (
    <PageComponent title="🛍️ Marketplace de Cartas Pokémon">
      <div className="space-y-6">
        {/* 🔍 Mismo buscador avanzado que en ExplorarCartas */}
        <SearchBarAvanzado onSearch={handleSearch} sets={sets} />

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
