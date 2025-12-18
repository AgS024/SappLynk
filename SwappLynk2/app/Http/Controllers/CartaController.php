<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TCGdexService;

class CartaController extends Controller
{
    public function index(Request $request)
    {
        // Parámetro simple de búsqueda (por defecto vacío si no llega)
        $query = $request->input('q', '');

        // Servicio que encapsula llamadas a la API (TCGdex)
        $tcgdex = new TCGdexService();

        // Búsqueda básica de cartas por texto
        $result = $tcgdex->searchCards($query);

        // Devolvemos los resultados tal cual para el frontend
        return response()->json($result);
    }

    public function searchBySet($setId)
    {
        // Instancia del servicio para consultar sets y cartas
        $tcgdex = new TCGdexService();

        // Pedimos el detalle del set por ID
        $set = $tcgdex->getSet($setId);

        // Si la API no devuelve nada, respondemos 404
        if (!$set) {
            return response()->json(['error' => 'Set no encontrado'], 404);
        }

        // Devolvemos el set (normalmente incluye sus cartas / info asociada)
        return response()->json($set);
    }

    public function sets()
    {
        // Endpoint para listar sets disponibles
        $tcgdex = new TCGdexService();
        $sets = $tcgdex->getSets();

        return response()->json($sets);
    }

    public function getSets()
    {
        // Este método hace lo mismo que sets()
        $tcgdex = new TCGdexService();
        $sets = $tcgdex->getSets();

        return response()->json($sets);
    }

    public function advancedSearch(Request $request)
    {
        // Búsqueda avanzada construyendo filtros para la API
        $tcgdex = new TCGdexService();
        $filters = [];

        // Aceptamos tanto "name" como "q" para reutilizar el mismo backend con diferentes barras de búsqueda
        $nameParam = trim($request->input('name', ''));
        $qParam = trim($request->input('q', ''));

        // Si viene "name" se prioriza, si no usamos "q"
        $textParam = $nameParam !== '' ? $nameParam : $qParam;

        // Si hay texto de búsqueda, decidimos si es nombre o número (dexId)
        if ($textParam !== '') {
            // Si es solo dígitos, lo interpretamos como número de Pokédex
            if (preg_match('/^\d+$/', $textParam)) {

                // Quitamos ceros a la izquierda (por ejemplo "006" -> "6")
                $dexId = ltrim($textParam, '0');

                // Caso extremo: si era "0" o "000", ltrim deja vacío
                if ($dexId === '') {
                    $dexId = '0';
                }

                $filters['dexId'] = $dexId;
            } else {
                // Si no son dígitos, lo tratamos como nombre
                $filters['name'] = $textParam;
            }
        }

        // Tipo: aceptamos "types" o "type" para compatibilidad con distintas versiones del front
        $typeParam = $request->input('types', $request->input('type'));
        if (!empty($typeParam)) {
            // Normalizamos el tipo al formato que espera la API
            $filters['types'] = $this->mapFrontendTypeToApiType((string) $typeParam);
        }

        // Filtro por set: lo guardamos en dos keys porque algunas APIs/consultas pueden usar una u otra
        if ($request->filled('set')) {
            $setId = $request->input('set');
            $filters['set'] = $setId;
            $filters['set.id'] = $setId;
        }

        // Filtro por rareza (si el front lo usa)
        if ($request->filled('rarity')) {
            $filters['rarity'] = $request->input('rarity');
        }

        // Filtro por HP (si el front lo usa)
        if ($request->filled('hp')) {
            $filters['hp'] = $request->input('hp');
        }

        // Ejecutamos la búsqueda avanzada con los filtros construidos
        $results = $tcgdex->advancedSearch($filters);

        return response()->json($results);
    }

    public function show($id)
    {
        // Devuelve el detalle completo de una carta concreta por ID
        $tcgdex = new TCGdexService();
        $detalle = $tcgdex->getCard($id);

        // Si la carta no existe o la API devuelve null -> 404
        if (!$detalle) {
            return response()->json(['error' => 'Carta no encontrada'], 404);
        }

        return response()->json($detalle);
    }

    public function getCarta($id)
    {
        // Alias de show() (normalmente por compatibilidad con rutas o nombres antiguos)
        return $this->show($id);
    }

    private function mapFrontendTypeToApiType(string $type): string
    {
        // Normalización: quitamos espacios y pasamos a minúsculas para comparar sin errores
        $typeTrim = trim($type);
        $typeLower = mb_strtolower($typeTrim);

        // Mapa principal en español (incluye variantes con/ sin tilde)
        $tiposValidos = [
            'oscura'   => 'Oscura',
            'metálica' => 'Metálica',
            'metalica' => 'Metálica',
            'planta'   => 'Planta',
            'fuego'    => 'Fuego',
            'agua'     => 'Agua',
            'incolora' => 'Incolora',
            'rayo'     => 'Rayo',
            'lucha'    => 'Lucha',
            'hada'     => 'Hada',
            'dragón'   => 'Dragón',
            'dragon'   => 'Dragón',
            'psíquico' => 'Psíquico',
            'psiquico' => 'Psíquico',
        ];

        // Si el tipo está en la lista válida, devolvemos la versión estandarizada
        if (isset($tiposValidos[$typeLower])) {
            return $tiposValidos[$typeLower];
        }

        // Compatibilidad con tipos antiguos o nombres en inglés (por si el front/otro módulo los manda así)
        $mapAntiguo = [
            'fire'      => 'Fuego',
            'water'     => 'Agua',
            'grass'     => 'Planta',
            'electric'  => 'Rayo',
            'psychic'   => 'Psíquico',
            'fighting'  => 'Lucha',
            'dark'      => 'Oscura',
            'steel'     => 'Metálica',
            'dragon'    => 'Dragón',
            'fairy'     => 'Hada',
            'normal'    => 'Incolora',
            'colorless' => 'Incolora',
        ];

        // Si no está en el mapa, devolvemos lo que vino (por si la API soporta más valores)
        return $mapAntiguo[$typeLower] ?? $typeTrim;
    }
}
