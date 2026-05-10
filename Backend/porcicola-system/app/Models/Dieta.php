<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dieta extends Model
{
    protected $table = 'dietas';

    protected $fillable = [
        'nombre',
        'peso_min',
        'peso_max',
        'consumo_diario_kg'
    ];
}