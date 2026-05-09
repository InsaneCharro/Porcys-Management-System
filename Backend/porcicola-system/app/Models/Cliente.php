<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $fillable = [
        'nombre',
        'telefono',
        'email',
        'direccion',
        'tipo_cliente',
        'notas'
    ];

    public function ventas()
    {
        return $this->hasMany(Venta::class);
    }
}