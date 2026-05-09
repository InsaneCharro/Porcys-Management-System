<?php

namespace App\Http\Controllers;

use App\Models\Camada;
use App\Models\Corral;
use App\Models\Gestacion;
use App\Models\Medicamento;
use App\Models\Animal;
use App\Models\Peso;
use App\Models\AplicacionMedica;
use App\Models\Muerte;
use Carbon\Carbon;

class AlertaController extends Controller
{
    public function index()
    {
        $alertas = [];

        /*
        |--------------------------------------------------------------------------
        | 🏠 CORRALES SATURADOS
        |--------------------------------------------------------------------------
        */

        $corrales = Corral::withCount('animales')->get();

        foreach ($corrales as $corral) {

            if (!$corral->capacidad || $corral->capacidad <= 0) {
                continue;
            }

            $ocupacion =
                ($corral->animales_count / $corral->capacidad) * 100;

            if ($ocupacion >= 90) {

                $alertas[] = [
                    'tipo' => 'critica',
                    'icono' => '🏠',
                    'titulo' => 'Corral saturado',
                    'mensaje' =>
                        "{$corral->nombre} tiene " . round($ocupacion) . "% de ocupación",
                    'fecha' => now(),
                ];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 💊 MEDICAMENTOS BAJOS
        |--------------------------------------------------------------------------
        */

        $medicamentos = Medicamento::where('stock', '<=', 5)->get();

        foreach ($medicamentos as $medicamento) {

            $alertas[] = [
                'tipo' => 'critica',
                'icono' => '💊',
                'titulo' => 'Medicamento bajo',
                'mensaje' =>
                    "{$medicamento->nombre} tiene poco stock ({$medicamento->stock})",
                'fecha' => now(),
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | 🤰 PARTOS PRÓXIMOS
        |--------------------------------------------------------------------------
        */

        $gestaciones = Gestacion::where('estado', 'activa')
            ->whereDate(
                'fecha_probable_parto',
                '<=',
                Carbon::now()->addDays(7)
            )
            ->get();

        foreach ($gestaciones as $gestacion) {

            $alertas[] = [
                'tipo' => 'importante',
                'icono' => '🤰',
                'titulo' => 'Parto próximo',
                'mensaje' =>
                    "Gestación #{$gestacion->id} próxima a parto",
                'fecha' =>
                    $gestacion->fecha_probable_parto,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | 🍼 DESTETES PENDIENTES
        |--------------------------------------------------------------------------
        */

        $camadas = Camada::where('estado', 'activa')
            ->whereDate(
                'fecha_destete',
                '<=',
                Carbon::now()
            )
            ->get();

        foreach ($camadas as $camada) {

            $alertas[] = [
                'tipo' => 'importante',
                'icono' => '🍼',
                'titulo' => 'Destete pendiente',
                'mensaje' =>
                    "Camada #{$camada->id} lista para destete",
                'fecha' =>
                    $camada->fecha_destete,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | 📉 ANIMALES SIN CRECIMIENTO RECIENTE
        |--------------------------------------------------------------------------
        */

        $animales = Animal::all();

        foreach ($animales as $animal) {

            $ultimosPesos = Peso::where('animal_id', $animal->id)
                ->orderBy('fecha', 'desc')
                ->take(2)
                ->get();

            if ($ultimosPesos->count() < 2) {
                continue;
            }

            $pesoActual = $ultimosPesos[0]->peso;
            $pesoAnterior = $ultimosPesos[1]->peso;

            if ($pesoActual <= $pesoAnterior) {

                $alertas[] = [
                    'tipo' => 'importante',
                    'icono' => '📉',
                    'titulo' => 'Bajo crecimiento',
                    'mensaje' =>
                        "Animal {$animal->identificador_unico} no muestra crecimiento",
                    'fecha' => now(),
                ];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 💉 ANIMALES SIN HISTORIAL SANITARIO
        |--------------------------------------------------------------------------
        */

        foreach ($animales as $animal) {

            $tieneAplicaciones = AplicacionMedica::where(
                'animal_id',
                $animal->id
            )->exists();

            if (!$tieneAplicaciones) {

                $alertas[] = [
                    'tipo' => 'informativa',
                    'icono' => '💉',
                    'titulo' => 'Sin historial sanitario',
                    'mensaje' =>
                        "Animal {$animal->identificador_unico} sin tratamientos registrados",
                    'fecha' => now(),
                ];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | ⚠ EXCESO DE MEDICACIÓN
        |--------------------------------------------------------------------------
        */

        foreach ($animales as $animal) {

            $aplicaciones = AplicacionMedica::where('animal_id', $animal->id)
                ->whereDate('fecha', '>=', Carbon::now()->subDays(7))
                ->count();

            if ($aplicaciones >= 3) {

                $alertas[] = [
                    'tipo' => 'critica',
                    'icono' => '⚠',
                    'titulo' => 'Exceso de medicación',
                    'mensaje' =>
                        "Animal {$animal->identificador_unico} recibió {$aplicaciones} tratamientos",
                    'fecha' => now(),
                ];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | ☠ BAJAS RECIENTES
        |--------------------------------------------------------------------------
        */

        $muertes = Muerte::whereDate(
            'fecha',
            '>=',
            Carbon::now()->subDays(7)
        )->get();

        foreach ($muertes as $muerte) {

            $animal = Animal::find($muerte->animal_id);

            if (!$animal) {
                continue;
            }

            $alertas[] = [
                'tipo' => 'critica',
                'icono' => '☠',
                'titulo' => 'Baja registrada',
                'mensaje' =>
                    "Animal {$animal->identificador_unico}: {$muerte->causa}",
                'fecha' => $muerte->fecha,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | ORDENAR POR FECHA DESC
        |--------------------------------------------------------------------------
        */

        usort($alertas, function ($a, $b) {
            return strtotime($b['fecha']) - strtotime($a['fecha']);
        });

        return response()->json($alertas);
    }
}