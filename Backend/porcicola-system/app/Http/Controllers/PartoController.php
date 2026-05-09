<?php

namespace App\Http\Controllers;

use App\Models\Parto;
use App\Models\Gestacion;
use App\Models\Lechon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Medicamento;


class PartoController extends Controller
{
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {

            // ✅ VALIDACIONES
            $request->validate([
                'gestacion_id' => 'required|exists:gestaciones,id',
                'fecha' => 'required|date',
                'num_machos' => 'required|integer|min:0',
                'num_hembras' => 'required|integer|min:0'
            ]);

            // ✅ OBTENER GESTACIÓN
            $gestacion = Gestacion::with('hembra')->find($request->gestacion_id);

            if (!$gestacion) {
                return response()->json(['error' => 'Gestación no encontrada'], 404);
            }

            // ✅ REGLAS DE NEGOCIO
            if ($gestacion->estado !== 'activa') {
                return response()->json(['error' => 'La gestación no está activa'], 400);
            }

            if (Parto::where('madre_id', $gestacion->hembra_id)
                ->whereDate('fecha_parto', $request->fecha)
                ->exists()) {
                return response()->json(['error' => 'Ya existe un parto registrado para esta fecha'], 400);
            }

            if ($gestacion->hembra->sexo !== 'F') {
                return response()->json(['error' => 'El animal no es hembra'], 400);
            }

            if ($gestacion->hembra->estado !== 'activo') {
                return response()->json(['error' => 'La hembra no está activa'], 400);
            }

            // ✅ VALIDAR TOTAL DE CRÍAS
            $total = ($request->num_machos ?? 0) + ($request->num_hembras ?? 0);

            if ($total <= 0) {
                return response()->json(['error' => 'Debe haber al menos una cría'], 400);
            }

            if ($total > 20) {
                return response()->json(['error' => 'Número de crías fuera de rango'], 400);
            }

            // ✅ VALIDAR TIEMPO DE GESTACIÓN
            $fechaInicio = Carbon::parse($gestacion->fecha_inicio);
            $fechaParto = Carbon::parse($request->fecha);

            $dias = $fechaInicio->diffInDays($fechaParto);

            if ($dias < 100 || $dias > 130) {
                return response()->json(['error' => 'Fecha fuera de rango de gestación'], 400);
            }

            // 🐖 CREAR PARTO
            $parto = Parto::create([
                'madre_id' => $gestacion->hembra_id,
                'fecha_parto' => $request->fecha,
                'total_lechones' => $total,
                'machos' => $request->num_machos,
                'hembras' => $request->num_hembras,
                'observaciones' => $request->observaciones
            ]);

            // 🔄 ACTUALIZAR GESTACIÓN
            $gestacion->estado = 'finalizada';
            $gestacion->fecha_parto_real = $request->fecha;
            $gestacion->cantidad_crias = $total;
            $gestacion->save();

            // 🐷 CREAR LECHONES
            // Machos
            for ($i = 0; $i < $request->num_machos; $i++) {
                Lechon::create([
                    'parto_id' => $parto->id,
                    'madre_id' => $gestacion->hembra_id,
                    'sexo' => 'M',
                    'estado' => 'vivo',
                    'clasificacion' => 'pendiente'
                ]);
            }

            // Hembras
            for ($i = 0; $i < $request->num_hembras; $i++) {
                Lechon::create([
                    'parto_id' => $parto->id,
                    'madre_id' => $gestacion->hembra_id,
                    'sexo' => 'H',
                    'estado' => 'vivo',
                    'clasificacion' => 'pendiente'
                ]);
            }

            DB::commit();

            return response()->json([
                'mensaje' => 'Parto registrado correctamente',
                'parto_id' => $parto->id,
                'total_crias' => $total
            ]);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function verCamada($id)
    {
        $parto = Parto::with('lechones')->findOrFail($id);

        $lechones = Lechon::with(['corral' => function($q) {
                $q->withCount('lechones');
            }])
            ->where('parto_id', $id)
            ->get();

        $total = $lechones->count();

        $promedio = $lechones->avg('peso_nacimiento');

        $bajoPeso = $lechones->where('clasificacion', 'bajo_peso')->count();
        $normales = $lechones->where('clasificacion', 'normal')->count();
        $optimos = $lechones->where('clasificacion', 'optimo')->count();
        $muertos = $parto->lechones->where('estado', 'muerto')->count();


        $medicamentos = Medicamento::all();

        return view('partos.camada', compact(
            'parto',
            'total',
            'promedio',
            'bajoPeso',
            'normales',
            'optimos',
            'muertos',
            'medicamentos'
        ));
    }
}