<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Wishlist;
use App\Services\TCGdexService;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller
{
    public function index()
    {
        // ID del usuario autenticado (wishlist personal)
        $usuarioId = Auth::id();

        // Obtenemos todas las entradas de wishlist del usuario
        $wishlist = Wishlist::where('id_usuario', $usuarioId)->get();

        // Servicio para enriquecer cada item con la info real de la carta (nombre, imagen, etc.)
        $tcgdex = new TCGdexService();

        // Añadimos un campo "tcgdex" a cada elemento para que el frontend no tenga que hacer otra llamada
        $wishlist = $wishlist->map(function ($item) use ($tcgdex) {
            $arr = $item->toArray();
            $arr['tcgdex'] = $tcgdex->getCard($arr['id_carta']);
            return $arr;
        });

        return response()->json($wishlist);
    }

    public function store(Request $request)
    {
        // Usuario autenticado
        $usuarioId = Auth::id();

        // Validamos datos: id_carta obligatorio y precio_aviso opcional
        $validated = $request->validate([
            'id_carta'     => 'required|string',
            'precio_aviso' => 'nullable|numeric|min:0.01',
        ]);

        $idCarta     = $validated['id_carta'];
        $precioAviso = $validated['precio_aviso'] ?? null;

        // Comprobamos si ya existe esa carta en la wishlist del usuario (PK compuesta)
        $existe = Wishlist::where('id_usuario', $usuarioId)
            ->where('id_carta', $idCarta)
            ->exists();

        if ($existe) {
            // Si ya existe, actualizamos SOLO esa fila (con where explícito)
            // Importante: evitamos save() porque la tabla trabaja con clave compuesta
            Wishlist::where('id_usuario', $usuarioId)
                ->where('id_carta', $idCarta)
                ->update([
                    'precio_aviso' => $precioAviso,
                ]);
        } else {
            // Si no existe, insertamos una nueva fila
            Wishlist::create([
                'id_usuario'   => $usuarioId,
                'id_carta'     => $idCarta,
                'precio_aviso' => $precioAviso,
            ]);
        }

        // Recuperamos el item final para devolverlo ya actualizado/creado
        $item = Wishlist::where('id_usuario', $usuarioId)
            ->where('id_carta', $idCarta)
            ->first();

        // Enriquecemos con datos de TCGdex para mostrarlo en el frontend
        $tcgdex = new TCGdexService();

        return response()->json([
            'wishlist' => $item,
            'tcgdex'   => $tcgdex->getCard($idCarta),
        ], 201);
    }

    public function destroy($id_carta)
    {
        // Usuario autenticado
        $usuarioId = Auth::id();

        // Borramos SOLO esa carta de la wishlist del usuario
        Wishlist::where('id_usuario', $usuarioId)
            ->where('id_carta', $id_carta)
            ->delete();

        return response()->json(['success' => true]);
    }
}
