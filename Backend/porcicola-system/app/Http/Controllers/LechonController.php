<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Lechon;
use App\Models\Corral;
use App\Models\Animal;
class LechonController extends Controller
{

    public function guardarPesos(Request $request)
    {
        foreach ($request->peso_nacimiento as $id => $peso) {

            $lechon = Lechon::find($id);

            if ($lechon) {

                // Guardar pesos
                $lechon->peso_nacimiento = $peso;
                $lechon->peso_dia_10 = $request->peso_dia_10[$id] ?? null;
                $lechon->peso_dia_28 = $request->peso_dia_28[$id] ?? null;

                // 🔥 CLASIFICACIÓN AUTOMÁTICA
                if ($peso < 1.0) {
                    $lechon->clasificacion = 'bajo_peso';
                } elseif ($peso <= 1.5) {
                    $lechon->clasificacion = 'normal';
                } else {
                    $lechon->clasificacion = 'optimo';
                }

                $lechon->save();
            }
        }

        return back()->with('success', 'Pesos y clasificación actualizados');
    }

    public function registrarMuerte(Request $request, $id)
    {
        $lechon = Lechon::findOrFail($id);

        $request->validate([
            'causa_muerte' => 'required|string|max:255'
        ]);

        $lechon->estado = 'muerto';
        $lechon->causa_muerte = $request->causa_muerte;
        $lechon->save();

        return response()->json([
            'success' => true,
            'mensaje' => 'Muerte registrada'
        ]);
    }

    public function descartar($id)
    {
        $lechon = Lechon::findOrFail($id);

        $lechon->estado = 'descartado';
        $lechon->save();

        return back()->with('success', 'Lechón descartado');
    }

    public function pasarEngorda($id)
    {
        $lechon = Lechon::findOrFail($id);

        $lechon->estado = 'engorda';
        $lechon->save();

        return back()->with('success', 'Lechón enviado a engorda');
    }

    public function matar(Request $request)
    {
        $request->validate([
            'lechon_id' => 'required|exists:lechones,id',
            'causa_muerte' => 'required|string|max:255'
        ]);

        $lechon = Lechon::findOrFail($request->lechon_id);

        $lechon->estado = 'muerto';
        $lechon->causa_muerte = $request->causa_muerte;

        $lechon->save();

        return back()->with('success', 'Lechón marcado como muerto');
    }

    public function engorda($id)
    {
        try {
            $lechon = \App\Models\Lechon::findOrFail($id);

            $lechon->estado = 'engorda';

            $corral = \App\Models\Corral::first();

            if (!$corral) {
                return response()->json(['error' => 'No hay corrales'], 500);
            }

            $lechon->corral_id = $corral->id;

            $lechon->save();

            return response()->json([
                'success' => true,
                'corral' => $corral->nombre
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function moverCorral(Request $request, $id)
    {
        try {

            $request->validate([
                'corral_id' => 'required|exists:corrales,id'
            ]);

            $animal = \App\Models\Animal::findOrFail($id);

            $animal->corral_id = $request->corral_id;
            $animal->save();

            return response()->json([
                'success' => true,
                'message' => 'Animal movido correctamente'
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
