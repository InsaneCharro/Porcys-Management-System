<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Muerte extends Model
{
    protected $table = 'muertes';

    protected $fillable = [
        'animal_id',
        'fecha',
        'causa',
        'observaciones',
        'peso',
        'costo_estimado',
        'etapa'
    ];

    public function animal()
    {
        return $this->belongsTo(Animal::class);
    }
}