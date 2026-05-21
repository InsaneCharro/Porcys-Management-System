<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('consumo_alimentacion_detalles')) {
            Schema::create('consumo_alimentacion_detalles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('consumo_alimentacion_id')
                    ->constrained('consumos_alimentacion')
                    ->cascadeOnDelete();
                $table->foreignId('inventario_id')->constrained('inventarios')->restrictOnDelete();
                $table->decimal('cantidad_descontada', 12, 2);
                $table->decimal('costo_unitario_snapshot', 12, 2)->default(0);
                $table->decimal('subtotal', 12, 2)->default(0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('consumo_alimentacion_detalles');
    }
};
