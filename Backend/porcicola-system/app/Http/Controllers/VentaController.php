<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\Animal;
use App\Models\Cliente;
use Illuminate\Http\Request;

class VentaController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'animal_id' => 'required|exists:animales,id',
            'cliente_id' => 'required|exists:clientes,id',
            'precio_kg' => 'required|numeric|min:0',
            'peso_venta' => 'required|numeric|min:0'
        ]);

        $animal = Animal::findOrFail($request->animal_id);

        // No vender muertos
        if ($animal->estado === 'muerto') {
            return response()->json([
                'error' => 'No se puede vender un animal muerto'
            ], 400);
        }

        // No vender dos veces
        if ($animal->estado === 'vendido') {
            return response()->json([
                'error' => 'El animal ya fue vendido'
            ], 400);
        }

        $cliente = Cliente::findOrFail($request->cliente_id);

        $tipoVenta = $animal->clasificacion ?? 'abasto';

        $total = $request->precio_kg * $request->peso_venta;

        $venta = Venta::create([
            'animal_id' => $animal->id,
            'cliente_id' => $cliente->id,
            'tipo_venta' => $tipoVenta,
            'precio_kg' => $request->precio_kg,
            'peso_venta' => $request->peso_venta,
            'total' => $total,
            'fecha' => now()
        ]);

        $animal->estado = 'vendido';
        $animal->save();

        return response()->json([
            'mensaje' => 'Venta registrada correctamente',
            'total' => $total,
            'data' => $venta->load(['animal', 'cliente'])
        ], 201);
    }

    public function resumen()
    {
        $totalVentas = Venta::count();

        $ingresos = Venta::sum('total');

        $promedio = Venta::avg('total');

        return response()->json([
            'total_ventas' => $totalVentas,
            'ingresos_totales' => round($ingresos, 2),
            'promedio_por_venta' => round($promedio ?? 0, 2)
        ]);
    }

    public function rankingClientes()
    {
        $ranking = Cliente::withCount('ventas')
            ->withSum('ventas', 'total')
            ->orderByDesc('ventas_sum_total')
            ->get();

        return response()->json($ranking);
    }

    public function porTipo()
    {
        $data = Venta::join('animales', 'ventas.animal_id', '=', 'animales.id')
            ->selectRaw('animales.clasificacion as tipo, COUNT(*) as cantidad, SUM(ventas.total) as total')
            ->groupBy('animales.clasificacion')
            ->get();

        return response()->json($data);
    }

    public function historial()
    {
        $ventas = Venta::with(['animal', 'cliente'])
            ->orderByDesc('fecha')
            ->get();

        return response()->json($ventas);
    }
}