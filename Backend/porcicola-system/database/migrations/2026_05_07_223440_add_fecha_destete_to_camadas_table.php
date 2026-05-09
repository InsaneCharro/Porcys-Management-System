<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('camadas', function (Blueprint $table) {

            $table->date('fecha_destete')
                ->nullable()
                ->after('fecha_parto');

        });
    }

    public function down(): void
    {
        Schema::table('camadas', function (Blueprint $table) {

            $table->dropColumn('fecha_destete');

        });
    }
};