<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('muertes', function (Blueprint $table) {
            if (!Schema::hasColumn('muertes', 'tipo_baja')) {
                $table->string('tipo_baja')->default('muerte')->after('animal_id');
            }

            if (!Schema::hasColumn('muertes', 'hora_aproximada')) {
                $table->time('hora_aproximada')->nullable()->after('fecha');
            }

            if (!Schema::hasColumn('muertes', 'corral_id')) {
                $table->unsignedBigInteger('corral_id')->nullable()->after('hora_aproximada');
            }

            if (!Schema::hasColumn('muertes', 'etapa_animal_snapshot')) {
                $table->string('etapa_animal_snapshot')->nullable()->after('corral_id');
            }

            if (!Schema::hasColumn('muertes', 'estado_anterior_animal')) {
                $table->string('estado_anterior_animal')->nullable()->after('etapa_animal_snapshot');
            }

            if (!Schema::hasColumn('muertes', 'costo_estimado_perdida')) {
                $table->decimal('costo_estimado_perdida', 10, 2)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('muertes', function (Blueprint $table) {
            if (Schema::hasColumn('muertes', 'costo_estimado_perdida')) {
                $table->dropColumn('costo_estimado_perdida');
            }

            if (Schema::hasColumn('muertes', 'estado_anterior_animal')) {
                $table->dropColumn('estado_anterior_animal');
            }

            if (Schema::hasColumn('muertes', 'etapa_animal_snapshot')) {
                $table->dropColumn('etapa_animal_snapshot');
            }

            if (Schema::hasColumn('muertes', 'corral_id')) {
                $table->dropColumn('corral_id');
            }

            if (Schema::hasColumn('muertes', 'hora_aproximada')) {
                $table->dropColumn('hora_aproximada');
            }

            if (Schema::hasColumn('muertes', 'tipo_baja')) {
                $table->dropColumn('tipo_baja');
            }
        });
    }
};