<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenCompra extends Model
{
    protected $table = 'ordenes_compra';

    protected $fillable = [
        'folio',
        'proveedor_id',
        'solicitud_compra_id',
        'estado',
        'subtotal',
        'impuestos',
        'total',
        'observaciones',
    ];

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class);
    }

    public function solicitud()
    {
        return $this->belongsTo(SolicitudCompra::class);
    }

    public function detalles()
    {
        return $this->hasMany(OrdenCompraDetalle::class);
    }
}