<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('servicios_reproductivos')) {
            return;
        }

        Schema::create('servicios_reproductivos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('hembra_id');
            $table->unsignedBigInteger('semental_id')->nullable();
            $table->unsignedBigInteger('gestacion_id')->nullable();
            $table->string('tipo_servicio')->default('natural');
            $table->date('fecha_servicio');
            $table->integer('numero_intento')->default(1);
            $table->string('resultado')->default('pendiente');
            $table->date('fecha_confirmacion')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->foreign('hembra_id')
                ->references('id')
                ->on('animales')
                ->onDelete('cascade');

            $table->foreign('semental_id')
                ->references('id')
                ->on('animales')
                ->nullOnDelete();

            $table->foreign('gestacion_id')
                ->references('id')
                ->on('gestaciones')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servicios_reproductivos');
    }
};
