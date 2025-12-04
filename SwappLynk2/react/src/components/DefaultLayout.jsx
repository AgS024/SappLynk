import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingBagIcon,
  BookmarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useStateContext } from '../Contexts/ContextProvider';
import { UserIcon } from '@heroicons/react/24/solid';
import axiosClient from '../axios';
import logo from '../assets/image_copy.png';

const navigation = [
  { name: 'Inicio', to: '/', icon: null },
  { name: 'Marketplace', to: '/marketplace', icon: ShoppingBagIcon },
  { name: 'Mi Colección', to: '/coleccion', icon: BookmarkIcon },
  { name: 'Wishlist', to: '/wishlist', icon: SparklesIcon },
  // ✅ NUEVO: menú para mis cartas en venta
  { name: 'Mis cartas en venta', to: '/mis-cartas-en-venta', icon: ShoppingBagIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DefaultLayout() {
  const { currentUser, userToken, setCurrentUser, setUserToken } = useStateContext();

  if (!userToken) {
    return <Navigate to="/login" />;
  }

  const logout = (ev) => {
    ev.preventDefault();
    axiosClient.post('/logout').then(() => {
      setCurrentUser({});
      setUserToken(null);
    });
  };

  return (
    <div className="min-h-full">
      <Disclosure as="nav" className="bg-red-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="shrink-0">
                <img alt="Logo" src={logo} className="h-12 w-17" />
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      className={({ isActive }) =>
                        classNames(
                          isActive ? 'bg-red-700 text-white' : 'text-white hover:bg-red-700',
                          'rounded-md px-3 py-2 text-sm font-medium',
                        )
                      }
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <Menu as="div" className="relative ml-3">
                  <MenuButton className="relative flex max-w-xs items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Abrir menú de usuario</span>
                    <UserIcon className="w-8 bg-white text-red-600 rounded-full p-1" />
                  </MenuButton>

                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white border-2 border-red-600 py-1 outline-none transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                  >
                    <MenuItem>
                      <NavLink
                        to={`/perfil/${currentUser.id}`}
                        className="block px-4 py-2 text-sm text-black data-focus:bg-red-50 data-focus:outline-hidden hover:bg-red-50 hover:text-red-600"
                      >
                        Mi Perfil
                      </NavLink>
                    </MenuItem>
                    <MenuItem>
                      <NavLink
                        to="/mis-ventas"
                        className="block px-4 py-2 text-sm text-black data-focus:bg-red-50 data-focus:outline-hidden hover:bg-red-50 hover:text-red-600"
                      >
                        Mis Compras
                      </NavLink>
                    </MenuItem>
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
            <div className="-mr-2 flex md:hidden">
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-red-700 focus:outline-2 focus:outline-offset-2 focus:outline-white">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Abrir menú principal</span>
                <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
              </DisclosureButton>
            </div>
          </div>
        </div>

        <DisclosurePanel className="md:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  classNames(
                    isActive ? 'bg-red-700 text-white' : 'text-white hover:bg-red-700',
                    'block rounded-md px-3 py-2 text-base font-medium',
                  )
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </DisclosurePanel>
      </Disclosure>

      <Outlet />
    </div>
  );
}
