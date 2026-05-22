<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Muerte;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraDetalle;
use App\Models\Venta;
use App\Models\VentaAnimal;
use Illuminate\Support\Facades\DB;

class FinanzasController extends Controller
{
    public function resumen()
    {
        $inicio30Dias = now()->subDays(30);

        /*
        |--------------------------------------------------------------------------
        | INGRESOS
        |--------------------------------------------------------------------------
        */
        $ventasCompletadas = Venta::query()
            ->where('estado', 'completada');

        $ingresosTotales = (float) (clone $ventasCompletadas)->sum('total');

        $ventasTotales = (int) (clone $ventasCompletadas)->count();

        $ingresosUltimos30Dias = (float) (clone $ventasCompletadas)
            ->where('fecha', '>=', $inicio30Dias->toDateString())
            ->sum('total');

        $ventasUltimos30Dias = (int) (clone $ventasCompletadas)
            ->where('fecha', '>=', $inicio30Dias->toDateString())
            ->count();

        $animalesVendidos = (int) VentaAnimal::whereHas('venta', function ($query) {
            $query->where('estado', 'completada');
        })->count();

        $ventasPorTipo = Venta::query()
            ->select(
                'tipo_venta',
                DB::raw('COUNT(*) as cantidad'),
                DB::raw('COALESCE(SUM(total), 0) as total')
            )
            ->where('estado', 'completada')
            ->groupBy('tipo_venta')
            ->orderByDesc('total')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | CLIENTES
        |--------------------------------------------------------------------------
        */
        $clientesTop = Cliente::query()
            ->leftJoin('ventas', function ($join) {
                $join->on('clientes.id', '=', 'ventas.cliente_id')
                    ->where('ventas.estado', '=', 'completada');
            })
            ->select(
                'clientes.id',
                'clientes.nombre',
                'clientes.tipo_cliente',
                DB::raw('COUNT(ventas.id) as total_ventas'),
                DB::raw('COALESCE(SUM(ventas.total), 0) as ingresos_totales')
            )
            ->groupBy('clientes.id', 'clientes.nombre', 'clientes.tipo_cliente')
            ->orderByDesc('ingresos_totales')
            ->limit(5)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | EGRESOS
        |--------------------------------------------------------------------------
        */
        $ordenesRecibidas = OrdenCompra::query()
            ->where('estado', 'recibida');

        $comprasRecibidasTotal = (float) (clone $ordenesRecibidas)->sum('total');

        $comprasRecibidasCantidad = (int) (clone $ordenesRecibidas)->count();

        $comprasUltimos30Dias = (float) (clone $ordenesRecibidas)
            ->where('created_at', '>=', $inicio30Dias)
            ->sum('total');

        $comprasEmitidasPendientes = (float) OrdenCompra::query()
            ->whereIn('estado', ['emitida', 'parcial'])
            ->sum('total');

        $comprasPorCategoria = OrdenCompraDetalle::query()
            ->join(
                'ordenes_compra',
                'orden_compra_detalles.orden_compra_id',
                '=',
                'ordenes_compra.id'
            )
            ->where('ordenes_compra.estado', 'recibida')
            ->select(
                'orden_compra_detalles.categoria',
                DB::raw('COUNT(orden_compra_detalles.id) as partidas'),
                DB::raw('COALESCE(SUM(orden_compra_detalles.subtotal), 0) as total')
            )
            ->groupBy('orden_compra_detalles.categoria')
            ->orderByDesc('total')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | PÉRDIDAS
        |--------------------------------------------------------------------------
        */
        $perdidasTotales = (float) Muerte::query()
            ->selectRaw('COALESCE(SUM(costo_estimado_perdida), 0) as total')
            ->value('total');

        $perdidasUltimos30Dias = (float) Muerte::query()
            ->where('fecha', '>=', $inicio30Dias->toDateString())
            ->selectRaw('COALESCE(SUM(costo_estimado_perdida), 0) as total')
            ->value('total');

        $totalBajas = (int) Muerte::count();

        $perdidasPorTipo = Muerte::query()
            ->select(
                'tipo_baja',
                DB::raw('COUNT(*) as cantidad'),
                DB::raw('COALESCE(SUM(costo_estimado_perdida), 0) as total')
            )
            ->groupBy('tipo_baja')
            ->orderByDesc('total')
            ->get();

        $perdidasPorCausa = Muerte::query()
            ->select(
                'causa',
                DB::raw('COUNT(*) as cantidad'),
                DB::raw('COALESCE(SUM(costo_estimado_perdida), 0) as total')
            )
            ->groupBy('causa')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | BALANCE
        |--------------------------------------------------------------------------
        */
        $balanceOperativo = $ingresosTotales - $comprasRecibidasTotal;

        $balanceEstimado = $ingresosTotales
            - $comprasRecibidasTotal
            - $perdidasTotales;

        $margenEstimadoPorcentaje = $ingresosTotales > 0
            ? ($balanceEstimado / $ingresosTotales) * 100
            : 0;

        /*
        |--------------------------------------------------------------------------
        | TENDENCIA MENSUAL
        |--------------------------------------------------------------------------
        */
        $ventasMensuales = Venta::query()
            ->select(
                DB::raw("DATE_FORMAT(fecha, '%Y-%m') as periodo"),
                DB::raw('COALESCE(SUM(total), 0) as ingresos')
            )
            ->where('estado', 'completada')
            ->whereNotNull('fecha')
            ->groupBy('periodo')
            ->orderBy('periodo')
            ->get()
            ->keyBy('periodo');

        $comprasMensuales = OrdenCompra::query()
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as periodo"),
                DB::raw('COALESCE(SUM(total), 0) as egresos')
            )
            ->where('estado', 'recibida')
            ->groupBy('periodo')
            ->orderBy('periodo')
            ->get()
            ->keyBy('periodo');

