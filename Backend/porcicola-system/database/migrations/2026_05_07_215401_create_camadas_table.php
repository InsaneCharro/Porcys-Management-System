<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('camadas', function (Blueprint $table) {

            $table->id();

            // 🔗 Gestación relacionada
            $table->foreignId('gestacion_id')
                ->constrained('gestaciones')
                ->cascadeOnDelete();

            // 🔗 Madre
            $table->foreignId('madre_id')
                ->constrained('animales')
                ->cascadeOnDelete();

            // 📅 Fecha del parto
            $table->date('fecha_parto');

            // 🐷 Datos generales
            $table->integer('total_crias');
            $table->integer('machos');
            $table->integer('hembras');

            // ☠️ Mortalidad
            $table->integer('muertos')->default(0);
            $table->integer('vivos')->default(0);

            // ⚖️ Peso promedio
            $table->decimal('peso_promedio_nacimiento', 8, 2)
                ->nullable();

            // 📌 Estado
            $table->enum('estado', [
                'activa',
                'destetada',
                'cerrada'
            ])->default('activa');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('camadas');
    }
};