// react/src/router.jsx
import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "./components/DefaultLayout.jsx";
import GuestLayout from "./components/GuestLayout.jsx";

// Vistas de auth
import Login from "./views/Login.jsx";
import Signup from "./views/Signup.jsx";

// Vistas principales
import Dashboard from "./views/Dashboard.jsx";
import ExplorarCartas from "./views/ExplorarCartas.jsx";
import Marketplace from "./views/Marketplace.jsx";
import Coleccion from "./views/Coleccion.jsx";
import Wishlist from "./views/Wishlist.jsx";
import MisVentas from "./views/MisVentas.jsx";
import Perfil from "./views/Perfil.jsx";

// Detalle de carta TCGdex (si ya lo usabas)
import CartaDetalle from "./views/CartaDetalle.jsx";

// Detalle de carta en colección
import CartaColeccionDetalle from "./views/CartaColeccionDetalle.jsx";

// ✅ NUEVA VISTA: mis cartas en venta
import MisCartasEnVenta from "./views/MisCartasEnVenta.jsx";

// ✅ NUEVA VISTA: detalle de una publicación del marketplace
import DetalleEnVenta from "./views/DetalleEnVenta.jsx";

// ✅ Layout y vistas de ADMIN
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

      { path: "/explorar-cartas", element: <ExplorarCartas /> },
      { path: "/marketplace", element: <Marketplace /> },

      // ✅ Detalle de una publicación concreta del marketplace
      { path: "/marketplace/:ventaId", element: <DetalleEnVenta /> },

      // Colección general
      { path: "/coleccion", element: <Coleccion /> },

      // Detalle de una entrada concreta de la colección
      { path: "/mi-coleccion/:coleccionId", element: <CartaColeccionDetalle /> },

      { path: "/wishlist", element: <Wishlist /> },

      // Histórico de compras (ya lo tenías)
      { path: "/mis-ventas", element: <MisVentas /> },

      // ✅ NUEVA RUTA: mis cartas publicadas en venta
      { path: "/mis-cartas-en-venta", element: <MisCartasEnVenta /> },

      { path: "/perfil/:id", element: <Perfil /> },

      // Detalle de carta genérico por id de TCGdex
      { path: "/carta/:id", element: <CartaDetalle /> },
    ],
  },

  // ============================
  //  RUTAS ADMIN (layout propio)
  // ============================
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      // /admin
      { index: true, element: <AdminDashboard /> },

      // /admin/usuarios
      { path: "usuarios", element: <AdminUsuarios /> },

      // /admin/usuarios/:id
      { path: "usuarios/:id", element: <AdminUsuarioDetalle /> },

      // /admin/ventas
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
