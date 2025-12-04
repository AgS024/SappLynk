<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TCGdexService;

class CartaController extends Controller
{
    // Buscar cartas por nombre (ya existente)
    public function index(Request $request)
    {
        $query = $request->input('q', '');
        $tcgdex = new TCGdexService();
        $result = $tcgdex->searchCards($query);
        return response()->json($result);
    }

    // Buscar cartas de un set específico
    public function searchBySet($setId)
    {
        $tcgdex = new TCGdexService();
        $set = $tcgdex->getSet($setId);
        if (!$set) {
            return response()->json(['error' => 'Set no encontrado'], 404);
        }
        return response()->json($set);
    }

    /**
     * ⚠️ Versión antigua: no la estás usando en las rutas,
     * pero la dejo por compatibilidad si en algún sitio llamas a /cartas/sets con otro método.
     */
    public function sets()
    {
        $tcgdex = new TCGdexService();
        $sets = $tcgdex->getSets();
        return response()->json($sets);
    }

    /**
     * ✅ NUEVO: método que realmente están llamando en api.php:
     *
     * Route::get('/cartas/sets', [CartaController::class, 'getSets']);
     */
    public function getSets()
    {
        $tcgdex = new TCGdexService();
        $sets = $tcgdex->getSets();

        // Si quisieras, aquí podrías ordenar o filtrar sets antes de devolverlos
        // usort($sets, fn($a, $b) => strcmp($a['name']['es'] ?? '', $b['name']['es'] ?? ''));

        return response()->json($sets);
    }

    // ✅ Búsqueda avanzada con múltiples filtros
    public function advancedSearch(Request $request)
    {
        $tcgdex = new TCGdexService();
        $filters = [];

        // -----------------------------
        // 🔍 NOMBRE o NÚMERO POKÉDEX
        // -----------------------------
        // El frontend manda "name", pero si algún día mandas "q" también lo soportamos
        $nameParam = trim($request->input('name', ''));
        $qParam    = trim($request->input('q', ''));

        $textParam = $nameParam !== '' ? $nameParam : $qParam;

        if ($textParam !== '') {
            // ¿Es solo número? -> lo interpretamos como dexId
            if (preg_match('/^\d+$/', $textParam)) {
                // quitamos ceros a la izquierda por si ponen "006"
                $dexId = ltrim($textParam, '0');
                if ($dexId === '') {
                    $dexId = '0';
                }
                $filters['dexId'] = $dexId;
            } else {
                // texto normal -> nombre de carta
                $filters['name'] = $textParam;
            }
        }

        // -----------------------------
        // 🔥 TIPO
        // -----------------------------
        // El frontend manda "types", pero también aceptamos "type"
        $typeParam = $request->input('types', $request->input('type'));
        if (!empty($typeParam)) {
            $filters['types'] = $this->mapFrontendTypeToApiType($typeParam);
        }

        // -----------------------------
        // 🧩 SET
        // -----------------------------
        // El select de React manda el id del set (ej: "swsh1")
        if ($request->filled('set')) {
            // La API de TCGdex filtra por set.id
            $filters['set.id'] = $request->input('set');
        }

        // -----------------------------
        // Opcionales: rareza / HP
        // -----------------------------
        if ($request->filled('rarity')) {
            $filters['rarity'] = $request->input('rarity');
        }

        if ($request->filled('hp')) {
            $filters['hp'] = $request->input('hp');
        }

        $results = $tcgdex->advancedSearch($filters);
        return response()->json($results);
    }

    // Obtener detalles de una carta por ID (ya existente)
    public function show($id)
    {
        $tcgdex = new TCGdexService();
        $detalle = $tcgdex->getCard($id);
        if (!$detalle) {
            return response()->json(['error' => 'Carta no encontrada'], 404);
        }
        return response()->json($detalle);
    }

    /**
     * 🔁 Mapea el tipo que viene del frontend (fire, water, rock...)
     * al tipo real del TCG ("Fire", "Water", "Fighting", etc.)
     */
    private function mapFrontendTypeToApiType(string $type): string
    {
        $map = [
            'fire'     => 'Fire',
            'water'    => 'Water',
            'grass'    => 'Grass',
            'electric' => 'Lightning',
            'psychic'  => 'Psychic',
            'fighting' => 'Fighting',
            'rock'     => 'Fighting',
            'ground'   => 'Fighting',
            'flying'   => 'Colorless',
            'bug'      => 'Grass',
            'poison'   => 'Psychic',
            'dark'     => 'Darkness',
            'ghost'    => 'Psychic',
            'steel'    => 'Metal',
            'dragon'   => 'Dragon',
            'fairy'    => 'Fairy',
            'normal'   => 'Colorless',
        ];

        $key = strtolower($type);
        return $map[$key] ?? $type;
    }
}
