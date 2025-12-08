// react/src/views/admin/AdminUsuarioDetalle.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosClient from "../../axios.js";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import AdminTopbar from "../../components/admin/AdminTopbar.jsx";

export default function AdminUsuarioDetalle() {
  const { id } = useParams(); // /admin/usuarios/:id
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accionLoading, setAccionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [compras, setCompras] = useState([]);
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    cargarUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarUsuario = () => {
    setLoading(true);
    setError(null);

    axiosClient
      .get(`/admin/users/${id}`)
      .then((res) => {
        const data = res.data || {};
        setUsuario(data);
        setCompras(data.compras || []);
        setVentas(data.ventas || []);
      })
      .catch((err) => {
        console.error("Error cargando usuario admin:", err);
        setError(
          err.response?.data?.message ||
            "No se ha podido cargar la información del usuario."
        );
      })
      .finally(() => setLoading(false));
  };

  const handleCancelarCuenta = () => {
    if (
      !window.confirm(
        "¿Seguro que quieres cancelar esta cuenta? El usuario no podrá iniciar sesión."
      )
    ) {
      return;
    }

    setAccionLoading(true);
    axiosClient
      .post(`/admin/users/${id}/cancelar`)
      .then((res) => {
        setUsuario(res.data);
      })
      .catch((err) => {
        console.error("Error cancelando cuenta:", err);
        alert(
          err.response?.data?.message ||
            "No se ha podido cancelar la cuenta."
        );
      })
      .finally(() => setAccionLoading(false));
  };

  const handleReactivarCuenta = () => {
    if (
      !window.confirm(
        "¿Reactivar esta cuenta? El usuario podrá volver a iniciar sesión."
      )
    ) {
      return;
    }

    setAccionLoading(true);
    axiosClient
      .post(`/admin/users/${id}/reactivar`)
      .then((res) => {
        setUsuario(res.data);
      })
      .catch((err) => {
        console.error("Error reactivando cuenta:", err);
        alert(
          err.response?.data?.message ||
            "No se ha podido reactivar la cuenta."
        );
      })
      .finally(() => setAccionLoading(false));
  };

  const renderEstadoCuenta = () => {
    if (!usuario) return null;

    if (usuario.cancelada) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-300">
          Cuenta cancelada
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
        Cuenta activa
      </span>
    );
  };

  const renderRol = () => {
    if (!usuario) return null;
    if (usuario.admin) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-300">
        Usuario
      </span>
    );
  };

  const valoracionMedia =
    typeof usuario?.valoracion_media === "number"
      ? usuario.valoracion_media
      : usuario?.cantidad_val > 0
      ? Number(usuario.suma_val || 0) / usuario.cantidad_val
      : 0;

  return (
    <>
      <AdminTopbar title="Detalle de usuario" />

      <main className="px-6 py-6 max-w-6xl mx-auto w-full">
        <button
          type="button"
          onClick={() => navigate("/admin/usuarios")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al listado de usuarios
        </button>

        {loading ? (
          <p className="text-gray-500">Cargando usuario...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : !usuario ? (
          <p className="text-gray-500">Usuario no encontrado.</p>
        ) : (
          <div className="space-y-6">
            {/* Tarjeta principal */}
            <section className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex flex-col md:flex-row gap-6">
              {/* “Avatar” pokéball grande */}
              <div className="flex items-start justify-center md:justify-start">
                <div className="relative h-24 w-24">
                  <div className="absolute inset-0 rounded-full bg-white border-4 border-black" />
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-red-600 rounded-t-full border-b-4 border-black" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-9 w-9 rounded-full bg-white border-4 border-black flex items-center justify-center">
                      <span className="text-lg font-extrabold">
                        {usuario.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {usuario.name}
                  </h2>
                  {renderRol()}
                  {renderEstadoCuenta()}
                </div>
                <p className="text-sm text-gray-600">{usuario.email}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs text-red-700 font-semibold">
                      Valoración media
                    </p>
                    <p className="text-2xl font-bold text-red-700 mt-1">
                      {valoracionMedia.toFixed(2)} / 5
                    </p>
                    <p className="text-xs text-red-600">
                      {usuario.cantidad_val || 0} valoración
                      {usuario.cantidad_val === 1 ? "" : "es"}
                    </p>
                  </div>
                  <div className="bg-slate-50 border rounded-lg p-3">
                    <p className="text-xs text-slate-700 font-semibold">
                      Ventas realizadas
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {ventas.length}
                    </p>
                  </div>
                  <div className="bg-slate-50 border rounded-lg p-3">
                    <p className="text-xs text-slate-700 font-semibold">
                      Compras realizadas
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {compras.length}
                    </p>
                  </div>
                </div>

                {/* Dirección */}
                <div className="mt-4 space-y-1 text-sm text-gray-700">
                  <p className="font-semibold">Dirección</p>
                  <p>
                    {usuario.direccion || "—"}{" "}
                    {usuario.cp && `(${usuario.cp})`}
                  </p>
                  <p>
                    {usuario.ciudad || "—"}{" "}
                    {usuario.provincia && `, ${usuario.provincia}`}
                  </p>
                </div>

                {/* Botones de acción */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {usuario.cancelada ? (
                    <button
                      type="button"
                      onClick={handleReactivarCuenta}
                      disabled={accionLoading}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Reactivar cuenta
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCancelarCuenta}
                      disabled={accionLoading}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Cancelar cuenta
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Listados básicos de compras / ventas */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Compras recientes
                </h3>
                {compras.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Este usuario aún no tiene compras registradas.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {compras.slice(0, 10).map((c) => (
                      <li key={c.id} className="py-2 flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            Venta #{c.id}
                          </p>
                          <p className="text-gray-500">
                            {c.fecha_venta
                              ? new Date(
                                  c.fecha_venta
                                ).toLocaleDateString("es-ES")
                              : "-"}{" "}
                            · {Number(c.precio_total || 0).toFixed(2)} €
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Publicaciones en venta (histórico)
                </h3>
                {ventas.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay publicaciones registradas para este usuario.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {ventas.slice(0, 10).map((v) => (
                      <li key={v.id} className="py-2 flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            Publicación #{v.id}
                          </p>
                          <p className="text-gray-500">
                            {v.id_carta} · {Number(v.precio || 0).toFixed(2)} €
                            {" · "}
                            Estado: {v.estado}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Link a vista pública de perfil (si la quieres reaprovechar) */}
            <section className="text-sm text-gray-600">
              <p>
                Ver perfil público de este usuario:{" "}
                <Link
                  to={`/perfil/${usuario.id}`}
                  className="text-red-600 hover:underline"
                >
                  /perfil/{usuario.id}
                </Link>
                {"  "}
                (solo lectura; el admin no debe editar desde ahí).
              </p>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
