<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\Gestacion;
use App\Models\ServicioReproductivo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServicioReproductivoController extends Controller
{
    public function index()
    {
        return ServicioReproductivo::with(['hembra', 'semental', 'gestacion'])
            ->orderByDesc('fecha_servicio')
            ->orderByDesc('id')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hembra_id' => 'required|exists:animales,id',
            'semental_id' => 'nullable|exists:animales,id',
            'tipo_servicio' => 'required|in:natural,inseminacion',
            'fecha_servicio' => 'required|date',
            'observaciones' => 'nullable|string',
        ]);

        $hembra = Animal::findOrFail($validated['hembra_id']);

        if ($hembra->sexo !== 'hembra') {
            return response()->json([
                'error' => 'Solo una hembra puede recibir un servicio reproductivo.'
            ], 400);
        }

        if ($hembra->estado !== 'activo') {
            return response()->json([
                'error' => 'La hembra seleccionada no está activa.'
            ], 400);
        }

        if (!empty($validated['semental_id'])) {
            $semental = Animal::findOrFail($validated['semental_id']);

            if ($semental->sexo !== 'macho') {
                return response()->json([
                    'error' => 'El semental debe ser un animal macho.'
                ], 400);
            }

            if ($semental->estado !== 'activo') {
                return response()->json([
                    'error' => 'El semental seleccionado no está activo.'
                ], 400);
            }
        }

        $gestacionActiva = Gestacion::where('hembra_id', $validated['hembra_id'])
            ->whereIn('estado', ['activa', 'confirmada'])
            ->exists();

        if ($gestacionActiva) {
            return response()->json([
                'error' => 'La hembra ya tiene una gestación activa o confirmada.'
            ], 400);
        }

        $servicioPendiente = ServicioReproductivo::where('hembra_id', $validated['hembra_id'])
            ->where('resultado', 'pendiente')
            ->exists();

        if ($servicioPendiente) {
            return response()->json([
                'error' => 'La hembra ya tiene un servicio reproductivo pendiente de confirmar.'
            ], 400);
        }

        $ultimoIntento = ServicioReproductivo::where('hembra_id', $validated['hembra_id'])
            ->max('numero_intento');

        $servicio = ServicioReproductivo::create([
            'hembra_id' => $validated['hembra_id'],
            'semental_id' => $validated['semental_id'] ?? null,
            'tipo_servicio' => $validated['tipo_servicio'],
            'fecha_servicio' => $validated['fecha_servicio'],
            'numero_intento' => ((int) $ultimoIntento) + 1,
            'resultado' => 'pendiente',
            'fecha_confirmacion' => null,
            'observaciones' => $validated['observaciones'] ?? null,
        ]);

        return response()->json(
            $servicio->load(['hembra', 'semental', 'gestacion']),
            201
        );
    }

    public function actualizarResultado(Request $request, $id)
    {
        $validated = $request->validate([
            'resultado' => 'required|in:preñada,no_preñada',
            'fecha_confirmacion' => 'nullable|date',
            'observaciones' => 'nullable|string',
        ]);

        $servicio = ServicioReproductivo::findOrFail($id);

        if ($servicio->resultado !== 'pendiente') {
            return response()->json([
                'error' => 'Este servicio ya fue confirmado.'
            ], 400);
        }

        DB::beginTransaction();

        try {
            $servicio->resultado = $validated['resultado'];
            $servicio->fecha_confirmacion = $validated['fecha_confirmacion'] ?? now()->toDateString();

            if (array_key_exists('observaciones', $validated)) {
                $servicio->observaciones = $validated['observaciones'];
            }

            if ($validated['resultado'] === 'preñada') {
                $gestacionActiva = Gestacion::where('hembra_id', $servicio->hembra_id)
                    ->whereIn('estado', ['activa', 'confirmada'])
                    ->exists();

                if ($gestacionActiva) {
                    DB::rollBack();

                    return response()->json([
                        'error' => 'La hembra ya tiene una gestación activa o confirmada.'
                    ], 400);
                }

                $fechaServicio = Carbon::parse($servicio->fecha_servicio);

                $gestacion = Gestacion::create([
                    'animal_id' => $servicio->hembra_id,
                    'hembra_id' => $servicio->hembra_id,
                    'fecha_servicio' => $fechaServicio->toDateString(),
                    'fecha_inicio' => $fechaServicio->toDateString(),
                    'fecha_probable_parto' => $fechaServicio->copy()->addDays(114)->toDateString(),
                    'tipo_servicio' => $servicio->tipo_servicio,
                    'estado' => 'confirmada',
                    'resultado' => 'preñada',
                    'intentos' => $servicio->numero_intento,
                    'notas' => $servicio->observaciones,
                ]);

                $servicio->gestacion_id = $gestacion->id;
            }

            $servicio->save();

            DB::commit();

            return response()->json(
                $servicio->load(['hembra', 'semental', 'gestacion'])
            );
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function historialPorHembra($hembraId)
    {
        $hembra = Animal::findOrFail($hembraId);

        $servicios = ServicioReproductivo::with(['semental', 'gestacion'])
            ->where('hembra_id', $hembraId)
            ->orderByDesc('fecha_servicio')
            ->get();

        $total = $servicios->count();
        $exitosos = $servicios->where('resultado', 'preñada')->count();
        $fallidos = $servicios->where('resultado', 'no_preñada')->count();
        $pendientes = $servicios->where('resultado', 'pendiente')->count();

        return response()->json([
            'hembra' => $hembra,
            'resumen' => [
                'total_servicios' => $total,
                'exitosos' => $exitosos,
                'fallidos' => $fallidos,
                'pendientes' => $pendientes,
                'tasa_exito' => $total > 0 ? round(($exitosos / $total) * 100, 2) : 0,
            ],
            'servicios' => $servicios,
        ]);
    }

    public function indicadores()
    {
        $total = ServicioReproductivo::count();
        $pendientes = ServicioReproductivo::where('resultado', 'pendiente')->count();
        $exitosos = ServicioReproductivo::where('resultado', 'preñada')->count();
        $fallidos = ServicioReproductivo::where('resultado', 'no_preñada')->count();

        $hembrasConFallos = ServicioReproductivo::select('hembra_id', DB::raw('COUNT(*) as fallos'))
            ->where('resultado', 'no_preñada')
            ->groupBy('hembra_id')
            ->having('fallos', '>=', 2)
            ->with('hembra')
            ->get();

        return response()->json([
            'total_servicios' => $total,
            'pendientes' => $pendientes,
            'exitosos' => $exitosos,
            'fallidos' => $fallidos,
            'tasa_exito' => $total > 0 ? round(($exitosos / $total) * 100, 2) : 0,
            'hembras_con_fallos' => $hembrasConFallos,
        ]);
    }
}
