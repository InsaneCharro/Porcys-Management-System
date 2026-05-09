<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

use App\Http\Controllers\GestacionController;

Route::get('/gestaciones', [GestacionController::class, 'index']);
Route::post('/gestaciones', [GestacionController::class, 'store']);
Route::put('/gestaciones/{id}/confirmar', [GestacionController::class, 'confirmar']);

Route::get('/dashboard', function () {
    return view('dashboard');
});

Route::get('/animales', function () {
    return view('animales');
});

use App\Http\Controllers\AnimalController;
use App\Http\Controllers\PartoController;

Route::get('/animales', [AnimalController::class, 'index']);
Route::post('/animales', [AnimalController::class, 'store']);
Route::get('/partos/{id}/camada', [PartoController::class, 'verCamada']);
Route::post('/partos', [PartoController::class, 'store']);

use App\Http\Controllers\LechonController;

Route::post('/lechones/pesos', [LechonController::class, 'guardarPesos']);
Route::post('/lechones/{id}/muerte', [LechonController::class, 'registrarMuerte']);
Route::post('/lechones/{id}/descartar', [LechonController::class, 'descartar']);
Route::post('/lechones/{id}/engorda', [LechonController::class, 'engorda']);
Route::post('/lechones/matar', [LechonController::class, 'matar']);

use App\Http\Controllers\EventoSanitarioLechonController;
Route::post('/sanidad/lechon', [EventoSanitarioLechonController::class, 'store']);