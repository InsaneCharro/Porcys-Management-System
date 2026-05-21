<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('consumos_alimentacion')) {
            Schema::create('consumos_alimentacion', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('corral_id');
                $table->foreignId('dieta_id')->constrained('dietas')->restrictOnDelete();
                $table->decimal('cantidad_kg', 12, 2);
                $table->decimal('costo_total', 12, 2)->default(0);
                $table->date('fecha');
                $table->text('observaciones')->nullable();
                $table->timestamps();

                $table->index('corral_id');
                $table->index('fecha');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('consumos_alimentacion');
    }
};
