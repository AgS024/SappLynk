<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EnVenta;
use App\Models\Coleccion;
use App\Models\Wishlist;
use App\Services\TCGdexService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\WishlistPriceAlertMail;

class EnVentaController extends Controller
{
    /**
     * Lista todas las cartas en venta ACTIVAS (para el marketplace público)
     * ⚠️ IMPORTANTE: excluye SIEMPRE las cartas del usuario autenticado.
     */
    public function index()
    {
        $usuarioId = Auth::id();

        $query = EnVenta::where('estado', 'activa');

        // Si hay usuario autenticado, no devolvemos sus propias publicaciones
        if ($usuarioId) {
            $query->where('id_usuario', '!=', $usuarioId);
        }

        $enVenta = $query
            ->with(['carta', 'usuario', 'grado'])
            ->get();

        $tcgdex = new TCGdexService();

        // Añadir info de la carta a cada publicación
        $enVenta = $enVenta->map(function ($item) use ($tcgdex) {
            $arr = $item->toArray();
            $arr['tcgdex'] = $tcgdex->getCard($arr['id_carta']);
            return $arr;
        });

        return response()->json($enVenta);
    }

    /**
     * ✅ SOLO MIS cartas en venta activas
     */
    public function mySales()
    {
        $usuarioId = Auth::id();

        $enVenta = EnVenta::where('id_usuario', $usuarioId)
            ->where('estado', 'activa')
            ->with(['carta', 'grado'])
            ->get();

        $tcgdex = new TCGdexService();

        $enVenta = $enVenta->map(function ($item) use ($tcgdex) {
            $arr = $item->toArray();
            $arr['tcgdex'] = $tcgdex->getCard($arr['id_carta']);
            return $arr;
        });

        return response()->json($enVenta);
    }

