<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\Corral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class CorralController extends Controller
{
    public function index()
    {
        $corrales = Corral::with([
                'animales' => function ($query) {
                    $query
                        ->whereNotIn('estado', $this->estadosBloqueadosOriginales())
                        ->orderBy('identificador_unico');
                }
            ])
            ->orderBy('id')
            ->get()
            ->map(function ($corral) {
                $animales = $corral->animales->filter(function ($animal) {
                    return !$this->animalBloqueadoPorEstado($animal);
                })->values();

                $ocupados = $animales->count();
                $capacidad = (int) $corral->capacidad;
                $disponibles = max($capacidad - $ocupados, 0);

                return [
                    'id' => $corral->id,
                    'nombre' => $corral->nombre,
                    'capacidad' => $capacidad,
                    'tipo_corral' => $corral->tipo_corral ?? 'general',
                    'ocupados' => $ocupados,
                    'disponibles' => $disponibles,
                    'porcentaje_ocupacion' => $capacidad > 0 ? round(($ocupados / $capacidad) * 100, 2) : 0,
                    'estado_ocupacion' => $this->estadoOcupacion($ocupados, $capacidad),

                    // Compatibilidad temporal con frontend viejo.
                    'lechones_count' => $ocupados,
                    'animales_count' => $ocupados,

                    'animales' => $animales->map(function ($animal) {
                        return $this->formatearAnimal($animal);
                    })->values(),
                ];
            });

        return response()->json($corrales);
    }

    public function show($id)
    {
        $corral = Corral::with([
                'animales' => function ($query) {
                    $query->orderBy('identificador_unico');
                }
            ])
            ->findOrFail($id);

        $animalesActivos = $corral->animales->filter(function ($animal) {
            return !$this->animalBloqueadoPorEstado($animal);
        })->values();

        $ocupados = $animalesActivos->count();
        $capacidad = (int) $corral->capacidad;

        return response()->json([
            'id' => $corral->id,
            'nombre' => $corral->nombre,
            'capacidad' => $capacidad,
            'tipo_corral' => $corral->tipo_corral ?? 'general',
            'ocupados' => $ocupados,
            'disponibles' => max($capacidad - $ocupados, 0),
            'porcentaje_ocupacion' => $capacidad > 0 ? round(($ocupados / $capacidad) * 100, 2) : 0,
            'estado_ocupacion' => $this->estadoOcupacion($ocupados, $capacidad),
            'animales' => $animalesActivos->map(function ($animal) {
                return $this->formatearAnimal($animal);
            })->values(),
            'animales_bloqueados_en_corral' => $corral->animales
                ->filter(function ($animal) {
                    return $this->animalBloqueadoPorEstado($animal);
                })
                ->map(function ($animal) {
                    return $this->formatearAnimal($animal);
                })
                ->values(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:50|unique:corrales,nombre',
            'capacidad' => 'required|integer|min:1',
            'tipo_corral' => 'required|string|in:maternidad,gestacion,reproduccion,engorda,destete,enfermeria,cuarentena,sementales,general',
        ]);

        $corral = Corral::create([
            'nombre' => $request->nombre,
            'capacidad' => $request->capacidad,
            'tipo_corral' => $request->tipo_corral,
        ]);

        return response()->json([
            'mensaje' => 'Corral creado correctamente.',
            'data' => $corral,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $corral = Corral::findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:50|unique:corrales,nombre,' . $corral->id,
            'capacidad' => 'required|integer|min:1',
            'tipo_corral' => 'required|string|in:maternidad,gestacion,reproduccion,engorda,destete,enfermeria,cuarentena,sementales,general',
        ]);

        $ocupados = Animal::where('corral_id', $corral->id)
            ->get()
            ->filter(function ($animal) {
                return !$this->animalBloqueadoPorEstado($animal);
            })
            ->count();

        if ((int) $request->capacidad < $ocupados) {
            return response()->json([
                'error' => "No puedes reducir la capacidad a {$request->capacidad}. Este corral tiene {$ocupados} animales activos asignados."
            ], 400);
        }

        $corral->nombre = $request->nombre;
        $corral->capacidad = $request->capacidad;
        $corral->tipo_corral = $request->tipo_corral;
        $corral->save();

        return response()->json([
            'mensaje' => 'Corral actualizado correctamente.',
            'data' => $corral,
        ]);
    }

    public function destroy($id)
    {
        $corral = Corral::findOrFail($id);

        $ocupados = Animal::where('corral_id', $corral->id)
            ->get()
            ->filter(function ($animal) {
                return !$this->animalBloqueadoPorEstado($animal);
            })
            ->count();

        if ($ocupados > 0) {
            return response()->json([
                'error' => 'No se puede eliminar un corral con animales activos asignados.'
            ], 400);
        }

        $corral->delete();

        return response()->json([
            'mensaje' => 'Corral eliminado correctamente.'
        ]);
    }

    public function asignarAnimal(Request $request, $animalId)
    {
        $request->validate([
            'corral_id' => 'required|exists:corrales,id',
        ]);

        $animal = Animal::where('id', $animalId)->lockForUpdate()->firstOrFail();
        $corral = Corral::findOrFail($request->corral_id);

        $validacion = $this->validarMovimientoAnimal($animal, $corral);

        if ($validacion !== true) {
            return response()->json([
                'error' => $validacion,
            ], 400);
        }

        $animal->corral_id = $corral->id;
        $animal->save();

        return response()->json([
            'mensaje' => 'Animal asignado al corral correctamente.',
            'animal' => $this->formatearAnimal($animal),
            'corral' => $corral,
        ]);
    }

    public function moverAnimal(Request $request, $animalId)
    {
        return $this->asignarAnimal($request, $animalId);
    }

    public function retirarAnimal($animalId)
    {
        $animal = Animal::findOrFail($animalId);

        if ($this->animalBloqueadoPorEstado($animal)) {
            return response()->json([
                'error' => 'El animal ya está vendido, muerto, descartado o dado de baja. No requiere retiro operativo de corral.'
            ], 400);
        }

        $animal->corral_id = null;
        $animal->save();

        return response()->json([
            'mensaje' => 'Animal retirado del corral correctamente.',
            'animal' => $this->formatearAnimal($animal),
        ]);
    }

    public function resumen()
    {
        $corrales = Corral::with('animales')->get();

        $totalCorrales = $corrales->count();
        $capacidadTotal = $corrales->sum('capacidad');

        $ocupados = $corrales->sum(function ($corral) {
            return $corral->animales->filter(function ($animal) {
                return !$this->animalBloqueadoPorEstado($animal);
            })->count();
        });

        return response()->json([
            'total_corrales' => $totalCorrales,
            'capacidad_total' => $capacidadTotal,
            'ocupados' => $ocupados,
            'disponibles' => max($capacidadTotal - $ocupados, 0),
            'porcentaje_ocupacion' => $capacidadTotal > 0 ? round(($ocupados / $capacidadTotal) * 100, 2) : 0,
            'por_tipo' => $corrales->groupBy(function ($corral) {
                return $corral->tipo_corral ?? 'general';
            })->map(function ($grupo) {
                $capacidad = $grupo->sum('capacidad');

                $ocupadosGrupo = $grupo->sum(function ($corral) {
                    return $corral->animales->filter(function ($animal) {
                        return !$this->animalBloqueadoPorEstado($animal);
                    })->count();
                });

                return [
                    'corrales' => $grupo->count(),
                    'capacidad' => $capacidad,
                    'ocupados' => $ocupadosGrupo,
                    'disponibles' => max($capacidad - $ocupadosGrupo, 0),
                    'porcentaje_ocupacion' => $capacidad > 0 ? round(($ocupadosGrupo / $capacidad) * 100, 2) : 0,
                ];
            })->values(),
        ]);
    }

    private function validarMovimientoAnimal(Animal $animal, Corral $corral)
    {
        if ($this->animalBloqueadoPorEstado($animal)) {
            return "El animal {$animal->identificador_unico} no puede asignarse porque está vendido, muerto, descartado o dado de baja.";
        }

        $ocupados = Animal::where('corral_id', $corral->id)
            ->where('id', '!=', $animal->id)
            ->get()
            ->filter(function ($animalActual) {
                return !$this->animalBloqueadoPorEstado($animalActual);
            })
            ->count();

        if ($ocupados >= (int) $corral->capacidad) {
            return "El corral {$corral->nombre} está lleno. Capacidad: {$corral->capacidad}. Ocupados: {$ocupados}.";
        }

        if (!$this->animalCompatibleConCorral($animal, $corral)) {
            return "El animal {$animal->identificador_unico} no es compatible con el tipo de corral {$corral->tipo_corral}.";
        }

        return true;
    }

    private function animalCompatibleConCorral(Animal $animal, Corral $corral): bool
    {
        $tipo = $this->normalizarTexto($corral->tipo_corral ?? 'general');
        $etapa = $this->normalizarTexto($animal->etapa_actual ?? '');
        $clasificacion = $this->normalizarTexto($animal->clasificacion ?? '');
        $sexo = $this->normalizarTexto($animal->sexo ?? '');

        if ($tipo === 'general') {
            return true;
        }

        if ($tipo === 'engorda') {
            return in_array($clasificacion, ['abasto'], true)
                || in_array($etapa, ['engorda', 'crecimiento', 'finalizacion', 'finalización'], true);
        }

        if ($tipo === 'maternidad') {
            return in_array($etapa, ['maternidad', 'lactancia', 'lechon', 'lechón'], true)
                || ($sexo === 'hembra' && in_array($etapa, ['gestante', 'gestacion', 'gestación', 'reproduccion', 'reproducción'], true));
        }

        if ($tipo === 'gestacion') {
            return $sexo === 'hembra'
                && in_array($etapa, ['gestacion', 'gestación', 'gestante', 'reproduccion', 'reproducción'], true);
        }

        if ($tipo === 'reproduccion') {
            return in_array($etapa, ['reproduccion', 'reproducción'], true)
                || in_array($clasificacion, ['pie de cria', 'pie de cría', 'reproductor', 'reproductora'], true);
        }

        if ($tipo === 'destete') {
            return in_array($etapa, ['destete', 'destetado', 'transicion', 'transición', 'lechon', 'lechón'], true);
        }

        if ($tipo === 'enfermeria' || $tipo === 'cuarentena') {
            return true;
        }

        if ($tipo === 'sementales') {
            return $sexo === 'macho'
                && in_array($etapa, ['reproduccion', 'reproducción'], true);
        }

        return false;
    }

    private function estadoOcupacion(int $ocupados, int $capacidad): string
    {
        if ($capacidad <= 0) {
            return 'sin_capacidad';
        }

        $porcentaje = ($ocupados / $capacidad) * 100;

        if ($porcentaje >= 100) {
            return 'lleno';
        }

        if ($porcentaje >= 85) {
            return 'casi_lleno';
        }

        if ($porcentaje >= 60) {
            return 'ocupacion_media';
        }

        return 'disponible';
    }

    private function animalBloqueadoPorEstado(Animal $animal): bool
    {
        $estado = $this->normalizarTexto($animal->estado ?? '');

        return in_array($estado, [
            'muerto',
            'muerta',
            'vendido',
            'vendida',
            'descartado',
            'descartada',
            'baja',
            'baja sanitaria',
            'sacrificado',
            'sacrificada',
            'sacrificio sanitario',
        ], true);
    }

    private function estadosBloqueadosOriginales(): array
    {
        return [
            'muerto',
            'muerta',
            'Muerto',
            'MUERTO',
            'vendido',
            'vendida',
            'Vendido',
            'VENDIDO',
            'descartado',
            'descartada',
            'Descartado',
            'DESCARTADO',
            'baja',
            'baja sanitaria',
        ];
    }

    private function formatearAnimal(Animal $animal): array
    {
        return [
            'id' => $animal->id,
            'identificador_unico' => $animal->identificador_unico,
            'sexo' => $animal->sexo,
            'estado' => $animal->estado,
            'etapa_actual' => $animal->etapa_actual,
            'clasificacion' => $animal->clasificacion ?? null,
            'peso' => $animal->peso,
            'corral_id' => $animal->corral_id ?? null,
        ];
    }

    private function normalizarTexto($valor): string
    {
        $texto = trim((string) $valor);
        $texto = str_replace(['_', '-'], ' ', $texto);
        $texto = mb_strtolower($texto, 'UTF-8');

        $texto = strtr($texto, [
            'á' => 'a',
            'é' => 'e',
            'í' => 'i',
            'ó' => 'o',
            'ú' => 'u',
            'Á' => 'a',
            'É' => 'e',
            'Í' => 'i',
            'Ó' => 'o',
            'Ú' => 'u',
            'ñ' => 'n',
            'Ñ' => 'n',
        ]);

        $texto = preg_replace('/\s+/', ' ', $texto);

        return trim($texto);
    }
}