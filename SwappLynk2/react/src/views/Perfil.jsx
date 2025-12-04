import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageComponent from '../components/PageComponent.jsx';
import axiosClient from '../axios.js';
import { UserIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/solid';

export default function Perfil() {
    const { userId } = useParams();
    const [usuario, setUsuario] = useState(null);
    const [valoraciones, setValoraciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [valoracionMedia, setValoracionMedia] = useState(0);
    useEffect(() => {
        cargarPerfil();
    }, [userId]);

    const cargarPerfil = () => {
        setLoading(true);
        
        // Obtener datos del usuario + valoraciones desde tu API
        // Nota: Necesitas un endpoint que devuelva el usuario con sus valoraciones
        // Por ahora simulamos, pero idealmente querrías:
        // GET /usuarios/{userId} que devuelva:
        // {
        //   id, name, email, suma_val, cantidad_val, ...
        //   valoraciones: [...]
        // }

        Promise.all([
            axiosClient.get(`/valoraciones`), // Obtener valoraciones del usuario
            // Si tienes un endpoint de usuario, descomenta:
            // axiosClient.get(`/usuarios/${userId}`)
        ])
        .then(([resValoraciones]) => {
            // Asumo que valoraciones devuelve un array con id_valorado
            const misValoraciones = resValoraciones.data.filter(v => 
                v.id_valorado == userId
            );
            
            setValoraciones(misValoraciones);
            
            // Calcular media correctamente desde las valoraciones reales
            if (misValoraciones.length > 0) {
                const suma = misValoraciones.reduce((acc, val) => acc + val.valor, 0);
                const media = (suma / misValoraciones.length).toFixed(2);
                setValoracionMedia(media);
            } else {
                setValoracionMedia(0);
            }

            // Aquí irían los datos del usuario si tienes el endpoint
            setUsuario({
                id: userId,
                name: 'Usuario',
                email: 'usuario@ejemplo.com',
                suma_val: misValoraciones.reduce((acc, val) => acc + val.valor, 0),
                cantidad_val: misValoraciones.length
            });
        })
        .catch(err => {
            console.error('Error cargando perfil:', err);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <StarIcon 
                key={i} 
                className={`h-5 w-5 ${
                    i < Math.floor(rating) 
                    ? 'text-yellow-400' 
                    : 'text-gray-300'
                }`} 
            />
        ));
    };

    if (loading) {
        return <PageComponent title="Cargando..."><p>Cargando perfil...</p></PageComponent>;
    }

    if (!usuario) {
        return <PageComponent title="Error"><p>Usuario no encontrado</p></PageComponent>;
    }

    return (
        <PageComponent title="Perfil del Usuario">
            <div className="space-y-6">
                {/* Header del perfil */}
                <div className="flex items-center space-x-6 p-6 bg-white rounded-lg shadow">
                    <UserIcon className="h-20 w-20 text-gray-400 bg-gray-200 rounded-full p-3" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{usuario.name}</h1>
                        <p className="text-gray-600">{usuario.email}</p>
                        
                        {/* Valoración Media */}
                        <div className="flex items-center mt-3">
                            <div className="flex items-center gap-1">
                                {renderStars(parseFloat(valoracionMedia))}
                            </div>
                            <span className="ml-3 font-bold text-lg text-gray-900">
                                {valoracionMedia}/5
                            </span>
                            <span className="ml-2 text-gray-600">
                                ({valoraciones.length} {valoraciones.length === 1 ? 'valoración' : 'valoraciones'})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg shadow text-center">
                        <p className="text-gray-600 text-sm mb-1">Cartas en Venta</p>
                        <p className="text-3xl font-bold text-red-600">0</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow text-center">
                        <p className="text-gray-600 text-sm mb-1">Ventas Realizadas</p>
                        <p className="text-3xl font-bold text-green-600">0</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow text-center">
                        <p className="text-gray-600 text-sm mb-1">Valoración Media</p>
                        <p className="text-3xl font-bold text-yellow-500">⭐ {valoracionMedia}</p>
                    </div>
                </div>

                {/* Valoraciones Recibidas */}
                <div className="p-6 bg-white rounded-lg shadow">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">
                        Valoraciones Recibidas ({valoraciones.length})
                    </h2>
                    
                    {valoraciones.length === 0 ? (
                        <p className="text-gray-500 text-center py-6">
                            Este usuario aún no ha recibido valoraciones
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {valoraciones.map((val) => (
                                <div key={val.id} className="border-l-4 border-yellow-400 pl-4 py-3 bg-gray-50 rounded">
                                    {/* Stars */}
                                    <div className="flex items-center gap-2 mb-2">
                                        {renderStars(val.valor)}
                                        <span className="font-bold text-gray-900">{val.valor}/10</span>
                                    </div>
                                    
                                    {/* Comentario */}
                                    {val.descripcion && (
                                        <p className="text-gray-700 italic mb-2">
                                            "{val.descripcion}"
                                        </p>
                                    )}
                                    
                                    {/* Valorador */}
                                    <div className="text-xs text-gray-600">
                                        <p>
                                            <span className="font-semibold">Por:</span> {val.valorador?.name || 'Usuario anónimo'}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Fecha:</span> {new Date(val.created_at).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageComponent>
    );
}
