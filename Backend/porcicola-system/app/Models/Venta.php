<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    protected $table = 'ventas';

    protected $fillable = [
        'animal_id',
        'cliente_id',
        'tipo_venta',
        'precio_kg',
        'peso_venta',
        'total',
        'fecha'
    ];

    public function animal()
    {
        return $this->belongsTo(Animal::class);
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }
}