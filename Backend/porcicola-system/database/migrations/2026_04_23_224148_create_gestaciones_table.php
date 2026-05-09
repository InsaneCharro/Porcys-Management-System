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
        Schema::create('gestaciones', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('animal_id'); // hembra
            $table->date('fecha_servicio');
            $table->date('fecha_probable_parto')->nullable();
            $table->date('fecha_parto_real')->nullable();

            $table->enum('estado', ['gestante', 'parida', 'fallida'])->default('gestante');
            $table->integer('intentos')->default(1);
            $table->text('notas')->nullable();

            $table->timestamps();

            $table->foreign('animal_id')
                ->references('id')->on('animales')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gestaciones');
    }
};
