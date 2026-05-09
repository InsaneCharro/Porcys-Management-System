<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// Comando de prueba
Artisan::command('inspire', function () {
    $this->comment('✨ Keep going!');
});

// 🐷 Scheduler real
Schedule::call(function () {
    app(\App\Http\Controllers\GestacionController::class)
        ->procesarPartosAutomaticos();
})->everyMinute();