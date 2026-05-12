<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AplicacionMedica extends Model
{
    use HasFactory;

    protected $table = 'aplicaciones_medicas';

    protected $fillable = [
        'animal_id',
        'medicamento',
        'dosis',
        'fecha',
    ];

    public function animal()
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }
}