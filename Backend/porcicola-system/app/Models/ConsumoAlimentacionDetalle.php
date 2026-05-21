<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsumoAlimentacionDetalle extends Model
{
    protected $table = 'consumo_alimentacion_detalles';

    protected $fillable = [
        'consumo_alimentacion_id',
        'inventario_id',
        'cantidad_descontada',
        'costo_unitario_snapshot',
        'subtotal',
    ];

    protected $casts = [
        'cantidad_descontada' => 'float',
        'costo_unitario_snapshot' => 'float',
        'subtotal' => 'float',
    ];

    public function consumo()
    {
        return $this->belongsTo(ConsumoAlimentacion::class, 'consumo_alimentacion_id');
    }

    public function inventario()
    {
        return $this->belongsTo(Inventario::class, 'inventario_id');
    }
}
