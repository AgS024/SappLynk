<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Venta;
use App\Models\EnVenta;
use App\Models\Coleccion;
use Illuminate\Support\Facades\Auth;
use App\Services\TCGdexService;

class VentaController extends Controller
{
    // Historial compras del usuario logueado
    public function index()
    {
        $usuarioId = Auth::id();

        $compras = Venta::where('id_comprador', $usuarioId)
            ->with([
                'enVenta.carta',
                'enVenta.usuario',
                'enVenta.grado',
                'valoraciones',
            ])
            ->orderByDesc('fecha_venta')
            ->get();

        $tcgdex = new TCGdexService();

        // Añadir info TCGdex dentro de en_venta para cada compra
        $compras = $compras->map(function ($venta) use ($tcgdex) {
            $arr = $venta->toArray();

            if (isset($arr['en_venta']) && isset($arr['en_venta']['id_carta'])) {
                $arr['en_venta']['tcgdex'] = $tcgdex->getCard($arr['en_venta']['id_carta']);
            }

            return $arr;
        });

        return response()->json($compras);
    }

    // Registrar una nueva venta (compra de una publicación en venta)
    public function store(Request $request)
    {
        $usuarioId = Auth::id();

        $request->validate([
            'id_en_venta' => 'required|exists:en_venta,id',
        ]);

        $enVenta = EnVenta::where('id', $request->id_en_venta)
            ->where('estado', 'activa')
            ->first();

        if (!$enVenta) {
            return response()->json(['error' => 'Publicación no encontrada o ya vendida.'], 404);
        }

        // No dejar que compre su propia carta
        if ($enVenta->id_usuario == $usuarioId) {
            return response()->json(['error' => 'No puedes comprarte a ti mismo.'], 400);
        }

        // 1º Registrar la venta
        $venta = Venta::create([
            'id_en_venta'   => $enVenta->id,
            'id_comprador'  => $usuarioId,
            'precio_total'  => $enVenta->precio,
            'fecha_venta'   => now()
        ]);

        // 2º Marca la publicación como vendida
        $enVenta->estado = 'vendida';
        $enVenta->save();

        // 3º Actualiza colecciones del vendedor y comprador
        Coleccion::where([
            'id_usuario' => $enVenta->id_usuario,
            'id_carta'   => $enVenta->id_carta,
            'id_grado'   => $enVenta->id_grado
        ])->decrement('cantidad');

        // Si ya no quedan, elimina registro
        $vendedorCol = Coleccion::where([
            'id_usuario' => $enVenta->id_usuario,
            'id_carta'   => $enVenta->id_carta,
            'id_grado'   => $enVenta->id_grado
        ])->first();

        if ($vendedorCol && $vendedorCol->cantidad <= 0) {
            $vendedorCol->delete();
        }

        // Añade la carta a la colección del comprador
        $compradorCol = Coleccion::firstOrNew([
            'id_usuario' => $usuarioId,
            'id_carta'   => $enVenta->id_carta,
            'id_grado'   => $enVenta->id_grado
        ]);

        $compradorCol->cantidad = $compradorCol->cantidad + 1;
        $compradorCol->fecha_adquisicion = now();
        $compradorCol->save();

        return response()->json($venta, 201);
    }

    // Ver detalle de una venta
    public function show($id)
    {
        $venta = Venta::with([
            'enVenta.carta',
            'enVenta.usuario',
            'enVenta.grado',
            'comprador',
            'valoraciones',
        ])->findOrFail($id);

        $tcgdex = new TCGdexService();
        $arr = $venta->toArray();

        if (isset($arr['en_venta']) && isset($arr['en_venta']['id_carta'])) {
            $arr['en_venta']['tcgdex'] = $tcgdex->getCard($arr['en_venta']['id_carta']);
        }

        return response()->json($arr);
    }
}
