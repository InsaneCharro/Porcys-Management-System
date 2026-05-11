<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSolicitudCompraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo' => 'required|in:manual,automatica,prediccion',
            'motivo' => 'nullable|string',
            'observaciones' => 'nullable|string',

            'detalles' => 'required|array|min:1',

            'detalles.*.categoria' => 'required|in:alimento,medicamento',
            'detalles.*.item_id' => 'required|integer',
            'detalles.*.cantidad' => 'required|numeric|min:0.01',
            'detalles.*.unidad' => 'nullable|string|max:30',
            'detalles.*.observaciones' => 'nullable|string',
        ];
    }
}