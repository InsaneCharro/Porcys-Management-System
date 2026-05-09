<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Muerte;
use App\Models\Animal;

class MuerteController extends Controller
{
    public function registrar(Request $request, $animalId)
    {
        $request->validate([
            'fecha' => 'required|date',
            'causa' => 'required|string|max:255',
            'observaciones' => 'nullable|string',
            'peso' => 'nullable|numeric'
        ]);

        $animal = Animal::findOrFail($animalId);

        $costoEstimado = 0;

        if ($animal->peso) {
            $costoEstimado = $animal->peso * 45;
        }

        $muerte = Muerte::create([
            'animal_id' => $animal->id,
            'fecha' => $request->fecha,
            'causa' => $request->causa,
            'observaciones' => $request->observaciones,
            'peso' => $request->peso ?? $animal->peso,
            'costo_estimado' => $costoEstimado,
            'etapa' => $animal->etapa_actual
        ]);

        $animal->update([
            'estado' => 'muerto'
        ]);

        if ($animal->corral_id) {
            $animal->update([
                'corral_id' => null
            ]);
        }

        return response()->json([
            'message' => 'Muerte registrada correctamente',
            'muerte' => $muerte
        ]);
    }

    public function historial($animalId)
    {
        $historial = Muerte::where('animal_id', $animalId)
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json($historial);
    }
}