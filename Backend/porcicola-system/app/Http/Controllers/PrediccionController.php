<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class PrediccionController extends Controller
{
    public function resumen()
    {
        try {
            $alimento = $this->prediccionAlimento();
            $partos = $this->prediccionPartos();
            $corrales = $this->prediccionCorrales($partos);
            $riesgos = $this->riesgosOperativos($alimento, $partos, $corrales);

            return response()->json([
                'fecha_calculo' => now()->toDateTimeString(),
                'mensaje' => 'Predicciones calculadas en modo solo lectura. No se modificaron datos.',
                'alimento' => $alimento,
                'partos' => $partos,
                'corrales' => $corrales,
                'riesgos' => $riesgos,
                'resumen_ejecutivo' => [
                    'consumo_diario_kg' => $alimento['totales']['diario_kg'] ?? 0,
                    'consumo_30_dias_kg' => $alimento['totales']['30_dias_kg'] ?? 0,
                    'cobertura_alimento_dias' => $alimento['inventario']['dias_cobertura'] ?? null,
                    'partos_30_dias' => $partos['rangos']['30_dias'] ?? 0,
                    'corrales_en_riesgo' => $corrales['totales']['corrales_en_riesgo'] ?? 0,
                    'riesgos_criticos' => $riesgos['conteo']['criticos'] ?? 0,
                    'riesgos_altos' => $riesgos['conteo']['altos'] ?? 0,
                ],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'error' => 'No se pudieron calcular las predicciones.',
                'detalle' => $e->getMessage(),
                'linea' => $e->getLine(),
            ], 500);
        }
    }

    public function alimento()
    {
        return response()->json($this->prediccionAlimento());
    }

    public function partos()
    {
        return response()->json($this->prediccionPartos());
    }

    public function corrales()
    {
        $partos = $this->prediccionPartos();
        return response()->json($this->prediccionCorrales($partos));
    }

    public function riesgos()
    {
        $alimento = $this->prediccionAlimento();
        $partos = $this->prediccionPartos();
        $corrales = $this->prediccionCorrales($partos);

        return response()->json($this->riesgosOperativos($alimento, $partos, $corrales));
    }

    private function prediccionAlimento(): array
    {
        $tasas = [
            'lechon' => 0.8,
            'destete' => 1.2,
            'engorda' => 2.8,
            'gestante' => 2.5,
            'maternidad' => 5.0,
            'lactante' => 5.0,
            'reproductor' => 2.7,
            'reproductora' => 2.7,
            'sementales' => 2.7,
            'enfermeria' => 1.5,
            'general' => 2.0,
        ];

        $porEtapa = [];
        $totalAnimales = 0;
        $consumoDiario = 0.0;

        if (Schema::hasTable('animales')) {
            $query = DB::table('animales');
            $query = $this->soloAnimalesActivos($query);

            $animales = $query->get();

            foreach ($animales as $animal) {
                $etapaOriginal = $this->leerEtapaAnimal($animal);
                $etapa = $this->clasificarEtapa($etapaOriginal, $animal);
                $tasa = $tasas[$etapa] ?? $tasas['general'];

                if (!isset($porEtapa[$etapa])) {
                    $porEtapa[$etapa] = [
                        'etapa' => $etapa,
                        'descripcion' => $this->descripcionEtapa($etapa),
                        'tasa_kg_dia_por_animal' => $tasa,
                        'animales' => 0,
                        'consumo_diario_kg' => 0,
                        'consumo_30_dias_kg' => 0,
                        'consumo_90_dias_kg' => 0,
                        'consumo_365_dias_kg' => 0,
                    ];
                }

                $porEtapa[$etapa]['animales']++;
                $porEtapa[$etapa]['consumo_diario_kg'] += $tasa;
                $totalAnimales++;
                $consumoDiario += $tasa;
            }
        }

        foreach ($porEtapa as $etapa => $datos) {
            $porEtapa[$etapa]['consumo_diario_kg'] = round($datos['consumo_diario_kg'], 2);
            $porEtapa[$etapa]['consumo_30_dias_kg'] = round($datos['consumo_diario_kg'] * 30, 2);
            $porEtapa[$etapa]['consumo_90_dias_kg'] = round($datos['consumo_diario_kg'] * 90, 2);
            $porEtapa[$etapa]['consumo_365_dias_kg'] = round($datos['consumo_diario_kg'] * 365, 2);
        }

        $stockAlimento = $this->stockAlimento();
        $diasCobertura = $consumoDiario > 0
            ? round($stockAlimento['stock_total_kg'] / $consumoDiario, 1)
            : null;

        $riesgo = 'normal';

        if ($consumoDiario > 0 && $stockAlimento['stock_total_kg'] <= 0) {
            $riesgo = 'critico';
        } elseif ($diasCobertura !== null && $diasCobertura < 30) {
            $riesgo = 'critico';
        } elseif ($diasCobertura !== null && $diasCobertura < 90) {
            $riesgo = 'alto';
        }

        return [
            'nota' => 'Estimación con tasas internas fijas por etapa. No sustituye una formulación nutricional formal.',
            'tasas_kg_dia' => $tasas,
            'animales_por_etapa' => array_values($porEtapa),
            'totales' => [
                'animales_activos' => $totalAnimales,
                'diario_kg' => round($consumoDiario, 2),
                '30_dias_kg' => round($consumoDiario * 30, 2),
                '90_dias_kg' => round($consumoDiario * 90, 2),
                '365_dias_kg' => round($consumoDiario * 365, 2),
            ],
            'inventario' => [
                'stock_total_kg' => round($stockAlimento['stock_total_kg'], 2),
                'productos_considerados' => $stockAlimento['productos'],
                'dias_cobertura' => $diasCobertura,
                'riesgo' => $riesgo,
            ],
        ];
    }

    private function prediccionPartos(): array
    {
        $lista = [];
        $rangos = [
            '7_dias' => 0,
            '15_dias' => 0,
            '30_dias' => 0,
            '60_dias' => 0,
        ];

        if (!Schema::hasTable('gestaciones') || !Schema::hasColumn('gestaciones', 'fecha_probable_parto')) {
            return [
                'total_proximos_60_dias' => 0,
                'rangos' => $rangos,
                'lista' => [],
                'nota' => 'No existe tabla gestaciones o columna fecha_probable_parto.',
            ];
        }

        $estadosGestantes = ['activa', 'confirmada', 'gestante', 'preñada', 'prenada'];
        $hoy = now()->startOfDay();
        $limite = now()->addDays(60)->endOfDay();

        $query = DB::table('gestaciones')
            ->whereNotNull('gestaciones.fecha_probable_parto')
            ->whereDate('gestaciones.fecha_probable_parto', '>=', $hoy->toDateString())
            ->whereDate('gestaciones.fecha_probable_parto', '<=', $limite->toDateString());

        if (Schema::hasColumn('gestaciones', 'estado')) {
            $query->whereIn('gestaciones.estado', $estadosGestantes);
        }

        $idHembra = $this->columnaHembraGestacion();

        if ($idHembra && Schema::hasTable('animales')) {
            $query->leftJoin('animales', 'animales.id', '=', "gestaciones.$idHembra");
            $query->select(
                'gestaciones.id',
                "gestaciones.$idHembra as hembra_id",
                'gestaciones.fecha_probable_parto',
                'gestaciones.estado',
                'animales.identificador_unico',
                'animales.raza'
            );
        } else {
            $query->select(
                'gestaciones.id',
                'gestaciones.fecha_probable_parto',
                'gestaciones.estado'
            );
        }

        $gestaciones = $query->orderBy('gestaciones.fecha_probable_parto')->get();

        foreach ($gestaciones as $g) {
            $fecha = Carbon::parse($g->fecha_probable_parto)->startOfDay();
            $dias = (int) $hoy->diffInDays($fecha, false);

            if ($dias <= 7) {
                $rangos['7_dias']++;
            }

            if ($dias <= 15) {
                $rangos['15_dias']++;
            }

            if ($dias <= 30) {
                $rangos['30_dias']++;
            }

            if ($dias <= 60) {
                $rangos['60_dias']++;
            }

            $lista[] = [
                'gestacion_id' => $g->id,
                'hembra_id' => $g->hembra_id ?? null,
                'identificador' => $g->identificador_unico ?? 'Sin identificador',
                'raza' => $g->raza ?? null,
                'fecha_probable_parto' => $fecha->toDateString(),
                'dias_restantes' => $dias,
                'urgencia' => $this->urgenciaParto($dias),
                'estado' => $g->estado ?? null,
            ];
        }

        return [
            'total_proximos_60_dias' => count($lista),
            'rangos' => $rangos,
            'lista' => $lista,
        ];
    }

    private function prediccionCorrales(array $partos = []): array
    {
        $corrales = [];
        $totales = [
            'corrales' => 0,
            'capacidad_total' => 0,
            'ocupados_total' => 0,
            'disponibles_total' => 0,
            'corrales_en_riesgo' => 0,
        ];
        $porTipo = [];

        if (!Schema::hasTable('corrales')) {
            return [
                'totales' => $totales,
                'por_tipo' => [],
                'corrales' => [],
                'riesgo_maternidad' => null,
                'nota' => 'No existe tabla corrales.',
            ];
        }

        $registros = DB::table('corrales')->orderBy('nombre')->get();

        foreach ($registros as $corral) {
            $capacidad = (int) ($corral->capacidad ?? 0);
            $tipo = $corral->tipo_corral ?? 'general';
            $ocupados = $this->ocupadosCorral((int) $corral->id);
            $disponibles = max($capacidad - $ocupados, 0);
            $porcentaje = $capacidad > 0 ? round(($ocupados / $capacidad) * 100, 1) : 0;
            $estado = $this->estadoOcupacion($ocupados, $capacidad);

            $corrales[] = [
                'id' => $corral->id,
                'nombre' => $corral->nombre ?? ('Corral #' . $corral->id),
                'tipo_corral' => $tipo,
                'capacidad' => $capacidad,
                'ocupados' => $ocupados,
                'disponibles' => $disponibles,
                'porcentaje_ocupacion' => $porcentaje,
                'estado' => $estado,
            ];

            $totales['corrales']++;
            $totales['capacidad_total'] += $capacidad;
            $totales['ocupados_total'] += $ocupados;
            $totales['disponibles_total'] += $disponibles;

            if (in_array($estado, ['saturado', 'critico', 'alto'], true)) {
                $totales['corrales_en_riesgo']++;
            }

            if (!isset($porTipo[$tipo])) {
                $porTipo[$tipo] = [
                    'tipo_corral' => $tipo,
                    'corrales' => 0,
                    'capacidad' => 0,
                    'ocupados' => 0,
                    'disponibles' => 0,
                ];
            }

            $porTipo[$tipo]['corrales']++;
            $porTipo[$tipo]['capacidad'] += $capacidad;
            $porTipo[$tipo]['ocupados'] += $ocupados;
            $porTipo[$tipo]['disponibles'] += $disponibles;
        }

        $partos30 = $partos['rangos']['30_dias'] ?? 0;
        $espaciosMaternidad = collect($corrales)
            ->filter(fn ($c) => $this->normalizar($c['tipo_corral']) === 'maternidad')
            ->sum('disponibles');

        $riesgoMaternidad = [
            'partos_30_dias' => $partos30,
            'espacios_maternidad_disponibles' => $espaciosMaternidad,
            'hay_riesgo' => $partos30 > $espaciosMaternidad,
            'nivel' => $partos30 > $espaciosMaternidad ? 'alto' : 'normal',
            'mensaje' => $partos30 > $espaciosMaternidad
                ? 'Los partos próximos superan los espacios disponibles de maternidad.'
                : 'Los espacios de maternidad parecen suficientes para los próximos 30 días.',
        ];

        return [
            'totales' => $totales,
            'por_tipo' => array_values($porTipo),
            'corrales' => $corrales,
            'riesgo_maternidad' => $riesgoMaternidad,
        ];
    }

    private function riesgosOperativos(array $alimento, array $partos, array $corrales): array
    {
        $riesgos = [];

        $riesgoAlimento = $alimento['inventario']['riesgo'] ?? 'normal';

        if (in_array($riesgoAlimento, ['critico', 'alto'], true)) {
            $riesgos[] = [
                'tipo' => 'alimento_insuficiente',
                'nivel' => $riesgoAlimento,
                'titulo' => 'Cobertura de alimento insuficiente',
                'mensaje' => 'El stock actual cubre aproximadamente ' . ($alimento['inventario']['dias_cobertura'] ?? 0) . ' días.',
            ];
        }

        foreach (($corrales['corrales'] ?? []) as $corral) {
            if (in_array($corral['estado'], ['saturado', 'critico', 'alto'], true)) {
                $riesgos[] = [
                    'tipo' => 'corral_' . $corral['estado'],
                    'nivel' => $corral['estado'] === 'saturado' ? 'critico' : $corral['estado'],
                    'titulo' => 'Riesgo de ocupación en corral',
                    'mensaje' => $corral['nombre'] . ' está al ' . $corral['porcentaje_ocupacion'] . '% de ocupación.',
                ];
            }
        }

        if (($partos['rangos']['7_dias'] ?? 0) > 0) {
            $riesgos[] = [
                'tipo' => 'partos_proximos',
                'nivel' => 'critico',
                'titulo' => 'Partos próximos en 7 días',
                'mensaje' => 'Hay ' . $partos['rangos']['7_dias'] . ' parto(s) probable(s) en los próximos 7 días.',
            ];
        } elseif (($partos['rangos']['15_dias'] ?? 0) > 0) {
            $riesgos[] = [
                'tipo' => 'partos_proximos',
                'nivel' => 'alto',
                'titulo' => 'Partos próximos en 15 días',
                'mensaje' => 'Hay ' . $partos['rangos']['15_dias'] . ' parto(s) probable(s) en los próximos 15 días.',
            ];
        }

        $riesgoMaternidad = $corrales['riesgo_maternidad'] ?? null;

        if (($riesgoMaternidad['hay_riesgo'] ?? false) === true) {
            $riesgos[] = [
                'tipo' => 'maternidad_saturacion',
                'nivel' => 'alto',
                'titulo' => 'Riesgo de saturación en maternidad',
                'mensaje' => $riesgoMaternidad['mensaje'],
            ];
        }

        foreach ($this->riesgosMedicamentos() as $riesgoMedicamento) {
            $riesgos[] = $riesgoMedicamento;
        }

        $conteo = [
            'total' => count($riesgos),
            'criticos' => collect($riesgos)->where('nivel', 'critico')->count(),
            'altos' => collect($riesgos)->where('nivel', 'alto')->count(),
            'medios' => collect($riesgos)->where('nivel', 'medio')->count(),
            'normales' => collect($riesgos)->where('nivel', 'normal')->count(),
        ];

        return [
            'conteo' => $conteo,
            'lista' => $riesgos,
        ];
    }

    private function stockAlimento(): array
    {
        if (!Schema::hasTable('inventarios') || !Schema::hasColumn('inventarios', 'stock_kg')) {
            return [
                'stock_total_kg' => 0,
                'productos' => [],
            ];
        }

        $productos = DB::table('inventarios')
            ->select('id', 'nombre_producto', 'stock_kg')
            ->orderBy('nombre_producto')
            ->get()
            ->map(function ($producto) {
                return [
                    'id' => $producto->id,
                    'nombre_producto' => $producto->nombre_producto,
                    'stock_kg' => round((float) $producto->stock_kg, 2),
                ];
            })
            ->values()
            ->all();

        return [
            'stock_total_kg' => collect($productos)->sum('stock_kg'),
            'productos' => $productos,
        ];
    }

    private function riesgosMedicamentos(): array
    {
        if (!Schema::hasTable('medicamentos') || !Schema::hasColumn('medicamentos', 'stock')) {
            return [];
        }

        $medicamentos = DB::table('medicamentos')
            ->where('stock', '<', 10)
            ->orderBy('stock')
            ->limit(10)
            ->get();

        $riesgos = [];

        foreach ($medicamentos as $medicamento) {
            $stock = (float) ($medicamento->stock ?? 0);

            $riesgos[] = [
                'tipo' => 'medicamento_bajo',
                'nivel' => $stock <= 0 ? 'critico' : 'alto',
                'titulo' => 'Medicamento con stock bajo',
                'mensaje' => ($medicamento->nombre ?? ('Medicamento #' . $medicamento->id)) . ' tiene stock de ' . $stock . '.',
            ];
        }

        return $riesgos;
    }

    private function ocupadosCorral(int $corralId): int
    {
        if (!Schema::hasTable('animales') || !Schema::hasColumn('animales', 'corral_id')) {
            return 0;
        }

        $query = DB::table('animales')->where('corral_id', $corralId);
        $query = $this->soloAnimalesActivos($query);

        return $query->count();
    }

    private function soloAnimalesActivos($query)
    {
        if (!Schema::hasColumn('animales', 'estado')) {
            return $query;
        }

        return $query
            ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%muert%'])
            ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%descart%'])
            ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%baja%'])
            ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%vendid%'])
            ->whereRaw("LOWER(COALESCE(estado, '')) NOT LIKE ?", ['%sacrific%']);
    }

    private function leerEtapaAnimal(object $animal): string
    {
        if (isset($animal->etapa_actual) && $animal->etapa_actual !== null) {
            return (string) $animal->etapa_actual;
        }

        if (isset($animal->etapa) && $animal->etapa !== null) {
            return (string) $animal->etapa;
        }

        return 'general';
    }

    private function clasificarEtapa(string $etapaOriginal, object $animal): string
    {
        $etapa = $this->normalizar($etapaOriginal);
        $sexo = $this->normalizar((string) ($animal->sexo ?? ''));

        if (str_contains($etapa, 'lechon') || str_contains($etapa, 'lechón')) {
            return 'lechon';
        }

        if (str_contains($etapa, 'destete')) {
            return 'destete';
        }

        if (str_contains($etapa, 'engorda') || str_contains($etapa, 'finalizacion') || str_contains($etapa, 'finalización')) {
            return 'engorda';
        }

        if (str_contains($etapa, 'gest')) {
            return 'gestante';
        }

        if (str_contains($etapa, 'matern') || str_contains($etapa, 'lact')) {
            return 'maternidad';
        }

        if (str_contains($etapa, 'reproduct') || str_contains($etapa, 'semental')) {
            return str_contains($sexo, 'hembra') ? 'reproductora' : 'reproductor';
        }

        if (str_contains($etapa, 'enferm')) {
            return 'enfermeria';
        }

        return 'general';
    }

    private function descripcionEtapa(string $etapa): string
    {
        return match ($etapa) {
            'lechon' => 'Lechones lactantes o recién nacidos',
            'destete' => 'Animales en etapa de destete',
            'engorda' => 'Animales en crecimiento/engorda/finalización',
            'gestante' => 'Hembras gestantes',
            'maternidad', 'lactante' => 'Hembras en maternidad o lactancia',
            'reproductor', 'reproductora', 'sementales' => 'Animales reproductores',
            'enfermeria' => 'Animales en enfermería',
            default => 'Animales sin etapa específica',
        };
    }

    private function columnaHembraGestacion(): ?string
    {
        if (Schema::hasColumn('gestaciones', 'hembra_id')) {
            return 'hembra_id';
        }

        if (Schema::hasColumn('gestaciones', 'animal_id')) {
            return 'animal_id';
        }

        return null;
    }

    private function urgenciaParto(int $dias): string
    {
        if ($dias <= 7) {
            return 'critico';
        }

        if ($dias <= 15) {
            return 'alto';
        }

        if ($dias <= 30) {
            return 'medio';
        }

        return 'bajo';
    }

    private function estadoOcupacion(int $ocupados, int $capacidad): string
    {
        if ($capacidad <= 0) {
            return 'sin_capacidad';
        }

        $porcentaje = ($ocupados / $capacidad) * 100;

        if ($ocupados >= $capacidad) {
            return 'saturado';
        }

        if ($porcentaje >= 90) {
            return 'critico';
        }

        if ($porcentaje >= 75) {
            return 'alto';
        }

        return 'normal';
    }

    private function normalizar(string $valor): string
    {
        $valor = trim(mb_strtolower($valor));
        $valor = str_replace(['á', 'é', 'í', 'ó', 'ú', 'ñ'], ['a', 'e', 'i', 'o', 'u', 'n'], $valor);
        $valor = str_replace(['_', '-'], ' ', $valor);

        return preg_replace('/\s+/', ' ', $valor) ?: '';
    }
}