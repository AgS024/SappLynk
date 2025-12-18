// react/src/views/CartaColeccionDetalle.jsx

// Hooks de React:
// - useState: gestionar estado local (carga, errores, formulario y datos de la entrada)
// - useEffect: cargar datos al entrar a la vista o cuando cambia el id de la carta
import { useEffect, useState } from "react";

// React Router:
// - useParams: leer el parámetro de ruta (coleccionId)
// - useNavigate: navegar de forma programática (volver a /coleccion, etc.)
import { useParams, useNavigate } from "react-router-dom";

// Componente de layout común: pinta cabecera con título y contenedor de contenido
import PageComponent from "../shared/components/PageComponent.jsx";

// Cliente Axios ya configurado con baseURL + token (Sanctum) para hablar con el backend
import axiosClient from "../axios.js";

// Contexto global de la app: mantiene coleccion en memoria para evitar recargas constantes
import { useStateContext } from "../Contexts/ContextProvider.jsx";

export default function CartaColeccionDetalle() {
  /**
   * coleccionId:
   * - En esta vista NO es un id numérico interno.
   * - Es el id real de TCGdex / carta (por ejemplo: "bw8-3").
   * Se usa directamente en las rutas del backend:
   *   GET    /coleccion/carta/{id_carta}
   *   PUT    /coleccion/carta/{id_carta}
   *   DELETE /coleccion/carta/{id_carta}/grado/{id_grado}
   */
  const { coleccionId } = useParams();

  // Navegación a otras pantallas sin recargar la app
  const navigate = useNavigate();

  /**
   * Estado global (ContextProvider):
   * - coleccion: array con las entradas de colección ya cargadas en memoria
   * - setColeccion: permite sincronizar cambios (editar / eliminar) sin pedirlo todo otra vez
   */
  const { coleccion, setColeccion } = useStateContext();

  /**
   * entrada:
   * - es la fila concreta de la tabla "coleccion" devuelta por el backend
   * - viene enriquecida con "tcgdex" en el controlador (info completa de la carta)
   */
  const [entrada, setEntrada] = useState(null);

  // Estados de UI: loading y error para controlar mensajes de pantalla
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Estados del "formulario" (edición de colección):
   * - cantidad: copias en colección
   * - idGrado: condición/grado asociado a la entrada
   * - notas: texto libre
   *
   * Importante:
   * - En la BD la PK es compuesta (id_usuario, id_carta, id_grado).
   * - En esta vista se editan campos de esa entrada.
   */
  const [cantidad, setCantidad] = useState(1);
  const [idGrado, setIdGrado] = useState(1);
  const [notas, setNotas] = useState("");

  /**
   * Estados relacionados con publicar en venta:
   * - precioVenta: input del precio unitario
   * - saving: bandera de "operación en curso" (bloquea botones y evita dobles clicks)
   */
  const [precioVenta, setPrecioVenta] = useState("");
  const [saving, setSaving] = useState(false);

  /**
   * useEffect: carga inicial
   *
   * Al entrar a la pantalla, si coleccionId existe, se pide al backend la entrada de colección.
   * Si falta el parámetro, se muestra error y se termina la carga.
   */
  useEffect(() => {
    if (!coleccionId) {
      setError("No se ha proporcionado un identificador de carta válido.");
      setLoading(false);
      return;
    }
    cargarEntrada();
  }, [coleccionId]);

  /**
   * sincronizarEnContexto
   *
   * Mantiene coherente el estado global "coleccion" después de:
   * - cargar la entrada
   * - actualizarla desde el formulario
   *
   * Estrategia:
   * - si el contexto está vacío, se crea con esa entrada
   * - si no existe la carta, se añade
   * - si ya existe, se reemplaza solo la que coincide por id_carta
   *
   * Nota:
   * - si se guardan varias filas por carta (por grados distintos), lo correcto sería
   *   comparar también id_grado. Aquí se está simplificando a id_carta.
   */
  const sincronizarEnContexto = (nuevaEntrada) => {
    if (!nuevaEntrada || !nuevaEntrada.id_carta) return;

    setColeccion((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) {
        return [nuevaEntrada];
      }

      const existe = prev.some((c) => c.id_carta === nuevaEntrada.id_carta);

      if (!existe) {
        return [...prev, nuevaEntrada];
      }

      return prev.map((c) =>
        c.id_carta === nuevaEntrada.id_carta ? nuevaEntrada : c
      );
    });
  };

  /**
   * eliminarDeContexto
   *
   * Borra una entrada del estado global de colección.
   * Si hay varias filas por carta (distinto grado), se filtra por (id_carta + id_grado).
   */
  const eliminarDeContexto = (idCarta, grado) => {
    setColeccion((prev) => {
      if (!Array.isArray(prev)) return [];
      return prev.filter((c) => {
        if (grado != null && typeof c.id_grado !== "undefined") {
          return !(c.id_carta === idCarta && c.id_grado === grado);
        }
        return c.id_carta !== idCarta;
      });
    });
  };

  /**
   * cargarEntrada
   *
   * GET /coleccion/carta/{id_carta}
   *
   * - Carga desde el backend la entrada de colección para esa carta.
   * - Rellena los estados del formulario con los valores recibidos.
   * - Sincroniza en el contexto global para que la lista de /coleccion quede actualizada.
   */
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

  /**
   * tcg:
   * Normalización del objeto carta para que la vista funcione aunque los datos vengan
   * con distintas formas (entrada.tcgdex, entrada.data, etc.)
   */
  const tcg =
    entrada?.tcgdex || entrada?.data || entrada?.carta || entrada || {};

  // Nombre visible de la carta
  const nombreCarta = tcg.name || entrada?.nombre || "Carta sin nombre";

  /**
   * getImageUrl
   *
   * Devuelve la mejor imagen disponible en este orden:
   * - tcg.images.small (formato moderno)
   * - tcg.image.normal / entrada.image / tcg.image (formatos alternativos)
   * - placeholder si no hay imagen
   */
  const getImageUrl = () => {
    return (
      tcg.images?.small ||
      tcg.image?.normal ||
      entrada?.image ||
      tcg.image ||
      "https://via.placeholder.com/300x420?text=Sin+imagen"
    );
  };

  /**
   * getSetName
   *
   * Intenta resolver el nombre del set:
   * - Primero desde el objeto set (si viene completo, incluso multi-idioma).
   * - Si no, intenta inferirlo del id de la carta (parte antes del guion, ej: "bw8" en "bw8-3").
   * - Si no se puede, devuelve "Set desconocido".
   */
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

  /**
   * handleGuardarCambios
   *
   * PUT /coleccion/carta/{id_carta}
   *
   * Actualiza la entrada de colección con los valores del formulario:
   * - id_grado
   * - cantidad
   * - notas
   *
   * Caso especial:
   * - si la cantidad queda en 0 o menos, el backend elimina la entrada,
   *   y la UI limpia el contexto y vuelve a /coleccion.
   */
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

  /**
   * handleEliminar
   *
   * DELETE /coleccion/carta/{id_carta}/grado/{id_grado}
   *
   * Elimina solo UNA fila concreta de la colección:
   * - la de esa carta y ese grado
   *
   * Después:
   * - se borra del contexto global
   * - se vuelve al listado /coleccion
   */
  const handleEliminar = (e) => {
    e.preventDefault();

    setSaving(true);

    const url = `/coleccion/carta/${coleccionId}/grado/${idGrado}`;

    axiosClient
      .delete(url)
      .then(() => {
        eliminarDeContexto(entrada?.id_carta ?? coleccionId, idGrado);
        navigate("/coleccion");
      })
      .catch((err) => {
        console.error("Error eliminando carta de colección:", err);
        alert("No se ha podido eliminar la carta.");
      })
      .finally(() => setSaving(false));
  };

  /**
   * handlePonerEnVenta
   *
   * Publica UNA copia en el marketplace y ajusta la colección:
   *
   * 1) POST /enventa
   *    - crea una publicación activa con precio y grado
   *
   * 2) Ajuste local:
   *    - se resta 1 a "cantidad"
   *
   * 3) Persistencia en backend:
   *    - si la cantidad llega a 0: se borra la fila (DELETE carta+grado)
   *    - si quedan copias: se actualiza la cantidad (PUT /coleccion/carta/{id})
   *
   * Nota:
   * - En el payload se envía cantidad: 1 porque cada publicación representa una copia.
   * - El backend, además, valida que exista stock en colección antes de publicar.
   */
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
      cantidad: 1, // publicación de UNA copia
      precio: Number(precioVenta),
    };

    axiosClient
      .post("/enventa", payloadVenta)
      .then(() => {
        const nuevaCantidad = cantidad - 1;

        if (nuevaCantidad <= 0) {
          const url = `/coleccion/carta/${coleccionId}/grado/${idGrado}`;
          return axiosClient.delete(url).then(() => {
            eliminarDeContexto(entrada.id_carta ?? coleccionId, idGrado);
            navigate("/coleccion");
          });
        } else {
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

  /**
   * Render condicional:
   * - mientras carga: mensaje simple
   * - si hay error o no existe entrada: mensaje de error
   * - si todo va bien: pantalla con imagen + formulario de edición + bloque de venta
   */
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
        {/* Columna izquierda: imagen + nombre + set */}
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

        {/* Columna derecha: gestión de la entrada en colección + venta */}
        <div className="space-y-6">
          {/* Bloque: edición de la fila de colección */}
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Datos en tu colección
            </h3>

            {/* Selector de grado/condición */}
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

            {/* Campo de cantidad */}
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

            {/* Notas */}
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

            {/* Acciones */}
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

          {/* Bloque: publicar una copia en venta */}
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Poner en venta una copia
            </h3>
            <p className="text-sm text-gray-600">
              Al poner en venta una copia se <strong>restará 1</strong> a la
              cantidad de tu colección. Si la cantidad llega a 0, la carta se
              eliminará de tu colección.
            </p>

            {/* Precio unitario */}
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

            {/* Acción de publicar */}
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
