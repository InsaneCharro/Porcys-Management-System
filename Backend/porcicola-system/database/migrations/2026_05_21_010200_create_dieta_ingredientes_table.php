<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('dieta_ingredientes')) {
            Schema::create('dieta_ingredientes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('dieta_id')->constrained('dietas')->cascadeOnDelete();
                $table->foreignId('inventario_id')->constrained('inventarios')->restrictOnDelete();
                $table->decimal('porcentaje', 8, 2);
                $table->decimal('cantidad_por_kg', 12, 4)->nullable();
                $table->decimal('costo_unitario', 12, 2)->nullable();
                $table->timestamps();

                $table->unique(['dieta_id', 'inventario_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('dieta_ingredientes');
    }
};
