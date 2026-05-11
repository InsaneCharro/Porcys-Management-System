<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SolicitudCompra extends Model
{
    protected $table = 'solicitudes_compra';

    protected $fillable = [
        'folio',
        'tipo',
        'estado',
        'motivo',
        'observaciones',
        'solicitado_por',
        'fecha_solicitud',
    ];

    protected $casts = [
        'fecha_solicitud' => 'datetime',
    ];

    public function detalles()
    {
        return $this->hasMany(SolicitudCompraDetalle::class);
    }

    public function solicitante()
    {
        return $this->belongsTo(User::class, 'solicitado_por');
    }
}