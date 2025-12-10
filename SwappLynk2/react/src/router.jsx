import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "./components/DefaultLayout.jsx";
import GuestLayout from "./components/GuestLayout.jsx";

// Vistas de auth
import Login from "./views/Login.jsx";
import Signup from "./views/Signup.jsx";

// Vistas principales
import Dashboard from "./views/Dashboard.jsx";
import ExplorarCartas from "./views/ExplorarCartas.jsx";
import ExplorarCartasWishlist from "./views/ExplorarCartasWishlist.jsx";
import Marketplace from "./views/Marketplace.jsx";
import Coleccion from "./views/Coleccion.jsx";
import Wishlist from "./views/Wishlist.jsx";
import MisVentas from "./views/MisVentas.jsx";
import Perfil from "./views/Perfil.jsx";

// Detalle de carta TCGdex
import CartaDetalle from "./views/CartaDetalle.jsx";

// Detalle de carta en colección
import CartaColeccionDetalle from "./views/CartaColeccionDetalle.jsx";

// Mis cartas en venta
import MisCartasEnVenta from "./views/MisCartasEnVenta.jsx";

// Detalle de una publicación del marketplace
import DetalleEnVenta from "./views/DetalleEnVenta.jsx";

// ADMIN
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminDashboard from "./views/admin/AdminDashboard.jsx";
import AdminUsuarios from "./views/admin/AdminUsuarios.jsx";
import AdminUsuarioDetalle from "./views/admin/AdminUsuarioDetalle.jsx";
import AdminVentas from "./views/admin/AdminVentas.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/dashboard", element: <Dashboard /> },

      // ⚠️ SI QUIERES, PUEDES DEJAR ESTA RUTA GENÉRICA USANDO EL MODAL DE COLECCIÓN
      { path: "/explorar-cartas", element: <ExplorarCartas /> },

      { path: "/marketplace", element: <Marketplace /> },

      // Detalle de una publicación concreta del marketplace
      { path: "/marketplace/:ventaId", element: <DetalleEnVenta /> },

      // Colección general
      { path: "/coleccion", element: <Coleccion /> },

      // 🔹 EXPLORAR PARA AÑADIR A COLECCIÓN
      { path: "/coleccion/explorar-cartas", element: <ExplorarCartas /> },

      // Detalle de una entrada concreta de la colección
      { path: "/mi-coleccion/:coleccionId", element: <CartaColeccionDetalle /> },

      // Wishlist general
      { path: "/wishlist", element: <Wishlist /> },

      // 🔹 EXPLORAR PARA AÑADIR A WISHLIST
      {
        path: "/wishlist/explorar-cartas",
        element: <ExplorarCartasWishlist />,
      },

      // Histórico de compras
      { path: "/mis-ventas", element: <MisVentas /> },

      // Mis cartas publicadas en venta
      { path: "/mis-cartas-en-venta", element: <MisCartasEnVenta /> },

      { path: "/perfil/:id", element: <Perfil /> },

      // Detalle de carta genérico por id de TCGdex
      { path: "/carta/:id", element: <CartaDetalle /> },
    ],
  },

  // ============================
  //  RUTAS ADMIN
  // ============================
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

  // Invitados (login / signup)
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
