<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoMedicamento extends Model
{
    protected $table = 'movimientos_medicamentos';

    protected $fillable = [
        'medicamento_id',
        'tipo',
        'cantidad',
        'motivo',
        'usuario'
    ];

    public function medicamento()
    {
        return $this->belongsTo(
            Medicamento::class
        );
    }
}