import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';


export default function SearchBar({ onSearch }) {
    const [query, setQuery] = useState('');
    const [filterType, setFilterType] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch({ q: query, type: filterType });
    };

    const handleReset = () => {
        setQuery('');
        setFilterType('');
        onSearch({ q: '', type: '' });
    };

    return (
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Campo de búsqueda */}
                <div className="md:col-span-2">
                    <input
                        type="text"
                        placeholder="Buscar cartas por nombre..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    />
                </div>

                {/* Filtro de tipo */}
                <div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    >
                        <option value="">Todos los tipos</option>
                        <option value="fire">🔥 Fuego</option>
                        <option value="water">💧 Agua</option>
                        <option value="grass">🌿 Planta</option>
                        <option value="electric">⚡ Eléctrico</option>
                        <option value="psychic">🧠 Psíquico</option>
                        <option value="fighting">👊 Lucha</option>
                        <option value="rock">🪨 Roca</option>
                        <option value="ground">🌍 Tierra</option>
                        <option value="flying">🦅 Volador</option>
                        <option value="bug">🐛 Bicho</option>
                        <option value="poison">☠️ Veneno</option>
                        <option value="dark">🌑 Siniestro</option>
                        <option value="ghost">👻 Fantasma</option>
                        <option value="steel">⚙️ Acero</option>
                        <option value="dragon">🐉 Dragón</option>
                        <option value="fairy">✨ Hada</option>
                        <option value="normal">⭕ Normal</option>
                    </select>
                </div>

                {/* Botones */}
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
