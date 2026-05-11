<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenCompraDetalle extends Model
{
    protected $table = 'orden_compra_detalles';

    protected $fillable = [
        'orden_compra_id',
        'categoria',
        'item_id',
        'cantidad',
        'precio_unitario',
        'subtotal',
    ];

    public function orden()
    {
        return $this->belongsTo(OrdenCompra::class);
    }
}