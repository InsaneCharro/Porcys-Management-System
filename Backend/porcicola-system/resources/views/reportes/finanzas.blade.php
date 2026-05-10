<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte financiero PORCYS</title>
    <style>
        body {
            font-family: sans-serif;
        }

        h1 {
            text-align: center;
            color: #4f46e5;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 12px;
            text-align: center;
        }

        th {
            background: #4f46e5;
            color: white;
        }
    </style>
</head>
<body>

<h1>PORCYS - Reporte Financiero</h1>

<table>
    <thead>
        <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Costo unitario</th>
            <th>Total</th>
            <th>Fecha</th>
        </tr>
    </thead>
    <tbody>
        @foreach($historial as $item)
        <tr>
            <td>{{ $item->nombre_producto }}</td>
            <td>{{ $item->cantidad }}</td>
            <td>${{ number_format($item->costo_unitario, 2) }}</td>
            <td>${{ number_format($item->total, 2) }}</td>
            <td>{{ $item->created_at }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

</body>
</html>