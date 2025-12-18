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
    public function index()
    {
        // Usuario autenticado (si no hay login, será null)
        $usuarioId = Auth::id();

        // Solo devolvemos publicaciones activas (marketplace público)
        $query = EnVenta::where('estado', 'activa');

        // Importante: si hay usuario logueado, excluimos sus propias publicaciones del marketplace
        if ($usuarioId) {
            $query->where('id_usuario', '!=', $usuarioId);
        }

        // Cargamos relaciones para tener info de usuario/grado/carta (FKs)
        $enVenta = $query
            ->with(['carta', 'usuario', 'grado'])
            ->get();

        // Servicio para enriquecer con datos externos (nombre, imagen, etc.)
        $tcgdex = new TCGdexService();

        // Convertimos a array y añadimos "tcgdex" por cada publicación
        $enVenta = $enVenta->map(function ($item) use ($tcgdex) {
            $arr = $item->toArray();
            $arr['tcgdex'] = $tcgdex->getCard($arr['id_carta']);
            return $arr;
        });

        return response()->json($enVenta);
    }

    public function mySales()
    {
        // Devuelve SOLO publicaciones activas del usuario autenticado
        $usuarioId = Auth::id();

        $enVenta = EnVenta::where('id_usuario', $usuarioId)
            ->where('estado', 'activa')
            ->with(['carta', 'grado'])
            ->get();

        $tcgdex = new TCGdexService();

        // Enriquecemos con datos de la carta
        $enVenta = $enVenta->map(function ($item) use ($tcgdex) {
            $arr = $item->toArray();
            $arr['tcgdex'] = $tcgdex->getCard($arr['id_carta']);
            return $arr;
        });

        return response()->json($enVenta);
    }

    public function store(Request $request)
    {
        // Publicar carta desde la colección del usuario (crea una nueva entrada en en_venta)
        $usuarioId = Auth::id();

        // Validación manual con Validator para devolver errors en formato consistente
        $validator = Validator::make($request->all(), [
            'id_carta' => 'required|string',
            'id_grado' => 'required|integer',
            'precio'   => 'required|numeric|min:0.01',
            'notas'    => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Comprobamos que el usuario realmente tiene esa carta/grado en su colección
        $coleccion = Coleccion::where([
            'id_usuario' => $usuarioId,
            'id_carta'   => $request->id_carta,
            'id_grado'   => $request->id_grado,
        ])->first();

        // Si no existe o no tiene cantidad suficiente, no se puede publicar
        if (!$coleccion || $coleccion->cantidad < 1) {
            return response()->json(['error' => 'No tienes suficientes cartas para vender.'], 400);
        }

        // Creamos la publicación como "activa"
        $publicacion = EnVenta::create([
            'id_usuario'        => $usuarioId,
            'id_carta'          => $request->id_carta,
            'id_grado'          => $request->id_grado,
            'precio'            => $request->precio,
            'fecha_publicacion' => now(),
            'estado'            => 'activa',
            'notas'             => $request->notas,
        ]);

        // ==========================================================
        //  ALERTA WISHLIST: avisamos por email si cumple el precio
        //  (se manda en cola para no bloquear la request)
        // ==========================================================
        try {
            $precioPublicacion = (float) $publicacion->precio;
            $idCarta = (string) $publicacion->id_carta;

            // Pedimos la info de la carta una sola vez para usar el nombre en el email
            $tcgdex = new TCGdexService();
            $tcgCard = $tcgdex->getCard($idCarta);
            $cardName = is_array($tcgCard) ? ($tcgCard['name'] ?? $idCarta) : $idCarta;

            // Cargamos vendedor para mostrarlo en el email
            $publicacion->load('usuario');
            $sellerName = $publicacion->usuario?->name ?? ('Usuario #' . (string) $publicacion->id_usuario);

            // URL del frontend al detalle del marketplace (la usa el usuario al recibir el email)
            $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
            $url = $frontend . '/marketplace/' . $publicacion->id;

            // Seleccionamos wishlist con:
            // - misma carta
            // - precio_aviso configurado
            // - precio_aviso >= precio de la publicación
            $q = Wishlist::where('id_carta', $idCarta)
                ->whereNotNull('precio_aviso')
                ->where('precio_aviso', '>=', $precioPublicacion)
                ->with('usuario');

            // Evitamos notificar a cuentas canceladas (si existe ese campo en users)
            $q->whereHas('usuario', function ($u) {
                $u->where('cancelada', false);
            });

            $matches = $q->get();

            // Encolamos un email por cada usuario que tenga match
            foreach ($matches as $wish) {
                $user = $wish->usuario;
                if (!$user || empty($user->email)) {
                    continue;
                }

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
            // Si falla el email, no cancelamos la publicación: solo lo registramos en logs
            Log::error('Error enviando alertas de wishlist: ' . $e->getMessage(), [
                'en_venta_id' => $publicacion->id ?? null,
            ]);
        }

        // Respuesta estándar tras crear la publicación
        $tcgdex = new TCGdexService();

        return response()->json([
            'en_venta' => $publicacion,
            'tcgdex'   => $tcgdex->getCard($request->id_carta),
        ], 201);
    }

    public function show($id)
    {
        // Detalle de una publicación: incluye usuario y grado
        $publicacion = EnVenta::with(['usuario', 'grado'])->findOrFail($id);

        $tcgdex = new TCGdexService();

        return response()->json([
            'en_venta' => $publicacion,
            'tcgdex'   => $tcgdex->getCard($publicacion->id_carta),
        ]);
    }

    public function update(Request $request, $id)
    {
        // Solo el dueño de la publicación puede editarla
        $usuarioId   = Auth::id();

        $publicacion = EnVenta::where('id', $id)
            ->where('id_usuario', $usuarioId)
            ->first();

        if (!$publicacion) {
            return response()->json(['error' => 'No tienes permiso.'], 403);
        }

        // Permitimos actualizar precio/estado/notas
        $data = $request->validate([
            'precio' => 'sometimes|numeric|min:0.01',
            'estado' => 'sometimes|in:activa,vendida,cancelada',
            'notas'  => 'sometimes|nullable|string',
        ]);

        // Aplicamos cambios solo si vienen en la request
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

    public function destroy($id)
    {
        // Cancelar una publicación y devolver la carta a la colección
        $usuarioId   = Auth::id();

        $publicacion = EnVenta::where('id', $id)
            ->where('id_usuario', $usuarioId)
            ->first();

        if (!$publicacion) {
            return response()->json(['error' => 'No tienes permiso.'], 403);
        }

        // Solo se pueden cancelar publicaciones activas (si está vendida no tiene sentido)
        if ($publicacion->estado !== 'activa') {
            return response()->json([
                'error' => 'Solo se pueden cancelar publicaciones activas.',
            ], 400);
        }

        // 1) Devolvemos UNA copia a la colección del usuario (misma carta + mismo grado)
        $coleccionQuery = Coleccion::where('id_usuario', $usuarioId)
            ->where('id_carta', $publicacion->id_carta)
            ->where('id_grado', $publicacion->id_grado);

        $entrada = $coleccionQuery->first();

        if ($entrada) {
            // Si ya existe, incrementamos cantidad
            $coleccionQuery->update([
                'cantidad' => $entrada->cantidad + 1,
            ]);
        } else {
            // Si no existe, creamos la fila nueva
            Coleccion::create([
                'id_usuario'        => $usuarioId,
                'id_carta'          => $publicacion->id_carta,
                'id_grado'          => $publicacion->id_grado,
                'cantidad'          => 1,
                'notas'             => null,
                'fecha_adquisicion' => now(),
            ]);
        }

        // 2) Marcamos publicación como cancelada (no la borramos para mantener histórico)
        $publicacion->estado = 'cancelada';
        $publicacion->save();

        return response()->json(['success' => true]);
    }
}
