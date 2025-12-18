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
    public function summary()
    {
        // Contadores globales para el dashboard
        $totalUsuarios     = User::count();
        $totalVentas       = Venta::count();
        $totalValoraciones = Valoracion::count();

        // Cuenta publicaciones activas SOLO de usuarios que NO estén cancelados
        $totalEnVentaNoCanceladas = EnVenta::where('estado', 'activa')
            ->whereHas('usuario', function ($q) {
                $q->where('cancelada', false);
            })
            ->count();

        // Devolvemos el resumen en JSON para el panel de administración
        return response()->json([
            'total_usuarios'               => $totalUsuarios,
            'total_ventas'                 => $totalVentas,
            'total_valoraciones'           => $totalValoraciones,
            'total_en_venta_no_canceladas' => $totalEnVentaNoCanceladas,
        ]);
    }

    public function indexUsers()
    {
        // Traemos solo los campos que necesita el front para la tabla de usuarios
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

        // Calculamos la valoración media en escala 0–5 a partir de los agregados (si existen)
        foreach ($users as $user) {
            $media10 = 0;

            if ($user->cantidad_val > 0 && $user->suma_val !== null) {
                $media10 = (float) $user->suma_val / (int) $user->cantidad_val;
            }

            // En BD parece estar en escala 0–10, así que lo pasamos a 0–5
            $user->valoracion_media = $media10 > 0 ? round($media10 / 2, 2) : 0.0;
        }

        // Respuesta directa en JSON para consumir desde React
        return response()->json($users);
    }

    public function showUser($id)
    {
        // Cargamos el usuario o devolvemos 404 si no existe
        $user = User::findOrFail($id);

        // Compras: ventas donde el usuario actúa como comprador
        $compras = Venta::where('id_comprador', $user->id)
            ->orderBy('fecha_venta', 'desc')
            ->get();

        // Ventas/publicaciones: histórico de publicaciones del usuario como vendedor
        $ventas = EnVenta::where('id_usuario', $user->id)
            ->orderBy('fecha_publicacion', 'desc')
            ->get();

        // Valoraciones recibidas: calculamos media usando las valoraciones reales (por si los agregados no están actualizados)
        $valoraciones = Valoracion::where('id_valorado', $user->id)->get();
        $suma     = $valoraciones->sum('valor');
        $cantidad = $valoraciones->count();

        $media10 = $cantidad > 0 ? $suma / $cantidad : 0;
        $media5  = $media10 > 0 ? round($media10 / 2, 2) : 0.0;

        // Rellenamos campos agregados para devolverlos listos al front (sin depender de jobs o triggers)
        $user->suma_val         = $suma;
        $user->cantidad_val     = $cantidad;
        $user->valoracion_media = $media5;

        // “Adjuntamos” compras y ventas en el JSON de salida como relaciones calculadas al vuelo
        $user->setRelation('compras', $compras);
        $user->setRelation('ventas', $ventas);

        return response()->json($user);
    }

    public function cancelUser($id)
    {
        // Localizamos al usuario a cancelar
        $user = User::findOrFail($id);

        // Marcamos la cuenta como cancelada (baneada)
        $user->cancelada = true;
        $user->save();

        // Si usa Sanctum, eliminamos tokens para forzar logout en todos los dispositivos
        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        return response()->json($user);
    }

    public function reactivateUser($id)
    {
        // Reactivamos la cuenta quitando el flag de cancelación
        $user = User::findOrFail($id);

        $user->cancelada = false;
        $user->save();

        return response()->json($user);
    }

    public function indexVentas()
    {
        // Listado global con relaciones necesarias:
        // - comprador (para mostrar quién compra)
        // - enVenta.usuario (para obtener vendedor desde la publicación)
        // - estado (para mostrar el estado actual)
        $ventas = Venta::with([
                'comprador',
                'enVenta.usuario',
                'estado',
            ])
            ->orderBy('fecha_venta', 'desc')
            ->get();

        return response()->json($ventas);
    }

    public function updateVentaEstado(Request $request, $id)
    {
        // Cargamos la venta y su publicación asociada (EnVenta) para poder tocar estado y colecciones
        $venta = Venta::with('enVenta')->findOrFail($id);

        // Validación básica del nuevo estado
        $data = $request->validate([
            'id_estado' => 'required|integer|exists:estados,id',
        ]);

        $nuevoEstadoId    = (int) $data['id_estado'];
        $estadoAnteriorId = (int) ($venta->id_estado ?? 0);

        // Regla: si ya está cancelada (4) no permitimos volver a otro estado
        if ($estadoAnteriorId === 4 && $nuevoEstadoId !== 4) {
            return response()->json([
                'message' => 'No se puede modificar el estado de una venta cancelada.',
            ], 400);
        }

        // Si no hay cambio real, devolvemos la venta cargada sin aplicar lógica extra
        if ($estadoAnteriorId === $nuevoEstadoId) {
            $venta->load(['comprador', 'enVenta.usuario', 'estado']);
            return response()->json($venta);
        }

        // Comprobamos si la transición de estado es válida:
        // - Progresiva 1 -> 2 -> 3
        // - A 4 (cancelada) se puede ir desde cualquiera
        $permitido = false;

        if ($nuevoEstadoId === 4) {
            $permitido = true;
        } else {
            switch ($estadoAnteriorId) {
                case 0:
                    $permitido = in_array($nuevoEstadoId, [1], true);
                    break;
                case 1:
                    $permitido = in_array($nuevoEstadoId, [2], true);
                    break;
                case 2:
                    $permitido = in_array($nuevoEstadoId, [3], true);
                    break;
                case 3:
                    // Una vez enviado, no debería avanzar a otros estados (salvo cancelación, tratada arriba)
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

        // EnVenta puede ser null si alguien tocó cosas a mano en BD
        $enVenta = $venta->enVenta;

        // ============================================================
        //  LÓGICA DE COLECCIONES (movimiento de carta vendedor->comprador)
        // ============================================================

        // Si entramos en estado 3 (ENVIADO) por primera vez, movemos la carta:
        // - NO se resta al vendedor porque ya se decrementa al poner en venta
        // - se suma al comprador (colección)
        if ($estadoAnteriorId !== 3 && $nuevoEstadoId === 3 && $enVenta) {
            $sellerId = $enVenta->id_usuario;
            $buyerId  = $venta->id_comprador;
            $idCarta  = $enVenta->id_carta;
            $idGrado  = $enVenta->id_grado;

            if ($sellerId && $buyerId && $idCarta && $idGrado) {

                // COMPRADOR: incrementamos solo esa carta/grado (o creamos el registro si no existe)
                $buyerWhere = [
                    'id_usuario' => $buyerId,
                    'id_carta'   => $idCarta,
                    'id_grado'   => $idGrado,
                ];

                $compradorCol = Coleccion::where($buyerWhere)->first();

                if ($compradorCol) {
                    Coleccion::where($buyerWhere)->increment('cantidad');

                    // Actualizamos fecha de adquisición para reflejar la nueva compra
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

        // Guardamos el nuevo estado en la venta
        $venta->id_estado = $nuevoEstadoId;
        $venta->save();

        // ============================================================
        //  CANCELACIÓN (estado 4)
        // ============================================================

        if ($nuevoEstadoId === 4 && $enVenta) {
            // Al cancelar, la publicación vuelve a estar activa para poder venderse de nuevo
            $enVenta->estado = 'activa';
            $enVenta->save();

            // Si ya estaba en ENVIADO (3), entonces hay que revertir el movimiento:
            // - se quita al comprador
            // - se devuelve al vendedor
            if ($estadoAnteriorId === 3) {
                $sellerId = $enVenta->id_usuario;
                $buyerId  = $venta->id_comprador;
                $idCarta  = $enVenta->id_carta;
                $idGrado  = $enVenta->id_grado;

                if ($sellerId && $buyerId && $idCarta && $idGrado) {

                    // COMPRADOR: decrementamos esa carta/grado
                    $buyerWhere = [
                        'id_usuario' => $buyerId,
                        'id_carta'   => $idCarta,
                        'id_grado'   => $idGrado,
                    ];

                    $compradorCol = Coleccion::where($buyerWhere)->first();
                    if ($compradorCol) {
                        Coleccion::where($buyerWhere)->decrement('cantidad');

                        // Si se queda a 0 o menos, eliminamos el registro
                        $compradorCol = Coleccion::where($buyerWhere)->first();
                        if ($compradorCol && $compradorCol->cantidad <= 0) {
                            $compradorCol->delete();
                        }
                    }

                    // VENDEDOR: devolvemos esa carta/grado
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

        // Recargamos relaciones para devolver al front el objeto completo (sin tener que hacer otra petición)
        $venta->load(['comprador', 'enVenta.usuario', 'estado']);

        return response()->json($venta);
    }
}
