<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Muerte extends Model
{
    protected $table = 'muertes';

    protected $fillable = [
        'animal_id',
        'tipo_baja',
        'fecha',
        'hora_aproximada',
        'corral_id',
        'causa',
        'observaciones',
        'peso',
        'costo_estimado_perdida',
        'etapa',
        'etapa_animal_snapshot',
        'estado_anterior_animal',
    ];

    public function animal()
    {
        return $this->belongsTo(Animal::class);
    }

    public function corral()
    {
        return $this->belongsTo(Corral::class);
    }
}