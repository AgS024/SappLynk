// react/src/views/Signup.jsx

import { Link } from "react-router-dom";
import { useState } from "react";
import axiosClient from "../axios.js";
import { useStateContext } from "../Contexts/ContextProvider.jsx";

// (No se usa en el JSX actual; si no lo vas a usar, bórralo)
import { LockClosedIcon } from "@heroicons/react/24/solid";

export default function Signup() {
  // Contexto global: setear usuario + token tras registro
  const { setCurrentUser, setUserToken } = useStateContext();

  // Estados del formulario
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Errores HTML (devueltos por Laravel, normalmente)
  const [errors, setErrors] = useState({ __html: "" });

  /**
   * onSubmit
   * POST /signup
   * Si sale bien: guarda usuario y token en contexto.
   * Si falla: pinta los errores en el bloque rojo.
   */
  const onSubmit = (ev) => {
    ev.preventDefault();
    setErrors({ __html: "" });

    axiosClient
      .post("/signup", {
        name: `${firstName} ${lastName}`,
        email: email,
        password: password,
        password_confirmation: passwordConfirm,

        // ⚠️ OJO: asegúrate de que el backend espera estos nombres.
        // En tu Perfil usas: direccion, ciudad, provincia, cp
        // Aquí estás mandando: address, city, province, postal_code
        // Si el backend espera "direccion/cp", esto NO se guardará.
        address: address,
        city: city,
        province: province,
        postal_code: postalCode,
      })
      .then(({ data }) => {
        setCurrentUser(data.user);
        setUserToken(data.token);
      })
      .catch((error) => {
        if (error.response) {
          const finalError = Object.values(error.response.data.errors || {}).reduce(
            (accum, next) => [...accum, ...next],
            []
          );
          setErrors({ __html: finalError.join("<br>") });
        } else {
          setErrors({ __html: "No se pudo conectar con el servidor." });
        }
        console.error(error);
      });
  };

  return (
    <>
      <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-black">
        Regístrate gratis
      </h2>

      <p className="mt-4 text-center text-sm/6 text-black">
        Ya tienes una cuenta?{" "}
        <Link
          to="/login"
          className="font-semibold text-red-600 hover:text-red-700 underline"
        >
          Inicia sesión
        </Link>
      </p>

      {errors.__html && (
        <div
          className="rounded bg-red-50 py-2 px-3 text-red-700 center"
          dangerouslySetInnerHTML={errors}
        />
      )}

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            {/* Nombre */}
            <div className="sm:col-span-3">
              <label
                htmlFor="first-name"
                className="block text-sm/6 font-medium text-black"
              >
                Nombre
              </label>
              <div className="mt-2">
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(ev) => setFirstName(ev.target.value)}
                  autoComplete="given-name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                  placeholder="Nombre"
                />
              </div>
            </div>

            {/* Apellido */}
            <div className="sm:col-span-3">
              <label
                htmlFor="last-name"
                className="block text-sm/6 font-medium text-black"
              >
                Apellido
              </label>
              <div className="mt-2">
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  required
                  value={lastName}
                  onChange={(ev) => setLastName(ev.target.value)}
                  autoComplete="family-name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                  placeholder="Apellido"
                />
              </div>
            </div>

            {/* Email */}
            <div className="col-span-full">
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

            {/* Password */}
            <div className="col-span-full">
              <label
                htmlFor="password"
                className="block text-sm/6 font-medium text-black"
              >
                Contraseña
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  autoComplete="new-password"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                  placeholder="Contraseña"
                />
              </div>
            </div>

            {/* Confirm */}
            <div className="col-span-full">
              <label
                htmlFor="password-confirm"
                className="block text-sm/6 font-medium text-black"
              >
                Confirmación de Contraseña
              </label>
              <div className="mt-2">
                <input
                  id="password-confirm"
                  name="password_confirmation"
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(ev) => setPasswordConfirm(ev.target.value)}
                  autoComplete="new-password"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                  placeholder="Confirmación de Contraseña"
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="col-span-full">
              <label
                htmlFor="street-address"
                className="block text-sm/6 font-medium text-black"
              >
                Dirección
              </label>
              <div className="mt-2">
                <input
                  id="street-address"
                  name="street-address"
                  type="text"
                  required
                  value={address}
                  onChange={(ev) => setAddress(ev.target.value)}
                  autoComplete="street-address"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                  placeholder="Calle, número, etc."
                />
              </div>
            </div>

            {/* Ciudad */}
            <div className="sm:col-span-2 sm:col-start-1">
              <label
                htmlFor="city"
                className="block text-sm/6 font-medium text-black"
              >
                Ciudad
              </label>
              <div className="mt-2">
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  value={city}
                  onChange={(ev) => setCity(ev.target.value)}
                  autoComplete="address-level2"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                  placeholder="Ciudad"
                />
              </div>
            </div>

            {/* Provincia */}
            <div className="sm:col-span-2">
              <label
                htmlFor="region"
                className="block text-sm/6 font-medium text-black"
              >
                Provincia
              </label>
              <div className="mt-2">
                <input
                  id="region"
                  name="region"
                  type="text"
                  required
                  value={province}
                  onChange={(ev) => setProvince(ev.target.value)}
                  autoComplete="address-level1"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                  placeholder="Provincia"
                />
              </div>
            </div>

            {/* CP */}
            <div className="sm:col-span-2">
              <label
                htmlFor="postal-code"
                className="block text-sm/6 font-medium text-black"
              >
                Código Postal
              </label>
              <div className="mt-2">
                <input
                  id="postal-code"
                  name="postal-code"
                  type="text"
                  required
                  value={postalCode}
                  onChange={(ev) => setPostalCode(ev.target.value)}
                  autoComplete="postal-code"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                  placeholder="Código Postal"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-red-600 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Regístrate
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
