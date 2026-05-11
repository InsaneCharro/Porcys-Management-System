<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->string('folio')->unique()->after('id');

            $table->enum('tipo_venta', [
                'abasto',
                'pie_cria'
            ])->after('cliente_id');

            $table->decimal('subtotal', 12, 2)->default(0)->after('tipo_venta');

            $table->decimal('iva', 12, 2)->default(0)->after('subtotal');

            $table->decimal('descuento', 12, 2)->default(0)->after('iva');

            $table->enum('estado', [
                'completada',
                'cancelada'
            ])->default('completada')->after('total');

            $table->text('observaciones')->nullable()->after('estado');
        });
    }

    public function down(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->dropColumn([
                'folio',
                'tipo_venta',
                'subtotal',
                'iva',
                'descuento',
                'estado',
                'observaciones'
            ]);
        });
    }
};