<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Movimiento;
class MovimientoController extends Controller
{

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'animal_id' => 'required|exists:animales,id',
                'corral_origen_id' => 'nullable|exists:corrales,id',
                'corral_destino_id' => 'required|exists:corrales,id',
            ]);

            $movimiento = Movimiento::create([
                'animal_id' => $validated['animal_id'],
                'corral_origen_id' => $validated['corral_origen_id'],
                'corral_destino_id' => $validated['corral_destino_id'],
                'fecha' => now()
            ]);

            return response()->json([
                'ok' => true,
                'movimiento' => $movimiento
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function index()
    {
        return Movimiento::with([
            'animal',
            'corralOrigen',
            'corralDestino'
        ])->latest()->get();
    }
}
