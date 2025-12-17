// react/src/views/DetalleEnVenta.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageComponent from "../shared/components/PageComponent.jsx";
import axiosClient from "../axios.js";

export default function DetalleEnVenta() {
  const { ventaId } = useParams();
  const navigate = useNavigate();

  const [publicacion, setPublicacion] = useState(null);
  const [carta, setCarta] = useState(null); // datos TCGdex
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventaId]);

  const cargarDetalle = () => {
    setLoading(true);
    setError(null);

    axiosClient
      .get(`/enventa/${ventaId}`)
      .then((res) => {
        // Backend devuelve: { en_venta: {...}, tcgdex: {...} }
        console.log("Detalle en venta recibido:", res.data);
        setPublicacion(res.data.en_venta);
        setCarta(res.data.tcgdex);
      })
      .catch((err) => {
        console.error("Error cargando detalle de publicación:", err);
        setError("No se ha podido cargar la publicación.");
      })
      .finally(() => setLoading(false));
  };

// SOLO cambia esta función en DetalleEnVenta.jsx

  const handleComprar = async () => {
    console.log("Click en COMPRAR. Publicación actual:", publicacion);

    if (!publicacion) {
      setError("No se ha podido encontrar la publicación.");
      return;
    }

    if (publicacion.estado && publicacion.estado !== "activa") {
      setError("Esta publicación ya no está activa.");
      return;
    }

    setBuying(true);
    setError(null);

    const payload = { id_en_venta: publicacion.id };
    console.log("Lanzando POST /ventas con payload:", payload);

    try {
      const res = await axiosClient.post("/ventas", payload);
      console.log("Respuesta de /ventas:", res.data);

      alert("✅ Compra realizada. La carta se ha añadido a tu colección.");
      navigate("/mis-ventas");
    } catch (err) {
      console.error("Error al realizar la compra:", err);

      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se ha podido completar la compra.";

      setError(msg);
    } finally {
      setBuying(false);
    }
  };


  // Helpers para mostrar datos de la carta
  const getImageUrl = () => {
    const tcg = carta || {};
    return (
      tcg.images?.large ||
      tcg.images?.small ||
      tcg.image?.normal ||
      tcg.image ||
      "https://via.placeholder.com/300x420?text=Sin+imagen"
    );
  };

  const getSetName = () => {
    const tcg = carta || {};
    const setObj = tcg.set;
    if (!setObj) return "Set desconocido";
    if (typeof setObj.name === "string") return setObj.name;
    if (setObj.name && typeof setObj.name === "object") {
      return setObj.name.es || setObj.name.en || "Set desconocido";
    }
    return "Set desconocido";
  };

  if (loading) {
    return (
      <PageComponent title="Detalle de carta en venta">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">⏳ Cargando publicación...</p>
        </div>
      </PageComponent>
    );
  }

  if (error && !publicacion) {
    return (
      <PageComponent title="Detalle de carta en venta">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">
            {error || "No se ha encontrado la publicación."}
          </p>
          <button
            onClick={() => navigate("/marketplace")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Volver al marketplace
          </button>
        </div>
      </PageComponent>
    );
  }

  if (!publicacion) {
    return (
      <PageComponent title="Detalle de carta en venta">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">
            No se ha encontrado la publicación.
          </p>
          <button
            onClick={() => navigate("/marketplace")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Volver al marketplace
          </button>
        </div>
      </PageComponent>
    );
  }

  const tcg = carta || {};
  const nombreCarta = tcg.name || "Carta sin nombre";
  const setName = getSetName();
  const gradoNombre =
    publicacion.grado?.nombre || `Grado ${publicacion.id_grado || "?"}`;
  const precio = publicacion.precio;
  const notas = publicacion.notas;

  const vendedorNombre =
    publicacion.usuario?.name ||
    publicacion.usuario?.nickname ||
    `Usuario #${publicacion.id_usuario}`;

  const estadoPublicacion = publicacion.estado || "activa";

  return (
    <PageComponent title="🛒 Detalle de carta en venta">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Columna izquierda: imagen */}
          <div className="bg-gray-100 flex items-center justify-center p-4">
            <img
              src={getImageUrl()}
              alt={nombreCarta}
              className="max-h-[420px] w-auto object-contain"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/300x420?text=Sin+imagen";
              }}
            />
          </div>

          {/* Columna derecha: info */}
          <div className="p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {nombreCarta}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{setName}</p>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Grado:</span> {gradoNombre}
              </p>
              <p>
                <span className="font-semibold">Vendedor:</span>{" "}
                {vendedorNombre}
              </p>
              <p>
                <span className="font-semibold">Estado publicación:</span>{" "}
                {estadoPublicacion}
              </p>
              <p>
                <span className="font-semibold">Precio:</span>{" "}
                <span className="text-red-600 font-bold">
                  {Number(precio).toFixed(2)} €
                </span>
              </p>
              {tcg.rarity && (
                <p>
                  <span className="font-semibold">Rareza:</span> {tcg.rarity}
                </p>
              )}
              {tcg.hp && (
                <p>
                  <span className="font-semibold">HP:</span> {tcg.hp}
                </p>
              )}
              {tcg.types && Array.isArray(tcg.types) && (
                <p>
                  <span className="font-semibold">Tipos:</span>{" "}
                  {tcg.types.join(", ")}
                </p>
              )}
            </div>

            {notas && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">
                  Notas del vendedor
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-2 rounded-md">
                  {notas}
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 border border-red-200 rounded-md p-2">
                {error}
              </p>
            )}

            <div className="mt-auto flex gap-3 pt-4">
              <button
                onClick={() => navigate("/marketplace")}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
              >
                Volver
              </button>
              <button
                onClick={handleComprar}
                disabled={buying}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold disabled:opacity-50"
              >
                {buying ? "Procesando compra..." : "Comprar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageComponent>
  );
}
