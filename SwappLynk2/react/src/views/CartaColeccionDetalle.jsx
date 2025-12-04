// react/src/views/CartaColeccionDetalle.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageComponent from "../components/PageComponent.jsx";
import axiosClient from "../axios.js";
import { useStateContext } from "../Contexts/ContextProvider.jsx";

export default function CartaColeccionDetalle() {
  // OJO: aquí viene el id de la carta (ej: "bw8-3"), no un id numérico
  const { coleccionId } = useParams();
  const navigate = useNavigate();

  const { coleccion, setColeccion } = useStateContext();

  const [entrada, setEntrada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cantidad, setCantidad] = useState(1);
  const [idGrado, setIdGrado] = useState(1);
  const [notas, setNotas] = useState("");

  const [precioVenta, setPrecioVenta] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!coleccionId) {
      setError("No se ha proporcionado un identificador de carta válido.");
      setLoading(false);
      return;
    }
    cargarEntrada();
  }, [coleccionId]);

  const sincronizarEnContexto = (nuevaEntrada) => {
    if (!nuevaEntrada || !nuevaEntrada.id_carta) return;

    setColeccion((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) {
        return [nuevaEntrada];
      }

      const existe = prev.some((c) => c.id_carta === nuevaEntrada.id_carta);

      if (!existe) {
        // La añadimos al final si no estaba
        return [...prev, nuevaEntrada];
      }

      // Actualizamos SOLO la carta con ese id_carta
      return prev.map((c) =>
        c.id_carta === nuevaEntrada.id_carta ? nuevaEntrada : c
      );
    });
  };

  const eliminarDeContexto = (idCarta, grado) => {
    setColeccion((prev) => {
      if (!Array.isArray(prev)) return [];
      // si en el contexto guardas varias filas por carta (distinto grado), aquí podrías filtrar por ambos
      return prev.filter((c) => {
        if (grado != null && typeof c.id_grado !== "undefined") {
          return !(c.id_carta === idCarta && c.id_grado === grado);
        }
        return c.id_carta !== idCarta;
      });
    });
  };

  const cargarEntrada = () => {
    setLoading(true);
    setError(null);

    axiosClient
      .get(`/coleccion/carta/${coleccionId}`)
      .then((res) => {
        const e = res.data;
        setEntrada(e);
        setCantidad(e.cantidad ?? 1);
        setIdGrado(e.id_grado ?? 1);
        setNotas(e.notas ?? "");
        sincronizarEnContexto(e);
      })
      .catch((err) => {
        console.error("Error cargando entrada de colección:", err);
        setError("No se ha podido cargar la carta de tu colección.");
      })
      .finally(() => setLoading(false));
  };

  const tcg =
    entrada?.tcgdex || entrada?.data || entrada?.carta || entrada || {};
  const nombreCarta = tcg.name || entrada?.nombre || "Carta sin nombre";

  const getImageUrl = () => {
    return (
      tcg.images?.small ||
      tcg.image?.normal ||
      entrada?.image ||
      tcg.image ||
      "https://via.placeholder.com/300x420?text=Sin+imagen"
    );
  };

  const getSetName = () => {
    const setObj =
      tcg.set || entrada?.tcgdex?.set || entrada?.carta?.set || entrada?.set;

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

    const tcgId = tcg.id || entrada?.id_carta;
    if (tcgId) {
      const [setCode] = String(tcgId).split("-");
      return setCode || "Set desconocido";
    }

    return "Set desconocido";
  };

  const handleGuardarCambios = () => {
    if (!entrada) return;
    setSaving(true);

    axiosClient
      .put(`/coleccion/carta/${coleccionId}`, {
        id_grado: idGrado,
        cantidad: cantidad,
        notas: notas,
      })
      .then((res) => {
        const actualizada = res.data;
        setEntrada(actualizada);
        sincronizarEnContexto(actualizada);

        if ((actualizada.cantidad ?? 0) <= 0) {
          eliminarDeContexto(entrada.id_carta ?? coleccionId, idGrado);
          navigate("/coleccion");
        }
      })
      .catch((err) => {
        console.error("Error guardando cambios:", err);
        alert("No se han podido guardar los cambios.");
      })
      .finally(() => setSaving(false));
  };

  const handleEliminar = (e) => {
    e.preventDefault();

    console.log("Click en ELIMINAR", { coleccionId, idGrado, entrada });

    setSaving(true);

    // ✅ Usamos la ruta nueva con carta + grado
    const url = `/coleccion/carta/${coleccionId}/grado/${idGrado}`;
    console.log("DELETE URL:", url);

    axiosClient
      .delete(url)
      .then((res) => {
        console.log("Respuesta DELETE /coleccion/carta/...:", res);
        eliminarDeContexto(entrada?.id_carta ?? coleccionId, idGrado);
        navigate("/coleccion");
      })
      .catch((err) => {
        console.error("Error eliminando carta de colección:", err);
        alert("No se ha podido eliminar la carta.");
      })
      .finally(() => setSaving(false));
  };

  const handlePonerEnVenta = () => {
    if (!entrada) return;

    if (!precioVenta || Number(precioVenta) <= 0) {
      alert("Introduce un precio válido.");
      return;
    }
    if (cantidad <= 0) {
      alert("No tienes copias disponibles.");
      return;
    }

    setSaving(true);

    const payloadVenta = {
      id_carta: entrada.id_carta ?? coleccionId,
      id_grado: idGrado,
      cantidad: 1, // ponemos en venta UNA copia
      precio: Number(precioVenta),
    };

    axiosClient
      .post("/enventa", payloadVenta)
      .then(() => {
        const nuevaCantidad = cantidad - 1;

        if (nuevaCantidad <= 0) {
          // si se queda a 0, eliminamos de colección (carta + grado)
          const url = `/coleccion/carta/${coleccionId}/grado/${idGrado}`;
          return axiosClient.delete(url).then(() => {
            eliminarDeContexto(entrada.id_carta ?? coleccionId, idGrado);
            navigate("/coleccion");
          });
        } else {
          // si aún quedan, actualizamos cantidad
          return axiosClient
            .put(`/coleccion/carta/${coleccionId}`, {
              id_grado: idGrado,
              cantidad: nuevaCantidad,
              notas: notas,
            })
            .then((res2) => {
              const actualizada = res2.data;
              setEntrada(actualizada);
              setCantidad(actualizada.cantidad ?? nuevaCantidad);
              sincronizarEnContexto(actualizada);
            });
        }
      })
      .catch((err) => {
        console.error("Error publicando en venta:", err);
        alert("No se ha podido publicar la carta en venta.");
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <PageComponent title="Detalle de carta">
        <p className="text-gray-500">Cargando carta...</p>
      </PageComponent>
    );
  }

  if (error || !entrada) {
    return (
      <PageComponent title="Detalle de carta">
        <p className="text-red-600">{error || "Carta no encontrada"}</p>
      </PageComponent>
    );
  }

  return (
    <PageComponent title="Detalle de tu carta">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Columna izquierda: imagen + info básica */}
        <div className="flex flex-col items-center">
          <img
            src={getImageUrl()}
            alt={nombreCarta}
            className="w-full max-w-sm rounded-xl shadow-lg bg-white"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/300x420?text=Sin+imagen";
            }}
          />
          <h2 className="text-2xl font-bold text-gray-900 mt-4 text-center">
            {nombreCarta}
          </h2>
          <p className="text-sm text-gray-600">{getSetName()}</p>
        </div>

        {/* Columna derecha: gestión de colección */}
        <div className="space-y-6">
          {/* Bloque: datos en tu colección */}
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Datos en tu colección
            </h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Grado / condición
              </label>
              <select
                value={idGrado}
                onChange={(e) => setIdGrado(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
              >
                <option value={1}>1 - Mala condición</option>
                <option value={2}>2 - Buena condición</option>
                <option value={3}>3 - Muy buena condición</option>
                <option value={4}>4 - Muy buena a excelente</option>
                <option value={5}>5 - Excelente condición</option>
                <option value={6}>6 - Excelente a casi perfecta</option>
                <option value={7}>7 - Casi perfecta</option>
                <option value={8}>8 - Casi perfecta a perfecta</option>
                <option value={9}>9 - Perfecta</option>
                <option value={10}>10 - Perfecta de museo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Cantidad en colección
              </label>
              <input
                type="number"
                min="0"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si estableces la cantidad a 0 y guardas, la carta se eliminará
                de tu colección.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none h-20 resize-none"
                placeholder="Ej: Ligeros defectos en la esquina superior..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGuardarCambios}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={handleEliminar}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>

          {/* Bloque: poner en venta */}
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Poner en venta una copia
            </h3>
            <p className="text-sm text-gray-600">
              Al poner en venta una copia se <strong>restará 1</strong> a la
              cantidad de tu colección. Si la cantidad llega a 0, la carta se
              eliminará de tu colección.
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Precio por unidad (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                placeholder="Ej: 3.50"
              />
            </div>
            <button
              type="button"
              onClick={handlePonerEnVenta}
              disabled={saving || cantidad <= 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
            >
              💸 Poner en venta 1 copia
            </button>
          </div>
        </div>
      </div>
    </PageComponent>
  );
}
