<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventoSanitarioLechon extends Model
{
    protected $table = 'eventos_sanitarios_lechon';

    protected $fillable = [
        'lechon_id',
        'tipo',
        'medicamento_id',
        'dosis',
        'fecha',
        'observaciones'
    ];

    public function lechon()
    {
        return $this->belongsTo(Lechon::class);
    }

    public function medicamento()
    {
        return $this->belongsTo(Inventario::class, 'medicamento_id');
    }
}
