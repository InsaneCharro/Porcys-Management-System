<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecepcionCompra extends Model
{
    protected $table = 'recepciones_compra';

    protected $fillable = [
        'folio',
        'orden_compra_id',
        'observaciones'
    ];

    public function orden()
    {
        return $this->belongsTo(OrdenCompra::class);
    }
}