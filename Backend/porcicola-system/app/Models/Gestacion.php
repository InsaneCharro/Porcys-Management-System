<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Gestacion extends Model
{
    protected $table = 'gestaciones';

    protected $fillable = [
        'animal_id',
        'hembra_id',
        'fecha_servicio',
        'fecha_inicio',
        'fecha_probable_parto',
        'fecha_parto_real',
        'tipo_servicio',
        'estado',
        'resultado',
        'fecha_fin',
        'cantidad_crias',
        'intentos',
        'notas',
    ];

    public function animal()
    {
        return $this->belongsTo(Animal::class, 'hembra_id');
    }

    public function hembra()
    {
        return $this->belongsTo(Animal::class, 'hembra_id');
    }

    public function parto()
    {
        return $this->hasOne(Parto::class, 'gestacion_id');
    }

    public function camada()
    {
        return $this->hasOne(Camada::class);
    }

    public function serviciosReproductivos()
    {
        return $this->hasMany(ServicioReproductivo::class, 'gestacion_id');
    }

    public function calcularFechaParto()
    {
        return Carbon::parse($this->fecha_inicio)->addDays(114);
    }
}
