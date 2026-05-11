<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProveedorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:150',
            'empresa' => 'nullable|string|max:150',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'direccion' => 'nullable|string',
            'tipo_proveedor' => 'required|in:alimento,medicamento,mixto,general',
            'rfc' => 'nullable|string|max:20',
            'contacto_principal' => 'nullable|string|max:150',
            'activo' => 'boolean',
        ];
    }
}