<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Muerte;

class Animal extends Model
{
    protected $table = 'animales';

    protected $fillable = [
        'identificador_unico',
        'sexo',
        'fecha_nacimiento',
        'etapa_actual',
        'estado',
        'raza',
        'madre_id',
        'padre_id',
        'peso'
    ];

    public function gestaciones()
    {
        return $this->hasMany(Gestacion::class, 'hembra_id');
    }

    public function pesos()
    {
        return $this->hasMany(Peso::class, 'animal_id');
    }

    public function muertes()
    {
        return $this->hasMany(Muerte::class);
    }

    public function eventos()
    {
        return $this->hasMany(Evento::class, 'animal_id');
    }

    public function corral()
    {
        return $this->belongsTo(Corral::class);
    }

    public function camadas()
    {
        return $this->hasMany(Camada::class, 'madre_id');
    }

    public function ventas()
    {
        return $this->hasMany(VentaAnimal::class, 'animal_id');
    }
}