<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Obtenemos el usuario autenticado asociado a la request (por token/session)
        $user = $request->user();

        // 1) Si no hay usuario, significa que no está logueado -> 401 Unauthorized
        if (!$user) {
            return response()->json([
                'error' => 'No autenticado.',
            ], 401);
        }

        // 2) Si la cuenta está cancelada, bloqueamos acceso incluso aunque fuese admin -> 403 Forbidden
        if ($user->cancelada) {
            return response()->json([
                'error' => 'Cuenta cancelada.',
            ], 403);
        }

        // 3) Si no es admin, no puede acceder a rutas protegidas de administración -> 403 Forbidden
        if (!$user->admin) {
            return response()->json([
                'error' => 'Acceso denegado. No eres administrador.',
            ], 403);
        }

        // Si pasa todos los checks, dejamos continuar a la siguiente capa (controlador/ruta)
        return $next($request);
    }
}
