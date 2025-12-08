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
                'estado',
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
        //    Arranca siempre en estado "1 - esperando recibir"
        $venta = Venta::create([
            'id_en_venta'  => $enVenta->id,
            'id_comprador' => $usuarioId,
            'precio_total' => $enVenta->precio,
            'fecha_venta'  => now(),
            'id_estado'    => 1, // Esperando recibir
        ]);

        // 2º Marca la publicación como vendida (reservada)
        $enVenta->estado = 'vendida';
        $enVenta->save();

        // ⚠️ IMPORTANTE:
        // Ya NO tocamos aquí las colecciones.
        // El movimiento vendedor -> comprador se hará cuando el admin marque estado "Enviado" (3)
        // en AdminController::updateVentaEstado.

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
            'estado',
        ])->findOrFail($id);

        $tcgdex = new TCGdexService();
        $arr = $venta->toArray();

        if (isset($arr['en_venta']) && isset($arr['en_venta']['id_carta'])) {
            $arr['en_venta']['tcgdex'] = $tcgdex->getCard($arr['en_venta']['id_carta']);
        }

        return response()->json($arr);
    }
}
