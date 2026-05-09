<?php

namespace App\Http\Controllers;
use App\Models\Animal;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;

class InventarioController extends Controller
{
    public function index()
    {
        return Inventario::all();
    }

    public function entrada(Request $request)
    {
        // 🔒 Validación
        if (!$request->producto_id || !$request->cantidad) {
            return response()->json(['error' => 'Datos incompletos'], 400);
        }

        $inventario = Inventario::find($request->producto_id);

        if (!$inventario) {
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        // 🔢 Convertir a número
        $cantidad = floatval($request->cantidad);

        if ($cantidad <= 0) {
            return response()->json(['error' => 'Cantidad inválida'], 400);
        }

        // ➕ SUMAR STOCK
        $inventario->stock_kg += $cantidad;
        $inventario->save();

        return response()->json([
            'mensaje' => 'Entrada registrada',
            'stock_actual' => $inventario->stock_kg
        ]);
    }

    public function salida(Request $request)
    {
        $request->validate([
            'producto_id' => 'required|exists:inventarios,id',
            'cantidad' => 'required|numeric|min:0.1'
        ]);

        $inv = Inventario::findOrFail($request->producto_id);

        // VALIDAR STOCK
        if ($inv->stock_kg < $request->cantidad) {
            return response()->json([
                'error' => 'Stock insuficiente'
            ], 400);
        }

        // RESTAR STOCK
        $inv->stock_kg -= $request->cantidad;
        $inv->save();

        // REGISTRAR MOVIMIENTO
        MovimientoInventario::create([
            'producto_id' => $inv->id,
            'tipo' => 'salida',
            'cantidad_kg' => $request->cantidad,
            'fecha' => now(),
            'descripcion' => 'Consumo de alimento'
        ]);

        return response()->json([
            'mensaje' => 'Salida registrada correctamente',
            'stock_actual' => $inv->stock_kg
        ]);
    }

    public function consumoAutomatico()
    {
        $animales = Animal::where('estado', 'activo')->get();

        $consumoTotal = 0;

        $detalle = [
            'lechon' => 0,
            'crecimiento' => 0,
            'engorda' => 0,
            'reproductor' => 0
        ];

        foreach ($animales as $animal) {

            switch ($animal->etapa_actual) {
                case 'lechon':
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
                    $consumo = 3.0;
                    $detalle['reproductor'] += $consumo;
                    break;

                default:
                    $consumo = 1.0;
                    break;
            }

            $consumoTotal += $consumo;
        }

        $inventario = Inventario::where('nombre_producto', 'like', '%alimento%')->first();

        if (!$inventario) {
            return response()->json(['error' => 'No hay alimento en inventario'], 400);
        }

        if ($inventario->stock_kg < $consumoTotal) {
            return response()->json([
                'error' => 'Stock insuficiente para consumo automático'
            ], 400);
        }

        $inventario->stock_kg -= $consumoTotal;
        $inventario->save();

        return response()->json([
            'mensaje' => 'Consumo aplicado',
            'consumo_total' => round($consumoTotal, 2),
            'stock_restante' => $inventario->stock_kg,
            'detalle' => $detalle
        ]);
    }
}
