<?php

namespace App\Exports;

use App\Models\Venta;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class VentasExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Venta::select(
            'fecha',
            'animal_id',
            'cliente_id',
            'peso',
            'precio_unitario',
            'total'
        )->get();
    }

    public function headings(): array
    {
        return [
            'Fecha',
            'Animal ID',
            'Cliente ID',
            'Peso (kg)',
            'Precio Unitario',
            'Total'
        ];
    }
}