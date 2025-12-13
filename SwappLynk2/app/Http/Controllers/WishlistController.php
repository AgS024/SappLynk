<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Wishlist;
use App\Services\TCGdexService;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller
{
    /**
     * Listar la wishlist del usuario
     */
    public function index()
    {
        $usuarioId = Auth::id();

        $wishlist = Wishlist::where('id_usuario', $usuarioId)->get();

        $tcgdex = new TCGdexService();

        $wishlist = $wishlist->map(function ($item) use ($tcgdex) {
            $arr = $item->toArray();
            $arr['tcgdex'] = $tcgdex->getCard($arr['id_carta']);
            return $arr;
        });

        return response()->json($wishlist);
    }

    /**
     * Añadir o actualizar carta en wishlist
     * ⚠️ SIN usar save() (clave compuesta)
     */
    public function store(Request $request)
    {
        $usuarioId = Auth::id();

        $validated = $request->validate([
            'id_carta'     => 'required|string',
            'precio_aviso' => 'nullable|numeric|min:0.01',
        ]);

        $idCarta     = $validated['id_carta'];
        $precioAviso = $validated['precio_aviso'] ?? null;

        // ¿Existe ya?
        $existe = Wishlist::where('id_usuario', $usuarioId)
            ->where('id_carta', $idCarta)
            ->exists();

        if ($existe) {
            // ✅ UPDATE CON WHERE EXPLÍCITO (NO TOCA OTRAS FILAS)
            Wishlist::where('id_usuario', $usuarioId)
                ->where('id_carta', $idCarta)
                ->update([
                    'precio_aviso' => $precioAviso,
                ]);
        } else {
            // ✅ INSERT
            Wishlist::create([
                'id_usuario'   => $usuarioId,
                'id_carta'     => $idCarta,
                'precio_aviso' => $precioAviso,
            ]);
        }

        $item = Wishlist::where('id_usuario', $usuarioId)
            ->where('id_carta', $idCarta)
            ->first();

        $tcgdex = new TCGdexService();

        return response()->json([
            'wishlist' => $item,
            'tcgdex'   => $tcgdex->getCard($idCarta),
        ], 201);
    }

    /**
     * Eliminar carta de wishlist
     */
    public function destroy($id_carta)
    {
        $usuarioId = Auth::id();

        Wishlist::where('id_usuario', $usuarioId)
            ->where('id_carta', $id_carta)
            ->delete();

        return response()->json(['success' => true]);
    }
}
