// react/src/Contexts/ContextProvider.jsx
import { createContext, useState, useContext, useEffect } from "react";
import axiosClient from "../axios.js";

const StateContext = createContext({
  currentUser: {},
  userToken: null,
  isAdmin: false,
  // Indicador de que estamos cargando el usuario desde /user
  initializing: false,
  // Colección
  coleccion: [],
  setColeccion: () => {},
  // Wishlist
  wishlist: [],
  setWishlist: () => {},
  // Cartas en venta
  cartasEnVenta: [],
  setCartasEnVenta: () => {},
  // Mis ventas (compras del usuario)
  misVentas: [],
  setMisVentas: () => {},
  // Valoraciones
  valoraciones: [],
  setValoraciones: () => {},
  // Usuario
  setCurrentUser: () => {},
  setUserToken: () => {},
});

export const ContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState({});
  const [userToken, _setUserToken] = useState(
    localStorage.getItem("TOKEN") || ""
  );

  const [coleccion, setColeccion] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartasEnVenta, setCartasEnVenta] = useState([]);
  const [misVentas, setMisVentas] = useState([]);
  const [valoraciones, setValoraciones] = useState([]);

  // 🔄 para saber si estamos cargando /user tras un reload
  const [initializing, setInitializing] = useState(false);

  const setUserToken = (token) => {
    if (token) {
      localStorage.setItem("TOKEN", token);
    } else {
      localStorage.removeItem("TOKEN");
    }
    _setUserToken(token || "");
  };

  // 🔐 es admin si currentUser.admin === true
  const isAdmin = !!currentUser?.admin;

  // 🔄 Cada vez que haya TOKEN, intentamos cargar el usuario desde /user
  useEffect(() => {
    // Si no hay token, limpiamos usuario y nada más
    if (!userToken) {
      setCurrentUser({});
      setInitializing(false);
      return;
    }

    // Con token -> cargamos /user
    setInitializing(true);

    axiosClient
      .get("/user")
      .then((res) => {
        setCurrentUser(res.data || {});
      })
      .catch((err) => {
        console.error("Error cargando /user en ContextProvider:", err);
        // Si el token es inválido, limpiamos todo
        setCurrentUser({});
        setUserToken(null);
      })
      .finally(() => {
        setInitializing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken]);

  return (
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
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
