<?php

namespace App\Exports;

use App\Http\Controllers\FinanzasController;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithTitle;

class FinanzasExport implements WithMultipleSheets
{
    protected array $resumen;

    public function __construct()
    {
        $response = app(FinanzasController::class)->resumen();

        $this->resumen = $response->getData(true);
    }

    public function sheets(): array
    {
        return [
            new FinanzasResumenSheet($this->resumen),
            new FinanzasIngresosSheet($this->resumen),
            new FinanzasEgresosSheet($this->resumen),
            new FinanzasPerdidasSheet($this->resumen),
            new FinanzasClientesSheet($this->resumen),
            new FinanzasTendenciaSheet($this->resumen),
        ];
    }
}

class FinanzasResumenSheet implements FromArray, WithTitle, ShouldAutoSize
{
    protected array $resumen;

    public function __construct(array $resumen)
    {
        $this->resumen = $resumen;
    }

    public function title(): string
    {
        return 'Resumen';
    }

    public function array(): array
    {
        $balance = $this->resumen['balance'] ?? [];
        $ingresos = $this->resumen['ingresos'] ?? [];
        $egresos = $this->resumen['egresos'] ?? [];
        $perdidas = $this->resumen['perdidas'] ?? [];
        $confiabilidad = $this->resumen['confiabilidad'] ?? [];

        $rows = [
            ['PORCYS - Reporte Financiero'],
            ['Generado', now()->format('d/m/Y H:i')],
            [],
            ['Confiabilidad del cálculo', strtoupper($confiabilidad['nivel'] ?? 'sin clasificar')],
        ];

        foreach (($confiabilidad['advertencias'] ?? []) as $advertencia) {
            $rows[] = ['Advertencia', $advertencia];
        }

        $rows[] = [];
        $rows[] = ['Indicador', 'Valor', 'Detalle'];

        $rows[] = [
            'Ingresos totales',
            '$' . number_format((float) ($ingresos['ingresos_totales'] ?? 0), 2) . ' MXN',
            ($ingresos['ventas_totales'] ?? 0) . ' ventas completadas',
        ];

        $rows[] = [
            'Compras recibidas',
            '$' . number_format((float) ($egresos['compras_recibidas_total'] ?? 0), 2) . ' MXN',
            ($egresos['compras_recibidas_cantidad'] ?? 0) . ' órdenes recibidas',
        ];

        $rows[] = [
            'Pérdidas estimadas',
            '$' . number_format((float) ($perdidas['perdidas_totales'] ?? 0), 2) . ' MXN',
            ($perdidas['total_bajas'] ?? 0) . ' bajas registradas',
        ];

        $rows[] = [
            'Balance operativo',
            '$' . number_format((float) ($balance['balance_operativo'] ?? 0), 2) . ' MXN',
            $balance['formula_operativa'] ?? 'ingresos - compras recibidas',
        ];

        $rows[] = [
            'Balance estimado',
            '$' . number_format((float) ($balance['balance_estimado'] ?? 0), 2) . ' MXN',
            $balance['formula_estimada'] ?? 'ingresos - compras recibidas - pérdidas estimadas',
        ];

        $rows[] = [
            'Margen estimado',
            number_format((float) ($balance['margen_estimado_porcentaje'] ?? 0), 2) . '%',
            'Balance estimado / ingresos totales',
        ];

        $rows[] = [];
        $rows[] = [
            'Nota gerencial',
            'Este reporte calcula rentabilidad estimada con ventas completadas, compras recibidas y pérdidas por bajas. No incluye nómina, servicios, renta, mantenimiento ni otros gastos operativos porque no existe estructura registrada para esos gastos.',
        ];

        return $rows;
    }
}

class FinanzasIngresosSheet implements FromArray, WithTitle, ShouldAutoSize
{
    protected array $resumen;

    public function __construct(array $resumen)
    {
        $this->resumen = $resumen;
    }

    public function title(): string
    {
        return 'Ingresos';
    }

    public function array(): array
    {
        $ingresos = $this->resumen['ingresos'] ?? [];

        $rows = [
            ['INGRESOS'],
            [],
            ['Métrica', 'Valor'],
            ['Ventas completadas', $ingresos['ventas_totales'] ?? 0],
            ['Ingresos totales', $ingresos['ingresos_totales'] ?? 0],
            ['Ventas últimos 30 días', $ingresos['ventas_ultimos_30_dias'] ?? 0],
            ['Ingresos últimos 30 días', $ingresos['ingresos_ultimos_30_dias'] ?? 0],
            ['Animales vendidos', $ingresos['animales_vendidos'] ?? 0],
            [],
            ['VENTAS POR TIPO'],
            ['Tipo de venta', 'Cantidad', 'Total'],
        ];

        foreach (($ingresos['ventas_por_tipo'] ?? []) as $item) {
            $rows[] = [
                $item['tipo_venta'] ?? 'sin tipo',
                $item['cantidad'] ?? 0,
                $item['total'] ?? 0,
            ];
        }

        return $rows;
    }
}

