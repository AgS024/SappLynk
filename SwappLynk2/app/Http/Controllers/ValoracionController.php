<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Valoracion;
use App\Models\Venta;
use Illuminate\Support\Facades\Auth;

class ValoracionController extends Controller
{
    public function index()
    {
        // ID del usuario autenticado (el que recibe las valoraciones)
        $usuarioId = Auth::id();

        // Traemos todas las valoraciones donde el usuario es el valorado
        // y además cargamos relaciones para mostrar quién valoró y a qué venta pertenece
        $valoraciones = Valoracion::where('id_valorado', $usuarioId)
            ->with('valorador', 'venta')
            ->get();

        return response()->json($valoraciones);
    }

    public function store(Request $request)
    {
        // Usuario autenticado: será el "valorador"
        $usuarioId = Auth::id();

        // Validación básica de campos:
        // - id_valorado debe existir en users
        // - id_venta debe existir en ventas
        // - valor va de 0 a 10
        $request->validate([
            'id_valorado' => 'required|exists:users,id',
            'id_venta'    => 'required|exists:ventas,id',
            'valor'       => 'required|integer|min:0|max:10',
            'descripcion' => 'nullable|string',
        ]);

        // 1) Cargamos la venta para aplicar reglas de negocio
        /** @var \App\Models\Venta $venta */
        $venta = Venta::findOrFail($request->id_venta);

        // Regla: solo el comprador de la venta puede dejar la valoración
        if ($venta->id_comprador !== $usuarioId) {
            return response()->json([
                'error' => 'Solo el comprador de esta venta puede valorarla.',
            ], 403);
        }

        // 2) Validamos el estado de la venta:
        // - 1 (esperando recibir) -> no se puede valorar
        // - 2 (recibido)          -> sí se puede valorar
        // - 3 (enviado)           -> sí se puede valorar
        // - 4 (cancelada)         -> no se puede valorar
        $estadoId = (int) ($venta->id_estado ?? 0);

        if ($estadoId === 1 || $estadoId === 4) {
            return response()->json([
                'error' => 'Solo puedes valorar cuando la compra está en estado recibido o enviado.',
            ], 400);
        }

        // 3) Evitamos duplicados:
        // el mismo comprador no puede valorar dos veces al mismo usuario por la misma venta
        $exists = Valoracion::where([
            'id_valorador' => $usuarioId,
            'id_valorado'  => $request->id_valorado,
            'id_venta'     => $request->id_venta,
        ])->exists();

        if ($exists) {
            return response()->json([
                'error' => 'Ya has valorado esta venta.',
            ], 400);
        }

        // 4) Creamos la valoración
        $valoracion = Valoracion::create([
            'id_valorado'  => $request->id_valorado,
            'id_valorador' => $usuarioId,
            'id_venta'     => $request->id_venta,
            'valor'        => $request->valor,
            'descripcion'  => $request->descripcion,
        ]);

        // 201 porque hemos creado un recurso nuevo
        return response()->json($valoracion, 201);
    }

    public function show($id)
    {
        // Devuelve una valoración concreta, incluyendo sus relaciones para el frontend
        $valoracion = Valoracion::with('valorador', 'venta')->findOrFail($id);

        return response()->json($valoracion);
    }
}
