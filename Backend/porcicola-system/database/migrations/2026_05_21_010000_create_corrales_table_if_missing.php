<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Migración segura para corrales
|--------------------------------------------------------------------------
|
| Tu proyecto ya usa la tabla "corrales", pero no tienes una migración formal.
| Esta migración NO toca la tabla si ya existe. Solo la crea si falta.
| El método down() no elimina nada para evitar pérdida accidental de datos.
|
*/

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('corrales')) {
            Schema::create('corrales', function (Blueprint $table) {
                $table->id();
                $table->string('nombre');
                $table->unsignedInteger('capacidad')->default(0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        // Intencionalmente vacío para proteger datos existentes.
    }
};
