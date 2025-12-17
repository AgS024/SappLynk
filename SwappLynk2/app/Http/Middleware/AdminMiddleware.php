<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Permite continuar sólo si:
     * - hay usuario autenticado
     * - no está cancelado
     * - es admin
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'error' => 'No autenticado.',
            ], 401);
        }

        if ($user->cancelada) {
            return response()->json([
                'error' => 'Cuenta cancelada.',
            ], 403);
        }

        if (!$user->admin) {
            return response()->json([
                'error' => 'Acceso denegado. No eres administrador.',
            ], 403);
        }

        return $next($request);
    }
}