class FinanzasEgresosSheet implements FromArray, WithTitle, ShouldAutoSize
{
    protected array $resumen;

    public function __construct(array $resumen)
    {
        $this->resumen = $resumen;
    }

    public function title(): string
    {
        return 'Egresos';
    }

    public function array(): array
    {
        $egresos = $this->resumen['egresos'] ?? [];

        $rows = [
            ['EGRESOS'],
            [],
            ['Métrica', 'Valor'],
            ['Compras recibidas cantidad', $egresos['compras_recibidas_cantidad'] ?? 0],
            ['Compras recibidas total', $egresos['compras_recibidas_total'] ?? 0],
            ['Compras últimos 30 días', $egresos['compras_ultimos_30_dias'] ?? 0],
            ['Compras emitidas pendientes', $egresos['compras_emitidas_pendientes'] ?? 0],
            [],
            ['COMPRAS POR CATEGORÍA'],
            ['Categoría', 'Partidas', 'Total'],
        ];

        foreach (($egresos['compras_por_categoria'] ?? []) as $item) {
            $rows[] = [
                $item['categoria'] ?? 'sin categoría',
                $item['partidas'] ?? 0,
                $item['total'] ?? 0,
            ];
        }

        return $rows;
    }
}

class FinanzasPerdidasSheet implements FromArray, WithTitle, ShouldAutoSize
{
    protected array $resumen;

    public function __construct(array $resumen)
    {
        $this->resumen = $resumen;
    }

    public function title(): string
    {
        return 'Perdidas';
    }

    public function array(): array
    {
        $perdidas = $this->resumen['perdidas'] ?? [];

        $rows = [
            ['PÉRDIDAS'],
            [],
            ['Métrica', 'Valor'],
            ['Total bajas', $perdidas['total_bajas'] ?? 0],
            ['Pérdidas totales', $perdidas['perdidas_totales'] ?? 0],
            ['Pérdidas últimos 30 días', $perdidas['perdidas_ultimos_30_dias'] ?? 0],
            [],
            ['PÉRDIDAS POR TIPO'],
            ['Tipo de baja', 'Cantidad', 'Total'],
        ];

        foreach (($perdidas['perdidas_por_tipo'] ?? []) as $item) {
            $rows[] = [
                $item['tipo_baja'] ?? 'sin tipo',
                $item['cantidad'] ?? 0,
                $item['total'] ?? 0,
            ];
        }

        $rows[] = [];
        $rows[] = ['PÉRDIDAS POR CAUSA'];
        $rows[] = ['Causa', 'Cantidad', 'Total'];

        foreach (($perdidas['perdidas_por_causa'] ?? []) as $item) {
            $rows[] = [
                $item['causa'] ?? 'sin causa',
                $item['cantidad'] ?? 0,
                $item['total'] ?? 0,
            ];
        }

        return $rows;
    }
}

class FinanzasClientesSheet implements FromArray, WithTitle, ShouldAutoSize
{
    protected array $resumen;

    public function __construct(array $resumen)
    {
        $this->resumen = $resumen;
    }

    public function title(): string
    {
        return 'Clientes';
    }

    public function array(): array
    {
        $clientes = $this->resumen['clientes']['top_clientes'] ?? [];

        $rows = [
            ['CLIENTES CON MAYORES INGRESOS'],
            [],
            ['ID', 'Cliente', 'Tipo', 'Total ventas', 'Ingresos totales'],
        ];

        foreach ($clientes as $cliente) {
            $rows[] = [
                $cliente['id'] ?? '',
                $cliente['nombre'] ?? 'sin nombre',
                $cliente['tipo_cliente'] ?? 'sin tipo',
                $cliente['total_ventas'] ?? 0,
                $cliente['ingresos_totales'] ?? 0,
            ];
        }

        return $rows;
    }
}

class FinanzasTendenciaSheet implements FromArray, WithTitle, ShouldAutoSize
{
    protected array $resumen;

    public function __construct(array $resumen)
    {
        $this->resumen = $resumen;
    }

    public function title(): string
    {
        return 'Tendencia';
    }

    public function array(): array
    {
        $tendencia = $this->resumen['tendencia_mensual'] ?? [];

        $rows = [
            ['TENDENCIA MENSUAL'],
            [],
            ['Periodo', 'Ingresos', 'Egresos', 'Pérdidas', 'Balance estimado'],
        ];

        foreach ($tendencia as $item) {
            $rows[] = [
                $item['periodo'] ?? '',
                $item['ingresos'] ?? 0,
                $item['egresos'] ?? 0,
                $item['perdidas'] ?? 0,
                $item['balance_estimado'] ?? 0,
            ];
        }

        return $rows;
    }
}