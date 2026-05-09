<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Inventario;
use App\Models\Muerte;
use App\Models\AplicacionMedica;
use Barryvdh\DomPDF\Facade\Pdf;

class ReporteController extends Controller
{
    public function ventas()
    {
        $ventas = Venta::with([
            'animal',
            'cliente'
        ])
        ->orderBy('fecha', 'desc')
        ->get();

        $pdf = Pdf::loadView('reportes.ventas', [
            'ventas' => $ventas,
            'fecha' => now()
        ]);

        return $pdf->download('reporte_ventas_porcys.pdf');
    }

    public function inventario()
    {
        $inventarios = Inventario::orderBy('nombre_producto')->get();

        $pdf = Pdf::loadView('reportes.inventario', [
            'inventarios' => $inventarios,
            'fecha' => now()
        ]);

        return $pdf->download('reporte_inventario_porcys.pdf');
    }

    public function muertes()
    {
        $muertes = Muerte::with('animal')
            ->orderBy('fecha', 'desc')
            ->get();

        $pdf = Pdf::loadView('reportes.muertes', [
            'muertes' => $muertes,
            'fecha' => now()
        ]);

        return $pdf->download('reporte_bajas_porcys.pdf');
    }

    public function sanitario()
    {
        $aplicaciones = AplicacionMedica::with('animal')
            ->orderBy('fecha', 'desc')
            ->get();

        $pdf = Pdf::loadView('reportes.sanitario', [
            'aplicaciones' => $aplicaciones,
            'fecha' => now()
        ]);

        return $pdf->download('reporte_sanitario_porcys.pdf');
    }
}