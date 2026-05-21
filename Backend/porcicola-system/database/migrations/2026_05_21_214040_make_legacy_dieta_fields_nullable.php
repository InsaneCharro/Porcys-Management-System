<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('dietas')) {
            return;
        }

        $legacyColumns = [
            'peso_min',
            'peso_max',
            'consumo_diario',
            'consumo_diario_kg',
        ];

        foreach ($legacyColumns as $column) {
            if (!Schema::hasColumn('dietas', $column)) {
                continue;
            }

            $columnInfo = DB::selectOne(
                "SELECT COLUMN_TYPE
                 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'dietas'
                 AND COLUMN_NAME = ?",
                [$column]
            );

            if (!$columnInfo) {
                continue;
            }

            DB::statement(
                "ALTER TABLE `dietas`
                 MODIFY `$column` {$columnInfo->COLUMN_TYPE} NULL DEFAULT NULL"
            );
        }
    }

    public function down(): void
    {
        // No se revierte automáticamente porque volver a NOT NULL podría fallar
        // si ya existen registros nuevos con valores NULL.
    }
};