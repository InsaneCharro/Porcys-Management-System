<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSolicitudCompraRequest;
use App\Http\Requests\UpdateEstadoSolicitudRequest;
use App\Models\SolicitudCompra;
use App\Models\SolicitudCompraDetalle;
use App\Models\Inventario;
use App\Models\Medicamento;
use Illuminate\Support\Facades\DB;

class SolicitudCompraController extends Controller
{
    public function index()
    {
        $solicitudes = SolicitudCompra::with('detalles')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $solicitudes
        ]);
    }

    public function show($id)
    {
        $solicitud = SolicitudCompra::with('detalles')->find($id);

        if (!$solicitud) {
            return response()->json([
                'success' => false,
                'message' => 'Solicitud no encontrada'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $solicitud
        ]);
    }

    public function store(StoreSolicitudCompraRequest $request)
    {
        DB::beginTransaction();

        try {
            foreach ($request->detalles as $detalle) {
                if ($detalle['categoria'] === 'alimento') {
                    $exists = Inventario::find($detalle['item_id']);
                } else {
                    $exists = Medicamento::find($detalle['item_id']);
                }

                if (!$exists) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Item inválido detectado'
                    ], 422);
                }
            }

            $folio = 'SC-' . now()->format('YmdHis');

            $solicitud = SolicitudCompra::create([
                'folio' => $folio,
                'tipo' => $request->tipo,
                'motivo' => $request->motivo,
                'observaciones' => $request->observaciones,
                'solicitado_por' => auth()->id(),
            ]);

            foreach ($request->detalles as $detalle) {
                SolicitudCompraDetalle::create([
                    'solicitud_compra_id' => $solicitud->id,
                    'categoria' => $detalle['categoria'],
                    'item_id' => $detalle['item_id'],
                    'cantidad' => $detalle['cantidad'],
                    'unidad' => $detalle['unidad'] ?? null,
                    'observaciones' => $detalle['observaciones'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Solicitud creada correctamente',
                'data' => $solicitud->load('detalles')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function cambiarEstado(UpdateEstadoSolicitudRequest $request, $id)
    {
        $solicitud = SolicitudCompra::find($id);

        if (!$solicitud) {
            return response()->json([
                'success' => false,
                'message' => 'Solicitud no encontrada'
            ], 404);
        }

        if ($solicitud->estado !== 'pendiente') {
            return response()->json([
                'success' => false,
                'message' => 'Solo solicitudes pendientes pueden modificarse'
            ], 422);
        }

        $solicitud->update([
            'estado' => $request->estado,
            'observaciones' => $request->observaciones ?? $solicitud->observaciones
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Estado actualizado correctamente',
            'data' => $solicitud
        ]);
    }
}