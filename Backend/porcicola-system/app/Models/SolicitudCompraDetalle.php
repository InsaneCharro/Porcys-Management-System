<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Inventario;
use App\Models\Medicamento;

class SolicitudCompraDetalle extends Model
{
    protected $table = 'solicitud_compra_detalles';

    protected $fillable = [
        'solicitud_compra_id',
        'categoria',
        'item_id',
        'cantidad',
        'unidad',
        'observaciones',
    ];

    public function solicitud()
    {
        return $this->belongsTo(SolicitudCompra::class);
    }

    public function item()
    {
        if ($this->categoria === 'alimento') {
            return Inventario::find($this->item_id);
        }

        if ($this->categoria === 'medicamento') {
            return Medicamento::find($this->item_id);
        }

        return null;
    }
}