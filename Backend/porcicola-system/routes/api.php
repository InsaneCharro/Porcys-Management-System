<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GestacionController;
use App\Http\Controllers\AnimalController;

Route::get('/gestaciones', [GestacionController::class, 'index']);
Route::post('/gestaciones', [GestacionController::class, 'store']);
Route::put('/gestaciones/{id}/confirmar', [GestacionController::class, 'confirmar']);

use App\Http\Controllers\PartoController;

Route::post('/partos', [PartoController::class, 'store']);

use App\Http\Controllers\PesoController;

Route::post('/pesos', [PesoController::class, 'store']);

use App\Http\Controllers\DashboardController;

Route::get('/dashboard', [DashboardController::class, 'resumen']);

Route::get('/pesos/historial/{animal_id}', [PesoController::class, 'historial']);

Route::get('/pesos/comparacion', [PesoController::class, 'comparacion']);

Route::get('/pesos/alerta-curva/{animal_id}', [PesoController::class, 'alertaCurva']);

Route::get('/ranking', [PesoController::class, 'ranking']);

Route::get('/animales', [AnimalController::class, 'index']);
Route::post('/animales', [AnimalController::class, 'store']);
Route::put('/animales/{id}', [AnimalController::class, 'update']);
Route::delete('/animales/{id}', [AnimalController::class, 'destroy']);
Route::put('/gestaciones/{id}/fallida', [GestacionController::class, 'marcarFallida']);
Route::put('/gestaciones/{id}/parto', [GestacionController::class, 'registrarParto']);
Route::post('/gestaciones/{id}/parto', [GestacionController::class, 'registrarParto']);

use App\Http\Controllers\VentaController;

Route::post('/ventas', [VentaController::class, 'store']);
Route::get('/ventas/resumen', [VentaController::class, 'resumen']);
Route::get('/ventas/clientes', [VentaController::class, 'rankingClientes']);
Route::get('/ventas/tipos', [VentaController::class, 'porTipo']);
Route::get('/ventas/historial', [VentaController::class, 'historial']);

use App\Http\Controllers\AlimentoController;

Route::get('/alimentos', [AlimentoController::class, 'index']);
Route::post('/alimentos', [AlimentoController::class, 'store']);

Route::post('/alimentos/{id}/entrada', [AlimentoController::class, 'entrada']);
Route::post('/alimentos/{id}/consumo', [AlimentoController::class, 'consumo']);
Route::post('/alimentos/consumo-animal', [AlimentoController::class, 'consumoAnimal']);

use App\Http\Controllers\MedicamentoController;

Route::get('/medicamentos', [MedicamentoController::class, 'index']);
Route::post('/medicamentos', [MedicamentoController::class, 'store']);
Route::post('/medicamentos/{id}/entrada', [MedicamentoController::class, 'entrada']);
Route::post('/medicamentos/aplicar', [MedicamentoController::class, 'aplicar']);
Route::get('/medicamentos/historial/{animalId}', [MedicamentoController::class, 'historial']);
Route::get('/medicamentos/alertas', [MedicamentoController::class, 'alertas']);
Route::get('/medicamentos/movimientos', [MedicamentoController::class, 'movimientos']);

Route::get('/dashboard/pesos', [DashboardController::class, 'pesosEvolucion']);
Route::get('/dashboard/ventas', [DashboardController::class, 'ventasMensuales']);
Route::get('/dashboard/alimento', [DashboardController::class, 'consumoAlimento']);
Route::get('/dashboard/medico', [DashboardController::class, 'aplicacionesMedicas']);
Route::get('/ventas/grafica', [DashboardController::class, 'ventasPorDia']);
Route::get('/animales/{id}', [AnimalController::class, 'show']);
Route::post('/pesos', [PesoController::class, 'store']);
Route::get('/pesos/{animal_id}', [PesoController::class, 'porAnimal']);
Route::get('/dashboard/alertas', [DashboardController::class, 'animalesBajoCrecimiento']);

use App\Http\Controllers\InventarioController;

Route::get('/inventario', [InventarioController::class, 'index']);
Route::post('/inventario/entrada', [InventarioController::class, 'entrada']);
Route::post('/inventario/salida', [InventarioController::class, 'salida']);
Route::post('/inventario/consumo', [InventarioController::class, 'consumoAutomatico']);
Route::get('/gestaciones/alertas-inteligentes', [GestacionController::class, 'alertasInteligentes']);
Route::post('/gestaciones/partos', [GestacionController::class, 'procesarPartosAutomaticos']);

use App\Http\Controllers\EventoSanitarioLechonController;
Route::post('/sanidad/lechon', [EventoSanitarioLechonController::class, 'store']);
Route::get('/sanidad/lechon/{id}', function ($id) {
    return \App\Models\EventoSanitarioLechon::with('medicamento')
        ->where('lechon_id', $id)
        ->get();
});

use App\Models\Corral;
use App\Models\Animal;
use App\Models\Lechon;

/*
|--------------------------------------------------------------------------
| CORRALES
|--------------------------------------------------------------------------
*/

