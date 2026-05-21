<?php

namespace App\Http\Controllers;

use App\Models\Gestacion;
use App\Models\Animal;
use App\Models\Camada;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GestacionController extends Controller
{
    public function index()
    {
        return Gestacion::with(['animal', 'serviciosReproductivos'])
            ->orderByDesc('id')
            ->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'animal_id' => 'required|exists:animales,id',
            'fecha_inicio' => 'required|date',
            'tipo_servicio' => 'nullable|string'
        ]);

        $animal = Animal::findOrFail($request->animal_id);

        if ($animal->sexo !== 'hembra') {
            return response()->json([
                'error' => 'Solo hembras pueden gestarse'
            ], 400);
        }

        $activa = Gestacion::where('hembra_id', $request->animal_id)
            ->whereIn('estado', ['activa', 'confirmada'])
            ->exists();

        if ($activa) {
            return response()->json([
                'error' => 'La hembra ya tiene una gestación activa'
            ], 400);
        }

        $fechaInicio = Carbon::parse($request->fecha_inicio);

        $gestacion = Gestacion::create([
            'animal_id' => $request->animal_id,
            'hembra_id' => $request->animal_id,
            'fecha_servicio' => $fechaInicio->toDateString(),
            'tipo_servicio' => $request->tipo_servicio ?? 'natural',
            'fecha_inicio' => $fechaInicio->toDateString(),
            'fecha_probable_parto' => $fechaInicio->copy()->addDays(114)->toDateString(),
            'estado' => 'activa',
            'resultado' => null,
            'intentos' => 1,
        ]);

        return response()->json($gestacion->load('animal'), 201);
    }

    public function confirmar($id)
    {
        $gestacion = Gestacion::findOrFail($id);

        if ($gestacion->estado !== 'activa') {
            return response()->json([
                'error' => 'Solo gestaciones activas pueden confirmarse'
            ], 400);
        }

        $gestacion->estado = 'confirmada';
        $gestacion->resultado = 'preñada';
        $gestacion->save();

        return response()->json($gestacion->load('animal'));
    }

    public function marcarFallida($id)
    {
        $gestacion = Gestacion::findOrFail($id);

        if (!in_array($gestacion->estado, ['activa', 'confirmada'])) {
            return response()->json([
                'error' => 'No puede marcarse como fallida'
            ], 400);
        }

        $gestacion->estado = 'fallida';
        $gestacion->resultado = 'no preñada';
        $gestacion->fecha_fin = now();
        $gestacion->save();

        return response()->json($gestacion->load('animal'));
    }

    public function registrarParto(Request $request, $id)
    {
        $request->validate([
            'machos' => 'required|integer|min:0',
            'hembras' => 'required|integer|min:0',
            'muertos' => 'nullable|integer|min:0',
            'pesos' => 'required|array'
        ]);

        $gestacion = Gestacion::findOrFail($id);

        if ($gestacion->estado !== 'confirmada') {
            return response()->json([
                'error' => 'Solo gestaciones confirmadas pueden registrar parto'
            ], 400);
        }

        $machos = $request->machos;
        $hembras = $request->hembras;
        $muertos = $request->muertos ?? 0;

        $vivos = $machos + $hembras;
        $total = $vivos + $muertos;

        if (count($request->pesos) !== $vivos) {
            return response()->json([
                'error' => 'Los pesos deben coincidir con lechones vivos'
            ], 400);
        }

        DB::beginTransaction();

        try {
            $madreId = $gestacion->hembra_id;

            $promedio = collect($request->pesos)->avg();

            $camada = Camada::create([
                'gestacion_id' => $gestacion->id,
                'madre_id' => $madreId,
                'fecha_parto' => now(),
                'total_crias' => $total,
                'machos' => $machos,
                'hembras' => $hembras,
                'muertos' => $muertos,
                'vivos' => $vivos,
                'peso_promedio_nacimiento' => $promedio,
                'estado' => 'activa'
            ]);

            for ($i = 0; $i < $vivos; $i++) {
                Animal::create([
                    'identificador_unico' => $this->generarIdentificador(),
                    'sexo' => $i < $machos ? 'macho' : 'hembra',
                    'peso' => $request->pesos[$i],
                    'madre_id' => $madreId,
                    'fecha_nacimiento' => now(),
                    'etapa_actual' => 'lechon',
                    'estado' => 'activo',
                    'raza' => 'pendiente'
                ]);
            }

            $gestacion->estado = 'parida';
            $gestacion->fecha_parto_real = now();
            $gestacion->fecha_fin = now();
            $gestacion->cantidad_crias = $total;
            $gestacion->save();

            DB::commit();

            return response()->json([
                'mensaje' => 'Parto registrado correctamente',
                'camada' => $camada
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function alertasInteligentes()
    {
        $gestaciones = Gestacion::with('animal')
            ->where('estado', 'confirmada')
            ->get();

        $alertas = [];
        $hoy = now();

        foreach ($gestaciones as $g) {
            if (!$g->fecha_probable_parto) {
                continue;
            }

            $diasRestantes = $hoy->diffInDays($g->fecha_probable_parto, false);

            if ($diasRestantes <= 10 && $diasRestantes >= 0) {
                $alertas[] = [
                    'tipo' => 'proximo_parto',
                    'animal_id' => $g->animal->id ?? null,
                    'identificador' => $g->animal->identificador_unico ?? 'N/A',
                    'dias_restantes' => $diasRestantes,
                    'fecha_parto' => $g->fecha_probable_parto
                ];
            }

            if ($diasRestantes < 0) {
                $alertas[] = [
                    'tipo' => 'parto_atrasado',
                    'animal_id' => $g->animal->id ?? null,
                    'identificador' => $g->animal->identificador_unico ?? 'N/A',
                    'dias_atraso' => abs($diasRestantes)
                ];
            }
        }

        return response()->json([
            'total_alertas' => count($alertas),
            'alertas' => $alertas
        ]);
    }

    public function procesarPartosAutomaticos()
    {
        $gestaciones = Gestacion::where('estado', 'confirmada')
            ->whereNotNull('fecha_probable_parto')
            ->whereDate('fecha_probable_parto', '<=', now()->toDateString())
            ->whereNull('fecha_parto_real')
            ->get();

        return response()->json([
            'mensaje' => 'Proceso automático revisado correctamente',
            'gestaciones_pendientes_de_parto' => $gestaciones->count(),
            'nota' => 'El registro real de parto requiere machos, hembras, muertos y pesos, por eso no se generan lechones sin esos datos.'
        ]);
    }

    private function generarIdentificador()
    {
        $ultimo = Animal::latest('id')->first();
        $numero = $ultimo ? $ultimo->id + 1 : 1;

        return 'L' . str_pad($numero, 4, '0', STR_PAD_LEFT);
    }
}
