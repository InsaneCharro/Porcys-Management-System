<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    protected $table = 'ventas';

    protected $fillable = [
        'folio',
        'cliente_id',
        'tipo_venta',
        'subtotal',
        'iva',
        'descuento',
        'total',
        'fecha',
        'estado',
        'observaciones'
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function detalleAnimales()
    {
        return $this->hasMany(VentaAnimal::class, 'venta_id');
    }
}