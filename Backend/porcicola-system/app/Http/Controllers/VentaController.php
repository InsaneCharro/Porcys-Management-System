<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Animal;
use App\Models\Cliente;
use App\Models\VentaAnimal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VentaController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'cliente_id' => 'required|exists:clientes,id',
            'tipo_venta' => 'required|in:abasto,pie_cria',
            'animales' => 'required|array|min:1',
            'animales.*.animal_id' => 'required|exists:animales,id',
            'observaciones' => 'nullable|string',

            'animales.*.precio_kg' => 'nullable|numeric|min:0',
            'animales.*.precio_fijo' => 'nullable|numeric|min:0',
        ]);

        $animalIds = collect($request->animales)
            ->pluck('animal_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($animalIds->count() !== $animalIds->unique()->count()) {
            return response()->json([
                'error' => 'No puedes registrar el mismo animal dos veces en una misma venta.'
            ], 400);
        }

        DB::beginTransaction();

        try {
            $cliente = Cliente::findOrFail($request->cliente_id);

            $subtotal = 0;
            $detalles = [];

            foreach ($request->animales as $item) {
                $animal = Animal::where('id', $item['animal_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->validarAnimalVendible($animal, $request->tipo_venta);

                if ($request->tipo_venta === 'abasto') {
                    $precioKg = isset($item['precio_kg']) ? (float) $item['precio_kg'] : 0;

                    if ($precioKg <= 0) {
                        throw new \Exception(
                            "Precio por kg requerido para venta de abasto."
                        );
                    }

                    $peso = (float) ($animal->peso ?? 0);

                    if ($peso <= 0) {
                        throw new \Exception(
                            "El animal {$animal->identificador_unico} no tiene peso válido registrado."
                        );
                    }

                    $subtotalIndividual = round($peso * $precioKg, 2);

                    $detalles[] = [
                        'animal' => $animal,
                        'precio_kg' => $precioKg,
                        'peso_individual' => $peso,
                        'precio_fijo' => null,
                        'subtotal_individual' => $subtotalIndividual
                    ];

                    $subtotal += $subtotalIndividual;
                }

                if ($request->tipo_venta === 'pie_cria') {
                    $precioFijo = isset($item['precio_fijo']) ? (float) $item['precio_fijo'] : 0;

                    if ($precioFijo <= 0) {
                        throw new \Exception(
                            "Precio fijo requerido para venta de pie de cría."
                        );
                    }

                    $subtotalIndividual = round($precioFijo, 2);

                    $detalles[] = [
                        'animal' => $animal,
                        'precio_kg' => null,
                        'peso_individual' => $animal->peso,
                        'precio_fijo' => $precioFijo,
                        'subtotal_individual' => $subtotalIndividual
                    ];

                    $subtotal += $subtotalIndividual;
                }
            }

            $subtotal = round($subtotal, 2);
            $iva = round($subtotal * 0.16, 2);
            $total = round($subtotal + $iva, 2);

            $folio = 'VTA-' . now()->format('YmdHis');

            $venta = Venta::create([
                'folio' => $folio,
                'cliente_id' => $cliente->id,
                'tipo_venta' => $request->tipo_venta,
                'subtotal' => $subtotal,
                'iva' => $iva,
                'descuento' => 0,
                'total' => $total,
                'fecha' => now(),
                'estado' => 'completada',
                'observaciones' => $request->observaciones
            ]);

            foreach ($detalles as $detalle) {
                VentaAnimal::create([
                    'venta_id' => $venta->id,
                    'animal_id' => $detalle['animal']->id,
                    'precio_kg' => $detalle['precio_kg'],
                    'peso_individual' => $detalle['peso_individual'],
                    'precio_fijo' => $detalle['precio_fijo'],
                    'subtotal_individual' => $detalle['subtotal_individual']
                ]);

                $animal = $detalle['animal'];

                $animal->estado = 'vendido';

                if (Schema::hasColumn('animales', 'corral_id')) {
                    $animal->corral_id = null;
                }

                $animal->save();
            }

            DB::commit();

            return response()->json([
                'mensaje' => 'Venta registrada correctamente',
                'data' => $venta->load([
                    'cliente',
                    'detalleAnimales.animal'
                ])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage()
            ], 400);
        }
    }

    public function historial()
    {
        $ventas = Venta::with([
            'cliente',
            'detalleAnimales.animal'
        ])
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->get();

        return response()->json($ventas);
    }

    public function resumen()
    {
        $ventasCompletadas = Venta::where('estado', 'completada');

        return response()->json([
            'total_ventas' => (clone $ventasCompletadas)->count(),
            'ingresos_totales' => round((clone $ventasCompletadas)->sum('total'), 2),
            'promedio_por_venta' => round((clone $ventasCompletadas)->avg('total') ?? 0, 2)
        ]);
    }

    public function rankingClientes()
    {
        $clientes = Cliente::withCount([
                'ventas as ventas_count' => function ($query) {
                    $query->where('estado', 'completada');
                }
            ])
            ->withSum([
                'ventas as ventas_sum_total' => function ($query) {
                    $query->where('estado', 'completada');
                }
            ], 'total')
            ->orderByDesc('ventas_sum_total')
            ->get();

        return response()->json($clientes);
    }

    public function porTipo()
    {
        return response()->json(
            Venta::where('estado', 'completada')
                ->selectRaw('tipo_venta, COUNT(*) as cantidad, SUM(total) as total')
                ->groupBy('tipo_venta')
                ->get()
        );
    }

    private function validarAnimalVendible(Animal $animal, string $tipoVenta): void
    {
        $estado = $this->normalizarTexto($animal->estado);

        $estadosBloqueados = [
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
        ];

        if (in_array($estado, $estadosBloqueados, true)) {
            throw new \Exception(
                "El animal {$animal->identificador_unico} no puede venderse porque su estado actual es: {$animal->estado}."
            );
        }

        $clasificacion = $this->normalizarTexto($animal->clasificacion ?? '');

        if ($tipoVenta === 'abasto' && $clasificacion !== 'abasto') {
            throw new \Exception(
                "El animal {$animal->identificador_unico} no está clasificado como abasto."
            );
        }

        $clasificacionesPieCria = [
            'pie de cria',
            'pie cria',
            'reproductor',
            'reproductora',
        ];

        if ($tipoVenta === 'pie_cria' && !in_array($clasificacion, $clasificacionesPieCria, true)) {
            throw new \Exception(
                "El animal {$animal->identificador_unico} no está clasificado como pie de cría."
            );
        }
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