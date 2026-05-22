<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte financiero PORCYS</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #111827;
            font-size: 12px;
        }

        h1 {
            text-align: center;
            color: #111827;
            margin-bottom: 4px;
        }

        h2 {
            color: #111827;
            border-bottom: 2px solid #111827;
            padding-bottom: 4px;
            margin-top: 24px;
            margin-bottom: 10px;
            font-size: 16px;
        }

        .subtitle {
            text-align: center;
            color: #4b5563;
            margin-bottom: 20px;
        }

        .fecha {
            text-align: right;
            color: #4b5563;
            margin-bottom: 15px;
        }

        .kpi-grid {
            width: 100%;
            margin-bottom: 18px;
        }

        .kpi {
            width: 24%;
            display: inline-block;
            vertical-align: top;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 10px;
            margin-right: 4px;
            min-height: 70px;
        }

        .kpi-title {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 6px;
        }

        .kpi-value {
            font-size: 17px;
            font-weight: bold;
            color: #111827;
        }

        .negative {
            color: #b91c1c;
        }

        .positive {
            color: #15803d;
        }

        .warning-box {
            border: 1px solid #f59e0b;
            background: #fffbeb;
            color: #78350f;
            padding: 10px;
            margin-bottom: 18px;
            border-radius: 8px;
        }

        .formula {
            color: #4b5563;
            font-size: 11px;
            margin-top: 4px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 16px;
        }

        th, td {
            border: 1px solid #d1d5db;
            padding: 7px;
            font-size: 11px;
        }

        th {
            background: #111827;
            color: white;
            text-align: left;
        }

        td.number {
            text-align: right;
        }

        .empty {
            color: #6b7280;
            font-style: italic;
            border: 1px dashed #d1d5db;
            padding: 10px;
            margin-bottom: 12px;
        }

        .note {
            background: #eff6ff;
            border: 1px solid #93c5fd;
            color: #1e3a8a;
            padding: 10px;
            margin-top: 20px;
            border-radius: 8px;
            line-height: 1.5;
        }
    </style>
</head>

<body>

@php
    function moneyPdf($value) {
        return '$' . number_format((float) ($value ?? 0), 2) . ' MXN';
    }

    function numberPdf($value) {
        return number_format((float) ($value ?? 0));
    }

    function percentPdf($value) {
        return number_format((float) ($value ?? 0), 2) . '%';
    }

    $balanceEstimado = $resumen['balance']['balance_estimado'] ?? 0;
    $balanceOperativo = $resumen['balance']['balance_operativo'] ?? 0;
@endphp

<h1>PORCYS - Reporte Financiero</h1>

<p class="subtitle">
    Rentabilidad estimada con ventas completadas, compras recibidas y pérdidas por mortalidad o descartes.
</p>

<p class="fecha">
    Generado: {{ $fechaGeneracion->format('d/m/Y H:i') }}
</p>

<div class="warning-box">
    <strong>Confiabilidad del cálculo:</strong>
    {{ strtoupper($resumen['confiabilidad']['nivel'] ?? 'sin clasificar') }}

    @if(!empty($resumen['confiabilidad']['advertencias']))
        <ul>
            @foreach($resumen['confiabilidad']['advertencias'] as $advertencia)
                <li>{{ $advertencia }}</li>
            @endforeach
        </ul>
    @endif
</div>

<div class="kpi-grid">
    <div class="kpi">
        <div class="kpi-title">Ingresos totales</div>
        <div class="kpi-value">
            {{ moneyPdf($resumen['ingresos']['ingresos_totales'] ?? 0) }}
        </div>
        <div class="formula">
            {{ numberPdf($resumen['ingresos']['ventas_totales'] ?? 0) }} ventas completadas
        </div>
    </div>

    <div class="kpi">
        <div class="kpi-title">Compras recibidas</div>
        <div class="kpi-value">
            {{ moneyPdf($resumen['egresos']['compras_recibidas_total'] ?? 0) }}
        </div>
        <div class="formula">
            {{ numberPdf($resumen['egresos']['compras_recibidas_cantidad'] ?? 0) }} órdenes recibidas
        </div>
    </div>

    <div class="kpi">
        <div class="kpi-title">Pérdidas estimadas</div>
        <div class="kpi-value">
            {{ moneyPdf($resumen['perdidas']['perdidas_totales'] ?? 0) }}
        </div>
        <div class="formula">
            {{ numberPdf($resumen['perdidas']['total_bajas'] ?? 0) }} bajas registradas
        </div>
    </div>

    <div class="kpi">
        <div class="kpi-title">Balance estimado</div>
        <div class="kpi-value {{ $balanceEstimado < 0 ? 'negative' : 'positive' }}">
            {{ moneyPdf($balanceEstimado) }}
        </div>
        <div class="formula">
            Margen: {{ percentPdf($resumen['balance']['margen_estimado_porcentaje'] ?? 0) }}
        </div>
    </div>
</div>

<h2>Resumen de rentabilidad</h2>

