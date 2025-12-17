import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch({ q: query, type: filterType });
  };

  const handleReset = () => {
    setQuery("");
    setFilterType("");
    onSearch({ q: "", type: "" });
  };

  const tiposTCG = [
    "Oscura",
    "Metálica",
    "Planta",
    "Fuego",
    "Agua",
    "Incolora",
    "Rayo",
    "Lucha",
    "Hada",
    "Dragón",
    "Psíquico",
  ];

  return (
    <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Buscar cartas por nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            {tiposTCG.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-semibold"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            Buscar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold"
          >
            Limpiar
          </button>
        </div>
      </div>
    </form>
  );
}
