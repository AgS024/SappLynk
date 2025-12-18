<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartaController;
use App\Http\Controllers\ColeccionController;
use App\Http\Controllers\EnVentaController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\ValoracionController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Definición de todas las rutas de la API REST del sistema.
| Se separan en:
|  - Rutas autenticadas (requieren token Sanctum)
|  - Rutas públicas (login / signup)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /* ==================================================
     *  AUTENTICACIÓN (usuario logueado)
     * ================================================== */

    // Devuelve los datos del usuario autenticado
    Route::get('/user', [AuthController::class, 'me']);

    // Actualiza el perfil del usuario autenticado
    Route::put('/user', [AuthController::class, 'updateProfile']);

    // Cierra sesión eliminando el token actual
    Route::post('/logout', [AuthController::class, 'logout']);

    /* ==================================================
     *  CARTAS (TCGDEX)
     * ================================================== */

    // Búsqueda avanzada de cartas (nombre, tipo, set, rareza, etc.)
    Route::get('/cartas/search/advanced', [CartaController::class, 'advancedSearch']);

    // Devuelve todos los sets disponibles
    Route::get('/cartas/sets', [CartaController::class, 'getSets']);

    // Devuelve el detalle de una carta concreta por ID
    Route::get('/cartas/{id}', [CartaController::class, 'getCarta']);

    // (Si existe) devuelve una carta aleatoria
    Route::get('/random', [CartaController::class, 'random']);

    /* ==================================================
     *  COLECCIÓN DEL USUARIO
     * ================================================== */

    // Devuelve la colección completa del usuario autenticado
    Route::get('/coleccion', [ColeccionController::class, 'index']);

    // Añade una carta a la colección del usuario
    Route::post('/coleccion', [ColeccionController::class, 'store']);

    // (Método legado) elimina una entrada por ID numérico interno
    Route::delete('/coleccion/{id}', [ColeccionController::class, 'destroy'])
        ->where('id', '[0-9]+');

    // (Método legado) actualiza una entrada por ID numérico interno
    Route::put('/coleccion/{id}', [ColeccionController::class, 'update'])
        ->where('id', '[0-9]+');

    // Devuelve la entrada de colección de una carta concreta (id_carta)
    Route::get('/coleccion/carta/{id_carta}', [ColeccionController::class, 'showByCard']);

    // Actualiza la entrada de colección de una carta concreta
    Route::put('/coleccion/carta/{id_carta}', [ColeccionController::class, 'updateByCard']);

    // Elimina todas las entradas de una carta para el usuario
    Route::delete('/coleccion/carta/{id_carta}', [ColeccionController::class, 'destroyByCard']);

    // Elimina una entrada concreta por carta + grado
    Route::delete(
        '/coleccion/carta/{id_carta}/grado/{id_grado}',
        [ColeccionController::class, 'destroyByCardAndGrade']
    );

    /* ==================================================
     *  WISHLIST
     * ================================================== */

    // Devuelve la wishlist del usuario autenticado
    Route::get('/wishlist', [WishlistController::class, 'index']);

    // Añade o actualiza una carta en la wishlist
    Route::post('/wishlist', [WishlistController::class, 'store']);

    // Elimina una carta de la wishlist del usuario
    Route::delete('/wishlist/{id}', [WishlistController::class, 'destroy']);

    /* ==================================================
     *  EN VENTA / MARKETPLACE
     * ================================================== */

    // Lista todas las cartas en venta activas (excluyendo las del propio usuario)
    Route::get('/enventa', [EnVentaController::class, 'index']);

    // Lista solo las cartas en venta activas del usuario autenticado
    Route::get('/enventa/mias', [EnVentaController::class, 'mySales']);

    // Devuelve el detalle de una publicación concreta
    Route::get('/enventa/{id}', [EnVentaController::class, 'show'])
        ->where('id', '[0-9]+');

    // Publica una carta desde la colección del usuario
    Route::post('/enventa', [EnVentaController::class, 'store']);

    // Actualiza precio, estado o notas de una publicación del usuario
    Route::put('/enventa/{id}', [EnVentaController::class, 'update'])
        ->where('id', '[0-9]+');

    // Cancela una publicación activa y devuelve la carta a la colección
    Route::delete('/enventa/{id}', [EnVentaController::class, 'destroy'])
        ->where('id', '[0-9]+');

    /* ==================================================
     *  COMPRAS / VENTAS (USUARIO NORMAL)
     * ================================================== */

    // Devuelve el historial de compras del usuario autenticado
    Route::get('/ventas', [VentaController::class, 'index']);

    // Realiza la compra de una publicación activa
    Route::post('/ventas', [VentaController::class, 'store']);

    /* ==================================================
     *  VALORACIONES
     * ================================================== */

    // Lista las valoraciones recibidas por el usuario autenticado
    Route::get('/valoraciones', [ValoracionController::class, 'index']);

    // Crea una nueva valoración asociada a una venta
    Route::post('/valoraciones', [ValoracionController::class, 'store']);

    /* ==================================================
     *  RUTAS DE ADMINISTRACIÓN
     * ================================================== */
    Route::middleware('admin')->prefix('admin')->group(function () {

        // Devuelve datos agregados para el dashboard de administración
        Route::get('/resumen', [AdminController::class, 'summary']);

        // Lista todos los usuarios del sistema
        Route::get('/users', [AdminController::class, 'indexUsers']);

        // Devuelve el detalle de un usuario concreto
        Route::get('/users/{id}', [AdminController::class, 'showUser'])
            ->where('id', '[0-9]+');

        // Marca una cuenta de usuario como cancelada (ban)
        Route::post('/users/{id}/cancelar', [AdminController::class, 'cancelUser'])
            ->where('id', '[0-9]+');

        // Reactiva una cuenta previamente cancelada
        Route::post('/users/{id}/reactivar', [AdminController::class, 'reactivateUser'])
            ->where('id', '[0-9]+');

        // Listado global de todas las ventas del sistema
        Route::get('/ventas', [AdminController::class, 'indexVentas']);

        // Cambia el estado de una venta (transiciones progresivas + lógica de colecciones)
        Route::put('/ventas/{id}/estado', [AdminController::class, 'updateVentaEstado'])
            ->where('id', '[0-9]+');
    });
});

/* ==================================================
 *  RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
 * ================================================== */

// Registro de nuevos usuarios
Route::post('/signup', [AuthController::class, 'signup']);

// Inicio de sesión (devuelve token Sanctum)
Route::post('/login', [AuthController::class, 'login']);
