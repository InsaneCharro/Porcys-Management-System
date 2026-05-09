<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Gestacion extends Model
{
    protected $table = 'gestaciones';
    public $timestamps = false;
    protected $fillable = [
        'hembra_id',
        'fecha_inicio',
        'fecha_probable_parto',
        'fecha_parto_real',
        'estado',
        'cantidad_crias'
    ];

    // 🔗 Relación con Animal
    public function animal()
    {
        return $this->belongsTo(Animal::class, 'hembra_id');
    }

    // 🔗 Relación con Parto
    public function parto()
    {
        return $this->hasOne(Parto::class, 'gestacion_id');
    }

    public function camada()
    {
        return $this->hasOne(Camada::class);
    }

    // 🧠 Lógica: calcular fecha de parto
    public function calcularFechaParto()
    {
        // 3 meses 22 días ≈ 114 días
        return Carbon::parse($this->fecha_inicio)->addDays(114);
    }

    public function hembra()
    {
        return $this->belongsTo(Animal::class, 'hembra_id');
    }
}