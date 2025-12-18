// Hook de React para manejar estado local dentro del componente
import { useState } from "react";

// Icono de lupa para el botón de búsqueda
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

/**
 * SearchBar
 *
 * Componente que implementa una barra de búsqueda sencilla para cartas.
 * Permite buscar por nombre y filtrar por tipo de carta.
 *
 * Props:
 * - onSearch: función callback que se ejecuta al realizar la búsqueda
 *             y recibe los filtros seleccionados.
 */
export default function SearchBar({ onSearch }) {
  // Estado para el texto de búsqueda (nombre de la carta)
  const [query, setQuery] = useState("");

  // Estado para el filtro de tipo de carta
  const [filterType, setFilterType] = useState("");

  /**
   * Maneja el envío del formulario.
   * Se evita el comportamiento por defecto del formulario
   * y se llama al callback onSearch con los filtros actuales.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    onSearch({ q: query, type: filterType });
  };

  /**
   * Limpia los filtros y lanza una búsqueda sin criterios,
   * lo que normalmente equivale a mostrar todas las cartas.
   */
  const handleReset = () => {
    setQuery("");
    setFilterType("");
    onSearch({ q: "", type: "" });
  };

  // Lista de tipos de cartas TCG que se usan para el desplegable
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
    // Formulario de búsqueda
    <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md">
      {/* Grid responsive para adaptar la barra a distintos tamaños de pantalla */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Campo de texto para buscar por nombre */}
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Buscar cartas por nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
          />
        </div>

        {/* Selector de tipo de carta */}
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

        {/* Botones de buscar y limpiar filtros */}
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
