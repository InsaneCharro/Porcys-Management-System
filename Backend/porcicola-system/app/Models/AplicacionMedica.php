<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Animal;

class AplicacionMedica extends Model
{
    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }
    protected $table = 'aplicaciones_medicas';

    public $timestamps = false;

    protected $fillable = [
        'animal_id',
        'medicamento_id',
        'dosis',
        'fecha',
        'motivo'
    ];

    public function medicamento()
    {
        return $this->belongsTo(Medicamento::class);
    }
}
