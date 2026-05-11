<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitud_compra_detalles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('solicitud_compra_id')
                ->constrained('solicitudes_compra')
                ->cascadeOnDelete();

            $table->enum('categoria', [
                'alimento',
                'medicamento'
            ]);

            $table->unsignedBigInteger('item_id');

            $table->decimal('cantidad', 10, 2);

            $table->string('unidad', 30)->nullable();

            $table->text('observaciones')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitud_compra_detalles');
    }
};