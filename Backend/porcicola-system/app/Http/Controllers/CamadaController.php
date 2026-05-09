<?php

namespace App\Http\Controllers;

use App\Models\Camada;

class CamadaController extends Controller
{
    // 📋 Listar camadas
    public function index()
    {
        return Camada::with([
            'madre',
            'gestacion'
        ])
        ->latest()
        ->get();
    }

    // 🔍 Ver detalle
    public function show($id)
    {
        return Camada::with([
            'madre',
            'gestacion',
            'lechones'
        ])->findOrFail($id);
    }
}