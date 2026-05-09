<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;
use App\Models\Alimento;
use App\Models\MovimientoAlimento;
use Illuminate\Http\Request;

class AlimentoController extends Controller
{
    // 📋 Ver alimentos
    public function index()
    {
        return Alimento::all();
    }

    // ➕ Crear alimento
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required',
            'tipo' => 'required',
            'stock' => 'required|numeric',
            'unidad' => 'required'
        ]);

        $alimento = Alimento::create($request->all());

        return response()->json($alimento, 201);
    }

    // 📦 ENTRADA (compra)
    public function entrada(Request $request, $id)
    {
        $request->validate([
            'cantidad' => 'required|numeric|min:0'
        ]);

        $alimento = Alimento::findOrFail($id);

        // aumentar stock
        $alimento->stock += $request->cantidad;
        $alimento->save();

        // registrar movimiento
        MovimientoAlimento::create([
            'alimento_id' => $id,
            'tipo' => 'entrada',
            'cantidad' => $request->cantidad,
            'motivo' => 'compra',
            'fecha' => now()
        ]);

        return response()->json([
            'mensaje' => 'Entrada registrada',
            'stock_actual' => $alimento->stock
        ]);
    }

    // 🍽️ CONSUMO (alimentación)
    public function consumo(Request $request, $id)
    {
        $request->validate([
            'cantidad' => 'required|numeric|min:0'
        ]);

        $alimento = Alimento::findOrFail($id);

        if ($alimento->stock < $request->cantidad) {
            return response()->json([
                'error' => 'Stock insuficiente'
            ], 400);
        }

        // descontar stock
        $alimento->stock -= $request->cantidad;
        $alimento->save();

        // registrar movimiento
        MovimientoAlimento::create([
            'alimento_id' => $id,
            'tipo' => 'consumo',
            'cantidad' => $request->cantidad,
            'motivo' => 'alimentación',
            'fecha' => now()->toDateString()
        ]);

        return response()->json([
            'mensaje' => 'Consumo registrado',
            'stock_actual' => $alimento->stock
        ]);
    }

    public function consumoAnimal(Request $request)
    {
        $request->validate([
            'animal_id' => 'required|exists:animales,id',
            'alimento_id' => 'required|exists:alimentos,id',
            'cantidad' => 'required|numeric|min:0'
        ]);

        $alimento = Alimento::findOrFail($request->alimento_id);

        if ($alimento->stock < $request->cantidad) {
            return response()->json([
                'error' => 'Stock insuficiente'
            ], 400);
        }

        DB::beginTransaction();

        try {

            // 1️⃣ registrar consumo
            DB::table('consumo_alimento')->insert([
                'animal_id' => $request->animal_id,
                'alimento_id' => $request->alimento_id,
                'cantidad' => $request->cantidad,
                'fecha' => now()->toDateString()
            ]);

            // 2️⃣ descontar stock
            $alimento->stock -= $request->cantidad;
            $alimento->save();

            // 3️⃣ registrar movimiento
            MovimientoAlimento::create([
                'alimento_id' => $request->alimento_id,
                'tipo' => 'consumo',
                'cantidad' => $request->cantidad,
                'motivo' => 'alimentación animal',
                'fecha' => now()->toDateString()
            ]);

            DB::commit();

            return response()->json([
                'mensaje' => 'Consumo registrado correctamente'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}