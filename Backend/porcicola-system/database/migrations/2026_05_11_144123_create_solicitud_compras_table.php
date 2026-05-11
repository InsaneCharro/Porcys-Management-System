<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes_compra', function (Blueprint $table) {
            $table->id();

            $table->string('folio')->unique();

            $table->enum('tipo', [
                'manual',
                'automatica',
                'prediccion'
            ])->default('manual');

            $table->enum('estado', [
                'pendiente',
                'aprobada',
                'rechazada',
                'convertida'
            ])->default('pendiente');

            $table->text('motivo')->nullable();
            $table->text('observaciones')->nullable();

            $table->foreignId('solicitado_por')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('fecha_solicitud')->useCurrent();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_compra');
    }
};