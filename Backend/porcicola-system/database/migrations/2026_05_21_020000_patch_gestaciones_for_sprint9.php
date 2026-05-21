<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('gestaciones')) {
            return;
        }

        Schema::table('gestaciones', function (Blueprint $table) {
            if (!Schema::hasColumn('gestaciones', 'animal_id')) {
                $table->unsignedBigInteger('animal_id')->nullable()->after('id');
            }

            if (!Schema::hasColumn('gestaciones', 'hembra_id')) {
                $table->unsignedBigInteger('hembra_id')->nullable()->after('animal_id');
            }

            if (!Schema::hasColumn('gestaciones', 'fecha_servicio')) {
                $table->date('fecha_servicio')->nullable()->after('hembra_id');
            }

            if (!Schema::hasColumn('gestaciones', 'fecha_inicio')) {
                $table->date('fecha_inicio')->nullable()->after('fecha_servicio');
            }

            if (!Schema::hasColumn('gestaciones', 'fecha_probable_parto')) {
                $table->date('fecha_probable_parto')->nullable()->after('fecha_inicio');
            }

            if (!Schema::hasColumn('gestaciones', 'fecha_parto_real')) {
                $table->date('fecha_parto_real')->nullable()->after('fecha_probable_parto');
            }

            if (!Schema::hasColumn('gestaciones', 'tipo_servicio')) {
                $table->string('tipo_servicio')->nullable()->after('fecha_parto_real');
            }

            if (!Schema::hasColumn('gestaciones', 'resultado')) {
                $table->string('resultado')->nullable()->after('estado');
            }

            if (!Schema::hasColumn('gestaciones', 'fecha_fin')) {
                $table->date('fecha_fin')->nullable()->after('resultado');
            }

            if (!Schema::hasColumn('gestaciones', 'cantidad_crias')) {
                $table->integer('cantidad_crias')->nullable()->after('fecha_fin');
            }

            if (!Schema::hasColumn('gestaciones', 'intentos')) {
                $table->integer('intentos')->default(1)->after('cantidad_crias');
            }

            if (!Schema::hasColumn('gestaciones', 'notas')) {
                $table->text('notas')->nullable()->after('intentos');
            }

            if (!Schema::hasColumn('gestaciones', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (!Schema::hasColumn('gestaciones', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });

        if (Schema::hasColumn('gestaciones', 'estado')) {
            DB::statement("ALTER TABLE `gestaciones` MODIFY `estado` VARCHAR(50) NOT NULL DEFAULT 'activa'");
            DB::table('gestaciones')->where('estado', 'gestante')->update(['estado' => 'confirmada']);
        }

        if (Schema::hasColumn('gestaciones', 'animal_id') && Schema::hasColumn('gestaciones', 'hembra_id')) {
            DB::statement("UPDATE `gestaciones` SET `hembra_id` = `animal_id` WHERE `hembra_id` IS NULL AND `animal_id` IS NOT NULL");
            DB::statement("UPDATE `gestaciones` SET `animal_id` = `hembra_id` WHERE `animal_id` IS NULL AND `hembra_id` IS NOT NULL");
        }

        if (Schema::hasColumn('gestaciones', 'fecha_inicio') && Schema::hasColumn('gestaciones', 'fecha_servicio')) {
            DB::statement("UPDATE `gestaciones` SET `fecha_inicio` = `fecha_servicio` WHERE `fecha_inicio` IS NULL AND `fecha_servicio` IS NOT NULL");
            DB::statement("UPDATE `gestaciones` SET `fecha_servicio` = `fecha_inicio` WHERE `fecha_servicio` IS NULL AND `fecha_inicio` IS NOT NULL");
        }
    }

    public function down(): void
    {
        // No se revierte automáticamente para no arriesgar datos existentes.
    }
};
