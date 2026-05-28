<?php

namespace App\Http\Controllers;

use App\Models\Medicamento;
use App\Models\AplicacionMedica;
use App\Models\MovimientoMedicamento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MedicamentoController extends Controller
{
    public function index()
    {
        return response()->json(
            Medicamento::orderBy('nombre')->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
            'stock' => 'required|integer|min:0',
            'precio_unitario' => 'required|numeric|min:0',
        ]);

        try {
            $medicamento = DB::transaction(function () use ($request) {
                $medicamento = Medicamento::create([
                    'nombre' => $request->nombre,
                    'descripcion' => $request->descripcion,
                    'stock' => $request->stock,
                    'precio_unitario' => $request->precio_unitario,
                ]);

                if ((int) $request->stock > 0) {
                    MovimientoMedicamento::create([
                        'medicamento_id' => $medicamento->id,
                        'tipo' => 'entrada',
                        'cantidad' => (int) $request->stock,
                        'motivo' => 'Registro inicial',
                        'usuario' => 'Sistema',
                    ]);
                }

                return $medicamento;
            });

            return response()->json($medicamento, 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al registrar medicamento',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    public function entrada(Request $request, $id)
    {
        $request->validate([
            'cantidad' => 'required|integer|min:1',
            'motivo' => 'nullable|string|max:255',
        ]);

        try {
            $medicamento = DB::transaction(function () use ($request, $id) {
                $medicamento = Medicamento::where('id', $id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $medicamento->increment('stock', (int) $request->cantidad);

                MovimientoMedicamento::create([
                    'medicamento_id' => $medicamento->id,
                    'tipo' => 'entrada',
                    'cantidad' => (int) $request->cantidad,
                    'motivo' => $request->motivo ?: 'Entrada manual',
                    'usuario' => 'Usuario',
                ]);

                return $medicamento->fresh();
            });

            return response()->json([
                'message' => 'Entrada registrada correctamente',
                'medicamento' => $medicamento,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al registrar entrada de medicamento',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    public function merma(Request $request, $id)
    {
        $request->validate([
            'cantidad' => 'required|integer|min:1',
            'motivo' => 'required|string|max:255',
        ]);

        try {
            $medicamento = DB::transaction(function () use ($request, $id) {
                $medicamento = Medicamento::where('id', $id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $cantidad = (int) $request->cantidad;
                $stockActual = (int) ($medicamento->stock ?? 0);

                if ($stockActual < $cantidad) {
                    throw new \RuntimeException(
                        'Stock insuficiente para registrar merma. Stock actual: ' . $stockActual
                    );
                }

                $medicamento->decrement('stock', $cantidad);

                MovimientoMedicamento::create([
                    'medicamento_id' => $medicamento->id,
                    'tipo' => 'ajuste',
                    'cantidad' => $cantidad,
                    'motivo' => 'Merma de medicamento: ' . $request->motivo,
                    'usuario' => 'Usuario',
                ]);

                return $medicamento->fresh();
            });

            return response()->json([
                'message' => 'Merma de medicamento registrada correctamente',
                'medicamento' => $medicamento,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al registrar merma de medicamento',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    public function aplicar(Request $request)
    {
        $request->validate([
            'animal_id' => 'required|exists:animales,id',
            'medicamento_id' => 'required|exists:medicamentos,id',
            'dosis' => 'required|string|max:50',
            'fecha' => 'required|date',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $medicamento = Medicamento::where('id', $request->medicamento_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ((int) ($medicamento->stock ?? 0) <= 0) {
                    throw new \RuntimeException('No hay stock disponible para este medicamento.');
                }

                AplicacionMedica::create([
                    'animal_id' => $request->animal_id,
                    'medicamento' => $medicamento->nombre,
                    'dosis' => $request->dosis,
                    'fecha' => $request->fecha,
                ]);

                $medicamento->decrement('stock', 1);

                MovimientoMedicamento::create([
                    'medicamento_id' => $medicamento->id,
                    'tipo' => 'salida',
                    'cantidad' => 1,
                    'motivo' => 'Aplicación a animal #' . $request->animal_id,
                    'usuario' => 'Usuario',
                ]);
            });

            return response()->json([
                'message' => 'Medicamento aplicado correctamente'
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al aplicar medicamento',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    public function historial($animalId)
    {
        return response()->json(
            AplicacionMedica::where('animal_id', $animalId)
                ->orderByDesc('fecha')
                ->get()
        );
    }

    public function alertas()
    {
        $umbralGeneralBajo = 10;
        $umbralHierroBajo = 20;
        $umbralCritico = 5;

        $alertas = Medicamento::orderBy('stock')
            ->orderBy('nombre')
            ->get()
            ->filter(function ($medicamento) use ($umbralGeneralBajo, $umbralHierroBajo) {
                $stock = (int) ($medicamento->stock ?? 0);
                $nombre = strtolower((string) ($medicamento->nombre ?? ''));

                $esHierro = strpos($nombre, 'hierro') !== false ||
                    strpos($nombre, 'dextr') !== false;

                $umbralBajo = $esHierro ? $umbralHierroBajo : $umbralGeneralBajo;

                return $stock <= $umbralBajo;
            })
            ->map(function ($medicamento) use ($umbralGeneralBajo, $umbralHierroBajo, $umbralCritico) {
                $stock = (int) ($medicamento->stock ?? 0);
                $nombre = strtolower((string) ($medicamento->nombre ?? ''));

                $esHierro = strpos($nombre, 'hierro') !== false ||
                    strpos($nombre, 'dextr') !== false;

                $umbralBajo = $esHierro ? $umbralHierroBajo : $umbralGeneralBajo;

                if ($stock <= 0) {
                    $nivel = 'sin_stock';
                    $prioridad = 'critica';
                } elseif ($stock <= $umbralCritico) {
                    $nivel = 'critico';
                    $prioridad = 'critica';
                } else {
                    $nivel = 'bajo';
                    $prioridad = 'importante';
                }

                if ($esHierro && $stock <= 0) {
                    $mensaje = 'Hierro sin stock disponible. Riesgo directo para lechones pendientes de hierro obligatorio.';
                    $accion = 'Registrar entrada de hierro antes de aplicar controles sanitarios obligatorios.';
                } elseif ($esHierro && $stock <= $umbralCritico) {
                    $mensaje = 'Stock crítico de hierro. Puede no ser suficiente para cubrir lechones próximos.';
                    $accion = 'Reabastecer hierro de forma prioritaria.';
                } elseif ($esHierro) {
                    $mensaje = 'Stock bajo de hierro. Vigilar suministro para controles obligatorios de lechones.';
                    $accion = 'Programar compra o entrada de hierro.';
                } elseif ($stock <= 0) {
                    $mensaje = 'Medicamento sin stock disponible.';
                    $accion = 'Registrar entrada antes de usar este medicamento.';
                } elseif ($stock <= $umbralCritico) {
                    $mensaje = 'Stock crítico de medicamento.';
                    $accion = 'Reabastecer cuanto antes.';
                } else {
                    $mensaje = 'Stock bajo de medicamento.';
                    $accion = 'Revisar inventario y programar compra.';
                }

                return [
                    'id' => $medicamento->id,
                    'nombre' => $medicamento->nombre,
                    'descripcion' => $medicamento->descripcion,
                    'stock' => $stock,
                    'precio_unitario' => $medicamento->precio_unitario,
                    'es_hierro' => $esHierro,
                    'nivel' => $nivel,
                    'prioridad' => $prioridad,
                    'umbral_bajo' => $umbralBajo,
                    'umbral_critico' => $umbralCritico,
                    'mensaje' => $mensaje,
                    'accion_sugerida' => $accion,
                    'created_at' => $medicamento->created_at,
                    'updated_at' => $medicamento->updated_at,
                ];
            })
            ->values();

        return response()->json($alertas);
    }

    public function movimientos()
    {
        $movimientos = MovimientoMedicamento::with('medicamento')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(function ($movimiento) {
                return [
                    'id' => $movimiento->id,
                    'medicamento_id' => $movimiento->medicamento_id,
                    'tipo' => $movimiento->tipo,
                    'cantidad' => $movimiento->cantidad,
                    'motivo' => $movimiento->motivo,
                    'usuario' => $movimiento->usuario,
                    'created_at' => $movimiento->created_at,
                    'updated_at' => $movimiento->updated_at,
                    'fecha_movimiento' => optional($movimiento->created_at)->format('Y-m-d H:i:s'),
                    'medicamento' => $movimiento->medicamento ? [
                        'id' => $movimiento->medicamento->id,
                        'nombre' => $movimiento->medicamento->nombre,
                        'descripcion' => $movimiento->medicamento->descripcion,
                        'stock' => $movimiento->medicamento->stock,
                        'precio_unitario' => $movimiento->medicamento->precio_unitario,
                    ] : null,
                ];
            });

        return response()->json($movimientos);
    }
}