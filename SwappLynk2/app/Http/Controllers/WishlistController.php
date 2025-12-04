<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Wishlist;
use App\Services\TCGdexService;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller
{
    // Listar la wishlist del usuario
    public function index()
    {
        $usuarioId = Auth::id();
        $wishlist = Wishlist::where('id_usuario', $usuarioId)->get();
        $tcgdex = new TCGdexService();
        // Adjuntar info de cada carta
        $wishlist = $wishlist->map(function($item) use ($tcgdex) {
            $item = $item->toArray();
            $item['tcgdex'] = $tcgdex->getCard($item['id_carta']);
            return $item;
        });
        return response()->json($wishlist);
    }

    // Añadir carta a wishlist
    public function store(Request $request)
    {
        $usuarioId = Auth::id();
        $request->validate([
            'id_carta' => 'required|string',
            'precio_aviso' => 'nullable|numeric|min:0.1'
        ]);
        $item = Wishlist::updateOrCreate(
            [ 'id_usuario' => $usuarioId, 'id_carta' => $request->id_carta ],
            [ 'precio_aviso' => $request->precio_aviso ]
        );
        $tcgdex = new TCGdexService();
        return response()->json([
            'wishlist' => $item,
            'tcgdex' => $tcgdex->getCard($item->id_carta)
        ], 201);
    }

    // Eliminar carta de wishlist
    public function destroy($id_carta)
    {
        $usuarioId = Auth::id();
        Wishlist::where('id_usuario', $usuarioId)->where('id_carta', $id_carta)->delete();
        return response()->json(['success' => true]);
    }
}
