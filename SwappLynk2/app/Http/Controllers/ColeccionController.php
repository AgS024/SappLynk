<?php

namespace App\Http\Controllers;

use App\Models\Coleccion;
use App\Models\Carta;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Services\TCGdexService;

class ColeccionController extends Controller
{
    // Servicio inyectado para consultar datos de cartas (API TCGdex)
    protected TCGdexService $tcgdex;

    public function __construct(TCGdexService $tcgdex)
    {
        // Guardamos el servicio en una propiedad para usarlo en distintos endpoints
        $this->tcgdex = $tcgdex;
    }

    public function index(): JsonResponse
    {
        // ID del usuario autenticado (colección personal)
        $userId = Auth::id();

        // Cargamos todas las entradas de la colección incluyendo la relación con el grado
        $items = Coleccion::with('grado')
            ->where('id_usuario', $userId)
            ->get();

        // Enriquecemos cada entrada con datos de la carta consultando TCGdex
        // (esto permite que el front tenga nombre, imagen, etc. sin guardarlo en BD)
        $items->transform(function (Coleccion $item) {
            if ($item->id_carta) {
                try {
                    $item->tcgdex = $this->tcgdex->getCard($item->id_carta);
                } catch (\Throwable $e) {
                    // Si la API falla, preferimos devolver null y no romper todo el endpoint
                    $item->tcgdex = null;
                }
            } else {
                $item->tcgdex = null;
            }

            return $item;
        });

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        // Validamos los datos mínimos para añadir una carta a la colección
        $data = $request->validate([
            'id_carta' => 'required|string|max:100',
            'id_grado' => 'required|integer',
            'cantidad' => 'required|integer|min:1',
            'notas'    => 'nullable|string',
        ]);

        // Usuario autenticado
        $userId = Auth::id();

        // Aseguramos que exista el registro de la carta en la tabla `cartas`
        // (esto evita problemas de FK: coleccion.id_carta -> cartas.id)
        // Guardamos solo el id porque el detalle lo consultamos en TCGdex
        Carta::firstOrCreate([
            'id' => $data['id_carta'],
        ]);

        // Buscamos si ya existe esa misma combinación (usuario + carta + grado)
        $query = Coleccion::where('id_usuario', $userId)
            ->where('id_carta', $data['id_carta'])
            ->where('id_grado', $data['id_grado']);

        $entradaExistente = $query->first();

        if ($entradaExistente) {
            // Si ya existía, sumamos la cantidad en vez de crear una fila nueva
            $nuevaCantidad = $entradaExistente->cantidad + $data['cantidad'];

            $updates = ['cantidad' => $nuevaCantidad];

            // Notas: solo se actualizan si vienen en la request
            if (array_key_exists('notas', $data)) {
                $updates['notas'] = $data['notas'];
            }

            // Actualización directa por query (sin necesidad de $entradaExistente->save())
            $query->update($updates);
        } else {
            // Si no existía, creamos una nueva entrada en la colección
            $entradaExistente = Coleccion::create([
                'id_usuario' => $userId,
                'id_carta'   => $data['id_carta'],
                'id_grado'   => $data['id_grado'],
                'cantidad'   => $data['cantidad'],
                'notas'      => $data['notas'] ?? null,
                // fecha_adquisicion se rellena por defecto en la migración
            ]);
        }

        // Recuperamos la entrada final (ya sea creada o actualizada) incluyendo el grado
        $entrada = Coleccion::with('grado')
            ->where('id_usuario', $userId)
            ->where('id_carta', $data['id_carta'])
            ->where('id_grado', $data['id_grado'])
            ->first();

        // Enriquecemos con datos de la carta (TCGdex)
        try {
            $entrada->tcgdex = $this->tcgdex->getCard($entrada->id_carta);
        } catch (\Throwable $e) {
            $entrada->tcgdex = null;
        }

        // 201 porque en general se considera "recurso creado/actualizado al añadir"
        return response()->json($entrada, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        // Método legado:  PK compuesta
        return response()->json([
            'message' => 'Actualización por ID numérico no soportada en la tabla coleccion.',
        ], 400);
    }

    public function destroy(int $id): JsonResponse
    {
        // Método legado: igual que el anterior
        return response()->json([
            'message' => 'Eliminación por ID numérico no soportada en la tabla coleccion.',
        ], 400);
    }

    public function showByCard(string $id_carta): JsonResponse
    {
        // Devuelve UNA entrada de colección para esa carta (del usuario autenticado)
        $userId = Auth::id();

        $entrada = Coleccion::with('grado')
            ->where('id_usuario', $userId)
            ->where('id_carta', $id_carta)
            ->firstOrFail();

        // Añadimos datos de la carta desde TCGdex para el front
        try {
            $entrada->tcgdex = $this->tcgdex->getCard($entrada->id_carta);
        } catch (\Throwable $e) {
            $entrada->tcgdex = null;
        }

        return response()->json($entrada);
    }

    public function updateByCard(Request $request, string $id_carta): JsonResponse
    {
        // Actualización por id_carta (para pantallas tipo /mi-coleccion/:id)
        $userId = Auth::id();

        $data = $request->validate([
            'id_grado' => 'sometimes|integer',
            'cantidad' => 'sometimes|integer|min:0',
            'notas'    => 'nullable|string',
        ]);

        // Buscamos la entrada(s) de esa carta para el usuario
        $query = Coleccion::where('id_usuario', $userId)
            ->where('id_carta', $id_carta);

        $entrada = $query->firstOrFail();

        // Si la cantidad se pone a 0 (o menos), eliminamos la entrada
        // (en vez de guardar cantidad=0, dejamos la colección limpia)
        if (array_key_exists('cantidad', $data) && $data['cantidad'] <= 0) {
            $query->delete();

            return response()->json([
                'message' => 'Entrada eliminada porque la cantidad es 0.',
            ]);
        }

        // Actualizamos campos recibidos (solo los que vienen en $data)
        $query->update($data);

        // Recargamos la entrada para devolverla actualizada (con relación grado)
        $entradaRefrescada = Coleccion::with('grado')
            ->where('id_usuario', $userId)
            ->where('id_carta', $id_carta)
            ->firstOrFail();

        // Enriquecemos con TCGdex
        try {
            $entradaRefrescada->tcgdex = $this->tcgdex->getCard($entradaRefrescada->id_carta);
        } catch (\Throwable $e) {
            $entradaRefrescada->tcgdex = null;
        }

        return response()->json($entradaRefrescada);
    }

    public function destroyByCard(string $id_carta): JsonResponse
    {
        // Elimina TODAS las filas del usuario asociadas a esa carta (cualquier grado)
        $userId = Auth::id();

        $query = Coleccion::where('id_usuario', $userId)
            ->where('id_carta', $id_carta);

        $entrada = $query->first();

        // Si no existe, devolvemos 404
        if (!$entrada) {
            return response()->json([
                'message' => 'No se encontró la carta en tu colección.',
            ], 404);
        }

        // Borrado en bloque
        $query->delete();

        return response()->json([
            'message' => 'Entrada(s) de colección eliminada(s) correctamente por id_carta.',
        ]);
    }

    public function destroyByCardAndGrade(string $id_carta, int $id_grado): JsonResponse
    {
        // Elimina UNA fila concreta por (usuario + carta + grado)
        $userId = Auth::id();

        $query = Coleccion::where('id_usuario', $userId)
            ->where('id_carta', $id_carta)
            ->where('id_grado', $id_grado);

        $entrada = $query->first();

        // Si no existe esa combinación, devolvemos 404
        if (!$entrada) {
            return response()->json([
                'message' => 'No se encontró la carta con ese grado en tu colección.',
            ], 404);
        }

        // Borramos solo esa fila (esa carta con ese grado)
        $query->delete();

        return response()->json([
            'message' => 'Entrada de colección eliminada correctamente (por carta + grado).',
        ]);
    }
}
