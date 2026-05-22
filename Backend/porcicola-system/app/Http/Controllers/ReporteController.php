<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Inventario;
use App\Models\Muerte;
use App\Models\AplicacionMedica;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Animal;
use App\Exports\VentasExport;
use App\Services\GraficaService;
use App\Exports\FinanzasExport;
use Maatwebsite\Excel\Facades\Excel;

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
        $muertes = \App\Models\Muerte::with(['animal', 'corral'])
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->get();

        $totalMuertes = $muertes
            ->where('tipo_baja', 'muerte')
            ->count();

        $totalDescartes = $muertes
            ->where('tipo_baja', 'descarte')
            ->count();

        $perdidaTotal = $muertes->sum('costo_estimado_perdida');

        $porCausa = $muertes
            ->groupBy('causa')
            ->map(fn($grupo) => $grupo->count());

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView(
            'reportes.muertes',
            [
                'muertes' => $muertes,
                'totalMuertes' => $totalMuertes,
                'totalDescartes' => $totalDescartes,
                'perdidaTotal' => $perdidaTotal,
                'porCausa' => $porCausa,
                'fechaGeneracion' => now(),
            ]
        );

        return $pdf->download('reporte_mortalidad_bajas.pdf');
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

    public function dashboard()
    {
        $totalAnimales = Animal::count();

        $totalVentas = Venta::count();

        $ingresos = Venta::sum('total');

        $totalMuertes = Muerte::count();

        $stockInventario = Inventario::sum('stock_kg');

        $eventosSanitarios = AplicacionMedica::count();

        $grafica = GraficaService::generarDashboardGrafica([
            $totalAnimales,
            $totalVentas,
            $totalMuertes,
            $eventosSanitarios
        ]);

        $pdf = Pdf::loadView('reportes.dashboard', [
            'fecha' => now(),
            'totalAnimales' => $totalAnimales,
            'totalVentas' => $totalVentas,
            'ingresos' => $ingresos,
            'totalMuertes' => $totalMuertes,
            'stockInventario' => $stockInventario,
            'eventosSanitarios' => $eventosSanitarios,
            'grafica' => $grafica
        ]);

        return $pdf->download('dashboard_ejecutivo_porcys.pdf');
    }
    public function ventasExcel()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(
            new VentasExport(),
            'PORCYS_Ventas.xlsx'
        );
    }

    public function registrarConsumoDiario()
    {
        $animales = \App\Models\Animal::where('estado', 'activo')
            ->where('area', 'engorda')
            ->get();
        
        $hoy = now()->toDateString();

        $yaEjecutadoHoy = \App\Models\MovimientoInventario::where('tipo', 'consumo')
            ->whereDate('created_at', $hoy)
            ->where('tipo_origen', 'alimentacion')
            ->exists();

        if ($yaEjecutadoHoy) {
            return response()->json([
                'message' => 'El consumo diario ya fue ejecutado hoy.'
            ], 400);
        }    

        foreach ($animales as $animal) {

            $peso = $animal->peso;

            $dieta = \App\Models\Dieta::where('peso_min', '<=', $peso)
                ->where('peso_max', '>=', $peso)
                ->first();

            if (!$dieta) {
                continue;
            }

            $ingredientes = \App\Models\DietaIngrediente::where('dieta_id', $dieta->id)->get();

            foreach ($ingredientes as $ingrediente) {

                $consumoIngrediente = ($dieta->consumo_diario_kg * $ingrediente->porcentaje) / 100;

                $inventario = \App\Models\Inventario::find($ingrediente->inventario_id);

                if ($inventario && $inventario->stock_kg >= $consumoIngrediente) {

                    $inventario->stock_kg -= $consumoIngrediente;
                    $inventario->save();

                    \App\Models\MovimientoInventario::create([
                        'inventario_id' => $inventario->id,
                        'tipo' => 'consumo',
                        'cantidad' => $consumoIngrediente,
                        'tipo_origen' => 'alimentacion',
                        'referencia_id' => $animal->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Consumo diario registrado correctamente'
        ]);
    }

    public function resumenFinanciero()
    {
        $historial = \DB::table('movimientos_inventario')
            ->join('inventarios', 'movimientos_inventario.inventario_id', '=', 'inventarios.id')
            ->where('movimientos_inventario.tipo', 'consumo')
            ->where('movimientos_inventario.tipo_origen', 'alimentacion')
            ->select(
                'movimientos_inventario.id',
                'inventarios.nombre_producto',
                'movimientos_inventario.cantidad',
                'inventarios.costo_unitario',
                'movimientos_inventario.created_at',
                \DB::raw('(movimientos_inventario.cantidad * inventarios.costo_unitario) as costo_total')
            )
            ->orderBy('movimientos_inventario.created_at', 'desc')
            ->get();

        $gastoTotal = $historial->sum('costo_total');

        $hoy = now()->toDateString();

        $gastoHoy = $historial
            ->filter(fn($item) =>
                substr($item->created_at, 0, 10) === $hoy
            )
            ->sum('costo_total');

        $valorInventario = \App\Models\Inventario::all()
            ->sum(fn($item) => $item->stock_kg * $item->costo_unitario);

        $cerdosEngorda = \App\Models\Animal::where('area', 'engorda')->count();

        $costoPromedio = $cerdosEngorda > 0
            ? $gastoTotal / $cerdosEngorda
            : 0;

        return response()->json([
            'gasto_hoy' => round($gastoHoy, 2),
            'gasto_total_alimento' => round($gastoTotal, 2),
            'valor_inventario' => round($valorInventario, 2),
            'costo_promedio_cerdo' => round($costoPromedio, 2),
            'historial' => $historial
        ]);
    }

    public function finanzasExcel()
    {
        return Excel::download(
            new FinanzasExport(),
            'PORCYS_Finanzas.xlsx'
        );
    }

    public function finanzasPdf()
    {
        $finanzasController = app(\App\Http\Controllers\FinanzasController::class);

        $response = $finanzasController->resumen();

        $resumen = $response->getData(true);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView(
            'reportes.finanzas',
            [
                'resumen' => $resumen,
                'fechaGeneracion' => now(),
            ]
        );

        return $pdf->download('PORCYS_Reporte_Financiero.pdf');
    }
}