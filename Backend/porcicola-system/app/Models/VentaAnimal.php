<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VentaAnimal extends Model
{
    protected $table = 'venta_animales';

    protected $fillable = [
        'venta_id',
        'animal_id',
        'precio_kg',
        'peso_individual',
        'precio_fijo',
        'subtotal_individual'
    ];

    public function venta()
    {
        return $this->belongsTo(Venta::class, 'venta_id');
    }

    public function animal()
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }
}