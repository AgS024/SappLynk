// react/src/views/ExplorarCartas.jsx

// Hooks de React:
// - useState: estado local (cartas, loading, sets, filtros y control del modal)
// - useEffect: cargar sets y hacer una primera búsqueda al entrar en la vista
import { useEffect, useState } from "react";

// Componente “contenedor” para mantener el mismo layout (título + padding + ancho)
import PageComponent from "../shared/components/PageComponent.jsx";

// Cliente Axios configurado para llamar al backend (incluye token si existe)
import axiosClient from "../axios.js";

// Grid paginado de cartas seleccionables (al hacer click, se selecciona una carta)
import CardGridSelectable from "../features/coleccion/components/CardGridSelectable.jsx";

// Barra de búsqueda avanzada que devuelve un objeto filtros { name, types, set }
import SearchBarAvanzado from "../shared/components/SearchBarAvanzado.jsx";

// Modal para añadir una carta a la colección (elige grado, cantidad y notas)
import ModalAñadirCarta from "../features/coleccion/components/ModalAñadirCarta.jsx";

export default function ExplorarCartas() {
  /**
   * cartas:
   * - lista de cartas que llegan desde la API (búsqueda avanzada)
   * - se usan para pintar el grid (CardGridSelectable)
   */
  const [cartas, setCartas] = useState([]);

  /**
   * loading:
   * - indica si la búsqueda está en curso
   * - sirve para mostrar el estado “Cargando cartas...”
   */
  const [loading, setLoading] = useState(false);

  /**
   * sets:
   * - lista de sets de TCGdex (o del backend que los exponga)
   * - se usa para rellenar el desplegable del buscador avanzado
   * - también se pasa al grid para resolver nombres de set
   */
  const [sets, setSets] = useState([]);

  /**
   * filtros:
   * - estado local de filtros actuales
   * - estructura pensada para cuadrar con la API: name, types, set
   */
  const [filtros, setFiltros] = useState({
    name: "",
    types: "",
    set: "",
  });

  /**
   * modalAbierto + cartaSeleccionada:
   * - controlan el modal de “añadir a colección”
   * - cuando se hace click en una carta del grid:
   *   - cartaSeleccionada guarda la carta elegida
   *   - modalAbierto pasa a true para renderizar el modal
   */
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);

  /**
   * useEffect inicial:
   * - al montar la vista:
   *   1) cargarSets -> para tener el listado de sets disponible en el buscador
   *   2) buscarCartas -> hace una primera carga de cartas (sin filtros)
   *
   * Nota:
   * - eslint-disable para no meter “filtros” como dependencia, ya que aquí se quiere
   *   que sea una carga inicial y punto.
   */
  useEffect(() => {
    cargarSets();
    buscarCartas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * cargarSets
   *
   * Petición:
   * - GET /cartas/sets
   *
   * Objetivo:
   * - traer todos los sets para:
   *   - mostrarlos en el SearchBarAvanzado
   *   - ayudar a resolver nombres (cuando la carta viene con datos incompletos)
   */
  const cargarSets = () => {
    axiosClient
      .get("/cartas/sets")
      .then((res) => {
        console.log("Sets cargados:", res.data);
        setSets(res.data);
      })
      .catch((err) => console.error("Error cargando sets:", err));
  };

  /**
   * buscarCartas
   *
   * Petición:
   * - GET /cartas/search/advanced (con query params si hay filtros)
   *
   * Estrategia:
   * 1) construir query params (URLSearchParams) con:
   *    - name, types, set
   * 2) montar URL final:
   *    - /cartas/search/advanced?name=...&types=...&set=...
   * 3) guardar resultado en estado (cartas)
   *
   * Detalle importante:
   * - además del filtro “set” que se pasa a la API, se hace un filtro extra en frontend.
   * - esto se hace porque según la respuesta de la API, el set puede venir:
   *   - como objeto con id/code/localId
   *   - como string
   *   - o deducible por prefijo del id de la carta (ej: "swsh1-1" -> "swsh1")
   * - ese filtro extra garantiza que el “set” seleccionado se respeta aunque el formato venga raro.
   */
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
        // Normalización: si no es array, se evita romper el render
        let data = Array.isArray(res.data) ? res.data : [];

        /**
         * Filtro extra de set (frontend):
         * - si el usuario ha seleccionado un set, se intenta comprobarlo contra:
         *   1) setObj (objeto) -> id/code/localId/...
         *   2) setObj (string)
         *   3) prefijo del id de carta (swsh1-1 -> swsh1)
         */
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

            // Caso 1: set como objeto (TCGdex suele meter info estructurada)
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

            // Caso 2: set como string
            if (typeof setObj === "string") {
              return setObj.toLowerCase() === setIdFiltro;
            }

            // Caso 3: fallback por id de carta (prefijo antes del “-”)
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

  /**
   * handleSearch
   * - callback que recibe filtros desde SearchBarAvanzado
   * - actualiza el estado de filtros y lanza una nueva búsqueda
   */
  const handleSearch = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    buscarCartas(nuevosFiltros);
  };

  /**
   * handleSeleccionCarta
   * - se ejecuta cuando se hace click en una carta del grid
   * - abre el modal de “añadir a colección” con esa carta preseleccionada
   */
  const handleSeleccionCarta = (carta) => {
    setCartaSeleccionada(carta);
    setModalAbierto(true);
  };

  /**
   * cerrarModal
   * - cierra el modal y limpia la carta seleccionada
   */
  const cerrarModal = () => {
    setModalAbierto(false);
    setCartaSeleccionada(null);
  };

  /**
   * handleConfirmColeccion
   * - se ejecuta cuando el modal confirma
   * - en este flujo, el POST a /coleccion se hace dentro del ModalAñadirCarta
   * - aquí solo se cierra el modal para volver al grid
   */
  const handleConfirmColeccion = () => {
    cerrarModal();
  };

  return (
    <PageComponent title="🔍 Explorar Cartas Pokémon">
      <div className="space-y-6">
        {/* Buscador avanzado (nombre, tipo y set) */}
        <SearchBarAvanzado onSearch={handleSearch} sets={sets} />

        {/* Estados de carga / vacío / resultados */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">⏳ Cargando cartas...</p>
          </div>
        ) : cartas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">📭 No se encontraron cartas</p>
          </div>
        ) : (
          <>
            {/* Contador de resultados */}
            <p className="text-gray-600">
              Se encontraron{" "}
              <span className="font-bold text-red-600">{cartas.length}</span>{" "}
              cartas
            </p>

            {/* Grid paginado: al seleccionar una carta abre el modal */}
            <CardGridSelectable
              cartas={cartas}
              onSelectCarta={handleSeleccionCarta}
              sets={sets}
            />
          </>
        )}

        {/* Modal para añadir a colección (grado, cantidad, notas) */}
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
