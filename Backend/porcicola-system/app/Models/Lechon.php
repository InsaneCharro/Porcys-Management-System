<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lechon extends Model
{
    protected $table = 'lechones';
    protected $fillable = [
        'parto_id',
        'madre_id',
        'sexo',
        'estado',
        'clasificacion',
        'peso_nacimiento',
        'peso_dia_10',
        'peso_dia_28',
        'causa_muerte'
    ];

    public function parto()
    {
        return $this->belongsTo(Parto::class);
    }

    public function eventosSanitarios()
    {
        return $this->hasMany(EventoSanitarioLechon::class);
    }
    public function corral()
    {
        return $this->belongsTo(Corral::class);
    }
}
