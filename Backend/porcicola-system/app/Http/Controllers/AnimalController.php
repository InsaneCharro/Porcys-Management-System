<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\Camada;
use App\Models\Peso;
use Illuminate\Http\Request;
use Carbon\Carbon;


class AnimalController extends Controller
{
    public function index(Request $request)
    {
        $query = Animal::query();

        // 🔎 Buscar por identificador
        if ($request->identificador) {
            $query->where('identificador_unico', 'LIKE', '%' . $request->identificador . '%');
        }

        // ⚧ Filtrar por sexo
        if ($request->sexo) {
            $query->where('sexo', $request->sexo);
        }

        // 🟢 Filtrar por estado
        if ($request->estado) {
            $query->where('estado', $request->estado);
        }

        $animales = $query->orderBy('id', 'desc')->get();

        foreach ($animales as $animal) {
            if ($animal->fecha_nacimiento && !$animal->etapa_actual) {
                $edad = Carbon::parse($animal->fecha_nacimiento)
                    ->diffInDays(now());

                $animal->etapa_actual = $this->calcularEtapa($edad);
                $animal->save();
            }
}

        // 🧬 Filtrar por etapa
        if ($request->etapa) {
            $animales = $animales->filter(function ($animal) use ($request) {
                return $animal->etapa_actual === $request->etapa;
            })->values();
        }

        return $animales;
    }

