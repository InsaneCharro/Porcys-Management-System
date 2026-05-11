<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Animal;
use App\Models\Cliente;
use App\Models\VentaAnimal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        DB::beginTransaction();

        try {
            $cliente = Cliente::findOrFail($request->cliente_id);

            $subtotal = 0;
            $detalles = [];

            foreach ($request->animales as $item) {
                $animal = Animal::findOrFail($item['animal_id']);

                if ($animal->estado === 'muerto') {
                    throw new \Exception(
                        "El animal {$animal->identificador_unico} está muerto"
                    );
                }

                if ($animal->estado === 'vendido') {
                    throw new \Exception(
                        "El animal {$animal->identificador_unico} ya fue vendido"
                    );
                }

                if ($request->tipo_venta === 'abasto') {
                    if (empty($item['precio_kg'])) {
                        throw new \Exception(
                            "Precio por kg requerido para venta abasto"
                        );
                    }

                    $peso = $animal->peso ?? 0;

                    if ($peso <= 0) {
                        throw new \Exception(
                            "El animal {$animal->identificador_unico} no tiene peso registrado"
                        );
                    }

                    $subtotalIndividual =
                        $peso * $item['precio_kg'];

                    $detalles[] = [
                        'animal' => $animal,
                        'precio_kg' => $item['precio_kg'],
                        'peso_individual' => $peso,
                        'precio_fijo' => null,
                        'subtotal_individual' => $subtotalIndividual
                    ];

                    $subtotal += $subtotalIndividual;
                }

                if ($request->tipo_venta === 'pie_cria') {
                    if (empty($item['precio_fijo'])) {
                        throw new \Exception(
                            "Precio fijo requerido para pie de cría"
                        );
                    }

                    $subtotalIndividual = $item['precio_fijo'];

                    $detalles[] = [
                        'animal' => $animal,
                        'precio_kg' => null,
                        'peso_individual' => $animal->peso,
                        'precio_fijo' => $item['precio_fijo'],
                        'subtotal_individual' => $subtotalIndividual
                    ];

                    $subtotal += $subtotalIndividual;
                }
            }

            $iva = $subtotal * 0.16;
            $total = $subtotal + $iva;

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

                $detalle['animal']->update([
                    'estado' => 'vendido'
                ]);
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
        ->get();

        return response()->json($ventas);
    }

    public function resumen()
    {
        return response()->json([
            'total_ventas' => Venta::count(),
            'ingresos_totales' => round(Venta::sum('total'), 2),
            'promedio_por_venta' => round(Venta::avg('total') ?? 0, 2)
        ]);
    }

    public function rankingClientes()
    {
        return response()->json(
            Cliente::withCount('ventas')
                ->withSum('ventas', 'total')
                ->orderByDesc('ventas_sum_total')
                ->get()
        );
    }

    public function porTipo()
    {
        return response()->json(
            Venta::selectRaw('tipo_venta, COUNT(*) as cantidad, SUM(total) as total')
                ->groupBy('tipo_venta')
                ->get()
        );
    }
}