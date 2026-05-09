<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Ventas</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
        }

        h1 {
            text-align: center;
            color: #2E7D32;
        }

        .fecha {
            text-align: right;
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: #2E7D32;
            color: white;
            padding: 8px;
            border: 1px solid #ccc;
        }

        td {
            padding: 8px;
            border: 1px solid #ccc;
        }

        .total {
            margin-top: 20px;
            text-align: right;
            font-size: 16px;
            font-weight: bold;
        }
    </style>
</head>

<body>

    <h1>PORCYS - Reporte de Ventas</h1>

    <div class="fecha">
        Generado: {{ $fecha->format('d/m/Y H:i') }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Animal</th>
                <th>Cliente</th>
                <th>Peso</th>
                <th>Precio Unitario</th>
                <th>Total</th>
            </tr>
        </thead>

        <tbody>
            @php
                $granTotal = 0;
            @endphp

            @foreach($ventas as $venta)
                @php
                    $granTotal += $venta->total;
                @endphp

                <tr>
                    <td>{{ $venta->fecha }}</td>
                    <td>{{ $venta->animal->identificador_unico ?? 'N/A' }}</td>
                    <td>{{ $venta->cliente->nombre ?? 'N/A' }}</td>
                    <td>{{ $venta->peso }} kg</td>
                    <td>${{ number_format($venta->precio_unitario, 2) }}</td>
                    <td>${{ number_format($venta->total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total">
        Total general: MXN ${{ number_format($granTotal, 2) }}
    </div>

</body>
</html>