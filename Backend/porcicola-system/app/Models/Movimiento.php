<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Movimiento extends Model
{
    protected $fillable = [
        'animal_id',
        'corral_origen_id',
        'corral_destino_id',
        'fecha'
    ];

    // relaciones
    public function animal()
    {
        return $this->belongsTo(Animal::class);
    }

    public function corralOrigen()
    {
        return $this->belongsTo(Corral::class, 'corral_origen_id');
    }

    public function corralDestino()
    {
        return $this->belongsTo(Corral::class, 'corral_destino_id');
    }
}