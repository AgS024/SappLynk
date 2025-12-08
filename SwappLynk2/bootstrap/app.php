<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

        // ============================
        // 🔐 ALIAS DE MIDDLEWARE
        // ============================

        $middleware->alias([
            // Usamos directamente el middleware de Laravel para "auth"
            'auth'  => \Illuminate\Auth\Middleware\Authenticate::class,

            // Nuestro middleware de administrador
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);

        // Si en el futuro quieres un middleware "guest", puedes crearlo
        // y añadir aquí algo como:
        // 'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
