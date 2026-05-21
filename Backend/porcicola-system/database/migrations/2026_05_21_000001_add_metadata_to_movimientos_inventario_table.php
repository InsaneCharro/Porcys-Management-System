<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movimientos_inventario', function (Blueprint $table) {
            if (!Schema::hasColumn('movimientos_inventario', 'tipo_origen')) {
                $table->string('tipo_origen')->nullable()->after('cantidad');
            }

            if (!Schema::hasColumn('movimientos_inventario', 'referencia_id')) {
                $table->unsignedBigInteger('referencia_id')->nullable()->after('tipo_origen');
            }

            if (!Schema::hasColumn('movimientos_inventario', 'descripcion')) {
                $table->text('descripcion')->nullable()->after('referencia_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('movimientos_inventario', function (Blueprint $table) {
            if (Schema::hasColumn('movimientos_inventario', 'descripcion')) {
                $table->dropColumn('descripcion');
            }

            if (Schema::hasColumn('movimientos_inventario', 'referencia_id')) {
                $table->dropColumn('referencia_id');
            }

            if (Schema::hasColumn('movimientos_inventario', 'tipo_origen')) {
                $table->dropColumn('tipo_origen');
            }
        });
    }
};
