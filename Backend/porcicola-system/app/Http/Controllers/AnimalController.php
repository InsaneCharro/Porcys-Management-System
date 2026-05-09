<?php

namespace App\Http\Controllers;
use App\Models\Animal;
use Illuminate\Http\Request;


class AnimalController extends Controller
{
    public function index(Request $request)
    {
        $query = Animal::query();

        // 🔎 Buscar por identificador
        if ($request->identificador) {
            $query->where('identificador_unico', 'LIKE', '%' . $request->identificador . '%');
        }

        // ⚧ Filtrar por sexo
        if ($request->sexo) {
            $query->where('sexo', $request->sexo);
        }

        // 🟢 Filtrar por estado
        if ($request->estado) {
            $query->where('estado', $request->estado);
        }

        $animales = $query->orderBy('id', 'desc')->get();

        foreach ($animales as $animal) {
            if ($animal->fecha_nacimiento && !$animal->etapa_actual) {
                $edad = Carbon::parse($animal->fecha_nacimiento)
                    ->diffInDays(now());

                $animal->etapa_actual = $this->calcularEtapa($edad);
                $animal->save();
            }
}

        // 🧬 Filtrar por etapa
        if ($request->etapa) {
            $animales = $animales->filter(function ($animal) use ($request) {
                return $animal->etapa_actual === $request->etapa;
            })->values();
        }

        return $animales;
    }

    public function store(Request $request)
    {
        try {

            $animal = Animal::create([
                'identificador_unico' => $this->generarIdentificador(),
                'sexo' => $request->sexo ?? 'macho',
                'fecha_nacimiento' => now(),
                'etapa_actual' => 'lechon',
                'estado' => 'activo',
                'raza' => 'General',
                'madre_id' => null,
                'padre_id' => null,
                'peso' => 0
            ]);

            return response()->json($animal, 201);

        } catch (\Throwable $e) {

            return response()->json([
                'error' => $e->getMessage(),
                'linea' => $e->getLine()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $animal = Animal::findOrFail($id);

        $animal->update([
            'sexo' => $request->sexo,
            'etapa_actual' => $request->etapa_actual,
            'estado' => $request->estado,
        ]);

        return response()->json([
            'mensaje' => 'Animal actualizado correctamente'
        ]);
    }

    public function destroy($id)
    {
        Animal::destroy($id);
        return response()->json(['ok' => true]);
    }

    private function generarIdentificador()
    {
        $ultimo = Animal::latest('id')->first();

        $numero = $ultimo ? $ultimo->id + 1 : 1;

        return 'A' . str_pad($numero, 4, '0', STR_PAD_LEFT);
    }

    public function show($id)
    {
        return Animal::findOrFail($id);
    }

    private function calcularEtapa($edadDias)
    {
        if ($edadDias < 28) return 'lechon';
        if ($edadDias < 70) return 'crecimiento';
        if ($edadDias < 150) return 'engorda';
        return 'reproductor';
    }

    
}
