<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index()
    {
        $clientes = Cliente::withCount([
                'ventas as ventas_count' => function ($query) {
                    $query->where('estado', 'completada');
                }
            ])
            ->withSum([
                'ventas as ventas_sum_total' => function ($query) {
                    $query->where('estado', 'completada');
                }
            ], 'total')
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

        $cliente = Cliente::create($request->only([
            'nombre',
            'telefono',
            'email',
            'direccion',
            'tipo_cliente',
            'notas'
        ]));

        return response()->json([
            'mensaje' => 'Cliente registrado correctamente',
            'data' => $cliente
        ], 201);
    }

    public function show($id)
    {
        $cliente = Cliente::with([
                'ventas' => function ($query) {
                    $query
                        ->with([
                            'detalleAnimales.animal'
                        ])
                        ->orderByDesc('fecha')
                        ->orderByDesc('id');
                }
            ])
            ->findOrFail($id);

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

        $cliente->update($request->only([
            'nombre',
            'telefono',
            'email',
            'direccion',
            'tipo_cliente',
            'notas'
        ]));

        return response()->json([
            'mensaje' => 'Cliente actualizado correctamente',
            'data' => $cliente
        ]);
    }

    public function destroy($id)
    {
        $cliente = Cliente::findOrFail($id);

        if ($cliente->ventas()->exists()) {
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
        $clientes = Cliente::withCount([
                'ventas as ventas_count' => function ($query) {
                    $query->where('estado', 'completada');
                }
            ])
            ->withSum([
                'ventas as ventas_sum_total' => function ($query) {
                    $query->where('estado', 'completada');
                }
            ], 'total')
            ->orderByDesc('ventas_sum_total')
            ->get();

        return response()->json($clientes);
    }
}