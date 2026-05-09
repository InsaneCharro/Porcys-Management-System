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
            Schema::create('animals', function (Blueprint $table) {
        $table->id();

        $table->string('identificador')->unique();
        $table->enum('sexo', ['Macho', 'Hembra']);
        $table->date('fecha_nacimiento');

        $table->string('raza')->nullable();

        // 🔗 relaciones genealógicas
        $table->foreignId('madre_id')->nullable()->constrained('animals')->nullOnDelete();
        $table->foreignId('padre_id')->nullable()->constrained('animals')->nullOnDelete();

        $table->string('etapa')->default('Lechon');
        $table->float('peso')->nullable();
        $table->enum('estado', ['Vivo', 'Muerto', 'Descartado'])->default('Vivo');

        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('animales');
    }
};
