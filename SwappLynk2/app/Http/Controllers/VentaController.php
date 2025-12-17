<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Venta;
use App\Models\EnVenta;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Services\TCGdexService;
use App\Mail\SellerPurchaseNotificationMail;

class VentaController extends Controller
{
    /**
     * Devuelve el historial de compras del usuario autenticado.
     * Para cada venta, adjunta la información de la carta desde la API de TCGdex.
     */
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

        $compras = $compras->map(function ($venta) use ($tcgdex) {
            $arr = $venta->toArray();

            if (isset($arr['en_venta']) && isset($arr['en_venta']['id_carta'])) {
                $arr['en_venta']['tcgdex'] = $tcgdex->getCard($arr['en_venta']['id_carta']);
            }

            return $arr;
        });

        return response()->json($compras);
    }

    /**
     * Registra una compra:
     * 1) Comprueba que la publicación existe y está activa.
     * 2) Crea el registro de la venta con estado inicial.
     * 3) Marca la publicación como vendida.
     * 4) Envía un email al vendedor indicando la dirección a la que debe enviarla.
     */
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

        if ((int) $enVenta->id_usuario === (int) $usuarioId) {
            return response()->json(['error' => 'No puedes comprarte a ti mismo.'], 400);
        }

        $venta = Venta::create([
            'id_en_venta'  => $enVenta->id,
            'id_comprador' => $usuarioId,
            'precio_total' => $enVenta->precio,
            'fecha_venta'  => now(),
            'id_estado'    => 1,
        ]);

        $enVenta->estado = 'vendida';
        $enVenta->save();

        $this->notifySellerByEmail($enVenta, $venta);

        return response()->json($venta, 201);
    }

    /**
     * Devuelve el detalle de una venta concreta, incluyendo la carta desde TCGdex.
     */
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

    /**
     * Envía al vendedor un correo indicando que su carta se ha comprado y debe enviarla
     * a la dirección fija que has indicado para la intermediación.
     */
    private function notifySellerByEmail(EnVenta $enVenta, Venta $venta): void
    {
        try {
            $enVenta->load('usuario');

            $seller = $enVenta->usuario;

            if (!$seller || empty($seller->email)) {
                return;
            }

            if (property_exists($seller, 'cancelada') && $seller->cancelada) {
                return;
            }

            $tcgdex = new TCGdexService();
            $card = $tcgdex->getCard((string) $enVenta->id_carta);

            $cardName = (is_array($card) && !empty($card['name']))
                ? (string) $card['name']
                : (string) $enVenta->id_carta;

            $purchaseInfo = 'ID venta: ' . (string) $venta->id .
                ' | Publicación: ' . (string) $enVenta->id .
                ' | Precio: ' . (string) $venta->precio_total . ' €';

            Mail::to($seller->email)->send(
                new SellerPurchaseNotificationMail(
                    (string) ($seller->name ?? 'usuario'),
                    $cardName,
                    $purchaseInfo
                )
            );
        } catch (\Throwable $e) {
            Log::error('Error enviando correo al vendedor tras compra: ' . $e->getMessage(), [
                'en_venta_id' => $enVenta->id ?? null,
                'venta_id' => $venta->id ?? null,
            ]);
        }
    }
}
