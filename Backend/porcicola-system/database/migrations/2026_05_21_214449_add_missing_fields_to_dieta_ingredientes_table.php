<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('dieta_ingredientes')) {
            return;
        }

        Schema::table('dieta_ingredientes', function (Blueprint $table) {
            if (!Schema::hasColumn('dieta_ingredientes', 'cantidad_por_kg')) {
                $table->decimal('cantidad_por_kg', 10, 4)->default(0);
            }

            if (!Schema::hasColumn('dieta_ingredientes', 'costo_unitario')) {
                $table->decimal('costo_unitario', 10, 2)->default(0);
            }

            if (!Schema::hasColumn('dieta_ingredientes', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (!Schema::hasColumn('dieta_ingredientes', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('dieta_ingredientes')) {
            return;
        }

        Schema::table('dieta_ingredientes', function (Blueprint $table) {
            if (Schema::hasColumn('dieta_ingredientes', 'cantidad_por_kg')) {
                $table->dropColumn('cantidad_por_kg');
            }

            if (Schema::hasColumn('dieta_ingredientes', 'costo_unitario')) {
                $table->dropColumn('costo_unitario');
            }

            if (Schema::hasColumn('dieta_ingredientes', 'created_at')) {
                $table->dropColumn('created_at');
            }

            if (Schema::hasColumn('dieta_ingredientes', 'updated_at')) {
                $table->dropColumn('updated_at');
            }
        });
    }
};