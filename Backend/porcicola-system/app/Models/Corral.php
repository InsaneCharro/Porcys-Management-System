<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Corral extends Model
{
    protected $table = 'corrales';
    protected $fillable = ['nombre', 'capacidad']; // 🔥 CLAVE

    public function animales()
    {
        return $this->hasMany(Animal::class);
    }

    public function lechones()
    {
        return $this->hasMany(Lechon::class, 'corral_id');
    }
}
