<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte Inventario</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
        }

        h1 {
            text-align: center;
            color: #1565C0;
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
            background: #1565C0;
            color: white;
            padding: 8px;
            border: 1px solid #ccc;
        }

        td {
            padding: 8px;
            border: 1px solid #ccc;
        }
    </style>
</head>

<body>

    <h1>PORCYS - Reporte de Inventario</h1>

    <div class="fecha">
        Generado: {{ $fecha->format('d/m/Y H:i') }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Producto</th>
                <th>Stock</th>
                <th>Unidad</th>
                <th>Última actualización</th>
            </tr>
        </thead>

        <tbody>
            @foreach($inventarios as $item)
                <tr>
                    <td>{{ $item->nombre_producto }}</td>
                    <td>{{ $item->stock_kg }} kg</td>
                    <td>kg</td>
                    <td>{{ $item->updated_at }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

</body>
</html>