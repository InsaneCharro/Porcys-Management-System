<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('dietas')) {
            Schema::create('dietas', function (Blueprint $table) {
                $table->id();
                $table->string('nombre');
                $table->string('etapa_objetivo')->nullable();
                $table->text('descripcion')->nullable();
                $table->decimal('costo_estimado', 12, 2)->default(0);
                $table->boolean('activa')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('dietas');
    }
};
