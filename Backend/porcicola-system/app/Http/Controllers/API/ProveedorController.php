<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProveedorRequest;
use App\Http\Requests\UpdateProveedorRequest;
use App\Models\Proveedor;

class ProveedorController extends Controller
{
    public function index()
    {
        $proveedores = Proveedor::orderBy('nombre')->get();

        return response()->json([
            'success' => true,
            'data' => $proveedores
        ]);
    }

    public function show($id)
    {
        $proveedor = Proveedor::find($id);

        if (!$proveedor) {
            return response()->json([
                'success' => false,
                'message' => 'Proveedor no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $proveedor
        ]);
    }

    public function store(StoreProveedorRequest $request)
    {
        $proveedor = Proveedor::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Proveedor creado correctamente',
            'data' => $proveedor
        ], 201);
    }

    public function update(UpdateProveedorRequest $request, $id)
    {
        $proveedor = Proveedor::find($id);

        if (!$proveedor) {
            return response()->json([
                'success' => false,
                'message' => 'Proveedor no encontrado'
            ], 404);
        }

        $proveedor->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Proveedor actualizado correctamente',
            'data' => $proveedor
        ]);
    }

    public function destroy($id)
    {
        $proveedor = Proveedor::find($id);

        if (!$proveedor) {
            return response()->json([
                'success' => false,
                'message' => 'Proveedor no encontrado'
            ], 404);
        }

        $proveedor->update([
            'activo' => false
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Proveedor desactivado correctamente'
        ]);
    }
}