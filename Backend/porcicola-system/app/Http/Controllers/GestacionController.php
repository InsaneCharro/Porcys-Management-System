<?php

namespace App\Http\Controllers;

use App\Models\Gestacion;
use App\Models\Animal;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Camada;

class GestacionController extends Controller
{
    // 📋 Ver todas las gestaciones
    public function index()
    {
        return Gestacion::with('animal')->get();
    }

    // ➕ Registrar intento de gestación
    public function store(Request $request)
    {
        $request->validate([
            'animal_id' => 'required|exists:animales,id',
            'fecha_inicio' => 'required|date'
        ]);

        $activa = Gestacion::where('hembra_id', $request->animal_id)
            ->whereIn('estado', ['activa', 'confirmada'])
            ->exists();

        if ($activa) {
            return response()->json([
                'error' => 'La hembra ya tiene una gestación activa'
            ], 400);
        }
        $gestacion = new Gestacion();

        $gestacion->hembra_id = $request->animal_id;        $gestacion->fecha_inicio = $request->fecha_inicio;
        $gestacion->estado = 'activa';
        $gestacion->fecha_inicio = $request->fecha_inicio;

        // calcular fecha estimada (114 días)
        $gestacion->fecha_probable_parto = Carbon::parse($request->fecha_inicio)->addDays(114);
        $gestacion->save();

        return response()->json($gestacion, 201);
    }

    // ✅ Confirmar preñez
    public function confirmar($id)
    {
        $gestacion = Gestacion::findOrFail($id);

        if ($gestacion->estado !== 'activa') {
            return response()->json(['error' => 'La gestación no está en proceso'], 400);
        }

        $gestacion->estado = 'confirmada';
        $gestacion->save();

        return $gestacion;
    }

    public function marcarFallida($id)
    {
        $gestacion = Gestacion::findOrFail($id);

        if ($gestacion->estado !== 'activa') {
            return response()->json([
                'error' => 'Solo gestaciones en proceso pueden marcarse como fallidas'
            ], 400);
        }

        $gestacion->estado = 'fallida';
        $gestacion->save();

        return response()->json($gestacion);
    }

