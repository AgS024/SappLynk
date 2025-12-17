<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TCGdexService;

class CartaController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('q', '');
        $tcgdex = new TCGdexService();
        $result = $tcgdex->searchCards($query);

        return response()->json($result);
    }

    public function searchBySet($setId)
    {
        $tcgdex = new TCGdexService();
        $set = $tcgdex->getSet($setId);

        if (!$set) {
            return response()->json(['error' => 'Set no encontrado'], 404);
        }

        return response()->json($set);
    }

    public function sets()
    {
        $tcgdex = new TCGdexService();
        $sets = $tcgdex->getSets();

        return response()->json($sets);
    }

    public function getSets()
    {
        $tcgdex = new TCGdexService();
        $sets = $tcgdex->getSets();

        return response()->json($sets);
    }

    public function advancedSearch(Request $request)
    {
        $tcgdex = new TCGdexService();
        $filters = [];

        $nameParam = trim($request->input('name', ''));
        $qParam = trim($request->input('q', ''));

        $textParam = $nameParam !== '' ? $nameParam : $qParam;

        if ($textParam !== '') {
            if (preg_match('/^\d+$/', $textParam)) {
                $dexId = ltrim($textParam, '0');
                if ($dexId === '') {
                    $dexId = '0';
                }
                $filters['dexId'] = $dexId;
            } else {
                $filters['name'] = $textParam;
            }
        }

        $typeParam = $request->input('types', $request->input('type'));
        if (!empty($typeParam)) {
            $filters['types'] = $this->mapFrontendTypeToApiType((string) $typeParam);
        }

        if ($request->filled('set')) {
            $setId = $request->input('set');
            $filters['set'] = $setId;
            $filters['set.id'] = $setId;
        }

        if ($request->filled('rarity')) {
            $filters['rarity'] = $request->input('rarity');
        }

        if ($request->filled('hp')) {
            $filters['hp'] = $request->input('hp');
        }

        $results = $tcgdex->advancedSearch($filters);
        return response()->json($results);
    }

    public function show($id)
    {
        $tcgdex = new TCGdexService();
        $detalle = $tcgdex->getCard($id);

        if (!$detalle) {
            return response()->json(['error' => 'Carta no encontrada'], 404);
        }

        return response()->json($detalle);
    }

    public function getCarta($id)
    {
        return $this->show($id);
    }

    private function mapFrontendTypeToApiType(string $type): string
    {
        $typeTrim = trim($type);
        $typeLower = mb_strtolower($typeTrim);

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

        if (isset($tiposValidos[$typeLower])) {
            return $tiposValidos[$typeLower];
        }

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

        return $mapAntiguo[$typeLower] ?? $typeTrim;
    }
}
