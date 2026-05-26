<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class DashboardController extends Controller
{
    public function resumen()
    {
        try {
            $animales = $this->resumenAnimales();
            $mortalidad = $this->resumenMortalidadBajas();
            $corrales = $this->resumenCorrales();
            $reproduccion = $this->resumenReproduccion();
            $alimentacionInventario = $this->resumenAlimentacionInventario();
            $sanidad = $this->resumenSanidad();
            $finanzas = $this->resumenFinanzas($mortalidad);
            $alertasGenerales = $this->resumenAlertasGenerales(
                $mortalidad,
                $corrales,
                $reproduccion,
                $alimentacionInventario,
                $sanidad
            );

            return response()->json([
                // =====================================================
                // CAMPOS LEGADOS: se conservan para no romper Dashboard.jsx
                // =====================================================
                'total_animales' => $animales['total'],
                'por_etapa' => $animales['por_etapa'],
                'peso_promedio' => $this->pesoPromedioPorEtapa(),
                'muertes' => $mortalidad['muertes'],
                'alertas_crecimiento' => $this->alertasCrecimientoReciente(),
                'alertas_parto' => $reproduccion['alertas_parto'],
                'lechones_hoy' => $animales['lechones_hoy'],
                'bajo_crecimiento' => $this->contarAnimalesBajoCrecimiento(),
                'gestaciones_activas' => $reproduccion['hembras_gestantes'],
                'partos_30d' => $reproduccion['partos_ultimos_30_dias'],
                'ventas_totales' => $finanzas['ventas_totales'],
                'ventas_mes' => $finanzas['ventas_mes'],
                'ingreso_promedio' => $finanzas['ingreso_promedio'],
                'stock_total' => $alimentacionInventario['stock_total_kg'],
                'stock_bajo_medicamentos' => $sanidad['medicamentos_bajos'],
                'alertas_sanitarias' => $sanidad['alertas_sanitarias_count'],
                'camadas_activas' => $reproduccion['camadas_activas'],
                'lechones_vivos' => $animales['lechones_vivos'],
                'partos_proximos' => $reproduccion['proximos_partos'],
                'destetes_pendientes' => $reproduccion['destetes_pendientes'],
                'corrales' => $corrales['corrales'],

                // =====================================================
                // NUEVA ESTRUCTURA GERENCIAL ERP - Sprint 11
                // =====================================================
                'animales' => $animales,
                'mortalidad_bajas' => $mortalidad,
                'corrales_resumen' => $corrales,
                'reproduccion' => $reproduccion,
                'alimentacion_inventario' => $alimentacionInventario,
                'sanidad' => $sanidad,
                'finanzas' => $finanzas,
                'alertas_generales' => $alertasGenerales,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'error' => 'Error al construir el dashboard gerencial.',
                'detalle' => $e->getMessage(),
                'linea' => $e->getLine(),
            ], 500);
        }
    }

    private function resumenAnimales(): array
    {
        if (!Schema::hasTable('animales')) {
            return [
                'total' => 0,
                'activos' => 0,
                'muertos' => 0,
                'descartados' => 0,
                'bajas' => 0,
                'vendidos' => 0,
                'lechones_vivos' => 0,
                'lechones_hoy' => 0,
                'por_etapa' => [],
                'por_sexo' => [],
                'por_estado' => [],
            ];
        }

        $total = DB::table('animales')->count();

        $muertos = $this->hasColumn('animales', 'estado')
            ? DB::table('animales')
                ->whereRaw("LOWER(COALESCE(estado, '')) LIKE ?", ['%muert%'])
                ->count()
            : 0;

        $descartados = $this->hasColumn('animales', 'estado')
            ? DB::table('animales')
                ->whereRaw("LOWER(COALESCE(estado, '')) LIKE ?", ['%descart%'])
                ->count()
            : 0;

        $bajas = $this->hasColumn('animales', 'estado')
            ? DB::table('animales')
                ->whereRaw("LOWER(COALESCE(estado, '')) LIKE ?", ['%baja%'])
                ->count()
            : 0;

        $vendidos = $this->hasColumn('animales', 'estado')
            ? DB::table('animales')
                ->whereRaw("LOWER(COALESCE(estado, '')) LIKE ?", ['%vendid%'])
                ->count()
            : 0;

        if ($this->hasColumn('animales', 'estado')) {
            $activosQuery = DB::table('animales')
                ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%muert%'])
                ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%descart%'])
                ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%baja%'])
                ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%vendid%'])
                ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%sacrific%']);
        } else {
            $activosQuery = DB::table('animales');
        }

        $activos = (clone $activosQuery)->count();

        $porEtapa = $this->hasColumn('animales', 'etapa_actual')
            ? (clone $activosQuery)
                ->selectRaw("COALESCE(etapa_actual, 'Sin etapa') as etapa_actual, COUNT(*) as total")
                ->groupBy('etapa_actual')
                ->orderByDesc('total')
                ->get()
            : collect();

        $porSexo = $this->hasColumn('animales', 'sexo')
            ? (clone $activosQuery)
                ->selectRaw("COALESCE(sexo, 'Sin sexo') as sexo, COUNT(*) as total")
                ->groupBy('sexo')
                ->orderByDesc('total')
                ->get()
            : collect();

        $porEstado = $this->hasColumn('animales', 'estado')
            ? DB::table('animales')
                ->selectRaw("COALESCE(estado, 'Sin estado') as estado, COUNT(*) as total")
                ->groupBy('estado')
                ->orderByDesc('total')
                ->get()
            : collect();

        $lechonesVivos = 0;

        if ($this->hasColumn('animales', 'etapa_actual')) {
            $lechonesQuery = DB::table('animales')
                ->whereIn('etapa_actual', ['lechon', 'lechón']);

            if ($this->hasColumn('animales', 'estado')) {
                $lechonesQuery
                    ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%muert%'])
                    ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%descart%'])
                    ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%baja%'])
                    ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%vendid%'])
                    ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%sacrific%']);
            }

            $lechonesVivos = $lechonesQuery->count();
        }

        $lechonesHoy = 0;

        if ($this->hasColumn('animales', 'created_at') && $this->hasColumn('animales', 'etapa_actual')) {
            $lechonesHoyQuery = DB::table('animales')
                ->whereDate('created_at', now()->toDateString())
                ->whereIn('etapa_actual', ['lechon', 'lechón']);

            if ($this->hasColumn('animales', 'estado')) {
                $lechonesHoyQuery
                    ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%muert%'])
                    ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%descart%'])
                    ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%baja%'])
                    ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%vendid%'])
                    ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%sacrific%']);
            }

            $lechonesHoy = $lechonesHoyQuery->count();
        }

        return [
            'total' => $total,
            'activos' => $activos,
            'muertos' => $muertos,
            'descartados' => $descartados,
            'bajas' => $bajas,
            'vendidos' => $vendidos,
            'lechones_vivos' => $lechonesVivos,
            'lechones_hoy' => $lechonesHoy,
            'por_etapa' => $porEtapa,
            'por_sexo' => $porSexo,
            'por_estado' => $porEstado,
        ];
    }

    private function resumenMortalidadBajas(): array
    {
        if (!Schema::hasTable('muertes')) {
            return [
                'total' => 0,
                'muertes' => 0,
                'descartes' => 0,
                'ultimos_30_dias' => 0,
                'muertes_recientes' => 0,
                'descartes_recientes' => 0,
                'principal_causa' => null,
                'perdida_estimada_total' => 0,
                'por_causa' => [],
                'por_etapa' => [],
                'recientes' => [],
                'alertas' => [],
            ];
        }

        $total = DB::table('muertes')->count();

        $muertes = $this->hasColumn('muertes', 'tipo_baja')
            ? DB::table('muertes')->where('tipo_baja', 'muerte')->count()
            : $total;

        $descartes = $this->hasColumn('muertes', 'tipo_baja')
            ? DB::table('muertes')->where('tipo_baja', 'descarte')->count()
            : 0;

        $ultimos30 = $this->hasColumn('muertes', 'fecha')
            ? DB::table('muertes')->whereDate('fecha', '>=', now()->subDays(30)->toDateString())->count()
            : 0;

        $muertesRecientes = 0;
        $descartesRecientes = 0;

        if ($this->hasColumn('muertes', 'fecha') && $this->hasColumn('muertes', 'tipo_baja')) {
            $muertesRecientes = DB::table('muertes')
                ->where('tipo_baja', 'muerte')
                ->whereDate('fecha', '>=', now()->subDays(30)->toDateString())
                ->count();

            $descartesRecientes = DB::table('muertes')
                ->where('tipo_baja', 'descarte')
                ->whereDate('fecha', '>=', now()->subDays(30)->toDateString())
                ->count();
        }

        $porCausa = $this->hasColumn('muertes', 'causa')
            ? DB::table('muertes')
                ->selectRaw("COALESCE(causa, 'Sin causa') as causa, COUNT(*) as total")
                ->groupBy('causa')
                ->orderByDesc('total')
                ->get()
            : collect();

        $principalCausa = $porCausa->first();

        $porEtapa = $this->hasColumn('muertes', 'etapa_animal_snapshot')
            ? DB::table('muertes')
                ->selectRaw("COALESCE(etapa_animal_snapshot, 'Sin etapa') as etapa, COUNT(*) as total")
                ->groupBy('etapa_animal_snapshot')
                ->orderByDesc('total')
                ->get()
            : collect();

        $perdidaEstimada = $this->hasColumn('muertes', 'costo_estimado_perdida')
            ? (float) DB::table('muertes')->sum('costo_estimado_perdida')
            : 0;

        $recientes = DB::table('muertes')
            ->when($this->hasColumn('muertes', 'fecha'), function ($query) {
                $query->orderByDesc('fecha');
            })
            ->orderByDesc('id')
            ->limit(8)
            ->get();

        $alertas = [];

        if ($muertesRecientes >= 5) {
            $alertas[] = [
                'tipo' => 'alta_mortalidad',
                'nivel' => 'critica',
                'mensaje' => 'Alta mortalidad reciente: ' . $muertesRecientes . ' muertes en los últimos 30 días.',
            ];
        }

        if ($this->hasColumn('muertes', 'causa') && $this->hasColumn('muertes', 'fecha')) {
            $causasRepetidas = DB::table('muertes')
                ->selectRaw('causa, COUNT(*) as total')
                ->whereDate('fecha', '>=', now()->subDays(30)->toDateString())
                ->groupBy('causa')
                ->having('total', '>=', 3)
                ->orderByDesc('total')
                ->get();

            foreach ($causasRepetidas as $causa) {
                $alertas[] = [
                    'tipo' => 'causa_repetida',
                    'nivel' => 'importante',
                    'mensaje' => 'Causa repetida detectada: ' . ($causa->causa ?? 'Sin causa') . ' con ' . $causa->total . ' casos recientes.',
                ];
            }
        }

        return [
            'total' => $total,
            'muertes' => $muertes,
            'descartes' => $descartes,
            'ultimos_30_dias' => $ultimos30,
            'muertes_recientes' => $muertesRecientes,
            'descartes_recientes' => $descartesRecientes,
            'principal_causa' => $principalCausa,
            'perdida_estimada_total' => round($perdidaEstimada, 2),
            'por_causa' => $porCausa,
            'por_etapa' => $porEtapa,
            'recientes' => $recientes,
            'alertas' => $alertas,
        ];
    }

    private function resumenCorrales(): array
    {
        if (!Schema::hasTable('corrales')) {
            return [
                'total' => 0,
                'capacidad_total' => 0,
                'ocupados' => 0,
                'espacios_disponibles' => 0,
                'corrales_saturados' => 0,
                'corrales_en_riesgo' => 0,
                'corrales' => [],
                'por_tipo' => [],
                'alertas' => [],
            ];
        }

        $corralesBase = DB::table('corrales')->get();

        $corrales = collect();
        $capacidadTotal = 0;
        $ocupadosTotal = 0;
        $saturados = 0;
        $enRiesgo = 0;
        $alertas = [];

        foreach ($corralesBase as $corral) {
            $capacidad = isset($corral->capacidad) && (int) $corral->capacidad > 0
                ? (int) $corral->capacidad
                : 0;

            $tipoCorral = $this->hasColumn('corrales', 'tipo_corral')
                ? ($corral->tipo_corral ?? 'general')
                : 'general';

            $ocupados = 0;

            if (Schema::hasTable('animales') && $this->hasColumn('animales', 'corral_id')) {
                $ocupadosQuery = DB::table('animales')
                    ->where('corral_id', $corral->id);

                if ($this->hasColumn('animales', 'estado')) {
                    $ocupadosQuery
                        ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%muert%'])
                        ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%descart%'])
                        ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%baja%'])
                        ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%vendid%'])
                        ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%sacrific%']);
                }

                $ocupados = $ocupadosQuery->count();
            }

            $ocupacion = $capacidad > 0 ? round(($ocupados / $capacidad) * 100, 1) : 0;
            $disponibles = max($capacidad - $ocupados, 0);

            $saturado = $capacidad > 0 && $ocupacion >= 100;
            $riesgo = $capacidad > 0 && $ocupacion >= 85 && $ocupacion < 100;

            $estadoOcupacion = 'disponible';

            if ($saturado) {
                $estadoOcupacion = 'lleno';
                $saturados++;

                $alertas[] = [
                    'tipo' => 'corral_saturado',
                    'nivel' => 'critica',
                    'mensaje' => 'Corral lleno: ' . ($corral->nombre ?? ('Corral #' . $corral->id)) . ' (' . $tipoCorral . ') con ' . $ocupacion . '% de ocupación.',
                ];
            } elseif ($riesgo) {
                $estadoOcupacion = 'casi_lleno';
                $enRiesgo++;

                $alertas[] = [
                    'tipo' => 'corral_casi_lleno',
                    'nivel' => 'advertencia',
                    'mensaje' => 'Corral casi lleno: ' . ($corral->nombre ?? ('Corral #' . $corral->id)) . ' (' . $tipoCorral . ') con ' . $ocupacion . '% de ocupación.',
                ];
            } elseif ($ocupacion >= 60) {
                $estadoOcupacion = 'ocupacion_media';
            }

            $capacidadTotal += $capacidad;
            $ocupadosTotal += $ocupados;

            $corrales->push([
                'id' => $corral->id,
                'nombre' => $corral->nombre ?? ('Corral #' . $corral->id),
                'capacidad' => $capacidad,
                'tipo_corral' => $tipoCorral,
                'ocupados' => $ocupados,
                'disponibles' => $disponibles,
                'ocupacion' => $ocupacion,
                'porcentaje_ocupacion' => $ocupacion,
                'estado_ocupacion' => $estadoOcupacion,
                'saturado' => $saturado,
                'en_riesgo' => $riesgo,
            ]);
        }

        $porTipo = $corrales
            ->groupBy('tipo_corral')
            ->map(function ($grupo, $tipo) {
                $capacidad = $grupo->sum('capacidad');
                $ocupados = $grupo->sum('ocupados');

                return [
                    'tipo_corral' => $tipo,
                    'corrales' => $grupo->count(),
                    'capacidad' => $capacidad,
                    'ocupados' => $ocupados,
                    'disponibles' => max($capacidad - $ocupados, 0),
                    'porcentaje_ocupacion' => $capacidad > 0 ? round(($ocupados / $capacidad) * 100, 1) : 0,
                ];
            })
            ->values();

        return [
            'total' => $corralesBase->count(),
            'capacidad_total' => $capacidadTotal,
            'ocupados' => $ocupadosTotal,
            'espacios_disponibles' => max($capacidadTotal - $ocupadosTotal, 0),
            'corrales_saturados' => $saturados,
            'corrales_en_riesgo' => $enRiesgo,
            'corrales' => $corrales,
            'por_tipo' => $porTipo,
            'alertas' => $alertas,
        ];
    }

    private function resumenReproduccion(): array
    {
        $estadosGestantes = ['activa', 'confirmada', 'gestante'];

        $hembrasGestantes = 0;
        $proximosPartos = 0;
        $partosUltimos30 = 0;
        $alertasParto = collect();
        $partosAtrasados = 0;

        if (Schema::hasTable('gestaciones')) {
            if ($this->hasColumn('gestaciones', 'estado')) {
                $hembrasGestantes = DB::table('gestaciones')
                    ->whereIn('estado', $estadosGestantes)
                    ->count();
            }

            if ($this->hasColumn('gestaciones', 'fecha_probable_parto')) {
                $proximosQuery = DB::table('gestaciones')
                    ->whereNotNull('fecha_probable_parto')
                    ->whereDate('fecha_probable_parto', '>=', now()->toDateString())
                    ->whereDate('fecha_probable_parto', '<=', now()->addDays(10)->toDateString());

                if ($this->hasColumn('gestaciones', 'estado')) {
                    $proximosQuery->whereIn('estado', $estadosGestantes);
                }

                $proximosPartos = $proximosQuery->count();

                $atrasadosQuery = DB::table('gestaciones')
                    ->whereNotNull('fecha_probable_parto')
                    ->whereDate('fecha_probable_parto', '<', now()->toDateString());

                if ($this->hasColumn('gestaciones', 'estado')) {
                    $atrasadosQuery->whereIn('estado', $estadosGestantes);
                }

                $partosAtrasados = $atrasadosQuery->count();

                $alertasQuery = DB::table('gestaciones')
                    ->whereNotNull('gestaciones.fecha_probable_parto')
                    ->whereDate('gestaciones.fecha_probable_parto', '<=', now()->addDays(10)->toDateString())
                    ->when($this->hasColumn('gestaciones', 'estado'), function ($query) use ($estadosGestantes) {
                        $query->whereIn('gestaciones.estado', $estadosGestantes);
                    });

                $puedeUnirAnimal = Schema::hasTable('animales')
                    && $this->hasColumn('animales', 'id')
                    && $this->hasColumn('animales', 'identificador_unico')
                    && ($this->hasColumn('gestaciones', 'hembra_id') || $this->hasColumn('gestaciones', 'animal_id'));

                if ($puedeUnirAnimal) {
                    $alertasQuery->leftJoin('animales', function ($join) {
                        if ($this->hasColumn('gestaciones', 'hembra_id')) {
                            $join->on('gestaciones.hembra_id', '=', 'animales.id');
                        }

                        if ($this->hasColumn('gestaciones', 'animal_id')) {
                            $join->orOn('gestaciones.animal_id', '=', 'animales.id');
                        }
                    })
                    ->select(
                        'gestaciones.id',
                        'gestaciones.fecha_probable_parto',
                        'animales.identificador_unico as animal'
                    );
                } else {
                    $alertasQuery->select(
                        'gestaciones.id',
                        'gestaciones.fecha_probable_parto',
                        DB::raw("'Sin animal' as animal")
                    );
                }

                $alertasParto = $alertasQuery
                    ->orderBy('gestaciones.fecha_probable_parto')
                    ->limit(10)
                    ->get()
                    ->map(function ($g) {
                        return [
                            'gestacion_id' => $g->id,
                            'animal' => $g->animal ?? 'Sin animal',
                            'fecha_probable_parto' => $g->fecha_probable_parto,
                            'dias' => now()->startOfDay()->diffInDays($g->fecha_probable_parto, false),
                        ];
                    });
            }

            if ($this->hasColumn('gestaciones', 'fecha_parto_real')) {
                $partosUltimos30 = DB::table('gestaciones')
                    ->whereDate('fecha_parto_real', '>=', now()->subDays(30)->toDateString())
                    ->count();
            }
        }

        $serviciosPendientes = 0;
        $totalServicios = 0;
        $serviciosExitosos = 0;
        $serviciosFallidos = 0;
        $tasaExito = 0;

        if (Schema::hasTable('servicios_reproductivos')) {
            $totalServicios = DB::table('servicios_reproductivos')->count();

            if ($this->hasColumn('servicios_reproductivos', 'resultado')) {
                $serviciosPendientes = DB::table('servicios_reproductivos')
                    ->where('resultado', 'pendiente')
                    ->count();

                $serviciosExitosos = DB::table('servicios_reproductivos')
                    ->where('resultado', 'preñada')
                    ->count();

                $serviciosFallidos = DB::table('servicios_reproductivos')
                    ->where('resultado', 'no_preñada')
                    ->count();

                $serviciosConfirmados = $serviciosExitosos + $serviciosFallidos;
                $tasaExito = $serviciosConfirmados > 0
                    ? round(($serviciosExitosos / $serviciosConfirmados) * 100, 2)
                    : 0;
            }
        }

        $camadasActivas = 0;
        $destetesPendientes = 0;

        if (Schema::hasTable('camadas')) {
            if ($this->hasColumn('camadas', 'estado')) {
                $camadasActivas = DB::table('camadas')->where('estado', 'activa')->count();
            } else {
                $camadasActivas = DB::table('camadas')->count();
            }

            if ($this->hasColumn('camadas', 'fecha_parto')) {
                $destetesQuery = DB::table('camadas')
                    ->whereDate('fecha_parto', '<=', now()->subDays(28)->toDateString());

                if ($this->hasColumn('camadas', 'estado')) {
                    $destetesQuery->where('estado', 'activa');
                }

                $destetesPendientes = $destetesQuery->count();
            }
        }

        return [
            'hembras_gestantes' => $hembrasGestantes,
            'proximos_partos' => $proximosPartos,
            'partos_atrasados' => $partosAtrasados,
            'partos_ultimos_30_dias' => $partosUltimos30,
            'servicios_pendientes' => $serviciosPendientes,
            'total_servicios' => $totalServicios,
            'servicios_exitosos' => $serviciosExitosos,
            'servicios_fallidos' => $serviciosFallidos,
            'tasa_exito_reproductivo' => $tasaExito,
            'camadas_activas' => $camadasActivas,
            'destetes_pendientes' => $destetesPendientes,
            'alertas_parto' => $alertasParto,
        ];
    }

    private function resumenAlimentacionInventario(): array
    {
        $stockTotal = 0;
        $stockCritico = collect();
        $ingredientesBajos = 0;

        if (Schema::hasTable('inventarios')) {
            if ($this->hasColumn('inventarios', 'stock_kg')) {
                $stockTotal = (float) DB::table('inventarios')->sum('stock_kg');

                $stockCritico = DB::table('inventarios')
                    ->where('stock_kg', '<', 50)
                    ->orderBy('stock_kg')
                    ->limit(10)
                    ->get();

                $ingredientesBajos = DB::table('inventarios')
                    ->where('stock_kg', '<', 50)
                    ->count();
            }
        }

        $consumoRecienteKg = 0;
        $consumosRecientes = collect();

        if (Schema::hasTable('consumos_alimentacion')) {
            $consumoQuery = DB::table('consumos_alimentacion');

            if ($this->hasColumn('consumos_alimentacion', 'fecha')) {
                $consumoQuery->whereDate('fecha', '>=', now()->subDays(30)->toDateString());
            }

            if ($this->hasColumn('consumos_alimentacion', 'cantidad_kg')) {
                $consumoRecienteKg = (float) $consumoQuery->sum('cantidad_kg');
            }

            $consumosRecientes = DB::table('consumos_alimentacion')
                ->when($this->hasColumn('consumos_alimentacion', 'fecha'), function ($query) {
                    $query->orderByDesc('fecha');
                })
                ->orderByDesc('id')
                ->limit(8)
                ->get();
        }

        $alertas = [];

        foreach ($stockCritico as $producto) {
            $nombre = $producto->nombre_producto
                ?? $producto->nombre
                ?? ('Inventario #' . $producto->id);

            $alertas[] = [
                'tipo' => 'stock_bajo',
                'nivel' => ((float) ($producto->stock_kg ?? 0) <= 0) ? 'critica' : 'importante',
                'mensaje' => 'Stock bajo en ' . $nombre . ': ' . round((float) ($producto->stock_kg ?? 0), 2) . ' kg.',
            ];
        }

        return [
            'stock_total_kg' => round($stockTotal, 2),
            'stock_critico_count' => $stockCritico->count(),
            'ingredientes_bajos' => $ingredientesBajos,
            'stock_critico' => $stockCritico,
            'consumo_ultimos_30_dias_kg' => round($consumoRecienteKg, 2),
            'consumos_recientes' => $consumosRecientes,
            'alertas' => $alertas,
        ];
    }

    private function resumenSanidad(): array
    {
        $eventosRecientesCount = 0;
        $eventosRecientes = collect();

        if (Schema::hasTable('eventos_sanitarios')) {
            $eventosQuery = DB::table('eventos_sanitarios');

            if ($this->hasColumn('eventos_sanitarios', 'fecha')) {
                $eventosQuery->whereDate('fecha', '>=', now()->subDays(30)->toDateString());
            }

            $eventosRecientesCount = $eventosQuery->count();

            $eventosRecientes = DB::table('eventos_sanitarios')
                ->when($this->hasColumn('eventos_sanitarios', 'fecha'), function ($query) {
                    $query->orderByDesc('fecha');
                })
                ->orderByDesc('id')
                ->limit(8)
                ->get();
        }

        $medicamentosBajos = 0;
        $medicamentosCriticos = collect();
        $medicamentosSinStock = 0;
        $hierroDisponible = 0;
        $hierroStockTotal = 0;
        $hierroEstado = 'sin_registro';

        if (Schema::hasTable('medicamentos') && $this->hasColumn('medicamentos', 'stock')) {
            $todosMedicamentos = DB::table('medicamentos')
                ->orderBy('stock')
                ->orderBy('nombre')
                ->get();

            $medicamentosCriticos = $todosMedicamentos
                ->filter(function ($medicamento) {
                    $stock = (int) ($medicamento->stock ?? 0);
                    $nombre = strtolower((string) ($medicamento->nombre ?? ''));

                    $esHierro = str_contains($nombre, 'hierro') || str_contains($nombre, 'dextr');
                    $umbralBajo = $esHierro ? 20 : 10;

                    return $stock <= $umbralBajo;
                })
                ->map(function ($medicamento) {
                    $stock = (int) ($medicamento->stock ?? 0);
                    $nombre = strtolower((string) ($medicamento->nombre ?? ''));

                    $esHierro = str_contains($nombre, 'hierro') || str_contains($nombre, 'dextr');
                    $umbralBajo = $esHierro ? 20 : 10;
                    $umbralCritico = 5;

                    if ($stock <= 0) {
                        $nivel = 'sin_stock';
                        $prioridad = 'critica';
                    } elseif ($stock <= $umbralCritico) {
                        $nivel = 'critico';
                        $prioridad = 'critica';
                    } else {
                        $nivel = 'bajo';
                        $prioridad = 'importante';
                    }

                    return [
                        'id' => $medicamento->id,
                        'nombre' => $medicamento->nombre,
                        'descripcion' => $medicamento->descripcion ?? null,
                        'stock' => $stock,
                        'precio_unitario' => $medicamento->precio_unitario ?? 0,
                        'es_hierro' => $esHierro,
                        'nivel' => $nivel,
                        'prioridad' => $prioridad,
                        'umbral_bajo' => $umbralBajo,
                        'umbral_critico' => $umbralCritico,
                        'mensaje' => $esHierro
                            ? 'Revisar suministro de hierro para controles obligatorios de lechones.'
                            : 'Revisar stock de medicamento.',
                        'accion_sugerida' => $esHierro
                            ? 'Programar entrada de hierro antes de aplicar controles sanitarios obligatorios.'
                            : 'Programar compra o registrar entrada.',
                    ];
                })
                ->values();

            $medicamentosBajos = $medicamentosCriticos->count();

            $medicamentosSinStock = $todosMedicamentos
                ->filter(function ($medicamento) {
                    return (int) ($medicamento->stock ?? 0) <= 0;
                })
                ->count();

            $medicamentosHierro = $todosMedicamentos
                ->filter(function ($medicamento) {
                    $nombre = strtolower((string) ($medicamento->nombre ?? ''));

                    return str_contains($nombre, 'hierro') || str_contains($nombre, 'dextr');
                });

            $hierroStockTotal = $medicamentosHierro
                ->sum(function ($medicamento) {
                    return (int) ($medicamento->stock ?? 0);
                });

            $hierroDisponible = $medicamentosHierro
                ->filter(function ($medicamento) {
                    return (int) ($medicamento->stock ?? 0) > 0;
                })
                ->count();

            if ($medicamentosHierro->count() === 0) {
                $hierroEstado = 'sin_registro';
            } elseif ($hierroStockTotal <= 0) {
                $hierroEstado = 'sin_stock';
            } elseif ($hierroStockTotal <= 5) {
                $hierroEstado = 'critico';
            } elseif ($hierroStockTotal <= 20) {
                $hierroEstado = 'bajo';
            } else {
                $hierroEstado = 'suficiente';
            }
        }

        $alertas = [];

        foreach ($medicamentosCriticos as $medicamento) {
            $alertas[] = [
                'tipo' => $medicamento['es_hierro'] ? 'hierro_stock_bajo' : 'medicamento_bajo',
                'nivel' => $medicamento['prioridad'],
                'mensaje' => $medicamento['nombre'] . ' tiene stock ' . $medicamento['nivel'] . ' (' . $medicamento['stock'] . ' disponibles).',
                'accion_sugerida' => $medicamento['accion_sugerida'],
            ];
        }

        if ($hierroEstado === 'sin_registro') {
            $alertas[] = [
                'tipo' => 'hierro_no_registrado',
                'nivel' => 'critica',
                'mensaje' => 'No hay medicamento de hierro registrado. No se puede garantizar el control obligatorio día 3.',
                'accion_sugerida' => 'Registrar Hierro o Hierro dextrán en Medicamentos.',
            ];
        }

        if (Schema::hasTable('animales') && $this->hasColumn('animales', 'fecha_nacimiento') && $this->hasColumn('animales', 'etapa_actual')) {
            $lechones = DB::table('animales')
                ->whereIn('etapa_actual', ['lechon', 'lechón'])
                ->whereNotNull('fecha_nacimiento')
                ->when($this->hasColumn('animales', 'estado'), function ($query) {
                    $query->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%muert%'])
                        ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%descart%'])
                        ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%baja%'])
                        ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%vendid%'])
                        ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%sacrific%']);
                })
                ->limit(300)
                ->get();

            foreach ($lechones as $lechon) {
                $edad = now()->diffInDays($lechon->fecha_nacimiento, false);
                $edad = abs((int) $edad);

                if ($edad >= 3 && $edad <= 5) {
                    $nivel = in_array($hierroEstado, ['sin_registro', 'sin_stock', 'critico'], true)
                        ? 'critica'
                        : 'importante';

                    $alertas[] = [
                        'tipo' => 'hierro_pendiente',
                        'nivel' => $nivel,
                        'mensaje' => 'Hierro obligatorio pendiente para ' . ($lechon->identificador_unico ?? ('Animal #' . $lechon->id)) . '. Estado de stock: ' . $hierroEstado . '.',
                        'accion_sugerida' => 'Aplicar hierro si hay stock suficiente; si no, registrar entrada primero.',
                    ];
                }

                if ($edad >= 21 && $edad <= 30) {
                    $alertas[] = [
                        'tipo' => 'vacunacion_recomendada',
                        'nivel' => 'informativa',
                        'mensaje' => 'Vacunación recomendada para ' . ($lechon->identificador_unico ?? ('Animal #' . $lechon->id)) . '.',
                        'accion_sugerida' => 'Revisar protocolo sanitario.',
                    ];
                }
            }
        }

        return [
            'eventos_sanitarios_recientes' => $eventosRecientesCount,
            'eventos_recientes' => $eventosRecientes,
            'medicamentos_bajos' => $medicamentosBajos,
            'medicamentos_sin_stock' => $medicamentosSinStock,
            'medicamentos_criticos' => $medicamentosCriticos,
            'hierro' => [
                'estado' => $hierroEstado,
                'stock_total' => $hierroStockTotal,
                'presentaciones_disponibles' => $hierroDisponible,
            ],
            'alertas_sanitarias_count' => count($alertas),
            'alertas' => $alertas,
        ];
    }

    private function resumenFinanzas(array $mortalidad): array
    {
        $ventasTotales = 0;
        $ventasMes = 0;
        $ventasCount = 0;
        $ingresoPromedio = 0;

        if (Schema::hasTable('ventas')) {
            $ventasCount = DB::table('ventas')->count();

            if ($this->hasColumn('ventas', 'total')) {
                $ventasTotales = (float) DB::table('ventas')->sum('total');

                if ($this->hasColumn('ventas', 'fecha')) {
                    $ventasMes = (float) DB::table('ventas')
                        ->whereMonth('fecha', now()->month)
                        ->whereYear('fecha', now()->year)
                        ->sum('total');
                }

                $ingresoPromedio = $ventasCount > 0
                    ? round($ventasTotales / $ventasCount, 2)
                    : 0;
            }
        }

        $comprasTotales = 0;

        if (Schema::hasTable('ordenes_compra')) {
            foreach (['total', 'total_estimado', 'monto_total'] as $columna) {
                if ($this->hasColumn('ordenes_compra', $columna)) {
                    $comprasTotales = (float) DB::table('ordenes_compra')->sum($columna);
                    break;
                }
            }
        }

        return [
            'ventas_totales' => round($ventasTotales, 2),
            'ventas_mes' => round($ventasMes, 2),
            'ventas_count' => $ventasCount,
            'ingreso_promedio' => $ingresoPromedio,
            'compras_totales' => round($comprasTotales, 2),
            'perdidas_por_bajas' => $mortalidad['perdida_estimada_total'] ?? 0,
            'balance_basico' => round($ventasTotales - $comprasTotales - ($mortalidad['perdida_estimada_total'] ?? 0), 2),
        ];
    }

    private function resumenAlertasGenerales(
        array $mortalidad,
        array $corrales,
        array $reproduccion,
        array $alimentacionInventario,
        array $sanidad
    ): array {
        $alertas = [];

        $alertas = array_merge($alertas, $mortalidad['alertas'] ?? []);
        $alertas = array_merge($alertas, $corrales['alertas'] ?? []);
        $alertas = array_merge($alertas, $alimentacionInventario['alertas'] ?? []);
        $alertas = array_merge($alertas, $sanidad['alertas'] ?? []);

        if (($reproduccion['partos_atrasados'] ?? 0) > 0) {
            $alertas[] = [
                'tipo' => 'partos_atrasados',
                'nivel' => 'critica',
                'mensaje' => 'Hay ' . $reproduccion['partos_atrasados'] . ' gestaciones con parto atrasado.',
            ];
        }

        if (($reproduccion['proximos_partos'] ?? 0) > 0) {
            $alertas[] = [
                'tipo' => 'partos_proximos',
                'nivel' => 'importante',
                'mensaje' => 'Hay ' . $reproduccion['proximos_partos'] . ' partos próximos en los siguientes 10 días.',
            ];
        }

        $criticas = collect($alertas)->where('nivel', 'critica')->count();
        $importantes = collect($alertas)->where('nivel', 'importante')->count();
        $informativas = collect($alertas)->where('nivel', 'informativa')->count();

        return [
            'total' => count($alertas),
            'criticas' => $criticas,
            'importantes' => $importantes,
            'informativas' => $informativas,
            'ultimas' => array_slice($alertas, 0, 12),
        ];
    }

    public function pesosEvolucion()
    {
        if (!Schema::hasTable('pesos') || !$this->hasColumn('pesos', 'peso')) {
            return response()->json([]);
        }

        if ($this->hasColumn('pesos', 'edad_dias')) {
            $data = DB::table('pesos')
                ->select('edad_dias', DB::raw('AVG(peso) as promedio'))
                ->groupBy('edad_dias')
                ->orderBy('edad_dias')
                ->get();

            return response()->json($data);
        }

        if ($this->hasColumn('pesos', 'fecha') && Schema::hasTable('animales') && $this->hasColumn('animales', 'fecha_nacimiento')) {
            $data = DB::table('pesos')
                ->join('animales', 'pesos.animal_id', '=', 'animales.id')
                ->whereNotNull('animales.fecha_nacimiento')
                ->selectRaw('DATEDIFF(pesos.fecha, animales.fecha_nacimiento) as edad_dias, AVG(pesos.peso) as promedio')
                ->groupBy('edad_dias')
                ->orderBy('edad_dias')
                ->get();

            return response()->json($data);
        }

        return response()->json([]);
    }

    public function ventasMensuales()
    {
        if (!Schema::hasTable('ventas') || !$this->hasColumn('ventas', 'fecha') || !$this->hasColumn('ventas', 'total')) {
            return response()->json([]);
        }

        $data = DB::table('ventas')
            ->select(DB::raw('MONTH(fecha) as mes'), DB::raw('SUM(total) as total'))
            ->groupBy('mes')
            ->orderBy('mes')
            ->get();

        return response()->json($data);
    }

    public function consumoAlimento()
    {
        if (Schema::hasTable('consumos_alimentacion') && $this->hasColumn('consumos_alimentacion', 'cantidad_kg')) {
            $data = DB::table('consumos_alimentacion')
                ->select(
                    DB::raw($this->hasColumn('consumos_alimentacion', 'fecha') ? 'DATE(fecha) as dia' : 'DATE(created_at) as dia'),
                    DB::raw('SUM(cantidad_kg) as total')
                )
                ->groupBy('dia')
                ->orderBy('dia')
                ->get();

            return response()->json($data);
        }

        if (Schema::hasTable('consumo_alimento') && $this->hasColumn('consumo_alimento', 'cantidad')) {
            $data = DB::table('consumo_alimento')
                ->select(DB::raw('DATE(fecha) as dia'), DB::raw('SUM(cantidad) as total'))
                ->groupBy('dia')
                ->orderBy('dia')
                ->get();

            return response()->json($data);
        }

        return response()->json([]);
    }

    public function aplicacionesMedicas()
    {
        if (Schema::hasTable('eventos_sanitarios')) {
            $fecha = $this->hasColumn('eventos_sanitarios', 'fecha') ? 'fecha' : 'created_at';

            if ($this->hasColumn('eventos_sanitarios', $fecha)) {
                $data = DB::table('eventos_sanitarios')
                    ->select(DB::raw('DATE(' . $fecha . ') as dia'), DB::raw('COUNT(*) as total'))
                    ->groupBy('dia')
                    ->orderBy('dia')
                    ->get();

                return response()->json($data);
            }
        }

        if (Schema::hasTable('aplicaciones_medicas')) {
            $fecha = $this->hasColumn('aplicaciones_medicas', 'fecha') ? 'fecha' : 'created_at';

            if ($this->hasColumn('aplicaciones_medicas', $fecha)) {
                $data = DB::table('aplicaciones_medicas')
                    ->select(DB::raw('DATE(' . $fecha . ') as dia'), DB::raw('COUNT(*) as total'))
                    ->groupBy('dia')
                    ->orderBy('dia')
                    ->get();

                return response()->json($data);
            }
        }

        return response()->json([]);
    }

    public function ventasPorDia()
    {
        if (!Schema::hasTable('ventas') || !$this->hasColumn('ventas', 'fecha') || !$this->hasColumn('ventas', 'total')) {
            return response()->json([]);
        }

        $ventas = DB::table('ventas')
            ->select(DB::raw('DATE(fecha) as fecha'), DB::raw('SUM(total) as total'))
            ->groupBy('fecha')
            ->orderBy('fecha', 'asc')
            ->get();

        return response()->json($ventas);
    }

    public function animalesBajoCrecimiento()
    {
        return response()->json($this->obtenerAnimalesBajoCrecimiento());
    }

    private function pesoPromedioPorEtapa()
    {
        if (!Schema::hasTable('pesos') || !Schema::hasTable('animales')) {
            return collect();
        }

        if (!$this->hasColumn('pesos', 'animal_id') || !$this->hasColumn('pesos', 'peso') || !$this->hasColumn('animales', 'etapa_actual')) {
            return collect();
        }

        return DB::table('pesos')
            ->join('animales', 'pesos.animal_id', '=', 'animales.id')
            ->select('animales.etapa_actual as etapa', DB::raw('AVG(pesos.peso) as promedio'))
            ->groupBy('animales.etapa_actual')
            ->get();
    }

    private function alertasCrecimientoReciente(): array
    {
        if (!Schema::hasTable('animales') || !Schema::hasTable('pesos')) {
            return [];
        }

        if (!$this->hasColumn('pesos', 'animal_id') || !$this->hasColumn('pesos', 'peso')) {
            return [];
        }

        $animales = DB::table('animales')->select('id', 'identificador_unico')->limit(500)->get();
        $alertas = [];

        foreach ($animales as $animal) {
            $pesos = DB::table('pesos')
                ->where('animal_id', $animal->id)
                ->orderByDesc($this->hasColumn('pesos', 'fecha') ? 'fecha' : 'id')
                ->limit(2)
                ->get();

            if ($pesos->count() === 2 && (float) $pesos[0]->peso <= (float) $pesos[1]->peso) {
                $alertas[] = [
                    'animal_id' => $animal->id,
                    'identificador' => $animal->identificador_unico ?? null,
                    'mensaje' => 'No hay crecimiento reciente',
                ];
            }
        }

        return $alertas;
    }

    private function contarAnimalesBajoCrecimiento(): int
    {
        return count($this->obtenerAnimalesBajoCrecimiento());
    }

    private function obtenerAnimalesBajoCrecimiento(): array
    {
        if (!Schema::hasTable('animales') || !Schema::hasTable('pesos')) {
            return [];
        }

        if (!$this->hasColumn('pesos', 'animal_id') || !$this->hasColumn('pesos', 'peso')) {
            return [];
        }

        $animales = DB::table('animales')
            ->select('id', 'identificador_unico')
            ->limit(500)
            ->get();

        $resultado = [];

        foreach ($animales as $animal) {
            $pesos = DB::table('pesos')
                ->where('animal_id', $animal->id)
                ->orderBy($this->hasColumn('pesos', 'fecha') ? 'fecha' : 'id')
                ->get();

            if ($pesos->count() === 0) {
                continue;
            }

            $totalCumplimiento = 0;
            $ultimoPeso = null;
            $ultimoIdeal = null;
            $historialPeso = [];
            $historialIdeal = [];

            foreach ($pesos as $index => $peso) {
                $ideal = 8 + ($index * 3);
                $pesoReal = (float) $peso->peso;

                $totalCumplimiento += ($pesoReal / $ideal);
                $historialPeso[] = $pesoReal;
                $historialIdeal[] = $ideal;

                if ($index === $pesos->count() - 1) {
                    $ultimoPeso = $pesoReal;
                    $ultimoIdeal = $ideal;
                }
            }

            $cumplimiento = ($totalCumplimiento / $pesos->count()) * 100;

            if ($cumplimiento < 70 && $ultimoIdeal > 0) {
                $resultado[] = [
                    'id' => $animal->id,
                    'identificador' => $animal->identificador_unico,
                    'cumplimiento' => round($cumplimiento, 1),
                    'peso' => round($ultimoPeso, 2),
                    'ideal' => round($ultimoIdeal, 2),
                    'diferencia' => round((($ultimoPeso - $ultimoIdeal) / $ultimoIdeal) * 100, 1),
                    'historial_peso' => $historialPeso,
                    'historial_ideal' => $historialIdeal,
                ];
            }
        }

        usort($resultado, function ($a, $b) {
            return $a['cumplimiento'] <=> $b['cumplimiento'];
        });

        return $resultado;
    }

    private function hasColumn(string $table, string $column): bool
    {
        return Schema::hasTable($table) && Schema::hasColumn($table, $column);
    }
}
