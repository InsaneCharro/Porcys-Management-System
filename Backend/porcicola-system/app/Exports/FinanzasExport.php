<?php

namespace App\Exports;

use App\Models\MovimientoInventario;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class FinanzasExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return MovimientoInventario::join('inventarios', 'movimientos_inventario.inventario_id', '=', 'inventarios.id')
            ->where('movimientos_inventario.tipo', 'consumo')
            ->select(
                'inventarios.nombre_producto',
                'movimientos_inventario.cantidad',
                'inventarios.costo_unitario',
                DB::raw('(movimientos_inventario.cantidad * inventarios.costo_unitario) as total'),
                'movimientos_inventario.created_at'
            )
            ->orderBy('movimientos_inventario.created_at', 'desc')
            ->get()
            ->map(function ($item) {
                $item->created_at = \Carbon\Carbon::parse($item->created_at)
                    ->format('d/m/Y H:i');

                return $item;
            });
    }

    public function headings(): array
    {
        return [
            'Producto',
            'Cantidad (kg)',
            'Costo unitario',
            'Total',
            'Fecha'
        ];
    }
}