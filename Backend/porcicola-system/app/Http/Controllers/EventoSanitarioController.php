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
        $controlesHierro = $this->obtenerControlesHierroLechones();

        $alertas = [];

        foreach ($controlesHierro as $control) {
            if (in_array($control['estado'], ['pendiente_en_ventana', 'pendiente_atrasado'], true)) {
                $alertas[] = [
                    'animal_id' => $control['animal_id'],
                    'animal' => $control['identificador_unico'],
                    'tipo' => $control['estado'] === 'pendiente_atrasado'
                        ? 'Hierro obligatorio atrasado'
                        : 'Hierro obligatorio pendiente',
                    'evento_obligatorio' => 'hierro_dia_3',
                    'estado' => $control['estado'],
                    'edad' => $control['edad_dias'],
                    'fecha_nacimiento' => $control['fecha_nacimiento'],
                    'mensaje' => $control['mensaje'],
                ];
            }
        }

        $lechones = Animal::where('estado', 'activo')
            ->where('etapa_actual', 'lechon')
            ->whereNotNull('fecha_nacimiento')
            ->get();

        foreach ($lechones as $animal) {
            $edad = \Carbon\Carbon::parse($animal->fecha_nacimiento)
                ->startOfDay()
                ->diffInDays(now()->startOfDay(), false);

            if ($edad >= 21 && $edad <= 30) {
                $alertas[] = [
                    'animal_id' => $animal->id,
                    'animal' => $animal->identificador_unico,
                    'tipo' => 'Vacunación recomendada',
                    'evento_obligatorio' => 'vacunacion_recomendada',
                    'estado' => 'recomendada',
                    'edad' => $edad,
                    'fecha_nacimiento' => $animal->fecha_nacimiento,
                    'mensaje' => 'Revisar esquema sanitario recomendado para lechón de 21 a 30 días.',
                ];
            }
        }

        return response()->json($alertas);
    }

    public function pendientesLechones(Request $request)
    {
        $controles = $this->obtenerControlesHierroLechones();

        if (!$request->boolean('todos')) {
            $controles = array_values(array_filter($controles, function ($control) {
                return in_array($control['estado'], ['pendiente_en_ventana', 'pendiente_atrasado'], true);
            }));
        }

        return response()->json([
            'data' => $controles,
            'resumen' => $this->resumirControlesSanitarios($controles),
        ]);
    }

    private function obtenerControlesHierroLechones(): array
    {
        $lechones = Animal::where('estado', 'activo')
            ->where('etapa_actual', 'lechon')
            ->whereNotNull('fecha_nacimiento')
            ->orderBy('fecha_nacimiento')
            ->get();

        $controles = [];

        foreach ($lechones as $animal) {
            $edad = \Carbon\Carbon::parse($animal->fecha_nacimiento)
                ->startOfDay()
                ->diffInDays(now()->startOfDay(), false);

            $registroHierro = $this->buscarRegistroHierro($animal->id);

            if ($registroHierro) {
                $estado = 'registrado';
            } elseif ($edad < 2) {
                $estado = 'aun_no_corresponde';
            } elseif ($edad <= 4) {
                $estado = 'pendiente_en_ventana';
            } else {
                $estado = 'pendiente_atrasado';
            }

            $controles[] = [
                'animal_id' => $animal->id,
                'identificador_unico' => $animal->identificador_unico,
                'fecha_nacimiento' => $animal->fecha_nacimiento,
                'edad_dias' => $edad,
                'evento_obligatorio' => 'hierro_dia_3',
                'nombre_evento' => 'Hierro obligatorio día 3',
                'dia_objetivo' => 3,
                'ventana_inicio' => 2,
                'ventana_fin' => 4,
                'estado' => $estado,
                'mensaje' => $this->construirMensajeHierro($estado, $edad),
                'medicamento_detectado' => $registroHierro['medicamento'] ?? null,
                'fecha_registro' => $registroHierro['fecha'] ?? null,
                'fuente_registro' => $registroHierro['fuente'] ?? null,
            ];
        }

        return $controles;
    }

    private function buscarRegistroHierro(int $animalId): ?array
    {
        $evento = EventoSanitario::with('medicamento')
            ->where('animal_id', $animalId)
            ->where(function ($query) {
                $query->whereHas('medicamento', function ($medicamentoQuery) {
                    $medicamentoQuery
                        ->where('nombre', 'like', '%hierro%')
                        ->orWhere('nombre', 'like', '%dextr%');
                })
                ->orWhere('observaciones', 'like', '%hierro%')
                ->orWhere('observaciones', 'like', '%dextr%');
            })
            ->orderByDesc('fecha')
            ->first();

        if ($evento) {
            return [
                'fuente' => 'eventos_sanitarios',
                'fecha' => optional($evento->fecha)->format('Y-m-d'),
                'medicamento' => optional($evento->medicamento)->nombre ?: 'Hierro registrado en observaciones',
            ];
        }

        $aplicacion = AplicacionMedica::where('animal_id', $animalId)
            ->where(function ($query) {
                $query->where('medicamento', 'like', '%hierro%')
                    ->orWhere('medicamento', 'like', '%dextr%');
            })
            ->orderByDesc('fecha')
            ->first();

        if ($aplicacion) {
            return [
                'fuente' => 'aplicaciones_medicas',
                'fecha' => $aplicacion->fecha,
                'medicamento' => $aplicacion->medicamento,
            ];
        }

        return null;
    }

    private function construirMensajeHierro(string $estado, int $edad): string
    {
        return match ($estado) {
            'registrado' => 'Hierro obligatorio ya registrado.',
            'aun_no_corresponde' => 'Aún no corresponde aplicar hierro. Ventana sugerida: día 2 a día 4.',
            'pendiente_en_ventana' => 'Aplicar hierro obligatorio. El lechón está dentro de la ventana sanitaria.',
            'pendiente_atrasado' => 'Hierro obligatorio atrasado. Registrar aplicación sanitaria cuanto antes.',
            default => 'Estado sanitario no identificado.',
        };
    }

    private function resumirControlesSanitarios(array $controles): array
    {
        $coleccion = collect($controles);

        return [
            'total_revisados' => $coleccion->count(),
            'registrados' => $coleccion->where('estado', 'registrado')->count(),
            'aun_no_corresponde' => $coleccion->where('estado', 'aun_no_corresponde')->count(),
            'pendientes_en_ventana' => $coleccion->where('estado', 'pendiente_en_ventana')->count(),
            'pendientes_atrasados' => $coleccion->where('estado', 'pendiente_atrasado')->count(),
            'total_pendientes' => $coleccion
                ->whereIn('estado', ['pendiente_en_ventana', 'pendiente_atrasado'])
                ->count(),
        ];
    }
}