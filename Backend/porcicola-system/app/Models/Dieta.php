<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dieta extends Model
{
    protected $table = 'dietas';

    protected $fillable = [
        'nombre',
        'etapa_objetivo',
        'descripcion',
        'costo_estimado',
        'activa',
    ];

    protected $casts = [
        'costo_estimado' => 'float',
        'activa' => 'boolean',
    ];

    public function ingredientes()
    {
        return $this->hasMany(DietaIngrediente::class, 'dieta_id');
    }

    public function consumos()
    {
        return $this->hasMany(ConsumoAlimentacion::class, 'dieta_id');
    }
}
