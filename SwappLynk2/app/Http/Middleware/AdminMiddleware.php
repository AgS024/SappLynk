<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Maneja la petición.
     *
     * Solo permite el acceso si $request->user()->admin == true
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->admin) {
            return response()->json([
                'error' => 'Acceso denegado. No eres administrador.',
            ], 403);
        }

        return $next($request);
    }
}
