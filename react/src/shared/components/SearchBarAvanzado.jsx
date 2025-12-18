import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

/**
 * Componente SearchBarAvanzado
 * Barra de búsqueda con filtros para buscar cartas Pokémon por:
 *  - Nombre o número de Pokédex
 *  - Tipo
 *  - Set / colección
 *
 * Recibe por props:
 *  - onSearch: función que ejecuta la búsqueda con los filtros seleccionados
 *  - sets: lista de sets disponibles para el selector
 */
export default function SearchBarAvanzado({ onSearch, sets = [] }) {

  /* ---------- ESTADOS DEL COMPONENTE ---------- */

  // Texto introducido por el usuario (nombre)
  const [query, setQuery] = useState("");

  // Tipo de carta seleccionado
  const [filterType, setFilterType] = useState("");

  // Set o colección seleccionada
  const [filterSet, setFilterSet] = useState("");

  /* ---------- MANEJADOR DE BÚSQUEDA ---------- */

  /**
   * Se ejecuta al enviar el formulario.
   * Construye dinámicamente el objeto de filtros
   * y lo envía al componente padre.
   */
  const handleSearch = (e) => {
    e.preventDefault();

    const filtros = {};

    // Solo añadimos los filtros si tienen valor
    if (query.trim()) filtros.name = query.trim();
    if (filterType) filtros.types = filterType;
    if (filterSet) filtros.set = filterSet;

    // Llamada a la función de búsqueda del componente padre
    onSearch(filtros);
  };

  /* ---------- RESETEO DE FILTROS ---------- */

  /**
   * Limpia todos los campos del formulario
   * y ejecuta una búsqueda sin filtros.
   */
  const handleReset = () => {
    setQuery("");
    setFilterType("");
    setFilterSet("");
    onSearch({});
  };

  /* ---------- TIPOS DISPONIBLES DE CARTAS ---------- */

  // Tipos TCG disponibles para el selector
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

  /* ---------- RENDERIZADO ---------- */

  return (
    // Formulario principal de búsqueda
    <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-4">

        {/* ---------- FILA SUPERIOR ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Campo de búsqueda por nombre*/}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por nombre
            </label>
            <input
              type="text"
              placeholder="Ej: Charizard, Pikachu..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
            />
          </div>

          {/* Selector de tipo de carta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
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
        </div>

        {/* ---------- FILA INFERIOR ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

          {/* Selector de set / colección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Set / Colección
            </label>
            <select
              value={filterSet}
              onChange={(e) => setFilterSet(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
            >
              <option value="">Todos los sets</option>

              {/* Si hay sets cargados, se muestran */}
              {Array.isArray(sets) && sets.length > 0 ? (
                sets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name} ({set.id})
                  </option>
                ))
              ) : (
                // Estado de carga en caso de que aún no estén disponibles
                <option disabled>Cargando sets...</option>
              )}
            </select>
          </div>

          {/* Botones de acción */}
          <div className="md:col-span-2 flex gap-2 items-end">

            {/* Botón de búsqueda */}
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-semibold h-10"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              Buscar
            </button>

            {/* Botón para limpiar filtros */}
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold h-10"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