    public function registrarParto(Request $request, $id)
    {
        $request->validate([
            'machos' => 'required|integer|min:0',
            'hembras' => 'required|integer|min:0',
            'muertos' => 'nullable|integer|min:0',
            'pesos' => 'required|array',
        ]);

        $gestacion = Gestacion::findOrFail($id);

        if ($gestacion->estado !== 'confirmada') {
            return response()->json([
                'error' => 'Solo gestaciones confirmadas pueden registrar parto'
            ], 400);
        }

        $machos = $request->machos;
        $hembras = $request->hembras;
        $muertos = $request->muertos ?? 0;

        $vivos = $machos + $hembras;
        $total = $vivos + $muertos;

        if (count($request->pesos) != $vivos) {
            return response()->json([
                'error' => 'Los pesos deben coincidir SOLO con lechones vivos'
            ], 400);
        }

        DB::beginTransaction();

        try {

            $madreId = $gestacion->hembra_id;

            // =========================
            // 🧮 PESO PROMEDIO
            // =========================
            $promedio = collect($request->pesos)->avg();

            // =========================
            // 🐷 CREAR CAMADA
            // =========================
            $camada = \App\Models\Camada::create([
                'gestacion_id' => $gestacion->id,
                'madre_id' => $madreId,
                'fecha_parto' => now(),

                'total_crias' => $total,
                'machos' => $machos,
                'hembras' => $hembras,

                'muertos' => $muertos,
                'vivos' => $vivos,

                'peso_promedio_nacimiento' => $promedio,

                'estado' => 'activa'
            ]);

            // =========================
            // 🐖 CREAR LECHONES
            // =========================
            for ($i = 0; $i < $vivos; $i++) {

                $sexo = ($i < $machos)
                    ? 'macho'
                    : 'hembra';

                Animal::create([
                    'identificador_unico' => $this->generarIdentificador(),
                    'sexo' => $sexo,

                    'peso' => $request->pesos[$i],

                    'madre_id' => $madreId,

                    'fecha_nacimiento' => now(),

                    'etapa_actual' => 'lechon',

                    'estado' => 'activo',

                    'raza' => 'pendiente'
                ]);
            }

            // =========================
            // ✅ ACTUALIZAR GESTACIÓN
            // =========================
            $gestacion->estado = 'parida';
            $gestacion->fecha_parto_real = now();
            $gestacion->cantidad_crias = $total;
            $gestacion->save();

            DB::commit();

            return response()->json([
                'mensaje' => 'Parto y camada registrados correctamente',
                'camada' => $camada
            ]);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function generarIdentificador()
    {
        $ultimo = Animal::latest('id')->first();

        $numero = $ultimo ? $ultimo->id + 1 : 1;

        return 'L' . str_pad($numero, 4, '0', STR_PAD_LEFT);
    }

    public function alertasInteligentes()
    {
        $gestaciones = \App\Models\Gestacion::with('animal')
            ->where('estado', 'confirmada')
            ->get();

        $alertas = [];
        $hoy = now();

        foreach ($gestaciones as $g) {

            if (!$g->fecha_probable_parto) continue;

            $diasRestantes = $hoy->diffInDays($g->fecha_probable_parto, false);

            // ⚠️ ALERTA: faltan 10 días o menos
            if ($diasRestantes <= 10 && $diasRestantes >= 0) {

                // 🔁 CAMBIO AUTOMÁTICO DE ÁREA
                if ($g->animal && $g->animal->area !== 'maternidad') {
                    $g->animal->area = 'maternidad';
                    $g->animal->save();
                }

                $alertas[] = [
                    'tipo' => 'proximo_parto',
                    'animal_id' => $g->animal->id ?? null,
                    'identificador' => $g->animal->identificador_unico ?? 'N/A',
                    'dias_restantes' => $diasRestantes,
                    'fecha_parto' => $g->fecha_probable_parto
                ];
            }

            // 🔴 ATRASO (ya debió parir)
            if ($diasRestantes < 0) {
                $alertas[] = [
                    'tipo' => 'parto_atrasado',
                    'animal_id' => $g->animal->id ?? null,
                    'identificador' => $g->animal->identificador_unico ?? 'N/A',
                    'dias_atraso' => abs($diasRestantes)
                ];
            }
        }

        return response()->json([
            'total_alertas' => count($alertas),
            'alertas' => $alertas
        ]);
    }

    public function procesarPartosAutomaticos()
    {
        $gestaciones = Gestacion::where('estado', 'confirmada')
            ->whereNotNull('fecha_probable_parto')
            ->whereDate('fecha_probable_parto', '<=', now())
            ->get();

        foreach ($gestaciones as $gestacion) {

            DB::beginTransaction();

            try {

                // 🐖 1. Marcar como parida
                $gestacion->estado = 'parida';
                $gestacion->fecha_parto_real = now();
                $gestacion->save();

                // 🐷 2. Generar lechones
                $cantidad = $gestacion->cantidad_crias ?? rand(8, 14);

                for ($i = 1; $i <= $cantidad; $i++) {

                    Animal::create([
                        'identificador_unico' => 'L' . strtoupper(uniqid()),
                        'sexo' => rand(0,1) ? 'macho' : 'hembra',
                        'etapa_actual' => 'lechon',
                        'estado' => 'activo',
                        'fecha_nacimiento' => now(),

                        'madre_id' => $gestacion->animal_id,
                        'padre_id' => null
                    ]);
                }

                // 🧬 3. Actualizar madre
                $madre = Animal::find($gestacion->animal_id);

                if ($madre) {
                    $madre->etapa_actual = 'reproductor';
                    $madre->save();
                }

                DB::commit();

            } catch (\Exception $e) {
                DB::rollBack();
            }
        }

        return response()->json([
            'mensaje' => 'Partos procesados correctamente'
        ]);
    }
}
