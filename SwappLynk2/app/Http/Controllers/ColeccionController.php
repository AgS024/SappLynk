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
    /**
     * Servicio para obtener datos de cartas desde TCGdex.
     *
     * @var \App\Services\TCGdexService
     */
    protected TCGdexService $tcgdex;

    public function __construct(TCGdexService $tcgdex)
    {
        $this->tcgdex = $tcgdex;
    }

    /**
     * Devuelve la colección completa del usuario autenticado.
     */
    public function index(): JsonResponse
    {
        $userId = Auth::id();

        $items = Coleccion::with('grado')
            ->where('id_usuario', $userId)
            ->get();

        // Enriquecemos cada entrada con los datos de la carta desde TCGdex
        $items->transform(function (Coleccion $item) {
            if ($item->id_carta) {
                try {
                    $item->tcgdex = $this->tcgdex->getCard($item->id_carta);
                } catch (\Throwable $e) {
                    $item->tcgdex = null;
                }
            } else {
                $item->tcgdex = null;
            }

            return $item;
        });

        return response()->json($items);
    }

    /**
     * Añade una carta a la colección del usuario.
     *
     * Si ya existe una entrada con el mismo id_carta e id_grado para el usuario,
     * se suma la cantidad.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_carta' => 'required|string|max:100',
            'id_grado' => 'required|integer',
            'cantidad' => 'required|integer|min:1',
            'notas'    => 'nullable|string',
        ]);

        $userId = Auth::id();

        // ✅ Aseguramos que exista la carta en la tabla `cartas` (FK)
        //    Si no existe, la creamos sólo con el id (el resto lo da TCGdex)
        Carta::firstOrCreate([
            'id' => $data['id_carta'],
        ]);

        // Buscamos si ya existe esa carta con ese grado en la colección del usuario
        $query = Coleccion::where('id_usuario', $userId)
            ->where('id_carta', $data['id_carta'])
            ->where('id_grado', $data['id_grado']);

        $entradaExistente = $query->first();

        if ($entradaExistente) {
            // Calculamos la nueva cantidad y actualizamos mediante query
            $nuevaCantidad = $entradaExistente->cantidad + $data['cantidad'];

            $updates = ['cantidad' => $nuevaCantidad];
            if (array_key_exists('notas', $data)) {
                $updates['notas'] = $data['notas'];
            }

            $query->update($updates);
        } else {
            // Creamos una nueva entrada
            $entradaExistente = Coleccion::create([
                'id_usuario' => $userId,
                'id_carta'   => $data['id_carta'],
                'id_grado'   => $data['id_grado'],
                'cantidad'   => $data['cantidad'],
                'notas'      => $data['notas'] ?? null,
                // fecha_adquisicion se rellena sola por defecto en la migración
            ]);
        }

        // Volvemos a cargar la entrada actualizada
        $entrada = Coleccion::with('grado')
            ->where('id_usuario', $userId)
            ->where('id_carta', $data['id_carta'])
            ->where('id_grado', $data['id_grado'])
            ->first();

        // Enriquecemos con datos de carta
        try {
            $entrada->tcgdex = $this->tcgdex->getCard($entrada->id_carta);
        } catch (\Throwable $e) {
            $entrada->tcgdex = null;
        }

        return response()->json($entrada, 201);
    }

    /**
     * (MÉTODO LEGADO) Actualiza una entrada de colección por ID numérico interno.
     * Actualmente tu tabla no tiene columna "id", así que este método
     * no se está utilizando en el frontend.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Actualización por ID numérico no soportada en la tabla coleccion.',
        ], 400);
    }

    /**
     * (MÉTODO LEGADO) Elimina una entrada de colección por ID numérico interno.
     * Actualmente tu tabla no tiene columna "id", así que este método
     * no se está utilizando en el frontend.
     */
    public function destroy(int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Eliminación por ID numérico no soportada en la tabla coleccion.',
        ], 400);
    }

    /* =========================================================
     *  MÉTODOS: trabajar por ID DE CARTA (id_carta, ej: bw8-3)
     *  Usados por la pantalla /mi-coleccion/:coleccionId (React)
     * ========================================================= */

    /**
     * Devuelve la entrada de colección (una sola) de esta carta para el usuario.
     * GET /api/coleccion/carta/{id_carta}
     */
    public function showByCard(string $id_carta): JsonResponse
    {
        $userId = Auth::id();

        $entrada = Coleccion::with('grado')
            ->where('id_usuario', $userId)
            ->where('id_carta', $id_carta)
            ->firstOrFail();

        try {
            $entrada->tcgdex = $this->tcgdex->getCard($entrada->id_carta);
        } catch (\Throwable $e) {
            $entrada->tcgdex = null;
        }

        return response()->json($entrada);
    }

    /**
     * Actualiza la entrada de colección para una carta concreta (id_carta).
     * IMPORTANTE: aquí actualizamos por (usuario + carta) y dejamos id_grado
     * como campo modificable. La PK real sigue siendo (id_usuario,id_carta,id_grado).
     * PUT /api/coleccion/carta/{id_carta}
     */
    public function updateByCard(Request $request, string $id_carta): JsonResponse
    {
        $userId = Auth::id();

        $data = $request->validate([
            'id_grado' => 'sometimes|integer',
            'cantidad' => 'sometimes|integer|min:0',
            'notas'    => 'nullable|string',
        ]);

        $query = Coleccion::where('id_usuario', $userId)
            ->where('id_carta', $id_carta);

        $entrada = $query->firstOrFail();

        // Si la cantidad pasa a 0, eliminamos la entrada (sólo esa carta del usuario)
        if (array_key_exists('cantidad', $data) && $data['cantidad'] <= 0) {
            $query->delete();

            return response()->json([
                'message' => 'Entrada eliminada porque la cantidad es 0.',
            ]);
        }

        // Actualizamos sólo esta entrada mediante query, sin usar save()
        $query->update($data);

        // Volvemos a cargar la entrada actualizada
        $entradaRefrescada = Coleccion::with('grado')
            ->where('id_usuario', $userId)
            ->where('id_carta', $id_carta)
            ->firstOrFail();

        try {
            $entradaRefrescada->tcgdex = $this->tcgdex->getCard($entradaRefrescada->id_carta);
        } catch (\Throwable $e) {
            $entradaRefrescada->tcgdex = null;
        }

        return response()->json($entradaRefrescada);
    }

    /**
     * Elimina la entrada de colección asociada a una carta concreta (id_carta)
     * para el usuario autenticado.
     * OJO: esta versión borra TODAS las filas de esa carta para el usuario.
     * La dejo por compatibilidad, pero en React vamos a usar la versión con grado.
     * DELETE /api/coleccion/carta/{id_carta}
     */
    public function destroyByCard(string $id_carta): JsonResponse
    {
        $userId = Auth::id();

        $query = Coleccion::where('id_usuario', $userId)
            ->where('id_carta', $id_carta);

        $entrada = $query->first();

        if (!$entrada) {
            return response()->json([
                'message' => 'No se encontró la carta en tu colección.',
            ], 404);
        }

        $query->delete();

        return response()->json([
            'message' => 'Entrada(s) de colección eliminada(s) correctamente por id_carta.',
        ]);
    }

    /**
     * ✅ NUEVO: Elimina UNA ÚNICA fila de colección por
     * (id_usuario, id_carta, id_grado).
     *
     * DELETE /api/coleccion/carta/{id_carta}/grado/{id_grado}
     */
    public function destroyByCardAndGrade(string $id_carta, int $id_grado): JsonResponse
    {
        $userId = Auth::id();

        $query = Coleccion::where('id_usuario', $userId)
            ->where('id_carta', $id_carta)
            ->where('id_grado', $id_grado);

        $entrada = $query->first();

        if (!$entrada) {
            return response()->json([
                'message' => 'No se encontró la carta con ese grado en tu colección.',
            ], 404);
        }

        $query->delete();

        return response()->json([
            'message' => 'Entrada de colección eliminada correctamente (por carta + grado).',
        ]);
    }
}
