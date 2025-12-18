// Componentes de Headless UI para:
// - Disclosure: menú responsive (hamburguesa en móvil)
// - Menu: desplegable del usuario (perfil, compras, logout)
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";

// Iconos de Heroicons (solo UI)
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingBagIcon,
  BookmarkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Router: NavLink para navegación con estado activo y Outlet para renderizar páginas hijas
import { NavLink, Outlet, Navigate } from "react-router-dom";

// Contexto global donde guardo user, token y si es admin
import { useStateContext } from "../../Contexts/ContextProvider";

// Icono del usuario para el botón del menú
import { UserIcon } from "@heroicons/react/24/solid";

// Cliente Axios ya configurado (baseURL, headers, interceptors, etc.)
import axiosClient from "../../axios";

// Logo de la app
import logo from "../../shared/assets/image_copy.png";

// Definición del menú principal (navbar)
// name: texto visible, to: ruta, icon: icono (si lo quieres usar en el futuro)
const navigation = [
  { name: "Marketplace", to: "/marketplace", icon: ShoppingBagIcon },
  { name: "Mi Colección", to: "/coleccion", icon: BookmarkIcon },
  { name: "Wishlist", to: "/wishlist", icon: SparklesIcon },
  { name: "Mis cartas en venta", to: "/mis-cartas-en-venta", icon: ShoppingBagIcon },
];

// Helper para construir clases Tailwind sin dejar "undefined" o strings vacíos
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function DefaultLayout() {
  // Sacamos del contexto el estado global de autenticación
  const { currentUser, userToken, setCurrentUser, setUserToken, isAdmin } =
    useStateContext();

  // Si no hay token, el usuario no está autenticado -> lo mandamos al login
  if (!userToken) {
    return <Navigate to="/login" />;
  }

  // Si el usuario es admin, este layout no aplica: lo redirigimos al panel admin
  if (isAdmin) {
    return <Navigate to="/admin" />;
  }

  // Logout: llama a la API para invalidar token y limpia el estado global
  const logout = (ev) => {
    ev.preventDefault();

    axiosClient.post("/logout").then(() => {
      // Vacío el usuario en memoria y elimino el token para que el router redirija
      setCurrentUser({});
      setUserToken(null);
    });
  };

  return (
    // Layout general: navbar arriba + contenido debajo (Outlet)
    <div className="min-h-full">
      {/* NAVBAR: rojo, con enlaces + menú de usuario + hamburguesa en móvil */}
      <Disclosure as="nav" className="bg-red-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* BLOQUE IZQUIERDO: logo + navegación en desktop */}
            <div className="flex items-center">
              {/* Logo clickable que lleva al marketplace */}
              <div className="shrink-0">
                <NavLink to="/marketplace" className="inline-flex items-center">
                  <img alt="Logo" src={logo} className="h-12 w-17" />
                </NavLink>
              </div>

              {/* Menú horizontal SOLO en pantallas md+ */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      // NavLink te da isActive para aplicar estilos al link activo
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? "bg-red-700 text-white"
                            : "text-white hover:bg-red-700",
                          "rounded-md px-3 py-2 text-sm font-medium"
                        )
                      }
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>

            {/* BLOQUE DERECHO: menú de usuario SOLO en desktop */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <Menu as="div" className="relative ml-3">
                  {/* Botón (icono usuario) que abre el desplegable */}
                  <MenuButton className="relative flex max-w-xs items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Abrir menú de usuario</span>
                    <UserIcon className="w-8 bg-white text-red-600 rounded-full p-1" />
                  </MenuButton>

                  {/* Contenedor del desplegable */}
                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white border-2 border-red-600 py-1 outline-none transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                  >
                    {/* Link al perfil del usuario actual */}
                    <MenuItem>
                      <NavLink
                        to={`/perfil/${currentUser.id}`}
                        className="block px-4 py-2 text-sm text-black data-focus:bg-red-50 data-focus:outline-hidden hover:bg-red-50 hover:text-red-600"
                      >
                        Mi Perfil
                      </NavLink>
                    </MenuItem>

                    {/* Link al historial de compras */}
                    <MenuItem>
                      <NavLink
                        to="/mis-ventas"
                        className="block px-4 py-2 text-sm text-black data-focus:bg-red-50 data-focus:outline-hidden hover:bg-red-50 hover:text-red-600"
                      >
                        Mis Compras
                      </NavLink>
                    </MenuItem>

                    {/* Logout: no es NavLink porque ejecuta lógica antes */}
                    <MenuItem>
                      <a
                        href="#"
                        onClick={logout}
                        className="block px-4 py-2 text-sm text-black data-focus:bg-red-50 data-focus:outline-hidden hover:bg-red-50 hover:text-red-600"
                      >
                        Cerrar Sesión
                      </a>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>
            </div>

            {/* BOTÓN HAMBURGUESA: SOLO en móvil (md hidden) */}
            <div className="-mr-2 flex md:hidden">
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-red-700 focus:outline-2 focus:outline-offset-2 focus:outline-white">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Abrir menú principal</span>

                {/* Icono cambia según esté abierto/cerrado */}
                <Bars3Icon
                  aria-hidden="true"
                  className="block size-6 group-data-open:hidden"
                />
                <XMarkIcon
                  aria-hidden="true"
                  className="hidden size-6 group-data-open:block"
                />
              </DisclosureButton>
            </div>
          </div>
        </div>

        {/* MENÚ MÓVIL: cuando se abre el Disclosure */}
        <DisclosurePanel className="md:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  classNames(
                    isActive
                      ? "bg-red-700 text-white"
                      : "text-white hover:bg-red-700",
                    "block rounded-md px-3 py-2 text-base font-medium"
                  )
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </DisclosurePanel>
      </Disclosure>

      {/* Aquí se renderiza la página hija según la ruta (marketplace, coleccion, wishlist, etc.) */}
      <Outlet />
    </div>
  );
}
