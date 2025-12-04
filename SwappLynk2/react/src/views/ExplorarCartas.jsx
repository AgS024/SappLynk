import { useEffect, useState } from 'react';
import PageComponent from '../components/PageComponent.jsx';
import axiosClient from '../axios.js';
import CardGridSelectable from '../components/CardGridSelectable.jsx';
import SearchBarAvanzado from '../components/SearchBarAvanzado.jsx';

export default function ExplorarCartas() {
    const [cartas, setCartas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sets, setSets] = useState([]);
    const [filtros, setFiltros] = useState({
        name: '',
        types: '',
        set: ''
    });

    useEffect(() => {
        cargarSets();
        buscarCartas();
    }, []);

    const cargarSets = () => {
        axiosClient.get('/cartas/sets')
            .then(res => {
                console.log('Sets cargados:', res.data);
                setSets(res.data);
            })
            .catch(err => console.error('Error cargando sets:', err));
    };

    const buscarCartas = (nuevosFiltros = filtros) => {
        setLoading(true);

        const params = new URLSearchParams();

        //  mismas claves que espera el backend (CartaController@advancedSearch)
        if (nuevosFiltros.name)  params.append('name', nuevosFiltros.name);
        if (nuevosFiltros.types) params.append('types', nuevosFiltros.types);
        if (nuevosFiltros.set)   params.append('set', nuevosFiltros.set);

        const url = params.toString()
            ? `/cartas/search/advanced?${params.toString()}`
            : `/cartas/search/advanced`;

        console.log('Llamando a:', url);

        axiosClient.get(url)
            .then(res => {
                console.log('Cartas cargadas:', res.data);
                setCartas(res.data);
            })
            .catch(err => {
                console.error('Error cargando cartas:', err);
                setCartas([]);
            })
            .finally(() => setLoading(false));
    };

    const handleSearch = (nuevosFiltros) => {
        setFiltros(nuevosFiltros);
        buscarCartas(nuevosFiltros);
    };

    const handleAñadirCarta = (carta, datosAñadida) => {
        console.log('Añadir carta:', carta, datosAñadida);
    };

    return (
        <PageComponent title="🔍 Explorar Cartas Pokémon">
            <div className="space-y-6">
                <SearchBarAvanzado 
                    onSearch={handleSearch}
                    sets={sets}
                />
                
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">⏳ Cargando cartas...</p>
                    </div>
                ) : cartas.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">📭 No se encontraron cartas</p>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600">
                            Se encontraron <span className="font-bold text-red-600">{cartas.length}</span> cartas
                        </p>
                        <CardGridSelectable 
                            cartas={cartas} 
                            onSelectCarta={handleAñadirCarta}
                            sets={sets}
                        />
                    </>
                )}
            </div>
        </PageComponent>
    );
}
