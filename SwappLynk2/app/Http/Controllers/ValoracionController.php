<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Valoracion;
use Illuminate\Support\Facades\Auth;

class ValoracionController extends Controller
{
    // Listar valoraciones recibidas por el usuario
    public function index()
    {
        $usuarioId = Auth::id();
        $valoraciones = Valoracion::where('id_valorado', $usuarioId)->with('valorador', 'venta')->get();
        return response()->json($valoraciones);
    }

    // Crear una nueva valoración para una venta
    public function store(Request $request)
    {
        $usuarioId = Auth::id();
        $request->validate([
            'id_valorado' => 'required|exists:users,id',
            'id_venta' => 'required|exists:ventas,id',
            'valor' => 'required|integer|min:1|max:10',
            'descripcion' => 'nullable|string'
        ]);
        $exists = Valoracion::where([
            'id_valorador' => $usuarioId,
            'id_valorado' => $request->id_valorado,
            'id_venta' => $request->id_venta
        ])->exists();
        if ($exists) {
            return response()->json(['error' => 'Ya has valorado esta venta.'], 400);
        }
        $valoracion = Valoracion::create([
            'id_valorado'  => $request->id_valorado,
            'id_valorador' => $usuarioId,
            'id_venta'     => $request->id_venta,
            'valor'        => $request->valor,
            'descripcion'  => $request->descripcion
        ]);
        return response()->json($valoracion, 201);
    }

    // Mostrar los detalles de una valoración concreta
    public function show($id)
    {
        $valoracion = Valoracion::with('valorador', 'venta')->findOrFail($id);
        return response()->json($valoracion);
    }
}
