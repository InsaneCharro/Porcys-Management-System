<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Camada extends Model
{
    protected $table = 'camadas';

    protected $fillable = [
        'gestacion_id',
        'madre_id',
        'fecha_parto',
        'total_crias',
        'machos',
        'hembras',
        'muertos',
        'vivos',
        'peso_promedio_nacimiento',
        'fecha_destete',
        'estado'
    ];

    // 🔗 Gestación
    public function gestacion()
    {
        return $this->belongsTo(Gestacion::class);
    }

    // 🔗 Madre
    public function madre()
    {
        return $this->belongsTo(Animal::class, 'madre_id');
    }

    // 🔗 Lechones
    public function lechones()
    {
        return $this->hasMany(Animal::class, 'madre_id', 'madre_id')
            ->where('etapa_actual', 'lechon');
    }
}