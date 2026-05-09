<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ProcesarPartos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'partos:procesar';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        app(\App\Http\Controllers\GestacionController::class)
            ->procesarPartosAutomaticos();

        $this->info('✔ Partos procesados automáticamente');
    }
}
