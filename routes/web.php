<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Api\AlquilerVolqueteController;
use App\Http\Controllers\Api\ConfiguracionController;
use App\Http\Controllers\DashboardStatsController;
use App\Http\Controllers\DashboardMunicipalesStatsController;
use App\Http\Controllers\Api\GalponStockController;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/dashboard', function () {
    return Inertia::render('Home');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});


require __DIR__.'/auth.php';

Route::middleware(['auth'])->prefix('api')->group(function () {
    Route::get('/volquetes', [AlquilerVolqueteController::class, 'index']);
    Route::get('/volquetes/{volquete}/movimientos', [AlquilerVolqueteController::class, 'movimientos']);
    Route::post('/volquetes/{volquete}/colocar', [AlquilerVolqueteController::class, 'colocar']);
    Route::post('/volquetes/{volquete}/retirar', [AlquilerVolqueteController::class, 'retirar']);
    Route::post('/volquetes/{volquete}/trasladar', [AlquilerVolqueteController::class, 'trasladar']);
    Route::patch('/volquetes/{volquete}/nota', [AlquilerVolqueteController::class, 'actualizarNota']);
    Route::post('/volquetes/{volquete}/reemplazar', [AlquilerVolqueteController::class, 'reemplazar']);
        Route::get('/galpon-stock', [GalponStockController::class, 'show']);

    Route::middleware('role:jefe')->group(function () {
        Route::post('/volquetes', [AlquilerVolqueteController::class, 'crearVolquete']);
        Route::delete('/volquetes/{volquete}', [AlquilerVolqueteController::class, 'destroy']);
        Route::get('/volquetes/{volquete}/stats', [AlquilerVolqueteController::class, 'stats']);
        Route::get('/volquetes/{volquete}/alquileres', [AlquilerVolqueteController::class, 'alquileres']);
        Route::get('/dashboard/stats', DashboardStatsController::class);
        Route::get('/dashboard/municipales/stats', DashboardMunicipalesStatsController::class);
        Route::put('/galpon-stock', [GalponStockController::class, 'update']);
        
        Route::get('/config/precio-volquete', [ConfiguracionController::class, 'getPrecioVolquete']);
        Route::put('/config/precio-volquete', [ConfiguracionController::class, 'updatePrecioVolquete']);
        });
});

Route::middleware(['auth', 'role:jefe'])->group(function () {
    Route::get('/stats', function () {
        return Inertia::render('Stats/Index');
    })->name('stats.index');

    Route::get('/stats/municipales', function () {
        return Inertia::render('Stats/Municipales');
    })->name('stats.municipales');
});