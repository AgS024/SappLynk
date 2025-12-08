<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Valoracion;
use App\Models\Venta;
use Illuminate\Support\Facades\Auth;

class ValoracionController extends Controller
{
    // Listar valoraciones recibidas por el usuario
    public function index()
    {
        $usuarioId = Auth::id();

        $valoraciones = Valoracion::where('id_valorado', $usuarioId)
            ->with('valorador', 'venta')
            ->get();

        return response()->json($valoraciones);
    }

    // Crear una nueva valoración para una venta
    public function store(Request $request)
    {
        $usuarioId = Auth::id();

        $request->validate([
            'id_valorado'  => 'required|exists:users,id',
            'id_venta'     => 'required|exists:ventas,id',
            // 0–10
            'valor'        => 'required|integer|min:0|max:10',
            'descripcion'  => 'nullable|string',
        ]);

        // 1) Cargamos la venta para comprobar estado y comprador
        /** @var \App\Models\Venta $venta */
        $venta = Venta::findOrFail($request->id_venta);

        // Asegurarnos de que el que valora es quien compró
        if ($venta->id_comprador !== $usuarioId) {
            return response()->json([
                'error' => 'Solo el comprador de esta venta puede valorarla.',
            ], 403);
        }

        // 2) Comprobamos el estado de la compra
        // Estados:
        // 1 - esperando recibir  ❌ no permite valorar
        // 2 - recibido           ✅ permite valorar
        // 3 - enviado            ✅ permite valorar
        // 4 - cancelada          ❌ no permite valorar
        $estadoId = (int) ($venta->id_estado ?? 0);

        if ($estadoId === 1 || $estadoId === 4) {
            return response()->json([
                'error' => 'Solo puedes valorar cuando la compra está en estado recibido o enviado.',
            ], 400);
        }

        // 3) Evitar valoraciones duplicadas para la misma venta / usuario
        $exists = Valoracion::where([
            'id_valorador' => $usuarioId,
            'id_valorado'  => $request->id_valorado,
            'id_venta'     => $request->id_venta,
        ])->exists();

        if ($exists) {
            return response()->json(['error' => 'Ya has valorado esta venta.'], 400);
        }

        // 4) Crear la valoración
        $valoracion = Valoracion::create([
            'id_valorado'  => $request->id_valorado,
            'id_valorador' => $usuarioId,
            'id_venta'     => $request->id_venta,
            'valor'        => $request->valor,
            'descripcion'  => $request->descripcion,
        ]);

        return response()->json($valoracion, 201);
    }

    // Mostrar los detalles de una valoración concreta
    public function show($id)
    {
        $valoracion = Valoracion::with('valorador', 'venta')->findOrFail($id);

        return response()->json($valoracion);
    }
}
