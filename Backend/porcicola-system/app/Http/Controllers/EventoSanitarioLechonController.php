<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Medicamento;
use App\Models\EventoSanitarioLechon;

class EventoSanitarioLechonController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'lechon_id' => 'required|exists:lechones,id',
            'tipo' => 'required|in:vacuna,tratamiento',
            'medicamento_id' => 'required|exists:medicamentos,id',
            'dosis' => 'required|numeric|min:0.01',
            'fecha' => 'required|date',
            'observaciones' => 'nullable|string'
        ]);

        DB::beginTransaction();

        try {
            // 1) Medicamento
            $medicamento = Medicamento::findOrFail($request->medicamento_id);

            if ($medicamento->stock < $request->dosis) {
                throw new \Exception("Stock insuficiente");
            }

            // 2) Crear evento
            $evento = EventoSanitarioLechon::create([
                'lechon_id' => $request->lechon_id,
                'tipo' => $request->tipo,
                'medicamento_id' => $request->medicamento_id,
                'dosis' => $request->dosis,
                'fecha' => $request->fecha,
                'observaciones' => $request->observaciones
            ]);

            // 3) Descontar stock
            $medicamento->stock -= $request->dosis;
            $medicamento->save();

            // 4) Movimiento (ajústalo a tus columnas reales)
            DB::table('movimientos_inventario')->insert([
                'inventario_id' => $medicamento->id,   // reutilizas id de medicamento
                'tipo' => 'salida',
                'cantidad' => $request->dosis,
                'tipo_origen' => 'sanidad',
                'referencia_id' => $evento->id,
                'created_at' => now()
            ]);

            DB::commit();

            return response()->json(['success' => true]);

        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }
}