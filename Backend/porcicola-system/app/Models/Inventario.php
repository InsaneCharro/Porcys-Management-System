<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventario extends Model
{
    protected $fillable = [
        'nombre_producto',
        'stock_kg',
    ];

    protected $casts = [
        'stock_kg' => 'float',
    ];

    public function movimientos()
    {
        return $this->hasMany(MovimientoInventario::class, 'inventario_id');
    }
}
