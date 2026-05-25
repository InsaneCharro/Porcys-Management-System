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
use App\Http\Controllers\CorralController;

Route::get('/dashboard', [DashboardController::class, 'resumen']);

Route::get('/pesos/historial/{animal_id}', [PesoController::class, 'historial']);

Route::get('/pesos/comparacion', [PesoController::class, 'comparacion']);

Route::get('/pesos/alerta-curva/{animal_id}', [PesoController::class, 'alertaCurva']);

Route::get('/pesos/pendientes', [PesoController::class, 'pendientes']);

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
Route::get('/animales/{id}/pedigree', [AnimalController::class, 'pedigree']);
Route::get('/animales/{id}', [AnimalController::class, 'show']);
Route::post('/pesos', [PesoController::class, 'store']);
Route::get('/pesos/{animal_id}', [PesoController::class, 'porAnimal']);
Route::get('/dashboard/alertas', [DashboardController::class, 'animalesBajoCrecimiento']);

use App\Http\Controllers\InventarioController;
use App\Http\Controllers\AlimentacionController;

Route::get('/inventario', [InventarioController::class, 'index']);
Route::post('/inventario/entrada', [InventarioController::class, 'entrada']);
Route::post('/inventario/salida', [InventarioController::class, 'salida']);
Route::post('/inventario/consumo', [InventarioController::class, 'consumoAutomatico']);
Route::get('/gestaciones/alertas-inteligentes', [GestacionController::class, 'alertasInteligentes']);
Route::post('/gestaciones/partos', [GestacionController::class, 'procesarPartosAutomaticos']);


use App\Models\Animal;
use App\Models\Lechon;
use App\Models\Corral;
/*
|--------------------------------------------------------------------------
| CORRALES / OCUPACIÓN / ROTACIÓN
|--------------------------------------------------------------------------
*/

Route::get('/corrales', [CorralController::class, 'index']);
Route::get('/corrales/resumen', [CorralController::class, 'resumen']);
Route::get('/corrales/{id}', [CorralController::class, 'show']);

Route::post('/corrales', [CorralController::class, 'store']);
Route::put('/corrales/{id}', [CorralController::class, 'update']);
Route::delete('/corrales/{id}', [CorralController::class, 'destroy']);

Route::post('/animales/{id}/asignar-corral', [CorralController::class, 'asignarAnimal']);
Route::post('/animales/{id}/mover-corral', [CorralController::class, 'moverAnimal']);
Route::post('/animales/{id}/retirar-corral', [CorralController::class, 'retirarAnimal']);

use App\Http\Controllers\MovimientoController;
Route::get('/movimientos', [MovimientoController::class, 'index']);
Route::post('/movimientos', [MovimientoController::class, 'store']);

use App\Http\Controllers\CamadaController;
Route::get('/camadas', [CamadaController::class, 'index']);
Route::get('/camadas/{id}', [CamadaController::class, 'show']);

use App\Http\Controllers\AlertaController;
Route::get('/alertas', [AlertaController::class, 'index']);

use App\Http\Controllers\MuerteController;

Route::get('/mortalidad-bajas', [MuerteController::class, 'index']);
Route::get('/mortalidad-bajas/resumen', [MuerteController::class, 'resumen']);
Route::get('/mortalidad-bajas/causas', [MuerteController::class, 'causas']);
Route::get('/mortalidad-bajas/alertas', [MuerteController::class, 'alertas']);

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
use App\Http\Controllers\FinanzasController;
Route::get('/reportes/ventas', [ReporteController::class, 'ventas']);
Route::get('/reportes/inventario', [ReporteController::class, 'inventario']);
Route::get('/reportes/muertes', [ReporteController::class, 'muertes']);
Route::get('/reportes/sanitario', [ReporteController::class, 'sanitario']);
Route::get('/reportes/dashboard', [ReporteController::class, 'dashboard']);
Route::get('/reportes/ventas-excel', [ReporteController::class, 'ventasExcel']);
Route::post('/finanzas/consumo-diario', [ReporteController::class, 'registrarConsumoDiario']);
Route::get('/finanzas/resumen', [FinanzasController::class, 'resumen']);
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

use App\Http\Controllers\EventoSanitarioController;
Route::get('/sanidad', [EventoSanitarioController::class, 'index']);
Route::post('/sanidad', [EventoSanitarioController::class, 'store']);
Route::get('/sanidad/pendientes-lechones', [EventoSanitarioController::class, 'pendientesLechones']);
Route::get('/sanidad/cartilla/{animalId}', [EventoSanitarioController::class, 'cartillaAnimal']);
Route::get('/sanidad/historial/{animalId}', [EventoSanitarioController::class, 'historial']);
Route::get('/sanidad/alertas', [EventoSanitarioController::class, 'alertas']);

/*
|--------------------------------------------------------------------------
| ALIMENTACIÓN / NUTRICIÓN
|--------------------------------------------------------------------------
*/
Route::get('/alimentacion/dietas', [AlimentacionController::class, 'dietas']);
Route::post('/alimentacion/dietas', [AlimentacionController::class, 'guardarDieta']);
Route::put('/alimentacion/dietas/{id}', [AlimentacionController::class, 'actualizarDieta']);
Route::delete('/alimentacion/dietas/{id}', [AlimentacionController::class, 'eliminarDieta']);

Route::post('/alimentacion/dietas/{id}/ingredientes', [AlimentacionController::class, 'guardarIngrediente']);
Route::delete('/alimentacion/ingredientes/{id}', [AlimentacionController::class, 'eliminarIngrediente']);

Route::get('/alimentacion/consumos', [AlimentacionController::class, 'consumos']);
Route::post('/alimentacion/consumos', [AlimentacionController::class, 'registrarConsumo']);
Route::get('/alimentacion/alertas', [AlimentacionController::class, 'alertas']);

/*
|--------------------------------------------------------------------------
| REPRODUCCIÓN AVANZADA / SERVICIOS REPRODUCTIVOS
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\ServicioReproductivoController;

Route::get('/servicios-reproductivos', [ServicioReproductivoController::class, 'index']);
Route::post('/servicios-reproductivos', [ServicioReproductivoController::class, 'store']);
Route::put('/servicios-reproductivos/{id}/resultado', [ServicioReproductivoController::class, 'actualizarResultado']);
Route::get('/servicios-reproductivos/historial/{hembraId}', [ServicioReproductivoController::class, 'historialPorHembra']);
Route::get('/servicios-reproductivos/indicadores/resumen', [ServicioReproductivoController::class, 'indicadores']);

/*
|--------------------------------------------------------------------------
| PREDICCIONES OPERATIVAS
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\PrediccionController;

Route::get('/predicciones/resumen', [PrediccionController::class, 'resumen']);
Route::get('/predicciones/alimento', [PrediccionController::class, 'alimento']);
Route::get('/predicciones/partos', [PrediccionController::class, 'partos']);
Route::get('/predicciones/corrales', [PrediccionController::class, 'corrales']);
Route::get('/predicciones/riesgos', [PrediccionController::class, 'riesgos']);
