<?php

namespace App\Http\Controllers;

use App\Models\Camada;
use App\Models\Lechon;
use App\Models\Parto;

class CamadaController extends Controller
{
    public function index()
    {
        return Camada::with([
            'madre',
            'gestacion'
        ])
        ->latest()
        ->get();
    }

    public function show($id)
    {
        $camada = Camada::with([
            'madre',
            'gestacion'
        ])->findOrFail($id);

        $parto = Parto::query()
            ->where('gestacion_id', $camada->gestacion_id)
            ->first();

        if (!$parto) {
            $parto = Parto::query()
                ->where('madre_id', $camada->madre_id)
                ->whereDate('fecha_parto', $camada->fecha_parto)
                ->first();
        }

        if (!$parto) {
            $parto = Parto::query()
                ->where('madre_id', $camada->madre_id)
                ->orderByRaw('ABS(DATEDIFF(fecha_parto, ?))', [$camada->fecha_parto])
                ->first();
        }

        $lechones = collect();

        if ($parto) {
            $lechones = Lechon::query()
                ->where('parto_id', $parto->id)
                ->orderBy('id')
                ->get()
                ->map(function ($lechon) {
                    return [
                        'id' => $lechon->id,
                        'identificador_unico' => $lechon->identificador_unico ?: 'L' . $lechon->id,
                        'sexo' => $lechon->sexo === 'M'
                            ? 'macho'
                            : ($lechon->sexo === 'H' ? 'hembra' : $lechon->sexo),
                        'peso' => $lechon->peso_nacimiento,
                        'peso_nacimiento' => $lechon->peso_nacimiento,
                        'peso_dia_10' => $lechon->peso_dia_10,
                        'peso_dia_28' => $lechon->peso_dia_28,
                        'clasificacion' => $lechon->clasificacion,
                        'estado' => $lechon->estado,
                        'etapa_actual' => 'lechon',
                        'causa_muerte' => $lechon->causa_muerte,
                        'corral_id' => $lechon->corral_id,
                    ];
                });
        }

        $data = $camada->toArray();
        $data['parto_relacionado_id'] = $parto?->id;
        $data['lechones'] = $lechones->values()->all();

        if ($lechones->count() > 0) {
            $pesosNacimiento = $lechones
                ->pluck('peso_nacimiento')
                ->filter(fn ($peso) => $peso !== null);

            $data['total_crias'] = $lechones->count();
            $data['vivos'] = $lechones->where('estado', '!=', 'muerto')->count();
            $data['muertos'] = $lechones->where('estado', 'muerto')->count();
            $data['machos'] = $lechones->where('sexo', 'macho')->count();
            $data['hembras'] = $lechones->where('sexo', 'hembra')->count();

            if ($pesosNacimiento->count() > 0) {
                $data['peso_promedio_nacimiento'] = round($pesosNacimiento->avg(), 2);
            }
        }

        return response()->json($data);
    }
}