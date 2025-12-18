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
    public function index()
    {
        // ID del usuario autenticado (queremos su historial de compras)
        $usuarioId = Auth::id();

        // Cargamos compras del usuario y relaciones necesarias para el frontend:
        // - enVenta.* para poder mostrar vendedor, grado, etc.
        // - valoraciones y estado para mostrar información del proceso y si ya valoró
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

        // Servicio externo para enriquecer la carta (nombre, imagen, etc.)
        $tcgdex = new TCGdexService();

        // Convertimos a array y añadimos "tcgdex" dentro de en_venta por cada venta
        $compras = $compras->map(function ($venta) use ($tcgdex) {
            $arr = $venta->toArray();

            if (isset($arr['en_venta']) && isset($arr['en_venta']['id_carta'])) {
                $arr['en_venta']['tcgdex'] = $tcgdex->getCard($arr['en_venta']['id_carta']);
            }

            return $arr;
        });

        return response()->json($compras);
    }

    public function store(Request $request)
    {
        // Usuario autenticado (comprador)
        $usuarioId = Auth::id();

        // Solo necesitamos el id de la publicación a comprar
        $request->validate([
            'id_en_venta' => 'required|exists:en_venta,id',
        ]);

        // Buscamos la publicación y comprobamos que siga activa
        $enVenta = EnVenta::where('id', $request->id_en_venta)
            ->where('estado', 'activa')
            ->first();

        if (!$enVenta) {
            return response()->json([
                'error' => 'Publicación no encontrada o ya vendida.',
            ], 404);
        }

        // Regla: no permitimos que el usuario se compre a sí mismo
        if ((int) $enVenta->id_usuario === (int) $usuarioId) {
            return response()->json([
                'error' => 'No puedes comprarte a ti mismo.',
            ], 400);
        }

        // Creamos el registro de la venta con estado inicial = 1
        // (según tu sistema: 1 = esperando recibir)
        $venta = Venta::create([
            'id_en_venta'  => $enVenta->id,
            'id_comprador' => $usuarioId,
            'precio_total' => $enVenta->precio,
            'fecha_venta'  => now(),
            'id_estado'    => 1,
        ]);

        // Marcamos la publicación como vendida para que no se pueda comprar otra vez
        $enVenta->estado = 'vendida';
        $enVenta->save();

        // Avisamos al vendedor por email con los datos de la compra
        $this->notifySellerByEmail($enVenta, $venta);

        return response()->json($venta, 201);
    }

    public function show($id)
    {
        // Detalle de una venta concreta con todas las relaciones que usa el front
        $venta = Venta::with([
            'enVenta.carta',
            'enVenta.usuario',
            'enVenta.grado',
            'comprador',
            'valoraciones',
            'estado',
        ])->findOrFail($id);

        // Añadimos los datos externos de la carta (TCGdex)
        $tcgdex = new TCGdexService();
        $arr = $venta->toArray();

        if (isset($arr['en_venta']) && isset($arr['en_venta']['id_carta'])) {
            $arr['en_venta']['tcgdex'] = $tcgdex->getCard($arr['en_venta']['id_carta']);
        }

        return response()->json($arr);
    }

    private function notifySellerByEmail(EnVenta $enVenta, Venta $venta): void
    {
        // Este método se encarga de enviar un email al vendedor con info útil
        // (lo envolvemos en try/catch para no romper la compra si falla el correo)
        try {
            // Cargamos el vendedor asociado a la publicación
            $enVenta->load('usuario');
            $seller = $enVenta->usuario;

            // Si no hay vendedor o no tiene email, no podemos notificar
            if (!$seller || empty($seller->email)) {
                return;
            }

            // Si el vendedor está cancelado, evitamos enviarle correos
            if (property_exists($seller, 'cancelada') && $seller->cancelada) {
                return;
            }

            // Consultamos TCGdex para obtener el nombre real de la carta
            $tcgdex = new TCGdexService();
            $card = $tcgdex->getCard((string) $enVenta->id_carta);

            $cardName = (is_array($card) && !empty($card['name']))
                ? (string) $card['name']
                : (string) $enVenta->id_carta;

            // Texto compacto con datos de la venta para incluir en el email
            $purchaseInfo =
                'ID venta: ' . (string) $venta->id .
                ' | Publicación: ' . (string) $enVenta->id .
                ' | Precio: ' . (string) $venta->precio_total . ' €';

            // Enviamos el email con un Mailable
            Mail::to($seller->email)->send(
                new SellerPurchaseNotificationMail(
                    (string) ($seller->name ?? 'usuario'),
                    $cardName,
                    $purchaseInfo
                )
            );
        } catch (\Throwable $e) {
            // Si falla el envío, lo dejamos registrado para depurar
            Log::error('Error enviando correo al vendedor tras compra: ' . $e->getMessage(), [
                'en_venta_id' => $enVenta->id ?? null,
                'venta_id'    => $venta->id ?? null,
            ]);
        }
    }
}
