// react/src/Contexts/ContextProvider.jsx

// createContext: crea el contexto global
// useState: estados globales (user, token, coleccion, etc.)
// useContext: para consumir el contexto desde otros componentes
// useEffect: para ejecutar lógica cuando cambie el token (cargar /user)
import { createContext, useState, useContext, useEffect } from "react";

// Cliente Axios ya configurado (baseURL, headers, interceptors...)
import axiosClient from "../axios.js";

/**
 * Contexto global de la aplicación.
 * Aquí centralizo:
 *  - usuario autenticado (currentUser)
 *  - token de sesión (userToken)
 *  - flag de admin (isAdmin)
 *  - datos que se comparten entre pantallas (colección, wishlist, ventas, etc.)
 */
const StateContext = createContext({
  // Usuario actual logueado
  currentUser: {},
  // Token guardado (Sanctum)
  userToken: null,
  // Flag calculado: si el usuario es admin
  isAdmin: false,

  // Indicador de “cargando usuario” tras refrescar la página (cuando hay token pero aún no hemos pedido /user)
  initializing: false,

  // -----------------------------
  // Estados compartidos de la app
  // -----------------------------

  // Colección del usuario
  coleccion: [],
  setColeccion: () => {},

  // Wishlist del usuario
  wishlist: [],
  setWishlist: () => {},

  // Cartas en venta (marketplace o mis publicaciones)
  cartasEnVenta: [],
  setCartasEnVenta: () => {},

  // Mis ventas / compras (histórico)
  misVentas: [],
  setMisVentas: () => {},

  // Valoraciones del usuario
  valoraciones: [],
  setValoraciones: () => {},

  // Setters del usuario/token
  setCurrentUser: () => {},
  setUserToken: () => {},
});

export const ContextProvider = ({ children }) => {
  // Usuario logueado (objeto con id, name, admin, etc.)
  const [currentUser, setCurrentUser] = useState({});

  // Token: lo inicializo leyendo localStorage, para que persista tras refrescar la página
  const [userToken, _setUserToken] = useState(
    localStorage.getItem("TOKEN") || ""
  );

  // Estados que uso en distintas pantallas y me interesa tenerlos accesibles globalmente
  const [coleccion, setColeccion] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartasEnVenta, setCartasEnVenta] = useState([]);
  const [misVentas, setMisVentas] = useState([]);
  const [valoraciones, setValoraciones] = useState([]);

  // Flag para saber si estamos en proceso de “restaurar sesión” (pedir /user)
  const [initializing, setInitializing] = useState(false);

  /**
   * Setter del token:
   * - si hay token -> lo guardo en localStorage
   * - si no hay token -> lo borro (logout / token inválido)
   * Además actualiza el estado React interno.
   */
  const setUserToken = (token) => {
    if (token) {
      localStorage.setItem("TOKEN", token);
    } else {
      localStorage.removeItem("TOKEN");
    }
    _setUserToken(token || "");
  };

  // isAdmin es un valor derivado del usuario (no lo guardo en estado porque se calcula fácil)
  const isAdmin = !!currentUser?.admin;

  /**
   * Efecto: cada vez que cambie el token, intentamos cargar el usuario desde /user.
   *
   * Caso típico:
   * - el usuario hace login -> guardamos token -> se dispara este useEffect -> obtenemos currentUser
   * - el usuario refresca la página -> el token sigue en localStorage -> se dispara -> recuperamos /user
   * - si el token es inválido -> limpiamos token y usuario (logout forzado)
   */
  useEffect(() => {
    // Si no hay token, no tiene sentido pedir /user
    if (!userToken) {
      setCurrentUser({});
      setInitializing(false);
      return;
    }

    // Hay token -> marcamos que estamos cargando el usuario
    setInitializing(true);

    axiosClient
      .get("/user")
      .then((res) => {
        // Guardamos el usuario en el estado global
        setCurrentUser(res.data || {});
      })
      .catch((err) => {
        // Si falla /user normalmente es token inválido o expirado
        console.error("Error cargando /user en ContextProvider:", err);

        // Limpiamos todo para volver al estado "no autenticado"
        setCurrentUser({});
        setUserToken(null);
      })
      .finally(() => {
        // Terminamos el estado de carga (haya ido bien o mal)
        setInitializing(false);
      });

    // Nota: se desactiva el warning porque intencionadamente NO metemos setUserToken en deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken]);

  return (
    // Proveedor del contexto: expone valores y setters a toda la app
    <StateContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        userToken,
        setUserToken,
        isAdmin,
        initializing,
        coleccion,
        setColeccion,
        wishlist,
        setWishlist,
        cartasEnVenta,
        setCartasEnVenta,
        misVentas,
        setMisVentas,
        valoraciones,
        setValoraciones,
      }}
    >
      {/* children = toda la app dentro del provider */}
      {children}
    </StateContext.Provider>
  );
};

// Hook para consumir el contexto de forma cómoda: const { userToken } = useStateContext();
export const useStateContext = () => useContext(StateContext);
