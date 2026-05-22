<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Muerte;
use App\Models\Animal;

class MuerteController extends Controller
{
    private array $causasPermitidas = [
        'enfermedad',
        'aplastamiento',
        'bajo_peso',
        'problema_respiratorio',
        'problema_digestivo',
        'lesion',
        'sacrificio_sanitario',
        'descarte_reproductivo',
        'baja_productividad',
        'edad_avanzada',
        'otra_controlada',
    ];

    public function index(Request $request)
    {
        $query = Muerte::with(['animal', 'corral'])
            ->orderBy('fecha', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('tipo_baja')) {
            $query->where('tipo_baja', $request->tipo_baja);
        }

        if ($request->filled('causa')) {
            $query->where('causa', $request->causa);
        }

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha', '>=', $request->fecha_inicio);
        }

        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha', '<=', $request->fecha_fin);
        }

        return response()->json($query->get());
    }

    public function resumen()
    {
        $total = Muerte::count();
        $muertes = Muerte::where('tipo_baja', 'muerte')->count();
        $descartes = Muerte::where('tipo_baja', 'descarte')->count();

        $porCausa = Muerte::selectRaw('causa, COUNT(*) as total')
            ->groupBy('causa')
            ->orderByDesc('total')
            ->get();

        $porEtapa = Muerte::selectRaw('COALESCE(etapa_animal_snapshot, "Sin etapa") as etapa, COUNT(*) as total')
            ->groupBy('etapa_animal_snapshot')
            ->orderByDesc('total')
            ->get();

        $ultimos30Dias = Muerte::whereDate('fecha', '>=', now()->subDays(30))->count();

        return response()->json([
            'total' => $total,
            'muertes' => $muertes,
            'descartes' => $descartes,
            'ultimos_30_dias' => $ultimos30Dias,
            'por_causa' => $porCausa,
            'por_etapa' => $porEtapa,
        ]);
    }

    public function causas()
    {
        return response()->json($this->causasPermitidas);
    }

    public function registrar(Request $request, $animalId)
    {
        $request->validate([
            'tipo_baja' => 'required|in:muerte,descarte',
            'fecha' => 'required|date',
            'hora_aproximada' => 'nullable|date_format:H:i',
            'causa' => 'required|in:' . implode(',', $this->causasPermitidas),
            'observaciones' => 'nullable|string',
            'peso' => 'nullable|numeric|min:0',
            'costo_estimado_perdida' => 'nullable|numeric|min:0',
        ]);

        $animal = Animal::findOrFail($animalId);

        $estadoNormalizado = strtolower(trim($animal->estado ?? ''));

        if (
            str_contains($estadoNormalizado, 'muert') ||
            str_contains($estadoNormalizado, 'descart') ||
            str_contains($estadoNormalizado, 'baja')
        ) {
            return response()->json([
                'message' => 'Este animal ya fue registrado previamente como baja.'
            ], 422);
        }

        $pesoFinal = $request->peso ?? $animal->peso;
        $costoEstimado = $request->costo_estimado_perdida;

        if ($costoEstimado === null && $pesoFinal) {
            $costoEstimado = $pesoFinal * 45;
        }

        $muerte = Muerte::create([
            'animal_id' => $animal->id,
            'tipo_baja' => $request->tipo_baja,
            'fecha' => $request->fecha,
            'hora_aproximada' => $request->hora_aproximada,
            'corral_id' => $animal->corral_id ?? null,
            'causa' => $request->causa,
            'observaciones' => $request->observaciones,
            'peso' => $pesoFinal,
            'costo_estimado_perdida' => $costoEstimado ?? 0,
            'etapa_animal_snapshot' => $animal->etapa_actual ?? $animal->etapa ?? null,
            'estado_anterior_animal' => $animal->estado,
        ]);

        $animal->update([
            'estado' => $request->tipo_baja === 'muerte' ? 'muerto' : 'descartado',
            'corral_id' => null,
        ]);

        return response()->json([
            'message' => $request->tipo_baja === 'muerte'
                ? 'Muerte registrada correctamente'
                : 'Descarte registrado correctamente',
            'baja' => $muerte->load(['animal', 'corral']),
        ]);
    }

    public function historial($animalId)
    {
        $historial = Muerte::with('corral')
            ->where('animal_id', $animalId)
            ->orderBy('fecha', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($historial);
    }

    public function alertas()
    {
        $desde = now()->subDays(30)->toDateString();

        $muertesRecientes = Muerte::where('tipo_baja', 'muerte')
            ->whereDate('fecha', '>=', $desde)
            ->count();

        $causasRepetidas = Muerte::selectRaw('causa, COUNT(*) as total')
            ->whereDate('fecha', '>=', $desde)
            ->groupBy('causa')
            ->having('total', '>=', 3)
            ->orderByDesc('total')
            ->get();

        $alertas = [];

        if ($muertesRecientes >= 5) {
            $alertas[] = [
                'tipo' => 'alta_mortalidad',
                'mensaje' => 'Alta mortalidad reciente: ' . $muertesRecientes . ' muertes en los últimos 30 días.',
                'nivel' => 'alto',
            ];
        }

        foreach ($causasRepetidas as $causa) {
            $alertas[] = [
                'tipo' => 'causa_repetida',
                'mensaje' => 'Causa repetida detectada: ' . $causa->causa . ' con ' . $causa->total . ' casos recientes.',
                'nivel' => 'medio',
            ];
        }

        return response()->json($alertas);
    }
}