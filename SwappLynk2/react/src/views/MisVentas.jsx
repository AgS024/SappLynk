// react/src/views/MisVentas.jsx
import { useEffect, useState } from "react";
import PageComponent from "../components/PageComponent";
import axiosClient from "../axios";
import { useStateContext } from "../Contexts/ContextProvider";

export default function MisVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setMisVentas } = useStateContext();

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = () => {
    setLoading(true);
    axiosClient
      .get("/ventas")
      .then((res) => {
        setVentas(res.data);
        setMisVentas(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <PageComponent title="Mis Compras">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando compras...</p>
        </div>
      ) : ventas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Aún no has realizado compras</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Carta</th>
                <th className="px-4 py-2 text-left">Vendedor</th>
                <th className="px-4 py-2 text-left">Precio</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => (
                <tr
                  key={venta.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-4 py-2">
                    {venta.enVenta?.tcgdex?.name || "Cargando..."}
                  </td>
                  <td className="px-4 py-2">
                    {venta.enVenta?.usuario?.name}
                  </td>
                  <td className="px-4 py-2 font-bold">
                    €{venta.precio_total}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(
                      venta.fecha_venta
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                      Valorar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageComponent>
  );
}
