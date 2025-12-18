import { Link } from "react-router-dom";

// Hooks de React:
// - useState: guardar el estado de los inputs y los posibles errores del login
import { useState } from "react";

// Cliente Axios configurado para llamar a la API del backend (login, signup, etc.)
import axiosClient from "../axios.js";

// Contexto global de la app:
// - setCurrentUser: guardar el usuario autenticado en memoria global
// - setUserToken: guardar el token (y persistirlo en localStorage desde el ContextProvider)
import { useStateContext } from "../Contexts/ContextProvider.jsx";

export default function Login() {
  // Se obtienen setters del contexto para actualizar la sesión cuando el login sea correcto
  const { setCurrentUser, setUserToken } = useStateContext();

  // Estado del formulario: campos controlados para email y password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estado para mensajes de error:
  // se guarda como { __html: "..." } para poder renderizar saltos de línea con <br>
  const [errors, setErrors] = useState({ __html: "" });

  /**
   * buildHtmlFromErrors
   *
   * Función de “normalización” de errores del backend.
   * El objetivo es sacar un mensaje entendible aunque el backend responda con formatos distintos:
   * - data.errors (objeto tipo Laravel con arrays de mensajes)
   * - data.error (string)
   * - data.message (string)
   *
   * Se devuelve un string HTML (normalmente con <br>) para mostrarlo en pantalla.
   */
  const buildHtmlFromErrors = (data) => {
    if (!data) return "";

    // Caso típico de validación en Laravel: { errors: { campo: ["msg1", "msg2"] } }
    if (data.errors && typeof data.errors === "object") {
      const list = Object.values(data.errors).flat(); // junta todos los arrays en uno
      return list.join("<br>"); // separa mensajes por salto de línea
    }

    // Caso simple: { error: "..." }
    if (typeof data.error === "string") return data.error;

    // Caso simple: { message: "..." }
    if (typeof data.message === "string") return data.message;

    // Fallback si llega algo inesperado
    return "Ha ocurrido un error al iniciar sesión.";
  };

  /**
   * onSubmit
   *
   * Handler del submit del formulario:
   * 1) evita el reload de la página
   * 2) limpia errores anteriores
   * 3) hace POST /login con email y password
   * 4) si va bien: guarda user + token en el contexto
   * 5) si falla: muestra mensajes de error “bonitos”
   */
  const onSubmit = (ev) => {
    ev.preventDefault();
    setErrors({ __html: "" });

    axiosClient
      .post("/login", {
        email,
        password,
      })
      .then(({ data }) => {
        // Si el backend devuelve { user, token }:
        // - currentUser se usa para mostrar datos del usuario en la UI
        // - token se guarda para autorizar llamadas futuras (Sanctum / Bearer / etc.)
        setCurrentUser(data.user);
        setUserToken(data.token);
      })
      .catch((error) => {
        // Si el backend respondió con JSON de error, se intenta extraer un mensaje útil
        if (error.response) {
          const html = buildHtmlFromErrors(error.response.data);
          setErrors({ __html: html });
        } else {
          // Caso típico: servidor caído, CORS, red, etc.
          setErrors({ __html: "No se pudo conectar con el servidor." });
        }
        console.error(error);
      });
  };

  return (
    <>
      {/* Título de la pantalla */}
      <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-black">
        Inicia Sesión con tu cuenta
      </h2>

      {/* Bloque de errores:
          Se renderiza solo si hay contenido en errors.__html.
          Se usa dangerouslySetInnerHTML para respetar los <br> generados desde buildHtmlFromErrors. */}
      {errors.__html && (
        <div
          className="rounded bg-red-50 py-2 px-3 text-red-700 center"
          dangerouslySetInnerHTML={errors}
        />
      )}

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Formulario controlado: los valores vienen del estado y se actualizan con onChange */}
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Campo email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm/6 font-medium text-black"
            >
              Correo electrónico
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                autoComplete="email"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                placeholder="Correo electrónico"
              />
            </div>
          </div>

          {/* Campo password */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm/6 font-medium text-black"
              >
                Contraseña
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                autoComplete="current-password"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                placeholder="Contraseña"
              />
            </div>
          </div>

          {/* Botón submit: dispara onSubmit */}
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-red-600 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Inicia Sesión
            </button>
          </div>
        </form>

        {/* Enlace a signup para usuarios que aún no están registrados */}
        <p className="mt-10 text-center text-sm/6 text-black">
          No tienes una cuenta?{" "}
          <Link
            to="/signup"
            className="font-semibold text-red-600 hover:text-red-700 underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </>
  );
}
