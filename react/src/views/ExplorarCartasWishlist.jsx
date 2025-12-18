// react/src/views/ExplorarCartasWishlist.jsx

// Hooks de React:
// - useState: estado local (cartas, loading, sets, filtros y control del modal)
// - useEffect: ejecutar cargas iniciales al entrar en la vista
import { useEffect, useState } from "react";

// Componente de layout común (título + contenedor con padding)
import PageComponent from "../shared/components/PageComponent.jsx";

// Cliente Axios del proyecto para hablar con el backend (rutas protegidas por token)
import axiosClient from "../axios.js";

// Grid paginado de cartas: muestra resultados y permite seleccionar una carta con click
import CardGridSelectable from "../features/coleccion/components/CardGridSelectable.jsx";

// Barra de búsqueda avanzada: devuelve filtros { name, types, set }
import SearchBarAvanzado from "../shared/components/SearchBarAvanzado.jsx";

// Modal específico de wishlist: permite guardar la carta y asignar un precio de aviso
import ModalWishlistCarta from "../features/wishlist/components/ModalWishlistCarta.jsx";

export default function ExplorarCartasWishlist() {
  /**
   * cartas:
   * - lista de resultados de la búsqueda avanzada
   * - se utiliza para pintar el grid de cartas
   */
  const [cartas, setCartas] = useState([]);

  /**
   * loading:
   * - indica que se está realizando la petición a la API
   * - sirve para mostrar un estado de carga y evitar “parpadeos” raros
   */
  const [loading, setLoading] = useState(false);

  /**
   * sets:
   * - listado de sets disponibles (para el select del buscador)
   * - también ayuda a resolver el nombre del set en componentes que lo necesiten
   */
  const [sets, setSets] = useState([]);

  /**
   * filtros:
   * - estado que representa lo que se está buscando actualmente
   * - estructura pensada para la API: name, types y set
   */
  const [filtros, setFiltros] = useState({ name: "", types: "", set: "" });

  /**
   * modalAbierto + cartaSeleccionada:
   * - controlan el flujo de “añadir a wishlist”
   * - al seleccionar una carta en el grid, se abre el modal con esa carta cargada
   */
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);

  /**
   * useEffect inicial:
   * - al entrar a la vista se hace:
   *   1) cargarSets() -> para tener el desplegable de sets listo
   *   2) buscarCartas() -> primera búsqueda sin filtros (o con filtros iniciales vacíos)
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
   * - cargar el listado de sets para poder filtrar por set en el buscador avanzado
   * - si falla, se deja sets como [] para no romper el render
   */
  const cargarSets = () => {
    axiosClient
      .get("/cartas/sets")
      .then((res) => setSets(res.data || []))
      .catch((err) => {
        console.error("Error cargando sets:", err);
        setSets([]);
      });
  };

  /**
   * buscarCartas
   *
   * Petición:
   * - GET /cartas/search/advanced
   * - si hay filtros, se añaden como query params:
   *   - name=..., types=..., set=...
   *
   * Detalle:
   * - además de enviar el filtro “set” a la API, se aplica un filtro extra en frontend.
   * - esto se hace porque el set puede venir representado de formas distintas:
   *   1) como objeto con id/code/localId/...
   *   2) como string
   *   3) deducible por el prefijo del id de carta (ej: "swsh1-1" → "swsh1")
   * - el filtro extra ayuda a mantener resultados coherentes si la API devuelve formatos mezclados.
   */
  const buscarCartas = (nuevosFiltros = filtros) => {
    setLoading(true);

    // Construcción de query params de forma limpia y sin concatenaciones manuales
    const params = new URLSearchParams();
    if (nuevosFiltros.name) params.append("name", nuevosFiltros.name);
    if (nuevosFiltros.types) params.append("types", nuevosFiltros.types);
    if (nuevosFiltros.set) params.append("set", nuevosFiltros.set);

    // URL final (con o sin query)
    const url = params.toString()
      ? `/cartas/search/advanced?${params.toString()}`
      : `/cartas/search/advanced`;

    axiosClient
      .get(url)
      .then((res) => {
        // Normalización: asegurar array para poder map/filter sin errores
        let data = Array.isArray(res.data) ? res.data : [];

        // Filtro adicional por set (solo si se ha seleccionado set)
        if (nuevosFiltros.set) {
          const setIdFiltro = String(nuevosFiltros.set).toLowerCase();

          data = data.filter((carta) => {
            // “tcg” intenta unificar formatos: a veces llega como carta.tcgdex, carta.data, etc.
            const tcg = carta.tcgdex || carta.data || carta.carta || carta;

            // Posibles ubicaciones del set según el formato
            const setObj =
              tcg?.set ||
              carta?.tcgdex?.set ||
              carta?.data?.set ||
              carta?.carta?.set ||
              carta?.set;

            // Caso 1: set como objeto
            if (setObj && typeof setObj === "object") {
              const posibleId =
                setObj.id ||
                setObj.code ||
                setObj.localId ||
                setObj.setId ||
                setObj.set;

              if (posibleId) return String(posibleId).toLowerCase() === setIdFiltro;
            }

            // Caso 2: set como string
            if (typeof setObj === "string") return setObj.toLowerCase() === setIdFiltro;

            // Caso 3: deducir set a partir del id (prefijo antes del guion)
            const tcgId = tcg.id || carta.id_carta || carta.id;
            if (tcgId) {
              const [prefijo] = String(tcgId).split("-");
              if (prefijo) return prefijo.toLowerCase() === setIdFiltro;
            }

            return false;
          });
        }

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
   * - recibe los filtros desde SearchBarAvanzado
   * - actualiza estado y lanza búsqueda con esos filtros
   */
  const handleSearch = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    buscarCartas(nuevosFiltros);
  };

  /**
   * handleSeleccionCarta
   * - se ejecuta al hacer click en una carta del grid
   * - abre el modal para añadir a wishlist
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
   * handleConfirmWishlist
   * - se ejecuta cuando el modal confirma
   * - el POST a /wishlist se hace dentro de ModalWishlistCarta
   * - aquí solo se cierra el modal para volver al grid
   */
  const handleConfirmWishlist = () => {
    cerrarModal();
  };

  return (
    <PageComponent title="🔍 Explorar Cartas para Wishlist">
      <div className="space-y-6">
        {/* Buscador avanzado: filtra por nombre, tipo y set */}
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

            {/* Grid paginado: al seleccionar una carta se abre el modal */}
            <CardGridSelectable
              cartas={cartas}
              onSelectCarta={handleSeleccionCarta}
              sets={sets}
            />
          </>
        )}

        {/* Modal: pide precio de aviso y guarda la carta en wishlist */}
        {modalAbierto && cartaSeleccionada && (
          <ModalWishlistCarta
            carta={cartaSeleccionada}
            sets={sets}
            onConfirm={handleConfirmWishlist}
            onCancel={cerrarModal}
          />
        )}
      </div>
    </PageComponent>
  );
}
