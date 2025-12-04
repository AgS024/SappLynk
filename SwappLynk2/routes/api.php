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

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /* ============================
     *  AUTENTICACIÓN
     * ============================ */
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    /* ============================
     *  CARTAS TCGDEX
     * ============================ */
    Route::get('/cartas/search/advanced', [CartaController::class, 'advancedSearch']);
    Route::get('/cartas/sets', [CartaController::class, 'getSets']);
    Route::get('/cartas/{id}', [CartaController::class, 'getCarta']);
    Route::get('/random', [CartaController::class, 'random']);

    /* ============================
     *  COLECCIÓN
     * ============================ */

    // Listado general de la colección del usuario
    Route::get('/coleccion', [ColeccionController::class, 'index']);

    // Añadir carta a colección
    Route::post('/coleccion', [ColeccionController::class, 'store']);

    // Eliminar entrada de colección por ID numérico (legacy, no se usa)
    Route::delete('/coleccion/{id}', [ColeccionController::class, 'destroy'])
        ->where('id', '[0-9]+');

    // Actualizar entrada de colección por ID numérico (legacy, no se usa)
    Route::put('/coleccion/{id}', [ColeccionController::class, 'update'])
        ->where('id', '[0-9]+');

    // Rutas por ID de carta (ej. bw8-3)
    Route::get('/coleccion/carta/{id_carta}', [ColeccionController::class, 'showByCard']);
    Route::put('/coleccion/carta/{id_carta}', [ColeccionController::class, 'updateByCard']);
    Route::delete('/coleccion/carta/{id_carta}', [ColeccionController::class, 'destroyByCard']);
    Route::delete(
        '/coleccion/carta/{id_carta}/grado/{id_grado}',
        [ColeccionController::class, 'destroyByCardAndGrade']
    );

    /* ============================
     *  WISHLIST
     * ============================ */
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{id}', [WishlistController::class, 'destroy']);

    /* ============================
     *  PONER CARTA EN VENTA
     * ============================ */

    // Todas las cartas en venta (para el marketplace público)
    Route::get('/enventa', [EnVentaController::class, 'index']);

    // ✅ SOLO MIS cartas en venta (usuario autenticado)
    Route::get('/enventa/mias', [EnVentaController::class, 'mySales']);

    // ✅ DETALLE de una publicación concreta (NECESARIO para /api/enventa/{id})
    Route::get('/enventa/{id}', [EnVentaController::class, 'show'])
        ->where('id', '[0-9]+');

    // Publicar una carta en venta
    Route::post('/enventa', [EnVentaController::class, 'store']);

    // Actualizar precio/estado de una publicación
    Route::put('/enventa/{id}', [EnVentaController::class, 'update'])
        ->where('id', '[0-9]+');

    // Eliminar / cancelar publicación (y devolver a colección)
    Route::delete('/enventa/{id}', [EnVentaController::class, 'destroy'])
        ->where('id', '[0-9]+');

    /* ============================
     *  COMPRAS / VENTAS (histórico de compras)
     * ============================ */
    Route::get('/ventas', [VentaController::class, 'index']);
    Route::post('/ventas', [VentaController::class, 'store']);

    /* ============================
     *  VALORACIONES
     * ============================ */
    Route::post('/valoraciones', [ValoracionController::class, 'store']);
});

/* ============================
 *  RUTAS PÚBLICAS (no auth)
 * ============================ */
Route::post('/signup', [AuthController::class, 'signup']);
Route::post('/login', [AuthController::class, 'login']);
