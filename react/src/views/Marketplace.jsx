// Hooks de React:
// - useState: guardar estado local (cartas, filtros, sets, loading)
// - useEffect: ejecutar cargas iniciales al montar el componente
import { useEffect, useState } from "react";

// Componente “contenedor” para mantener el mismo layout (título + contenido centrado)
import PageComponent from "../shared/components/PageComponent.jsx";

// Cliente Axios configurado para hablar con el backend (rutas /cartas/sets, /enventa, etc.)
import axiosClient from "../axios.js";

// Grid reutilizable para pintar cartas (en modo marketplace muestra vendedor, valoración, grado y precio)
import CardGrid from "../features/marketplace/components/CardGrid.jsx";

// Barra de búsqueda avanzada (nombre, tipo y set) para filtrar resultados
import SearchBarAvanzado from "../shared/components/SearchBarAvanzado.jsx";

// Contexto global:
// - currentUser: usuario autenticado (se usa para ocultar mis propias publicaciones)
// - setCartasEnVenta: guardar en el contexto el último listado cargado (por si se usa en otras vistas)
import { useStateContext } from "../Contexts/ContextProvider.jsx";

export default function Marketplace() {
  // Lista local de publicaciones “en venta” que se van a renderizar en el grid
  const [cartasEnVentaLocal, setCartasEnVentaLocal] = useState([]);

  // Estado de carga para mostrar spinner / mensaje mientras llega la API
  const [loading, setLoading] = useState(false);

  // Filtros activos del buscador (se guardan para recargar con los mismos criterios)
  const [filtros, setFiltros] = useState({
    name: "",
    types: "",
    set: "",
  });

  // Sets disponibles (se usan para el selector del buscador)
  const [sets, setSets] = useState([]);

  // Datos compartidos de sesión/contexto
  const { currentUser, setCartasEnVenta } = useStateContext();

  // Al montar la página:
  // 1) se cargan sets (para el filtro)
  // 2) se cargan publicaciones en venta (listado inicial)
  useEffect(() => {
    cargarSets();
    cargarCartasEnVenta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * cargarSets
   *
   * Pide al backend el listado de sets (desde la API de cartas).
   * Sirve para rellenar el desplegable del buscador.
   * Si falla, se deja el array vacío para que la UI siga funcionando.
   */
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

  /**
   * cargarCartasEnVenta
   *
   * Carga todas las publicaciones activas (GET /enventa) y luego aplica filtros en el front:
   * - Ocultar publicaciones propias (por id_usuario)
   * - Filtrar por nombre/id de carta
   * - Filtrar por tipo
   * - Filtrar por set (intentando varias claves del set y un fallback con prefijo del id)
   *
   * Además de guardarlo en estado local, se copia a contexto por si se reutiliza en otras pantallas.
   */
  const cargarCartasEnVenta = (nuevosFiltros = filtros) => {
    setLoading(true);

    axiosClient
      .get("/enventa")
      .then((res) => {
        // El backend devuelve un array de publicaciones; cada publicación suele venir con tcgdex embebido
        let cartas = res.data || [];

        // 1) Se eliminan publicaciones propias para que no aparezcan en el marketplace del usuario
        const miId = currentUser?.id;
        if (miId) {
          cartas = cartas.filter((pub) => pub.id_usuario !== miId);
        }

        // 2) Se aplican filtros “a mano” en el cliente
        const { name, types, set } = nuevosFiltros || {};

        // Filtro por nombre (o por id de carta):
        // Se busca en tcg.name y también en id_carta para cubrir casos donde el nombre no venga completo
        if (name && String(name).trim() !== "") {
          const q = String(name).toLowerCase().trim();
          cartas = cartas.filter((pub) => {
            const tcg = pub.tcgdex || {};
            const nombre = String(tcg.name || "").toLowerCase();
            const idCarta = String(pub.id_carta || tcg.id || "").toLowerCase();
            return nombre.includes(q) || idCarta.includes(q);
          });
        }

        // Filtro por tipo:
        // tcg.types puede venir como array o como string, así que se normaliza a array
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

        // Filtro por set:
        // El set puede identificarse por id/localId/code dentro de tcg.set,
        // y si no existe, se intenta deducir el prefijo del id de la carta (ej: "swsh1-1" -> "swsh1")
        if (set && String(set).trim() !== "") {
          const selectedSetId = String(set).toLowerCase();

          cartas = cartas.filter((pub) => {
            const tcg = pub.tcgdex || {};
            const setObj = tcg.set || {};

            const candidates = [setObj.id, setObj.localId, setObj.code].filter(
              Boolean
            );

            // Fallback: deducir set por prefijo del id
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

        // 3) Se actualiza el estado local y el contexto global
        setCartasEnVentaLocal(cartas);
        if (setCartasEnVenta) setCartasEnVenta(cartas);
      })
      .catch(() => {
        // Si la API falla, se limpia el listado para evitar datos desactualizados
        setCartasEnVentaLocal([]);
        if (setCartasEnVenta) setCartasEnVenta([]);
      })
      .finally(() => setLoading(false));
  };

  /**
   * handleSearch
   *
   * Callback que recibe los filtros desde SearchBarAvanzado.
   * Guarda esos filtros en estado y recarga el marketplace aplicándolos.
   */
  const handleSearch = (nuevosFiltros) => {
    setFiltros(nuevosFiltros || { name: "", types: "", set: "" });
    cargarCartasEnVenta(nuevosFiltros || {});
  };

  // Booleano simple para decidir si se muestra grid o mensaje de vacío
  const hayCartas = cartasEnVentaLocal.length > 0;

  return (
    <PageComponent title="🛍️ Marketplace de Cartas Pokémon">
      <div className="space-y-6">
        {/* Buscador: actualiza filtros y fuerza recarga del listado */}
        <SearchBarAvanzado onSearch={handleSearch} sets={sets} />

        {/* Estados de UI según carga / resultados */}
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
            {/* Contador de resultados */}
            <p className="text-gray-600">
              Se encontraron{" "}
              <span className="font-bold text-red-600">
                {cartasEnVentaLocal.length}
              </span>{" "}
              cartas en venta
            </p>

            {/* Grid en modo marketplace (muestra info de vendedor/precio/etc.) */}
            <CardGrid cartas={cartasEnVentaLocal} marketplace={true} />
          </>
        )}
      </div>
    </PageComponent>
  );
}
