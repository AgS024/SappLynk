import { createBrowserRouter, Navigate } from "react-router-dom";
import DefaultLayout from "./app/layouts/DefaultLayout.jsx";
import GuestLayout from "./app/layouts/GuestLayout.jsx";

import Login from "./views/Login.jsx";
import Signup from "./views/Signup.jsx";

import ExplorarCartas from "./views/ExplorarCartas.jsx";
import ExplorarCartasWishlist from "./views/ExplorarCartasWishlist.jsx";
import Marketplace from "./views/Marketplace.jsx";
import Coleccion from "./views/Coleccion.jsx";
import Wishlist from "./views/Wishlist.jsx";
import MisVentas from "./views/MisVentas.jsx";
import Perfil from "./views/Perfil.jsx";

import CartaDetalle from "./views/CartaDetalle.jsx";
import CartaColeccionDetalle from "./views/CartaColeccionDetalle.jsx";
import MisCartasEnVenta from "./views/MisCartasEnVenta.jsx";
import DetalleEnVenta from "./views/DetalleEnVenta.jsx";

import AdminLayout from "./features/admin/layout/AdminLayout.jsx";
import AdminDashboard from "./views/admin/AdminDashboard.jsx";
import AdminUsuarios from "./views/admin/AdminUsuarios.jsx";
import AdminUsuarioDetalle from "./views/admin/AdminUsuarioDetalle.jsx";
import AdminVentas from "./views/admin/AdminVentas.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { index: true, element: <Navigate to="/marketplace" replace /> },
      { path: "/dashboard", element: <Navigate to="/marketplace" replace /> },

      { path: "/explorar-cartas", element: <ExplorarCartas /> },

      { path: "/marketplace", element: <Marketplace /> },
      { path: "/marketplace/:ventaId", element: <DetalleEnVenta /> },

      { path: "/coleccion", element: <Coleccion /> },
      { path: "/coleccion/explorar-cartas", element: <ExplorarCartas /> },
      { path: "/mi-coleccion/:coleccionId", element: <CartaColeccionDetalle /> },

      { path: "/wishlist", element: <Wishlist /> },
      { path: "/wishlist/explorar-cartas", element: <ExplorarCartasWishlist /> },

      { path: "/mis-ventas", element: <MisVentas /> },
      { path: "/mis-cartas-en-venta", element: <MisCartasEnVenta /> },

      { path: "/perfil/:id", element: <Perfil /> },
      { path: "/carta/:id", element: <CartaDetalle /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "usuarios", element: <AdminUsuarios /> },
      { path: "usuarios/:id", element: <AdminUsuarioDetalle /> },
      { path: "ventas", element: <AdminVentas /> },
    ],
  },
  {
    path: "/",
    element: <GuestLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
    ],
  },
]);

export default router;
