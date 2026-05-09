<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoAlimento extends Model
{
    protected $table = 'movimientos_alimento';
    public $timestamps = false;
    protected $fillable = [
        'alimento_id',
        'tipo',
        'cantidad',
        'motivo',
        'fecha'
    ];
}