import { useEffect, useState } from "react";
import PageComponent from "../components/PageComponent.jsx";
import axiosClient from "../axios.js";
import CardGridSelectable from "../components/CardGridSelectable.jsx";
import SearchBarAvanzado from "../components/SearchBarAvanzado.jsx";
import ModalAñadirCarta from "../components/ModalAñadirCarta.jsx";

export default function ExplorarCartas() {
  const [cartas, setCartas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sets, setSets] = useState([]);
  const [filtros, setFiltros] = useState({
    name: "",
    types: "",
    set: "",
  });

  // Estado del modal de COLECCIÓN
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);

  useEffect(() => {
    cargarSets();
    buscarCartas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarSets = () => {
    axiosClient
      .get("/cartas/sets")
      .then((res) => {
        console.log("Sets cargados:", res.data);
        setSets(res.data);
      })
      .catch((err) => console.error("Error cargando sets:", err));
  };

  const buscarCartas = (nuevosFiltros = filtros) => {
    setLoading(true);

    const params = new URLSearchParams();

    if (nuevosFiltros.name) params.append("name", nuevosFiltros.name);
    if (nuevosFiltros.types) params.append("types", nuevosFiltros.types);
    if (nuevosFiltros.set) params.append("set", nuevosFiltros.set);

    const url = params.toString()
      ? `/cartas/search/advanced?${params.toString()}`
      : `/cartas/search/advanced`;

    console.log("Llamando a:", url);

    axiosClient
      .get(url)
      .then((res) => {
        let data = Array.isArray(res.data) ? res.data : [];

        if (nuevosFiltros.set) {
          const setIdFiltro = String(nuevosFiltros.set).toLowerCase();

          data = data.filter((carta) => {
            const tcg = carta.tcgdex || carta.data || carta.carta || carta;

            const setObj =
              tcg?.set ||
              carta?.tcgdex?.set ||
              carta?.data?.set ||
              carta?.carta?.set ||
              carta?.set;

            if (setObj && typeof setObj === "object") {
              const posibleId =
                setObj.id ||
                setObj.code ||
                setObj.localId ||
                setObj.setId ||
                setObj.set;
              if (posibleId) {
                return String(posibleId).toLowerCase() === setIdFiltro;
              }
            }

            if (typeof setObj === "string") {
              return setObj.toLowerCase() === setIdFiltro;
            }

            const tcgId = tcg.id || carta.id_carta || carta.id;
            if (tcgId) {
              const [prefijo] = String(tcgId).split("-");
              if (prefijo) {
                return prefijo.toLowerCase() === setIdFiltro;
              }
            }

            return false;
          });
        }

        console.log(
          `Cartas cargadas: ${res.data.length}, tras filtro de set: ${data.length}`
        );
        setCartas(data);
      })
      .catch((err) => {
        console.error("Error cargando cartas:", err);
        setCartas([]);
      })
      .finally(() => setLoading(false));
  };

  const handleSearch = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    buscarCartas(nuevosFiltros);
  };

  // Cuando se hace clic en una carta del grid → modal de COLECCIÓN
  const handleSeleccionCarta = (carta) => {
    setCartaSeleccionada(carta);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setCartaSeleccionada(null);
  };

  const handleConfirmColeccion = () => {
    // El propio ModalAñadirCarta hace el POST a /coleccion
    cerrarModal();
  };

  return (
    <PageComponent title="🔍 Explorar Cartas Pokémon">
      <div className="space-y-6">
        <SearchBarAvanzado onSearch={handleSearch} sets={sets} />

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">⏳ Cargando cartas...</p>
          </div>
        ) : cartas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              📭 No se encontraron cartas
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-600">
              Se encontraron{" "}
              <span className="font-bold text-red-600">{cartas.length}</span>{" "}
              cartas
            </p>
            <CardGridSelectable
              cartas={cartas}
              onSelectCarta={handleSeleccionCarta}
              sets={sets}
            />
          </>
        )}

        {modalAbierto && cartaSeleccionada && (
          <ModalAñadirCarta
            carta={cartaSeleccionada}
            sets={sets}
            onConfirm={handleConfirmColeccion}
            onCancel={cerrarModal}
          />
        )}
      </div>
    </PageComponent>
  );
}
