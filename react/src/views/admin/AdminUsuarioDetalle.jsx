// react/src/views/admin/AdminUsuarioDetalle.jsx

// Hooks de React:
// - useState: guardar estados locales (usuario, loading, error, etc.)
// - useEffect: cargar datos cuando cambia el id del usuario en la URL
import { useEffect, useState } from "react";

// Hooks y componentes de React Router:
// - useParams: leer el parámetro :id de la URL
// - useNavigate: navegación programática (volver al listado)
// - Link: enlace interno sin recargar la página
import { useParams, useNavigate, Link } from "react-router-dom";

// Cliente Axios configurado para llamar a la API del backend
import axiosClient from "../../axios.js";

// Icono para el botón de “volver”
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// Topbar reutilizable del panel admin (título + logout)
import AdminTopbar from "../../features/admin/layout/AdminTopbar.jsx";

/**
 * AdminUsuarioDetalle
 *
 * Vista de administración para ver el detalle de un usuario concreto.
 * Esta pantalla se carga con /admin/users/:id y trae del backend:
 * - datos básicos del usuario (nombre, email, dirección, rol, estado cancelada)
 * - historial de compras (ventas donde ha sido comprador)
 * - histórico de publicaciones (en_venta donde ha sido vendedor)
 *
 * Además incluye acciones de administración:
 * - cancelar cuenta (ban)
 * - reactivar cuenta
 *
 * Estas acciones se protegen con un modal de confirmación para evitar clics accidentales.
 */
