<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class GenerarDatosPruebaPorcys extends Command
{
    protected $signature = 'porcys:demo {cantidad=300}';
    protected $description = 'Genera datos masivos de prueba para PORCYS';

    public function handle()
    {
        $cantidad = (int) $this->argument('cantidad');

        if ($cantidad < 50) {
            $cantidad = 50;
        }

        $this->info("Generando datos demo PORCYS...");
        $this->info("Cantidad base de animales: {$cantidad}");

        DB::beginTransaction();

        try {
            $clientes = $this->crearClientes();
            $corrales = $this->crearCorrales();
            $this->crearInventario();
            $this->crearMedicamentos();

            $sementales = $this->crearSementales($corrales);
            $hembras = $this->crearHembrasReproductoras($corrales, $sementales);
            $engorda = $this->crearAnimalesEngorda($corrales, $cantidad);
            $lechones = $this->crearLechones($corrales, $hembras, $sementales, $cantidad);
            $descartes = $this->crearDescartes($corrales, $cantidad);

            $this->crearGestacionesYCamadas($hembras, $sementales, $corrales);
            $this->crearPesos($engorda, 35, 90);
            $this->crearPesos($lechones, 1, 14);
            $this->crearPesos($descartes, 55, 110);

            DB::commit();

            $this->info("Datos demo generados correctamente.");
            $this->line("Clientes: " . count($clientes));
            $this->line("Corrales: " . count($corrales));
            $this->line("Sementales: " . count($sementales));
            $this->line("Hembras reproductoras: " . count($hembras));
            $this->line("Engorda: " . count($engorda));
            $this->line("Lechones: " . count($lechones));
            $this->line("Descartes: " . count($descartes));

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            DB::rollBack();

            $this->error("Error generando datos demo:");
            $this->error($e->getMessage());

            return Command::FAILURE;
        }
    }

    private function columnas(string $tabla): array
    {
        return Schema::hasTable($tabla) ? Schema::getColumnListing($tabla) : [];
    }

    private function insertar(string $tabla, array $datos): ?int
    {
        if (!Schema::hasTable($tabla)) {
            return null;
        }

        $columnas = $this->columnas($tabla);

        $filtrado = collect($datos)
            ->only($columnas)
            ->toArray();

        if (in_array('created_at', $columnas)) {
            $filtrado['created_at'] = now();
        }

        if (in_array('updated_at', $columnas)) {
            $filtrado['updated_at'] = now();
        }

        return DB::table($tabla)->insertGetId($filtrado);
    }

    private function crearClientes(): array
    {
        $clientes = [];

        $nombres = [
            'Carnicería San Miguel',
            'Abastos del Bajío',
            'Granja Los Pinos',
            'Distribuidora Uriangato',
            'Carnes Premium León',
            'Mercado Regional Moroleón',
        ];

        foreach ($nombres as $i => $nombre) {
            $existente = DB::table('clientes')
                ->where('nombre', $nombre)
                ->first();

            if ($existente) {
                $clientes[] = $existente->id;
                continue;
            }

            $clientes[] = $this->insertar('clientes', [
                'nombre' => $nombre,
                'telefono' => '44510020' . str_pad($i, 2, '0', STR_PAD_LEFT),
                'email' => 'cliente' . ($i + 1) . '@demo.com',
                'direccion' => 'Zona Centro Bajío',
                'estado' => 'activo',
            ]);
        }

        return array_filter($clientes);
    }

    private function crearCorrales(): array
    {
        $corrales = [];

        $datos = [
            ['DEMO-GES-01', 'gestacion', 25],
            ['DEMO-GES-02', 'gestacion', 25],
            ['DEMO-MAT-01', 'maternidad', 12],
            ['DEMO-MAT-02', 'maternidad', 12],
            ['DEMO-ENG-01', 'engorda', 15],
            ['DEMO-ENG-02', 'engorda', 15],
            ['DEMO-ENG-03', 'engorda', 15],
            ['DEMO-REP-01', 'reproduccion', 10],
            ['DEMO-ENF-01', 'enfermeria', 8],
            ['DEMO-DES-01', 'destete', 20],
        ];

        foreach ($datos as [$nombre, $tipo, $capacidad]) {
            $existente = DB::table('corrales')
                ->where('nombre', $nombre)
                ->first();

            if ($existente) {
                $corrales[$tipo][] = $existente->id;
                continue;
            }

            $id = $this->insertar('corrales', [
                'nombre' => $nombre,
                'tipo_corral' => $tipo,
                'tipo' => $tipo,
                'capacidad' => $capacidad,
                'estado' => 'activo',
                'ubicacion' => 'Zona demo ' . strtoupper($tipo),
                'descripcion' => 'Corral generado para pruebas masivas',
            ]);

            $corrales[$tipo][] = $id;
        }

        return $corrales;
    }

    private function crearInventario(): void
    {
        $productos = [
            ['Maíz', 'alimento', 2500, 300],
            ['Pasta de soya', 'alimento', 1200, 200],
            ['Núcleo vitamínico', 'alimento', 500, 100],
            ['Lisina', 'alimento', 350, 50],
            ['Aceite/grasa', 'alimento', 700, 80],
        ];

        foreach ($productos as [$nombre, $tipo, $stock, $minimo]) {
            if (DB::table('inventarios')->where('nombre_producto', $nombre)->exists()) {
                continue;
            }

            $this->insertar('inventarios', [
                'nombre_producto' => $nombre,
                'tipo' => $tipo,
                'stock_kg' => $stock,
                'stock_minimo' => $minimo,
                'unidad' => 'kg',
                'descripcion' => 'Producto demo para pruebas de inventario',
            ]);
        }
    }

    private function crearMedicamentos(): void
    {
        if (!Schema::hasTable('medicamentos')) {
            return;
        }

        $meds = [
            ['Hierro dextrano', 200, 50],
            ['Vacuna triple porcina', 120, 30],
            ['Antibiótico general', 80, 20],
            ['Desparasitante', 100, 25],
        ];

        foreach ($meds as [$nombre, $stock, $minimo]) {
            if (DB::table('medicamentos')->where('nombre', $nombre)->exists()) {
                continue;
            }

            $this->insertar('medicamentos', [
                'nombre' => $nombre,
                'stock' => $stock,
                'stock_minimo' => $minimo,
                'unidad' => 'dosis',
                'descripcion' => 'Medicamento demo',
                'estado' => 'activo',
            ]);
        }
    }

    private function crearAnimal(array $datos): int
    {
        $existente = DB::table('animales')
            ->where('identificador_unico', $datos['identificador_unico'])
            ->first();

        if ($existente) {
            return $existente->id;
        }

        return $this->insertar('animales', $datos);
    }

    private function crearSementales(array $corrales): array
    {
        $ids = [];

        for ($i = 1; $i <= 8; $i++) {
            $ids[] = $this->crearAnimal([
                'identificador_unico' => 'DEMO-SEM-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'sexo' => 'macho',
                'etapa_actual' => 'reproduccion',
                'estado' => 'activo',
                'clasificacion_productiva' => 'pie_cria',
                'fecha_nacimiento' => Carbon::now()->subMonths(rand(18, 36))->toDateString(),
                'raza' => collect(['Yorkshire', 'Landrace', 'Duroc', 'Pietrain'])->random(),
                'peso' => rand(160, 260),
                'corral_id' => collect($corrales['reproduccion'] ?? [null])->random(),
            ]);
        }

        return $ids;
    }

    private function crearHembrasReproductoras(array $corrales, array $sementales): array
    {
        $ids = [];

        for ($i = 1; $i <= 60; $i++) {
            $ids[] = $this->crearAnimal([
                'identificador_unico' => 'DEMO-HEM-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'sexo' => 'hembra',
                'etapa_actual' => collect(['reproduccion', 'gestacion', 'maternidad'])->random(),
                'estado' => 'activo',
                'clasificacion_productiva' => 'pie_cria',
                'fecha_nacimiento' => Carbon::now()->subMonths(rand(12, 30))->toDateString(),
                'raza' => collect(['Yorkshire', 'Landrace', 'F1', 'Duroc'])->random(),
                'peso' => rand(120, 210),
                'padre_id' => collect($sementales)->random(),
                'corral_id' => collect($corrales['gestacion'] ?? [null])->random(),
            ]);
        }

        return $ids;
    }

    private function crearAnimalesEngorda(array $corrales, int $cantidad): array
    {
        $ids = [];
        $total = (int) round($cantidad * 0.35);

        for ($i = 1; $i <= $total; $i++) {
            $ids[] = $this->crearAnimal([
                'identificador_unico' => 'DEMO-ENG-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'sexo' => $i % 2 === 0 ? 'macho' : 'hembra',
                'etapa_actual' => 'engorda',
                'estado' => 'activo',
                'clasificacion_productiva' => 'abasto',
                'fecha_nacimiento' => Carbon::now()->subDays(rand(60, 150))->toDateString(),
                'raza' => collect(['Duroc', 'Yorkshire', 'Landrace', 'Comercial'])->random(),
                'peso' => rand(45, 115),
                'corral_id' => collect($corrales['engorda'] ?? [null])->random(),
            ]);
        }

        return $ids;
    }

    private function crearLechones(array $corrales, array $hembras, array $sementales, int $cantidad): array
    {
        $ids = [];
        $total = (int) round($cantidad * 0.40);

        for ($i = 1; $i <= $total; $i++) {
            $ids[] = $this->crearAnimal([
                'identificador_unico' => 'DEMO-LEC-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'sexo' => $i % 2 === 0 ? 'macho' : 'hembra',
                'etapa_actual' => collect(['lechon', 'destete', 'crecimiento'])->random(),
                'estado' => 'activo',
                'clasificacion_productiva' => collect(['abasto', 'pie_cria'])->random(),
                'fecha_nacimiento' => Carbon::now()->subDays(rand(1, 45))->toDateString(),
                'madre_id' => collect($hembras)->random(),
                'padre_id' => collect($sementales)->random(),
                'raza' => collect(['F1', 'Duroc', 'Yorkshire', 'Comercial'])->random(),
                'peso' => rand(2, 18),
                'corral_id' => collect($corrales['destete'] ?? $corrales['maternidad'] ?? [null])->random(),
            ]);
        }

        return $ids;
    }

    private function crearDescartes(array $corrales, int $cantidad): array
    {
        $ids = [];
        $total = (int) round($cantidad * 0.10);

        for ($i = 1; $i <= $total; $i++) {
            $ids[] = $this->crearAnimal([
                'identificador_unico' => 'DEMO-DESC-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'sexo' => $i % 2 === 0 ? 'macho' : 'hembra',
                'etapa_actual' => collect(['engorda', 'reproduccion'])->random(),
                'estado' => 'descartado',
                'clasificacion_productiva' => 'descarte',
                'fecha_nacimiento' => Carbon::now()->subMonths(rand(8, 36))->toDateString(),
                'raza' => collect(['Duroc', 'Yorkshire', 'Landrace', 'Comercial'])->random(),
                'peso' => rand(60, 140),
                'corral_id' => collect($corrales['enfermeria'] ?? $corrales['engorda'] ?? [null])->random(),
            ]);
        }

        return $ids;
    }

    private function crearGestacionesYCamadas(array $hembras, array $sementales, array $corrales): void
    {
        if (!Schema::hasTable('gestaciones')) {
            return;
        }

        $seleccionadas = collect($hembras)->take(35);

        foreach ($seleccionadas as $index => $hembraId) {
            $inicio = Carbon::now()->subDays(rand(5, 120));
            $probable = (clone $inicio)->addDays(114);

            $estado = $index % 4 === 0 ? 'parida' : 'confirmada';

            $gestacionId = $this->insertar('gestaciones', [
                'animal_id' => $hembraId,
                'hembra_id' => $hembraId,
                'semental_id' => collect($sementales)->random(),
                'fecha_inicio' => $inicio->toDateString(),
                'fecha_servicio' => $inicio->toDateString(),
                'fecha_probable_parto' => $probable->toDateString(),
                'estado' => $estado,
                'tipo_servicio' => $index % 2 === 0 ? 'natural' : 'inseminacion',
                'notas' => 'Gestación demo para pruebas',
            ]);

            if ($estado === 'parida' && Schema::hasTable('camadas')) {
                $machos = rand(3, 7);
                $hembrasNacidas = rand(3, 7);
                $muertos = rand(0, 2);
                $total = $machos + $hembrasNacidas;

                $this->insertar('camadas', [
                    'gestacion_id' => $gestacionId,
                    'madre_id' => $hembraId,
                    'fecha_parto' => Carbon::now()->subDays(rand(1, 25))->toDateString(),

                    // Compatibilidad con distintas versiones de tu tabla camadas
                    'machos' => $machos,
                    'hembras' => $hembrasNacidas,
                    'total' => $total,
                    'total_crias' => $total,
                    'vivos' => $total - $muertos,
                    'muertos' => $muertos,

                    'peso_promedio' => rand(110, 180) / 100,
                    'estado' => 'activa',
                    'corral_id' => collect($corrales['maternidad'] ?? [null])->random(),
                ]);
            }
        }
    }

    private function crearPesos(array $animalIds, int $min, int $max): void
    {
        if (!Schema::hasTable('pesos')) {
            return;
        }

        foreach ($animalIds as $animalId) {
            $base = rand($min, $max);

            $this->insertar('pesos', [
                'animal_id' => $animalId,
                'peso' => max(1, $base * 0.08),
                'peso_kg' => max(1, $base * 0.08),
                'tipo_peso' => 'dia_0',
                'momento' => 'dia_0',
                'fecha' => Carbon::now()->subDays(28)->toDateString(),
                'fecha_registro' => Carbon::now()->subDays(28)->toDateString(),
                'edad_dias' => 0,
            ]);

            $this->insertar('pesos', [
                'animal_id' => $animalId,
                'peso' => max(2, $base * 0.30),
                'peso_kg' => max(2, $base * 0.30),
                'tipo_peso' => 'dia_10',
                'momento' => 'dia_10',
                'fecha' => Carbon::now()->subDays(18)->toDateString(),
                'fecha_registro' => Carbon::now()->subDays(18)->toDateString(),
                'edad_dias' => 10,
            ]);

            $this->insertar('pesos', [
                'animal_id' => $animalId,
                'peso' => $base,
                'peso_kg' => $base,
                'tipo_peso' => 'dia_28',
                'momento' => 'dia_28',
                'fecha' => Carbon::now()->subDays(1)->toDateString(),
                'fecha_registro' => Carbon::now()->subDays(1)->toDateString(),
                'edad_dias' => 28,
            ]);
        }
    }
}