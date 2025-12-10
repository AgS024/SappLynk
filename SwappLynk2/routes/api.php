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
*/

Route::middleware('auth:sanctum')->group(function () {

    /* ============================
     *  AUTENTICACIÓN
     * ============================ */
    Route::get('/user', [AuthController::class, 'me']);
    Route::put('/user', [AuthController::class, 'updateProfile']);
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
    Route::get('/coleccion', [ColeccionController::class, 'index']);
    Route::post('/coleccion', [ColeccionController::class, 'store']);

    Route::delete('/coleccion/{id}', [ColeccionController::class, 'destroy'])
        ->where('id', '[0-9]+');

    Route::put('/coleccion/{id}', [ColeccionController::class, 'update'])
        ->where('id', '[0-9]+');

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
     *  EN VENTA
     * ============================ */
    Route::get('/enventa', [EnVentaController::class, 'index']);
    Route::get('/enventa/mias', [EnVentaController::class, 'mySales']);
    Route::get('/enventa/{id}', [EnVentaController::class, 'show'])
        ->where('id', '[0-9]+');
    Route::post('/enventa', [EnVentaController::class, 'store']);
    Route::put('/enventa/{id}', [EnVentaController::class, 'update'])
        ->where('id', '[0-9]+');
    Route::delete('/enventa/{id}', [EnVentaController::class, 'destroy'])
        ->where('id', '[0-9]+');

    /* ============================
     *  COMPRAS / VENTAS (user normal)
     * ============================ */
    Route::get('/ventas', [VentaController::class, 'index']);
    Route::post('/ventas', [VentaController::class, 'store']);

    /* ============================
     *  VALORACIONES
     * ============================ */
    Route::get('/valoraciones', [ValoracionController::class, 'index']);
    Route::post('/valoraciones', [ValoracionController::class, 'store']);

    /* ============================
     *  RUTAS ADMIN
     * ============================ */
    Route::middleware('admin')->prefix('admin')->group(function () {

        // Resumen para el dashboard
        Route::get('/resumen', [AdminController::class, 'summary']);

        // Usuarios
        Route::get('/users', [AdminController::class, 'indexUsers']);
        Route::get('/users/{id}', [AdminController::class, 'showUser'])
            ->where('id', '[0-9]+');
        Route::post('/users/{id}/cancelar', [AdminController::class, 'cancelUser'])
            ->where('id', '[0-9]+');
        Route::post('/users/{id}/reactivar', [AdminController::class, 'reactivateUser'])
            ->where('id', '[0-9]+');

        // Ventas globales
        Route::get('/ventas', [AdminController::class, 'indexVentas']);

        // Cambiar estado de una venta (progresivo + movimiento de cartas)
        Route::put('/ventas/{id}/estado', [AdminController::class, 'updateVentaEstado'])
            ->where('id', '[0-9]+');
    });
});

/* ============================
 *  RUTAS PÚBLICAS
 * ============================ */
Route::post('/signup', [AuthController::class, 'signup']);
Route::post('/login', [AuthController::class, 'login']);
