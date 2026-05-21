<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoInventario extends Model
{
    protected $table = 'movimientos_inventario';

    protected $fillable = [
        'inventario_id',
        'tipo',
        'cantidad',
        'tipo_origen',
        'referencia_id',
        'descripcion',
    ];

    protected $casts = [
        'cantidad' => 'float',
        'referencia_id' => 'integer',
    ];

    public function inventario()
    {
        return $this->belongsTo(Inventario::class, 'inventario_id');
    }
}
