import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function SearchBarAvanzado({ onSearch, sets = [] }) {
    const [query, setQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterSet, setFilterSet] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();

        const filtros = {};
        // 👇 CLAVES IGUALES QUE EN EL BACKEND
        if (query.trim()) filtros.name = query.trim();      // antes: q
        if (filterType) filtros.types = filterType;         // antes: type
        if (filterSet) filtros.set = filterSet;             // igual

        onSearch(filtros);
    };

    const handleReset = () => {
        setQuery('');
        setFilterType('');
        setFilterSet('');
        onSearch({}); // sin filtros -> devuelve todo
    };

    return (
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar por nombre o número Pokédex
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Charizard, 006, Pikachu..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                        />
                    </div>

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
                            {[
                                ['fire', ' Fuego'],
                                ['water', ' Agua'],
                                ['grass', ' Planta'],
                                ['electric', ' Eléctrico'],
                                ['psychic', ' Psíquico'],
                                ['fighting', ' Lucha'],
                                ['rock', ' Roca'],
                                ['ground', ' Tierra'],
                                ['flying', ' Volador'],
                                ['bug', ' Bicho'],
                                ['poison', ' Veneno'],
                                ['dark', ' Siniestro'],
                                ['ghost', ' Fantasma'],
                                ['steel', ' Acero'],
                                ['dragon', ' Dragón'],
                                ['fairy', ' Hada'],
                                ['normal', ' Normal'],
                            ].map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
                            {Array.isArray(sets) && sets.length > 0 ? (
                                sets.map((set) => (
                                    <option key={set.id} value={set.id}>
                                        {set.name} ({set.id})
                                    </option>
                                ))
                            ) : (
                                <option disabled>Cargando sets...</option>
                            )}
                        </select>
                    </div>

                    <div className="md:col-span-2 flex gap-2 items-end">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-semibold h-10"
                        >
                            <MagnifyingGlassIcon className="h-5 w-5" />
                            Buscar
                        </button>
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
