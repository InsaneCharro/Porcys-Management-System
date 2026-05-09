<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Animal;
use App\Models\Peso;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function resumen()
    {
        // 🐖 Total animales
        $total = Animal::count();

        // 📊 Por etapa
        $porEtapa = Animal::select(
            'etapa_actual',
            DB::raw('count(*) as total')
        )
        ->groupBy('etapa_actual')
        ->get();

        // ⚖️ Peso promedio por etapa
        $pesoPromedio = DB::table('pesos')
            ->join('animales', 'pesos.animal_id', '=', 'animales.id')
            ->select(
                'animales.etapa_actual as etapa',
                DB::raw('AVG(pesos.peso) as promedio')
            )
            ->groupBy('animales.etapa_actual')
            ->get();

        // ☠️ Mortalidad
        $muertos = Animal::where('estado', 'muerto')->count();

        // 💰 Ventas totales
        $ventasTotales = DB::table('ventas')->exists()
            ? DB::table('ventas')->sum('total')
            : 0;

        // 📦 Stock alimento
        $stockTotal = DB::table('inventarios')->exists()
            ? DB::table('inventarios')->sum('stock_kg')
            : 0;

        // 🤰 Gestaciones activas
        $gestacionesActivas = DB::table('gestaciones')->exists()
            ? DB::table('gestaciones')
                ->whereIn('estado', ['activa', 'confirmada'])
                ->count()
            : 0;

        // ⚠️ ALERTAS DE CRECIMIENTO
        $alertas = [];

        $animales = Animal::all();

        foreach ($animales as $animal) {

            $pesos = Peso::where('animal_id', $animal->id)
                ->orderBy('fecha', 'desc')
                ->take(2)
                ->get();

            if ($pesos->count() == 2) {

                if ($pesos[0]->peso <= $pesos[1]->peso) {

                    $alertas[] = [
                        'animal_id' => $animal->id,
                        'mensaje' => 'No hay crecimiento reciente'
                    ];
                }
            }
        }

        // 🧠 PRODUCCIÓN
        $gestaciones = \App\Models\Gestacion::whereIn(
            'estado',
            ['activa', 'confirmada']
        )->count();

        $partos = \App\Models\Gestacion::where('estado', 'parida')
            ->where('fecha_parto_real', '>=', now()->subDays(30))
            ->count();

        // 💰 ECONÓMICO
        $ventasMes = \App\Models\Venta::whereMonth(
            'fecha',
            now()->month
        )->sum('total');

        $ventasCount = \App\Models\Venta::count();

        $ingresoPromedio = $ventasCount > 0
            ? \App\Models\Venta::sum('total') / $ventasCount
            : 0;

        // 🧪 SANIDAD
        $alertasSanidad = app(
            \App\Http\Controllers\MedicamentoController::class
        )->alertas()->getData();

        // 💊 STOCK BAJO MEDICAMENTOS
        $stockBajo = \App\Models\Medicamento::where(
            'stock',
            '<',
            10
        )->count();

        // 🔴 ANIMALES BAJO CRECIMIENTO
        $bajoCrecimiento = 0;

        foreach ($animales as $animal) {

            $pesos = Peso::where('animal_id', $animal->id)
                ->orderBy('fecha')
                ->get();

            if ($pesos->count() == 0) {
                continue;
            }

            $totalCumplimiento = 0;

            foreach ($pesos as $index => $p) {

                $ideal = 8 + ($index * 3);

                $totalCumplimiento += ($p->peso / $ideal);
            }

            $cumplimiento = (
                $totalCumplimiento / $pesos->count()
            ) * 100;

            if ($cumplimiento < 70) {
                $bajoCrecimiento++;
            }
        }

        // 🚨 ALERTAS DE PARTO
        $alertasParto = \App\Models\Gestacion::with('animal')
            ->where('estado', 'confirmada')
            ->whereNotNull('fecha_probable_parto')
            ->get()
            ->filter(function ($g) {

                $dias = (int) now()
                    ->diffInDays(
                        $g->fecha_probable_parto,
                        false
                    );

                return $dias <= 10;
            })
            ->map(function ($g) {

                $animal = $g->animal;

                return [
                    'animal' => $animal
                        ? $animal->identificador_unico
                        : 'Sin animal',

                    'dias' => (int) now()
                        ->diffInDays(
                            $g->fecha_probable_parto,
                            false
                        )
                ];
            })
            ->values();

        // 🐷 Lechones nacidos hoy
        $lechonesHoy = Animal::whereDate(
            'created_at',
            today()
        )
        ->where('etapa_actual', 'lechon')
        ->count();

        // 🐷 Camadas activas
        $camadasActivas = \App\Models\Camada::where(
            'estado',
            'activa'
        )->count();

        // 🐖 Lechones vivos
        $lechonesVivos = Animal::where(
            'etapa_actual',
            'lechon'
        )
        ->where('estado', 'activo')
        ->count();

        // ⚠️ Partos próximos
        $partosProximos = \App\Models\Gestacion::where(
            'estado',
            'confirmada'
        )
        ->whereDate(
            'fecha_probable_parto',
            '<=',
            now()->addDays(7)
        )
        ->count();

        // 🍼 Destetes pendientes
        $destetesPendientes = \App\Models\Camada::where(
            'estado',
            'activa'
        )
        ->whereDate(
            'fecha_parto',
            '<=',
            now()->subDays(28)
        )
        ->count();

        // 🏠 ESTADO DE CORRALES

        $corrales = \App\Models\Corral::withCount('animales')
            ->get()
            ->map(function ($corral) {

                $capacidad = $corral->capacidad ?? 1;

                $ocupacion = round(
                    ($corral->animales_count / $capacidad) * 100,
                    1
                );

                return [
                    'id' => $corral->id,
                    'nombre' => $corral->nombre,
                    'capacidad' => $capacidad,
                    'ocupados' => $corral->animales_count,
                    'ocupacion' => $ocupacion
                ];
            });

        return response()->json([

            // 🔹 EXISTENTE
            'total_animales' => $total,
            'por_etapa' => $porEtapa,
            'peso_promedio' => $pesoPromedio,
            'muertes' => $muertos,
            'alertas_crecimiento' => $alertas,
            'alertas_parto' => $alertasParto,
            'lechones_hoy' => $lechonesHoy,

            // 🔥 PRODUCCIÓN
            'bajo_crecimiento' => $bajoCrecimiento,
            'gestaciones_activas' => $gestaciones,
            'partos_30d' => $partos,

            // 💰 ECONÓMICO
            'ventas_totales' => $ventasTotales,
            'ventas_mes' => $ventasMes,
            'ingreso_promedio' => round($ingresoPromedio, 2),

            // 📦 INVENTARIO
            'stock_total' => $stockTotal,
            'stock_bajo_medicamentos' => $stockBajo,

            // 🧪 SANIDAD
            'alertas_sanitarias' => count($alertasSanidad),

            // 🐷 MATERNIDAD
            'camadas_activas' => $camadasActivas,
            'lechones_vivos' => $lechonesVivos,
            'partos_proximos' => $partosProximos,
            'destetes_pendientes' => $destetesPendientes,

            'corrales' => $corrales
        ]);
    }

    public function pesosEvolucion()
    {
        $data = \App\Models\Peso::select(
            'edad_dias',
            DB::raw('AVG(peso) as promedio')
        )
        ->groupBy('edad_dias')
        ->orderBy('edad_dias')
        ->get();

        return response()->json($data);
    }

    public function ventasMensuales()
    {
        $data = \App\Models\Venta::select(
            DB::raw('MONTH(fecha) as mes'),
            DB::raw('SUM(total) as total')
        )
        ->groupBy('mes')
        ->orderBy('mes')
        ->get();

        return response()->json($data);
    }

    public function consumoAlimento()
    {
        $data = DB::table('consumo_alimento')
            ->select(
                DB::raw('DATE(fecha) as dia'),
                DB::raw('SUM(cantidad) as total')
            )
            ->groupBy('dia')
            ->orderBy('dia')
            ->get();

        return response()->json($data);
    }

    public function aplicacionesMedicas()
    {
        $data = \App\Models\AplicacionMedica::select(
            DB::raw('DATE(fecha) as dia'),
            DB::raw('COUNT(*) as total')
        )
        ->groupBy('dia')
        ->orderBy('dia')
        ->get();

        return response()->json($data);
    }

    public function ventasPorDia()
    {
        $ventas = DB::table('ventas')
            ->select(
                DB::raw('DATE(fecha) as fecha'),
                DB::raw('SUM(total) as total')
            )
            ->groupBy('fecha')
            ->orderBy('fecha', 'asc')
            ->get();

        return response()->json($ventas);
    }

    public function animalesBajoCrecimiento()
    {
        $animales = Animal::all();

        $resultado = [];

        foreach ($animales as $animal) {

            $pesos = Peso::where(
                'animal_id',
                $animal->id
            )
            ->orderBy('fecha')
            ->get();

            if ($pesos->count() == 0) {
                continue;
            }

            $total = 0;

            $ultimoPeso = null;
            $ultimoIdeal = null;

            foreach ($pesos as $index => $p) {

                $ideal = 8 + ($index * 3);

                $total += ($p->peso / $ideal);

                if ($index === $pesos->count() - 1) {

                    $ultimoPeso = $p->peso;
                    $ultimoIdeal = $ideal;
                }
            }

            $cumplimiento = (
                $total / $pesos->count()
            ) * 100;

            if ($cumplimiento < 70) {

                $diferencia = (
                    ($ultimoPeso - $ultimoIdeal)
                    / $ultimoIdeal
                ) * 100;

                $historialPeso = [];
                $historialIdeal = [];

                foreach ($pesos as $index => $p) {

                    $ideal = 8 + ($index * 3);

                    $historialPeso[] = (float) $p->peso;
                    $historialIdeal[] = $ideal;
                }

                $resultado[] = [
                    'id' => $animal->id,
                    'identificador' => $animal->identificador_unico,
                    'cumplimiento' => round($cumplimiento, 1),
                    'peso' => round($ultimoPeso, 2),
                    'ideal' => round($ultimoIdeal, 2),
                    'diferencia' => round($diferencia, 1),
                    'historial_peso' => $historialPeso,
                    'historial_ideal' => $historialIdeal
                ];
            }
        }

        usort($resultado, function ($a, $b) {
            return $a['cumplimiento']
                <=>
                $b['cumplimiento'];
        });

        return response()->json($resultado);
    }
}