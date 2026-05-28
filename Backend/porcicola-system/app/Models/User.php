<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_ADMINISTRADOR = 'administrador';
    public const ROLE_EMPLEADO = 'empleado';
    public const ROLE_INVERSIONISTA = 'inversionista';

    public const ROLES = [
        self::ROLE_ADMINISTRADOR,
        self::ROLE_EMPLEADO,
        self::ROLE_INVERSIONISTA,
    ];

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'activo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'activo' => 'boolean',
        ];
    }

    public function esAdministrador(): bool
    {
        return $this->role === self::ROLE_ADMINISTRADOR;
    }

    public function esEmpleado(): bool
    {
        return $this->role === self::ROLE_EMPLEADO;
    }

    public function esInversionista(): bool
    {
        return $this->role === self::ROLE_INVERSIONISTA;
    }
}