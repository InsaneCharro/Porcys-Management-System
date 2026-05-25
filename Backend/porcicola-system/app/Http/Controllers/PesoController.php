<?php

namespace App\Http\Controllers;

use App\Models\Peso;
use App\Models\Animal;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PesoController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'animal_id' => 'required|exists:animales,id',
            'peso' => 'required|numeric|min:0',
            'fecha' => 'required|date'
        ]);

        $animal = Animal::findOrFail($request->animal_id);

        if ($this->animalNoDisponible($animal->estado)) {
            return response()->json([
                'error' => 'No se permite registrar peso obligatorio en animales vendidos, muertos, descartados o dados de baja.'
            ], 400);
        }

        if (!$animal->fecha_nacimiento) {
            return response()->json([
                'error' => 'El animal no tiene fecha de nacimiento registrada'
            ], 400);
        }

        $fechaNacimiento = Carbon::parse($animal->fecha_nacimiento)->startOfDay();
        $fechaPeso = Carbon::parse($request->fecha)->startOfDay();

        if ($fechaPeso->lt($fechaNacimiento)) {
            return response()->json([
                'error' => 'La fecha del peso no puede ser anterior al nacimiento'
            ], 400);
        }

        $edadDias = $fechaNacimiento->diffInDays($fechaPeso);
        $etapa = $this->etapaPesoObligatorio($edadDias);

        if (!$etapa) {
            return response()->json([
                'error' => $this->mensajeFechaFueraDeVentana($edadDias),
                'edad_dias' => $edadDias,
                'ventanas_validas' => [
                    'dia_10' => 'día 8 al día 12',
                    'dia_28' => 'día 26 al día 30',
                ],
            ], 400);
        }

        $ventana = $this->ventanaPorEtapa($etapa);

        if ($this->existePesoEnVentana($animal, $ventana['desde'], $ventana['hasta'])) {
            return response()->json([
                'error' => 'Ya existe un peso registrado dentro de la ventana de ' . $this->etiquetaEtapa($etapa) . '. No se debe duplicar el peso obligatorio.',
                'etapa' => $etapa,
                'ventana' => $ventana,
            ], 400);
        }

        $existeMismaFecha = Peso::where('animal_id', $request->animal_id)
            ->whereDate('fecha', $request->fecha)
            ->exists();

        if ($existeMismaFecha) {
            return response()->json([
                'error' => 'Ya existe un registro de peso en esa fecha'
            ], 400);
        }

        $ideal = $this->pesoIdeal($edadDias);
        $estado = $request->peso >= ($ideal * 0.9) ? 'normal' : 'bajo';

        $peso = Peso::create([
            'animal_id' => $request->animal_id,
            'peso' => $request->peso,
            'fecha' => $request->fecha,
            'edad_dias' => $edadDias,
            'etapa' => $etapa,
            'estado' => $estado
        ]);

        if ($etapa === 'dia_28') {
            $animal->clasificacion = $this->clasificarPorPeso($request->peso);
            $animal->save();
        }

        return response()->json([
            'mensaje' => 'Peso obligatorio registrado correctamente',
            'estado' => $estado,
            'edad_dias' => $edadDias,
            'etapa' => $etapa,
            'data' => $peso
        ]);
    }

    public function pendientes(Request $request)
    {
        $fechaBase = $request->query('fecha', now()->toDateString());
        $hoy = Carbon::parse($fechaBase)->startOfDay();
        $soloPendientes = !$request->boolean('todos', false);

        $animales = Animal::query()
            ->where(function ($query) {
                $query->whereNull('estado')
                    ->orWhere('estado', 'activo');
            })
            ->orderBy('id', 'desc')
            ->get();

        $resultado = $animales->map(function ($animal) use ($hoy) {
            return $this->controlPesosObligatorios($animal, $hoy);
        })->filter(function ($item) use ($soloPendientes) {
            if (!$soloPendientes) {
                return true;
            }

            return $item['requiere_accion'] === true;
        })->values();

        return response()->json([
            'fecha_revision' => $hoy->toDateString(),
            'total' => $resultado->count(),
            'data' => $resultado,
        ]);
    }

    public function historial($animal_id)
    {
        $pesos = Peso::where('animal_id', $animal_id)
            ->orderBy('fecha', 'asc')
            ->get();

        return response()->json($pesos);
    }

    public function comparacion(Request $request)
    {
        $ids = $request->query('ids');
        $idsArray = explode(',', $ids);
        $data = [];

        foreach ($idsArray as $id) {
            $pesos = Peso::where('animal_id', $id)
                ->orderBy('edad_dias', 'asc')
                ->get(['edad_dias', 'peso']);

            $data[$id] = $pesos;
        }

        return response()->json($data);
    }

    private function pesoIdeal($edad)
    {
        if ($edad <= 10) return 1.2 + ($edad * 0.23);
        if ($edad <= 28) return 3.5 + (($edad - 10) * 0.22);
        if ($edad <= 70) return 7.5 + (($edad - 28) * 0.42);
        if ($edad <= 150) return 25 + (($edad - 70) * 0.94);

        return 100;
    }

    public function alertaCurva($animal_id)
    {
        $pesos = Peso::where('animal_id', $animal_id)
            ->orderBy('edad_dias', 'asc')
            ->get();

        $alertas = [];

        foreach ($pesos as $p) {
            $ideal = $this->pesoIdeal($p->edad_dias);

            if ($p->peso < ($ideal * 0.9)) {
                $alertas[] = [
                    'edad_dias' => $p->edad_dias,
                    'peso_real' => $p->peso,
                    'peso_ideal' => round($ideal, 2),
                    'estado' => 'BAJO'
                ];
            }
        }

        return response()->json([
            'animal_id' => $animal_id,
            'alertas' => $alertas,
            'estado_general' => count($alertas) > 0 ? 'problema' : 'óptimo'
        ]);
    }

    public function ranking()
    {
        $animales = Animal::all();
        $ranking = [];

        foreach ($animales as $animal) {
            $pesos = Peso::where('animal_id', $animal->id)->get();

            if ($pesos->count() == 0) continue;

            $scores = [];

            foreach ($pesos as $p) {
                $ideal = $this->pesoIdeal($p->edad_dias);

                if ($ideal > 0) {
                    $scores[] = $p->peso / $ideal;
                }
            }

            if (count($scores) == 0) continue;

            $promedio = array_sum($scores) / count($scores);

            $ranking[] = [
                'animal_id' => $animal->id,
                'identificador' => $animal->identificador_unico,
                'score' => round($promedio, 2)
            ];
        }

        usort($ranking, function ($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return response()->json($ranking);
    }

    private function clasificarPorPeso($pesoDia28)
    {
        $umbral = 7.0;

        if ($pesoDia28 >= $umbral) {
            return 'pie_cria';
        }

        return 'abasto';
    }

    public function porAnimal($animal_id)
    {
        return Peso::where('animal_id', $animal_id)
            ->orderBy('fecha', 'asc')
            ->get();
    }

    private function etapaPesoObligatorio($edadDias)
    {
        if ($edadDias >= 8 && $edadDias <= 12) {
            return 'dia_10';
        }

        if ($edadDias >= 26 && $edadDias <= 30) {
            return 'dia_28';
        }

        return null;
    }

    private function ventanaPorEtapa($etapa)
    {
        if ($etapa === 'dia_10') {
            return [
                'desde' => 8,
                'hasta' => 12,
            ];
        }

        return [
            'desde' => 26,
            'hasta' => 30,
        ];
    }

    private function etiquetaEtapa($etapa)
    {
        return $etapa === 'dia_10' ? 'día 10' : 'día 28';
    }

    private function mensajeFechaFueraDeVentana($edadDias)
    {
        if ($edadDias < 8) {
            return 'El animal aún no alcanza la ventana de peso obligatorio día 10. La ventana válida es del día 8 al día 12.';
        }

        if ($edadDias >= 13 && $edadDias <= 25) {
            return 'La fecha no corresponde a una ventana obligatoria. Para día 28 usa una fecha entre el día 26 y el día 30.';
        }

        if ($edadDias > 30) {
            return 'La fecha está fuera de la ventana obligatoria de día 28. Para capturar un pendiente atrasado, usa la fecha histórica correcta: nacimiento + 28 días.';
        }

        return 'La fecha no corresponde a una ventana obligatoria de peso.';
    }

    private function existePesoEnVentana($animal, $desde, $hasta)
    {
        return Peso::where('animal_id', $animal->id)
            ->where(function ($query) use ($animal, $desde, $hasta) {
                $query->whereBetween('edad_dias', [$desde, $hasta]);

                if ($animal->fecha_nacimiento) {
                    $fechaNacimiento = Carbon::parse($animal->fecha_nacimiento)->startOfDay();
                    $fechaInicio = $fechaNacimiento->copy()->addDays($desde)->toDateString();
                    $fechaFin = $fechaNacimiento->copy()->addDays($hasta)->toDateString();

                    $query->orWhereBetween('fecha', [$fechaInicio, $fechaFin]);
                }
            })
            ->exists();
    }

    private function controlPesosObligatorios($animal, Carbon $hoy)
    {
        if (!$animal->fecha_nacimiento) {
            return [
                'animal_id' => $animal->id,
                'identificador_unico' => $animal->identificador_unico,
                'sexo' => $animal->sexo,
                'fecha_nacimiento' => null,
                'edad_actual_dias' => null,
                'requiere_accion' => false,
                'estado_general' => 'sin_fecha_nacimiento',
                'pesos' => [
                    'dia_10' => $this->estadoSinFecha(10),
                    'dia_28' => $this->estadoSinFecha(28),
                ],
            ];
        }

        $fechaNacimiento = Carbon::parse($animal->fecha_nacimiento)->startOfDay();
        $edadActual = $fechaNacimiento->diffInDays($hoy, false);

        $dia10 = $this->estadoPesoPorObjetivo($animal, $fechaNacimiento, $edadActual, 10);
        $dia28 = $this->estadoPesoPorObjetivo($animal, $fechaNacimiento, $edadActual, 28);

        $requiereAccion = in_array($dia10['estado'], ['pendiente_en_ventana', 'pendiente_atrasado'])
            || in_array($dia28['estado'], ['pendiente_en_ventana', 'pendiente_atrasado']);

        return [
            'animal_id' => $animal->id,
            'identificador_unico' => $animal->identificador_unico,
            'sexo' => $animal->sexo,
            'fecha_nacimiento' => $animal->fecha_nacimiento,
            'edad_actual_dias' => $edadActual,
            'etapa_actual' => $animal->etapa_actual,
            'estado' => $animal->estado,
            'requiere_accion' => $requiereAccion,
            'estado_general' => $requiereAccion ? 'pendiente' : 'al_corriente',
            'pesos' => [
                'dia_10' => $dia10,
                'dia_28' => $dia28,
            ],
        ];
    }

    private function estadoPesoPorObjetivo($animal, Carbon $fechaNacimiento, $edadActual, $diaObjetivo)
    {
        $desde = $diaObjetivo - 2;
        $hasta = $diaObjetivo + 2;
        $peso = $this->pesoEnVentana($animal, $desde, $hasta, $diaObjetivo);

        if ($peso) {
            return [
                'dia_objetivo' => $diaObjetivo,
                'ventana_inicio_dia' => $desde,
                'ventana_fin_dia' => $hasta,
                'fecha_objetivo' => $fechaNacimiento->copy()->addDays($diaObjetivo)->toDateString(),
                'registrado' => true,
                'estado' => 'registrado',
                'mensaje' => 'Registrado',
                'peso' => $peso,
            ];
        }

        if ($edadActual < $desde) {
            $estado = 'aun_no_corresponde';
            $mensaje = 'Aún no corresponde';
        } elseif ($edadActual <= $hasta) {
            $estado = 'pendiente_en_ventana';
            $mensaje = 'Pendiente en ventana';
        } else {
            $estado = 'pendiente_atrasado';
            $mensaje = 'Pendiente atrasado';
        }

        return [
            'dia_objetivo' => $diaObjetivo,
            'ventana_inicio_dia' => $desde,
            'ventana_fin_dia' => $hasta,
            'fecha_objetivo' => $fechaNacimiento->copy()->addDays($diaObjetivo)->toDateString(),
            'registrado' => false,
            'estado' => $estado,
            'mensaje' => $mensaje,
            'peso' => null,
        ];
    }

    private function estadoSinFecha($diaObjetivo)
    {
        return [
            'dia_objetivo' => $diaObjetivo,
            'ventana_inicio_dia' => $diaObjetivo - 2,
            'ventana_fin_dia' => $diaObjetivo + 2,
            'fecha_objetivo' => null,
            'registrado' => false,
            'estado' => 'sin_fecha_nacimiento',
            'mensaje' => 'No se puede calcular: falta fecha de nacimiento',
            'peso' => null,
        ];
    }

    private function pesoEnVentana($animal, $desde, $hasta, $diaObjetivo)
    {
        $pesos = Peso::where('animal_id', $animal->id)
            ->orderBy('fecha', 'asc')
            ->get();

        $candidatos = $pesos->map(function ($peso) use ($animal, $diaObjetivo) {
            $edadDias = $peso->edad_dias;

            if ($edadDias === null && $animal->fecha_nacimiento && $peso->fecha) {
                $edadDias = Carbon::parse($animal->fecha_nacimiento)
                    ->startOfDay()
                    ->diffInDays(Carbon::parse($peso->fecha)->startOfDay());
            }

            if ($edadDias === null) {
                return null;
            }

            return [
                'id' => $peso->id,
                'peso' => $peso->peso,
                'fecha' => $peso->fecha,
                'edad_dias' => $edadDias,
                'etapa' => $peso->etapa,
                'estado' => $peso->estado,
                'distancia_dias' => abs($edadDias - $diaObjetivo),
            ];
        })->filter(function ($peso) use ($desde, $hasta) {
            return $peso['edad_dias'] >= $desde && $peso['edad_dias'] <= $hasta;
        });

        if ($candidatos->isEmpty()) {
            return null;
        }

        return $candidatos->sortBy('distancia_dias')->first();
    }

    private function animalNoDisponible($estado)
    {
        $normalizado = strtolower(trim(str_replace([' ', '-'], '_', (string) $estado)));

        return in_array($normalizado, [
            'muerto',
            'muerta',
            'vendido',
            'vendida',
            'descartado',
            'descartada',
            'baja',
            'baja_sanitaria',
            'sacrificado',
            'sacrificada',
        ]);
    }
}