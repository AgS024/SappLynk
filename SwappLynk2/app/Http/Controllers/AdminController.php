<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Venta;
use App\Models\EnVenta;
use App\Models\Valoracion;
use App\Models\Coleccion;

class AdminController extends Controller
{
    /**
     * GET /admin/users
     * Lista todos los usuarios del sistema (para la tabla de AdminUsuarios.jsx)
     */
    public function indexUsers()
    {
        // Seleccionamos lo que realmente necesitamos
        $users = User::select(
                'id',
                'name',
                'email',
                'admin',
                'cancelada',
                'suma_val',
                'cantidad_val'
            )
            ->orderBy('id', 'asc')
            ->get();

        // Calculamos la valoración media /5 a partir de suma_val y cantidad_val (si existen)
        foreach ($users as $user) {
            $media10 = 0;
            if ($user->cantidad_val > 0 && $user->suma_val !== null) {
                $media10 = (float) $user->suma_val / (int) $user->cantidad_val;
            }
            // Escala 0–5
            $user->valoracion_media = $media10 > 0 ? round($media10 / 2, 2) : 0.0;
        }

        return response()->json($users);
    }

    /**
     * GET /admin/users/{id}
     * Devuelve el detalle de un usuario + sus compras y ventas,
     * pensado para AdminUsuarioDetalle.jsx
     */
    public function showUser($id)
    {
        $user = User::findOrFail($id);

        // Compras donde este usuario es comprador
        $compras = Venta::where('id_comprador', $user->id)
            ->orderBy('fecha_venta', 'desc')
            ->get();

        // Publicaciones en venta (histórico) donde este usuario es vendedor
        $ventas = EnVenta::where('id_usuario', $user->id)
            ->orderBy('fecha_publicacion', 'desc')
            ->get();

        // Valoraciones recibidas para calcular media
        $valoraciones = Valoracion::where('id_valorado', $user->id)->get();
        $suma = $valoraciones->sum('valor');
        $cantidad = $valoraciones->count();

        $media10 = $cantidad > 0 ? $suma / $cantidad : 0;
        $media5  = $media10 > 0 ? round($media10 / 2, 2) : 0.0;

        // Rellenamos campos agregados (por si quieres aprovecharlos en otro sitio)
        $user->suma_val         = $suma;
        $user->cantidad_val     = $cantidad;
        $user->valoracion_media = $media5;

        // Metemos relaciones “ad-hoc” para que el JSON salga tal cual espera el frontend
        $user->setRelation('compras', $compras);
        $user->setRelation('ventas', $ventas);

        return response()->json($user);
    }

    /**
     * POST /admin/users/{id}/cancelar
     * Marca una cuenta como cancelada (baneada).
     * También revoca sus tokens de Sanctum para que no pueda seguir usando la API.
     */
    public function cancelUser($id)
    {
        $user = User::findOrFail($id);

        // Opcional: evitar que un admin cancele a otro admin
        // if ($user->admin) {
        //     return response()->json(['message' => 'No se puede cancelar a otro administrador.'], 403);
        // }

        $user->cancelada = true;
        $user->save();

        // Revocar todos los tokens de acceso (Sanctum)
        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        return response()->json($user);
    }

    /**
     * POST /admin/users/{id}/reactivar
     * Reactiva una cuenta cancelada.
     */
    public function reactivateUser($id)
    {
        $user = User::findOrFail($id);

        $user->cancelada = false;
        $user->save();

        return response()->json($user);
    }

    /**
     * GET /admin/ventas
     * Listado global de ventas para AdminVentas.jsx
     */
    public function indexVentas()
    {
        // Cargamos comprador, publicación original (para vendedor) y estado
        $ventas = Venta::with([
                'comprador',        // Venta::comprador()
                'enVenta.usuario',  // Venta::enVenta() -> EnVenta::usuario()
                'estado',           // Venta::estado()
            ])
            ->orderBy('fecha_venta', 'desc')
            ->get();

        return response()->json($ventas);
    }

