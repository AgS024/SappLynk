import { Outlet, Navigate } from "react-router-dom";
import { useStateContext } from "../../Contexts/ContextProvider";

export default function GuestLayout() {
  const { userToken, currentUser } = useStateContext();

  if (userToken) {
    if (currentUser?.admin) {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/marketplace" />;
  }

  return (
    <div>
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            alt="Your Company"
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
            className="mx-auto h-10 w-auto"
          />
        </div>

        <Outlet />
      </div>
    </div>
  );
}
