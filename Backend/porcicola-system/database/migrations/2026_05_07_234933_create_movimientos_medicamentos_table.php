<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimientos_medicamentos', function (Blueprint $table) {

            $table->id();

            // 💊 Medicamento
            $table->foreignId('medicamento_id')
                ->constrained()
                ->onDelete('cascade');

            // 📦 Tipo movimiento
            $table->enum('tipo', [
                'entrada',
                'salida',
                'ajuste'
            ]);

            // 🔢 Cantidad
            $table->integer('cantidad');

            // 📝 Motivo
            $table->string('motivo')->nullable();

            // 👤 Usuario (futuro)
            $table->string('usuario')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos_medicamentos');
    }
};