<table>
    <thead>
        <tr>
            <th>Indicador</th>
            <th>Fórmula</th>
            <th>Resultado</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Balance operativo</td>
            <td>{{ $resumen['balance']['formula_operativa'] ?? 'ingresos - compras recibidas' }}</td>
            <td class="number {{ $balanceOperativo < 0 ? 'negative' : 'positive' }}">
                {{ moneyPdf($balanceOperativo) }}
            </td>
        </tr>

        <tr>
            <td>Balance estimado</td>
            <td>{{ $resumen['balance']['formula_estimada'] ?? 'ingresos - compras recibidas - pérdidas estimadas' }}</td>
            <td class="number {{ $balanceEstimado < 0 ? 'negative' : 'positive' }}">
                {{ moneyPdf($balanceEstimado) }}
            </td>
        </tr>

        <tr>
            <td>Ingresos últimos 30 días</td>
            <td>Ventas completadas recientes</td>
            <td class="number">
                {{ moneyPdf($resumen['ingresos']['ingresos_ultimos_30_dias'] ?? 0) }}
            </td>
        </tr>

        <tr>
            <td>Compras últimos 30 días</td>
            <td>Compras recibidas recientes</td>
            <td class="number">
                {{ moneyPdf($resumen['egresos']['compras_ultimos_30_dias'] ?? 0) }}
            </td>
        </tr>
    </tbody>
</table>

<h2>Ingresos por tipo de venta</h2>

@if(empty($resumen['ingresos']['ventas_por_tipo']))
    <div class="empty">No hay ventas completadas por tipo.</div>
@else
    <table>
        <thead>
            <tr>
                <th>Tipo de venta</th>
                <th>Cantidad</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($resumen['ingresos']['ventas_por_tipo'] as $item)
                <tr>
                    <td>{{ $item['tipo_venta'] ?? 'sin tipo' }}</td>
                    <td class="number">{{ numberPdf($item['cantidad'] ?? 0) }}</td>
                    <td class="number">{{ moneyPdf($item['total'] ?? 0) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endif

<h2>Compras por categoría</h2>

@if(empty($resumen['egresos']['compras_por_categoria']))
    <div class="empty">No hay compras recibidas por categoría.</div>
@else
    <table>
        <thead>
            <tr>
                <th>Categoría</th>
                <th>Partidas</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($resumen['egresos']['compras_por_categoria'] as $item)
                <tr>
                    <td>{{ $item['categoria'] ?? 'sin categoría' }}</td>
                    <td class="number">{{ numberPdf($item['partidas'] ?? 0) }}</td>
                    <td class="number">{{ moneyPdf($item['total'] ?? 0) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endif

<h2>Pérdidas por tipo de baja</h2>

@if(empty($resumen['perdidas']['perdidas_por_tipo']))
    <div class="empty">No hay bajas registradas.</div>
@else
    <table>
        <thead>
            <tr>
                <th>Tipo de baja</th>
                <th>Cantidad</th>
                <th>Pérdida estimada</th>
            </tr>
        </thead>
        <tbody>
            @foreach($resumen['perdidas']['perdidas_por_tipo'] as $item)
                <tr>
                    <td>{{ $item['tipo_baja'] ?? 'sin tipo' }}</td>
                    <td class="number">{{ numberPdf($item['cantidad'] ?? 0) }}</td>
                    <td class="number">{{ moneyPdf($item['total'] ?? 0) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endif

<h2>Clientes con mayores ingresos</h2>

@if(empty($resumen['clientes']['top_clientes']))
    <div class="empty">No hay clientes con ventas completadas.</div>
@else
    <table>
        <thead>
            <tr>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Ventas</th>
                <th>Ingresos</th>
            </tr>
        </thead>
        <tbody>
            @foreach($resumen['clientes']['top_clientes'] as $cliente)
                <tr>
                    <td>{{ $cliente['nombre'] ?? 'sin nombre' }}</td>
                    <td>{{ $cliente['tipo_cliente'] ?? 'sin tipo' }}</td>
                    <td class="number">{{ numberPdf($cliente['total_ventas'] ?? 0) }}</td>
                    <td class="number">{{ moneyPdf($cliente['ingresos_totales'] ?? 0) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endif

<h2>Tendencia mensual</h2>

@if(empty($resumen['tendencia_mensual']))
    <div class="empty">No hay datos suficientes para mostrar tendencia mensual.</div>
@else
    <table>
        <thead>
            <tr>
                <th>Periodo</th>
                <th>Ingresos</th>
                <th>Egresos</th>
                <th>Pérdidas</th>
                <th>Balance estimado</th>
            </tr>
        </thead>
        <tbody>
            @foreach($resumen['tendencia_mensual'] as $item)
                <tr>
                    <td>{{ $item['periodo'] ?? '-' }}</td>
                    <td class="number">{{ moneyPdf($item['ingresos'] ?? 0) }}</td>
                    <td class="number">{{ moneyPdf($item['egresos'] ?? 0) }}</td>
                    <td class="number">{{ moneyPdf($item['perdidas'] ?? 0) }}</td>
                    <td class="number {{ ($item['balance_estimado'] ?? 0) < 0 ? 'negative' : 'positive' }}">
                        {{ moneyPdf($item['balance_estimado'] ?? 0) }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endif

<div class="note">
    <strong>Lectura gerencial:</strong>
    este reporte no inventa utilidad neta. Calcula una rentabilidad estimada usando ventas completadas,
    compras recibidas y pérdidas por bajas. Para utilidad neta real faltaría registrar gastos operativos
    como nómina, servicios, mantenimiento, renta, combustible u otros costos generales.
</div>

</body>
</html>