// 🔹 Obtener todos los corrales
Route::get('/corrales', function () {
    return \App\Models\Corral::withCount('lechones')
        ->with('lechones')
        ->get()
        ->map(function ($corral) {
            return [
                'id' => $corral->id,
                'nombre' => $corral->nombre,
                'capacidad' => $corral->capacidad,
                'lechones_count' => $corral->lechones_count,

                // 🔥 CORRECCIÓN REAL
                'animales' => $corral->lechones->map(function ($a) {
                    return [
                        'id' => $a->id, // ✅ ID REAL DE BD
                        'identificador_unico' => $a->identificador_unico,
                        'corral_id' => $a->corral_id,
                    ];
                }),
            ];
        });
});

// 🔹 Obtener detalle de un corral
Route::get('/corrales/{id}', function ($id) {
    return Corral::withCount('lechones')
        ->with('lechones')
        ->findOrFail($id);
});

// 🔹 Crear corral
Route::post('/corrales', function (Request $request) {

    $validated = $request->validate([
        'nombre' => 'required|string',
        'capacidad' => 'required|integer'
    ]);

    return Corral::create($validated);
});

// 🔹 Mover lechón de corral (ESTABLE)
Route::post('/animales/{id}/mover-corral', function ($id, Request $request) {

    // 🔒 VALIDACIÓN
    $request->validate([
        'corral_id' => 'required|exists:corrales,id'
    ]);

    $animal = Lechon::findOrFail($id);

    $nuevoCorral = Corral::withCount('lechones')->findOrFail($request->corral_id);

    // 🚫 evitar sobrecupo
    if ($nuevoCorral->lechones_count >= $nuevoCorral->capacidad) {
        return response()->json([
            'error' => 'Corral lleno'
        ], 400);
    }

    // 🔄 mover
    $animal->corral_id = $nuevoCorral->id;
    $animal->save();

    return response()->json([
        'success' => true
    ]);
});
use App\Http\Controllers\MovimientoController;
Route::get('/movimientos', [MovimientoController::class, 'index']);
Route::post('/movimientos', [MovimientoController::class, 'store']);

use App\Http\Controllers\CamadaController;
Route::get('/camadas', [CamadaController::class, 'index']);
Route::get('/camadas/{id}', [CamadaController::class, 'show']);

use App\Http\Controllers\AlertaController;
Route::get('/alertas', [AlertaController::class, 'index']);

use App\Http\Controllers\MuerteController;
Route::post('/animales/{animalId}/muerte', [MuerteController::class, 'registrar']);
Route::get('/animales/{animalId}/muertes', [MuerteController::class, 'historial']);

use App\Http\Controllers\ClienteController;
Route::get('/clientes', [ClienteController::class, 'index']);
Route::post('/clientes', [ClienteController::class, 'store']);
Route::get('/clientes/{id}', [ClienteController::class, 'show']);
Route::put('/clientes/{id}', [ClienteController::class, 'update']);
Route::delete('/clientes/{id}', [ClienteController::class, 'destroy']);
Route::get('/clientes-ranking', [ClienteController::class, 'ranking']);

Route::get('/dashboard/pesos-evolucion', [DashboardController::class, 'pesosEvolucion']);

use App\Http\Controllers\ReporteController;
Route::get('/reportes/ventas', [ReporteController::class, 'ventas']);
Route::get('/reportes/inventario', [ReporteController::class, 'inventario']);
Route::get('/reportes/muertes', [ReporteController::class, 'muertes']);
Route::get('/reportes/sanitario', [ReporteController::class, 'sanitario']);
Route::get('/reportes/dashboard', [ReporteController::class, 'dashboard']);
Route::get('/reportes/ventas-excel', [ReporteController::class, 'ventasExcel']);
Route::post('/finanzas/consumo-diario', [ReporteController::class, 'registrarConsumoDiario']);
Route::get('/finanzas/resumen', [ReporteController::class, 'resumenFinanciero']);
Route::get('/finanzas/pdf', [ReporteController::class, 'finanzasPdf']);
Route::get('/finanzas/excel', [ReporteController::class, 'finanzasExcel']);

use App\Http\Controllers\API\ProveedorController;
Route::apiResource('proveedores', ProveedorController::class);

use App\Http\Controllers\API\SolicitudCompraController;
Route::get('/solicitudes-compra', [SolicitudCompraController::class, 'index']);
Route::get('/solicitudes-compra/{id}', [SolicitudCompraController::class, 'show']);
Route::post('/solicitudes-compra', [SolicitudCompraController::class, 'store']);
Route::patch('/solicitudes-compra/{id}/estado', [SolicitudCompraController::class, 'cambiarEstado']);

use App\Http\Controllers\API\OrdenCompraController;
Route::post('/ordenes-compra/desde-solicitud', [OrdenCompraController::class, 'desdeSolicitud']);
Route::get('/ordenes-compra', [OrdenCompraController::class, 'index']);

use App\Http\Controllers\API\RecepcionCompraController;
Route::post('/recepciones-compra', [RecepcionCompraController::class, 'recibir']);