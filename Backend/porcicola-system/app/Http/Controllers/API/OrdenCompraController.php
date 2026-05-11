<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrdenCompraRequest;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraDetalle;
use App\Models\Proveedor;
use App\Models\SolicitudCompra;
use Illuminate\Support\Facades\DB;

class OrdenCompraController extends Controller
{
    public function desdeSolicitud(StoreOrdenCompraRequest $request)
    {
        DB::beginTransaction();

        try {
            $solicitud = SolicitudCompra::with('detalles')
                ->find($request->solicitud_compra_id);

            if (!$solicitud) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solicitud no encontrada'
                ], 404);
            }

            if ($solicitud->estado !== 'aprobada') {
                return response()->json([
                    'success' => false,
                    'message' => 'La solicitud debe estar aprobada'
                ], 422);
            }

            $proveedor = Proveedor::find($request->proveedor_id);

            if (!$proveedor || !$proveedor->activo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Proveedor inválido'
                ], 422);
            }

            $folio = 'OC-' . now()->format('YmdHis');

            $subtotal = 0;

            $orden = OrdenCompra::create([
                'folio' => $folio,
                'proveedor_id' => $proveedor->id,
                'solicitud_compra_id' => $solicitud->id,
                'estado' => 'emitida',
                'impuestos' => $request->impuestos ?? 0,
                'observaciones' => $request->observaciones,
            ]);

            foreach ($solicitud->detalles as $detalleSolicitud) {
                $precioInput = collect($request->detalles)
                    ->first(function ($item) use ($detalleSolicitud) {
                        return
                            $item['item_id'] == $detalleSolicitud->item_id &&
                            $item['categoria'] === $detalleSolicitud->categoria;
                    });

                if (!$precioInput) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'message' => 'Faltan precios unitarios para algunos items'
                    ], 422);
                }

                $detalleSubtotal =
                    $detalleSolicitud->cantidad * $precioInput['precio_unitario'];

                OrdenCompraDetalle::create([
                    'orden_compra_id' => $orden->id,
                    'categoria' => $detalleSolicitud->categoria,
                    'item_id' => $detalleSolicitud->item_id,
                    'cantidad' => $detalleSolicitud->cantidad,
                    'precio_unitario' => $precioInput['precio_unitario'],
                    'subtotal' => $detalleSubtotal,
                ]);

                $subtotal += $detalleSubtotal;
            }

            $total = $subtotal + ($request->impuestos ?? 0);

            $orden->update([
                'subtotal' => $subtotal,
                'total' => $total,
            ]);

            $solicitud->update([
                'estado' => 'convertida'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Orden de compra creada correctamente',
                'data' => $orden->load('detalles', 'proveedor')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function index()
    {
        $ordenes = OrdenCompra::with('proveedor', 'detalles')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $ordenes
        ]);
    }
}