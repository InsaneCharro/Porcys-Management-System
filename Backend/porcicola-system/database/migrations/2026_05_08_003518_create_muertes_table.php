<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('muertes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('animal_id')
                ->constrained('animales')
                ->onDelete('cascade');

            $table->date('fecha');

            $table->string('causa');

            $table->text('observaciones')
                ->nullable();

            $table->decimal('peso', 8, 2)
                ->nullable();

            $table->decimal('costo_estimado', 10, 2)
                ->default(0);

            $table->string('etapa')
                ->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('muertes');
    }
};