<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsuarioInicialSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@porcys.local'],
            [
                'name' => 'Administrador PORCYS',
                'password' => Hash::make('Admin12345'),
                'role' => User::ROLE_ADMINISTRADOR,
                'activo' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'empleado@porcys.local'],
            [
                'name' => 'Empleado PORCYS',
                'password' => Hash::make('Empleado12345'),
                'role' => User::ROLE_EMPLEADO,
                'activo' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'inversionista@porcys.local'],
            [
                'name' => 'Inversionista PORCYS',
                'password' => Hash::make('Inversionista12345'),
                'role' => User::ROLE_INVERSIONISTA,
                'activo' => true,
            ]
        );
    }
}