<?php

namespace App\Http\Controllers;

use App\Models\ConsumoAlimentacion;
use App\Models\ConsumoAlimentacionDetalle;
use App\Models\Dieta;
use App\Models\DietaIngrediente;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AlimentacionController extends Controller
{
    public function dietas()
    {
        return Dieta::with(['ingredientes.inventario'])
            ->orderBy('id', 'desc')
            ->get();
    }

    public function guardarDieta(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'etapa_objetivo' => 'nullable|string|max:255',
            'descripcion' => 'nullable|string',
            'costo_estimado' => 'nullable|numeric|min:0',
            'activa' => 'nullable|boolean',
        ]);

        $dieta = Dieta::create([
            'nombre' => $validated['nombre'],
            'etapa_objetivo' => $validated['etapa_objetivo'] ?? null,
            'descripcion' => $validated['descripcion'] ?? null,
            'costo_estimado' => $validated['costo_estimado'] ?? 0,
            'activa' => $validated['activa'] ?? true,
        ]);

        return response()->json([
            'message' => 'Dieta registrada correctamente',
            'data' => $dieta->load('ingredientes.inventario'),
        ], 201);
    }

    public function actualizarDieta(Request $request, $id)
    {
        $dieta = Dieta::findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'etapa_objetivo' => 'nullable|string|max:255',
            'descripcion' => 'nullable|string',
            'costo_estimado' => 'nullable|numeric|min:0',
            'activa' => 'nullable|boolean',
        ]);

        $dieta->update([
            'nombre' => $validated['nombre'],
            'etapa_objetivo' => $validated['etapa_objetivo'] ?? null,
            'descripcion' => $validated['descripcion'] ?? null,
            'costo_estimado' => $validated['costo_estimado'] ?? 0,
            'activa' => $validated['activa'] ?? true,
        ]);

        return response()->json([
            'message' => 'Dieta actualizada correctamente',
            'data' => $dieta->load('ingredientes.inventario'),
        ]);
    }

    public function eliminarDieta($id)
    {
        $dieta = Dieta::findOrFail($id);

        if ($dieta->consumos()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar una dieta con consumos registrados. Desactívala para conservar trazabilidad.',
            ], 422);
        }

        $dieta->delete();

        return response()->json([
            'message' => 'Dieta eliminada correctamente',
        ]);
    }

    public function guardarIngrediente(Request $request, $dietaId)
    {
        $dieta = Dieta::findOrFail($dietaId);

        $validated = $request->validate([
            'inventario_id' => 'required|exists:inventarios,id',
            'porcentaje' => 'required|numeric|min:0.01|max:100',
            'costo_unitario' => 'nullable|numeric|min:0',
        ]);

        $porcentajeActual = DietaIngrediente::where('dieta_id', $dieta->id)
            ->where('inventario_id', '!=', $validated['inventario_id'])
            ->sum('porcentaje');

        if (($porcentajeActual + $validated['porcentaje']) > 100.01) {
            return response()->json([
                'message' => 'La formulación no puede superar el 100%.',
            ], 422);
        }

        $ingrediente = DietaIngrediente::updateOrCreate(
            [
                'dieta_id' => $dieta->id,
                'inventario_id' => $validated['inventario_id'],
            ],
            [
                'porcentaje' => $validated['porcentaje'],
                'cantidad_por_kg' => $validated['porcentaje'] / 100,
                'costo_unitario' => $validated['costo_unitario'] ?? 0,
            ]
        );

        return response()->json([
            'message' => 'Ingrediente registrado correctamente',
            'data' => $ingrediente->load('inventario'),
        ], 201);
    }

    public function eliminarIngrediente($id)
    {
        $ingrediente = DietaIngrediente::findOrFail($id);
        $ingrediente->delete();

        return response()->json([
            'message' => 'Ingrediente eliminado correctamente',
        ]);
    }

    public function consumos()
    {
        return ConsumoAlimentacion::with([
                'corral',
                'dieta',
                'detalles.inventario',
            ])
            ->orderBy('fecha', 'desc')
            ->orderBy('id', 'desc')
            ->get();
    }

    public function registrarConsumo(Request $request)
    {
        $validated = $request->validate([
            'corral_id' => 'required|integer|exists:corrales,id',
            'dieta_id' => 'required|exists:dietas,id',
            'cantidad_kg' => 'required|numeric|min:0.01',
            'fecha' => 'required|date',
            'observaciones' => 'nullable|string',
        ]);

        $dieta = Dieta::with('ingredientes.inventario')->findOrFail($validated['dieta_id']);

        if (!$dieta->activa) {
            return response()->json([
                'message' => 'La dieta seleccionada está inactiva.',
            ], 422);
        }

        if ($dieta->ingredientes->isEmpty()) {
            return response()->json([
                'message' => 'La dieta no tiene ingredientes formulados.',
            ], 422);
        }

        $porcentajeTotal = round($dieta->ingredientes->sum('porcentaje'), 2);

        if (abs($porcentajeTotal - 100) > 0.01) {
            return response()->json([
                'message' => 'La dieta no es ejecutable. La formulación debe sumar 100%.',
                'porcentaje_actual' => $porcentajeTotal,
            ], 422);
        }

        $cantidadTotal = (float) $validated['cantidad_kg'];
        $faltantes = [];

        foreach ($dieta->ingredientes as $ingrediente) {
            $cantidadRequerida = round(($cantidadTotal * $ingrediente->porcentaje) / 100, 2);
            $stockActual = (float) optional($ingrediente->inventario)->stock_kg;

            if (!$ingrediente->inventario || $stockActual < $cantidadRequerida) {
                $faltantes[] = [
                    'inventario_id' => $ingrediente->inventario_id,
                    'producto' => optional($ingrediente->inventario)->nombre_producto ?? 'Producto no encontrado',
                    'stock_actual' => $stockActual,
                    'cantidad_requerida' => $cantidadRequerida,
                    'faltante' => max(0, round($cantidadRequerida - $stockActual, 2)),
                ];
            }
        }

        if (!empty($faltantes)) {
            return response()->json([
                'message' => 'Stock insuficiente para ejecutar la dieta.',
                'faltantes' => $faltantes,
            ], 422);
        }

        $consumo = DB::transaction(function () use ($validated, $dieta, $cantidadTotal) {
            $costoTotal = 0;

            $consumo = ConsumoAlimentacion::create([
                'corral_id' => $validated['corral_id'],
                'dieta_id' => $dieta->id,
                'cantidad_kg' => $cantidadTotal,
                'costo_total' => 0,
                'fecha' => $validated['fecha'],
                'observaciones' => $validated['observaciones'] ?? null,
            ]);

            foreach ($dieta->ingredientes as $ingrediente) {
                $cantidadDescontada = round(($cantidadTotal * $ingrediente->porcentaje) / 100, 2);
                $costoUnitario = (float) ($ingrediente->costo_unitario ?? 0);
                $subtotal = round($cantidadDescontada * $costoUnitario, 2);
                $costoTotal += $subtotal;

                $inventario = Inventario::findOrFail($ingrediente->inventario_id);
                $inventario->stock_kg = round(((float) $inventario->stock_kg) - $cantidadDescontada, 2);
                $inventario->save();

                ConsumoAlimentacionDetalle::create([
                    'consumo_alimentacion_id' => $consumo->id,
                    'inventario_id' => $inventario->id,
                    'cantidad_descontada' => $cantidadDescontada,
                    'costo_unitario_snapshot' => $costoUnitario,
                    'subtotal' => $subtotal,
                ]);

                $this->registrarMovimientoInventario($inventario->id, $cantidadDescontada, $consumo->id);
            }

            if ($costoTotal <= 0 && $dieta->costo_estimado > 0) {
                $costoTotal = round($cantidadTotal * (float) $dieta->costo_estimado, 2);
            }

            $consumo->costo_total = $costoTotal;
            $consumo->save();

            return $consumo->load(['corral', 'dieta', 'detalles.inventario']);
        });

        return response()->json([
            'message' => 'Consumo de alimentación registrado correctamente',
            'data' => $consumo,
        ], 201);
    }

    public function alertas()
    {
        $alertas = [];

        $dietas = Dieta::with('ingredientes.inventario')->get();

        foreach ($dietas as $dieta) {
            $porcentaje = round($dieta->ingredientes->sum('porcentaje'), 2);

            if ($dieta->ingredientes->isEmpty()) {
                $alertas[] = [
                    'tipo' => 'dieta_sin_formulacion',
                    'severidad' => 'alta',
                    'mensaje' => "La dieta {$dieta->nombre} no tiene ingredientes registrados.",
                ];
            } elseif (abs($porcentaje - 100) > 0.01) {
                $alertas[] = [
                    'tipo' => 'dieta_no_ejecutable',
                    'severidad' => 'alta',
                    'mensaje' => "La dieta {$dieta->nombre} suma {$porcentaje}% y debe sumar 100%.",
                ];
            }

            foreach ($dieta->ingredientes as $ingrediente) {
                if ($ingrediente->inventario && $ingrediente->inventario->stock_kg <= 0) {
                    $alertas[] = [
                        'tipo' => 'ingrediente_agotado',
                        'severidad' => 'alta',
                        'mensaje' => "El ingrediente {$ingrediente->inventario->nombre_producto} está agotado.",
                    ];
                }
            }
        }

        $stockBajo = Inventario::where('stock_kg', '<', 50)->get();

        foreach ($stockBajo as $producto) {
            $alertas[] = [
                'tipo' => 'stock_bajo',
                'severidad' => 'media',
                'mensaje' => "Stock bajo en {$producto->nombre_producto}: {$producto->stock_kg} kg.",
            ];
        }

        return response()->json($alertas);
    }

    private function registrarMovimientoInventario($inventarioId, $cantidad, $consumoId): void
    {
        $data = [
            'inventario_id' => $inventarioId,
            'tipo' => 'salida',
            'cantidad' => $cantidad,
        ];

        if (Schema::hasColumn('movimientos_inventario', 'tipo_origen')) {
            $data['tipo_origen'] = 'alimentacion';
        }

        if (Schema::hasColumn('movimientos_inventario', 'referencia_id')) {
            $data['referencia_id'] = $consumoId;
        }

        if (Schema::hasColumn('movimientos_inventario', 'descripcion')) {
            $data['descripcion'] = 'Consumo de alimentación por dieta';
        }

        MovimientoInventario::create($data);
    }
}
