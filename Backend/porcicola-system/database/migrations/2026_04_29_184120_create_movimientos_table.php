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
        Schema::create('movimientos', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('animal_id');
            $table->unsignedBigInteger('corral_origen_id')->nullable();
            $table->unsignedBigInteger('corral_destino_id');

            $table->timestamp('fecha')->useCurrent();

            $table->timestamps();

            $table->foreign('animal_id')->references('id')->on('animales');
            $table->foreign('corral_origen_id')->references('id')->on('corrales');
            $table->foreign('corral_destino_id')->references('id')->on('corrales');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos');
    }
};
