<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('dietas')) {
            return;
        }

        Schema::table('dietas', function (Blueprint $table) {
            if (!Schema::hasColumn('dietas', 'etapa_objetivo')) {
                $table->string('etapa_objetivo')->nullable();
            }

            if (!Schema::hasColumn('dietas', 'descripcion')) {
                $table->text('descripcion')->nullable();
            }

            if (!Schema::hasColumn('dietas', 'costo_estimado')) {
                $table->decimal('costo_estimado', 10, 2)->default(0);
            }

            if (!Schema::hasColumn('dietas', 'activa')) {
                $table->boolean('activa')->default(true);
            }

            if (!Schema::hasColumn('dietas', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (!Schema::hasColumn('dietas', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('dietas')) {
            return;
        }

        Schema::table('dietas', function (Blueprint $table) {
            if (Schema::hasColumn('dietas', 'etapa_objetivo')) {
                $table->dropColumn('etapa_objetivo');
            }

            if (Schema::hasColumn('dietas', 'descripcion')) {
                $table->dropColumn('descripcion');
            }

            if (Schema::hasColumn('dietas', 'costo_estimado')) {
                $table->dropColumn('costo_estimado');
            }

            if (Schema::hasColumn('dietas', 'activa')) {
                $table->dropColumn('activa');
            }

            if (Schema::hasColumn('dietas', 'created_at')) {
                $table->dropColumn('created_at');
            }

            if (Schema::hasColumn('dietas', 'updated_at')) {
                $table->dropColumn('updated_at');
            }
        });
    }
};