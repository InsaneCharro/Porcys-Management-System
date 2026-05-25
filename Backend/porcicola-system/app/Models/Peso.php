<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Peso extends Model
{
    protected $table = 'pesos';

    public $timestamps = true;

    protected $fillable = [
        'animal_id',
        'peso',
        'fecha',
        'edad_dias',
        'etapa',
        'estado',
    ];
}