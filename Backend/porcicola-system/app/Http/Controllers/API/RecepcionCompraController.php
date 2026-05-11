<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecepcionCompraRequest;
use App\Models\OrdenCompra;
use App\Models\RecepcionCompra;
use App\Models\Inventario;
use App\Models\Medicamento;
use App\Models\MovimientoInventario;
use App\Models\MovimientoMedicamento;
use Illuminate\Support\Facades\DB;

class RecepcionCompraController extends Controller
{
    public function recibir(StoreRecepcionCompraRequest $request)
    {
        DB::beginTransaction();

        try {
            $orden = OrdenCompra::with('detalles')
                ->find($request->orden_compra_id);

            if (!$orden) {
                return response()->json([
                    'success' => false,
                    'message' => 'Orden no encontrada'
                ], 404);
            }

            if ($orden->estado !== 'emitida') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo órdenes emitidas pueden recibirse'
                ], 422);
            }

            $recepcion = RecepcionCompra::create([
                'folio' => 'RC-' . now()->format('YmdHis'),
                'orden_compra_id' => $orden->id,
                'observaciones' => $request->observaciones
            ]);

            foreach ($orden->detalles as $detalle) {
                if ($detalle->categoria === 'alimento') {
                    $inventario = Inventario::find($detalle->item_id);

                    if ($inventario) {
                        $inventario->increment('stock_kg', $detalle->cantidad);

                        MovimientoInventario::create([
                            'inventario_id' => $inventario->id,
                            'tipo' => 'entrada',
                            'cantidad' => $detalle->cantidad,
                            'tipo_origen' => 'compra',
                            'referencia_id' => $orden->id
                        ]);
                    }
                }

                if ($detalle->categoria === 'medicamento') {
                    $medicamento = Medicamento::find($detalle->item_id);

                    if ($medicamento) {
                        $medicamento->increment('stock', $detalle->cantidad);

                        MovimientoMedicamento::create([
                            'medicamento_id' => $medicamento->id,
                            'tipo' => 'entrada',
                            'cantidad' => $detalle->cantidad,
                            'motivo' => 'Compra',
                            'usuario' => 'Sistema'
                        ]);
                    }
                }
            }

            $orden->update([
                'estado' => 'recibida'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Recepción procesada correctamente',
                'data' => $recepcion
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}