<?php

namespace App\Http\Controllers;

use App\Models\Medicamento;
use App\Models\AplicacionMedica;
use App\Models\MovimientoMedicamento;
use Illuminate\Http\Request;

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

        $medicamento = Medicamento::create($request->all());

        MovimientoMedicamento::create([
            'medicamento_id' => $medicamento->id,
            'tipo' => 'entrada',
            'cantidad' => $medicamento->stock,
            'motivo' => 'Registro inicial',
            'usuario' => 'Sistema',
        ]);

        return response()->json($medicamento, 201);
    }

    public function entrada(Request $request, $id)
    {
        $request->validate([
            'cantidad' => 'required|integer|min:1',
            'motivo' => 'nullable|string|max:255',
        ]);

        $medicamento = Medicamento::findOrFail($id);

        $medicamento->increment('stock', $request->cantidad);

        MovimientoMedicamento::create([
            'medicamento_id' => $medicamento->id,
            'tipo' => 'entrada',
            'cantidad' => $request->cantidad,
            'motivo' => $request->motivo ?? 'Entrada manual',
            'usuario' => 'Usuario',
        ]);

        return response()->json([
            'message' => 'Entrada registrada correctamente',
            'medicamento' => $medicamento->fresh(),
        ]);
    }

    public function aplicar(Request $request)
    {
        $request->validate([
            'animal_id' => 'required|exists:animales,id',
            'medicamento_id' => 'required|exists:medicamentos,id',
            'dosis' => 'required|string|max:50',
            'fecha' => 'required|date',
        ]);

        $medicamento = Medicamento::findOrFail($request->medicamento_id);

        if ($medicamento->stock <= 0) {
            return response()->json([
                'message' => 'No hay stock disponible'
            ], 422);
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

        return response()->json([
            'message' => 'Medicamento aplicado correctamente'
        ]);
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
        return response()->json(
            Medicamento::where('stock', '<=', 5)
                ->orderBy('stock')
                ->get()
        );
    }

    public function movimientos()
    {
        return response()->json(
            MovimientoMedicamento::with('medicamento')
                ->orderByDesc('created_at')
                ->get()
        );
    }
}