    public function store(Request $request)
    {
        try {

            $animal = Animal::create([
                'identificador_unico' => $this->generarIdentificador(),
                'sexo' => $request->sexo ?? 'macho',
                'fecha_nacimiento' => now(),
                'etapa_actual' => 'lechon',
                'estado' => 'activo',
                'raza' => 'General',
                'madre_id' => null,
                'padre_id' => null,
                'peso' => 0
            ]);

            return response()->json($animal, 201);

        } catch (\Throwable $e) {

            return response()->json([
                'error' => $e->getMessage(),
                'linea' => $e->getLine()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $animal = Animal::findOrFail($id);

        $animal->update([
            'sexo' => $request->sexo,
            'etapa_actual' => $request->etapa_actual,
            'estado' => $request->estado,
        ]);

        return response()->json([
            'mensaje' => 'Animal actualizado correctamente'
        ]);
    }

    public function destroy($id)
    {
        Animal::destroy($id);
        return response()->json(['ok' => true]);
    }

    private function generarIdentificador()
    {
        $ultimo = Animal::latest('id')->first();

        $numero = $ultimo ? $ultimo->id + 1 : 1;

        return 'A' . str_pad($numero, 4, '0', STR_PAD_LEFT);
    }

    public function show($id)
    {
        return Animal::findOrFail($id);
    }

    public function pedigree($id)
    {
        $animal = Animal::with([
            'madre.madre',
            'madre.padre',
            'padre.madre',
            'padre.padre',
            'corral'
        ])->findOrFail($id);

        $pesos = Peso::where('animal_id', $animal->id)
            ->orderBy('fecha', 'asc')
            ->get();

        $pesosRelevantes = $this->obtenerPesosRelevantes($animal, $pesos);

        $camada = null;

        if ($animal->madre_id) {
            $consultaCamada = Camada::with(['madre', 'gestacion'])
                ->where('madre_id', $animal->madre_id);

            if ($animal->fecha_nacimiento) {
                $consultaCamada->whereDate('fecha_parto', '<=', $animal->fecha_nacimiento);
            }

            $camada = $consultaCamada
                ->orderByDesc('fecha_parto')
                ->first();
        }

        $clasificacion = $this->clasificacionProductiva($animal, $pesosRelevantes);
        $calidadPedigree = $this->calidadPedigree($animal, $pesosRelevantes);

        return response()->json([
            'animal' => $this->resumenAnimal($animal),
            'genealogia' => [
                'madre' => $this->resumenAnimal($animal->madre),
                'padre' => $this->resumenAnimal($animal->padre),
                'abuelos_maternos' => [
                    'abuela' => $this->resumenAnimal(optional($animal->madre)->madre),
                    'abuelo' => $this->resumenAnimal(optional($animal->madre)->padre),
                ],
                'abuelos_paternos' => [
                    'abuela' => $this->resumenAnimal(optional($animal->padre)->madre),
                    'abuelo' => $this->resumenAnimal(optional($animal->padre)->padre),
                ],
            ],
            'pesos_relevantes' => $pesosRelevantes,
            'camada' => $camada ? [
                'id' => $camada->id,
                'fecha_parto' => $camada->fecha_parto,
                'fecha_destete' => $camada->fecha_destete ?? null,
                'total_crias' => $camada->total_crias,
                'machos' => $camada->machos,
                'hembras' => $camada->hembras,
                'vivos' => $camada->vivos,
                'muertos' => $camada->muertos,
                'peso_promedio_nacimiento' => $camada->peso_promedio_nacimiento,
                'estado' => $camada->estado,
            ] : null,
            'clasificacion' => $clasificacion,
            'calidad_pedigree' => $calidadPedigree,
            'certificado' => [
                'folio' => 'CERT-PC-' . str_pad($animal->id, 5, '0', STR_PAD_LEFT),
                'fecha_emision' => now()->toDateString(),
                'apto_pie_cria' => in_array($clasificacion['tipo'], [
                    'pie_cria',
                    'reproductor',
                    'reproductora',
                    'semental'
                ]),
                'certificado_completo' => $calidadPedigree['completo'],
                'calidad_documental' => $calidadPedigree['porcentaje'],
                'nivel_documental' => $calidadPedigree['nivel'],
                'observaciones' => $calidadPedigree['faltantes'],
                'nota' => 'Certificado generado en modo consulta. No modifica datos del animal.',
            ],
        ]);
    }

        private function calcularEtapa($edadDias)
    {
        if ($edadDias < 28) return 'lechon';
        if ($edadDias < 70) return 'crecimiento';
        if ($edadDias < 150) return 'engorda';
        return 'reproductor';
    }

    private function resumenAnimal($animal)
    {
        if (!$animal) {
            return null;
        }

        return [
            'id' => $animal->id,
            'identificador_unico' => $animal->identificador_unico,
            'sexo' => $animal->sexo,
            'fecha_nacimiento' => $animal->fecha_nacimiento,
            'etapa_actual' => $animal->etapa_actual,
            'estado' => $animal->estado,
            'raza' => $animal->raza,
            'madre_id' => $animal->madre_id,
            'padre_id' => $animal->padre_id,
            'peso_nacimiento' => $animal->peso,
            'corral_id' => $animal->corral_id ?? null,
        ];
    }

    private function obtenerPesosRelevantes($animal, $pesos)
    {
        $pesoDia10 = $this->pesoMasCercano($animal, $pesos, 10);
        $pesoDia28 = $this->pesoMasCercano($animal, $pesos, 28);

        $ultimoPeso = $pesos->last();

        return [
            'nacimiento' => [
                'peso' => $animal->peso,
                'fecha' => $animal->fecha_nacimiento,
                'fuente' => 'animales.peso',
            ],
            'dia_10' => $pesoDia10,
            'dia_28' => $pesoDia28,
            'ultimo' => $ultimoPeso ? $this->formatearPeso($animal, $ultimoPeso) : null,
        ];
    }

    private function pesoMasCercano($animal, $pesos, $diaObjetivo)
    {
        $candidatos = $pesos->map(function ($peso) use ($animal, $diaObjetivo) {
            $formateado = $this->formatearPeso($animal, $peso);

            if ($formateado['edad_dias'] === null) {
                return null;
            }

            $formateado['distancia_dias'] = abs($formateado['edad_dias'] - $diaObjetivo);

            return $formateado;
        })->filter();

        if ($candidatos->isEmpty()) {
            return null;
        }

        return $candidatos
            ->sortBy('distancia_dias')
            ->first();
    }

    private function formatearPeso($animal, $peso)
    {
        $edadDias = $peso->edad_dias ?? null;

        if ($edadDias === null && $animal->fecha_nacimiento && $peso->fecha) {
            $edadDias = Carbon::parse($animal->fecha_nacimiento)
                ->startOfDay()
                ->diffInDays(Carbon::parse($peso->fecha)->startOfDay());
        }

        return [
            'id' => $peso->id,
            'peso' => $peso->peso,
            'fecha' => $peso->fecha,
            'edad_dias' => $edadDias,
            'etapa' => $peso->etapa ?? null,
            'estado' => $peso->estado ?? null,
        ];
    }

    private function calidadPedigree($animal, $pesosRelevantes)
    {
        $criterios = [
            [
                'cumple' => !empty($animal->identificador_unico),
                'faltante' => 'Identificador único no registrado',
            ],
            [
                'cumple' => !empty($animal->sexo),
                'faltante' => 'Sexo no registrado',
            ],
            [
                'cumple' => !empty($animal->fecha_nacimiento),
                'faltante' => 'Fecha de nacimiento no registrada',
            ],
            [
                'cumple' => !empty($animal->raza) && $this->normalizar($animal->raza) !== 'pendiente',
                'faltante' => 'Raza o genética no registrada',
            ],
            [
                'cumple' => !empty($animal->madre_id),
                'faltante' => 'Madre no registrada',
            ],
            [
                'cumple' => !empty($animal->padre_id),
                'faltante' => 'Padre no registrado',
            ],
            [
                'cumple' => !empty($pesosRelevantes['nacimiento']['peso']),
                'faltante' => 'Peso de nacimiento no registrado',
            ],
            [
                'cumple' => !empty($pesosRelevantes['dia_10']),
                'faltante' => 'Peso día 10 no registrado',
            ],
            [
                'cumple' => !empty($pesosRelevantes['dia_28']),
                'faltante' => 'Peso día 28 no registrado',
            ],
            [
                'cumple' => !empty($animal->clasificacion),
                'faltante' => 'Clasificación productiva no registrada',
            ],
        ];

        $total = count($criterios);
        $cumplidos = collect($criterios)->where('cumple', true)->count();
        $faltantes = collect($criterios)
            ->where('cumple', false)
            ->pluck('faltante')
            ->values()
            ->all();

        $porcentaje = $total > 0 ? round(($cumplidos / $total) * 100) : 0;

        if ($porcentaje >= 90) {
            $nivel = 'Completo';
        } elseif ($porcentaje >= 70) {
            $nivel = 'Aceptable con observaciones';
        } elseif ($porcentaje >= 40) {
            $nivel = 'Incompleto';
        } else {
            $nivel = 'Crítico';
        }

        return [
            'porcentaje' => $porcentaje,
            'nivel' => $nivel,
            'completo' => $porcentaje >= 90,
            'cumplidos' => $cumplidos,
            'total' => $total,
            'faltantes' => $faltantes,
        ];
    }

    private function clasificacionProductiva($animal, $pesosRelevantes)
    {
        $sexo = $this->normalizar($animal->sexo);
        $etapa = $this->normalizar($animal->etapa_actual);
        $estado = $this->normalizar($animal->estado);
        $clasificacionGuardada = $this->normalizarClasificacion($animal->clasificacion ?? null);
        if (in_array($estado, ['muerto', 'muerta', 'vendido', 'vendida', 'descartado', 'descartada', 'baja'])) {
            return [
                'tipo' => 'no_disponible',
                'etiqueta' => 'No disponible para pie de cría',
                'motivo' => 'El animal no está activo productivamente.',
            ];
        }

        if ($clasificacionGuardada) {
            return [
                'tipo' => $clasificacionGuardada,
                'etiqueta' => $this->etiquetaClasificacion($clasificacionGuardada),
                'motivo' => 'Clasificación registrada en el sistema.',
            ];
        }

        if ($sexo === 'macho' && str_contains($etapa, 'reproductor')) {
            return [
                'tipo' => 'semental',
                'etiqueta' => 'Semental',
                'motivo' => 'Macho en etapa reproductiva.',
            ];
        }

        if ($sexo === 'hembra' && str_contains($etapa, 'reproductor')) {
            return [
                'tipo' => 'reproductora',
                'etiqueta' => 'Reproductora',
                'motivo' => 'Hembra en etapa reproductiva.',
            ];
        }

        $pesoDia28 = $pesosRelevantes['dia_28']['peso'] ?? null;

        if ($pesoDia28 !== null && floatval($pesoDia28) >= 7.0) {
            return [
                'tipo' => 'pie_cria',
                'etiqueta' => 'Pie de cría',
                'motivo' => 'Peso al día 28 igual o superior al umbral de 7 kg.',
            ];
        }

        return [
            'tipo' => 'abasto',
            'etiqueta' => 'Abasto',
            'motivo' => 'No cumple criterios suficientes para pie de cría con los datos actuales.',
        ];
    }

    private function normalizarClasificacion($valor)
    {
        $normalizado = $this->normalizar($valor);

        return match ($normalizado) {
            'pie_de_cria', 'pie_de_cría', 'pie_cria', 'pie_cría' => 'pie_cria',
            'reproductor', 'reproductora', 'semental', 'abasto' => $normalizado,
            default => $normalizado,
        };
    }

    private function etiquetaClasificacion($valor)
    {
        return match ($valor) {
            'pie_cria' => 'Pie de cría',
            'reproductor' => 'Reproductor',
            'reproductora' => 'Reproductora',
            'semental' => 'Semental',
            'abasto' => 'Abasto',
            default => ucfirst(str_replace('_', ' ', $valor)),
        };
    }

    private function normalizar($valor)
    {
        return strtolower(trim(str_replace([' ', '-'], '_', (string) $valor)));
    }
}
