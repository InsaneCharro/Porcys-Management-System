<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\Medicamento;
use App\Models\EventoSanitario;
use App\Models\AplicacionMedica;
use App\Models\MovimientoMedicamento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventoSanitarioController extends Controller
{
    public function index()
    {
        return EventoSanitario::with([
            'animal',
            'medicamento'
        ])
        ->orderByDesc('fecha')
        ->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'animal_id' => 'required|exists:animales,id',
            'tipo' => 'required|in:vacuna,tratamiento',
            'medicamento_id' => 'required|exists:medicamentos,id',
            'dosis' => 'required|numeric|min:0.01',
            'fecha' => 'required|date',
            'observaciones' => 'nullable|string'
        ]);

        DB::beginTransaction();

        try {
            $animal = Animal::findOrFail($request->animal_id);

            $medicamento = Medicamento::findOrFail($request->medicamento_id);

            if ($medicamento->stock < 1) {
                return response()->json([
                    'message' => 'Stock insuficiente'
                ], 422);
            }

            $evento = EventoSanitario::create([
                'animal_id' => $request->animal_id,
                'tipo' => $request->tipo,
                'medicamento_id' => $request->medicamento_id,
                'dosis' => $request->dosis,
                'fecha' => $request->fecha,
                'observaciones' => $request->observaciones
            ]);

            AplicacionMedica::create([
                'animal_id' => $animal->id,
                'medicamento' => $medicamento->nombre,
                'dosis' => $request->dosis,
                'fecha' => $request->fecha
            ]);

            $medicamento->stock -= 1;
            $medicamento->save();

            MovimientoMedicamento::create([
                'medicamento_id' => $medicamento->id,
                'tipo' => 'salida',
                'cantidad' => 1,
                'motivo' => 'Evento sanitario: ' . $request->tipo,
                'usuario' => 'Sistema'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'evento' => $evento
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    public function historial($animalId)
    {
        return EventoSanitario::with('medicamento')
            ->where('animal_id', $animalId)
            ->orderByDesc('fecha')
            ->get();
    }

    public function alertas()
    {
        $animales = Animal::where('estado', 'activo')->get();

        $alertas = [];

        foreach ($animales as $animal) {
            if ($animal->etapa_actual === 'lechon') {
                $edad = now()->diffInDays($animal->fecha_nacimiento);

                if ($edad >= 3 && $edad <= 5) {
                    $alertas[] = [
                        'animal' => $animal->identificador_unico,
                        'tipo' => 'Hierro dextrán pendiente',
                        'edad' => $edad
                    ];
                }

                if ($edad >= 21 && $edad <= 30) {
                    $alertas[] = [
                        'animal' => $animal->identificador_unico,
                        'tipo' => 'Vacunación recomendada',
                        'edad' => $edad
                    ];
                }
            }
        }

        return response()->json($alertas);
    }
}