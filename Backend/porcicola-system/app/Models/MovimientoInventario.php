<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoInventario extends Model
{
    protected $fillable = [
        'producto_id',
        'tipo',
        'cantidad_kg',
        'fecha',
        'descripcion'
    ];
}
