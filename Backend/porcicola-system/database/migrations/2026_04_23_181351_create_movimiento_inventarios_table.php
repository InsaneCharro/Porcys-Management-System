<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('movimientos_inventario', function (Blueprint $table) {
            $table->id();

            $table->foreignId('inventario_id')
                ->constrained('inventarios')
                ->onDelete('cascade');

            $table->enum('tipo', ['entrada', 'salida', 'consumo']);

            $table->float('cantidad');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimiento_inventarios');
    }
};
