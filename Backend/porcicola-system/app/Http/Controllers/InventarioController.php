<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventarioController extends Controller
{
    public function index()
    {
        return Inventario::orderBy('nombre_producto')->get();
    }

    public function entrada(Request $request)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:inventarios,id',
            'cantidad' => 'required|numeric|min:0.1',
        ]);

        $cantidad = (float) $validated['cantidad'];

        return DB::transaction(function () use ($validated, $cantidad) {
            $inventario = Inventario::lockForUpdate()->findOrFail($validated['producto_id']);

            $inventario->stock_kg = round(((float) $inventario->stock_kg) + $cantidad, 2);
            $inventario->save();

            MovimientoInventario::create([
                'inventario_id' => $inventario->id,
                'tipo' => 'entrada',
                'cantidad' => $cantidad,
                'tipo_origen' => 'inventario',
                'referencia_id' => $inventario->id,
                'descripcion' => 'Entrada manual de inventario',
            ]);

            return response()->json([
                'mensaje' => 'Entrada registrada correctamente',
                'producto' => $inventario->nombre_producto,
                'cantidad' => round($cantidad, 2),
                'stock_actual' => round((float) $inventario->stock_kg, 2),
            ]);
        });
    }

    public function salida(Request $request)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:inventarios,id',
            'cantidad' => 'required|numeric|min:0.1',
        ]);

        $cantidad = (float) $validated['cantidad'];

        return DB::transaction(function () use ($validated, $cantidad) {
            $inventario = Inventario::lockForUpdate()->findOrFail($validated['producto_id']);

            if ((float) $inventario->stock_kg < $cantidad) {
                return response()->json([
                    'error' => 'Stock insuficiente',
                    'producto' => $inventario->nombre_producto,
                    'stock_actual' => round((float) $inventario->stock_kg, 2),
                    'cantidad_solicitada' => round($cantidad, 2),
                ], 400);
            }

            $inventario->stock_kg = round(((float) $inventario->stock_kg) - $cantidad, 2);
            $inventario->save();

            MovimientoInventario::create([
                'inventario_id' => $inventario->id,
                'tipo' => 'salida',
                'cantidad' => $cantidad,
                'tipo_origen' => 'inventario',
                'referencia_id' => $inventario->id,
                'descripcion' => 'Salida manual de inventario',
            ]);

            return response()->json([
                'mensaje' => 'Salida registrada correctamente',
                'producto' => $inventario->nombre_producto,
                'cantidad' => round($cantidad, 2),
                'stock_actual' => round((float) $inventario->stock_kg, 2),
            ]);
        });
    }

    public function merma(Request $request)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:inventarios,id',
            'cantidad' => 'required|numeric|min:0.1',
            'motivo' => 'required|string|max:255',
        ]);

        $cantidad = round((float) $validated['cantidad'], 2);

        return DB::transaction(function () use ($validated, $cantidad) {
            $inventario = Inventario::lockForUpdate()->findOrFail($validated['producto_id']);

            if ((float) $inventario->stock_kg < $cantidad) {
                return response()->json([
                    'error' => 'Stock insuficiente para registrar merma',
                    'producto' => $inventario->nombre_producto,
                    'stock_actual' => round((float) $inventario->stock_kg, 2),
                    'cantidad_solicitada' => round($cantidad, 2),
                ], 400);
            }

            $inventario->stock_kg = round(((float) $inventario->stock_kg) - $cantidad, 2);
            $inventario->save();

            MovimientoInventario::create([
                'inventario_id' => $inventario->id,
                'tipo' => 'salida',
                'cantidad' => $cantidad,
                'tipo_origen' => 'merma',
                'referencia_id' => $inventario->id,
                'descripcion' => 'Merma de inventario: ' . $validated['motivo'],
            ]);

            return response()->json([
                'mensaje' => 'Merma de inventario registrada correctamente',
                'producto' => $inventario->nombre_producto,
                'cantidad' => round($cantidad, 2),
                'stock_actual' => round((float) $inventario->stock_kg, 2),
                'motivo' => $validated['motivo'],
            ]);
        });
    }

    public function movimientos()
    {
        $movimientos = MovimientoInventario::with('inventario')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(function ($movimiento) {
                return [
                    'id' => $movimiento->id,
                    'inventario_id' => $movimiento->inventario_id,
                    'tipo' => $movimiento->tipo,
                    'cantidad' => round((float) $movimiento->cantidad, 2),
                    'tipo_origen' => $movimiento->tipo_origen,
                    'referencia_id' => $movimiento->referencia_id,
                    'descripcion' => $movimiento->descripcion,
                    'created_at' => $movimiento->created_at,
                    'updated_at' => $movimiento->updated_at,
                    'fecha_movimiento' => optional($movimiento->created_at)->format('Y-m-d H:i:s'),
                    'inventario' => $movimiento->inventario ? [
                        'id' => $movimiento->inventario->id,
                        'nombre_producto' => $movimiento->inventario->nombre_producto,
                        'tipo' => $movimiento->inventario->tipo ?? null,
                        'unidad' => $movimiento->inventario->unidad ?? null,
                        'stock_kg' => round((float) $movimiento->inventario->stock_kg, 2),
                        'costo_unitario' => $movimiento->inventario->costo_unitario ?? 0,
                    ] : null,
                ];
            });

        return response()->json($movimientos);
    }

    public function consumoAutomatico(Request $request)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:inventarios,id',
        ]);

        $animales = Animal::where('estado', 'activo')->get();

        if ($animales->isEmpty()) {
            return response()->json([
                'error' => 'No hay animales activos para calcular consumo',
            ], 400);
        }

        $consumoTotal = 0;

        $detalle = [
            'lechon' => 0,
            'crecimiento' => 0,
            'engorda' => 0,
            'reproductor' => 0,
            'otros' => 0,
        ];

        foreach ($animales as $animal) {
            $etapa = strtolower(trim($animal->etapa_actual ?? ''));

            switch ($etapa) {
                case 'lechon':
                case 'lechón':
                    $consumo = 0.8;
                    $detalle['lechon'] += $consumo;
                    break;

                case 'crecimiento':
                    $consumo = 1.5;
                    $detalle['crecimiento'] += $consumo;
                    break;

                case 'engorda':
                    $consumo = 2.5;
                    $detalle['engorda'] += $consumo;
                    break;

                case 'reproductor':
                case 'reproductora':
                case 'gestacion':
                case 'gestación':
                case 'lactancia':
                    $consumo = 3.0;
                    $detalle['reproductor'] += $consumo;
                    break;

                default:
                    $consumo = 1.0;
                    $detalle['otros'] += $consumo;
                    break;
            }

            $consumoTotal += $consumo;
        }

        $consumoTotal = round($consumoTotal, 2);

        return DB::transaction(function () use ($validated, $consumoTotal, $detalle, $animales) {
            $inventario = Inventario::lockForUpdate()->findOrFail($validated['producto_id']);

            if ((float) $inventario->stock_kg < $consumoTotal) {
                return response()->json([
                    'error' => 'Stock insuficiente para consumo automático',
                    'producto' => $inventario->nombre_producto,
                    'stock_actual' => round((float) $inventario->stock_kg, 2),
                    'consumo_requerido' => $consumoTotal,
                    'faltante' => round($consumoTotal - (float) $inventario->stock_kg, 2),
                    'detalle' => $detalle,
                ], 400);
            }

            $inventario->stock_kg = round(((float) $inventario->stock_kg) - $consumoTotal, 2);
            $inventario->save();

            MovimientoInventario::create([
                'inventario_id' => $inventario->id,
                'tipo' => 'consumo',
                'cantidad' => $consumoTotal,
                'tipo_origen' => 'consumo_automatico_animales',
                'referencia_id' => null,
                'descripcion' => 'Consumo automático calculado por etapa de animales activos',
            ]);

            return response()->json([
                'mensaje' => 'Consumo aplicado correctamente',
                'producto' => $inventario->nombre_producto,
                'animales_procesados' => $animales->count(),
                'consumo_total' => $consumoTotal,
                'stock_restante' => round((float) $inventario->stock_kg, 2),
                'detalle' => array_map(function ($valor) {
                    return round($valor, 2);
                }, $detalle),
            ]);
        });
    }
}
