<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventoSanitario extends Model
{
    protected $table = 'eventos_sanitarios';

    protected $fillable = [
        'animal_id',
        'tipo',
        'medicamento_id',
        'dosis',
        'fecha',
        'observaciones'
    ];

    protected $casts = [
        'dosis' => 'decimal:2',
        'fecha' => 'date'
    ];

    public function animal()
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }

    public function medicamento()
    {
        return $this->belongsTo(Medicamento::class, 'medicamento_id');
    }
}