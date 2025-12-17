import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageComponent from "../components/PageComponent.jsx";
import axiosClient from "../axios.js";
import ModalPublicarVenta from "../components/ModalPublicarVenta.jsx";

export default function CartaDetalle() {
  const { id } = useParams(); // id de la carta (ej: swsh1-1)
  const navigate = useNavigate();

  const [carta, setCarta] = useState(null);
  const [loadingCarta, setLoadingCarta] = useState(true);
  const [errorCarta, setErrorCarta] = useState(null);

  const [misCopias, setMisCopias] = useState([]);
  const [loadingCopias, setLoadingCopias] = useState(true);

  const [mostrarModalVenta, setMostrarModalVenta] = useState(false);
  const [copiaSeleccionada, setCopiaSeleccionada] = useState(null);

  useEffect(() => {
    cargarCarta();
    cargarMisCopias();
  }, [id]);

  const cargarCarta = () => {
    setLoadingCarta(true);
    setErrorCarta(null);

    axiosClient
      .get(`/cartas/${id}`)
      .then((res) => {
        setCarta(res.data);
      })
      .catch((err) => {
        console.error("Error cargando carta:", err);
        setErrorCarta("No se ha podido cargar la información de la carta.");
      })
      .finally(() => setLoadingCarta(false));
  };

  const cargarMisCopias = () => {
    setLoadingCopias(true);

    axiosClient
      .get(`/coleccion/carta/${id}`)
      .then((res) => {
        // Se espera un array de entradas de colección para esa carta
        setMisCopias(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Error cargando copias en colección:", err);
        setMisCopias([]);
      })
      .finally(() => setLoadingCopias(false));
  };

  const abrirModalVenta = (copia) => {
    setCopiaSeleccionada(copia);
    setMostrarModalVenta(true);
  };

  const cerrarModalVenta = () => {
    setMostrarModalVenta(false);
    setCopiaSeleccionada(null);
  };

  const handleConfirmarVenta = (datosVenta) => {
    if (!copiaSeleccionada) return;

    const payload = {
      id_carta: copiaSeleccionada.id_carta || id,
      id_grado: copiaSeleccionada.id_grado,
      cantidad: datosVenta.cantidad,
      precio: datosVenta.precio,
      notas: datosVenta.notas || "",
    };

    axiosClient
      .post("/enventa", payload)
      .then((res) => {
        // Opcional: recargar tus copias para reflejar cambios (si restas cantidad, etc.)
        cargarMisCopias();
        cerrarModalVenta();
        // Opcional: navegar a "Mis ventas"
        // navigate("/mis-ventas");
      })
      .catch((err) => {
        console.error("Error al publicar la carta en venta:", err);
        alert("No se ha podido publicar la carta en venta.");
      });
  };

  const getImageUrl = () => {
    if (!carta) return "https://via.placeholder.com/300x420?text=Sin+imagen";

    const tcg = carta.tcgdex || carta.data || carta.carta || carta;

    return (
      tcg.images?.large ||
      tcg.image?.hires ||
      tcg.images?.small ||
      tcg.image?.normal ||
      carta.image ||
      tcg.image ||
      "https://via.placeholder.com/300x420?text=Sin+imagen"
    );
  };

  const getSetName = () => {
    if (!carta) return "Set desconocido";
    const tcg = carta.tcgdex || carta.data || carta.carta || carta;

    const setObj =
      tcg.set ||
      carta.tcgdex?.set ||
      carta.data?.set ||
      carta.carta?.set ||
      carta.set;

    if (setObj) {
      if (typeof setObj.name === "string") return setObj.name;
      if (typeof setObj.name === "object") {
        return (
          setObj.name.es ||
          setObj.name.en ||
          Object.values(setObj.name)[0] ||
          "Set desconocido"
        );
      }
    }

    // fallback simple a partir del id "swsh1-1" -> "swsh1"
    const tcgId = tcg.id || carta.id;
    if (tcgId) {
      const [setCode] = String(tcgId).split("-");
      return setCode || "Set desconocido";
    }

    return "Set desconocido";
  };

  const renderInfoCarta = () => {
    if (loadingCarta) {
      return <p className="text-gray-500">Cargando carta...</p>;
    }

    if (errorCarta) {
      return <p className="text-red-600">{errorCarta}</p>;
    }

    if (!carta) {
      return <p className="text-gray-500">No se encontró la carta.</p>;
    }

    const tcg = carta.tcgdex || carta.data || carta.carta || carta;

    const name = tcg.name || "Carta sin nombre";
    const rarity = tcg.rarity || "Desconocida";
    const hp = tcg.hp || "—";
    const types = Array.isArray(tcg.types)
      ? tcg.types.join(", ")
      : tcg.types || "—";

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Imagen */}
        <div className="flex justify-center">
          <img
            src={getImageUrl()}
            alt={name}
            className="w-full max-w-sm rounded-xl shadow-lg bg-white"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/300x420?text=Sin+imagen";
            }}
          />
        </div>

        {/* Info principal */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
          <p className="text-sm text-gray-600">{getSetName()}</p>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Rareza</p>
              <p className="text-gray-800">{rarity}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">HP</p>
              <p className="text-gray-800">{hp}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Tipos</p>
              <p className="text-gray-800">{types}</p>
            </div>
            {tcg.number && (
              <div>
                <p className="font-semibold text-gray-700">Número en set</p>
                <p className="text-gray-800">{tcg.number}</p>
              </div>
            )}
          </div>

          {/* Texto de ejemplo: ataques, descripción, etc. si quieres añadir más info */}
        </div>
      </div>
    );
  };

  const renderMisCopias = () => {
    if (loadingCopias) {
      return <p className="text-gray-500">Cargando tus copias...</p>;
    }

    if (!misCopias || misCopias.length === 0) {
      return (
        <p className="text-gray-500">
          No tienes esta carta en tu colección (o aún no se ha añadido).
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {misCopias.map((copia) => {
          const gradoNombre =
            copia.grado?.nombre || `Grado ${copia.id_grado || "?"}`;
          const cantidad = copia.cantidad || 1;
          const notas = copia.notas;

          const key =
            copia.id ||
            `${copia.id_carta}-${copia.id_grado}-${Math.random()
              .toString(36)
              .slice(2)}`;

          return (
            <div
              key={key}
              className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {gradoNombre} — x{cantidad}
                </p>
                {notas && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Notas:</span> {notas}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => abrirModalVenta(copia)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                >
                  💸 Poner en venta
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <PageComponent title="Detalle de carta">
      <div className="space-y-10">
        {/* Info de la carta */}
        {renderInfoCarta()}

        {/* Tus copias en colección */}
        <section className="mt-10">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Tus copias en colección
          </h3>
          {renderMisCopias()}
        </section>
      </div>

      {mostrarModalVenta && copiaSeleccionada && (
        <ModalPublicarVenta
          copia={copiaSeleccionada}
          carta={carta}
          onConfirm={handleConfirmarVenta}
          onCancel={cerrarModalVenta}
        />
      )}
    </PageComponent>
  );
}
