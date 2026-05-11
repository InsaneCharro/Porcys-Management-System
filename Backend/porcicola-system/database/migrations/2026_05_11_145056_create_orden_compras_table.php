<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ordenes_compra', function (Blueprint $table) {
            $table->id();

            $table->string('folio')->unique();

            $table->foreignId('proveedor_id')
                ->constrained('proveedores')
                ->cascadeOnDelete();

            $table->foreignId('solicitud_compra_id')
                ->nullable()
                ->constrained('solicitudes_compra')
                ->nullOnDelete();

            $table->enum('estado', [
                'borrador',
                'emitida',
                'parcial',
                'recibida',
                'cancelada'
            ])->default('borrador');

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('impuestos', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->text('observaciones')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ordenes_compra');
    }
};