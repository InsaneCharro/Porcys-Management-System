<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicamento extends Model
{
    protected $table = 'medicamentos';

    protected $fillable = [
        'nombre',
        'tipo',
        'descripcion',
        'stock',
        'unidad'
    ];

    public function movimientos()
    {
        return $this->hasMany(
            MovimientoMedicamento::class
        );
    }
}