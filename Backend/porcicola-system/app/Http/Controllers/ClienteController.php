<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index()
    {
        $clientes = Cliente::withCount('ventas')
            ->orderBy('nombre')
            ->get();

        return response()->json($clientes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'direccion' => 'nullable|string|max:255',
            'tipo_cliente' => 'required|in:abasto,pie_cria,distribuidor,otro',
            'notas' => 'nullable|string'
        ]);

        $cliente = Cliente::create($request->all());

        return response()->json([
            'mensaje' => 'Cliente registrado correctamente',
            'data' => $cliente
        ], 201);
    }

    public function show($id)
    {
        $cliente = Cliente::with('ventas.animal')->findOrFail($id);

        return response()->json($cliente);
    }

    public function update(Request $request, $id)
    {
        $cliente = Cliente::findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'direccion' => 'nullable|string|max:255',
            'tipo_cliente' => 'required|in:abasto,pie_cria,distribuidor,otro',
            'notas' => 'nullable|string'
        ]);

        $cliente->update($request->all());

        return response()->json([
            'mensaje' => 'Cliente actualizado correctamente',
            'data' => $cliente
        ]);
    }

    public function destroy($id)
    {
        $cliente = Cliente::findOrFail($id);

        if ($cliente->ventas()->count() > 0) {
            return response()->json([
                'error' => 'No se puede eliminar un cliente con historial de ventas'
            ], 400);
        }

        $cliente->delete();

        return response()->json([
            'mensaje' => 'Cliente eliminado correctamente'
        ]);
    }

    public function ranking()
    {
        $clientes = Cliente::withCount('ventas')
            ->withSum('ventas', 'total')
            ->orderByDesc('ventas_sum_total')
            ->get();

        return response()->json($clientes);
    }
}