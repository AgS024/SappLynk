// react/src/views/Wishlist.jsx
import { useEffect, useState } from "react";
import PageComponent from "../shared/components/PageComponent.jsx";
import axiosClient from "../axios.js";
import { useStateContext } from "../Contexts/ContextProvider.jsx";
import TButton from "../shared/components/TButton.jsx";
import { SparklesIcon } from "@heroicons/react/24/solid";
import CartaWishlistItem from "../features/wishlist/components/CartaWishlistItem.jsx";

export default function Wishlist() {
  /**
   * Estado local que almacena las cartas de la wishlist del usuario.
   */
  const [wishlist, setWishlist] = useState([]);

  /**
   * Estado de carga para mostrar feedback visual mientras se obtienen los datos.
   */
  const [loading, setLoading] = useState(false);

  /**
   * Setter del contexto global para mantener sincronizada la wishlist
   * en toda la aplicación.
   */
  const { setWishlist: setContextWishlist } = useStateContext();

  /**
   * Al montar el componente se carga la wishlist desde el backend.
   */
  useEffect(() => {
    cargarWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Obtiene del backend la wishlist asociada al usuario autenticado.
   * La respuesta se guarda tanto en el estado local como en el contexto global.
   */
  const cargarWishlist = () => {
    setLoading(true);

    axiosClient
      .get("/wishlist")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];

        console.log("Wishlist cargada:", data);

        setWishlist(data);
        if (setContextWishlist) {
          setContextWishlist(data);
        }
      })
      .catch((err) => {
        console.error("Error cargando wishlist:", err);

        // En caso de error se limpian los estados para evitar datos inconsistentes
        setWishlist([]);
        if (setContextWishlist) {
          setContextWishlist([]);
        }
      })
      .finally(() => setLoading(false));
  };

  /**
   * Elimina una carta concreta de la wishlist.
   * Se intenta usar primero el identificador interno del registro de wishlist
   * y, en caso de no existir, se utiliza el identificador de la carta como fallback.
   */
  const handleEliminar = (item) => {
    const idWishlist = item?.id ?? null;
    const idCarta = item?.id_carta ?? null;

    if (!idWishlist && !idCarta) {
      console.error("No se pudo determinar el identificador del elemento:", item);
      alert("No se ha podido eliminar la carta de la wishlist.");
      return;
    }

    if (!window.confirm("¿Eliminar de la wishlist?")) return;

    const url = idWishlist
      ? `/wishlist/${idWishlist}`
      : `/wishlist/${idCarta}`;

    axiosClient
      .delete(url)
      .then(() => {
        /**
         * Actualización optimista del estado local eliminando el elemento borrado.
         */
        setWishlist((prev) =>
          prev.filter((x) =>
            idWishlist ? x.id !== idWishlist : x.id_carta !== idCarta
          )
        );

        /**
         * Sincronización del contexto global con el nuevo estado.
         */
        if (setContextWishlist) {
          setContextWishlist((prev = []) =>
            (prev || []).filter((x) =>
              idWishlist ? x.id !== idWishlist : x.id_carta !== idCarta
            )
          );
        }
      })
      .catch((err) => {
        console.error("Error eliminando carta de la wishlist:", err);
        alert("Error al eliminar la carta de la wishlist.");
      });
  };

  return (
    <PageComponent
      title="⭐ Mi Wishlist"
      buttons={
        <TButton color="indigo" to="/wishlist/explorar-cartas">
          <SparklesIcon className="h-6 w-6 mr-2" />
          Buscar Cartas
        </TButton>
      }
    >
      {loading ? (
        /**
         * Vista mostrada mientras se está cargando la wishlist.
         */
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">⏳ Cargando wishlist...</p>
        </div>
      ) : wishlist.length === 0 ? (
        /**
         * Vista mostrada cuando la wishlist está vacía.
         */
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4 text-lg">
            La wishlist está vacía
          </p>
          <TButton color="indigo" to="/wishlist/explorar-cartas">
            🔍 Explorar Cartas
          </TButton>
        </div>
      ) : (
        /**
         * Vista principal con el listado de cartas de la wishlist.
         */
        <>
          <div className="mb-4 text-gray-600">
            Cartas en wishlist:{" "}
            <span className="font-bold text-red-600">
              {wishlist.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {wishlist.map((item, idx) => {
              /**
               * Se utiliza una clave estable priorizando el identificador interno
               * y usando un fallback para evitar colisiones.
               */
              const key =
                item?.id ?? `${item?.id_carta ?? "sin-id"}-${idx}`;

              return (
                <CartaWishlistItem
                  key={key}
                  item={item}
                  onDelete={() => handleEliminar(item)}
                />
              );
            })}
          </div>
        </>
      )}
    </PageComponent>
  );
}
