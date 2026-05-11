<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venta_animales', function (Blueprint $table) {
            $table->id();

            $table->foreignId('venta_id')
                ->constrained('ventas')
                ->onDelete('cascade');

            $table->foreignId('animal_id')
                ->constrained('animales')
                ->onDelete('cascade');

            $table->decimal('precio_kg', 10, 2)->nullable();

            $table->decimal('peso_individual', 10, 2)->nullable();

            $table->decimal('precio_fijo', 10, 2)->nullable();

            $table->decimal('subtotal_individual', 10, 2);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venta_animales');
    }
};