export default function AdminUsuarioDetalle() {
  /**
   * id:
   * Se obtiene del parámetro de la URL. Por ejemplo, /admin/users/5 -> id = "5"
   */
  const { id } = useParams();

  // navigate: permite redirigir sin usar Link (por ejemplo, al volver al listado)
  const navigate = useNavigate();

  // usuario: guarda el objeto con los datos del usuario (o null si no se ha cargado)
  const [usuario, setUsuario] = useState(null);

  // loading: indica si se está cargando el usuario desde el backend
  const [loading, setLoading] = useState(false);

  // accionLoading: indica si se está ejecutando una acción (cancelar/reactivar)
  const [accionLoading, setAccionLoading] = useState(false);

  // error: mensaje para mostrar si falla la carga del usuario
  const [error, setError] = useState(null);

  // compras: compras del usuario (ventas donde el usuario es comprador)
  const [compras, setCompras] = useState([]);

  // ventas: publicaciones del usuario (en venta / histórico) donde el usuario es vendedor
  const [ventas, setVentas] = useState([]);

  /**
   * modalOpen:
   * Controla si el modal de confirmación está visible o no.
   */
  const [modalOpen, setModalOpen] = useState(false);

  /**
   * accionTipo:
   * Define qué acción se va a confirmar en el modal.
   * Valores esperados: "cancelar" o "reactivar"
   */
  const [accionTipo, setAccionTipo] = useState(null);

  /**
   * useEffect:
   * Cada vez que cambia el id, se recarga el usuario.
   * Esto permite que el mismo componente funcione para distintos usuarios sin recargar la app.
   */
  useEffect(() => {
    cargarUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * cargarUsuario:
   * Llama al endpoint del backend para obtener el detalle completo del usuario.
   * El backend devuelve el usuario y añade relaciones “ad-hoc”:
   * - compras
   * - ventas
   */
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

  // ============================
  //   MODAL: abrir/cerrar
  // ============================

  /**
   * abrirModal:
   * Abre el modal de confirmación y guarda el tipo de acción.
   */
  const abrirModal = (tipo) => {
    setAccionTipo(tipo);
    setModalOpen(true);
  };

  /**
   * cerrarModal:
   * Cierra el modal y limpia el tipo de acción para evitar estados inconsistentes.
   */
  const cerrarModal = () => {
    setModalOpen(false);
    setAccionTipo(null);
  };

  // ============================
  //   ACCIONES ADMIN (confirmadas)
  // ============================

  /**
   * confirmarAccion:
   * Una vez confirmada la acción en el modal, se llama al endpoint correspondiente:
   * - POST /admin/users/:id/cancelar
   * - POST /admin/users/:id/reactivar
   *
   * La respuesta devuelve el usuario actualizado (por ejemplo cancelada=true/false),
   * y se actualiza el estado local para refrescar la UI sin recargar.
   */
  const confirmarAccion = () => {
    if (!usuario) return;

    setAccionLoading(true);

    const endpoint =
      accionTipo === "cancelar"
        ? `/admin/users/${id}/cancelar`
        : `/admin/users/${id}/reactivar`;

    axiosClient
      .post(endpoint)
      .then((res) => {
        setUsuario(res.data);
      })
      .catch((err) => {
        console.error("Error en acción admin:", err);
        alert(
          err.response?.data?.message ||
            "No se ha podido completar la acción."
        );
      })
      .finally(() => {
        setAccionLoading(false);
        cerrarModal();
      });
  };

  // ============================
  //   RENDER helpers (badges)
  // ============================

  /**
   * renderEstadoCuenta:
   * Devuelve una etiqueta (badge) según el estado de la cuenta:
   * - cancelada -> rojo
   * - activa -> verde
   */
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

  /**
   * renderRol:
   * Badge para mostrar si el usuario es admin o usuario normal.
   */
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

  /**
   * valoracionMedia:
   * Se intenta usar valoracion_media si viene ya calculada.
   * Si no viene, se calcula con suma_val / cantidad_val.
   *
   * Nota: en el backend se convierte a escala 0–5, por eso aquí se muestra “/ 5”.
   */
  const valoracionMedia =
    typeof usuario?.valoracion_media === "number"
      ? usuario.valoracion_media
      : usuario?.cantidad_val > 0
      ? Number(usuario.suma_val || 0) / usuario.cantidad_val
      : 0;

  return (
    <>
      {/* Topbar común a todas las pantallas del admin */}
      <AdminTopbar title="Detalle de usuario" />

      {/* ============================
          MODAL DE CONFIRMACIÓN
         ============================ */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            {/* Título del modal según la acción */}
            <h2 className="text-xl font-bold text-gray-900">
              {accionTipo === "cancelar"
                ? "Cancelar cuenta"
                : "Reactivar cuenta"}
            </h2>

            {/* Mensaje de confirmación */}
            <p className="text-gray-700 text-sm">
              ¿Estás seguro de que quieres{" "}
              <span className="font-semibold text-red-600">
                {accionTipo === "cancelar"
                  ? "cancelar esta cuenta"
                  : "reactivar esta cuenta"}
              </span>
              ?
            </p>

            {/* Botones del modal */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={cerrarModal}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg text-gray-800 hover:bg-gray-300 font-semibold text-sm"
              >
                No, volver
              </button>

              <button
                onClick={confirmarAccion}
                disabled={accionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm disabled:opacity-60"
              >
                {accionLoading ? "Procesando..." : "Sí, continuar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================
          CONTENIDO PRINCIPAL
         ============================ */}
      <main className="px-6 py-6 max-w-6xl mx-auto w-full">
        {/* Botón de volver al listado */}
        <button
          type="button"
          onClick={() => navigate("/admin/usuarios")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al listado de usuarios
        </button>

        {/* Estados de carga / error / vacío */}
        {loading ? (
          <p className="text-gray-500">Cargando usuario...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : !usuario ? (
          <p className="text-gray-500">Usuario no encontrado.</p>
        ) : (
          <div className="space-y-6">
            {/* ============================
                TARJETA PRINCIPAL DE USUARIO
               ============================ */}
            <section className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex flex-col md:flex-row gap-6">
              {/* Avatar estilo pokébola (decorativo) */}
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

              {/* Datos del usuario + acciones */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {usuario.name}
                  </h2>
                  {renderRol()}
                  {renderEstadoCuenta()}
                </div>

                <p className="text-sm text-gray-600">{usuario.email}</p>

                {/* Métricas rápidas (valoración, ventas, compras) */}
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

                {/* Dirección del usuario (si existe) */}
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

                {/* Botón de acción principal (cancelar/reactivar) usando modal */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {usuario.cancelada ? (
                    <button
                      type="button"
                      onClick={() => abrirModal("reactivar")}
                      disabled={accionLoading}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Reactivar cuenta
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => abrirModal("cancelar")}
                      disabled={accionLoading}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Cancelar cuenta
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ============================
                COMPRAS Y PUBLICACIONES (histórico)
               ============================ */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compras recientes */}
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
                              ? new Date(c.fecha_venta).toLocaleDateString(
                                  "es-ES"
                                )
                              : "-"}{" "}
                            · {Number(c.precio_total || 0).toFixed(2)} €
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Publicaciones en venta (histórico) */}
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

            {/* Enlace al perfil público del usuario (vista normal) */}
            <section className="text-sm text-gray-600">
              <p>
                Ver perfil público:{" "}
                <Link
                  to={`/perfil/${usuario.id}`}
                  className="text-red-600 hover:underline"
                >
                  /perfil/{usuario.id}
                </Link>
              </p>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
