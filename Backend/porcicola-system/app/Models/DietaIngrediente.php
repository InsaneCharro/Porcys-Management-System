<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DietaIngrediente extends Model
{
    protected $table = 'dieta_ingredientes';

    protected $fillable = [
        'dieta_id',
        'inventario_id',
        'porcentaje',
        'cantidad_por_kg',
        'costo_unitario',
    ];

    protected $casts = [
        'porcentaje' => 'float',
        'cantidad_por_kg' => 'float',
        'costo_unitario' => 'float',
    ];

    public function dieta()
    {
        return $this->belongsTo(Dieta::class, 'dieta_id');
    }

    public function inventario()
    {
        return $this->belongsTo(Inventario::class, 'inventario_id');
    }
}
