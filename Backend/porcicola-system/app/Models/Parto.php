<?php

namespace App\Models;
use App\Models\Lechon;
use App\Models\Animal;
use Illuminate\Database\Eloquent\Model;

class Parto extends Model
{
    protected $fillable = [
        'madre_id',
        'fecha_parto',
        'total_lechones',
        'machos',
        'hembras',
        'observaciones'
    ];

    public function madre()
    {
        return $this->belongsTo(Animal::class, 'madre_id');
    }

    public function lechones()
    {
        return $this->hasMany(Lechon::class);
    }

}