    /**
     * PUT /admin/ventas/{id}/estado
     * Cambio de estado PROGRESIVO:
     *
     *   1 -> 2 -> 3
     *   Desde cualquiera se puede ir a 4 (cancelada).
     *
     * Reglas extra:
     *   - Si una venta está en estado 4 ya no puede cambiar a otro.
     *   - Al pasar a 3 (ENVIADO) se mueve la carta de la colección del vendedor
     *     a la colección del comprador.
     *   - Al pasar de 3 -> 4 (CANCELADA) se revierte ese movimiento.
     *   - Siempre que sea 4, en_venta.estado pasa a 'activa'.
     */
    public function updateVentaEstado(Request $request, $id)
    {
        // Incluimos enVenta para tocar estado y colecciones
        $venta = Venta::with('enVenta')->findOrFail($id);

        $data = $request->validate([
            'id_estado' => 'required|integer|exists:estados,id',
        ]);

        $nuevoEstadoId    = (int) $data['id_estado'];
        $estadoAnteriorId = (int) ($venta->id_estado ?? 0);

        // Si ya está cancelada y se quiere cambiar a otro estado -> NO permitido
        if ($estadoAnteriorId === 4 && $nuevoEstadoId !== 4) {
            return response()->json([
                'message' => 'No se puede modificar el estado de una venta cancelada.',
            ], 400);
        }

        // Si el nuevo estado es el mismo que el actual, no hacemos nada "gordo"
        if ($estadoAnteriorId === $nuevoEstadoId) {
            $venta->load(['comprador', 'enVenta.usuario', 'estado']);
            return response()->json($venta);
        }

        // Comprobación de transición PROGRESIVA (salvo cancelada=4 que siempre se permite)
        $permitido = false;

        if ($nuevoEstadoId === 4) {
            // Siempre se puede ir a cancelada
            $permitido = true;
        } else {
            switch ($estadoAnteriorId) {
                case 0: // sin estado inicial
                    $permitido = in_array($nuevoEstadoId, [1], true);
                    break;
                case 1:
                    $permitido = in_array($nuevoEstadoId, [2], true);
                    break;
                case 2:
                    $permitido = in_array($nuevoEstadoId, [3], true);
                    break;
                case 3:
                    $permitido = ($nuevoEstadoId === 3);
                    break;
                case 4:
                    $permitido = ($nuevoEstadoId === 4);
                    break;
                default:
                    $permitido = false;
                    break;
            }
        }

        if (!$permitido) {
            return response()->json([
                'message' => 'Transición de estado no permitida. El cambio debe ser progresivo (1 → 2 → 3, o a cancelada).',
            ], 400);
        }

        $enVenta = $venta->enVenta; // puede ser null si se ha tocado a mano en BD

        // ============================
        //  LÓGICA DE COLECCIONES
        // ============================

        // 1) Si pasamos por primera vez a ENVIADO (3) → mover carta vendedor -> comprador
        if ($estadoAnteriorId !== 3 && $nuevoEstadoId === 3 && $enVenta) {
            $sellerId = $enVenta->id_usuario;
            $buyerId  = $venta->id_comprador;
            $idCarta  = $enVenta->id_carta;
            $idGrado  = $enVenta->id_grado;

            if ($sellerId && $buyerId && $idCarta && $idGrado) {

                // --- VENDEDOR: decrementa solo esa carta ---
                $sellerWhere = [
                    'id_usuario' => $sellerId,
                    'id_carta'   => $idCarta,
                    'id_grado'   => $idGrado,
                ];

                $sellerCol = Coleccion::where($sellerWhere)->first();
                if ($sellerCol) {
                    Coleccion::where($sellerWhere)->decrement('cantidad');
                    $sellerCol = Coleccion::where($sellerWhere)->first();
                    if ($sellerCol && $sellerCol->cantidad <= 0) {
                        $sellerCol->delete();
                    }
                }

                // --- COMPRADOR: incrementa solo esa carta ---
                $buyerWhere = [
                    'id_usuario' => $buyerId,
                    'id_carta'   => $idCarta,
                    'id_grado'   => $idGrado,
                ];

                $compradorCol = Coleccion::where($buyerWhere)->first();

                if ($compradorCol) {
                    Coleccion::where($buyerWhere)->increment('cantidad');
                    Coleccion::where($buyerWhere)->update([
                        'fecha_adquisicion' => now(),
                    ]);
                } else {
                    Coleccion::create([
                        'id_usuario'        => $buyerId,
                        'id_carta'          => $idCarta,
                        'id_grado'          => $idGrado,
                        'cantidad'          => 1,
                        'fecha_adquisicion' => now(),
                    ]);
                }
            }
        }

        // 2) Guardamos el nuevo estado
        $venta->id_estado = $nuevoEstadoId;
        $venta->save();

        // 3) Si pasamos a CANCELADA (4)
        if ($nuevoEstadoId === 4 && $enVenta) {
            // Publicación vuelve a estar activa
            $enVenta->estado = 'activa';
            $enVenta->save();

            // Si veníamos de ENVIADO (3), revertimos el movimiento de colecciones
            if ($estadoAnteriorId === 3) {
                $sellerId = $enVenta->id_usuario;
                $buyerId  = $venta->id_comprador;
                $idCarta  = $enVenta->id_carta;
                $idGrado  = $enVenta->id_grado;

                if ($sellerId && $buyerId && $idCarta && $idGrado) {

                    // --- COMPRADOR: quitar solo esa carta ---
                    $buyerWhere = [
                        'id_usuario' => $buyerId,
                        'id_carta'   => $idCarta,
                        'id_grado'   => $idGrado,
                    ];

                    $compradorCol = Coleccion::where($buyerWhere)->first();
                    if ($compradorCol) {
                        Coleccion::where($buyerWhere)->decrement('cantidad');
                        $compradorCol = Coleccion::where($buyerWhere)->first();
                        if ($compradorCol && $compradorCol->cantidad <= 0) {
                            $compradorCol->delete();
                        }
                    }

                    // --- VENDEDOR: devolver solo esa carta ---
                    $sellerWhere = [
                        'id_usuario' => $sellerId,
                        'id_carta'   => $idCarta,
                        'id_grado'   => $idGrado,
                    ];

                    $sellerCol = Coleccion::where($sellerWhere)->first();
                    if ($sellerCol) {
                        Coleccion::where($sellerWhere)->increment('cantidad');
                        Coleccion::where($sellerWhere)->update([
                            'fecha_adquisicion' => now(),
                        ]);
                    } else {
                        Coleccion::create([
                            'id_usuario'        => $sellerId,
                            'id_carta'          => $idCarta,
                            'id_grado'          => $idGrado,
                            'cantidad'          => 1,
                            'fecha_adquisicion' => now(),
                        ]);
                    }
                }
            }
        }

        // Recargamos relaciones para que el front tenga todo fresco
        $venta->load(['comprador', 'enVenta.usuario', 'estado']);

        return response()->json($venta);
    }
}
