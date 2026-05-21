<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsumoAlimentacion extends Model
{
    protected $table = 'consumos_alimentacion';

    protected $fillable = [
        'corral_id',
        'dieta_id',
        'cantidad_kg',
        'costo_total',
        'fecha',
        'observaciones',
    ];

    protected $casts = [
        'cantidad_kg' => 'float',
        'costo_total' => 'float',
        'fecha' => 'date',
    ];

    public function dieta()
    {
        return $this->belongsTo(Dieta::class, 'dieta_id');
    }

    public function corral()
    {
        return $this->belongsTo(Corral::class, 'corral_id');
    }

    public function detalles()
    {
        return $this->hasMany(ConsumoAlimentacionDetalle::class, 'consumo_alimentacion_id');
    }
}
