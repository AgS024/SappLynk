// Hooks de React:
// - useState: guardar estado local (cartas, loading, error)
// - useEffect: cargar la colección al montar la vista y controlar limpieza (cancelación)
import { useEffect, useState } from "react";

// React Router:
// - useNavigate: navegación programática hacia el detalle de una carta en la colección
import { useNavigate } from "react-router-dom";

// Componente de layout común: título + contenedor + zona de botones en cabecera
import PageComponent from "../shared/components/PageComponent.jsx";

// Cliente Axios configurado para hablar con el backend (incluye token y baseURL)
import axiosClient from "../axios.js";

// Item visual para mostrar cada entrada de colección como tarjeta/celda del grid
import CartaListItem from "../features/coleccion/components/CartaListItem.jsx";

// Botón reutilizable con estilos (Link o button según props)
import TButton from "../shared/components/TButton.jsx";

// Icono decorativo para el botón de “Buscar Cartas”
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function Coleccion() {
  /**
   * cartas:
   * - Lista de entradas de la colección del usuario.
   * - Suele venir con campos como:
   *   - id_carta (string tipo "swsh1-1")
   *   - id_grado
   *   - cantidad
   *   - notas
   *   - (y opcionalmente tcgdex con datos enriquecidos)
   */
  const [cartas, setCartas] = useState([]);

  // loading / error: controlan el estado de la UI mientras se carga la colección
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navegación hacia vistas de detalle/otras rutas
  const navigate = useNavigate();

  /**
   * useEffect de carga inicial:
   * - Se ejecuta una sola vez (dependencias [])
   * - Pide la colección al backend:
   *   GET /coleccion
   *
   * Control de “cancelado”:
   * - Se usa una bandera local para evitar setState si el componente se desmonta
   * - Es un patrón simple para evitar warnings de React en cargas asíncronas
   */
  useEffect(() => {
    let cancelado = false;

    const cargarColeccion = () => {
      setLoading(true);
      setError(null);

      axiosClient
        .get("/coleccion")
        .then((res) => {
          if (cancelado) return;

          // Se fuerza a array por seguridad (si la API devuelve algo inesperado)
          const data = Array.isArray(res.data) ? res.data : [];
          setCartas(data);
        })
        .catch((err) => {
          if (cancelado) return;

          // Casos típicos de cancelación/abort (no se muestran como error real)
          if (err.code === "ECONNABORTED" || err.message === "canceled") {
            console.warn("Petición de colección cancelada/abortada:", err.message);
            return;
          }

          console.error("Error cargando colección:", err);
          setError("No se ha podido cargar tu colección.");
        })
        .finally(() => {
          if (!cancelado) setLoading(false);
        });
    };

    cargarColeccion();

    // Cleanup del efecto: marca el componente como “desmontado”
    return () => {
      cancelado = true;
    };
  }, []);

  /**
   * handleDelete
   *
   * Elimina una carta de la colección y actualiza el estado local para reflejarlo en el grid.
   *
   * Estrategia de borrado:
   * 1) Si existe un id numérico (id o id_coleccion):
   *    DELETE /coleccion/{id}
   *    -> borra una fila concreta de la tabla (entrada exacta)
   *
   * 2) Si NO existe id numérico pero hay id_carta:
   *    DELETE /coleccion/carta/{id_carta}
   *    -> borra por identificador de carta (posible borrado “más amplio” según backend)
   *
   * Nota:
   * - Se pide confirmación con window.confirm para evitar borrados accidentales.
   */
  const handleDelete = (carta) => {
    // Confirmación rápida en el navegador
    if (!window.confirm("¿Eliminar esta carta de tu colección?")) return;

    // Caso 1: id numérico (entrada concreta en colección)
    const numericId = carta.id ?? carta.id_coleccion ?? null;

    if (numericId) {
      axiosClient
        .delete(`/coleccion/${numericId}`)
        .then(() => {
          // Actualización optimista local: se filtra la carta eliminada
          setCartas((prev) =>
            prev.filter((c) => (c.id ?? c.id_coleccion) !== numericId)
          );
        })
        .catch((err) => {
          console.error("Error eliminando carta de la colección:", err);
          alert("No se ha podido eliminar la carta.");
        });
      return;
    }

    // Caso 2: borrado por id_carta
    const idCarta = carta.id_carta ?? null;
    if (!idCarta) {
      console.error("No se encontró id para eliminar esta carta:", carta);
      alert("No se ha podido determinar el identificador de la carta.");
      return;
    }

    axiosClient
      .delete(`/coleccion/carta/${idCarta}`)
      .then(() => {
        setCartas((prev) => prev.filter((c) => c.id_carta !== idCarta));
      })
      .catch((err) => {
        console.error("Error eliminando carta de la colección por id_carta:", err);
        alert("No se ha podido eliminar la carta.");
      });
  };

  /**
   * handleOpenDetalle
   *
   * Abre la vista de detalle de una carta dentro de “Mi colección”.
   * - La ruta usa id_carta (string), no id numérico.
   * - Navega a: /mi-coleccion/{id_carta}
   *
   * Esta vista de detalle suele permitir:
   * - modificar cantidad, grado, notas
   * - eliminar
   * - publicar en venta (según el diseño del proyecto)
   */
  const handleOpenDetalle = (carta) => {
    const idCarta = carta.id_carta ?? null;

    if (!idCarta) {
      console.error("No se encontró id_carta para abrir detalle:", carta);
      alert("No se ha podido determinar el identificador de esta carta.");
      return;
    }

    navigate(`/mi-coleccion/${idCarta}`);
  };

  /**
   * Render principal:
   * - PageComponent pone el título y un botón en cabecera ("Buscar Cartas")
   * - Luego se decide el contenido según estado:
   *   1) loading -> mensaje de carga
   *   2) error -> mensaje en rojo
   *   3) lista vacía -> mensaje informativo
   *   4) lista con elementos -> grid de CartaListItem
   */
  return (
    <PageComponent
      title="Mi colección"
      buttons={
        <TButton color="indigo" to="/coleccion/explorar-cartas">
          <SparklesIcon className="h-6 w-6 mr-2" />
          Buscar Cartas
        </TButton>
      }
    >
      {loading ? (
        <p className="text-gray-500">Cargando tu colección...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : cartas.length === 0 ? (
        <p className="text-gray-500">
          Aún no tienes cartas en tu colección. Añade alguna desde el
          explorador de cartas.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cartas.map((carta, index) => {
            /**
             * key:
             * - Se construye una key estable “lo mejor posible” usando:
             *   - id_carta (identificador global de la carta)
             *   - id_grado (distingue copias por condición)
             *   - id / id_coleccion (si existe) o index como último recurso
             *
             * Motivo:
             * - Evitar colisiones cuando hay varias entradas de la misma carta con distinto grado.
             */
            const key =
              `${carta.id_carta || "sin-idcarta"}` +
              `-${carta.id_grado ?? "sin-grado"}` +
              `-${carta.id ?? carta.id_coleccion ?? index}`;

            return (
              <CartaListItem
                key={key}
                carta={carta}
                // onPublish se usa aquí como “abrir detalle” al hacer click en la tarjeta
                onPublish={() => handleOpenDetalle(carta)}
                // onDelete dispara el borrado con confirmación
                onDelete={() => handleDelete(carta)}
              />
            );
          })}
        </div>
      )}
    </PageComponent>
  );
}
