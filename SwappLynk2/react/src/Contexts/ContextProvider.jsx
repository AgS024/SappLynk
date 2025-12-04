// react/src/Contexts/ContextProvider.jsx
import { createContext, useState, useContext } from "react";

const StateContext = createContext({
  currentUser: {},
  userToken: null,
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

  const setUserToken = (token) => {
    if (token) {
      localStorage.setItem("TOKEN", token);
    } else {
      localStorage.removeItem("TOKEN");
    }
    _setUserToken(token || "");
  };

  return (
    <StateContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        userToken,
        setUserToken,
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
