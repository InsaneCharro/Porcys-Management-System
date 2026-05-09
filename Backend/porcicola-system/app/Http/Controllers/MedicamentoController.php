<?php

namespace App\Http\Controllers;

use App\Models\Medicamento;
use App\Models\AplicacionMedica;
use App\Models\MovimientoMedicamento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MedicamentoController extends Controller
{
    // =========================
    // REGISTRAR MEDICAMENTO
    // =========================
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string',
            'tipo' => 'required|string',
            'stock' => 'required|numeric',
            'unidad' => 'required|string'
        ]);

        $med = Medicamento::create($request->all());

        MovimientoMedicamento::create([
            'medicamento_id' => $med->id,
            'tipo' => 'entrada',
            'cantidad' => $med->stock,
            'motivo' => 'Registro inicial medicamento',
            'usuario' => 'Sistema'
        ]);

        return response()->json($med, 201);
    }

    // =========================
    // LISTAR
    // =========================
    public function index()
    {
        return Medicamento::all();
    }

    // =========================
    // ENTRADA STOCK
    // =========================
    public function entrada($id, Request $request)
    {
        $request->validate([
            'cantidad' => 'required|numeric|min:0'
        ]);

        $med = Medicamento::findOrFail($id);

        $med->stock += $request->cantidad;
        $med->save();

        MovimientoMedicamento::create([
            'medicamento_id' => $med->id,
            'tipo' => 'entrada',
            'cantidad' => $request->cantidad,
            'motivo' => 'Entrada manual',
            'usuario' => 'Sistema'
        ]);

        return response()->json([
            'mensaje' => 'Stock actualizado',
            'stock_actual' => $med->stock
        ]);
    }

    // =========================
    // APLICAR MEDICAMENTO
    // =========================
    public function aplicar(Request $request)
    {
        $request->validate([
            'animal_id' => 'required|exists:animales,id',
            'medicamento_id' => 'required|exists:medicamentos,id',
            'dosis' => 'required|numeric|min:0',
            'fecha' => 'required|date'
        ]);

        DB::beginTransaction();

        try {

            $med = Medicamento::findOrFail(
                $request->medicamento_id
            );

            if ($med->stock < $request->dosis) {
                return response()->json([
                    'error' => 'Stock insuficiente'
                ], 400);
            }

            AplicacionMedica::create([
                'animal_id' => $request->animal_id,
                'medicamento' => $med->nombre,
                'dosis' => $request->dosis,
                'fecha' => $request->fecha
            ]);

            $med->stock -= $request->dosis;
            $med->save();

            MovimientoMedicamento::create([
                'medicamento_id' => $med->id,
                'tipo' => 'salida',
                'cantidad' => $request->dosis,
                'motivo' => 'Aplicación animal #' . $request->animal_id,
                'usuario' => 'Sistema'
            ]);

            DB::commit();

            return response()->json([
                'mensaje' => 'Medicamento aplicado',
                'stock_restante' => $med->stock
            ]);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // =========================
    // HISTORIAL
    // =========================
    public function historial($animalId)
    {
        $historial = \DB::table('aplicaciones_medicas')
            ->where('animal_id', $animalId)
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json($historial);
    }

    // =========================
    // ALERTAS
    // =========================
    public function alertas()
    {
        $alertas = [];

        $animales = \App\Models\Animal::all();

        foreach ($animales as $animal) {

            $ultima = AplicacionMedica::where(
                'animal_id',
                $animal->id
            )
            ->orderBy('fecha', 'desc')
            ->first();

            if (!$ultima) {
                $alertas[] = [
                    'animal_id' => $animal->id,
                    'tipo' => 'sin_tratamiento',
                    'mensaje' => 'Animal sin historial médico'
                ];

                continue;
            }

            $dias = Carbon::parse(
                $ultima->fecha
            )->diffInDays(now());

            if ($dias > 30) {
                $alertas[] = [
                    'animal_id' => $animal->id,
                    'tipo' => 'tratamiento_vencido',
                    'mensaje' => 'Tratamiento vencido'
                ];
            }

            $conteo = AplicacionMedica::where(
                'animal_id',
                $animal->id
            )
            ->whereBetween('fecha', [
                now()->subDays(7),
                now()
            ])
            ->count();

            if ($conteo > 3) {
                $alertas[] = [
                    'animal_id' => $animal->id,
                    'tipo' => 'exceso_tratamiento',
                    'mensaje' => 'Demasiadas aplicaciones recientes'
                ];
            }
        }

        $medicamentos = Medicamento::all();

        foreach ($medicamentos as $m) {

            if ($m->stock < 10) {
                $alertas[] = [
                    'tipo' => 'stock_bajo',
                    'medicamento' => $m->nombre,
                    'stock' => $m->stock
                ];
            }
        }

        return response()->json($alertas);
    }
    
}