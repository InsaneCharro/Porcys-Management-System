<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recepciones_compra', function (Blueprint $table) {
            $table->id();

            $table->string('folio')->unique();

            $table->foreignId('orden_compra_id')
                ->constrained('ordenes_compra')
                ->cascadeOnDelete();

            $table->text('observaciones')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recepciones_compra');
    }
};