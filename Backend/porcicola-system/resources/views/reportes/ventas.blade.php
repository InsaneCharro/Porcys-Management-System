<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>PORCYS - Reporte de Ventas</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #1f2937;
        }

        h1 {
            text-align: center;
            color: #14532d;
            margin-bottom: 4px;
        }

        .subtitulo {
            text-align: center;
            color: #4b5563;
            margin-bottom: 18px;
        }

        .fecha {
            text-align: right;
            margin-bottom: 16px;
            font-size: 10px;
            color: #374151;
        }

        .resumen {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
        }

        .resumen th {
            background: #166534;
            color: white;
            padding: 8px;
            border: 1px solid #d1d5db;
            text-align: center;
        }

        .resumen td {
            padding: 8px;
            border: 1px solid #d1d5db;
            text-align: center;
            font-weight: bold;
        }

        .venta-card {
            border: 1px solid #d1d5db;
            margin-bottom: 16px;
            page-break-inside: avoid;
        }

        .venta-header {
            background: #dcfce7;
            padding: 8px;
            border-bottom: 1px solid #d1d5db;
        }

        .venta-header table {
            width: 100%;
            border-collapse: collapse;
        }

        .venta-header td {
            padding: 3px;
            vertical-align: top;
        }

        .label {
            font-weight: bold;
            color: #14532d;
        }

        .detalle {
            width: 100%;
            border-collapse: collapse;
        }

        .detalle th {
            background: #166534;
            color: white;
            padding: 6px;
            border: 1px solid #d1d5db;
            font-size: 10px;
        }

        .detalle td {
            padding: 6px;
            border: 1px solid #d1d5db;
            font-size: 10px;
        }

        .right {
            text-align: right;
        }

        .center {
            text-align: center;
        }

        .estado {
            font-weight: bold;
            text-transform: uppercase;
        }

        .nota {
            margin-top: 18px;
            padding: 10px;
            border: 1px solid #d1d5db;
            background: #f9fafb;
            font-size: 10px;
            color: #374151;
        }

        .sin-datos {
            text-align: center;
            padding: 20px;
            border: 1px solid #d1d5db;
            background: #f9fafb;
            color: #6b7280;
        }
    </style>
</head>

<body>

    <h1>PORCYS - Reporte de Ventas</h1>

    <div class="subtitulo">
        Comercialización / Ventas por lote y pie de cría
    </div>

    <div class="fecha">
        Generado: {{ $fecha->format('d/m/Y H:i') }}
    </div>

    <table class="resumen">
        <thead>
            <tr>
                <th>Total de ventas</th>
                <th>Animales vendidos</th>
                <th>Ingresos completados</th>
                <th>Total general registrado</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $ventas->count() }}</td>
                <td>{{ $animalesVendidos }}</td>
                <td>${{ number_format((float) $totalCompletadas, 2) }} MXN</td>
                <td>${{ number_format((float) $totalGeneral, 2) }} MXN</td>
            </tr>
        </tbody>
    </table>

    @if($ventas->count() === 0)
        <div class="sin-datos">
            No hay ventas registradas.
        </div>
    @endif

    @foreach($ventas as $venta)
        <div class="venta-card">
            <div class="venta-header">
                <table>
                    <tr>
                        <td>
                            <span class="label">Folio:</span>
                            {{ $venta->folio ?? ('VENTA-' . $venta->id) }}
                        </td>
                        <td>
                            <span class="label">Fecha:</span>
                            {{ $venta->fecha ? \Carbon\Carbon::parse($venta->fecha)->format('d/m/Y H:i') : 'N/A' }}
                        </td>
                        <td>
                            <span class="label">Estado:</span>
                            <span class="estado">{{ $venta->estado ?? 'N/A' }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="label">Cliente:</span>
                            {{ $venta->cliente->nombre ?? 'N/A' }}
                        </td>
                        <td>
                            <span class="label">Tipo de venta:</span>
                            @if(($venta->tipo_venta ?? '') === 'pie_cria')
                                PIE DE CRÍA
                            @elseif(($venta->tipo_venta ?? '') === 'abasto')
                                ABASTO
                            @else
                                {{ strtoupper(str_replace('_', ' ', $venta->tipo_venta ?? 'N/A')) }}
                            @endif
                        </td>
                        <td>
                            <span class="label">Total:</span>
                            ${{ number_format((float) ($venta->total ?? 0), 2) }} MXN
                        </td>
                    </tr>
                    @if($venta->observaciones)
                        <tr>
                            <td colspan="3">
                                <span class="label">Observaciones:</span>
                                {{ $venta->observaciones }}
                            </td>
                        </tr>
                    @endif
                </table>
            </div>

            <table class="detalle">
                <thead>
                    <tr>
                        <th>Animal</th>
                        <th>Sexo</th>
                        <th>Etapa</th>
                        <th>Clasificación</th>
                        <th>Peso</th>
                        <th>Precio kg</th>
                        <th>Precio fijo</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>

                <tbody>
                    @forelse($venta->detalleAnimales as $detalle)
                        <tr>
                            <td>
                                {{ $detalle->animal->identificador_unico ?? 'Animal no disponible' }}
                            </td>
                            <td class="center">
                                {{ $detalle->animal->sexo ?? 'N/A' }}
                            </td>
                            <td class="center">
                                {{ $detalle->animal->etapa_actual ?? 'N/A' }}
                            </td>
                            <td class="center">
                                {{ $detalle->animal->clasificacion ?? 'N/A' }}
                            </td>
                            <td class="right">
                                @if($detalle->peso_individual !== null)
                                    {{ number_format((float) $detalle->peso_individual, 2) }} kg
                                @else
                                    N/A
                                @endif
                            </td>
                            <td class="right">
                                @if($detalle->precio_kg !== null)
                                    ${{ number_format((float) $detalle->precio_kg, 2) }}
                                @else
                                    -
                                @endif
                            </td>
                            <td class="right">
                                @if($detalle->precio_fijo !== null)
                                    ${{ number_format((float) $detalle->precio_fijo, 2) }}
                                @else
                                    -
                                @endif
                            </td>
                            <td class="right">
                                ${{ number_format((float) ($detalle->subtotal_individual ?? 0), 2) }}
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" class="center">
                                Esta venta no tiene animales asociados en venta_animales.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    @endforeach

    <div class="nota">
        <strong>Nota gerencial:</strong>
        este reporte usa la estructura real de comercialización:
        ventas, clientes y venta_animales. El ingreso financiero confiable debe tomar como base las ventas con estado
        <strong>completada</strong>.
    </div>

</body>
</html>