        $perdidasMensuales = Muerte::query()
            ->select(
                DB::raw("DATE_FORMAT(fecha, '%Y-%m') as periodo"),
                DB::raw('COALESCE(SUM(costo_estimado_perdida), 0) as perdidas')
            )
            ->whereNotNull('fecha')
            ->groupBy('periodo')
            ->orderBy('periodo')
            ->get()
            ->keyBy('periodo');

        $periodos = collect()
            ->merge($ventasMensuales->keys())
            ->merge($comprasMensuales->keys())
            ->merge($perdidasMensuales->keys())
            ->unique()
            ->sort()
            ->values();

        $tendenciaMensual = $periodos->map(function ($periodo) use (
            $ventasMensuales,
            $comprasMensuales,
            $perdidasMensuales
        ) {
            $ingresos = (float) optional($ventasMensuales->get($periodo))->ingresos;
            $egresos = (float) optional($comprasMensuales->get($periodo))->egresos;
            $perdidas = (float) optional($perdidasMensuales->get($periodo))->perdidas;

            return [
                'periodo' => $periodo,
                'ingresos' => round($ingresos, 2),
                'egresos' => round($egresos, 2),
                'perdidas' => round($perdidas, 2),
                'balance_estimado' => round($ingresos - $egresos - $perdidas, 2),
            ];
        });

        /*
        |--------------------------------------------------------------------------
        | CONFIABILIDAD
        |--------------------------------------------------------------------------
        */
        $advertencias = [];

        if ($ventasTotales === 0) {
            $advertencias[] = 'No hay ventas completadas registradas. El cálculo de ingresos puede estar incompleto.';
        }

        if ($comprasRecibidasCantidad === 0) {
            $advertencias[] = 'No hay compras recibidas registradas. El cálculo de egresos puede estar incompleto.';
        }

        $advertencias[] = 'El balance no incluye nómina, servicios, renta, mantenimiento ni otros gastos operativos porque no existe estructura registrada para esos gastos.';

        $nivelConfiabilidad = ($ventasTotales > 0 && $comprasRecibidasCantidad > 0)
            ? 'parcial'
            : 'insuficiente';

        return response()->json([
            /*
            | Campos legacy para que Finanzas.jsx actual no truene todavía.
            */
            'gasto_hoy' => 0,
            'gasto_total_alimento' => 0,
            'valor_inventario' => 0,
            'costo_promedio_cerdo' => 0,
            'historial' => [],

            /*
            | Sprint 12 — estructura financiera real.
            */
            'ingresos' => [
                'ventas_totales' => $ventasTotales,
                'ingresos_totales' => round($ingresosTotales, 2),
                'ventas_ultimos_30_dias' => $ventasUltimos30Dias,
                'ingresos_ultimos_30_dias' => round($ingresosUltimos30Dias, 2),
                'animales_vendidos' => $animalesVendidos,
                'ventas_por_tipo' => $ventasPorTipo,
            ],

            'egresos' => [
                'compras_recibidas_cantidad' => $comprasRecibidasCantidad,
                'compras_recibidas_total' => round($comprasRecibidasTotal, 2),
                'compras_ultimos_30_dias' => round($comprasUltimos30Dias, 2),
                'compras_emitidas_pendientes' => round($comprasEmitidasPendientes, 2),
                'compras_por_categoria' => $comprasPorCategoria,
            ],

            'perdidas' => [
                'total_bajas' => $totalBajas,
                'perdidas_totales' => round($perdidasTotales, 2),
                'perdidas_ultimos_30_dias' => round($perdidasUltimos30Dias, 2),
                'perdidas_por_tipo' => $perdidasPorTipo,
                'perdidas_por_causa' => $perdidasPorCausa,
            ],

            'balance' => [
                'balance_operativo' => round($balanceOperativo, 2),
                'balance_estimado' => round($balanceEstimado, 2),
                'margen_estimado_porcentaje' => round($margenEstimadoPorcentaje, 2),
                'formula_operativa' => 'ingresos - compras recibidas',
                'formula_estimada' => 'ingresos - compras recibidas - pérdidas estimadas',
            ],

            'clientes' => [
                'top_clientes' => $clientesTop,
            ],

            'tendencia_mensual' => $tendenciaMensual,

            'confiabilidad' => [
                'nivel' => $nivelConfiabilidad,
                'advertencias' => $advertencias,
            ],
        ]);
    }
}