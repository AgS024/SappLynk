import { useEffect, useState } from "react";
import PageComponent from "../components/PageComponent.jsx";
import axiosClient from "../axios.js";
import { useStateContext } from "../Contexts/ContextProvider.jsx";
import TButton from "../components/core/TButton.jsx";
import { SparklesIcon } from "@heroicons/react/24/solid";
import CartaWishlistItem from "../components/CartaWishlistItem.jsx";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setWishlist: setContextWishlist } = useStateContext();

  useEffect(() => {
    cargarWishlist();
  }, []);

  const cargarWishlist = () => {
    setLoading(true);
    axiosClient
      .get("/wishlist")
      .then((res) => {
        console.log("Wishlist cargada:", res.data);
        setWishlist(res.data);
        setContextWishlist(res.data);
      })
      .catch((err) => {
        console.error("Error cargando wishlist:", err);
        setWishlist([]);
      })
      .finally(() => setLoading(false));
  };

  const handleEliminar = (cartaId) => {
    if (window.confirm("¿Eliminar de tu wishlist?")) {
      axiosClient
        .delete(`/wishlist/${cartaId}`)
        .then(() => {
          cargarWishlist();
          alert("Carta eliminada de tu wishlist");
        })
        .catch((err) => {
          console.error("Error eliminando de wishlist:", err);
          alert("Error al eliminar");
        });
    }
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
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">⏳ Cargando wishlist...</p>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4 text-lg">
            Tu wishlist está vacía
          </p>
          <TButton color="indigo" to="/wishlist/explorar-cartas">
            🔍 Explorar Cartas
          </TButton>
        </div>
      ) : (
        <>
          <div className="mb-4 text-gray-600">
            Cartas en wishlist:{" "}
            <span className="font-bold text-red-600">{wishlist.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {wishlist.map((item) => (
              <CartaWishlistItem
                key={item.id_carta}
                item={item}
                onDelete={() => handleEliminar(item.id_carta)}
              />
            ))}
          </div>
        </>
      )}
    </PageComponent>
  );
}
