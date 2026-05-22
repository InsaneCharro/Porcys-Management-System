<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('corrales', 'tipo_corral')) {
            Schema::table('corrales', function (Blueprint $table) {
                $table->string('tipo_corral', 50)
                    ->default('general')
                    ->after('capacidad');
            });
        }

        DB::table('corrales')
            ->whereNull('tipo_corral')
            ->orWhere('tipo_corral', '')
            ->update([
                'tipo_corral' => 'general',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('corrales', 'tipo_corral')) {
            Schema::table('corrales', function (Blueprint $table) {
                $table->dropColumn('tipo_corral');
            });
        }
    }
};