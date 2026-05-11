<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    protected $table = 'proveedores';

    protected $fillable = [
        'nombre',
        'empresa',
        'telefono',
        'email',
        'direccion',
        'tipo_proveedor',
        'rfc',
        'contacto_principal',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];
}