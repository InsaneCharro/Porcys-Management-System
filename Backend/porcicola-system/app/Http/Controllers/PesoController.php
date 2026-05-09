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

        if ($animal->etapa_actual !== 'lechon') {
            return response()->json([
                'error' => 'Solo se permite registrar peso en lechones'
            ], 400);
        }

        // 🔹 VALIDAR que exista fecha de nacimiento
        if (!$animal->fecha_nacimiento) {
            return response()->json([
                'error' => 'El animal no tiene fecha de nacimiento registrada'
            ], 400);
        }

        // 🔹 Normalizar fechas (IMPORTANTE)
        $fechaNacimiento = Carbon::parse($animal->fecha_nacimiento)->startOfDay();
        $fechaPeso = Carbon::parse($request->fecha)->startOfDay();

        // 🔹 Validar que no registren antes de nacer
        if ($fechaPeso->lt($fechaNacimiento)) {
            return response()->json([
                'error' => 'La fecha del peso no puede ser anterior al nacimiento'
            ], 400);
        }

        // 🔹 Calcular edad correctamente (sin errores de hora)
        $edadDias = $fechaNacimiento->diffInDays($fechaPeso);
        $nuevaEtapa = $this->calcularEtapa($edadDias);
        $animal->etapa_actual = $nuevaEtapa;
        $animal->save();
        // 🔹 DEBUG OPCIONAL (puedes quitar luego)
        // return response()->json([
        //     'edad_dias' => $edadDias,
        //     'fecha_nacimiento' => $fechaNacimiento,
        //     'fecha_peso' => $fechaPeso
        // ]);

        // evitar registros antes del día 10
        if ($edadDias < 10) {
            return response()->json([
                'error' => 'El lechón aún no alcanza el día 10'
            ], 400);
        }

        // evitar duplicados por fecha
        $existe = Peso::where('animal_id', $request->animal_id)
            ->whereDate('fecha', $request->fecha)
            ->exists();

        if ($existe) {
            return response()->json([
                'error' => 'Ya existe un registro de peso en esa fecha'
            ], 400);
        }

        // calcular etapa automática
        if ($edadDias >= 10 && $edadDias < 28) {
            $etapa = 'dia_10';
        } else {
            $etapa = 'dia_28';
        }

        // comparar con peso ideal
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

        // CLASIFICACIÓN AUTOMÁTICA
        if ($etapa === 'dia_28') {

            $clasificacion = $this->clasificarPorPeso($request->peso);

            $animal->clasificacion = $clasificacion;
            $animal->save();
        }

        return response()->json([
            'mensaje' => 'Peso registrado correctamente',
            'estado' => $estado,
            'data' => $peso
        ]);
    }

    public function historial($animal_id)
    {
        $pesos = \App\Models\Peso::where('animal_id', $animal_id)
            ->orderBy('fecha', 'asc')
            ->get();

        return response()->json($pesos);
    }

    public function comparacion(Request $request)
    {
        $ids = $request->query('ids'); // ejemplo: 18,17,16

        $idsArray = explode(',', $ids);

        $data = [];

        foreach ($idsArray as $id) {
            $pesos = \App\Models\Peso::where('animal_id', $id)
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
        $pesos = \App\Models\Peso::where('animal_id', $animal_id)
            ->orderBy('edad_dias', 'asc')
            ->get();

        $alertas = [];

        foreach ($pesos as $p) {

            $ideal = $this->pesoIdeal($p->edad_dias);

            // 🔥 umbral 90%
            if ($p->peso < ($ideal * 0.9)) {
                $alertas[] = [
                    'edad_dias' => $p->edad_dias,
                    'peso_real' => $p->peso,
                    'peso_ideal' => round($ideal,2),
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
        $animales = \App\Models\Animal::all();

        $ranking = [];

        foreach ($animales as $animal) {

            $pesos = \App\Models\Peso::where('animal_id', $animal->id)->get();

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

        // ordenar DESC (mejor primero)
        usort($ranking, function ($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return response()->json($ranking);
    }

    private function clasificarPorPeso($pesoDia28)
    {
        $umbral = 7.0; // kg

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
    
}
