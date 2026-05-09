<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Animal;
use Carbon\Carbon;

class ActualizarEtapas extends Command
{
    protected $signature = 'animales:actualizar-etapas';
    protected $description = 'Actualizar etapa de animales según edad';

    public function handle()
    {
        $animales = Animal::all();

        foreach ($animales as $animal) {

            $edad = Carbon::parse($animal->fecha_nacimiento)->diffInDays(now());

            if ($edad <= 21) {
                $animal->etapa_actual = 'lechon';
            } elseif ($edad <= 70) {
                $animal->etapa_actual = 'destete';
            } elseif ($edad <= 150) {
                $animal->etapa_actual = 'engorda';
            } else {
                $animal->etapa_actual = 'adulto';
            }

            $animal->save();
        }

        $this->info('Etapas actualizadas correctamente');
    }
}