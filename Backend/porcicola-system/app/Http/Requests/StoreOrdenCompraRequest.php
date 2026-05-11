<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrdenCompraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'solicitud_compra_id' => 'required|integer',
            'proveedor_id' => 'required|integer',
            'impuestos' => 'nullable|numeric|min:0',
            'observaciones' => 'nullable|string',

            'detalles' => 'required|array|min:1',

            'detalles.*.categoria' => 'required|in:alimento,medicamento',
            'detalles.*.item_id' => 'required|integer',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
        ];
    }
}