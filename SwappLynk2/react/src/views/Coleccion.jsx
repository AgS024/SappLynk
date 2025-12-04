// react/src/views/Coleccion.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageComponent from "../components/PageComponent.jsx";
import axiosClient from "../axios.js";
import CartaListItem from "../components/CartaListItem.jsx";

// 🔥 Botón "Buscar Cartas"
import TButton from "../components/core/TButton.jsx";
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function Coleccion() {
  const [cartas, setCartas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelado = false;

    const cargarColeccion = () => {
      setLoading(true);
      setError(null);

      axiosClient
        .get("/coleccion")
        .then((res) => {
          if (cancelado) return;

          const data = Array.isArray(res.data) ? res.data : [];
          setCartas(data);
        })
        .catch((err) => {
          if (cancelado) return;

          // 👇 Ignoramos abortos/cancelaciones “normales”
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

    // Cleanup: marcamos como cancelado para no tocar estado si el componente se desmonta
    return () => {
      cancelado = true;
    };
  }, []);

  const handleDelete = (carta) => {
    if (!window.confirm("¿Eliminar esta carta de tu colección?")) return;

    const numericId = carta.id ?? carta.id_coleccion ?? null;

    if (numericId) {
      axiosClient
        .delete(`/coleccion/${numericId}`)
        .then(() => {
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
        console.error(
          "Error eliminando carta de la colección por id_carta:",
          err
        );
        alert("No se ha podido eliminar la carta.");
      });
  };

  const handleOpenDetalle = (carta) => {
    const idCarta = carta.id_carta ?? null;

    if (!idCarta) {
      console.error("No se encontró id_carta para abrir detalle:", carta);
      alert("No se ha podido determinar el identificador de esta carta.");
      return;
    }

    navigate(`/mi-coleccion/${idCarta}`);
  };

  return (
    <PageComponent
      title="Mi colección"
      buttons={
        <TButton color="indigo" to="/explorar-cartas">
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
            const key =
              `${carta.id_carta || "sin-idcarta"}` +
              `-${carta.id_grado ?? "sin-grado"}` +
              `-${carta.id ?? carta.id_coleccion ?? index}`;

            return (
              <CartaListItem
                key={key}
                carta={carta}
                onPublish={() => handleOpenDetalle(carta)}
                onDelete={() => handleDelete(carta)}
              />
            );
          })}
        </div>
      )}
    </PageComponent>
  );
}
