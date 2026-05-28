<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role', 30)->default('empleado')->after('password');
            }

            if (!Schema::hasColumn('users', 'activo')) {
                $table->boolean('activo')->default(true)->after('role');
            }
        });

        DB::table('users')
            ->whereNull('role')
            ->orWhere('role', '')
            ->update(['role' => 'empleado']);

        DB::table('users')
            ->whereNull('activo')
            ->update(['activo' => true]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'activo')) {
                $table->dropColumn('activo');
            }

            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
        });
    }
};