    /**
     * Publicar una carta (desde colección a venta)
     */
    public function store(Request $request)
    {
        $usuarioId = Auth::id();

        $validator = Validator::make($request->all(), [
            'id_carta' => 'required|string',
            'id_grado' => 'required|integer',
            'precio'   => 'required|numeric|min:0.01',
            'notas'    => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verifica que el usuario tiene la carta en coleccion y suficiente cantidad
        $coleccion = Coleccion::where([
            'id_usuario' => $usuarioId,
            'id_carta'   => $request->id_carta,
            'id_grado'   => $request->id_grado,
        ])->first();

        if (!$coleccion || $coleccion->cantidad < 1) {
            return response()->json(['error' => 'No tienes suficientes cartas para vender.'], 400);
        }

        $publicacion = EnVenta::create([
            'id_usuario'        => $usuarioId,
            'id_carta'          => $request->id_carta,
            'id_grado'          => $request->id_grado,
            'precio'            => $request->precio,
            'fecha_publicacion' => now(),
            'estado'            => 'activa',
            'notas'             => $request->notas,
        ]);

        // ============================
        //  ✅ ALERTA WISHLIST (COLA)
        // ============================
        try {
            $precioPublicacion = (float) $publicacion->precio;
            $idCarta = (string) $publicacion->id_carta;

            // Traemos la info de la carta una sola vez (para el nombre en el email)
            $tcgdex = new TCGdexService();
            $tcgCard = $tcgdex->getCard($idCarta);
            $cardName = is_array($tcgCard) ? ($tcgCard['name'] ?? $idCarta) : $idCarta;

            // Vendedor (para mostrarlo en el email)
            $publicacion->load('usuario');
            $sellerName = $publicacion->usuario?->name ?? ('Usuario #' . (string) $publicacion->id_usuario);

            // URL frontend al detalle del marketplace (PUERTO 3000)
            $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
            $url = $frontend . '/marketplace/' . $publicacion->id;

            // Buscar entradas de wishlist que cumplan:
            // - misma carta
            // - precio_aviso no nulo
            // - precio_aviso >= precio de la publicación
            $q = Wishlist::where('id_carta', $idCarta)
                ->whereNotNull('precio_aviso')
                ->where('precio_aviso', '>=', $precioPublicacion)
                ->with('usuario');

            // Si tienes users.cancelada, evitamos avisar a cuentas canceladas
            // (si no existe esa columna, comenta este bloque)
            $q->whereHas('usuario', function ($u) {
                $u->where('cancelada', false);
            });

            $matches = $q->get();

            foreach ($matches as $wish) {
                $user = $wish->usuario;
                if (!$user || empty($user->email)) {
                    continue;
                }

                // ✅ Ahora el Mailable acepta 5 argumentos (incluye userName)
                Mail::to($user->email)->queue(
                    new WishlistPriceAlertMail(
                        $user->name ?? 'usuario',
                        (string) $cardName,
                        (float) $precioPublicacion,
                        (string) $sellerName,
                        (string) $url
                    )
                );
            }
        } catch (\Throwable $e) {
            // No rompemos la creación de la publicación si falla el email
            Log::error('Error enviando alertas de wishlist: ' . $e->getMessage(), [
                'en_venta_id' => $publicacion->id ?? null,
            ]);
        }

        // Respuesta normal
        $tcgdex = new TCGdexService();

        return response()->json([
            'en_venta' => $publicacion,
            'tcgdex'   => $tcgdex->getCard($request->id_carta),
        ], 201);
    }

    /**
     * Ver detalle de una carta publicada
     */
    public function show($id)
    {
        $publicacion = EnVenta::with(['usuario', 'grado'])->findOrFail($id);
        $tcgdex = new TCGdexService();

        return response()->json([
            'en_venta' => $publicacion,
            'tcgdex'   => $tcgdex->getCard($publicacion->id_carta),
        ]);
    }

    /**
     * Cambiar estado o precio de una publicación (solo del usuario autenticado)
     */
    public function update(Request $request, $id)
    {
        $usuarioId   = Auth::id();
        $publicacion = EnVenta::where('id', $id)
            ->where('id_usuario', $usuarioId)
            ->first();

        if (!$publicacion) {
            return response()->json(['error' => 'No tienes permiso.'], 403);
        }

        $data = $request->validate([
            'precio' => 'sometimes|numeric|min:0.01',
            'estado' => 'sometimes|in:activa,vendida,cancelada',
            'notas'  => 'sometimes|nullable|string',
        ]);

        if (array_key_exists('precio', $data)) {
            $publicacion->precio = $data['precio'];
        }
        if (array_key_exists('estado', $data)) {
            $publicacion->estado = $data['estado'];
        }
        if (array_key_exists('notas', $data)) {
            $publicacion->notas = $data['notas'];
        }

        $publicacion->save();

        $tcgdex = new TCGdexService();

        return response()->json([
            'en_venta' => $publicacion,
            'tcgdex'   => $tcgdex->getCard($publicacion->id_carta),
        ]);
    }

    /**
     * Eliminar publicación (cancelar) y devolver la carta a la colección
     */
    public function destroy($id)
    {
        $usuarioId   = Auth::id();
        $publicacion = EnVenta::where('id', $id)
            ->where('id_usuario', $usuarioId)
            ->first();

        if (!$publicacion) {
            return response()->json(['error' => 'No tienes permiso.'], 403);
        }

        if ($publicacion->estado !== 'activa') {
            return response()->json([
                'error' => 'Solo se pueden cancelar publicaciones activas.',
            ], 400);
        }

        // 1) Devolver UNA copia a la colección del usuario
        $coleccionQuery = Coleccion::where('id_usuario', $usuarioId)
            ->where('id_carta', $publicacion->id_carta)
            ->where('id_grado', $publicacion->id_grado);

        $entrada = $coleccionQuery->first();

        if ($entrada) {
            $coleccionQuery->update([
                'cantidad' => $entrada->cantidad + 1,
            ]);
        } else {
            Coleccion::create([
                'id_usuario'        => $usuarioId,
                'id_carta'          => $publicacion->id_carta,
                'id_grado'          => $publicacion->id_grado,
                'cantidad'          => 1,
                'notas'             => null,
                'fecha_adquisicion' => now(),
            ]);
        }

        // 2) Marcar la publicación como cancelada
        $publicacion->estado = 'cancelada';
        $publicacion->save();

        return response()->json(['success' => true]);
    }
}
