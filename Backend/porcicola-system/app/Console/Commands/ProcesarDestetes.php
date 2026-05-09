<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Camada;
use Carbon\Carbon;

class ProcesarDestetes extends Command
{
    protected $signature = 'destetes:procesar';

    protected $description = 'Procesa destetes automáticos';

    public function handle()
    {
        $camadas = Camada::with('lechones')
            ->where('estado', 'activa')
            ->get();

        $procesadas = 0;

        foreach ($camadas as $camada) {

            $fechaParto = Carbon::parse($camada->fecha_parto);

            // 🗓️ 28 días
            if ($fechaParto->diffInDays(now()) >= 28) {

                // 🔄 Actualizar camada
                $camada->estado = 'destetada';
                $camada->fecha_destete = now();
                $camada->save();

                // 🐖 Cambiar etapa de lechones
                foreach ($camada->lechones as $lechon) {

                    $lechon->etapa_actual = 'crecimiento';
                    $lechon->save();
                }

                $procesadas++;

                $this->info("✅ Camada {$camada->id} destetada");
            }
        }

        $this->info("🐷 Total destetadas: {$procesadas}");
    }
}