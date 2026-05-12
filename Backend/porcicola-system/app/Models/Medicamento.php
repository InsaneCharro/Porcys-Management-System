<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medicamento extends Model
{
    use HasFactory;

    protected $table = 'medicamentos';

    protected $fillable = [
        'nombre',
        'descripcion',
        'stock',
        'precio_unitario',
    ];

    protected $casts = [
        'stock' => 'integer',
        'precio_unitario' => 'decimal:2',
    ];

    public function movimientos()
    {
        return $this->hasMany(MovimientoMedicamento::class);
    }
}