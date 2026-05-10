<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DietaIngrediente extends Model
{
    protected $table = 'dieta_ingredientes';

    protected $fillable = [
        'dieta_id',
        'inventario_id',
        'porcentaje'
    ];
}