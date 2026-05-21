<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicioReproductivo extends Model
{
    protected $table = 'servicios_reproductivos';

    protected $fillable = [
        'hembra_id',
        'semental_id',
        'gestacion_id',
        'tipo_servicio',
        'fecha_servicio',
        'numero_intento',
        'resultado',
        'fecha_confirmacion',
        'observaciones',
    ];

    public function hembra()
    {
        return $this->belongsTo(Animal::class, 'hembra_id');
    }

    public function semental()
    {
        return $this->belongsTo(Animal::class, 'semental_id');
    }

    public function gestacion()
    {
        return $this->belongsTo(Gestacion::class, 'gestacion_id');
    }
}
