// react/src/views/Perfil.jsx
import { useEffect, useState } from "react";
import PageComponent from "../components/PageComponent.jsx";
import axiosClient from "../axios.js";
import { UserIcon, StarIcon } from "@heroicons/react/24/solid";
import { useStateContext } from "../Contexts/ContextProvider.jsx";

// ⭐ Una estrella que se rellena según 'fill' (0 = vacía, 1 = llena, 0.5 = media, etc.)
function Star({ fill }) {
  const clamped = Math.max(0, Math.min(1, Number(fill) || 0));

  return (
    <div className="relative h-5 w-5">
      {/* Fondo gris */}
      <StarIcon className="h-5 w-5 text-gray-300" />
      {/* Capa amarilla recortada según porcentaje */}
      <div
        className="absolute top-0 left-0 overflow-hidden h-5"
        style={{ width: `${clamped * 100}%` }}
      >
        <StarIcon className="h-5 w-5 text-yellow-400" />
      </div>
    </div>
  );
}

export default function Perfil() {
  // ⚠️ Este perfil muestra al usuario autenticado (GET /user)
  const { currentUser, setCurrentUser } = useStateContext();

  const [usuario, setUsuario] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    direccion: "",
    provincia: "",
    ciudad: "",
    cp: "",
  });

  const [valoraciones, setValoraciones] = useState([]);
  const [valoracionMedia5, setValoracionMedia5] = useState(0); // escala 0–5

  const [cartasEnVentaCount, setCartasEnVentaCount] = useState(0);
  const [comprasCount, setComprasCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    cargarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarPerfil = () => {
    setLoading(true);
    setSaveMessage(null);
    setSaveError(null);

    Promise.all([
      axiosClient.get("/user"), // usuario autenticado
      axiosClient.get("/valoraciones"), // valoraciones recibidas
      axiosClient.get("/enventa/mias"), // cartas en venta del usuario
      axiosClient.get("/ventas"), // compras realizadas
    ])
      .then(([resUser, resValoraciones, resEnVenta, resVentas]) => {
        const user = resUser.data;
        const vals = Array.isArray(resValoraciones.data)
          ? resValoraciones.data
          : [];

        setUsuario(user);
        setCurrentUser && setCurrentUser(user);

        setForm({
          name: user.name || "",
          email: user.email || "",
          direccion: user.direccion || "",
          provincia: user.provincia || "",
          ciudad: user.ciudad || "",
          cp: user.cp || "",
        });

        setValoraciones(vals);

        // 🧮 Calcular media sobre 5 (las valoraciones vienen 0–10 → /2)
        if (vals.length > 0) {
          const suma = vals.reduce((acc, v) => acc + (v.valor || 0), 0);
          const media10 = suma / vals.length; // escala 0–10
          const media5 = media10 / 2; // escala 0–5
          setValoracionMedia5(Number(media5.toFixed(2)));
        } else {
          setValoracionMedia5(0);
        }

        setCartasEnVentaCount(
          Array.isArray(resEnVenta.data) ? resEnVenta.data.length : 0
        );
        setComprasCount(
          Array.isArray(resVentas.data) ? resVentas.data.length : 0
        );
      })
      .catch((err) => {
        console.error("Error cargando perfil:", err);
      })
      .finally(() => setLoading(false));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGuardarPerfil = (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    axiosClient
      .put("/user", {
        name: form.name,
        // email lo dejamos de momento solo lectura (no lo cambiamos aquí)
        direccion: form.direccion,
        provincia: form.provincia,
        ciudad: form.ciudad,
        cp: form.cp,
      })
      .then((res) => {
        const updatedUser = res.data;
        setUsuario(updatedUser);
        setCurrentUser && setCurrentUser(updatedUser);
        setSaveMessage("✅ Datos guardados correctamente.");
      })
      .catch((err) => {
        console.error("Error actualizando perfil:", err);
        const msg =
          err.response?.data?.message ||
          "No se han podido guardar los cambios.";
        setSaveError(msg);
      })
      .finally(() => setSaving(false));
  };

  /**
   * ⭐ Renderiza estrellas en escala 0–5 con relleno parcial.
   *   rating5 = 0 → 0 llenas
   *   rating5 = 3.4 → 3 llenas + 0.4 de la 4ª
   */
  const renderStars = (rating5) => {
    let r = Number(rating5) || 0;
    if (r < 0) r = 0;
    if (r > 5) r = 5;

    const stars = [];

    for (let i = 0; i < 5; i++) {
      const starMin = i; // inicio del rango de esta estrella
      const starMax = i + 1; // final del rango

      let fill = 0;

      if (r >= starMax) {
        // estrella completamente llena
        fill = 1;
      } else if (r <= starMin) {
        // estrella vacía
        fill = 0;
      } else {
        // parte fraccionaria dentro de esta estrella
        fill = r - starMin; // ej: rating=3.4, i=3 → 0.4
      }

      stars.push(<Star key={i} fill={fill} />);
    }

    return stars;
  };

  if (loading || !usuario) {
    return (
      <PageComponent title="Perfil">
        <p className="text-gray-500">Cargando perfil...</p>
      </PageComponent>
    );
  }

  return (
    <PageComponent title="Mi Perfil">
      <div className="space-y-8">
        {/* HEADER PERFIL */}
        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6 p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-center mb-4 md:mb-0">
            <div className="relative">
              <UserIcon className="h-20 w-20 text-gray-400 bg-gray-200 rounded-full p-3" />
              {/* Badge con inicial */}
              <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {usuario.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900">
              {usuario.name}
            </h1>
            <p className="text-gray-600">{usuario.email}</p>

            {/* Valoración Media */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mt-4">
              <div className="flex items-center justify-center sm:justify-start gap-1">
                {renderStars(valoracionMedia5)}
              </div>
              <div className="mt-2 sm:mt-0 flex items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-lg text-gray-900">
                  {valoracionMedia5.toFixed(2)}/5
                </span>
                <span className="text-sm text-gray-600">
                  · {valoraciones.length}{" "}
                  {valoraciones.length === 1 ? "valoración" : "valoraciones"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE: DATOS PERSONALES / FORMULARIO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario a la izquierda (2/3) */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Mis datos
            </h2>
            <form onSubmit={handleGuardarPerfil} className="space-y-4">
              {/* Nombre y email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    disabled
                    className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    El email se usa para iniciar sesión. Si quieres cambiarlo,
                    háblanos o implementa un flujo de cambio de email aparte.
                  </p>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleInputChange}
                  placeholder="Calle, número, piso..."
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              {/* Provincia, ciudad, CP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    name="provincia"
                    value={form.provincia}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={form.ciudad}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="cp"
                    value={form.cp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
              </div>

              {/* Mensajes de feedback */}
              {saveMessage && (
                <p className="text-sm text-green-600">{saveMessage}</p>
              )}
              {saveError && (
                <p className="text-sm text-red-600">{saveError}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>

          {/* Stats a la derecha (1/3) */}
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <p className="text-gray-600 text-sm mb-1">Cartas en venta</p>
              <p className="text-3xl font-bold text-red-600">
                {cartasEnVentaCount}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <p className="text-gray-600 text-sm mb-1">Compras realizadas</p>
              <p className="text-3xl font-bold text-green-600">
                {comprasCount}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <p className="text-gray-600 text-sm mb-1">Valoración media</p>
              <p className="text-3xl font-bold text-yellow-500">
                ⭐ {valoracionMedia5.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* VALORACIONES RECIBIDAS */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Valoraciones recibidas ({valoraciones.length})
          </h2>

          {valoraciones.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              Aún no has recibido valoraciones.
            </p>
          ) : (
            <div className="space-y-4">
              {valoraciones.map((val) => {
                const nota5 = (val.valor || 0) / 2; // 0–10 → 0–5

                return (
                  <div
                    key={val.id}
                    className="border-l-4 border-yellow-400 pl-4 py-3 bg-gray-50 rounded"
                  >
                    {/* Stars para esta valoración concreta */}
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(nota5)}
                      <span className="font-bold text-gray-900">
                        {nota5.toFixed(2)}/5
                      </span>
                    </div>

                    {/* Comentario */}
                    {val.descripcion && (
                      <p className="text-gray-700 italic mb-2">
                        "{val.descripcion}"
                      </p>
                    )}

                    {/* Info valorador */}
                    <div className="text-xs text-gray-600">
                      <p>
                        <span className="font-semibold">Por:</span>{" "}
                        {val.valorador?.name || "Usuario anónimo"}
                      </p>
                      <p>
                        <span className="font-semibold">Fecha:</span>{" "}
                        {val.created_at
                          ? new Date(
                              val.created_at
                            ).toLocaleDateString("es-ES")
                          : "-"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageComponent>
  );
}
